"""
Prepara el dataset de Kaggle (abbas829/ecommerce-sales-dataset) para RetailOps.

Qué hace:
  1. Descarga (o reutiliza caché de) el CSV original vía kagglehub.
  2. Inspecciona columnas, categorías y métodos de pago reales.
  3. Genera un catálogo de productos sintético (nombre/stock/precio) por
     cada product_category real del dataset.
  4. Genera datos demográficos sintéticos (nombre/edad/género) por cada
     customer_id real del dataset.
  5. Escribe 3 CSVs listos para el seed de Prisma: productos.csv,
     clientes.csv, ventas.csv.

Cómo correrlo:
  cd backend
  pip install kagglehub pandas faker
  python scripts/prepare_dataset.py

Los datos sintéticos (nombre/edad/género de cliente, nombre/stock de
producto) NO vienen del dataset original — se generan acá y deben
declararse como tales en el README del proyecto.
"""

import os
import random

import kagglehub
import pandas as pd
from faker import Faker

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
PRODUCTS_PER_CATEGORY = 4
RANDOM_SEED = 42

fake = Faker("es_MX")
random.seed(RANDOM_SEED)
Faker.seed(RANDOM_SEED)

# Nombres curados para categorías comunes del dataset. Si aparece una
# categoría que no está acá, se usa un nombre genérico de respaldo
# (ver generic_product_name). Ajusta/agrega entradas según lo que
# imprima la inspección del dataset real.
PRODUCT_NAME_TEMPLATES = {
    "electronics": [
        "Auriculares Bluetooth", "Mouse Inalámbrico", "Cargador USB-C",
        "Parlante Portátil", "Smartwatch Básico",
    ],
    "clothing": [
        "Polera Algodón", "Jeans Slim Fit", "Chaqueta Cortavientos",
        "Zapatillas Urbanas", "Gorro de Lana",
    ],
    "home": [
        "Set de Ollas", "Licuadora Compacta", "Juego de Toallas",
        "Lámpara de Escritorio", "Organizador Multiuso",
    ],
    "books": [
        "Novela Bestseller", "Libro de Cocina", "Manual Técnico",
        "Cómic Edición Especial", "Libro Infantil Ilustrado",
    ],
    "beauty": [
        "Crema Facial Hidratante", "Set de Brochas", "Perfume 50ml",
        "Shampoo Reparador", "Kit de Manicure",
    ],
    "sports": [
        "Balón de Fútbol", "Mancuernas 5kg", "Mat de Yoga",
        "Botella Térmica", "Bicicleta de Ruta",
    ],
    "toys": [
        "Set de Bloques", "Peluche Grande", "Auto a Control Remoto",
        "Rompecabezas 500 piezas", "Muñeca Articulada",
    ],
    "grocery": [
        "Pack de Snacks", "Café en Grano 500g", "Aceite de Oliva",
        "Cereal Integral", "Chocolate Artesanal",
    ],
}


# El dataset de Kaggle trae las categorías en inglés. RetailOps las usa en
# español en toda la UI, así que se traducen acá, en el único punto donde
# se generan los CSVs — así el resto del pipeline (seed, backend, frontend)
# nunca tiene que lidiar con inglés.
CATEGORY_TRANSLATIONS = {
    "electronics": "Electrónica",
    "clothing": "Ropa",
    "beauty": "Belleza",
    "home": "Hogar",
}


def translate_category(category: str) -> str:
    return CATEGORY_TRANSLATIONS.get(category.strip().lower(), category)


def generic_product_name(category: str, index: int) -> str:
    return f"{category.title()} - Modelo {index}"


def load_source_dataframe() -> pd.DataFrame:
    path = kagglehub.dataset_download("abbas829/ecommerce-sales-dataset")
    csv_files = [f for f in os.listdir(path) if f.endswith(".csv")]
    if not csv_files:
        raise FileNotFoundError(f"No se encontró ningún CSV en {path}")
    csv_path = os.path.join(path, csv_files[0])
    print(f"Usando dataset: {csv_path}")
    return pd.read_csv(csv_path)


def inspect(df: pd.DataFrame) -> None:
    print("\n=== Columnas ===")
    print(df.dtypes)
    print("\n=== product_category (valores únicos) ===")
    print(sorted(df["product_category"].dropna().unique().tolist()))
    print("\n=== payment_method (valores únicos) ===")
    print(sorted(df["payment_method"].dropna().unique().tolist()))
    print("\n=== region (valores únicos) ===")
    print(sorted(df["region"].dropna().unique().tolist()))
    print(f"\nFilas totales: {len(df)}")
    print(f"Clientes únicos: {df['customer_id'].nunique()}")


def build_products(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    product_id = 1
    for category in sorted(df["product_category"].dropna().unique()):
        cat_prices = df.loc[df["product_category"] == category, "unit_price"]
        min_price, max_price = cat_prices.min(), cat_prices.max()

        names = PRODUCT_NAME_TEMPLATES.get(category.strip().lower())
        for i in range(1, PRODUCTS_PER_CATEGORY + 1):
            name = names[i - 1] if names and i <= len(names) else generic_product_name(category, i)
            rows.append({
                "id": product_id,
                "nombre": name,
                "categoria": translate_category(category),
                "precio_unitario": round(random.uniform(min_price, max_price), 2),
                "stock": random.randint(10, 200),
                "imagen_url": f"https://picsum.photos/seed/producto{product_id}/400/400",
            })
            product_id += 1
    return pd.DataFrame(rows)


def build_clients(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    client_id = 1
    for original_id in sorted(df["customer_id"].dropna().unique()):
        rows.append({
            "id": client_id,
            "customer_id_original": original_id,
            "nombre": fake.name(),
            "edad": random.randint(18, 70),
            "genero": random.choice(["Femenino", "Masculino"]),
            "region": fake.state(),
        })
        client_id += 1
    return pd.DataFrame(rows)


def build_sales(df: pd.DataFrame, productos: pd.DataFrame, clientes: pd.DataFrame) -> pd.DataFrame:
    client_map = dict(zip(clientes["customer_id_original"], clientes["id"]))
    products_by_category = {
        category: group["id"].tolist()
        for category, group in productos.groupby("categoria")
    }

    rows = []
    for i, r in df.iterrows():
        category_products = products_by_category.get(translate_category(r["product_category"]), [])
        producto_id = random.choice(category_products) if category_products else None
        rows.append({
            "id": i + 1,
            "order_id_original": r["order_id"],
            "cliente_id": client_map.get(r["customer_id"]),
            "producto_id": producto_id,
            "cantidad": r["quantity"],
            "precio_unitario": r["unit_price"],
            "descuento": r["discount"],
            "monto_total": r["revenue"],
            "metodo_pago": r["payment_method"],
            "fecha": r["order_date"],
            "calificacion_cliente": r["customer_rating"],
            "dias_entrega": r["delivery_days"],
            "region": r["region"],
        })
    return pd.DataFrame(rows)


def main() -> None:
    df = load_source_dataframe()
    inspect(df)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    productos = build_products(df)
    clientes = build_clients(df)
    ventas = build_sales(df, productos, clientes)

    productos.to_csv(os.path.join(OUTPUT_DIR, "productos.csv"), index=False)
    clientes.to_csv(os.path.join(OUTPUT_DIR, "clientes.csv"), index=False)
    ventas.to_csv(os.path.join(OUTPUT_DIR, "ventas.csv"), index=False)

    print(f"\nListo. {len(productos)} productos, {len(clientes)} clientes, {len(ventas)} ventas")
    print(f"Escrito en: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
