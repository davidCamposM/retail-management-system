import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import bcrypt from "bcrypt";
import prisma from "../src/lib/prisma";
import type { MetodoPago } from "../src/generated/prisma/enums";

const OUTPUT_DIR = join(__dirname, "../scripts/output");

// El dataset original trae las categorias en ingles, pero la interfaz filtra por
// los nombres en espanol (ver CATEGORIAS en frontend/src/pages/Productos.tsx).
// Sin esta traduccion los botones de categoria no devuelven ningun producto.
const CATEGORIAS_ES: Record<string, string> = {
  Beauty: "Belleza",
  Clothing: "Ropa",
  Electronics: "Electrónica",
  Home: "Hogar",
};

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

  // El precio de catálogo manda: el `precio_unitario` de ventas.csv es aleatorio
  // entre $15 y $600 y no guarda relación con el producto vendido (los 16
  // productos promedian lo mismo), así que no sirve como referencia. Más abajo
  // las ventas se recalculan a partir de este precio.
  //
  // El margen va de 38% a 52%, por encima del descuento máximo del dataset
  // (35%). Así ninguna venta queda bajo costo y la ganancia neta es positiva en
  // cualquier rango de fechas que se filtre en el dashboard.
  const precioCatalogoPorProducto = new Map<string, number>();

  const productoIdMap = new Map<string, number>();
  for (const row of productosCsv) {
    const precioUnitario = Number(row.precio_unitario);
    const margen = 0.38 + Math.random() * 0.14;
    const costoUnitario = Math.round(precioUnitario * (1 - margen) * 100) / 100;
    precioCatalogoPorProducto.set(row.id, precioUnitario);

    const producto = await prisma.producto.create({
      data: {
        nombre: row.nombre,
        categoria: CATEGORIAS_ES[row.categoria] ?? row.categoria,
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

  // Se insertan por lotes, no uno por uno: contra una base remota (Neon) cada
  // insert individual es un viaje de ida y vuelta por red, y 989 de ellos tardan
  // minutos sobre una sola conexión que puede cortarse a mitad de camino.
  // `createManyAndReturn` devuelve las filas creadas, que necesitamos porque el
  // id real lo genera Postgres y hay que mapearlo al id del CSV para las ventas.
  const CLIENTE_BATCH_SIZE = 500;
  for (let i = 0; i < clientesCsv.length; i += CLIENTE_BATCH_SIZE) {
    const batch = clientesCsv.slice(i, i + CLIENTE_BATCH_SIZE);

    const creados = await prisma.cliente.createManyAndReturn({
      data: batch.map((row) => ({
        customerIdOriginal: Number(row.customer_id_original),
        nombre: row.nombre,
        edad: Number(row.edad),
        genero: row.genero,
        region: row.region,
      })),
    });

    // El mapa se arma cruzando por customerIdOriginal (que es único) en vez de
    // asumir que el orden de salida coincide con el de entrada.
    const porOriginal = new Map(creados.map((c) => [c.customerIdOriginal, c.id]));
    for (const row of batch) {
      const id = porOriginal.get(Number(row.customer_id_original));
      if (id != null) clienteIdMap.set(row.id, id);
    }

    console.log(`  ${Math.min(i + CLIENTE_BATCH_SIZE, clientesCsv.length)}/${clientesCsv.length}`);
  }

  console.log(`Insertando ${ventasCsv.length} ventas históricas...`);
  const ventasData = ventasCsv.map((row) => ({
    orderIdOriginal: Number(row.order_id_original),
    vendedorId: usuarioHistorico.id,
    clienteId: clienteIdMap.get(row.cliente_id) ?? null,
    productoId: productoIdMap.get(row.producto_id)!,
    cantidad: Number(row.cantidad),
    precioUnitario: precioCatalogoPorProducto.get(row.producto_id)!,
    descuento: Number(row.descuento),
    montoTotal:
      Math.round(
        precioCatalogoPorProducto.get(row.producto_id)! *
          Number(row.cantidad) *
          (1 - Number(row.descuento)) *
          100
      ) / 100,
    metodoPago: row.metodo_pago.toUpperCase() as MetodoPago,
    fecha: parseFecha(row.fecha),
    calificacionCliente: Number(row.calificacion_cliente),
    diasEntrega: Number(row.dias_entrega),
    region: row.region,
  }));

  // El dataset original va del 1/1/2022 al 9/9/2035: un tercio de las ventas
  // caen en el futuro, lo que deja el historial encabezado por fechas de 2035 y
  // parece un error. Se desplazan todas las fechas en bloque para que la ultima
  // venta coincida con el dia en que se corre el seed, conservando la distancia
  // entre ellas. Se usa setDate() en vez de aritmetica de milisegundos para que
  // los cambios de horario de verano no corran las fechas un dia.
  const fechaMaxima = ventasData.reduce(
    (max, v) => (v.fecha > max ? v.fecha : max),
    ventasData[0].fecha
  );
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  const diasDeDesfase = Math.floor((fechaMaxima.getTime() - Date.now()) / MS_POR_DIA);

  if (diasDeDesfase > 0) {
    console.log(`Desplazando las fechas ${diasDeDesfase} dias hacia atras...`);
    for (const venta of ventasData) {
      venta.fecha.setDate(venta.fecha.getDate() - diasDeDesfase);
    }
  }

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
