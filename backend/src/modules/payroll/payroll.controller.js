import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { sendPayslipReady } from "../../services/email.service.js";

// ── Salary Structures ─────────────────────────────────────────────────────────

export const getMissingSalaryStructures = async (req, res) => {
  try {
    const allActive = await prisma.employee.findMany({
      where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, ...(req.organisationId ? { organisationId: req.organisationId } : {}) },
      include: { salaryStructures: { where: { isActive: true }, take: 1 }, department: { select: { name: true } }, designation: { select: { name: true } } },
    });
    const missing = allActive.filter((e) => e.salaryStructures.length === 0).map((e) => ({
      id: e.id, employeeCode: e.employeeCode, name: `${e.firstName} ${e.lastName}`,
      department: e.department?.name, designation: e.designation?.name,
      dateOfJoining: e.dateOfJoining, employmentStatus: e.employmentStatus,
    }));
    return R.success(res, missing, `${missing.length} employee(s) missing salary structure`);
  } catch (err) {
    return R.error(res, err.message);
  }
};

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
      ...(req.organisationId ? { organisationId: req.organisationId } : {}),
    };
    if (employeeIds?.length) whereEmp.id = { in: employeeIds };

    const employees = await prisma.employee.findMany({
      where: whereEmp,
      include: { salaryStructures: { where: { isActive: true }, take: 1 }, user: { select: { email: true } } },
    });

    const results = [];
    const skipped = [];

    for (const emp of employees) {
      if (!emp.salaryStructures.length) {
        skipped.push({ id: emp.id, name: `${emp.firstName} ${emp.lastName}`, employeeCode: emp.employeeCode });
        continue;
      }

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

      if (emp.user?.email) {
        sendPayslipReady({
          email: emp.user.email,
          firstName: emp.firstName,
          month,
          year,
          grossSalary,
          netSalary,
        }).catch(() => {});
      }
    }

    const msg = skipped.length
      ? `Payroll processed for ${results.length} employee(s). ${skipped.length} skipped (no salary structure): ${skipped.map((s) => s.name).join(", ")}`
      : `Payroll processed for ${results.length} employee(s)`;
    return R.success(res, { processed: results.length, skipped, payrolls: results }, msg);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getPayrolls = async (req, res) => {
  try {
    const { page = 1, limit = 10, month, year, employeeId, paymentStatus } = req.query;
    const where = {};

    if (req.organisationId) where.employee = { organisationId: req.organisationId };

    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.notFound(res, "Employee not found");
      where.employeeId = emp.id;
      delete where.employee;
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
      const emp = await prisma.employee.findUnique({ where: { id: payroll.employeeId }, include: { user: true } });
      if (emp?.user) {
        await prisma.notification.create({
          data: {
            userId: emp.user.id,
            notificationType: "PAYSLIP",
            title: "Salary Credited",
            message: `Your salary for ${payroll.month}/${payroll.year} has been credited. Net Pay: ₹${payroll.netSalary.toFixed(2)}`,
          },
        });
      }
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

    const payrollWhere = { month: m, year: y };
    if (req.organisationId) payrollWhere.employee = { organisationId: req.organisationId };
    const payrolls = await prisma.payroll.findMany({
      where: payrollWhere,
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

// ── Payroll Adjustments (Bonus, Deduction, Advance, Overtime) ─────────────────

export const addPayrollAdjustment = async (req, res) => {
  try {
    const { employeeId, month, year, type, amount, description } = req.body;

    if (!employeeId || !month || !year || !type || !amount) {
      return R.badRequest(res, "employeeId, month, year, type, and amount are required");
    }

    const payroll = await prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId: Number(employeeId), month: Number(month), year: Number(year) } },
    });
    if (!payroll) return R.notFound(res, "Payroll record not found. Process payroll first.");

    const adjustment = await prisma.payrollAdjustment.create({
      data: {
        payrollId: payroll.id,
        type,
        amount: Number(amount),
        description: description || null,
        approvedBy: req.user.id,
      },
    });

    // Recalculate net salary
    const allAdj = await prisma.payrollAdjustment.findMany({ where: { payrollId: payroll.id } });
    const bonuses = allAdj.filter(a => ["BONUS", "OVERTIME", "INCENTIVE", "REIMBURSEMENT_PAYOUT"].includes(a.type)).reduce((s, a) => s + a.amount, 0);
    const deductions = allAdj.filter(a => ["DEDUCTION", "ADVANCE"].includes(a.type)).reduce((s, a) => s + a.amount, 0);

    const updatedPayroll = await prisma.payroll.update({
      where: { id: payroll.id },
      data: { netSalary: payroll.grossSalary - payroll.totalDeductions + bonuses - deductions },
    });

    return R.created(res, { adjustment, updatedNetSalary: updatedPayroll.netSalary }, "Adjustment added");
  } catch (err) { return R.error(res, err.message); }
};

