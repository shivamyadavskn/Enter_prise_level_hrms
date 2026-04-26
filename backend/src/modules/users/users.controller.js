import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { sendUserInvite } from "../../services/email.service.js";
import { validatePasswordPolicy } from "../../utils/authSecurity.js";

const userSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
};

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, isActive, search } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    // SECURITY: org scoping — non-platform-admins can only see users in their org
    if (req.organisationId) where.organisationId = req.organisationId;
    if (role) where.role = role;
    // FIX: coerce isActive query string -> boolean
    if (isActive !== undefined) where.isActive = isActive === "true" || isActive === true;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limitNum, select: userSelect, orderBy: { createdAt: "desc" } }),
      prisma.user.count({ where }),
    ]);

    return R.paginated(res, users, total, pageNum, limitNum);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getUserById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return R.notFound(res, "User not found");
    const user = await prisma.user.findUnique({
      where: { id },
      select: { ...userSelect, organisationId: true },
    });
    if (!user) return R.notFound(res, "User not found");
    // SECURITY: prevent IDOR across organisations
    if (req.organisationId && user.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");
    const { organisationId, ...safe } = user;
    return R.success(res, safe);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    // Auto-generate username from email prefix if not provided
    const baseUsername = (req.body.username || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]/g, "");
    let username = baseUsername;
    let suffix = 1;
    while (await prisma.user.findFirst({ where: { username } })) {
      username = `${baseUsername}${suffix++}`;
    }

    // Email uniqueness should be checked org-scoped (same email allowed in different orgs)
    const dupWhere = { email };
    if (req.organisationId) dupWhere.organisationId = req.organisationId;
    const existing = await prisma.user.findFirst({ where: dupWhere });
    if (existing) return R.badRequest(res, "Email already exists");

    if (role === "SUPER_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return R.forbidden(res, "Cannot assign SUPER_ADMIN role");
    }
    if (role === "PLATFORM_ADMIN" && req.user.role !== "PLATFORM_ADMIN") {
      return R.forbidden(res, "Cannot assign PLATFORM_ADMIN role");
    }

    // SECURITY: enforce password policy
    const policy = validatePasswordPolicy(password);
    if (!policy.ok) return R.badRequest(res, policy.errors.join(". "));

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role,
        // Always inherit the creator's organisation so the new user is org-scoped.
        organisationId: req.organisationId || undefined,
      },
      select: userSelect,
    });

    sendUserInvite({ email, username, password, role }).catch(() => {});

    return R.created(res, user, "User created successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};


// Fields that must NEVER be settable through PUT /users/:id
const FORBIDDEN_USER_UPDATE_FIELDS = [
  "id", "passwordHash", "password", "organisationId",
  "createdAt", "updatedAt", "lastLogin",
];

export const updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return R.notFound(res, "User not found");

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return R.notFound(res, "User not found");

    // SECURITY: cross-org IDOR check
    if (req.organisationId && existing.organisationId !== req.organisationId) {
      return R.forbidden(res, "Access denied");
    }

    if (req.body.role === "SUPER_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return R.forbidden(res, "Cannot assign SUPER_ADMIN role");
    }
    if (req.body.role === "PLATFORM_ADMIN" && req.user.role !== "PLATFORM_ADMIN") {
      return R.forbidden(res, "Cannot assign PLATFORM_ADMIN role");
    }

    // SECURITY: strip dangerous fields from request body
    const safeData = { ...req.body };
    for (const f of FORBIDDEN_USER_UPDATE_FIELDS) delete safeData[f];

    const user = await prisma.user.update({
      where: { id },
      data: safeData,
      select: userSelect,
    });

    return R.success(res, user, "User updated successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return R.notFound(res, "User not found");
    if (id === req.user.id) return R.badRequest(res, "Cannot delete your own account");

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return R.notFound(res, "User not found");
    // SECURITY: cross-org IDOR
    if (req.organisationId && existing.organisationId !== req.organisationId) {
      return R.forbidden(res, "Access denied");
    }

    await prisma.user.delete({ where: { id } });
    return R.success(res, null, "User deleted successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const toggleUserActive = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return R.notFound(res, "User not found");
    if (id === req.user.id) return R.badRequest(res, "Cannot deactivate your own account");

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return R.notFound(res, "User not found");
    // SECURITY: cross-org IDOR
    if (req.organisationId && user.organisationId !== req.organisationId) {
      return R.forbidden(res, "Access denied");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: userSelect,
    });

    return R.success(res, updated, `User ${updated.isActive ? "activated" : "deactivated"} successfully`);
  } catch (err) {
    return R.error(res, err.message);
  }
};
