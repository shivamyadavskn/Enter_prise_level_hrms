import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { sendUserInvite } from "../../services/email.service.js";

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
    const skip = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: Number(limit), select: userSelect, orderBy: { createdAt: "desc" } }),
      prisma.user.count({ where }),
    ]);

    return R.paginated(res, users, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) }, select: userSelect });
    if (!user) return R.notFound(res, "User not found");
    return R.success(res, user);
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

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return R.badRequest(res, "Email already exists");

    if (role === "SUPER_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return R.forbidden(res, "Cannot assign SUPER_ADMIN role");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash, role },
      select: userSelect,
    });

    sendUserInvite({ email, username, password, role }).catch(() => {});

    return R.created(res, user, "User created successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateUser = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return R.notFound(res, "User not found");

    if (req.body.role === "SUPER_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return R.forbidden(res, "Cannot assign SUPER_ADMIN role");
    }

    const user = await prisma.user.update({
      where: { id },
      data: req.body,
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
    if (id === req.user.id) return R.badRequest(res, "Cannot delete your own account");

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return R.notFound(res, "User not found");

    await prisma.user.delete({ where: { id } });
    return R.success(res, null, "User deleted successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const toggleUserActive = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return R.notFound(res, "User not found");

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
