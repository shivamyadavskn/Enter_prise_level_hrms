import { forbidden } from "../utils/response.js";

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
  FINANCE: "FINANCE",
};

const ROLE_HIERARCHY = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  MANAGER: 3,
  FINANCE: 2,
  EMPLOYEE: 1,
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return forbidden(res);
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
