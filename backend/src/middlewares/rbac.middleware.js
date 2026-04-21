import { forbidden } from "../utils/response.js";

export const UserRole = {
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  HR: "HR",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
  FINANCE: "FINANCE",
};

const ROLE_HIERARCHY = {
  PLATFORM_ADMIN: 99,
  SUPER_ADMIN: 5,
  ADMIN: 4,
  HR: 3,
  MANAGER: 3,
  FINANCE: 2,
  EMPLOYEE: 1,
  INTERN: 1,
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res);
    if (req.user.role === "PLATFORM_ADMIN") return next();
    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(res, `Access restricted to: ${allowedRoles.join(", ")}`);
    }
    next();
  };
};

export const authorizeMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res);
    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0;
    const minLevel = ROLE_HIERARCHY[minRole] ?? 0;
    if (userLevel < minLevel) {
      return forbidden(res, "Insufficient permissions");
    }
    next();
  };
};

export const authorizeOrSelf = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res);
    const targetUserId = parseInt(req.params.userId || req.params.id);
    if (req.user.id === targetUserId) return next();
    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(res, "Access denied");
    }
    next();
  };
};
