import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { logAudit } from "../../services/audit.service.js";

// Default permissions matrix — defines what each role CAN do out of the box
const DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: { employees: ["view","create","update","delete"], departments: ["view","create","update","delete"], designations: ["view","create","update","delete"], leaves: ["view","apply","approve","reject","manage_types","allocate"], attendance: ["view","clock","approve","regularize"], wfh: ["view","apply","approve","reject"], payroll: ["view","process","salary_setup","payment_status"], performance: ["view","create","appraise"], documents: ["view","upload","delete","generate"], reports: ["view","export"], holidays: ["view","create","update","delete"], reimbursements: ["view","create","approve","reject","policies"], onboarding: ["view","manage_tasks","assign"], announcements: ["view","create","update","delete","pin"], assets: ["view","create","update","delete","assign"], organisation: ["view","update"], users: ["view","create","update","delete"], permissions: ["view","update"], audit_logs: ["view"] },
  ADMIN:       { employees: ["view","create","update","delete"], departments: ["view","create","update","delete"], designations: ["view","create","update","delete"], leaves: ["view","apply","approve","reject","manage_types","allocate"], attendance: ["view","clock","approve","regularize"], wfh: ["view","apply","approve","reject"], payroll: ["view","process","salary_setup","payment_status"], performance: ["view","create","appraise"], documents: ["view","upload","delete","generate"], reports: ["view","export"], holidays: ["view","create","update","delete"], reimbursements: ["view","create","approve","reject","policies"], onboarding: ["view","manage_tasks","assign"], announcements: ["view","create","update","delete","pin"], assets: ["view","create","update","delete","assign"], organisation: ["view","update"], users: ["view","create","update"], permissions: ["view","update"], audit_logs: ["view"] },
  MANAGER:     { employees: ["view"], departments: ["view"], designations: ["view"], leaves: ["view","apply","approve","reject"], attendance: ["view","clock","approve"], wfh: ["view","apply","approve","reject"], payroll: ["view"], performance: ["view","create","appraise"], documents: ["view","upload"], reports: ["view","export"], holidays: ["view"], reimbursements: ["view","create","approve","reject"], onboarding: ["view","assign"], announcements: ["view","create"], assets: ["view"] },
  FINANCE:     { employees: ["view"], departments: ["view"], designations: ["view"], leaves: ["view","apply"], attendance: ["view","clock"], wfh: ["view","apply"], payroll: ["view","process","salary_setup","payment_status"], performance: ["view"], documents: ["view","upload","generate"], reports: ["view","export"], holidays: ["view"], reimbursements: ["view","create","approve","reject","policies"], onboarding: ["view"], announcements: ["view"], assets: ["view"] },
  EMPLOYEE:    { employees: ["view_self"], departments: ["view"], designations: ["view"], leaves: ["view","apply"], attendance: ["view","clock","regularize"], wfh: ["view","apply"], payroll: ["view_self"], performance: ["view_self","appraise_self"], documents: ["view","upload"], reports: [], holidays: ["view"], reimbursements: ["view","create"], onboarding: ["view"], announcements: ["view"], assets: ["view_self"] },
};

export const getPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
    return R.success(res, permissions);
  } catch (err) { return R.error(res, err.message); }
};

export const getRolePermissions = async (req, res) => {
  try {
    const orgId = req.organisationId || null;
    const rolePerms = await prisma.rolePermission.findMany({
      where: { organisationId: orgId },
      include: { permission: true },
    });

    // Build matrix: { ROLE: { "module.action": true/false } }
    const matrix = {};
    for (const role of Object.keys(DEFAULT_PERMISSIONS)) {
      matrix[role] = {};
      const defaults = DEFAULT_PERMISSIONS[role];
      for (const [mod, actions] of Object.entries(defaults)) {
        for (const action of actions) {
          matrix[role][`${mod}.${action}`] = true;
        }
      }
    }

    // Apply overrides from DB
    for (const rp of rolePerms) {
      const key = `${rp.permission.module}.${rp.permission.action}`;
      if (!matrix[rp.role]) matrix[rp.role] = {};
      matrix[rp.role][key] = rp.granted;
    }

    return R.success(res, { matrix, defaults: DEFAULT_PERMISSIONS });
  } catch (err) { return R.error(res, err.message); }
};

