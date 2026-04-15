import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  headId: z.number().int().positive().optional(),
  description: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const departmentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
