import { z } from "zod";

export const clockInSchema = z.object({
  location: z.string().optional(),
});

export const clockOutSchema = z.object({
  location: z.string().optional(),
});

export const regularizeSchema = z.object({
  attendanceId: z.number().int().positive(),
  requestedClockIn: z.string().datetime().optional(),
  requestedClockOut: z.string().datetime().optional(),
  reason: z.string().min(1, "Reason is required"),
});

export const approveRegularizationSchema = z.object({
  comments: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export const attendanceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(31),
  employeeId: z.coerce.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "WFH", "HOLIDAY"]).optional(),
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2020).optional(),
});

export const manualAttendanceSchema = z.object({
  employeeId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  clockIn: z.string().datetime().optional(),
  clockOut: z.string().datetime().optional(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "WFH", "HOLIDAY"]),
});
