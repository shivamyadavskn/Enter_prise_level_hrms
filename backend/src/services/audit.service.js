import prisma from "../config/prisma.js";

/**
 * Log an audit event.
 * @param {object} params
 * @param {number} params.userId - The user performing the action
 * @param {number} [params.organisationId]
 * @param {string} params.action - CREATE, UPDATE, DELETE, APPROVE, REJECT, LOGIN, etc.
 * @param {string} params.module - employee, payroll, leave, etc.
 * @param {number} [params.entityId]
 * @param {string} [params.entityType]
 * @param {string} [params.description]
 * @param {object} [params.oldValues]
 * @param {object} [params.newValues]
 * @param {object} [params.req] - Express request object (for IP/UA)
 */
export async function logAudit({
  userId, organisationId, action, module,
  entityId, entityType, description,
  oldValues, newValues, req,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        organisationId: organisationId || null,
        action,
        module,
        entityId: entityId || null,
        entityType: entityType || null,
        description: description || null,
        oldValues: oldValues || undefined,
        newValues: newValues || undefined,
        ipAddress: req?.ip || req?.connection?.remoteAddress || null,
        userAgent: req?.headers?.["user-agent"]?.substring(0, 255) || null,
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}
