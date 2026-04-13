import { Router } from "express";
import {
  getSalaryStructure, upsertSalaryStructure,
  processPayroll, getPayrolls, getPayrollById, getMyPayslips,
  updatePaymentStatus, getPayrollSummary,
} from "./payroll.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { salaryStructureSchema, processPayrollSchema, updatePaymentStatusSchema, payrollQuerySchema } from "./payroll.schema.js";

const router = Router();
router.use(authenticate);

router.get("/my-payslips", getMyPayslips);
router.get("/summary", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getPayrollSummary);

router.get("/salary-structure/:employeeId", getSalaryStructure);
router.post("/salary-structure", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), validate(salaryStructureSchema), upsertSalaryStructure);

router.post("/process", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), validate(processPayrollSchema), processPayroll);
router.get("/", authorize("SUPER_ADMIN", "ADMIN", "FINANCE", "EMPLOYEE"), validateQuery(payrollQuerySchema), getPayrolls);
router.get("/:id", getPayrollById);
router.patch("/:id/payment-status", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), validate(updatePaymentStatusSchema), updatePaymentStatus);

export default router;
