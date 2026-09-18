import { Router } from "express";
import { register, login, forgotPassword, resetPassword } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();


// POST METHODS
//---------------------------------------------
// Solo un ADMIN autenticado puede crear cuentas: la ruta acepta el campo `role`
// del body, asi que abierta permitiria que cualquiera se hiciera administrador.
router.post("/register", authMiddleware, requireRole("ADMIN"), register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);


//---------------------------------------------

export default router;