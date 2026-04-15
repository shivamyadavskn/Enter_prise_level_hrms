import { z } from "zod";

export const uploadDocumentSchema = z.object({
  employeeId: z.coerce.number().int().positive(),
  documentType: z.enum(["ID_PROOF", "ADDRESS_PROOF", "EDUCATION", "EXPERIENCE", "OFFER_LETTER", "CONTRACT", "PAYSLIP", "OTHER"]).default("OTHER"),
  documentName: z.string().min(1),
});

export const documentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(10),
  employeeId: z.coerce.number().int().positive().optional(),
  documentType: z.enum(["ID_PROOF", "ADDRESS_PROOF", "EDUCATION", "EXPERIENCE", "OFFER_LETTER", "CONTRACT", "PAYSLIP", "OTHER"]).optional(),
});
