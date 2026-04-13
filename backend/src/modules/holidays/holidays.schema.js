import { z } from "zod";

export const createHolidaySchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  type: z.enum(["PUBLIC", "OPTIONAL", "RESTRICTED"]).default("PUBLIC"),
});

export const updateHolidaySchema = createHolidaySchema.partial();

export const holidayQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).optional(),
  type: z.enum(["PUBLIC", "OPTIONAL", "RESTRICTED"]).optional(),
});
