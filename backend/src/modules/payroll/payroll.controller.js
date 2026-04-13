import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

// ── Salary Structures ─────────────────────────────────────────────────────────

export const getSalaryStructure = async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);

    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!self || self.id !== employeeId) return R.forbidden(res, "Access denied");
    }

    const structures = await prisma.salaryStructure.findMany({
      where: { employeeId },
      orderBy: { effectiveFrom: "desc" },
    });

    return R.success(res, structures);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const upsertSalaryStructure = async (req, res) => {
  try {
    const data = req.body;
    const {
      employeeId, effectiveFrom, basicSalary, hra, conveyanceAllowance,
      medicalAllowance, specialAllowance, pfEmployee, pfEmployer, professionalTax, tds,
    } = data;

    const grossSalary = basicSalary + hra + conveyanceAllowance + medicalAllowance + specialAllowance;
    const totalDeductions = pfEmployee + professionalTax + tds;
    const netSalary = grossSalary - totalDeductions;
    const ctc = grossSalary + pfEmployer;

    await prisma.salaryStructure.updateMany({ where: { employeeId, isActive: true }, data: { isActive: false } });

    const structure = await prisma.salaryStructure.create({
      data: {
        employeeId,
        effectiveFrom: new Date(effectiveFrom),
        basicSalary, hra, conveyanceAllowance, medicalAllowance, specialAllowance,
        grossSalary,
        pfEmployee, pfEmployer, professionalTax, tds,
        totalDeductions,
        netSalary,
        ctc,
        isActive: true,
      },
    });

    return R.created(res, structure, "Salary structure saved");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Payroll Processing ────────────────────────────────────────────────────────

export const processPayroll = async (req, res) => {
  try {
    const { month, year, employeeIds } = req.body;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const totalDaysInMonth = end.getDate();

    const whereEmp = {
      employmentStatus: { in: ["ACTIVE", "PROBATION"] },
    };
    if (employeeIds?.length) whereEmp.id = { in: employeeIds };

    const employees = await prisma.employee.findMany({
      where: whereEmp,
      include: { salaryStructures: { where: { isActive: true }, take: 1 } },
    });

    const results = [];

    for (const emp of employees) {
      if (!emp.salaryStructures.length) continue;

      const salary = emp.salaryStructures[0];

      const attendance = await prisma.attendance.findMany({
        where: { employeeId: emp.id, date: { gte: start, lte: end } },
      });

      const presentDays = attendance.filter((a) => a.status === "PRESENT").length;
      const halfDays = attendance.filter((a) => a.status === "HALF_DAY").length;
      const wfhDays = attendance.filter((a) => a.status === "WFH").length;
      const leaveDays = attendance.filter((a) => a.status === "LEAVE").length;
      const effectivePresent = presentDays + halfDays * 0.5 + wfhDays + leaveDays;

      const leaves = await prisma.leaveApplication.findMany({
        where: { employeeId: emp.id, status: "APPROVED", startDate: { gte: start }, endDate: { lte: end } },
        include: { leaveType: true },
      });

      const paidLeaves = leaves.filter((l) => l.leaveType.code !== "LOP").reduce((s, l) => s + l.totalDays, 0);
      const unpaidLeaves = leaves.filter((l) => l.leaveType.code === "LOP").reduce((s, l) => s + l.totalDays, 0);

      const perDaySalary = salary.grossSalary / totalDaysInMonth;
      const lopDeduction = unpaidLeaves * perDaySalary;

      const grossSalary = salary.grossSalary - lopDeduction;
      const totalDeductions = salary.totalDeductions;
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      const payroll = await prisma.payroll.upsert({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } },
        update: { workingDays: totalDaysInMonth, presentDays: effectivePresent, paidLeaves, unpaidLeaves, wfhDays, grossSalary, totalDeductions, netSalary, paymentStatus: "PROCESSED" },
        create: { employeeId: emp.id, month, year, workingDays: totalDaysInMonth, presentDays: effectivePresent, paidLeaves, unpaidLeaves, wfhDays, grossSalary, totalDeductions, netSalary, paymentStatus: "PROCESSED" },
      });

      results.push(payroll);
    }

    return R.success(res, { processed: results.length, payrolls: results }, `Payroll processed for ${results.length} employees`);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getPayrolls = async (req, res) => {
  try {
    const { page = 1, limit = 10, month, year, employeeId, paymentStatus } = req.query;
    const where = {};

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.notFound(res, "Employee not found");
      where.employeeId = emp.id;
    } else if (req.user.role === "FINANCE" || ["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      if (employeeId) where.employeeId = Number(employeeId);
    } else {
      return R.forbidden(res, "Access denied");
    }

    if (month) where.month = Number(month);
    if (year) where.year = Number(year);
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } }, designation: { select: { name: true } } } } },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
      prisma.payroll.count({ where }),
    ]);

    return R.paginated(res, payrolls, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getPayrollById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            salaryStructures: { where: { isActive: true }, take: 1 },
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });

    if (!payroll) return R.notFound(res, "Payroll not found");

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp || emp.id !== payroll.employeeId) return R.forbidden(res, "Access denied");
    }

    return R.success(res, payroll);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getMyPayslips = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee not found");

    const payslips = await prisma.payroll.findMany({
      where: { employeeId: emp.id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return R.success(res, payslips);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { paymentStatus, paymentDate } = req.body;

    const payroll = await prisma.payroll.update({
      where: { id },
      data: { paymentStatus, paymentDate: paymentDate ? new Date(paymentDate) : undefined },
    });

    if (paymentStatus === "PAID") {
      await prisma.notification.create({
        data: {
          userId: (await prisma.employee.findUnique({ where: { id: payroll.employeeId }, include: { user: true } })).user.id,
          notificationType: "PAYSLIP",
          title: "Salary Credited",
          message: `Your salary for ${payroll.month}/${payroll.year} has been credited. Net Pay: ₹${payroll.netSalary.toFixed(2)}`,
        },
      });
    }

    return R.success(res, payroll, "Payment status updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();

    const payrolls = await prisma.payroll.findMany({
      where: { month: m, year: y },
      include: { employee: { include: { department: { select: { name: true } } } } },
    });

    const summary = {
      month: m,
      year: y,
      totalEmployees: payrolls.length,
      totalGross: payrolls.reduce((s, p) => s + p.grossSalary, 0),
      totalDeductions: payrolls.reduce((s, p) => s + p.totalDeductions, 0),
      totalNet: payrolls.reduce((s, p) => s + p.netSalary, 0),
      paid: payrolls.filter((p) => p.paymentStatus === "PAID").length,
      pending: payrolls.filter((p) => p.paymentStatus === "PENDING").length,
      processed: payrolls.filter((p) => p.paymentStatus === "PROCESSED").length,
    };

    return R.success(res, summary);
  } catch (err) {
    return R.error(res, err.message);
  }
};
