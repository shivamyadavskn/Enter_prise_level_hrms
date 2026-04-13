import { z } from "zod";

export const createEmployeeSchema = z.object({
  userId: z.number().int().positive(),
  employeeCode: z.string().min(1).max(20),
  firstName: z.string().min(1).max(50),
  lastName: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(15).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  dateOfJoining: z.string().datetime().optional(),
  employmentStatus: z.enum(["ACTIVE", "PROBATION", "RESIGNED", "TERMINATED"]).default("PROBATION"),
  departmentId: z.number().int().positive().optional(),
  designationId: z.number().int().positive().optional(),
  managerId: z.number().int().positive().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema
  .omit({ userId: true, employeeCode: true })
  .partial()
  .extend({
    dateOfConfirmation: z.string().datetime().optional(),
    dateOfLeaving: z.string().datetime().optional(),
  });

export const employeeQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(10),
  search: z.string().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  designationId: z.coerce.number().int().positive().optional(),
  employmentStatus: z.enum(["ACTIVE", "PROBATION", "RESIGNED", "TERMINATED"]).optional(),
  managerId: z.coerce.number().int().positive().optional(),
});
