import express, { Response, Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();
const metasRouter: Router = express.Router();

metasRouter.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const metas = await prisma.metas.findMany({
        where: { usuario_id: req.userId },
      });
      return res.status(200).json(metas);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

metasRouter.get(
  "/detail",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const metas = await prisma.metas.findMany({
        where: {
          usuario_id: req.userId,
          meta_es_activo: true,
        },
        select: {
          meta_monto_inicial: true,
          meta_monto_ult: true,
          meta_fecha_inicio: true,
          meta_fecha_fin: true,
        },
      });

      if (metas.length === 0) {
        return res
          .status(404)
          .json({ message: "No metas found for this user" });
      }

      const totalMetaUlt = metas.reduce(
        (sum, meta) => sum + Number(meta.meta_monto_ult),
        0
      );

      const totalMetasInicial = metas.reduce(
        (sum, meta) => sum + Number(meta.meta_monto_inicial),
        0
      );

      const porcentajeCompleto = (totalMetaUlt / totalMetasInicial) * 100;

      return res.status(200).json({
        amount: totalMetasInicial.toFixed(2),
        percentageCompleted: porcentajeCompleto.toFixed(2),
        date: Date.now(),
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

metasRouter.get(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const metaId = parseInt(req.params.id, 10);

      if (isNaN(metaId))
        return res.status(400).json({ message: "ID inválido" });

      const meta = await prisma.metas.findFirst({
        where: { meta_id: metaId, usuario_id: req.userId },
      });

      if (!meta) return res.status(400).json({ message: "Meta no encontrada" });
      return res.status(200).json(meta);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

metasRouter.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        categoria_id,
        periodo_id,
        meta_nombre,
        meta_descripcion,
        meta_monto_inicial,
        meta_monto_ult,
        meta_es_activo,
        meta_fecha_inicio,
        meta_fecha_fin,
      } = req.body;

      if (isNaN(periodo_id))
        return res.status(400).json({ message: "Campo faltante: periodo_id" });

      if (!meta_nombre)
        return res.status(400).json({ message: "Campo faltante: meta_nombre" });

      if (isNaN(meta_monto_inicial))
        return res
          .status(400)
          .json({ message: "Campo faltante: meta_monto_inicial" });

      if (meta_es_activo === null)
        return res
          .status(400)
          .json({ message: "Campo faltante: meta_es_activo" });

      const nuevaMeta = await prisma.metas.create({
        data: {
          usuario_id: req.userId!,
          categoria_id,
          periodo_id,
          meta_nombre,
          meta_descripcion,
          meta_monto_inicial,
          meta_monto_ult,
          meta_es_activo,
          meta_fecha_inicio: meta_fecha_inicio
            ? new Date(meta_fecha_fin)
            : null,
          meta_fecha_fin: meta_fecha_fin ? new Date(meta_fecha_fin) : null,
        },
      });

      return res.status(201).json(nuevaMeta);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

metasRouter.put(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        meta_id,
        categoria_id,
        periodo_id,
        meta_nombre,
        meta_descripcion,
        meta_monto_inicial,
        meta_monto_ult,
        meta_es_activo,
        meta_fecha_inicio,
        meta_fecha_fin,
      } = req.body;

      if (isNaN(meta_id))
        return res.status(400).json({ message: "Campo faltante: meta_id" });

      if (isNaN(periodo_id))
        return res.status(400).json({ message: "Campo faltante: periodo_id" });

      if (!meta_nombre)
        return res.status(400).json({ message: "Campo faltante: meta_nombre" });

      if (isNaN(meta_monto_inicial))
        return res
          .status(400)
          .json({ message: "Campo faltante: meta_monto_inicial" });

      if (meta_es_activo === null)
        return res
          .status(400)
          .json({ message: "Campo faltante: meta_es_activo" });

      const meta = await prisma.metas.update({
        data: {
          categoria_id,
          periodo_id,
          meta_nombre,
          meta_descripcion,
          meta_monto_inicial,
          meta_monto_ult,
          meta_es_activo,
          meta_fecha_inicio,
          meta_fecha_fin,
        },
        where: {
          meta_id,
          usuario_id: req.userId,
        },
      });

      return res.status(201).json(meta);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

metasRouter.delete(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { meta_id } = req.body;

      if (!meta_id)
        return res.status(400).json({ message: "Campo faltante: meta_id" });

      const meta = await prisma.metas.findUnique({
        where: { meta_id },
      });

      if (!meta || meta.usuario_id !== req.userId) {
        return res
          .status(404)
          .json({ message: "meta no encontrado o acceso denegado" });
      }

      const metaEliminado = await prisma.metas.delete({
        where: { meta_id },
      });

      return res.status(200).json(metaEliminado);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default metasRouter;
