import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function listUsuarios(_req: Request, res: Response) {
  const usuarios = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
    orderBy: { email: "asc" },
  });

  res.json(usuarios);
}
