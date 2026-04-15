import { Router } from "express";
import { getAuditLogs, getAuditModules } from "./audit.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);
router.use(authorize("SUPER_ADMIN", "ADMIN"));

router.get("/", getAuditLogs);
router.get("/modules", getAuditModules);

export default router;
