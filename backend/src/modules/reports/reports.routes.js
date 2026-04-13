import { Router } from "express";
import {
  getDashboardStats, getHeadcountReport, getAttendanceReport,
  getLeaveReport, getPayrollReport, getAttritionReport, getNewJoinersReport,
} from "./reports.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/dashboard", getDashboardStats);
router.get("/headcount", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), getHeadcountReport);
router.get("/attendance", authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "FINANCE"), getAttendanceReport);
router.get("/leaves", authorize("SUPER_ADMIN", "ADMIN"), getLeaveReport);
router.get("/payroll", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getPayrollReport);
router.get("/attrition", authorize("SUPER_ADMIN", "ADMIN"), getAttritionReport);
router.get("/new-joiners", authorize("SUPER_ADMIN", "ADMIN"), getNewJoinersReport);

export default router;
