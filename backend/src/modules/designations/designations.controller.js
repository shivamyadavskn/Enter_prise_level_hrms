import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

export const getDesignations = async (req, res) => {
  try {
    const { page = 1, limit = 50, isActive, search } = req.query;
    const where = {};
    if (isActive !== undefined) where.isActive = isActive;
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
    return R.success(res, desig);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createDesignation = async (req, res) => {
  try {
    const desig = await prisma.designation.create({ data: req.body });
    return R.created(res, desig, "Designation created successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateDesignation = async (req, res) => {
  try {
    const desig = await prisma.designation.update({
      where: { id: Number(req.params.id) },
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
    const empCount = await prisma.employee.count({ where: { designationId: id } });
    if (empCount > 0) return R.badRequest(res, `Cannot delete designation assigned to ${empCount} employees`);

    await prisma.designation.update({ where: { id }, data: { isActive: false } });
    return R.success(res, null, "Designation deactivated successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};
