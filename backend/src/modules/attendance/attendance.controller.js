import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { sendRegularizationApproved, sendRegularizationRejected } from "../../services/email.service.js";

const calcHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return null;
  return (new Date(clockOut) - new Date(clockIn)) / (1000 * 60 * 60);
};

const resolveStatus = (totalHours) => {
  if (!totalHours) return "ABSENT";
  if (totalHours >= 8) return "PRESENT";
  if (totalHours >= 4) return "HALF_DAY";
  return "ABSENT";
};

const getOrCreateAttendance = async (employeeId, date) => {
  const d = new Date(date);
  return prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date: d } },
    update: {},
    create: { employeeId, date: d, status: "ABSENT" },
  });
};

// ── Clock In ──────────────────────────────────────────────────────────────────

export const clockIn = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee profile not found");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
    });

    if (existing?.clockIn) return R.badRequest(res, "Already clocked in today");

    const now = new Date();
    const attendance = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
      update: { clockIn: now, locationIn: req.body.location },
      create: { employeeId: emp.id, date: today, clockIn: now, locationIn: req.body.location, status: "PRESENT" },
    });

    return R.success(res, attendance, "Clocked in successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Clock Out ─────────────────────────────────────────────────────────────────

export const clockOut = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee profile not found");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
    });

    if (!attendance?.clockIn) return R.badRequest(res, "Please clock in first");
    if (attendance.clockOut) return R.badRequest(res, "Already clocked out today");

    const now = new Date();
    const totalHours = calcHours(attendance.clockIn, now);
    const status = resolveStatus(totalHours);

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { clockOut: now, totalHours, status, locationOut: req.body.location },
    });

    return R.success(res, updated, "Clocked out successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Get Attendance ─────────────────────────────────────────────────────────────

export const getAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 31, employeeId, startDate, endDate, status, month, year } = req.query;
    const where = {};

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.paginated(res, [], 0, page, limit);
      where.employeeId = emp.id;
    } else if (req.user.role === "MANAGER") {
      const mgr = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (mgr) {
        const teamIds = (await prisma.employee.findMany({ where: { managerId: mgr.id }, select: { id: true } })).map((e) => e.id);
        where.employeeId = employeeId ? Number(employeeId) : { in: teamIds };
      }
    } else {
      if (employeeId) where.employeeId = Number(employeeId);
    }

    if (status) where.status = status;

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      where.date = { gte: start, lte: end };
    } else {
      if (startDate) where.date = { ...(where.date || {}), gte: new Date(startDate) };
      if (endDate) where.date = { ...(where.date || {}), lte: new Date(endDate) };
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({ where }),
    ]);

    return R.paginated(res, records, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getTodayStatus = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.success(res, { status: "NO_PROFILE", date: new Date() });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
    });

    return R.success(res, attendance || { status: "NOT_MARKED", date: today });
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Manual Attendance (Admin) ─────────────────────────────────────────────────

