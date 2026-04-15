import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import * as R from "../../utils/response.js";

export const listOrganisations = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
      : {};

    const [orgs, total] = await Promise.all([
      prisma.organisation.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { employees: true, users: true } },
        },
      }),
      prisma.organisation.count({ where }),
    ]);

    const result = await Promise.all(
      orgs.map(async (org) => {
        const superAdmin = await prisma.user.findFirst({
          where: { organisationId: org.id, role: "SUPER_ADMIN" },
          select: { email: true, createdAt: true },
        });
        const activeEmployees = await prisma.employee.count({
          where: { organisationId: org.id, employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
        });
        return {
          ...org,
          superAdminEmail: superAdmin?.email || null,
          activeEmployees,
          totalEmployees: org._count.employees,
          totalUsers: org._count.users,
        };
      })
    );

    return R.paginated(res, result, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getOrganisationDetail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const org = await prisma.organisation.findUnique({
      where: { id },
      include: { _count: { select: { employees: true, users: true } } },
    });
    if (!org) return R.notFound(res, "Organisation not found");

    const [activeEmployees, pendingLeaves, todayAttendance, superAdmins] = await Promise.all([
      prisma.employee.count({ where: { organisationId: id, employmentStatus: { in: ["ACTIVE", "PROBATION"] } } }),
      prisma.leaveApplication.count({ where: { employee: { organisationId: id }, status: "PENDING" } }),
      prisma.attendance.count({ where: { employee: { organisationId: id }, date: new Date(new Date().setHours(0,0,0,0)), status: { in: ["PRESENT", "WFH"] } } }),
      prisma.user.findMany({ where: { organisationId: id, role: "SUPER_ADMIN" }, select: { id: true, email: true, createdAt: true } }),
    ]);

    return R.success(res, { ...org, activeEmployees, pendingLeaves, todayAttendance, superAdmins });
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getPlatformStats = async (req, res) => {
  try {
    const [totalOrgs, totalEmployees, totalUsers, newOrgsThisMonth] = await Promise.all([
      prisma.organisation.count(),
      prisma.employee.count({ where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } } }),
      prisma.user.count({ where: { role: { not: "PLATFORM_ADMIN" } } }),
      prisma.organisation.count({
        where: { createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
    ]);
    return R.success(res, { totalOrgs, totalEmployees, totalUsers, newOrgsThisMonth });
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const seedPlatformAdmin = async (req, res) => {
  try {
    const existing = await prisma.user.findFirst({ where: { role: "PLATFORM_ADMIN" } });
    if (existing) return R.badRequest(res, "Platform admin already exists");

    const { email, password } = req.body;
    if (!email || !password) return R.badRequest(res, "email and password required");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username: "platform_admin", email, passwordHash, role: "PLATFORM_ADMIN", organisationId: null },
    });

    return R.created(res, { id: user.id, email: user.email }, "Platform admin created. Please login.");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const toggleOrgStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const org = await prisma.organisation.findUnique({ where: { id } });
    if (!org) return R.notFound(res, "Organisation not found");

    const updated = await prisma.organisation.update({ where: { id }, data: { isActive: !org.isActive } });
    return R.success(res, updated, `Organisation ${updated.isActive ? "activated" : "deactivated"}`);
  } catch (err) {
    return R.error(res, err.message);
  }
};
