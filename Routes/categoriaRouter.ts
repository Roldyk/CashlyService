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
    } catch (error) {}
  }
);

export default categoriaRouter;