export const markManualAttendance = async (req, res) => {
  try {
    const { employeeId, date, clockIn: ci, clockOut: co, status } = req.body;
    const totalHours = ci && co ? calcHours(new Date(ci), new Date(co)) : null;

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
      update: { clockIn: ci ? new Date(ci) : undefined, clockOut: co ? new Date(co) : undefined, totalHours, status },
      create: { employeeId, date: new Date(date), clockIn: ci ? new Date(ci) : undefined, clockOut: co ? new Date(co) : undefined, totalHours, status },
    });

    return R.success(res, record, "Attendance marked successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Regularization ─────────────────────────────────────────────────────────────

export const applyRegularization = async (req, res) => {
  try {
    const { attendanceId, requestedClockIn, requestedClockOut, reason } = req.body;

    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee not found");

    const attendance = await prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!attendance || attendance.employeeId !== emp.id) return R.forbidden(res, "Access denied");

    const existing = await prisma.attendanceRegularization.findFirst({
      where: { attendanceId, status: "PENDING" },
    });
    if (existing) return R.badRequest(res, "Regularization already pending for this date");

    const reg = await prisma.attendanceRegularization.create({
      data: {
        attendanceId,
        employeeId: emp.id,
        requestedClockIn: requestedClockIn ? new Date(requestedClockIn) : undefined,
        requestedClockOut: requestedClockOut ? new Date(requestedClockOut) : undefined,
        reason,
      },
    });

    if (emp.managerId) {
      const manager = await prisma.employee.findUnique({ where: { id: emp.managerId }, include: { user: true } });
      if (manager?.user) {
        await prisma.notification.create({
          data: { userId: manager.user.id, notificationType: "REGULARIZATION", title: "Attendance Regularization Request", message: `${emp.firstName} ${emp.lastName} has requested attendance regularization` },
        });
      }
    }

    return R.created(res, reg, "Regularization request submitted");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getRegularizations = async (req, res) => {
  try {
    const where = {};

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.notFound(res, "Employee not found");
      where.employeeId = emp.id;
    } else if (req.user.role === "MANAGER") {
      const mgr = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (mgr) {
        const teamIds = (await prisma.employee.findMany({ where: { managerId: mgr.id }, select: { id: true } })).map((e) => e.id);
        where.employeeId = { in: teamIds };
      }
    }

    const regs = await prisma.attendanceRegularization.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        attendance: { select: { date: true, status: true } },
      },
      orderBy: { requestedOn: "desc" },
    });

    return R.success(res, regs);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const approveRegularization = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const approver = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    const reg = await prisma.attendanceRegularization.findUnique({ where: { id }, include: { employee: { include: { user: true } } } });
    if (!reg) return R.notFound(res, "Regularization not found");
    if (reg.status !== "PENDING") return R.badRequest(res, "Already processed");

    await prisma.attendanceRegularization.update({
      where: { id },
      data: { status: "APPROVED", approvedById: approver?.id, approvedOn: new Date() },
    });

    const totalHours = calcHours(reg.requestedClockIn, reg.requestedClockOut);
    const newStatus = resolveStatus(totalHours);

    await prisma.attendance.update({
      where: { id: reg.attendanceId },
      data: {
        clockIn: reg.requestedClockIn || undefined,
        clockOut: reg.requestedClockOut || undefined,
        totalHours,
        status: newStatus,
        isRegularized: true,
        regularizationReason: reg.reason,
      },
    });

    await prisma.notification.create({
      data: { userId: reg.employee.userId, notificationType: "REGULARIZATION_APPROVED", title: "Attendance Regularized", message: "Your attendance regularization has been approved" },
    });

    if (reg.employee.user?.email) {
      const att = await prisma.attendance.findUnique({ where: { id: reg.attendanceId } });
      const approverEmp = approver ? await prisma.employee.findUnique({ where: { id: approver.id } }) : null;
      sendRegularizationApproved({
        email: reg.employee.user.email,
        firstName: reg.employee.firstName,
        date: att?.date || new Date(),
        approverName: approverEmp ? `${approverEmp.firstName} ${approverEmp.lastName}` : "Management",
      }).catch(() => {});
    }

    return R.success(res, null, "Regularization approved");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const rejectRegularization = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rejectionReason } = req.body;
    if (!rejectionReason) return R.badRequest(res, "Rejection reason required");

    const reg = await prisma.attendanceRegularization.findUnique({ where: { id }, include: { employee: { include: { user: true } } } });
    if (!reg) return R.notFound(res, "Regularization not found");

    const approver = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    await prisma.attendanceRegularization.update({
      where: { id },
      data: { status: "REJECTED", approvedById: approver?.id, approvedOn: new Date(), rejectionReason },
    });

    await prisma.notification.create({
      data: { userId: reg.employee.userId, notificationType: "REGULARIZATION_REJECTED", title: "Attendance Regularization Rejected", message: `Rejection reason: ${rejectionReason}` },
    });

    if (reg.employee.user?.email) {
      const att = await prisma.attendance.findUnique({ where: { id: reg.attendanceId } });
      sendRegularizationRejected({
        email: reg.employee.user.email,
        firstName: reg.employee.firstName,
        date: att?.date || new Date(),
        reason: rejectionReason,
        approverName: approver ? `${approver.firstName} ${approver.lastName}` : "Management",
      }).catch(() => {});
    }

    return R.success(res, null, "Regularization rejected");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Attendance Summary ────────────────────────────────────────────────────────

export const getAttendanceSummary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();

    let empId = Number(employeeId) || null;
    if (!empId) {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.success(res, { month: m, year: y, totalDays: 0, present: 0, absent: 0, halfDay: 0, leave: 0, wfh: 0, holiday: 0, totalHours: '0.00', noProfile: true });
      empId = emp.id;
    }

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);

    const records = await prisma.attendance.findMany({ where: { employeeId: empId, date: { gte: start, lte: end } } });

    const summary = {
      month: m,
      year: y,
      totalDays: end.getDate(),
      present: records.filter((r) => r.status === "PRESENT").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      halfDay: records.filter((r) => r.status === "HALF_DAY").length,
      leave: records.filter((r) => r.status === "LEAVE").length,
      wfh: records.filter((r) => r.status === "WFH").length,
      holiday: records.filter((r) => r.status === "HOLIDAY").length,
      totalHours: records.reduce((sum, r) => sum + (r.totalHours || 0), 0).toFixed(2),
    };

    return R.success(res, summary);
  } catch (err) {
    return R.error(res, err.message);
  }
};
