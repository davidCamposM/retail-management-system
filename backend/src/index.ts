import "dotenv/config"
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";


const app = express();

app.use(cors());
app.use(express.json());

/**
 * Each route domain contains its own file (modular architecture), 
 * and index.js acts as the point that imports and mounts them under a common prefix.
 * 
 * 
 */
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en https://localhost:${PORT}`)
})