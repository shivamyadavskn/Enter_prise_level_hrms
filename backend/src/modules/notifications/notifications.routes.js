import { Router } from "express";
import {
  getNotifications, markAsRead, markAllAsRead,
  deleteNotification, clearAll, createNotification, getUnreadCount,
} from "./notifications.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { createNotificationSchema, notificationQuerySchema } from "./notifications.schema.js";

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(notificationQuerySchema), getNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), validate(createNotificationSchema), createNotification);
router.patch("/read-all", markAllAsRead);
router.delete("/clear-all", clearAll);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
