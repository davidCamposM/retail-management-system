import { Router } from "express";
import { listUsuarios } from "../controllers/usuario.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

router.get("/", authMiddleware, requireRole("ADMIN"), listUsuarios);

export default router;
