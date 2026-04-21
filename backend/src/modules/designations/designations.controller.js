import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

export const getDesignations = async (req, res) => {
  try {
    const { page = 1, limit = 50, isActive, search } = req.query;
    const where = {};
    // Always scope to the user's org — prevents null-org seed records leaking to org users.
    if (req.organisationId) {
      where.organisationId = req.organisationId;
    } else if (!req.isPlatformAdmin) {
      where.organisationId = null;
    }
    if (isActive !== undefined) where.isActive = isActive === "true" || isActive === true;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [designations, total] = await Promise.all([
      prisma.designation.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { level: "asc" },
        include: { _count: { select: { employees: true } } },
      }),
      prisma.designation.count({ where }),
    ]);

    return R.paginated(res, designations, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getDesignationById = async (req, res) => {
  try {
    const desig = await prisma.designation.findUnique({
      where: { id: Number(req.params.id) },
      include: { _count: { select: { employees: true } } },
    });
    if (!desig) return R.notFound(res, "Designation not found");
    if (req.organisationId && desig.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");
    return R.success(res, desig);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createDesignation = async (req, res) => {
  try {
    const desig = await prisma.designation.create({ data: { ...req.body, organisationId: req.organisationId || undefined } });
    return R.created(res, desig, "Designation created successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateDesignation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (req.organisationId) {
      const existing = await prisma.designation.findUnique({ where: { id }, select: { organisationId: true } });
      if (!existing || existing.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");
    }
    const desig = await prisma.designation.update({
      where: { id },
      data: req.body,
    });
    return R.success(res, desig, "Designation updated successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteDesignation = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (req.organisationId) {
      const existing = await prisma.designation.findUnique({ where: { id }, select: { organisationId: true } });
      if (!existing || existing.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");
    }
    const empCount = await prisma.employee.count({ where: { designationId: id } });
    if (empCount > 0) return R.badRequest(res, `Cannot delete designation assigned to ${empCount} employees`);

    await prisma.designation.update({ where: { id }, data: { isActive: false } });
    return R.success(res, null, "Designation deactivated successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};
