import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

const deptInclude = {
  head: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
  _count: { select: { employees: true } },
};

export const getDepartments = async (req, res) => {
  try {
    const { page = 1, limit = 50, isActive, search } = req.query;
    const where = {};
    if (req.organisationId) where.organisationId = req.organisationId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];

    const [departments, total] = await Promise.all([
      prisma.department.findMany({ where, skip: (page - 1) * limit, take: Number(limit), include: deptInclude }),
      prisma.department.count({ where }),
    ]);

    return R.paginated(res, departments, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        ...deptInclude,
        employees: {
          where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
          select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: { select: { name: true } } },
        },
      },
    });
    if (!dept) return R.notFound(res, "Department not found");
    return R.success(res, dept);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createDepartment = async (req, res) => {
  try {
    const existing = await prisma.department.findFirst({ where: { code: req.body.code, organisationId: req.organisationId || null } });
    if (existing) return R.badRequest(res, "Department code already exists");

    const dept = await prisma.department.create({ data: { ...req.body, organisationId: req.organisationId || undefined }, include: deptInclude });
    return R.created(res, dept, "Department created successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const dept = await prisma.department.update({ where: { id }, data: req.body, include: deptInclude });
    return R.success(res, dept, "Department updated successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const empCount = await prisma.employee.count({ where: { departmentId: id, employmentStatus: { in: ["ACTIVE", "PROBATION"] } } });
    if (empCount > 0) return R.badRequest(res, `Cannot delete department with ${empCount} active employees`);

    await prisma.department.update({ where: { id }, data: { isActive: false } });
    return R.success(res, null, "Department deactivated successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};
