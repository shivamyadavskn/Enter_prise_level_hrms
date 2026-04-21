import prisma from "../config/prisma.js";
import { forbidden } from "../utils/response.js";

// Default permissions matrix — imported from permissions controller pattern
const DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: { employees: ["view","create","update","delete"], departments: ["view","create","update","delete"], designations: ["view","create","update","delete"], leaves: ["view","apply","approve","reject","manage_types","allocate"], attendance: ["view","clock","approve","regularize"], wfh: ["view","apply","approve","reject"], payroll: ["view","process","salary_setup","payment_status"], performance: ["view","create","appraise"], documents: ["view","upload","delete","generate"], reports: ["view","export"], holidays: ["view","create","update","delete"], reimbursements: ["view","create","approve","reject","policies"], onboarding: ["view","manage_tasks","assign"], announcements: ["view","create","update","delete","pin"], assets: ["view","create","update","delete","assign"], organisation: ["view","update"], users: ["view","create","update","delete"], permissions: ["view","update"], audit_logs: ["view"], travel_claims: ["view","create","approve","reject"], pulse: ["view","create","manage"] },
  ADMIN:       { employees: ["view","create","update","delete"], departments: ["view","create","update","delete"], designations: ["view","create","update","delete"], leaves: ["view","apply","approve","reject","manage_types","allocate"], attendance: ["view","clock","approve","regularize"], wfh: ["view","apply","approve","reject"], payroll: ["view","process","salary_setup","payment_status"], performance: ["view","create","appraise"], documents: ["view","upload","delete","generate"], reports: ["view","export"], holidays: ["view","create","update","delete"], reimbursements: ["view","create","approve","reject","policies"], onboarding: ["view","manage_tasks","assign"], announcements: ["view","create","update","delete","pin"], assets: ["view","create","update","delete","assign"], organisation: ["view","update"], users: ["view","create","update"], permissions: ["view","update"], audit_logs: ["view"], travel_claims: ["view","create","approve","reject"], pulse: ["view","create","manage"] },
  // HR: Full people-ops access — manage employees, leaves, attendance, onboarding, documents.
  // No payroll processing, no system user/permission management (those stay with ADMIN/SUPER_ADMIN).
  HR:          { employees: ["view","create","update"], departments: ["view","create","update"], designations: ["view","create","update"], leaves: ["view","apply","approve","reject","manage_types","allocate"], attendance: ["view","clock","approve","regularize"], wfh: ["view","apply","approve","reject"], payroll: ["view"], performance: ["view","create","appraise"], documents: ["view","upload","delete","generate"], reports: ["view","export"], holidays: ["view","create","update"], reimbursements: ["view","create","approve","reject"], onboarding: ["view","manage_tasks","assign"], announcements: ["view","create","update","pin"], assets: ["view","create","update","assign"], organisation: ["view"], users: ["view"], audit_logs: ["view"], travel_claims: ["view","create","approve","reject"], pulse: ["view","create","manage"] },
  MANAGER:     { employees: ["view"], departments: ["view"], designations: ["view"], leaves: ["view","apply","approve","reject"], attendance: ["view","clock","approve"], wfh: ["view","apply","approve","reject"], payroll: ["view"], performance: ["view","create","appraise"], documents: ["view","upload"], reports: ["view","export"], holidays: ["view"], reimbursements: ["view","create","approve","reject"], onboarding: ["view","assign"], announcements: ["view","create"], assets: ["view"], travel_claims: ["view","create","approve","reject"], pulse: ["view","respond"] },
  FINANCE:     { employees: ["view"], departments: ["view"], designations: ["view"], leaves: ["view","apply"], attendance: ["view","clock"], wfh: ["view","apply"], payroll: ["view","process","salary_setup","payment_status"], performance: ["view"], documents: ["view","upload","generate"], reports: ["view","export"], holidays: ["view"], reimbursements: ["view","create","approve","reject","policies"], onboarding: ["view"], announcements: ["view"], assets: ["view"], travel_claims: ["view","create","approve","reject"], pulse: ["view","respond"] },
  EMPLOYEE:    { employees: ["view_self"], departments: ["view"], designations: ["view"], leaves: ["view","apply"], attendance: ["view","clock","regularize"], wfh: ["view","apply"], payroll: ["view_self"], performance: ["view_self","appraise_self"], documents: ["view","upload"], reports: [], holidays: ["view"], reimbursements: ["view","create"], onboarding: ["view"], announcements: ["view"], assets: ["view_self"], travel_claims: ["view","create"], pulse: ["view","respond"] },
  // INTERN: Same as EMPLOYEE base. Customised at org level via CustomRole assigned to the employee.
  INTERN:      { employees: ["view_self"], departments: ["view"], designations: ["view"], leaves: ["view","apply"], attendance: ["view","clock","regularize"], wfh: ["view","apply"], payroll: ["view_self"], performance: ["view_self"], documents: ["view","upload"], reports: [], holidays: ["view"], reimbursements: ["view","create"], onboarding: ["view"], announcements: ["view"], assets: ["view_self"], travel_claims: ["view","create"], pulse: ["view","respond"] },
};

/**
 * Granular permission middleware.
 * Checks DB-level permission overrides, then falls back to defaults.
 * 
 * Usage: checkPermission("payroll", "process")
 */
export const checkPermission = (module, action) => {
  return async (req, res, next) => {
    if (!req.user) return forbidden(res);

    // Platform admin bypasses everything
    if (req.user.role === "PLATFORM_ADMIN") return next();

    const role = req.user.role;
    const orgId = req.organisationId || null;

    // ── 1. Resolve custom role for this employee (if any) ────────────────────
    // If the employee has a CustomRole assigned, its permissions take precedence
    // over (and extend) the base system role's default permissions.
    let effectivePermissions = null;
    try {
      if (req.user.id) {
        const employee = await prisma.employee.findFirst({
          where: { userId: req.user.id },
          include: { customRole: { select: { baseRole: true, permissions: true, isActive: true } } },
        });
        if (employee?.customRole?.isActive) {
          // Merge: base role defaults + custom role permission overrides
          const base = DEFAULT_PERMISSIONS[employee.customRole.baseRole] || DEFAULT_PERMISSIONS[role] || {};
          const custom = employee.customRole.permissions || {};
          // Custom role permissions REPLACE module-level arrays from the base
          effectivePermissions = { ...base, ...custom };
        }
      }
    } catch {
      // If custom role lookup fails, fall through to system role defaults
    }

    // ── 2. Check DB role permission override (org-level) ──────────────────────
    try {
      const dbPerm = await prisma.permission.findUnique({
        where: { module_action: { module, action } },
      });

      if (dbPerm) {
        const rolePerm = await prisma.rolePermission.findFirst({
          where: {
            permissionId: dbPerm.id,
            role,
            ...(orgId ? { organisationId: orgId } : {}),
          },
        });

        if (rolePerm) {
          if (rolePerm.granted) return next();
          return forbidden(res, `Permission denied: ${module}.${action}`);
        }
      }
    } catch {
      // DB lookup failed — fall back to defaults
    }

    // ── 3. Fall back to effective permissions (custom role or system role) ────
    const roleDefaults = effectivePermissions || DEFAULT_PERMISSIONS[role];
    if (!roleDefaults) return forbidden(res, "Unknown role");

    const moduleActions = roleDefaults[module];
    if (!moduleActions || !moduleActions.includes(action)) {
      return forbidden(res, `Permission denied: ${module}.${action}`);
    }

    next();
  };
};

/**
 * Get the full default permissions matrix for reference.
 */
export const getDefaultPermissionsMatrix = () => DEFAULT_PERMISSIONS;
