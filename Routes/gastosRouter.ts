import express, { Response, Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();
const gastosRouter: Router = express.Router();

gastosRouter.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { month, year, pres_id } = req.query;

    const monthNumber = Number(month);
    const yearNumber = Number(year);
    const presIdNumber = Number(pres_id);

    if (!isNaN(monthNumber) && isNaN(yearNumber)) {
      return res
        .status(400)
        .json({ message: "Campo faltante como query param: year" });
    }

    const whereClause: any = {
      usuario_id: req.userId,
    };

    if (
      !isNaN(monthNumber) &&
      monthNumber >= 1 &&
      monthNumber <= 12 &&
      !isNaN(yearNumber)
    ) {
      const startDate = new Date(yearNumber, monthNumber - 1, 1);
      const endDate = new Date(yearNumber, monthNumber, 0, 23, 59, 59, 999); // último día del mes

      whereClause.gasto_fecha = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (!isNaN(presIdNumber)) {
      whereClause.pres_id = presIdNumber;
    }

    try {
      const gastos = await prisma.gastos.findMany({
        where: whereClause,
      });
      return res.status(200).json(gastos);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

gastosRouter.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        pres_id,
        categoria_id,
        periodo_id,
        gasto_nombre,
        gasto_monto,
        gasto_fecha,
        gasto_frecuencia,
        inicio_recurrencia,
        fin_recurrencia,
      } = req.body;

      if (!gasto_nombre || gasto_nombre === "")
        return res
          .status(400)
          .json({ message: "Campo faltante: gasto_nombre" });

      if (typeof gasto_monto !== "number" || isNaN(gasto_monto))
        return res.status(400).json({ message: "Campo faltante: gasto_monto" });

      if (pres_id) {
        const presupuesto = await prisma.presupuestos.findFirst({
          where: { usuario_id: req.userId, pres_id },
        });
        if (!presupuesto) {
          return res
            .status(404)
            .json({ message: `Presupuesto con pres_id=${pres_id} no existe` });
        }

        const editarPresupuesto = await prisma.presupuestos.update({
          data: {
            pres_monto_ult:
              Number(presupuesto.pres_monto_ult) + Number(gasto_monto),
          },
          where: { pres_id, usuario_id: req.userId },
        });
      }

      const nuevoGasto = await prisma.gastos.create({
        data: {
          usuario_id: req.userId!,
          pres_id,
          categoria_id,
          periodo_id,
          gasto_nombre,
          gasto_monto,
          gasto_fecha: gasto_fecha ? new Date(gasto_fecha) : null,
          gasto_frecuencia,
          inicio_recurrencia: inicio_recurrencia
            ? new Date(inicio_recurrencia)
            : null,
          fin_recurrencia: fin_recurrencia ? new Date(fin_recurrencia) : null,
        },
      });

      return res.status(201).json(nuevoGasto);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

gastosRouter.put(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        gasto_id,
        pres_id,
        categoria_id,
        periodo_id,
        gasto_nombre,
        gasto_monto,
        gasto_fecha,
        gasto_frecuencia,
        inicio_recurrencia,
        fin_recurrencia,
      } = req.body;

      if (!gasto_id)
        return res.status(400).json({ message: "Campo faltante: gasto_id" });

      if (!gasto_nombre || gasto_nombre === "")
        return res
          .status(400)
          .json({ message: "Campo faltante: gasto_nombre" });

      if (gasto_monto === null)
        return res.status(400).json({ message: "Campo faltante: gasto_monto" });

      const gasto = await prisma.gastos.update({
        data: {
          pres_id,
          categoria_id,
          periodo_id,
          gasto_nombre,
          gasto_monto,
          gasto_fecha: gasto_fecha ? new Date(gasto_fecha) : null,
          gasto_frecuencia,
          inicio_recurrencia: inicio_recurrencia
            ? new Date(inicio_recurrencia)
            : null,
          fin_recurrencia: fin_recurrencia ? new Date(fin_recurrencia) : null,
        },
        where: { usuario_id: req.userId!, gasto_id },
      });

      return res.status(200).json(gasto);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

gastosRouter.delete(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { gasto_id } = req.body;

      if (!gasto_id)
        return res.status(400).json({ message: "Campo faltante: gasto_id" });

      const gastos = await prisma.gastos.findUnique({
        where: { gasto_id },
      });

      if (!gastos || gastos.usuario_id !== req.userId) {
        return res
          .status(404)
          .json({ message: "Gastos no encontrado o acceso denegado" });
      }

      const gastosEliminado = await prisma.gastos.delete({
        where: { gasto_id },
      });

      return res.status(200).json(gastosEliminado);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default gastosRouter;
