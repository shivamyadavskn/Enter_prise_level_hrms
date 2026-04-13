import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead, notificationType } = req.query;
    const where = { userId: req.user.id };

    if (isRead !== undefined) where.isRead = isRead;
    if (notificationType) where.notificationType = notificationType;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return R.notFound(res, "Notification not found");
    if (notification.userId !== req.user.id) return R.forbidden(res, "Access denied");

    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return R.success(res, updated, "Marked as read");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return R.success(res, null, "All notifications marked as read");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return R.notFound(res, "Notification not found");
    if (notification.userId !== req.user.id) return R.forbidden(res, "Access denied");

    await prisma.notification.delete({ where: { id } });
    return R.success(res, null, "Notification deleted");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const clearAll = async (req, res) => {
  try {
    await prisma.notification.deleteMany({ where: { userId: req.user.id } });
    return R.success(res, null, "All notifications cleared");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createNotification = async (req, res) => {
  try {
    const notif = await prisma.notification.create({ data: req.body });
    return R.created(res, notif);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });
    return R.success(res, { count });
  } catch (err) {
    return R.error(res, err.message);
  }
};
