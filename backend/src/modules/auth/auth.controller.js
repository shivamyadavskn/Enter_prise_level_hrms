import bcrypt from "bcryptjs";
import prisma from "../../config/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { blacklistToken, isTokenBlacklisted } from "../../utils/redis.js";
import * as R from "../../utils/response.js";
import {
  isLockedOut, recordFailedLogin, clearFailedLogins, validatePasswordPolicy,
} from "../../utils/authSecurity.js";
import { logAudit } from "../../services/audit.service.js";
import { verifyTotpForLogin } from "./twofa.controller.js";

export const login = async (req, res) => {
  try {
    const { email, password, totp } = req.body;

    // SECURITY: account lockout check (Redis-backed)
    if (await isLockedOut(email)) {
      return R.unauthorized(res, "Account temporarily locked due to too many failed attempts. Try again in 15 minutes.");
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        organisation: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    });

    if (!user || !user.isActive) {
      await recordFailedLogin(email);
      return R.unauthorized(res, "Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const { locked, remaining } = await recordFailedLogin(email);
      logAudit({
        userId: user.id, organisationId: user.organisationId,
        action: "LOGIN_FAILED", module: "auth", entityId: user.id, entityType: "User",
        description: locked ? "Account locked after repeated failures" : `Invalid password (${remaining} attempts left)`,
        req,
      });
      if (locked) return R.unauthorized(res, "Account locked due to too many failed attempts. Try again in 15 minutes.");
      return R.unauthorized(res, "Invalid credentials");
    }

    // 2FA challenge (after password verified, before tokens issued)
    if (user.twoFactorEnabled) {
      if (!totp) {
        return res.status(200).json({
          success: false,
          twoFactorRequired: true,
          message: "Two-factor authentication required. Provide the 6-digit code from your authenticator app.",
        });
      }
      const ok2fa = await verifyTotpForLogin(user, totp);
      if (!ok2fa) {
        await recordFailedLogin(email);
        logAudit({
          userId: user.id, organisationId: user.organisationId,
          action: "2FA_FAILED", module: "auth", entityId: user.id, entityType: "User",
          description: "Invalid 2FA code at login", req,
        });
        return R.unauthorized(res, "Invalid 2FA code");
      }
    }

    // Successful login
    await clearFailedLogins(email);

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

    logAudit({
      userId: user.id, organisationId: user.organisationId,
      action: "LOGIN", module: "auth", entityId: user.id, entityType: "User",
      description: "User logged in", req,
    });

    return R.success(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organisationId: user.organisationId,
        employee: user.employee,
        organisation: user.organisation,
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

    if (req.user?.id) {
      logAudit({
        userId: req.user.id, organisationId: req.user.organisationId,
        action: "LOGOUT", module: "auth", entityId: req.user.id, entityType: "User",
        description: "User logged out", req,
      });
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
        organisation: { select: { id: true, name: true, slug: true, logoUrl: true, pfEnabled: true, esicEnabled: true } },
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

    // SECURITY: enforce password policy on every change
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.ok) return R.badRequest(res, policy.errors.join(". "));

    if (currentPassword === newPassword) {
      return R.badRequest(res, "New password must be different from the current password");
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return R.badRequest(res, "Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });

    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } });

    logAudit({
      userId: req.user.id, organisationId: req.user.organisationId,
      action: "PASSWORD_CHANGE", module: "auth", entityId: req.user.id, entityType: "User",
      description: "User changed their password", req,
    });

    return R.success(res, null, "Password changed successfully. Please login again.");
  } catch (err) {
    return R.error(res, err.message);
  }
};