export const updateRolePermission = async (req, res) => {
  try {
    const orgId = req.organisationId || null;
    const { role, module: mod, action, granted } = req.body;

    if (!role || !mod || !action || typeof granted !== "boolean") {
      return R.badRequest(res, "role, module, action, and granted are required");
    }

    // Prevent editing SUPER_ADMIN or PLATFORM_ADMIN
    if (role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN") {
      return R.forbidden(res, "Cannot modify Super Admin or Platform Admin permissions");
    }

    let permission = await prisma.permission.findUnique({ where: { module_action: { module: mod, action } } });
    if (!permission) {
      permission = await prisma.permission.create({ data: { module: mod, action, description: `${mod} → ${action}` } });
    }

    const rp = await prisma.rolePermission.upsert({
      where: { organisationId_role_permissionId: { organisationId: orgId ?? 0, role, permissionId: permission.id } },
      update: { granted },
      create: { organisationId: orgId, role, permissionId: permission.id, granted },
    });

    await logAudit({ userId: req.user.id, organisationId: orgId, action: "UPDATE", module: "permissions", description: `${role}: ${mod}.${action} → ${granted}`, req });

    return R.success(res, rp, "Permission updated");
  } catch (err) { return R.error(res, err.message); }
};

export const bulkUpdateRolePermissions = async (req, res) => {
  try {
    const orgId = req.organisationId || null;
    const { role, permissions: permsList } = req.body;
    // permsList: [{ module, action, granted }]

    if (role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN") {
      return R.forbidden(res, "Cannot modify Super Admin or Platform Admin permissions");
    }

    for (const p of permsList) {
      let perm = await prisma.permission.findUnique({ where: { module_action: { module: p.module, action: p.action } } });
      if (!perm) {
        perm = await prisma.permission.create({ data: { module: p.module, action: p.action, description: `${p.module} → ${p.action}` } });
      }

      await prisma.rolePermission.upsert({
        where: { organisationId_role_permissionId: { organisationId: orgId ?? 0, role, permissionId: perm.id } },
        update: { granted: p.granted },
        create: { organisationId: orgId, role, permissionId: perm.id, granted: p.granted },
      });
    }

    await logAudit({ userId: req.user.id, organisationId: orgId, action: "UPDATE", module: "permissions", description: `Bulk update for ${role}: ${permsList.length} permissions`, req });

    return R.success(res, null, `Updated ${permsList.length} permissions for ${role}`);
  } catch (err) { return R.error(res, err.message); }
};

export const seedDefaultPermissions = async (req, res) => {
  try {
    let created = 0;
    for (const [, actions] of Object.entries(DEFAULT_PERMISSIONS.SUPER_ADMIN)) {
      // actions is an array, but we actually need the module name too
    }
    // Seed all unique module.action pairs
    const allPairs = new Set();
    for (const rolePerms of Object.values(DEFAULT_PERMISSIONS)) {
      for (const [mod, actions] of Object.entries(rolePerms)) {
        for (const action of actions) {
          allPairs.add(`${mod}|${action}`);
        }
      }
    }

    for (const pair of allPairs) {
      const [mod, action] = pair.split("|");
      const existing = await prisma.permission.findUnique({ where: { module_action: { module: mod, action } } });
      if (!existing) {
        await prisma.permission.create({ data: { module: mod, action, description: `${mod} → ${action}` } });
        created++;
      }
    }

    return R.success(res, { created }, `Seeded ${created} permissions`);
  } catch (err) { return R.error(res, err.message); }
};

export const getDefaultPermissions = async (_req, res) => {
  try {
    return R.success(res, DEFAULT_PERMISSIONS);
  } catch (err) { return R.error(res, err.message); }
};

/**
 * Comprehensive Role Access Matrix — human-readable breakdown of what each role can do.
 * This is the reference endpoint for the frontend's permission/role UI.
 */
