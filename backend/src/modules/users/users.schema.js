import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE", "FINANCE"]).default("EMPLOYEE"),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE", "FINANCE"]).optional(),
  isActive: z.boolean().optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "EMPLOYEE", "FINANCE"]).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
