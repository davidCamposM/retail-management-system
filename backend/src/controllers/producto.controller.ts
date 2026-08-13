

import { Request, Response } from "express";
import prisma from "../lib/prisma";


// LIST PRODUCT
// ------------------------------------------------------------------------------
export async function listProductos(req: Request, res: Response) {
  const { categoria, search } = req.query;

  const productos = await prisma.producto.findMany({
    where: {
      categoria: categoria ? String(categoria) : undefined,
      nombre: search ? { contains: String(search), mode: "insensitive" } : undefined,
    },
    orderBy: { nombre: "asc" },
  });

  res.json(productos);
}
// ------------------------------------------------------------------------------




// GET PRODUCT
// ------------------------------------------------------------------------------
export async function getProducto(req: Request, res: Response) {
  const id = Number(req.params.id);

  const producto = await prisma.producto.findUnique({ where: { id } });

  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  return res.json(producto);
}
// ------------------------------------------------------------------------------



// CREATE PRODUCT
// ------------------------------------------------------------------------------
export async function createProducto(req: Request, res: Response) {
  const { nombre, categoria, precioUnitario, stock, imagenUrl } = req.body;

  if (!nombre || !categoria || precioUnitario == null || stock == null) {
    return res.status(400).json({
      error: "nombre, categoria, precioUnitario y stock son requeridos",
    });
  }

  // Margen sintético entre 25% y 45%, mismo criterio que el seed histórico.
  const margen = 0.25 + Math.random() * 0.2;
  const costoUnitario = Math.round(precioUnitario * (1 - margen) * 100) / 100;

  const producto = await prisma.producto.create({
    data: {
      nombre,
      categoria,
      precioUnitario,
      costoUnitario,
      stock,
      imagenUrl: imagenUrl || placeholderImageFor(categoria),
    },
  });

  return res.status(201).json(producto);
}
// ------------------------------------------------------------------------------


// UPDATE PRODUCT
// ------------------------------------------------------------------------------
export async function updateProducto(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { nombre, categoria, precioUnitario, stock, imagenUrl } = req.body;

  const existing = await prisma.producto.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  const producto = await prisma.producto.update({
    where: { id },
    data: { nombre, categoria, precioUnitario, stock, imagenUrl },
  });

  return res.json(producto);
}
// ------------------------------------------------------------------------------



// DELETED PRODUCT
// ------------------------------------------------------------------------------
export async function deleteProducto(req: Request, res: Response) {
  const id = Number(req.params.id);

  const existing = await prisma.producto.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  await prisma.producto.delete({ where: { id } });

  return res.status(204).send();
}
// ------------------------------------------------------------------------------



// ------------------------------------------------------------------------------
function placeholderImageFor(categoria: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(categoria)}/400/400`;
}
// ------------------------------------------------------------------------------