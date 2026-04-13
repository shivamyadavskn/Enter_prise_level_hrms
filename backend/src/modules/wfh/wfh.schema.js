import { z } from "zod";

export const applyWfhSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  wfhType: z.enum(["FULL_DAY", "HALF_DAY", "RECURRING"]).default("FULL_DAY"),
  reason: z.string().min(1, "Reason is required"),
});

export const approveRejectWfhSchema = z.object({
  rejectionReason: z.string().optional(),
});

export const wfhQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2020).optional(),
});
