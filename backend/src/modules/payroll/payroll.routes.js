import { Router } from "express";
import {
  getSalaryStructure, upsertSalaryStructure, updateSalaryStructure, getMissingSalaryStructures,
  processPayroll, getPayrolls, getPayrollById, getMyPayslips,
  updatePaymentStatus, getPayrollSummary,
  addPayrollAdjustment, getPayrollAdjustments, bulkUpdatePaymentStatus, getPayrollForecast,
  getSalaryRevisions,
} from "./payroll.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { salaryStructureSchema, updateSalaryStructureSchema, processPayrollSchema, updatePaymentStatusSchema, payrollQuerySchema } from "./payroll.schema.js";

const router = Router();
router.use(authenticate);

router.get("/my-payslips", getMyPayslips);
router.get("/summary", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getPayrollSummary);

router.get("/salary-structure/missing", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getMissingSalaryStructures);
router.get("/salary-structure/:employeeId", getSalaryStructure);
router.post("/salary-structure", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), validate(salaryStructureSchema), upsertSalaryStructure);
router.put("/salary-structure", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), validate(updateSalaryStructureSchema), updateSalaryStructure);
router.get("/salary-structure/:employeeId/revisions", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getSalaryRevisions);

router.post("/process", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), validate(processPayrollSchema), processPayroll);
router.get("/", authorize("SUPER_ADMIN", "ADMIN", "FINANCE", "EMPLOYEE"), validateQuery(payrollQuerySchema), getPayrolls);
router.get("/:id", getPayrollById);
router.patch("/:id/payment-status", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), validate(updatePaymentStatusSchema), updatePaymentStatus);

// Adjustments & Bulk
router.post("/adjustments", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), addPayrollAdjustment);
router.get("/adjustments", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getPayrollAdjustments);
router.patch("/bulk-payment", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), bulkUpdatePaymentStatus);
router.get("/forecast", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getPayrollForecast);

export default router;
