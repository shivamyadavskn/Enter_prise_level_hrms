import { Router } from "express";
import {
  clockIn, clockOut, getAttendance, getTodayStatus, markManualAttendance,
  applyRegularization, getRegularizations, approveRegularization, rejectRegularization,
  getAttendanceSummary,
} from "./attendance.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  clockInSchema, clockOutSchema, regularizeSchema,
  approveRegularizationSchema, attendanceQuerySchema, manualAttendanceSchema,
} from "./attendance.schema.js";

const router = Router();
router.use(authenticate);

router.post("/clock-in", validate(clockInSchema), clockIn);
router.post("/clock-out", validate(clockOutSchema), clockOut);
router.get("/today", getTodayStatus);
router.get("/summary", getAttendanceSummary);
router.get("/", validateQuery(attendanceQuerySchema), getAttendance);
router.post("/manual", authorize("SUPER_ADMIN", "ADMIN"), validate(manualAttendanceSchema), markManualAttendance);

router.post("/regularize", validate(regularizeSchema), applyRegularization);
router.get("/regularize", getRegularizations);
router.patch("/regularize/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validate(approveRegularizationSchema), approveRegularization);
router.patch("/regularize/:id/reject", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validate(approveRegularizationSchema), rejectRegularization);

export default router;
