import express, { Response, Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();
const presupuestoRouter: Router = express.Router();

presupuestoRouter.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const presupuestos = await prisma.presupuestos.findMany({
        where: { usuario_id: req.userId },
      });

      return res.status(201).json(presupuestos);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

presupuestoRouter.get(
  "/detail",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const endDate = new Date();

    try {
      const presupuestos = await prisma.presupuestos.findMany({
        where: { usuario_id: req.userId },
      });

      const totalPresupuestos: number[] = presupuestos.map((p) => {
        const finRecurrencia = p.fin_recurrencia ?? new Date();
        if (!(endDate.getMonth() < finRecurrencia.getMonth()))
          return Number(p.pres_monto_inicial) - Number(p.pres_monto_ult);
        return 0;
      });

      let amount = 0;
      for (let monto of totalPresupuestos) {
        amount += monto;
      }

      res.status(200).json({
        amount,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

presupuestoRouter.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        pres_nombre,
        pres_monto_inicial,
        pres_monto_ult,
        categoria_id,
        periodo_id,
        es_activo,
        inicio_recurrencia,
        fin_recurrencia,
      } = req.body;

      if (!pres_nombre)
        return res.status(400).json({ message: "Campo faltante: pres_nombre" });

      if (pres_monto_inicial === null || typeof pres_monto_inicial !== "number")
        return res
          .status(400)
          .json({ message: "Campo faltante: pres_monto_inicial" });

      if (pres_monto_ult === null || typeof pres_monto_ult !== "number")
        return res
          .status(400)
          .json({ message: "Campo faltante: pres_monto_ult" });

      if (es_activo === null)
        return res.status(400).json({ message: "Campo faltante: es_activo" });

      const nuevoPresupuesto = await prisma.presupuestos.create({
        data: {
          usuario_id: req.userId!,
          pres_nombre,
          pres_monto_inicial: pres_monto_inicial,
          pres_monto_ult: pres_monto_ult,
          categoria_id: categoria_id ?? null,
          periodo_id: periodo_id ?? null,
          es_activo,
          fecha_creacion: new Date(),
          fecha_ult_act: new Date(),
          inicio_recurrencia: inicio_recurrencia
            ? new Date(inicio_recurrencia)
            : null,
          fin_recurrencia: fin_recurrencia ? new Date(fin_recurrencia) : null,
        },
      });

      return res.status(201).json(nuevoPresupuesto);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  }
);

presupuestoRouter.put(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        pres_id,
        pres_nombre,
        pres_monto_inicial,
        pres_monto_ult,
        categoria_id,
        periodo_id,
        es_activo,
        inicio_recurrencia,
        fin_recurrencia,
      } = req.body;

      if (!pres_id)
        return res.status(400).json({ message: "Campo faltante: pres_id" });

      if (!pres_nombre)
        return res.status(400).json({ message: "Campo faltante: pres_nombre" });

      if (pres_monto_inicial === null || typeof pres_monto_inicial !== "number")
        return res
          .status(400)
          .json({ message: "Campo faltante: pres_monto_inicial" });

      if (pres_monto_ult === null || typeof pres_monto_ult !== "number")
        return res
          .status(400)
          .json({ message: "Campo faltante: pres_monto_ult" });

      if (es_activo === null)
        return res.status(400).json({ message: "Campo faltante: es_activo" });

      const presupuesto = await prisma.presupuestos.update({
        data: {
          usuario_id: req.userId!,
          pres_nombre,
          pres_monto_inicial: pres_monto_inicial,
          pres_monto_ult: pres_monto_ult,
          categoria_id: categoria_id ?? null,
          periodo_id: periodo_id ?? null,
          es_activo,
          fecha_ult_act: new Date(),
          inicio_recurrencia: inicio_recurrencia
            ? new Date(inicio_recurrencia)
            : null,
          fin_recurrencia: fin_recurrencia ? new Date(fin_recurrencia) : null,
        },
        where: { usuario_id: req.userId, pres_id: pres_id },
      });

      return res.status(200).json(presupuesto);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

presupuestoRouter.delete(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { pres_id } = req.body;

      if (!pres_id)
        return res.status(400).json({ message: "Campo faltante: pres_id" });

      const presupuesto = await prisma.presupuestos.findUnique({
        where: { pres_id },
      });

      if (!presupuesto || presupuesto.usuario_id !== req.userId) {
        return res
          .status(404)
          .json({ message: "Presupuesto no encontrado o acceso denegado" });
      }

      const presupuestoEliminado = await prisma.presupuestos.delete({
        where: { pres_id },
      });

      return res.status(200).json(presupuestoEliminado);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default presupuestoRouter;
