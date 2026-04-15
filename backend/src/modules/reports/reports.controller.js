import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { detectAnomalies } from "../../services/anomaly.service.js";

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orgId = req.organisationId;
    const empWhere = orgId ? { organisationId: orgId } : {};

    const orgEmployeeIds = orgId
      ? (await prisma.employee.findMany({ where: { organisationId: orgId }, select: { id: true } })).map(e => e.id)
      : undefined;
    const attWhere = orgEmployeeIds ? { employeeId: { in: orgEmployeeIds } } : {};
    const leaveWhere = orgEmployeeIds ? { employeeId: { in: orgEmployeeIds } } : {};
    const wfhWhere = orgEmployeeIds ? { employeeId: { in: orgEmployeeIds } } : {};
    const regWhere = orgEmployeeIds ? { employeeId: { in: orgEmployeeIds } } : {};

    const [
      totalEmployees,
      activeEmployees,
      onLeaveToday,
      wfhToday,
      pendingLeaves,
      pendingWfh,
      pendingRegularizations,
    ] = await Promise.all([
      prisma.employee.count({ where: empWhere }),
      prisma.employee.count({ where: { ...empWhere, employmentStatus: { in: ["ACTIVE", "PROBATION"] } } }),
      prisma.attendance.count({ where: { ...attWhere, date: today, status: "LEAVE" } }),
      prisma.attendance.count({ where: { ...attWhere, date: today, status: "WFH" } }),
      prisma.leaveApplication.count({ where: { ...leaveWhere, status: "PENDING" } }),
      prisma.wfhRequest.count({ where: { ...wfhWhere, status: "PENDING" } }),
      prisma.attendanceRegularization.count({ where: { ...regWhere, status: "PENDING" } }),
    ]);

    const presentToday = await prisma.attendance.count({ where: { ...attWhere, date: today, status: { in: ["PRESENT", "WFH"] } } });

    return R.success(res, {
      totalEmployees,
      activeEmployees,
      presentToday,
      onLeaveToday,
      wfhToday,
      pendingApprovals: { leave: pendingLeaves, wfh: pendingWfh, regularizations: pendingRegularizations },
    });
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getHeadcountReport = async (req, res) => {
  try {
    const orgId = req.organisationId;
    const byDept = await prisma.employee.groupBy({
      by: ["departmentId", "employmentStatus"],
      _count: { id: true },
      where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, ...(orgId ? { organisationId: orgId } : {}) },
    });

    const departments = await prisma.department.findMany({ where: orgId ? { organisationId: orgId } : {}, select: { id: true, name: true } });
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    const result = byDept.map((r) => ({
      department: deptMap[r.departmentId] || "Unassigned",
      departmentId: r.departmentId,
      status: r.employmentStatus,
      count: r._count.id,
    }));

    return R.success(res, result);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getAttendanceReport = async (req, res) => {
  try {
    const { month, year, departmentId } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);

    const empWhere = { employmentStatus: { in: ["ACTIVE", "PROBATION"] } };
    if (req.organisationId) empWhere.organisationId = req.organisationId;
    if (departmentId) empWhere.departmentId = Number(departmentId);

    const employees = await prisma.employee.findMany({
      where: empWhere,
      select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } },
    });

    const results = await Promise.all(
      employees.map(async (emp) => {
        const records = await prisma.attendance.findMany({ where: { employeeId: emp.id, date: { gte: start, lte: end } } });
        return {
          employee: emp,
          present: records.filter((r) => r.status === "PRESENT").length,
          absent: records.filter((r) => r.status === "ABSENT").length,
          halfDay: records.filter((r) => r.status === "HALF_DAY").length,
          leave: records.filter((r) => r.status === "LEAVE").length,
          wfh: records.filter((r) => r.status === "WFH").length,
          totalHours: records.reduce((s, r) => s + (r.totalHours || 0), 0).toFixed(2),
        };
      })
    );

    return R.success(res, { month: m, year: y, data: results });
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getLeaveReport = async (req, res) => {
  try {
    const { year, departmentId } = req.query;
    const y = Number(year) || new Date().getFullYear();

    const empWhere = { employmentStatus: { in: ["ACTIVE", "PROBATION"] } };
    if (req.organisationId) empWhere.organisationId = req.organisationId;
    if (departmentId) empWhere.departmentId = Number(departmentId);

    const employees = await prisma.employee.findMany({
      where: empWhere,
      include: {
        leaveBalances: { where: { year: y }, include: { leaveType: true } },
        leaveApplications: {
          where: { startDate: { gte: new Date(y, 0, 1) }, endDate: { lte: new Date(y, 11, 31) }, status: "APPROVED" },
          include: { leaveType: true },
        },
      },
    });

    return R.success(res, { year: y, employees });
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getPayrollReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();

    const orgId = req.organisationId;
    const payrolls = await prisma.payroll.findMany({
      where: { month: m, year: y, ...(orgId ? { employee: { organisationId: orgId } } : {}) },
      include: {
        employee: {
          select: {
            firstName: true, lastName: true, employeeCode: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { employeeCode: "asc" } },
    });

    const totals = {
      grossSalary: payrolls.reduce((s, p) => s + p.grossSalary, 0),
      totalDeductions: payrolls.reduce((s, p) => s + p.totalDeductions, 0),
      netSalary: payrolls.reduce((s, p) => s + p.netSalary, 0),
    };

    return R.success(res, { month: m, year: y, totals, payrolls });
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getAttritionReport = async (req, res) => {
  try {
    const { year } = req.query;
    const y = Number(year) || new Date().getFullYear();

    const orgId = req.organisationId;
    const resigned = await prisma.employee.findMany({
      where: {
        employmentStatus: { in: ["RESIGNED", "TERMINATED"] },
        dateOfLeaving: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31) },
        ...(orgId ? { organisationId: orgId } : {}),
      },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    const total = await prisma.employee.count({ where: { dateOfJoining: { lte: new Date(y, 11, 31) }, ...(orgId ? { organisationId: orgId } : {}) } });
    const attritionRate = total > 0 ? ((resigned.length / total) * 100).toFixed(2) : 0;

    return R.success(res, { year: y, resigned: resigned.length, totalEmployees: total, attritionRate: `${attritionRate}%`, employees: resigned });
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getNewJoinersReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();

    const orgId = req.organisationId;
    const joiners = await prisma.employee.findMany({
      where: { dateOfJoining: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0) }, ...(orgId ? { organisationId: orgId } : {}) },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
    });

    return R.success(res, { month: m, year: y, count: joiners.length, employees: joiners });
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getCTCReport = async (req, res) => {
  try {
    const orgId = req.organisationId;
    const empWhere = { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, ...(orgId ? { organisationId: orgId } : {}) };

    const employees = await prisma.employee.findMany({
      where: empWhere,
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        salaryStructures: { where: { isActive: true }, take: 1, orderBy: { effectiveFrom: "desc" } },
      },
    });

    const data = employees.map(e => {
      const sal = e.salaryStructures[0];
      return {
        employeeCode: e.employeeCode,
        name: `${e.firstName} ${e.lastName || ""}`,
        department: e.department?.name || "—",
        designation: e.designation?.name || "—",
        basicSalary: sal?.basicSalary || 0,
        grossSalary: sal?.grossSalary || 0,
        totalDeductions: sal?.totalDeductions || 0,
        netSalary: sal?.netSalary || 0,
        ctc: sal?.ctc || 0,
      };
    });

    const totals = {
      totalGross: data.reduce((s, d) => s + d.grossSalary, 0),
      totalCTC: data.reduce((s, d) => s + d.ctc, 0),
      totalNet: data.reduce((s, d) => s + d.netSalary, 0),
      employeeCount: data.length,
    };

    return R.success(res, { totals, employees: data });
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Employee Cost Report ──────────────────────────────────────────────────────

export const getEmployeeCostReport = async (req, res) => {
  try {
    const { year } = req.query;
    const y = Number(year) || new Date().getFullYear();
    const orgId = req.organisationId;
    const empWhere = { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, ...(orgId ? { organisationId: orgId } : {}) };

    const employees = await prisma.employee.findMany({
      where: empWhere,
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        salaryStructures: { where: { isActive: true }, take: 1 },
      },
    });

    const data = await Promise.all(employees.map(async (e) => {
      const sal = e.salaryStructures[0];
      const payrolls = await prisma.payroll.findMany({ where: { employeeId: e.id, year: y } });
      const reimbursements = await prisma.reimbursementClaim.findMany({
        where: { employeeId: e.id, status: "APPROVED", claimDate: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31) } },
      });
      const travelClaims = await prisma.travelClaim.findMany({
        where: { employeeId: e.id, status: { in: ["APPROVED", "SETTLED"] }, travelStartDate: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31) } },
      });

      const totalSalaryPaid = payrolls.reduce((s, p) => s + p.netSalary, 0);
      const totalReimbursements = reimbursements.reduce((s, r) => s + r.totalAmount, 0);
      const totalTravel = travelClaims.reduce((s, t) => s + t.totalAmount, 0);

      return {
        employeeCode: e.employeeCode,
        name: `${e.firstName} ${e.lastName || ""}`.trim(),
        department: e.department?.name || "—",
        designation: e.designation?.name || "—",
        monthlyCTC: sal?.ctc || 0,
        annualCTC: (sal?.ctc || 0) * 12,
        totalSalaryPaid,
        totalReimbursements,
        totalTravel,
        totalCostToCompany: totalSalaryPaid + totalReimbursements + totalTravel,
      };
    }));

    const totals = {
      totalSalary: data.reduce((s, d) => s + d.totalSalaryPaid, 0),
      totalReimbursements: data.reduce((s, d) => s + d.totalReimbursements, 0),
      totalTravel: data.reduce((s, d) => s + d.totalTravel, 0),
      grandTotal: data.reduce((s, d) => s + d.totalCostToCompany, 0),
    };

    return R.success(res, { year: y, totals, employees: data });
  } catch (err) { return R.error(res, err.message); }
};

