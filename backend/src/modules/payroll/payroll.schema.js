import { z } from "zod";

export const salaryStructureSchema = z.object({
  employeeId: z.number().int().positive(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  basicSalary: z.number().min(0),
  hra: z.number().min(0).default(0),
  conveyanceAllowance: z.number().min(0).default(0),
  medicalAllowance: z.number().min(0).default(0),
  specialAllowance: z.number().min(0).default(0),
  pfEmployee: z.number().min(0).default(0),
  pfEmployer: z.number().min(0).default(0),
  professionalTax: z.number().min(0).default(0),
  tds: z.number().min(0).default(0),
});

export const processPayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  employeeIds: z.array(z.number().int().positive()).optional(),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["PENDING", "PROCESSED", "PAID"]),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const payrollQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2020).optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  paymentStatus: z.enum(["PENDING", "PROCESSED", "PAID"]).optional(),
});

export const reimbursementSchema = z.object({
  type: z.enum(["TRAVEL", "MEDICAL", "FOOD", "INTERNET", "OTHER"]),
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
