import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

// All modules and their possible actions — used to validate incoming permissions JSON
const ALL_MODULES = {
  employees:     ["view","view_self","create","update","delete"],
  departments:   ["view","create","update","delete"],
  designations:  ["view","create","update","delete"],
  leaves:        ["view","apply","approve","reject","manage_types","allocate"],
  attendance:    ["view","clock","approve","regularize"],
  wfh:           ["view","apply","approve","reject"],
  payroll:       ["view","view_self","process","salary_setup","payment_status"],
  performance:   ["view","view_self","create","appraise","appraise_self"],
  documents:     ["view","upload","delete","generate"],
  reports:       ["view","export"],
  holidays:      ["view","create","update","delete"],
  reimbursements:["view","create","approve","reject","policies"],
  onboarding:    ["view","manage_tasks","assign"],
  announcements: ["view","create","update","delete","pin"],
  assets:        ["view","view_self","create","update","delete","assign"],
  organisation:  ["view","update"],
  users:         ["view","create","update","delete"],
  permissions:   ["view","update"],
  audit_logs:    ["view"],
  travel_claims: ["view","create","approve","reject"],
  pulse:         ["view","create","manage","respond"],
};

// ── List all custom roles for this org ───────────────────────────────────────
export const getCustomRoles = async (req, res) => {
  try {
    const orgId = req.organisationId;
    if (!orgId) return R.badRequest(res, "Organisation context required");

    const roles = await prisma.customRole.findMany({
      where: { organisationId: orgId },
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return R.success(res, roles);
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Get a single custom role with full details ───────────────────────────────
export const getCustomRoleById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const orgId = req.organisationId;

    const role = await prisma.customRole.findUnique({
      where: { id },
      include: {
        _count: { select: { employees: true } },
        employees: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, profilePicture: true },
          take: 10,
        },
      },
    });

    if (!role) return R.notFound(res, "Custom role not found");
    if (orgId && role.organisationId !== orgId) return R.forbidden(res, "Access denied");

    return R.success(res, role);
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Create a new custom role ─────────────────────────────────────────────────
export const createCustomRole = async (req, res) => {
  try {
    const orgId = req.organisationId;
    if (!orgId) return R.badRequest(res, "Organisation context required");

    const { name, description, baseRole, permissions } = req.body;

    if (!name || !name.trim()) return R.badRequest(res, "Role name is required");

    const validBaseRoles = ["EMPLOYEE", "INTERN", "MANAGER", "HR", "FINANCE", "ADMIN"];
    if (baseRole && !validBaseRoles.includes(baseRole)) {
      return R.badRequest(res, `Invalid baseRole. Must be one of: ${validBaseRoles.join(", ")}`);
    }

    // Auto-generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Check slug uniqueness within org
    const existing = await prisma.customRole.findUnique({
      where: { organisationId_slug: { organisationId: orgId, slug } },
    });
    if (existing) return R.badRequest(res, `A custom role with name "${name}" already exists`);

    // Validate permissions JSON structure
    const sanitizedPermissions = {};
    if (permissions && typeof permissions === "object") {
      for (const [mod, actions] of Object.entries(permissions)) {
        if (!ALL_MODULES[mod]) continue; // skip unknown modules
        if (!Array.isArray(actions)) continue;
        const validActions = actions.filter((a) => ALL_MODULES[mod].includes(a));
        if (validActions.length > 0) sanitizedPermissions[mod] = validActions;
      }
    }

    const role = await prisma.customRole.create({
      data: {
        organisationId: orgId,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        baseRole: baseRole || "EMPLOYEE",
        permissions: sanitizedPermissions,
      },
    });

    return R.created(res, role, "Custom role created successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Update a custom role ─────────────────────────────────────────────────────
export const updateCustomRole = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const orgId = req.organisationId;

    const existing = await prisma.customRole.findUnique({ where: { id } });
    if (!existing) return R.notFound(res, "Custom role not found");
    if (orgId && existing.organisationId !== orgId) return R.forbidden(res, "Access denied");

    const { name, description, baseRole, permissions, isActive } = req.body;

    const sanitizedPermissions = {};
    if (permissions && typeof permissions === "object") {
      for (const [mod, actions] of Object.entries(permissions)) {
        if (!ALL_MODULES[mod]) continue;
        if (!Array.isArray(actions)) continue;
        const validActions = actions.filter((a) => ALL_MODULES[mod].includes(a));
        if (validActions.length > 0) sanitizedPermissions[mod] = validActions;
      }
    }

    const updated = await prisma.customRole.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(baseRole && { baseRole }),
        ...(permissions !== undefined && { permissions: sanitizedPermissions }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { _count: { select: { employees: true } } },
    });

    return R.success(res, updated, "Custom role updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Delete a custom role (only if no employees are using it) ─────────────────
export const deleteCustomRole = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const orgId = req.organisationId;

    const existing = await prisma.customRole.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });
    if (!existing) return R.notFound(res, "Custom role not found");
    if (orgId && existing.organisationId !== orgId) return R.forbidden(res, "Access denied");

    if (existing._count.employees > 0) {
      return R.badRequest(
        res,
        `Cannot delete — ${existing._count.employees} employee(s) are assigned to this role. Reassign them first or deactivate the role instead.`
      );
    }

    await prisma.customRole.delete({ where: { id } });
    return R.success(res, null, "Custom role deleted");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Assign / remove custom role on an employee ───────────────────────────────
export const assignCustomRole = async (req, res) => {
  try {
    const orgId = req.organisationId;
    const { employeeId, customRoleId } = req.body;

    if (!employeeId) return R.badRequest(res, "employeeId is required");

    const employee = await prisma.employee.findUnique({ where: { id: Number(employeeId) } });
    if (!employee) return R.notFound(res, "Employee not found");
    if (orgId && employee.organisationId !== orgId) return R.forbidden(res, "Access denied");

    // customRoleId = null → removes the custom role
    if (customRoleId) {
      const customRole = await prisma.customRole.findUnique({ where: { id: Number(customRoleId) } });
      if (!customRole) return R.notFound(res, "Custom role not found");
      if (orgId && customRole.organisationId !== orgId) {
        return R.badRequest(res, "Custom role does not belong to your organisation");
      }
      if (!customRole.isActive) return R.badRequest(res, "Custom role is inactive");
    }

    const updated = await prisma.employee.update({
      where: { id: Number(employeeId) },
      data: { customRoleId: customRoleId ? Number(customRoleId) : null },
      include: { customRole: true },
    });

    return R.success(res, updated, customRoleId ? "Custom role assigned" : "Custom role removed");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Get all available module+actions for the UI permission builder ────────────
export const getAvailablePermissions = async (_req, res) => {
  return R.success(res, ALL_MODULES);
};
