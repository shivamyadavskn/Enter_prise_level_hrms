import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { logAudit } from "../../services/audit.service.js";

const empSelect = { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } };

export const getAssets = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, assigned, search } = req.query;
    const orgId = req.organisationId || null;
    const where = { isActive: true, ...(orgId ? { organisationId: orgId } : {}) };

    if (category) where.category = category;
    if (assigned === "true") where.assignedToId = { not: null };
    if (assigned === "false") where.assignedToId = null;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { assetCode: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: { assignedTo: { select: empSelect } },
      }),
      prisma.asset.count({ where }),
    ]);

    return R.paginated(res, assets, total, page, limit);
  } catch (err) { return R.error(res, err.message); }
};

export const getMyAssets = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.success(res, []);

    const assets = await prisma.asset.findMany({
      where: { assignedToId: emp.id, isActive: true },
      orderBy: { assignedDate: "desc" },
    });
    return R.success(res, assets);
  } catch (err) { return R.error(res, err.message); }
};

export const createAsset = async (req, res) => {
  try {
    const orgId = req.organisationId || null;
    const { assetCode, name, category, brand, modelName, serialNumber, purchaseDate, purchasePrice, condition, notes } = req.body;

    if (!assetCode || !name || !category) return R.badRequest(res, "assetCode, name, and category are required");

    const existing = await prisma.asset.findFirst({ where: { organisationId: orgId, assetCode } });
    if (existing) return R.badRequest(res, "Asset code already exists");

    const asset = await prisma.asset.create({
      data: {
        organisationId: orgId,
        assetCode, name, category,
        brand: brand || null,
        modelName: modelName || null,
        serialNumber: serialNumber || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? Number(purchasePrice) : null,
        condition: condition || "GOOD",
        notes: notes || null,
      },
    });

    await logAudit({ userId: req.user.id, organisationId: orgId, action: "CREATE", module: "assets", entityId: asset.id, entityType: "Asset", description: `${assetCode} — ${name}`, req });

    return R.created(res, asset, "Asset created");
  } catch (err) { return R.error(res, err.message); }
};

export const updateAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, category, brand, modelName, serialNumber, purchaseDate, purchasePrice, condition, notes } = req.body;

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(brand !== undefined && { brand }),
        ...(modelName !== undefined && { modelName }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
        ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? Number(purchasePrice) : null }),
        ...(condition && { condition }),
        ...(notes !== undefined && { notes }),
      },
      include: { assignedTo: { select: empSelect } },
    });

    await logAudit({ userId: req.user.id, organisationId: req.organisationId, action: "UPDATE", module: "assets", entityId: id, entityType: "Asset", req });

    return R.success(res, asset, "Asset updated");
  } catch (err) { return R.error(res, err.message); }
};

export const assignAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { employeeId } = req.body;

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        assignedToId: employeeId ? Number(employeeId) : null,
        assignedDate: employeeId ? new Date() : null,
      },
      include: { assignedTo: { select: empSelect } },
    });

    if (employeeId) {
      const emp = await prisma.employee.findUnique({ where: { id: Number(employeeId) }, include: { user: true } });
      if (emp?.user) {
        await prisma.notification.create({
          data: { userId: emp.user.id, notificationType: "ASSET_ASSIGNED", title: "Asset Assigned", message: `${asset.name} (${asset.assetCode}) has been assigned to you.` },
        });
      }
    }

    await logAudit({ userId: req.user.id, organisationId: req.organisationId, action: employeeId ? "ASSIGN" : "UNASSIGN", module: "assets", entityId: id, entityType: "Asset", description: `Asset ${asset.assetCode} ${employeeId ? "assigned to" : "unassigned from"} employee`, req });

    return R.success(res, asset, employeeId ? "Asset assigned" : "Asset unassigned");
  } catch (err) { return R.error(res, err.message); }
};

export const deleteAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.asset.update({ where: { id }, data: { isActive: false, assignedToId: null, assignedDate: null } });

    await logAudit({ userId: req.user.id, organisationId: req.organisationId, action: "DELETE", module: "assets", entityId: id, entityType: "Asset", req });

    return R.success(res, null, "Asset retired");
  } catch (err) { return R.error(res, err.message); }
};

export const getAssetStats = async (req, res) => {
  try {
    const orgId = req.organisationId || null;
    const where = { isActive: true, ...(orgId ? { organisationId: orgId } : {}) };

    const [total, assigned, unassigned, byCategory, byCondition] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.count({ where: { ...where, assignedToId: { not: null } } }),
      prisma.asset.count({ where: { ...where, assignedToId: null } }),
      prisma.asset.groupBy({ by: ["category"], _count: { id: true }, where }),
      prisma.asset.groupBy({ by: ["condition"], _count: { id: true }, where }),
    ]);

    const totalValue = await prisma.asset.aggregate({ _sum: { purchasePrice: true }, where });

    return R.success(res, {
      total, assigned, unassigned,
      totalValue: totalValue._sum.purchasePrice || 0,
      byCategory: byCategory.map(c => ({ category: c.category, count: c._count.id })),
      byCondition: byCondition.map(c => ({ condition: c.condition, count: c._count.id })),
    });
  } catch (err) { return R.error(res, err.message); }
};
