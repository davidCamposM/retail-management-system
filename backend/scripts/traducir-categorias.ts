/**
 * Traduce al español las categorías de producto en una base ya sembrada.
 *
 * Por qué existe: el dataset original trae `Beauty`, `Clothing`, `Electronics`
 * y `Home`, pero la interfaz filtra por `Belleza`, `Ropa`, `Electrónica` y
 * `Hogar` (ver CATEGORIAS en frontend/src/pages/Productos.tsx y Ventas.tsx).
 * Sin esta traducción los botones de categoría no devuelven ningún producto.
 *
 * El seed ya aplica el mismo mapa: este script solo hace falta para corregir
 * datos sembrados antes del arreglo.
 *
 * Uso:  set -a && . ./.env.production && set +a && npx tsx scripts/traducir-categorias.ts
 */
import { Client } from "pg";

const CATEGORIAS_ES: Record<string, string> = {
  Beauty: "Belleza",
  Clothing: "Ropa",
  Electronics: "Electrónica",
  Home: "Hogar",
};

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  for (const [ingles, espanol] of Object.entries(CATEGORIAS_ES)) {
    const res = await client.query(
      `UPDATE "Producto" SET categoria = $1 WHERE categoria = $2`,
      [espanol, ingles]
    );
    console.log(`${ingles.padEnd(12)} -> ${espanol.padEnd(12)} (${res.rowCount} productos)`);
  }

  const cats = await client.query(
    `SELECT categoria, COUNT(*)::int AS n FROM "Producto" GROUP BY categoria ORDER BY categoria`
  );
  console.log("\nCategorias finales en la base:");
  for (const c of cats.rows) console.log(`  ${c.categoria} (${c.n} productos)`);

  await client.end();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
