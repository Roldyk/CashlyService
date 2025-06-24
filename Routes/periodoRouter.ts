import express, { Response, Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();
const periodoRouter: Router = express.Router();

periodoRouter.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const periodos = await prisma.periodo.findMany();
      return res.status(200).json(periodos);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

periodoRouter.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const periodoId = parseInt(req.params.id);

      if (isNaN(periodoId))
        return res.status(400).json({ message: "ID Inválido" });

      const periodo = await prisma.periodo.findUnique({
        where: { periodo_id: periodoId },
      });

      if (!periodo)
        return res.status(400).json({ message: "Periodo no encontrada" });

      return res.status(200).json(periodo);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

periodoRouter.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { periodo_nom } = req.body;

      if (!periodo_nom)
        return res.status(400).json({ message: "Campo faltante: periodo_nom" });

      const nuevoPeriodo = await prisma.periodo.create({
        data: {
          periodo_nom,
        },
      });

      return res.status(201).json(nuevoPeriodo);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

periodoRouter.put(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { periodo_id, periodo_nom } = req.body;

      if (!periodo_nom)
        return res.status(400).json({ message: "Campo faltante: periodo_nom" });

      const periodo = await prisma.periodo.update({
        data: {
          periodo_nom,
        },
        where: { periodo_id },
      });

      return res.status(201).json(periodo);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

periodoRouter.delete(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { periodo_id } = req.body;

      if (!periodo_id)
        return res.status(400).json({ message: "Campo faltante: periodo_id" });

      const periodo = await prisma.periodo.findUnique({
        where: { periodo_id },
      });

      if (!periodo)
        return res.status(400).json({ message: "Periodo no encontrado" });

      const periodoEliminado = await prisma.periodo.delete({
        where: { periodo_id },
      });

      return res.status(200).json(periodoEliminado);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default periodoRouter;
