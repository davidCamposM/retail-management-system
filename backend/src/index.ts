import "dotenv/config"
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import productoRoutes from "./routes/producto.routes";
import ventaRoutes from "./routes/ventas.routes";
import usuarioRoutes from "./routes/usuario.routes";
import reporteRoutes from "./routes/reporte.routes";


const app = express();


// USE 
//------------------------------------------------------------------------------
app.use(cors());
app.use(express.json());

/**
 * Each route domain contains its own file (modular architecture), 
 * and index.js acts as the point that imports and mounts them under a common prefix.
 * 
 * 
 */
app.use("/auth", authRoutes);
app.use("/productos", productoRoutes);
app.use("/ventas", ventaRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/reportes", reporteRoutes);
//------------------------------------------------------------------------------


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en https://localhost:${PORT}`)
})