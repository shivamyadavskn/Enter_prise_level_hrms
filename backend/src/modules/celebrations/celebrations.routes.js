import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { getUpcoming, runDigestNow, runAccrualNow } from "./celebrations.controller.js";

const router = Router();
router.use(authenticate);

router.get("/upcoming", getUpcoming);

// Admin-only manual cron triggers (handy for testing or one-off runs)
router.post("/run-cron",    authorize("SUPER_ADMIN", "ADMIN"), runDigestNow);
router.post("/run-accrual", authorize("SUPER_ADMIN", "ADMIN"), runAccrualNow);

export default router;
