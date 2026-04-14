import { Router } from "express";
import { getClaims, createClaim, approveClaim, rejectClaim } from "./reimbursements.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getClaims);
router.post("/", createClaim);
router.patch("/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "FINANCE", "MANAGER"), approveClaim);
router.patch("/:id/reject", authorize("SUPER_ADMIN", "ADMIN", "FINANCE", "MANAGER"), rejectClaim);

export default router;