// ── Reimbursement Trend Report ────────────────────────────────────────────────

export const getReimbursementTrendReport = async (req, res) => {
  try {
    const { year } = req.query;
    const y = Number(year) || new Date().getFullYear();
    const orgId = req.organisationId;

    const claims = await prisma.reimbursementClaim.findMany({
      where: { claimDate: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31) } },
      include: { employee: { select: { department: { select: { name: true } } } } },
    });

    const travelClaims = await prisma.travelClaim.findMany({
      where: {
        travelStartDate: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31) },
        ...(orgId ? { organisationId: orgId } : {}),
      },
    });

    // Monthly trend
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      reimbursements: { count: 0, amount: 0 },
      travel: { count: 0, amount: 0 },
    }));

    claims.forEach(c => {
      const m = new Date(c.claimDate).getMonth();
      monthly[m].reimbursements.count++;
      monthly[m].reimbursements.amount += c.totalAmount;
    });

    travelClaims.forEach(t => {
      const m = new Date(t.travelStartDate).getMonth();
      monthly[m].travel.count++;
      monthly[m].travel.amount += t.totalAmount;
    });

    // Status breakdown
    const statusBreakdown = {
      PENDING: claims.filter(c => c.status === "PENDING").length,
      APPROVED: claims.filter(c => c.status === "APPROVED").length,
      REJECTED: claims.filter(c => c.status === "REJECTED").length,
    };

    return R.success(res, {
      year: y,
      totalReimbursements: claims.length,
      totalReimbursementAmount: claims.reduce((s, c) => s + c.totalAmount, 0),
      totalTravelClaims: travelClaims.length,
      totalTravelAmount: travelClaims.reduce((s, t) => s + t.totalAmount, 0),
      monthlyTrend: monthly,
      statusBreakdown,
    });
  } catch (err) { return R.error(res, err.message); }
};

