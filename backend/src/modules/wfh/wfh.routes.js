import { Router } from "express";
import { getWfhRequests, applyWfh, getWfhById, approveWfh, rejectWfh, cancelWfh } from "./wfh.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { applyWfhSchema, approveRejectWfhSchema, wfhQuerySchema } from "./wfh.schema.js";

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(wfhQuerySchema), getWfhRequests);
router.post("/apply", validate(applyWfhSchema), applyWfh);
router.get("/:id", getWfhById);
router.patch("/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), approveWfh);
router.patch("/:id/reject", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validate(approveRejectWfhSchema), rejectWfh);
router.patch("/:id/cancel", cancelWfh);

export default router;
