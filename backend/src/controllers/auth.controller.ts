
import {Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";


// REGISTER FUNCTION
//--------------------------------------------------------------------------------
export async function register (req: Request, res: Response) {

    const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "email, password y role son requeridos" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Ese email ya está registrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, role },
  });

  res.status(201).json({ id: user.id, email: user.email, role: user.role });

}


//--------------------------------------------------------------------------------






// LOGIN FUNCTION
//--------------------------------------------------------------------------------
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email y password son requeridos" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "8h" }
  );

  res.json({ token });
}
//--------------------------------------------------------------------------------