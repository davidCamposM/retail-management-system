import { Router } from "express";
import { listClientes, createCliente } from "../controllers/cliente.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, listClientes);
router.post("/", authMiddleware, createCliente);

export default router;
