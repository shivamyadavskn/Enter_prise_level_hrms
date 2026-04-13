import { Router } from "express";
import {
  getLeaveTypes, createLeaveType, updateLeaveType,
  getLeaveBalance, adjustLeaveBalance, bulkAllocateLeaves,
  getLeaves, applyLeave, getLeaveById, approveLeave, rejectLeave, cancelLeave,
} from "./leaves.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  applyLeaveSchema, approveRejectSchema, leaveQuerySchema,
  createLeaveTypeSchema, updateLeaveTypeSchema, adjustBalanceSchema,
} from "./leaves.schema.js";

const router = Router();
router.use(authenticate);

// Leave Types
router.get("/types", getLeaveTypes);
router.post("/types", authorize("SUPER_ADMIN", "ADMIN"), validate(createLeaveTypeSchema), createLeaveType);
router.put("/types/:id", authorize("SUPER_ADMIN", "ADMIN"), validate(updateLeaveTypeSchema), updateLeaveType);

// Leave Balance
router.get("/balance", getLeaveBalance);
router.post("/balance/adjust", authorize("SUPER_ADMIN", "ADMIN"), validate(adjustBalanceSchema), adjustLeaveBalance);
router.post("/allocate-bulk", authorize("SUPER_ADMIN", "ADMIN"), bulkAllocateLeaves);

// Leave Applications
router.get("/", validateQuery(leaveQuerySchema), getLeaves);
router.post("/apply", validate(applyLeaveSchema), applyLeave);
router.get("/:id", getLeaveById);
router.patch("/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validate(approveRejectSchema), approveLeave);
router.patch("/:id/reject", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validate(approveRejectSchema), rejectLeave);
router.patch("/:id/cancel", cancelLeave);

export default router;
