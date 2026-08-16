import { Request, Response } from "express";
import prisma from "../lib/prisma";

// LIST/SEARCH CLIENTES
// ------------------------------------------------------------------------------
export async function listClientes(req: Request, res: Response) {
  const { search } = req.query;

  const clientes = await prisma.cliente.findMany({
    where: search
      ? { nombre: { contains: String(search), mode: "insensitive" } }
      : undefined,
    orderBy: { nombre: "asc" },
    take: 10,
  });

  return res.json(clientes);
}
// ------------------------------------------------------------------------------


// CREATE CLIENTE
// ------------------------------------------------------------------------------
export async function createCliente(req: Request, res: Response) {
  const { nombre, edad, genero, region } = req.body;

  if (!nombre || !nombre.trim() || edad == null || !genero) {
    return res.status(400).json({ error: "nombre, edad y genero son requeridos" });
  }

  const cliente = await prisma.cliente.create({
    data: {
      nombre: nombre.trim(),
      edad: edad != null ? Number(edad) : undefined,
      genero: genero || undefined,
      region: region || undefined,
    },
  });

  return res.status(201).json(cliente);
}
// ------------------------------------------------------------------------------
