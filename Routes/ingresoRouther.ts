import express, { Response, Router } from "express";
import { PrismaClient } from "../generated/prisma";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();
const ingresoRouter: Router = express.Router();

ingresoRouter.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { mes, anio } = req.query;

      if (!mes || !anio) {
        const ingresos = await prisma.ingresos.findMany({
          where: { usuario_id: req.userId },
        });
        return res.json(ingresos);
      }

      const month = parseInt(mes as string, 10);
      const year  = parseInt(anio as string, 10);
      const startDate = new Date(year, month - 1, 1);
      const endDate   = new Date(year, month, 1);

      const ingresos = await prisma.ingresos.findMany({
        where: {
          usuario_id: req.userId,
          ingreso_fecha: {
            gte: startDate, 
            lt:  endDate,    
          },
        },
      });

      return res.json(ingresos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al consultar ingresos" });
    }
  }
);

ingresoRouter.post(
  "/",
  authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
        const { ingreso_nombre, ingreso_monto, ingreso_fecha, periodo_id, categoria_id,ingreso_frecuencia,inicio_recurrencia,fin_recurrencia} = req.body;
    
        if (!ingreso_nombre || !ingreso_monto) {
            return res.status(400).json({ error: "Faltan campos requeridos" });
        }
    
        const nuevoIngreso = await prisma.ingresos.create({
            data: {
            usuario_id: req.userId!,
            ingreso_nombre,
            ingreso_monto,
            ingreso_fecha: new Date(ingreso_fecha),
            periodo_id,
            categoria_id,
            ingreso_frecuencia,
            inicio_recurrencia: inicio_recurrencia ? new Date(inicio_recurrencia) : null,
            fin_recurrencia: fin_recurrencia ? new Date(fin_recurrencia) : null,
            },
        });
    
        return res.status(201).json(nuevoIngreso);
        } catch (error) {
        console.error(error);
            res.status(500).json({ error: "Error al crear el ingreso" });
            }
        }
    );

ingresoRouter.put(
  "/:id",
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        const { id } = req.params;
        const { ingreso_nombre, ingreso_monto, ingreso_fecha, periodo_id, categoria_id,ingreso_frecuencia,inicio_recurrencia,fin_recurrencia } = req.body;

        try {
            const ingreso = await prisma.ingresos.update({
                where: { ingreso_id: parseInt(id) },
                data: {
                    ingreso_nombre,
                    ingreso_monto,
                    ingreso_fecha: new Date(ingreso_fecha),
                    periodo_id,
                    categoria_id,
                    ingreso_frecuencia,
                    inicio_recurrencia: inicio_recurrencia ? new Date(inicio_recurrencia) : null,
                    fin_recurrencia: fin_recurrencia ? new Date(fin_recurrencia) : null,
                },
            });
            return res.json(ingreso);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error al actualizar el ingreso" });
        }
    },
)

ingresoRouter.delete(
  "/:id",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
      const ingreso = await prisma.ingresos.delete({
        where: { ingreso_id: parseInt(id) },
      });
      return res.json({ message: "Ingreso eliminado", ingreso });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al eliminar el ingreso" });
    }
  }
);

export default ingresoRouter;
