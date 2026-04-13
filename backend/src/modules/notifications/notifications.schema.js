import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.number().int().positive(),
  notificationType: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  isRead: z.coerce.boolean().optional(),
  notificationType: z.string().optional(),
});
