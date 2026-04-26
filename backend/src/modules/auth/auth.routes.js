import { Router } from "express";
import { login, logout, refreshToken, me, changePassword } from "./auth.controller.js";
import { enroll, verifyEnroll, disable, status as twofaStatus } from "./twofa.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { loginSchema, refreshTokenSchema, changePasswordSchema } from "./auth.schema.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshTokenSchema), refreshToken);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.put("/change-password", authenticate, validate(changePasswordSchema), changePassword);

// 2FA / TOTP
router.get("/2fa/status",         authenticate, twofaStatus);
router.post("/2fa/enroll",        authenticate, enroll);
router.post("/2fa/verify-enroll", authenticate, verifyEnroll);
router.post("/2fa/disable",       authenticate, disable);

export default router;
