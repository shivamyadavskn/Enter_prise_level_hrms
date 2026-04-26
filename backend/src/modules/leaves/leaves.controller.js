import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { sendLeaveApproved, sendLeaveRejected, sendLeaveRequest } from "../../services/email.service.js";

const calcWorkingDays = (start, end) => {
  let count = 0;
  const cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const notifyUser = async (userId, type, title, message) => {
  await prisma.notification.create({ data: { userId, notificationType: type, title, message } });
};

// ── Leave Types ───────────────────────────────────────────────────────────────

export const getLeaveTypes = async (req, res) => {
  try {
    const where = { isActive: true };
    if (req.organisationId) where.organisationId = req.organisationId;
    const types = await prisma.leaveType.findMany({ where, orderBy: { name: "asc" } });
    return R.success(res, types);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createLeaveType = async (req, res) => {
  try {
    const existing = await prisma.leaveType.findFirst({ where: { code: req.body.code, organisationId: req.organisationId || null } });
    if (existing) return R.badRequest(res, "Leave type code already exists");

    const lt = await prisma.leaveType.create({ data: { ...req.body, organisationId: req.organisationId || undefined } });
    return R.created(res, lt);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateLeaveType = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (req.organisationId) {
      const existing = await prisma.leaveType.findUnique({ where: { id }, select: { organisationId: true } });
      if (!existing || existing.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");
    }
    const lt = await prisma.leaveType.update({ where: { id }, data: req.body });
    return R.success(res, lt, "Leave type updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Leave Balance ─────────────────────────────────────────────────────────────

export const getLeaveBalance = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    let employeeId = Number(req.query.employeeId) || null;
    if (!employeeId) {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.success(res, []);
      employeeId = emp.id;
    }

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
    });

    return R.success(res, balances);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const bulkAllocateLeaves = async (req, res) => {
  try {
    const { year, leaveTypeIds } = req.body;
    const targetYear = year || new Date().getFullYear();

    const orgFilter = req.organisationId ? { organisationId: req.organisationId } : {};
    const [employees, leaveTypes] = await Promise.all([
      prisma.employee.findMany({
        where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, ...orgFilter },
        select: { id: true, firstName: true, lastName: true },
      }),
      leaveTypeIds?.length
        ? prisma.leaveType.findMany({ where: { id: { in: leaveTypeIds }, isActive: true, ...orgFilter } })
        : prisma.leaveType.findMany({ where: { isActive: true, annualQuota: { gt: 0 }, ...orgFilter } }),
    ]);

    let created = 0, skipped = 0;
    for (const emp of employees) {
      for (const lt of leaveTypes) {
        const existing = await prisma.leaveBalance.findUnique({
          where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: lt.id, year: targetYear } },
        });
        if (existing) { skipped++; continue; }
        await prisma.leaveBalance.create({
          data: {
            employeeId: emp.id,
            leaveTypeId: lt.id,
            year: targetYear,
            openingBalance: lt.annualQuota,
            accrued: lt.annualQuota,
            consumed: 0,
            available: lt.annualQuota,
          },
        });
        created++;
      }
    }

    return R.success(
      res,
      { created, skipped, employees: employees.length, leaveTypes: leaveTypes.length },
      `Allocated ${created} new leave balance(s). ${skipped} already existed.`
    );
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const adjustLeaveBalance = async (req, res) => {
  try {
    const { employeeId, leaveTypeId, year, available } = req.body;

    const balance = await prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } },
      update: { available },
      create: { employeeId, leaveTypeId, year, openingBalance: available, accrued: available, consumed: 0, available },
    });

    return R.success(res, balance, "Leave balance adjusted");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Leave Applications ────────────────────────────────────────────────────────

export const getLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, leaveTypeId, employeeId, startDate, endDate } = req.query;
    const where = {};

    // PERF: org-scope via relation filter instead of fetching all employee IDs (N+1 fix)
    if (req.organisationId) {
      where.employee = { organisationId: req.organisationId };
    }

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.paginated(res, [], 0, page, limit);
      where.employeeId = emp.id;
    } else if (req.user.role === "MANAGER") {
      const mgr = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (mgr) {
        const teamIds = (await prisma.employee.findMany({ where: { managerId: mgr.id }, select: { id: true } })).map((e) => e.id);
        // Include manager's own leaves so they can track/cancel them
        where.employeeId = { in: [...teamIds, mgr.id] };
      }
      if (employeeId) where.employeeId = Number(employeeId);
    } else {
      if (employeeId) where.employeeId = Number(employeeId);
    }

    if (status) where.status = status;
    if (leaveTypeId) where.leaveTypeId = Number(leaveTypeId);
    if (startDate) where.startDate = { gte: new Date(startDate) };
    if (endDate) where.endDate = { lte: new Date(endDate) };

    const [leaves, total] = await Promise.all([
      prisma.leaveApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          leaveType: true,
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { appliedOn: "desc" },
      }),
      prisma.leaveApplication.count({ where }),
    ]);

    return R.paginated(res, leaves, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason, approverId } = req.body;

    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee profile not found");

    const totalDays = calcWorkingDays(startDate, endDate);
    if (totalDays <= 0) return R.badRequest(res, "Invalid date range");

    const year = new Date(startDate).getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId, year } },
    });

    const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
    if (!leaveType) return R.notFound(res, "Leave type not found");

    if (leaveType.code !== "LOP" && (!balance || balance.available < totalDays)) {
      return R.badRequest(res, `Insufficient leave balance. Available: ${balance?.available ?? 0} days`);
    }

    const overlap = await prisma.leaveApplication.findFirst({
      where: {
        employeeId: emp.id,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          { startDate: { lte: new Date(endDate) }, endDate: { gte: new Date(startDate) } },
        ],
      },
    });
    if (overlap) return R.badRequest(res, "Overlapping leave application exists");

    const leave = await prisma.leaveApplication.create({
      data: {
        employeeId: emp.id,
        leaveTypeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
        reason,
      },
      include: { leaveType: true },
    });

    if (approverId) {
      const approverEmp = await prisma.employee.findUnique({ where: { id: approverId }, include: { user: true } });
      if (approverEmp?.user) {
        await notifyUser(approverEmp.user.id, "LEAVE_REQUEST", "New Leave Request", `${emp.firstName} ${emp.lastName} applied for ${totalDays} day(s) leave (sent to you for approval)`);
        if (approverEmp.user.email) sendLeaveRequest({ email: approverEmp.user.email, managerName: `${approverEmp.firstName} ${approverEmp.lastName}`, employeeName: `${emp.firstName} ${emp.lastName}`, leaveType: leaveType.name, startDate, endDate, totalDays, reason }).catch(() => {});
      }
    } else if (emp.managerId) {
      const manager = await prisma.employee.findUnique({ where: { id: emp.managerId }, include: { user: true } });
      if (manager?.user) {
        await notifyUser(manager.user.id, "LEAVE_REQUEST", "New Leave Request", `${emp.firstName} ${emp.lastName} applied for ${totalDays} day(s) leave`);
        if (manager.user.email) sendLeaveRequest({ email: manager.user.email, managerName: `${manager.firstName} ${manager.lastName}`, employeeName: `${emp.firstName} ${emp.lastName}`, leaveType: leaveType.name, startDate, endDate, totalDays, reason }).catch(() => {});
      }
    } else {
      const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true, ...(req.organisationId ? { organisationId: req.organisationId } : {}) } });
      for (const admin of admins) {
        await notifyUser(admin.id, "LEAVE_REQUEST", "New Leave Request", `${emp.firstName} ${emp.lastName} applied for ${totalDays} day(s) leave (no manager assigned)`);
        if (admin.email) sendLeaveRequest({ email: admin.email, managerName: "HR Administrator", employeeName: `${emp.firstName} ${emp.lastName}`, leaveType: leaveType.name, startDate, endDate, totalDays, reason }).catch(() => {});
      }
    }

    return R.created(res, leave, "Leave application submitted successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getLeaveById = async (req, res) => {
  try {
    const leave = await prisma.leaveApplication.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        leaveType: true,
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        approvalWorkflow: { include: { approver: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!leave) return R.notFound(res, "Leave application not found");
    return R.success(res, leave);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const approveLeave = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const approver = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    const leave = await prisma.leaveApplication.findUnique({ where: { id }, include: { employee: { include: { user: true } }, leaveType: true } });
    if (!leave) return R.notFound(res, "Leave not found");
    if (req.organisationId && leave.employee.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");
    if (leave.status !== "PENDING") return R.badRequest(res, "Leave is not in pending state");

    const updatedLeave = await prisma.leaveApplication.update({
      where: { id },
      data: { status: "APPROVED", approvedById: approver?.id, approvedOn: new Date() },
    });

    await prisma.leaveBalance.updateMany({
      where: { employeeId: leave.employeeId, leaveTypeId: leave.leaveTypeId, year: new Date(leave.startDate).getFullYear() },
      data: { consumed: { increment: leave.totalDays }, available: { decrement: leave.totalDays } },
    });

    await notifyUser(leave.employee.userId, "LEAVE_APPROVED", "Leave Approved", `Your leave request for ${leave.totalDays} day(s) has been approved`);

    if (leave.employee.user?.email) {
      const approverEmp = approver ? await prisma.employee.findUnique({ where: { id: approver.id } }) : null;
      sendLeaveApproved({
        email: leave.employee.user.email,
        firstName: leave.employee.firstName,
        leaveType: leave.leaveType?.name || "Leave",
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        approverName: approverEmp ? `${approverEmp.firstName} ${approverEmp.lastName}` : "Management",
      }).catch(() => {});
    }

    return R.success(res, updatedLeave, "Leave approved successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rejectionReason } = req.body;
    if (!rejectionReason) return R.badRequest(res, "Rejection reason is required");

    const leave = await prisma.leaveApplication.findUnique({ where: { id }, include: { employee: { include: { user: true } }, leaveType: true } });
    if (!leave) return R.notFound(res, "Leave not found");
    if (req.organisationId && leave.employee.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");
    if (leave.status !== "PENDING") return R.badRequest(res, "Leave is not in pending state");

    const approver = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    const updatedLeave = await prisma.leaveApplication.update({
      where: { id },
      data: { status: "REJECTED", approvedById: approver?.id, approvedOn: new Date(), rejectionReason },
    });

    await notifyUser(leave.employee.userId, "LEAVE_REJECTED", "Leave Rejected", `Your leave request has been rejected: ${rejectionReason}`);

    if (leave.employee.user?.email) {
      sendLeaveRejected({
        email: leave.employee.user.email,
        firstName: leave.employee.firstName,
        leaveType: leave.leaveType?.name || "Leave",
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        reason: rejectionReason,
        approverName: approver ? `${approver.firstName} ${approver.lastName}` : "Management",
      }).catch(() => {});
    }

    return R.success(res, updatedLeave, "Leave rejected");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const cancelLeave = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const leave = await prisma.leaveApplication.findUnique({ where: { id }, include: { employee: { select: { organisationId: true } } } });
    if (!leave) return R.notFound(res, "Leave not found");
    if (req.organisationId && leave.employee.organisationId !== req.organisationId) return R.forbidden(res, "Access denied");

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp || emp.id !== leave.employeeId) return R.forbidden(res, "Access denied");
    }

    if (!["PENDING", "APPROVED"].includes(leave.status)) {
      return R.badRequest(res, "Cannot cancel this leave");
    }

    await prisma.leaveApplication.update({ where: { id }, data: { status: "CANCELLED" } });

    if (leave.status === "APPROVED") {
      await prisma.leaveBalance.updateMany({
        where: { employeeId: leave.employeeId, leaveTypeId: leave.leaveTypeId, year: new Date(leave.startDate).getFullYear() },
        data: { consumed: { decrement: leave.totalDays }, available: { increment: leave.totalDays } },
      });
    }

    return R.success(res, null, "Leave cancelled successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};
