import { Router } from "express";
import {
  getDashboardStats, getHeadcountReport, getAttendanceReport,
  getLeaveReport, getPayrollReport, getAttritionReport, getNewJoinersReport, getCTCReport,
  getEmployeeCostReport, getReimbursementTrendReport, getTeamProductivityReport, getAnomalyReport,
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
router.get("/ctc", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getCTCReport);
router.get("/employee-cost", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getEmployeeCostReport);
router.get("/reimbursement-trends", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getReimbursementTrendReport);
router.get("/team-productivity", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), getTeamProductivityReport);
router.get("/anomalies", authorize("SUPER_ADMIN", "ADMIN"), getAnomalyReport);

export default router;
