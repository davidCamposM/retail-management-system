import { Request, Response } from "express";
import prisma from "../lib/prisma";

export async function listVentas(req: Request, res: Response) {
  const { fecha_desde, fecha_hasta, vendedorId, region, search } = req.query;

  const isAdmin = req.user?.role === "ADMIN";

  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));

  const where = {
    vendedorId: isAdmin
      ? vendedorId ? Number(vendedorId) : undefined
      : req.user?.id,
    region: region ? String(region) : undefined,
    fecha: {
      gte: fecha_desde ? new Date(String(fecha_desde)) : undefined,
      lte: fecha_hasta ? new Date(String(fecha_hasta)) : undefined,
    },
    ...(search
      ? {
          OR: [
            { cliente: { nombre: { contains: String(search), mode: "insensitive" as const } } },
            { vendedor: { email: { contains: String(search), mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [ventas, total] = await Promise.all([
    prisma.venta.findMany({
      where,
      include: {
        cliente: true,
        producto: true,
        vendedor: { select: { id: true, email: true } },
      },
      orderBy: { fecha: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.venta.count({ where }),
  ]);

  res.json({
    data: ventas,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function createVenta(req: Request, res: Response) {
  const { clienteId, productoId, cantidad, descuento, metodoPago, region } = req.body;

  if (!productoId || !cantidad || !metodoPago || !region) {
    return res.status(400).json({
      error: "productoId, cantidad, metodoPago y region son requeridos",
    });
  }

  const producto = await prisma.producto.findUnique({ where: { id: productoId } });
  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  if (producto.stock < cantidad) {
    return res.status(400).json({ error: "Stock insuficiente" });
  }

  const descuentoAplicado = descuento ?? 0;
  const montoTotal = producto.precioUnitario * cantidad * (1 - descuentoAplicado);

  const venta = await prisma.$transaction(async (tx) => {
    const nuevaVenta = await tx.venta.create({
      data: {
        clienteId: clienteId ?? undefined,
        productoId,
        vendedorId: req.user!.id,
        cantidad,
        precioUnitario: producto.precioUnitario,
        descuento: descuentoAplicado,
        montoTotal,
        metodoPago,
        region,
      },
    });

    await tx.producto.update({
      where: { id: productoId },
      data: { stock: { decrement: cantidad } },
    });

    return nuevaVenta;
  });

  return res.status(201).json(venta);
}