/**
 * Hace coherentes catálogo, histórico y márgenes en una base ya sembrada.
 *
 * Por qué existe: productos.csv y ventas.csv son datasets independientes. El
 * `precio_unitario` de las ventas es aleatorio entre $15 y $600 y no guarda
 * relación con el producto vendido, así que el costo derivado del catálogo
 * podía superar al ingreso y la ganancia neta del dashboard salía negativa.
 *
 * Qué hace:
 *   1. Restaura el precio de catálogo de cada producto desde productos.csv.
 *   2. Recalcula su costo con un margen de 38% a 52%, por encima del descuento
 *      máximo del dataset (35%).
 *   3. Reescribe cada venta para que use el precio de catálogo de su producto,
 *      recalculando el monto total con su descuento original.
 *
 * Con eso ninguna venta queda bajo costo y la ganancia es positiva en cualquier
 * rango de fechas. El seed ya aplica este mismo criterio: este script solo hace
 * falta para corregir datos sembrados antes del arreglo.
 *
 * Uso:  set -a && . ./.env.production && set +a && npx tsx scripts/alinear-precios.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

const OUTPUT_DIR = join(__dirname, "output");

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

async function main() {
  const productosCsv = parseCsv(
    readFileSync(join(OUTPUT_DIR, "productos.csv"), "utf-8")
  );
  const precioPorNombre = new Map(
    productosCsv.map((row) => [row.nombre, Number(row.precio_unitario)])
  );

  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  const productos = await client.query(
    `SELECT id, nombre, categoria, "precioUnitario" FROM "Producto" ORDER BY nombre`
  );

  console.log("producto                        precio    costo  margen");
  for (const p of productos.rows) {
    const precio = precioPorNombre.get(p.nombre);
    if (precio === undefined) {
      console.log(`${p.nombre.padEnd(28)} (no esta en productos.csv, se omite)`);
      continue;
    }

    const margen = 0.38 + Math.random() * 0.14;
    const costo = Math.round(precio * (1 - margen) * 100) / 100;

    await client.query(
      `UPDATE "Producto" SET "precioUnitario" = $1, "costoUnitario" = $2 WHERE id = $3`,
      [precio, costo, p.id]
    );

    console.log(
      `${p.nombre.padEnd(28)} ${String(precio).padStart(8)} ${String(costo).padStart(8)}   ${Math.round(margen * 100)}%`
    );
  }

  const res = await client.query(`
    UPDATE "Venta" v
    SET "precioUnitario" = p."precioUnitario",
        "montoTotal" = ROUND((p."precioUnitario" * v.cantidad * (1 - v.descuento))::numeric, 2)
    FROM "Producto" p
    WHERE p.id = v."productoId"
  `);
  console.log(`\nVentas recalculadas: ${res.rowCount}`);

  const cats = await client.query(
    `SELECT categoria, COUNT(*)::int AS n FROM "Producto" GROUP BY categoria ORDER BY categoria`
  );
  console.log(`Categorias en la base: ${cats.rows.map((c) => `${c.categoria} (${c.n})`).join(", ")}`);

  const mes = await client.query(`
    SELECT ROUND(SUM(v."montoTotal")::numeric) AS ingresos,
           ROUND(SUM(p."costoUnitario" * v.cantidad)::numeric) AS costos,
           ROUND((SUM(v."montoTotal") - SUM(p."costoUnitario" * v.cantidad))::numeric) AS ganancia
    FROM "Venta" v JOIN "Producto" p ON p.id = v."productoId"
    WHERE v.fecha >= DATE_TRUNC('month', CURRENT_DATE)
  `);
  const g = mes.rows[0];
  console.log(`Mes en curso: ingresos ${g.ingresos} / costos ${g.costos} / ganancia ${g.ganancia}`);

  const peor = await client.query(`
    SELECT MIN(v."montoTotal" - p."costoUnitario" * v.cantidad) AS peor_venta
    FROM "Venta" v JOIN "Producto" p ON p.id = v."productoId"
  `);
  console.log(`Peor venta individual: ${Number(peor.rows[0].peor_venta).toFixed(2)} (debe ser > 0)`);

  const hist = await client.query(`
    SELECT ROUND((100.0 * (SUM(v."montoTotal") - SUM(p."costoUnitario" * v.cantidad))
                  / SUM(v."montoTotal"))::numeric, 1) AS margen_pct
    FROM "Venta" v JOIN "Producto" p ON p.id = v."productoId"
  `);
  console.log(`Margen sobre todo el historico: ${hist.rows[0].margen_pct}%`);

  await client.end();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
