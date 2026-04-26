import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { sendWfhApproved, sendWfhRejected } from "../../services/email.service.js";

export const getWfhRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, employeeId, startDate, endDate, month, year } = req.query;
    const where = {};

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.paginated(res, [], 0, page, limit);
      where.employeeId = emp.id;
    } else if (req.user.role === "MANAGER") {
      const mgr = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (mgr) {
        const teamIds = (await prisma.employee.findMany({ where: { managerId: mgr.id }, select: { id: true } })).map((e) => e.id);
        where.employeeId = employeeId ? Number(employeeId) : { in: [...teamIds, mgr.id] };
      }
    } else {
      // ADMIN/HR/SUPER_ADMIN — scope to organisation
      if (req.organisationId) where.employee = { organisationId: req.organisationId };
      if (employeeId) where.employeeId = Number(employeeId);
    }

    if (status) where.status = status;

    if (month && year) {
      where.startDate = { gte: new Date(year, month - 1, 1) };
      where.endDate = { lte: new Date(year, month, 0) };
    } else {
      if (startDate) where.startDate = { gte: new Date(startDate) };
      if (endDate) where.endDate = { lte: new Date(endDate) };
    }

    const [requests, total] = await Promise.all([
      prisma.wfhRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { appliedOn: "desc" },
      }),
      prisma.wfhRequest.count({ where }),
    ]);

    return R.paginated(res, requests, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const applyWfh = async (req, res) => {
  try {
    const { startDate, endDate, wfhType, reason } = req.body;

    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee profile not found");

    const overlap = await prisma.wfhRequest.findFirst({
      where: {
        employeeId: emp.id,
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: new Date(endDate) },
        endDate: { gte: new Date(startDate) },
      },
    });
    if (overlap) return R.badRequest(res, "Overlapping WFH request exists");

    const wfh = await prisma.wfhRequest.create({
      data: { employeeId: emp.id, startDate: new Date(startDate), endDate: new Date(endDate), wfhType, reason },
    });

    if (emp.managerId) {
      const manager = await prisma.employee.findUnique({ where: { id: emp.managerId }, include: { user: true } });
      if (manager?.user) {
        await prisma.notification.create({
          data: { userId: manager.user.id, notificationType: "WFH_REQUEST", title: "New WFH Request", message: `${emp.firstName} ${emp.lastName} has requested to work from home` },
        });
      }
    } else {
      const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true, ...(req.organisationId ? { organisationId: req.organisationId } : {}) } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: { userId: admin.id, notificationType: "WFH_REQUEST", title: "New WFH Request", message: `${emp.firstName} ${emp.lastName} has requested to work from home (no manager assigned)` },
        });
      }
    }

    return R.created(res, wfh, "WFH request submitted successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getWfhById = async (req, res) => {
  try {
    const wfh = await prisma.wfhRequest.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, organisationId: true, userId: true, managerId: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!wfh) return R.notFound(res, "WFH request not found");

    // SECURITY: cross-org IDOR check
    if (req.organisationId && wfh.employee?.organisationId !== req.organisationId) {
      return R.forbidden(res, "Access denied");
    }
    // SECURITY: employees can only see their own; managers their team’s
    if (req.user.role === "EMPLOYEE" && wfh.employee?.userId !== req.user.id) {
      return R.forbidden(res, "Access denied");
    }
    if (req.user.role === "MANAGER") {
      const mgr = await prisma.employee.findFirst({ where: { userId: req.user.id }, select: { id: true } });
      if (!mgr || (wfh.employee.managerId !== mgr.id && wfh.employee.userId !== req.user.id)) {
        return R.forbidden(res, "Access denied");
      }
    }
    return R.success(res, wfh);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const approveWfh = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const approver = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    const wfh = await prisma.wfhRequest.findUnique({ where: { id }, include: { employee: { include: { user: true } } } });
    if (!wfh) return R.notFound(res, "WFH request not found");
    if (req.organisationId && wfh.employee.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");
    if (wfh.status !== "PENDING") return R.badRequest(res, "WFH request is not pending");

    const updated = await prisma.wfhRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedById: approver?.id, approvedOn: new Date() },
    });

    await prisma.notification.create({
      data: { userId: wfh.employee.userId, notificationType: "WFH_APPROVED", title: "WFH Approved", message: "Your WFH request has been approved" },
    });

    if (wfh.employee.user?.email) {
      const approverEmp = approver ? await prisma.employee.findUnique({ where: { id: approver.id } }) : null;
      sendWfhApproved({
        email: wfh.employee.user.email,
        firstName: wfh.employee.firstName,
        startDate: wfh.startDate,
        endDate: wfh.endDate,
        approverName: approverEmp ? `${approverEmp.firstName} ${approverEmp.lastName}` : "Management",
      }).catch(() => {});
    }

    return R.success(res, updated, "WFH request approved");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const rejectWfh = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rejectionReason } = req.body;
    if (!rejectionReason) return R.badRequest(res, "Rejection reason required");

    const wfh = await prisma.wfhRequest.findUnique({ where: { id }, include: { employee: { include: { user: true } } } });
    if (!wfh) return R.notFound(res, "WFH request not found");
    if (req.organisationId && wfh.employee.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");

    const approver = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    const updated = await prisma.wfhRequest.update({
      where: { id },
      data: { status: "REJECTED", approvedById: approver?.id, approvedOn: new Date(), rejectionReason },
    });

    await prisma.notification.create({
      data: { userId: wfh.employee.userId, notificationType: "WFH_REJECTED", title: "WFH Rejected", message: `Your WFH request was rejected: ${rejectionReason}` },
    });

    if (wfh.employee.user?.email) {
      sendWfhRejected({
        email: wfh.employee.user.email,
        firstName: wfh.employee.firstName,
        startDate: wfh.startDate,
        endDate: wfh.endDate,
        reason: rejectionReason,
        approverName: approver ? `${approver.firstName} ${approver.lastName}` : "Management",
      }).catch(() => {});
    }

    return R.success(res, updated, "WFH request rejected");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const cancelWfh = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const wfh = await prisma.wfhRequest.findUnique({ where: { id }, include: { employee: { select: { organisationId: true } } } });
    if (!wfh) return R.notFound(res, "WFH request not found");
    if (req.organisationId && wfh.employee.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp || emp.id !== wfh.employeeId) return R.forbidden(res, "Access denied");
    }

    if (!["PENDING", "APPROVED"].includes(wfh.status)) return R.badRequest(res, "Cannot cancel this request");

    await prisma.wfhRequest.update({ where: { id }, data: { status: "CANCELLED" } });
    return R.success(res, null, "WFH request cancelled");
  } catch (err) {
    return R.error(res, err.message);
  }
};
