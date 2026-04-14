import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { sendReimbursementApproved, sendReimbursementRejected } from "../../services/email.service.js";

const empInclude = { select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: { select: { name: true } }, department: { select: { name: true } } } };

export const getClaims = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = {};
    if (status) where.status = status;

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.paginated(res, [], 0, page, limit);
      where.employeeId = emp.id;
    } else if (req.user.role === "MANAGER") {
      const mgr = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (mgr) {
        const teamIds = (await prisma.employee.findMany({ where: { managerId: mgr.id }, select: { id: true } })).map(e => e.id);
        where.employeeId = { in: [...teamIds, mgr.id] };
      }
    }

    const [claims, total] = await Promise.all([
      prisma.reimbursementClaim.findMany({ where, skip: (page - 1) * limit, take: Number(limit), orderBy: { createdAt: "desc" }, include: { employee: empInclude, approvedBy: empInclude } }),
      prisma.reimbursementClaim.count({ where }),
    ]);
    return R.paginated(res, claims, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createClaim = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee profile not found");

    const { title, description, items } = req.body;
    const totalAmount = items.reduce((s, i) => s + Number(i.amount || 0), 0);

    const claim = await prisma.reimbursementClaim.create({
      data: { employeeId: emp.id, title, description, totalAmount, items, claimDate: new Date() },
      include: { employee: empInclude },
    });

    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN", "FINANCE"] }, isActive: true }, select: { id: true } });
    await Promise.all(admins.map(u => prisma.notification.create({ data: { userId: u.id, notificationType: "REIMBURSEMENT", title: "New Reimbursement Claim", message: `${emp.firstName} ${emp.lastName} submitted a claim: ${title} (₹${totalAmount.toLocaleString('en-IN')})` } })));

    return R.created(res, claim, "Claim submitted successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const approveClaim = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const approver = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    const claim = await prisma.reimbursementClaim.update({
      where: { id },
      data: { status: "APPROVED", approvedById: approver?.id, approvedOn: new Date() },
      include: { employee: { include: { user: true } } },
    });
    await prisma.notification.create({ data: { userId: claim.employee.userId, notificationType: "REIMBURSEMENT_APPROVED", title: "Reimbursement Approved", message: `Your claim "${claim.title}" has been approved.` } });

    if (claim.employee.user?.email) {
      sendReimbursementApproved({
        email: claim.employee.user.email,
        firstName: claim.employee.firstName,
        title: claim.title,
        totalAmount: claim.totalAmount,
        approverName: approver ? `${approver.firstName} ${approver.lastName}` : "Management",
      }).catch(() => {});
    }

    return R.success(res, claim, "Claim approved");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const rejectClaim = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rejectionReason } = req.body;
    if (!rejectionReason) return R.badRequest(res, "Rejection reason required");
    const approver = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    const claim = await prisma.reimbursementClaim.update({
      where: { id },
      data: { status: "REJECTED", approvedById: approver?.id, approvedOn: new Date(), rejectionReason },
      include: { employee: { include: { user: true } } },
    });
    await prisma.notification.create({ data: { userId: claim.employee.userId, notificationType: "REIMBURSEMENT_REJECTED", title: "Reimbursement Rejected", message: `Your claim "${claim.title}" was rejected: ${rejectionReason}` } });

    if (claim.employee.user?.email) {
      sendReimbursementRejected({
        email: claim.employee.user.email,
        firstName: claim.employee.firstName,
        title: claim.title,
        totalAmount: claim.totalAmount,
        reason: rejectionReason,
        approverName: approver ? `${approver.firstName} ${approver.lastName}` : "Management",
      }).catch(() => {});
    }

    return R.success(res, claim, "Claim rejected");
  } catch (err) {
    return R.error(res, err.message);
  }
};