export const getRoleAccessMatrix = async (_req, res) => {
  try {
    const matrix = {
      PLATFORM_ADMIN: {
        description: "God mode — full system access across all organisations",
        scope: "All organisations",
        capabilities: [
          "Create, update, and delete organisations",
          "Impersonate any user in any organisation",
          "Access all modules across all orgs via X-Org-Id header",
          "Manage platform-level settings",
          "View audit logs for all organisations",
          "Cannot be modified or restricted by any other role",
        ],
        modules: "All modules with full access",
      },
      SUPER_ADMIN: {
        description: "Organisation owner — full control within their organisation",
        scope: "Own organisation only",
        capabilities: [
          "Full employee lifecycle management (create, update, terminate)",
          "Department and designation management",
          "Leave type configuration and leave allocation",
          "Full payroll access: salary setup, processing, payment status, adjustments",
          "Approve/reject leaves, WFH, regularizations, reimbursements, travel claims",
          "Performance review management",
          "Document management including generation (offer letters, etc.)",
          "Full report access including analytics and anomaly detection",
          "Holiday management",
          "Reimbursement and expense policy management",
          "Onboarding task management",
          "Announcement creation with pin capability",
          "Full asset tracking (create, assign, retire)",
          "Organisation settings management",
          "User account management (create, update, delete users)",
          "Permission matrix management (view, update role permissions)",
          "Audit log access",
          "Pulse survey creation and management",
          "Travel claim approval and analytics",
        ],
        restrictions: ["Cannot access other organisations", "Cannot create PLATFORM_ADMIN users"],
      },
      ADMIN: {
        description: "HR Administrator — day-to-day HR operations",
        scope: "Own organisation only",
        capabilities: [
          "Employee management (create, update, delete)",
          "Department and designation management",
          "Leave management (approve, reject, configure types, allocate)",
          "Attendance management (approve, regularize)",
          "WFH request approval",
          "Full payroll access (process, salary setup, payment status)",
          "Performance reviews (create, appraise)",
          "Document management (upload, delete, generate)",
          "Full report access with export",
          "Holiday management",
          "Reimbursement approval and expense policies",
          "Onboarding management",
          "Announcement management (create, update, delete, pin)",
          "Asset management (create, assign, retire)",
          "Organisation settings (view, update)",
          "User management (create, update — cannot delete)",
          "Permission matrix (view, update)",
          "Audit log access",
          "Pulse survey creation and management",
          "Travel claim approval",
        ],
        restrictions: ["Cannot delete users", "Cannot modify SUPER_ADMIN permissions"],
      },
      FINANCE: {
        description: "Finance team — payroll and financial operations",
        scope: "Organisation-wide financial data",
        capabilities: [
          "View employees (read-only)",
          "View departments and designations",
          "Apply for own leaves and WFH",
          "Clock in/out own attendance",
          "Full payroll access (process, salary setup, payment status, adjustments)",
          "View performance reviews",
          "Document management (view, upload, generate payslips)",
          "Full report access with export",
          "View holidays",
          "Reimbursement approval and expense policy management",
          "View onboarding status",
          "View announcements",
          "View assets",
          "Travel claim approval and analytics",
          "Pulse survey participation",
        ],
        restrictions: [
          "Cannot create/update/delete employees",
          "Cannot approve leaves or WFH requests",
          "Cannot manage permissions or users",
          "Cannot access audit logs directly",
        ],
      },
      MANAGER: {
        description: "Team manager — team-scoped operations",
        scope: "Direct reports + own data",
        capabilities: [
          "View team members' profiles",
          "Approve/reject team leaves and WFH requests",
          "Approve team attendance and regularizations",
          "Approve/reject team reimbursements and travel claims",
          "Create and conduct performance reviews for team",
          "View team attendance and productivity reports",
          "Upload documents",
          "Create announcements",
          "View assets",
          "View onboarding status and assign tasks",
          "Pulse survey results viewing (aggregate)",
          "Apply for own leaves, WFH, reimbursements",
        ],
        restrictions: [
          "Cannot access payroll details of team members",
          "Cannot manage departments, designations, or holidays",
          "Cannot process payroll or manage salary structures",
          "Cannot manage permissions, users, or organisation settings",
          "Cannot access audit logs or financial reports",
        ],
      },
      EMPLOYEE: {
        description: "Regular employee — self-service only",
        scope: "Own data only",
        capabilities: [
          "View own profile and update personal details",
          "View own payslips and salary history",
          "Apply for leaves and WFH",
          "Clock in/out and request regularization",
          "Submit reimbursement and travel claims",
          "Upload personal documents",
          "View own performance reviews and self-appraise",
          "View announcements",
          "View own assigned assets",
          "View holidays",
          "View own onboarding checklist",
          "Participate in pulse surveys",
          "View personal insights dashboard",
        ],
        restrictions: [
          "Cannot view other employees' data",
          "Cannot approve any requests",
          "Cannot access any admin, HR, or financial functions",
          "Cannot view reports",
          "Cannot manage any organisational settings",
        ],
      },
    };

    return R.success(res, { matrix, permissionModules: DEFAULT_PERMISSIONS });
  } catch (err) { return R.error(res, err.message); }
};
