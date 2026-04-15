import { verifyAccessToken } from "../utils/jwt.js";
import { isTokenBlacklisted } from "../utils/redis.js";
import { unauthorized } from "../utils/response.js";
import prisma from "../config/prisma.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return unauthorized(res, "Access token required");
    }

    const token = authHeader.split(" ")[1];

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return unauthorized(res, "Token has been revoked");

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true, organisationId: true },
    });

    if (!user || !user.isActive) return unauthorized(res, "User not found or inactive");

    req.user = user;
    if (user.role === "PLATFORM_ADMIN") {
      const headerOrgId = req.headers["x-org-id"];
      req.organisationId = headerOrgId ? Number(headerOrgId) : null;
      req.isPlatformAdmin = true;
    } else {
      req.organisationId = user.organisationId;
    }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return unauthorized(res, "Token expired");
    if (err.name === "JsonWebTokenError") return unauthorized(res, "Invalid token");
    return unauthorized(res, "Authentication failed");
  }
};
