import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { logAudit } from "../../services/audit.service.js";

export const getPolicies = async (req, res) => {
  try {
    const orgId = req.organisationId || null;
    const policies = await prisma.expensePolicy.findMany({
      where: { isActive: true, ...(orgId ? { organisationId: orgId } : {}) },
      orderBy: { category: "asc" },
    });
    return R.success(res, policies);
  } catch (err) { return R.error(res, err.message); }
};

export const upsertPolicy = async (req, res) => {
  try {
    const orgId = req.organisationId || null;
    const { category, maxAmountPerClaim, maxAmountPerMonth, requiresReceipt, requiresApproval, autoApproveBelow } = req.body;

    if (!category) return R.badRequest(res, "Category is required");

    const policy = await prisma.expensePolicy.upsert({
      where: { organisationId_category: { organisationId: orgId ?? 0, category } },
      update: {
        maxAmountPerClaim: maxAmountPerClaim ? Number(maxAmountPerClaim) : null,
        maxAmountPerMonth: maxAmountPerMonth ? Number(maxAmountPerMonth) : null,
        requiresReceipt: requiresReceipt ?? true,
        requiresApproval: requiresApproval ?? true,
        autoApproveBelow: autoApproveBelow ? Number(autoApproveBelow) : null,
      },
      create: {
        organisationId: orgId,
        category,
        maxAmountPerClaim: maxAmountPerClaim ? Number(maxAmountPerClaim) : null,
        maxAmountPerMonth: maxAmountPerMonth ? Number(maxAmountPerMonth) : null,
        requiresReceipt: requiresReceipt ?? true,
        requiresApproval: requiresApproval ?? true,
        autoApproveBelow: autoApproveBelow ? Number(autoApproveBelow) : null,
      },
    });

    await logAudit({ userId: req.user.id, organisationId: orgId, action: "UPSERT", module: "expense_policies", entityId: policy.id, entityType: "ExpensePolicy", description: `Policy for ${category}`, req });

    return R.success(res, policy, "Policy saved");
  } catch (err) { return R.error(res, err.message); }
};

export const deletePolicy = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.expensePolicy.update({ where: { id }, data: { isActive: false } });
    return R.success(res, null, "Policy removed");
  } catch (err) { return R.error(res, err.message); }
};
