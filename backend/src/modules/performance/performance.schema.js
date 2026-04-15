import { z } from "zod";

export const createReviewSchema = z.object({
  employeeId: z.number().int().positive(),
  reviewPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewType: z.enum(["PROBATION", "QUARTERLY", "ANNUAL", "MID_YEAR"]),
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const selfAppraisalSchema = z.object({
  selfRating: z.number().min(1).max(5),
  strengths: z.string().optional(),
  areasOfImprovement: z.string().optional(),
  goalsAchieved: z.string().optional(),
  comments: z.string().optional(),
});

export const managerAppraisalSchema = z.object({
  managerRating: z.number().min(1).max(5),
  finalRating: z.number().min(1).max(5).optional(),
  strengths: z.string().optional(),
  areasOfImprovement: z.string().optional(),
  goalsAchieved: z.string().optional(),
  comments: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED", "ACKNOWLEDGED"]).optional(),
});

export const performanceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(10),
  employeeId: z.coerce.number().int().positive().optional(),
  reviewType: z.enum(["PROBATION", "QUARTERLY", "ANNUAL", "MID_YEAR"]).optional(),
  status: z.enum(["PENDING", "COMPLETED", "ACKNOWLEDGED"]).optional(),
  year: z.coerce.number().min(2020).optional(),
});