// ── Team Productivity Report ──────────────────────────────────────────────────

export const getTeamProductivityReport = async (req, res) => {
  try {
    const { month, year, departmentId } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();
    const orgId = req.organisationId;

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    const totalDays = end.getDate();

    const empWhere = { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, ...(orgId ? { organisationId: orgId } : {}) };
    if (departmentId) empWhere.departmentId = Number(departmentId);

    const employees = await prisma.employee.findMany({
      where: empWhere,
      select: {
        id: true, firstName: true, lastName: true, employeeCode: true,
        department: { select: { name: true } },
      },
    });

    const results = await Promise.all(employees.map(async (emp) => {
      const attendance = await prisma.attendance.findMany({
        where: { employeeId: emp.id, date: { gte: start, lte: end } },
      });

      const present = attendance.filter(a => ["PRESENT", "WFH"].includes(a.status)).length;
      const absent = attendance.filter(a => a.status === "ABSENT").length;
      const leaves = attendance.filter(a => a.status === "LEAVE").length;
      const halfDays = attendance.filter(a => a.status === "HALF_DAY").length;

      const avgClockIn = attendance.filter(a => a.clockIn).length > 0
        ? new Date(attendance.filter(a => a.clockIn).reduce((s, a) => s + new Date(a.clockIn).getTime(), 0) / attendance.filter(a => a.clockIn).length)
        : null;

      const totalHours = attendance.reduce((s, a) => s + (a.totalHours || 0), 0);
      const attendanceRate = totalDays > 0 ? ((present + halfDays * 0.5) / totalDays * 100).toFixed(1) : 0;

      return {
        employee: { id: emp.id, name: `${emp.firstName} ${emp.lastName || ""}`.trim(), code: emp.employeeCode, department: emp.department?.name },
        present, absent, leaves, halfDays,
        totalHours: totalHours.toFixed(1),
        attendanceRate: Number(attendanceRate),
        avgClockInTime: avgClockIn ? avgClockIn.toTimeString().substring(0, 5) : null,
      };
    }));

    // Sort by attendance rate descending
    results.sort((a, b) => b.attendanceRate - a.attendanceRate);

    return R.success(res, {
      month: m, year: y,
      summary: {
        totalEmployees: results.length,
        avgAttendanceRate: results.length > 0 ? (results.reduce((s, r) => s + r.attendanceRate, 0) / results.length).toFixed(1) : 0,
        totalWorkHours: results.reduce((s, r) => s + Number(r.totalHours), 0).toFixed(1),
      },
      employees: results,
    });
  } catch (err) { return R.error(res, err.message); }
};

// ── Attendance Anomaly Report ─────────────────────────────────────────────────

export const getAnomalyReport = async (req, res) => {
  try {
    const { months } = req.query;
    const anomalies = await detectAnomalies(req.organisationId, { months: Number(months) || 3 });
    return R.success(res, {
      totalAnomalies: anomalies.length,
      high: anomalies.filter(a => a.severity === "HIGH").length,
      medium: anomalies.filter(a => a.severity === "MEDIUM").length,
      low: anomalies.filter(a => a.severity === "LOW").length,
      anomalies,
    });
  } catch (err) { return R.error(res, err.message); }
};
