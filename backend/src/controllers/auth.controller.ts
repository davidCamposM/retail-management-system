
import {Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { sendPasswordResetEmail } from "../lib/email";


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

  return res.status(201).json({ id: user.id, email: user.email, role: user.role });

}


//--------------------------------------------------------------------------------






// LOGIN FUNCTION
//--------------------------------------------------------------------------------
export async function login(req: Request, res: Response) {
  const { email, password, remember } = req.body;

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
    { expiresIn: remember ? "30d" : "8h" }
  );

  return res.json({ token });
}
//--------------------------------------------------------------------------------


// FORGOT PASSWORD FUNCTION
//--------------------------------------------------------------------------------
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "email es requerido" });
  }

  // Respuesta genérica siempre — no revela si el email existe o no en el sistema.
  const genericResponse = {
    message: "Si el correo existe en nuestro sistema, te enviamos un link para restablecer tu contraseña.",
  };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash, resetTokenExpiry },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetLink);
  } catch (err) {
    console.error("Error enviando email de recuperación:", err);
  }

  return res.json(genericResponse);
}
//--------------------------------------------------------------------------------


// RESET PASSWORD FUNCTION
//--------------------------------------------------------------------------------
export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: "token y password son requeridos" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findUnique({ where: { resetTokenHash: tokenHash } });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return res.status(400).json({ error: "El link de recuperación es inválido o expiró" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetTokenHash: null,
      resetTokenExpiry: null,
    },
  });

  return res.json({ message: "Contraseña actualizada correctamente" });
}
//--------------------------------------------------------------------------------