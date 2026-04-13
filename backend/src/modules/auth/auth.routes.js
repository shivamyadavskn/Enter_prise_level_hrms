import { Router } from "express";
import { login, logout, refreshToken, me, changePassword } from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { loginSchema, refreshTokenSchema, changePasswordSchema } from "./auth.schema.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshTokenSchema), refreshToken);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.put("/change-password", authenticate, validate(changePasswordSchema), changePassword);

export default router;
