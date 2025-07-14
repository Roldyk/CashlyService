import express, { Response, Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();
const categoriaRouter: Router = express.Router();

categoriaRouter.get(
  "/",
  authenticateToken,
  async (_req: AuthRequest, res: Response) => {
    try {
      const categorias = await prisma.categoria.findMany();
      return res.status(200).json(categorias);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

categoriaRouter.post(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { categoria_nom, categoria_descrip } = req.body;

    if (categoria_nom === null || categoria_nom.trim() === "")
      return res.status(400).json({ message: "Campo faltante: categoria_nom" });

    try {
      const nuevaCategoria = await prisma.categoria.create({
        data: { categoria_nom, categoria_descrip },
      });

      return res.status(201).json(nuevaCategoria);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

categoriaRouter.put(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { categoria_id, categoria_nom, categoria_descrip } = req.body;

    if (isNaN(categoria_id) || categoria_id === null)
      return res.status(400).json({ message: "Campo faltante: categoria_id" });

    if (categoria_nom === null || categoria_nom.trim() === "")
      return res.status(400).json({ message: "Campo faltante: categoria_nom" });

    try {
      const categoria = await prisma.categoria.update({
        data: {
          categoria_nom,
          categoria_descrip,
        },
        where: {
          categoria_id,
        },
      });

      return res.status(201).json(categoria);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

categoriaRouter.delete(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { categoria_id } = req.body;

    if (!categoria_id)
      return res.status(400).json({ message: "Campo faltante: categoria_id" });

    try {
      const categoria = await prisma.categoria.findUnique({
        where: { categoria_id },
      });

      if (!categoria) {
        return res
          .status(404)
          .json({ message: "categoria no encontrado o acceso denegado" });
      }

      const categoriaEliminado = await prisma.categoria.delete({
        where: { categoria_id },
      });

      return res.status(200).json(categoriaEliminado);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default categoriaRouter;
