import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { blacklistToken, isTokenBlacklisted } from "../../utils/redis.js";
import * as R from "../../utils/response.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
    });

    if (!user || !user.isActive) return R.unauthorized(res, "Invalid credentials");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return R.unauthorized(res, "Invalid credentials");

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    return R.success(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee,
      },
    }, "Login successful");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return R.unauthorized(res, "Token revoked");

    const decoded = verifyRefreshToken(token);

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      return R.unauthorized(res, "Refresh token invalid or expired");
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) return R.unauthorized(res, "User not found");

    const payload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await prisma.refreshToken.delete({ where: { token } });
    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    return R.success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, "Token refreshed");
  } catch (err) {
    return R.unauthorized(res, "Invalid refresh token");
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (token) {
      await blacklistToken(token, 15 * 60);
    }

    const { refreshToken: rt } = req.body;
    if (rt) {
      await prisma.refreshToken.deleteMany({ where: { token: rt } });
    }

    return R.success(res, null, "Logged out successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        employee: {
          include: {
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, name: true } },
            manager: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    return R.success(res, user);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return R.badRequest(res, "Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });

    return R.success(res, null, "Password changed successfully. Please login again.");
  } catch (err) {
    return R.error(res, err.message);
  }
};
