import express, {Request,Response,Router} from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from '../generated/prisma';
import jwt from "jsonwebtoken";
const prisma = new PrismaClient();
const secret = process.env.JWT_SECRET || "defaultsecretkey";
import {authenticateToken, AuthRequest} from "../middleware/authMiddleware";
const authRouter: Router = express.Router();

authRouter.post("/register", async (req, res) => {
    try {
        const { usuario_nombre, usuario_apellido, usuario_correo, usuario_password, usuario_pais, usuario_moneda, usuario_fecha_nacimiento } = req.body;

        const existingUser = await prisma.usuarios.findUnique({
            where: { usuario_correo },
        });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(usuario_password, 10);

        const newUser = await prisma.usuarios.create({
            data: {
               usuario_nombre,
               usuario_apellido,
               usuario_correo,
               usuario_password: hashedPassword,
               usuario_pais,
               moneda: usuario_moneda,
              usuario_fecha_nacimiento: new Date(usuario_fecha_nacimiento),
            },
        });

        const token = jwt.sign({ userId: newUser.usuario_id }, secret, { expiresIn: "1h" });

        return res.status(201).json({ token });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "Internal server error" });
        return;``
    }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { usuario_correo, usuario_password } = req.body;
    console.log("Contraseña recibida:", usuario_password);

    if (!usuario_correo || !usuario_password) {
      return res.status(400).json({ message: "Email and password are requiered" });
    }

    const user = await prisma.usuarios.findUnique({
      where: { usuario_correo },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(usuario_password, user.usuario_password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid o contraseña inválidos" });
    }

    const token = jwt.sign({ userId: user.usuario_id }, secret, { expiresIn: "1h" });

    return res.status(200).json({ token });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.get("/profile/:id", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await prisma.usuarios.findUnique({
      where: { usuario_id: userId },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const Profile = {
      usuario_id: user.usuario_id,
      usuario_nombre: user.usuario_nombre,
      usuario_apellido: user.usuario_apellido,
      usuario_correo: user.usuario_correo,
      usuario_pais: user.usuario_pais,
      moneda: user.moneda,  
      usuario_fecha_nacimiento: user.usuario_fecha_nacimiento,
    }
    return res.status(200).json(Profile);

  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default authRouter;


