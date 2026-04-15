import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { logAudit } from "../../services/audit.service.js";

const empSelect = { id: true, firstName: true, lastName: true, employeeCode: true };

export const getAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const orgId = req.organisationId || null;
    const where = { isActive: true, ...(orgId ? { organisationId: orgId } : {}) };

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
        include: { createdBy: { select: empSelect } },
      }),
      prisma.announcement.count({ where }),
    ]);

    return R.paginated(res, announcements, total, page, limit);
  } catch (err) { return R.error(res, err.message); }
};

export const createAnnouncement = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee profile not found");

    const { title, content, priority, isPinned, expiresAt } = req.body;
    if (!title || !content) return R.badRequest(res, "Title and content are required");

    const announcement = await prisma.announcement.create({
      data: {
        organisationId: req.organisationId || null,
        title,
        content,
        priority: priority || "NORMAL",
        isPinned: isPinned || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: emp.id,
      },
      include: { createdBy: { select: empSelect } },
    });

    // Notify all org employees
    const orgUsers = await prisma.user.findMany({
      where: { organisationId: req.organisationId || undefined, isActive: true, id: { not: req.user.id } },
      select: { id: true },
    });
    if (orgUsers.length > 0) {
      await prisma.notification.createMany({
        data: orgUsers.map(u => ({
          userId: u.id,
          notificationType: "ANNOUNCEMENT",
          title: `📢 ${title}`,
          message: content.substring(0, 200),
        })),
      });
    }

    await logAudit({ userId: req.user.id, organisationId: req.organisationId, action: "CREATE", module: "announcements", entityId: announcement.id, entityType: "Announcement", description: title, req });

    return R.created(res, announcement, "Announcement published");
  } catch (err) { return R.error(res, err.message); }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, content, priority, isPinned, expiresAt } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(priority && { priority }),
        ...(typeof isPinned === "boolean" && { isPinned }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
      include: { createdBy: { select: empSelect } },
    });

    await logAudit({ userId: req.user.id, organisationId: req.organisationId, action: "UPDATE", module: "announcements", entityId: id, entityType: "Announcement", req });

    return R.success(res, announcement, "Announcement updated");
  } catch (err) { return R.error(res, err.message); }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.announcement.update({ where: { id }, data: { isActive: false } });

    await logAudit({ userId: req.user.id, organisationId: req.organisationId, action: "DELETE", module: "announcements", entityId: id, entityType: "Announcement", req });

    return R.success(res, null, "Announcement removed");
  } catch (err) { return R.error(res, err.message); }
};
