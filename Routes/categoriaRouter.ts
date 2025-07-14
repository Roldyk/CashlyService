import express, { Router, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();
export const categoriaRouter: Router = express.Router();

categoriaRouter.use(authenticateToken);

categoriaRouter.post("/", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { nombre, descripcion, iconRef } = req.body;

  try {
    const nueva = await prisma.categoria.create({
      data: {
        categoria_nom: nombre,
        categoria_descrip: descripcion,
        icon_ref: iconRef,
        owner_id: userId,
      },
    });
    return res.status(201).json(nueva);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error al crear la categoría" });
  }
});

categoriaRouter.get("/", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const lista = await prisma.categoria.findMany({
      where: {
        OR: [
          { owner_id: null }, // globales
          { owner_id: userId }, // propias
        ],
      },
      orderBy: { categoria_nom: "asc" },
    });
    return res.json(lista);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error al obtener categorías" });
  }
});

categoriaRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = Number(req.params.id);

  try {
    const cat = await prisma.categoria.findUnique({
      where: { categoria_id: id },
    });
    if (!cat) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    if (cat.owner_id === null) {
      return res
        .status(403)
        .json({ error: "No puedes eliminar categorías globales" });
    }
    if (cat.owner_id !== userId) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar esta categoría" });
    }

    await prisma.categoria.delete({ where: { categoria_id: id } });
    return res.sendStatus(204);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error al eliminar la categoría" });
  }
});
export default categoriaRouter;
