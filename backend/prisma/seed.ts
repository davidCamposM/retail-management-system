import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import bcrypt from "bcrypt";
import prisma from "../src/lib/prisma";
import type { MetodoPago } from "../src/generated/prisma/enums";

const OUTPUT_DIR = join(__dirname, "../scripts/output");

function parseCsv(content: string): Record<string, string>[] {
  const [headerLine, ...lines] = content.trim().split("\n");
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i];
    });
    return row;
  });
}

function parseFecha(fecha: string): Date {
  const [month, day, year] = fecha.split("/").map(Number);
  return new Date(year, month - 1, day);
}

async function main() {
  console.log("Leyendo CSVs...");
  const productosCsv = parseCsv(readFileSync(join(OUTPUT_DIR, "productos.csv"), "utf-8"));
  const clientesCsv = parseCsv(readFileSync(join(OUTPUT_DIR, "clientes.csv"), "utf-8"));
  const ventasCsv = parseCsv(readFileSync(join(OUTPUT_DIR, "ventas.csv"), "utf-8"));

  console.log("Limpiando datos anteriores...");
  await prisma.venta.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.cliente.deleteMany();

  console.log("Creando usuario dueño de las ventas históricas...");
  const passwordHash = await bcrypt.hash(
    Math.random().toString(36).slice(2) + Date.now(),
    10
  );


  const usuarioHistorico = await prisma.user.upsert({
    where: { email: "historico@retailops.com" },
    update: {},
    create: {
      email: "historico@retailops.com",
      password: passwordHash,
      role: "VENDEDOR",
    },
  });

  console.log(`Insertando ${productosCsv.length} productos...`);
  
  const productoIdMap = new Map<string, number>();
  for (const row of productosCsv) {
    const precioUnitario = Number(row.precio_unitario);
    // Margen sintético entre 25% y 45% — el dataset original no trae costo real.
    const margen = 0.25 + Math.random() * 0.2;
    const costoUnitario = Math.round(precioUnitario * (1 - margen) * 100) / 100;

    const producto = await prisma.producto.create({
      data: {
        nombre: row.nombre,
        categoria: row.categoria,
        precioUnitario,
        costoUnitario,
        stock: Number(row.stock),
        imagenUrl: row.imagen_url,
      },
    });
    productoIdMap.set(row.id, producto.id);
  }


  console.log(`Insertando ${clientesCsv.length} clientes...`);
  const clienteIdMap = new Map<string, number>();
  for (const row of clientesCsv) {
    const cliente = await prisma.cliente.create({
      data: {
        customerIdOriginal: Number(row.customer_id_original),
        nombre: row.nombre,
        edad: Number(row.edad),
        genero: row.genero,
        region: row.region,
      },
    });
    clienteIdMap.set(row.id, cliente.id);
  }

  console.log(`Insertando ${ventasCsv.length} ventas históricas...`);
  const ventasData = ventasCsv.map((row) => ({
    orderIdOriginal: Number(row.order_id_original),
    vendedorId: usuarioHistorico.id,
    clienteId: clienteIdMap.get(row.cliente_id) ?? null,
    productoId: productoIdMap.get(row.producto_id)!,
    cantidad: Number(row.cantidad),
    precioUnitario: Number(row.precio_unitario),
    descuento: Number(row.descuento),
    montoTotal: Number(row.monto_total),
    metodoPago: row.metodo_pago.toUpperCase() as MetodoPago,
    fecha: parseFecha(row.fecha),
    calificacionCliente: Number(row.calificacion_cliente),
    diasEntrega: Number(row.dias_entrega),
    region: row.region,
  }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < ventasData.length; i += BATCH_SIZE) {
    const batch = ventasData.slice(i, i + BATCH_SIZE);
    await prisma.venta.createMany({ data: batch });
    console.log(`  ${Math.min(i + BATCH_SIZE, ventasData.length)}/${ventasData.length}`);
  }

  console.log("Listo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
