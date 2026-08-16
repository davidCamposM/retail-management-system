import { Request, Response } from "express";
import prisma from "../lib/prisma";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function rangoPorDefecto() {
  const ahora = new Date();
  const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  return { desde, hasta: ahora };
}

function periodoAnterior(desde: Date, hasta: Date) {
  const duracionMs = hasta.getTime() - desde.getTime();
  const hastaAnterior = new Date(desde.getTime() - 1);
  const desdeAnterior = new Date(hastaAnterior.getTime() - duracionMs);
  return { desde: desdeAnterior, hasta: hastaAnterior };
}

function variacion(actual: number, anterior: number): number {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return ((actual - anterior) / anterior) * 100;
}

export async function getDashboard(req: Request, res: Response) {
  const { fecha_desde, fecha_hasta } = req.query;

  const porDefecto = rangoPorDefecto();
  const desde = fecha_desde ? new Date(String(fecha_desde)) : porDefecto.desde;
  const hasta = fecha_hasta ? new Date(String(fecha_hasta)) : porDefecto.hasta;
  const anterior = periodoAnterior(desde, hasta);

  const [ventas, agregadoAnterior] = await Promise.all([
    prisma.venta.findMany({
      where: { fecha: { gte: desde, lte: hasta } },
      include: { producto: true, cliente: true },
    }),
    prisma.venta.aggregate({
      where: { fecha: { gte: anterior.desde, lte: anterior.hasta } },
      _sum: { montoTotal: true },
      _count: true,
    }),
  ]);

  // --- KPIs ---
  const ventasTotales = ventas.reduce((sum, v) => sum + v.montoTotal, 0);
  const ordenes = ventas.length;
  const ticketPromedio = ordenes > 0 ? ventasTotales / ordenes : 0;
  const gananciaNeta = ventas.reduce(
    (sum, v) => sum + (v.montoTotal - v.producto.costoUnitario * v.cantidad),
    0
  );

  const ventasTotalesAnterior = agregadoAnterior._sum.montoTotal ?? 0;
  const ordenesAnterior = agregadoAnterior._count;
  const ticketPromedioAnterior = ordenesAnterior > 0 ? ventasTotalesAnterior / ordenesAnterior : 0;

  // --- Ventas por mes (últimos 6 meses, independiente del filtro) ---
  const seisMesesAtras = new Date();
  seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
  seisMesesAtras.setDate(1);

  const ventasUltimos6Meses = await prisma.venta.findMany({
    where: { fecha: { gte: seisMesesAtras } },
    select: { fecha: true, montoTotal: true },
  });

  const porMes = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(seisMesesAtras);
    d.setMonth(d.getMonth() + i);
    porMes.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const v of ventasUltimos6Meses) {
    const key = `${v.fecha.getFullYear()}-${v.fecha.getMonth()}`;
    if (porMes.has(key)) {
      porMes.set(key, (porMes.get(key) ?? 0) + v.montoTotal);
    }
  }
  const ventasPorMes = Array.from(porMes.entries()).map(([key, valor]) => {
    const [, mesIndex] = key.split("-").map(Number);
    return { mes: MESES[mesIndex], valor };
  });

  // --- Top productos ---
  const porProducto = new Map<number, { nombre: string; monto: number }>();
  for (const v of ventas) {
    const actual = porProducto.get(v.productoId) ?? { nombre: v.producto.nombre, monto: 0 };
    actual.monto += v.montoTotal;
    porProducto.set(v.productoId, actual);
  }
  const topProductos = Array.from(porProducto.values())
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 4);

  // --- Ventas por región ---
  const porRegion = new Map<string, number>();
  for (const v of ventas) {
    porRegion.set(v.region, (porRegion.get(v.region) ?? 0) + v.montoTotal);
  }
  const ventasPorRegion = Array.from(porRegion.entries())
    .map(([region, monto]) => ({
      region,
      porcentaje: ventasTotales > 0 ? Math.round((monto / ventasTotales) * 100) : 0,
    }))
    .sort((a, b) => b.porcentaje - a.porcentaje);

  // --- Margen por categoría ---
  const porCategoria = new Map<string, { ingreso: number; costo: number }>();
  for (const v of ventas) {
    const actual = porCategoria.get(v.producto.categoria) ?? { ingreso: 0, costo: 0 };
    actual.ingreso += v.montoTotal;
    actual.costo += v.producto.costoUnitario * v.cantidad;
    porCategoria.set(v.producto.categoria, actual);
  }
  const margenPorCategoria = Array.from(porCategoria.entries()).map(([categoria, { ingreso, costo }]) => ({
    categoria,
    margen: ingreso > 0 ? Math.round(((ingreso - costo) / ingreso) * 100) : 0,
  }));

  // --- Demografía de clientes (por rango etario, solo ventas con cliente registrado) ---
  const RANGOS = [
    { label: "18-25", min: 18, max: 25 },
    { label: "26-35", min: 26, max: 35 },
    { label: "36-45", min: 36, max: 45 },
    { label: "46-55", min: 46, max: 55 },
    { label: "56+", min: 56, max: 200 },
  ];
  // Solo cuentan los clientes con edad registrada — los creados al vuelo desde
  // el POS no la tienen, y no deberían distorsionar el corte demográfico.
  const ventasConEdad = ventas.filter(
    (v): v is typeof v & { cliente: NonNullable<typeof v.cliente> & { edad: number } } =>
      v.cliente !== null && v.cliente.edad !== null
  );
  const porRango = new Map(RANGOS.map((r) => [r.label, 0]));
  for (const v of ventasConEdad) {
    const edad = v.cliente.edad;
    const rango = RANGOS.find((r) => edad >= r.min && edad <= r.max);
    if (rango) porRango.set(rango.label, (porRango.get(rango.label) ?? 0) + 1);
  }
  const demografiaClientes = RANGOS.map((r) => ({
    rango: r.label,
    porcentaje:
      ventasConEdad.length > 0
        ? Math.round(((porRango.get(r.label) ?? 0) / ventasConEdad.length) * 100)
        : 0,
  }));

  // La respuesta se devuelve en formato JSON
  res.json({
    kpis: {
      ventasTotales,
      ventasTotalesDelta: variacion(ventasTotales, ventasTotalesAnterior),
      ticketPromedio,
      ticketPromedioDelta: variacion(ticketPromedio, ticketPromedioAnterior),
      gananciaNeta,
      ordenes,
      ordenesDelta: variacion(ordenes, ordenesAnterior),
    },
    ventasPorMes,
    topProductos,
    ventasPorRegion,
    margenPorCategoria,
    demografiaClientes,
  });
}