import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 30, module, action, userId, startDate, endDate } = req.query;
    const orgId = req.organisationId || null;
    const where = { ...(orgId ? { organisationId: orgId } : {}) };

    if (module) where.module = module;
    if (action) where.action = action;
    if (userId) where.userId = Number(userId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, email: true, role: true, employee: { select: { firstName: true, lastName: true } } } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return R.paginated(res, logs, total, page, limit);
  } catch (err) { return R.error(res, err.message); }
};

export const getAuditModules = async (_req, res) => {
  try {
    const modules = await prisma.auditLog.findMany({ select: { module: true }, distinct: ["module"] });
    return R.success(res, modules.map(m => m.module));
  } catch (err) { return R.error(res, err.message); }
};
