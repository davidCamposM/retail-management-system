import "dotenv/config"
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import productoRoutes from "./routes/producto.routes";
import ventaRoutes from "./routes/ventas.routes";
import usuarioRoutes from "./routes/usuario.routes";
import reporteRoutes from "./routes/reporte.routes";
import clienteRoutes from "./routes/cliente.routes";


const app = express();


// USE 
//------------------------------------------------------------------------------
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

/**
 * Each route domain contains its own file (modular architecture), 
 * and app.ts acts as the point that imports and mounts them under a common prefix.
 * 
 * 
 */
// Health check: sirve para verificar que el despliegue responde sin tocar la
// base de datos.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/productos", productoRoutes);
app.use("/ventas", ventaRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/reportes", reporteRoutes);
app.use("/clientes", clienteRoutes);
//------------------------------------------------------------------------------


/**
 * Se exporta la app ya construida, sin encenderla. Quien la enciende depende
 * del entorno.
 */
export default app;
