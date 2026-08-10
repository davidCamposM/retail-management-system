import { Router } from "express";
import { listVentas, createVenta } from "../controllers/venta.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, listVentas);
router.post("/", authMiddleware, createVenta);

export default router;