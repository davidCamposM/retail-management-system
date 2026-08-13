import { Router } from "express";
import { getDashboard } from "../controllers/reporte.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

router.get("/dashboard", authMiddleware, requireRole("ADMIN"), getDashboard);

export default router;