import { z } from "zod";

export const createDesignationSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.number().int().min(1).optional(),
  description: z.string().optional(),
});

export const updateDesignationSchema = createDesignationSchema.partial();

export const designationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
