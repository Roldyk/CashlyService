import express, { Response, Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

const prisma = new PrismaClient();
const dashBoardDataRouter: Router = express.Router();

// dashboard
dashBoardDataRouter.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    // Obtener fechas del mes actual y anterior
    const now = new Date();
    const startCurrent = startOfMonth(now);
    const endCurrent = endOfMonth(now);

    const startPrevious = startOfMonth(subMonths(now, 1));
    const endPrevious = endOfMonth(subMonths(now, 1));

    const userId = req.userId;

    try {
      // Ingresos
      const ingresosActual = await prisma.ingresos.aggregate({
        where: {
          usuario_id: userId,
          ingreso_fecha: { gte: startCurrent, lte: endCurrent },
        },
        _sum: { ingreso_monto: true },
      });

      const ingresosAnterior = await prisma.ingresos.aggregate({
        where: {
          usuario_id: userId,
          ingreso_fecha: { gte: startPrevious, lte: endPrevious },
        },
        _sum: { ingreso_monto: true },
      });

      const incomeCurrent = Number(ingresosActual._sum.ingreso_monto || 0);
      const incomePrevious = Number(ingresosAnterior._sum.ingreso_monto || 0);
      const percentageIncome =
        incomePrevious === 0
          ? 0
          : (incomeCurrent - incomePrevious) / incomePrevious;

      // gastos
      const gastosActual = await prisma.gastos.aggregate({
        where: {
          usuario_id: userId,
          gasto_fecha: { gte: startCurrent, lte: endCurrent },
        },
        _sum: { gasto_monto: true },
      });

      const gastosAnterior = await prisma.gastos.aggregate({
        where: {
          usuario_id: userId,
          gasto_fecha: { gte: startPrevious, lte: endPrevious },
        },
        _sum: { gasto_monto: true },
      });

      const costCurrent = Number(gastosActual._sum.gasto_monto || 0);
      const costPrevious = Number(gastosAnterior._sum.gasto_monto || 0);
      const percentageCosts =
        costPrevious === 0 ? 0 : (costCurrent - costPrevious) / costPrevious;

      // metas
      const metas = await prisma.metas.findMany({
        where: {
          usuario_id: userId,
          meta_es_activo: true,
        },
      });

      const goalAmount = metas.reduce(
        (total, m) => total + Number(m.meta_monto_inicial),
        0
      );
      const amountInGoal = metas.reduce(
        (total, m) => total + Number(m.meta_monto_ult || 0),
        0
      );

      // presupuestos
      const presupuestos = await prisma.presupuestos.findMany({
        where: {
          usuario_id: userId,
          es_activo: true,
          fecha_creacion: { gte: startCurrent, lte: endCurrent },
        },
      });

      const budgetAmount = presupuestos.reduce(
        (total, p) => total + Number(p.pres_monto_inicial),
        0
      );
      const budgetUsed = presupuestos.reduce(
        (total, p) => total + Number(p.pres_monto_ult),
        0
      );
      const budgetUnused = budgetAmount - budgetUsed;

      return res.json({
        incomeMonthlyAmount: incomeCurrent,
        percentageIncome,
        costsMonthlyAmount: costCurrent,
        percentageCosts,
        budgetUnused,
        budgetAmount,
        amountInGoal,
        goalAmount,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// chart
dashBoardDataRouter.get(
  "/chart",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (typeof userId !== "number" || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
      const ingresos = await prisma.ingresos.groupBy({
        by: ["ingreso_fecha"],
        where: {
          usuario_id: userId,
          ingreso_fecha: {
            not: null,
          },
        },
        _sum: {
          ingreso_monto: true,
        },
        orderBy: {
          ingreso_fecha: "asc",
        },
      });

      const chartData = ingresos.map((entry) => ({
        day: entry.ingreso_fecha?.toISOString(),
        amount: Number(entry._sum.ingreso_monto ?? 0),
      }));

      return res.json(chartData);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// incomelist
dashBoardDataRouter.get(
  "/income",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (typeof userId !== "number" || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
      const ingresos = await prisma.ingresos.findMany({
        where: {
          usuario_id: userId,
          ingreso_fecha: {
            not: null,
          },
        },
        select: {
          ingreso_frecuencia: true,
          ingreso_fecha: true,
          ingreso_monto: true,
        },
        orderBy: {
          ingreso_fecha: "desc",
        },
      });

      const response = ingresos.map((ingreso) => ({
        frequency: ingreso.ingreso_frecuencia == true ? "Recurrente" : "Único",
        date: ingreso.ingreso_fecha?.toISOString(),
        amount: Number(ingreso.ingreso_monto),
      }));

      return res.status(200).json(response);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default dashBoardDataRouter;
