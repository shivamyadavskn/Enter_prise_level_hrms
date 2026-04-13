import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      onLeaveToday,
      wfhToday,
      pendingLeaves,
      pendingWfh,
      pendingRegularizations,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } } }),
      prisma.attendance.count({ where: { date: today, status: "LEAVE" } }),
      prisma.attendance.count({ where: { date: today, status: "WFH" } }),
      prisma.leaveApplication.count({ where: { status: "PENDING" } }),
      prisma.wfhRequest.count({ where: { status: "PENDING" } }),
      prisma.attendanceRegularization.count({ where: { status: "PENDING" } }),
    ]);

    const presentToday = await prisma.attendance.count({ where: { date: today, status: { in: ["PRESENT", "WFH"] } } });

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
    const byDept = await prisma.employee.groupBy({
      by: ["departmentId", "employmentStatus"],
      _count: { id: true },
      where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
    });

    const departments = await prisma.department.findMany({ select: { id: true, name: true } });
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

    const payrolls = await prisma.payroll.findMany({
      where: { month: m, year: y },
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

    const resigned = await prisma.employee.findMany({
      where: {
        employmentStatus: { in: ["RESIGNED", "TERMINATED"] },
        dateOfLeaving: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31) },
      },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    const total = await prisma.employee.count({ where: { dateOfJoining: { lte: new Date(y, 11, 31) } } });
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

    const joiners = await prisma.employee.findMany({
      where: { dateOfJoining: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0) } },
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
