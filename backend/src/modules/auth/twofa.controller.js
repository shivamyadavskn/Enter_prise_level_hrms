import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { encrypt, decrypt } from "../../utils/crypto.js";
import { logAudit } from "../../services/audit.service.js";

authenticator.options = { window: 1, step: 30 };  // ±30s clock drift tolerance

const APP_NAME = "PeopleOS";

/**
 * POST /api/auth/2fa/enroll
 * Generates a TOTP secret + QR code (data URL) for the current user.
 * Secret is stored encrypted but `twoFactorEnabled` stays false until
 * the user verifies a code via /verify-enroll.
 */
export const enroll = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return R.notFound(res, "User not found");
    if (user.twoFactorEnabled) return R.badRequest(res, "2FA already enabled. Disable first to re-enroll.");

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, APP_NAME, secret);
    const qrDataUrl = await qrcode.toDataURL(otpauth);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: encrypt(secret) },
    });

    return R.success(res, {
      secret,        // shown once for manual entry
      otpauth,       // URI for authenticator apps
      qrCode: qrDataUrl,
    }, "Scan the QR code in your authenticator app, then verify a code to activate 2FA.");
  } catch (err) {
    return R.error(res, err.message);
  }
};

/**
 * POST /api/auth/2fa/verify-enroll  { token }
 * Activates 2FA after the user proves they have the secret.
 * Generates 10 single-use backup codes.
 */
export const verifyEnroll = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return R.badRequest(res, "Token required");

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.twoFactorSecret) return R.badRequest(res, "Run /enroll first");
    if (user.twoFactorEnabled) return R.badRequest(res, "2FA already enabled");

    const secret = decrypt(user.twoFactorSecret);
    const valid = authenticator.check(String(token).replace(/\s/g, ""), secret);
    if (!valid) return R.badRequest(res, "Invalid code. Try again.");

    // Generate & hash 10 backup codes (8 chars each)
    const plainCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );
    const hashed = await Promise.all(plainCodes.map((c) => bcrypt.hash(c, 10)));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorEnrolledAt: new Date(),
        backupCodes: hashed,
      },
    });

    logAudit({
      userId: user.id, organisationId: user.organisationId,
      action: "2FA_ENABLED", module: "auth", entityId: user.id, entityType: "User",
      description: "User enabled two-factor authentication", req,
    });

    return R.success(res, {
      backupCodes: plainCodes,
      warning: "Save these backup codes now. They will not be shown again.",
    }, "Two-factor authentication enabled");
  } catch (err) {
    return R.error(res, err.message);
  }
};

/**
 * POST /api/auth/2fa/disable  { password, token? }
 * Disabling requires re-authentication with password (and TOTP if enabled).
 */
export const disable = async (req, res) => {
  try {
    const { password, token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return R.notFound(res, "User not found");

    const okPwd = await bcrypt.compare(password || "", user.passwordHash);
    if (!okPwd) return R.unauthorized(res, "Password incorrect");

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const secret = decrypt(user.twoFactorSecret);
      const ok = authenticator.check(String(token || "").replace(/\s/g, ""), secret);
      if (!ok) return R.unauthorized(res, "Invalid 2FA code");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorEnrolledAt: null,
        backupCodes: null,
      },
    });

    logAudit({
      userId: user.id, organisationId: user.organisationId,
      action: "2FA_DISABLED", module: "auth", entityId: user.id, entityType: "User",
      description: "User disabled two-factor authentication", req,
    });

    return R.success(res, null, "Two-factor authentication disabled");
  } catch (err) {
    return R.error(res, err.message);
  }
};

/**
 * Verifies a TOTP token (or backup code) for `user`.
 * Used inside the login flow when `twoFactorEnabled` is true.
 * Returns true on success. If a backup code was used it's consumed.
 */
export async function verifyTotpForLogin(user, token) {
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) return true;
  if (!token) return false;

  const cleaned = String(token).replace(/\s/g, "");

  // 1) Try TOTP
  const secret = decrypt(user.twoFactorSecret);
  if (authenticator.check(cleaned, secret)) return true;

  // 2) Try backup codes
  const codes = Array.isArray(user.backupCodes) ? user.backupCodes : [];
  for (let i = 0; i < codes.length; i++) {
    const ok = await bcrypt.compare(cleaned.toUpperCase(), codes[i]);
    if (ok) {
      // consume code
      const remaining = codes.filter((_, idx) => idx !== i);
      await prisma.user.update({ where: { id: user.id }, data: { backupCodes: remaining } });
      return true;
    }
  }
  return false;
}

/** GET /api/auth/2fa/status -> { enabled, enrolledAt, backupCodesRemaining } */
export const status = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  return R.success(res, {
    enabled: !!user?.twoFactorEnabled,
    enrolledAt: user?.twoFactorEnrolledAt,
    backupCodesRemaining: Array.isArray(user?.backupCodes) ? user.backupCodes.length : 0,
  });
};
