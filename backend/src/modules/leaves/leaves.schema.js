import { z } from "zod";

export const applyLeaveSchema = z.object({
  leaveTypeId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  reason: z.string().min(1, "Reason is required"),
  approverId: z.number().int().positive().optional(),
});

export const approveRejectSchema = z.object({
  comments: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const leaveQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(10),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  leaveTypeId: z.coerce.number().int().positive().optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
  annualQuota: z.number().int().min(0),
  carryForwardAllowed: z.boolean().default(false),
  maxCarryForward: z.number().int().min(0).optional(),
  encashmentAllowed: z.boolean().default(false),
  requiresDocument: z.boolean().default(false),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial();

export const adjustBalanceSchema = z.object({
  employeeId: z.number().int().positive(),
  leaveTypeId: z.number().int().positive(),
  year: z.number().int().min(2020).max(2100),
  available: z.number().min(0),
  reason: z.string().optional(),
});
