import { Router } from "express";
import {
  listProductos,
  getProducto,
  createProducto,
  updateProducto,
  deleteProducto,
} from "../controllers/producto.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

router.get("/", authMiddleware, listProductos);
router.get("/:id", authMiddleware, getProducto);
router.post("/", authMiddleware, requireRole("ADMIN"), createProducto);
router.put("/:id", authMiddleware, requireRole("ADMIN"), updateProducto);
router.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteProducto);

export default router;