export const getPayrollAdjustments = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    if (!employeeId || !month || !year) return R.badRequest(res, "employeeId, month, year are required");

    const payroll = await prisma.payroll.findUnique({
      where: { employeeId_month_year: { employeeId: Number(employeeId), month: Number(month), year: Number(year) } },
      include: { adjustments: { orderBy: { createdAt: "desc" } } },
    });
    if (!payroll) return R.notFound(res, "Payroll record not found");

    return R.success(res, payroll.adjustments);
  } catch (err) { return R.error(res, err.message); }
};

// ── Bulk Payment Status Update ────────────────────────────────────────────────

export const bulkUpdatePaymentStatus = async (req, res) => {
  try {
    const { payrollIds, paymentStatus, paymentDate } = req.body;
    if (!payrollIds?.length || !paymentStatus) {
      return R.badRequest(res, "payrollIds and paymentStatus are required");
    }

    const updated = await prisma.payroll.updateMany({
      where: { id: { in: payrollIds } },
      data: { paymentStatus, paymentDate: paymentDate ? new Date(paymentDate) : undefined },
    });

    // Notify employees if marked as PAID
    if (paymentStatus === "PAID") {
      const payrolls = await prisma.payroll.findMany({
        where: { id: { in: payrollIds } },
        include: { employee: { include: { user: true } } },
      });

      await Promise.all(payrolls.map(p => {
        if (p.employee?.user) {
          return prisma.notification.create({
            data: {
              userId: p.employee.user.id,
              notificationType: "PAYSLIP",
              title: "Salary Credited",
              message: `Your salary for ${p.month}/${p.year} has been credited. Net Pay: ₹${p.netSalary.toFixed(2)}`,
            },
          });
        }
      }));
    }

    return R.success(res, { updated: updated.count }, `${updated.count} payrolls updated to ${paymentStatus}`);
  } catch (err) { return R.error(res, err.message); }
};

// ── Payroll Cost Forecast ─────────────────────────────────────────────────────

export const getPayrollForecast = async (req, res) => {
  try {
    const orgId = req.organisationId;
    const empWhere = {
      employmentStatus: { in: ["ACTIVE", "PROBATION"] },
      ...(orgId ? { organisationId: orgId } : {}),
    };

    // Current salary structures
    const employees = await prisma.employee.findMany({
      where: empWhere,
      include: {
        salaryStructures: { where: { isActive: true }, take: 1 },
        department: { select: { name: true } },
      },
    });

    let totalGross = 0, totalNet = 0, totalCTC = 0, totalDeductions = 0;
    const byDepartment = {};

    employees.forEach(emp => {
      const sal = emp.salaryStructures[0];
      if (!sal) return;

      totalGross += sal.grossSalary;
      totalNet += sal.netSalary;
      totalCTC += sal.ctc;
      totalDeductions += sal.totalDeductions;

      const dept = emp.department?.name || "Unassigned";
      if (!byDepartment[dept]) byDepartment[dept] = { gross: 0, net: 0, ctc: 0, employees: 0 };
      byDepartment[dept].gross += sal.grossSalary;
      byDepartment[dept].net += sal.netSalary;
      byDepartment[dept].ctc += sal.ctc;
      byDepartment[dept].employees++;
    });

    // Historical trend (last 6 months)
    const now = new Date();
    const historicalMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1, y = d.getFullYear();
      const payrolls = await prisma.payroll.findMany({
        where: { month: m, year: y, ...(orgId ? { employee: { organisationId: orgId } } : {}) },
      });
      historicalMonths.push({
        month: m, year: y,
        totalGross: payrolls.reduce((s, p) => s + p.grossSalary, 0),
        totalNet: payrolls.reduce((s, p) => s + p.netSalary, 0),
        employees: payrolls.length,
      });
    }

    // Simple forecast: if current structures are maintained next month
    const nextMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
    const nextYear = nextMonth === 1 ? now.getFullYear() + 1 : now.getFullYear();

    return R.success(res, {
      forecast: {
        month: nextMonth,
        year: nextYear,
        projectedGross: totalGross,
        projectedNet: totalNet,
        projectedCTC: totalCTC,
        projectedDeductions: totalDeductions,
        employeesWithSalary: employees.filter(e => e.salaryStructures.length > 0).length,
        employeesWithoutSalary: employees.filter(e => e.salaryStructures.length === 0).length,
      },
      departmentBreakdown: Object.entries(byDepartment).map(([dept, data]) => ({
        department: dept, ...data,
      })),
      historicalTrend: historicalMonths,
    });
  } catch (err) { return R.error(res, err.message); }
};
