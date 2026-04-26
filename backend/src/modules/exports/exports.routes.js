import { Router } from "express";
import {
  downloadPayslip,
  exportEmployees, exportAttendance, exportPayroll, exportLeaves,
} from "./exports.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

// Payslips — any authenticated user (employees see only theirs, enforced in controller)
router.get("/payslip/:payrollId", downloadPayslip);

// Excel exports — restricted to admin/HR/finance/manager roles
const EXPORT_ROLES = ["SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "FINANCE"];
router.get("/employees.xlsx",  authorize(...EXPORT_ROLES), exportEmployees);
router.get("/attendance.xlsx", authorize(...EXPORT_ROLES), exportAttendance);
router.get("/payroll.xlsx",    authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), exportPayroll);
router.get("/leaves.xlsx",     authorize(...EXPORT_ROLES), exportLeaves);

export default router;
