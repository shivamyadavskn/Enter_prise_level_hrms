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

// ── Update Salary Structure with Revision Tracking ────────────────────────────

export const updateSalaryStructure = async (req, res) => {
  try {
    const data = req.body;
    const {
      employeeId, effectiveFrom, basicSalary, hra, conveyanceAllowance,
      medicalAllowance, specialAllowance, pfEmployee, pfEmployer, professionalTax, tds,
      reason,
    } = data;

    // Get the current active structure for comparison
    const currentStructure = await prisma.salaryStructure.findFirst({
      where: { employeeId: Number(employeeId), isActive: true },
    });

    if (!currentStructure) {
      return R.notFound(res, "No active salary structure found. Use create endpoint instead.");
    }

    // Calculate new values
    const grossSalary = basicSalary + hra + conveyanceAllowance + medicalAllowance + specialAllowance;
    const totalDeductions = pfEmployee + professionalTax + tds;
    const netSalary = grossSalary - totalDeductions;
    const ctc = grossSalary + pfEmployer;

    // Store previous values for revision log
    const previousValues = {
      basicSalary: currentStructure.basicSalary,
      hra: currentStructure.hra,
      conveyanceAllowance: currentStructure.conveyanceAllowance,
      medicalAllowance: currentStructure.medicalAllowance,
      specialAllowance: currentStructure.specialAllowance,
      pfEmployee: currentStructure.pfEmployee,
      pfEmployer: currentStructure.pfEmployer,
      professionalTax: currentStructure.professionalTax,
      tds: currentStructure.tds,
      grossSalary: currentStructure.grossSalary,
      totalDeductions: currentStructure.totalDeductions,
      netSalary: currentStructure.netSalary,
      ctc: currentStructure.ctc,
    };

    const newValues = {
      basicSalary, hra, conveyanceAllowance, medicalAllowance, specialAllowance,
      pfEmployee, pfEmployer, professionalTax, tds,
      grossSalary, totalDeductions, netSalary, ctc,
    };

    // Deactivate old structure
    await prisma.salaryStructure.updateMany({
      where: { employeeId: Number(employeeId), isActive: true },
      data: { isActive: false },
    });

    // Create new structure
    const structure = await prisma.salaryStructure.create({
      data: {
        employeeId: Number(employeeId),
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

    // Log revision
    await prisma.payrollRevision.create({
      data: {
        employeeId: Number(employeeId),
        changedBy: req.user.id,
        changeType: "SALARY_UPDATE",
        previousValues,
        newValues,
        reason: reason || "No reason provided",
      },
    });

    // Create notification for employee
    const emp = await prisma.employee.findUnique({
      where: { id: Number(employeeId) },
      include: { user: true },
    });

    if (emp?.user) {
      await prisma.notification.create({
        data: {
          userId: emp.user.id,
          notificationType: "SALARY_UPDATE",
          title: "Salary Structure Updated",
          message: `Your salary structure has been updated. New Net Salary: ₹${netSalary.toLocaleString("en-IN")}. Effective from: ${effectiveFrom}`,
        },
      });
    }

    return R.success(res, {
      structure,
      revision: {
        previousNet: previousValues.netSalary,
        newNet: netSalary,
        difference: netSalary - previousValues.netSalary,
      },
    }, "Salary structure updated with audit trail");
  } catch (err) {
    return R.error(res, err.message);
  }
};


// ── Get Salary Revision History ───────────────────────────────────────────────

export const getSalaryRevisions = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const where = { employeeId: Number(employeeId) };

    const [revisions, total] = await Promise.all([
      prisma.payrollRevision.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              employee: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      prisma.payrollRevision.count({ where }),
    ]);

    // Format revisions for frontend
    const formattedRevisions = revisions.map((rev) => ({
      id: rev.id,
      changeType: rev.changeType,
      reason: rev.reason,
      createdAt: rev.createdAt,
      changedBy: rev.user
        ? `${rev.user.employee?.firstName || ""} ${rev.user.employee?.lastName || ""}`.trim() || rev.user.username
        : "Unknown",
      changes: Object.keys(rev.newValues || {}).map((key) => ({
        field: key,
        oldValue: rev.previousValues?.[key] || 0,
        newValue: rev.newValues?.[key] || 0,
        difference: (rev.newValues?.[key] || 0) - (rev.previousValues?.[key] || 0),
      })).filter(c => c.oldValue !== c.newValue),
    }));

    return R.paginated(res, formattedRevisions, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Payroll Preview (dry-run — no writes) ────────────────────────────────────

export const previewPayroll = async (req, res) => {
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
      include: {
        salaryStructures: { where: { isActive: true }, take: 1 },
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });

    const preview = [];
    const skipped = [];

    for (const emp of employees) {
      if (!emp.salaryStructures.length) {
        skipped.push({ id: emp.id, name: `${emp.firstName} ${emp.lastName}`, employeeCode: emp.employeeCode, department: emp.department?.name });
        continue;
      }

      const salary = emp.salaryStructures[0];

      const attendance = await prisma.attendance.findMany({
        where: { employeeId: emp.id, date: { gte: start, lte: end } },
      });

      const presentDays = attendance.filter((a) => a.status === "PRESENT").length;
      const halfDays = attendance.filter((a) => a.status === "HALF_DAY").length;
      const absentDays = attendance.filter((a) => a.status === "ABSENT").length;
      const wfhDays = attendance.filter((a) => a.status === "WFH").length;
      const leaveDays = attendance.filter((a) => a.status === "LEAVE").length;

      const leaves = await prisma.leaveApplication.findMany({
        where: { employeeId: emp.id, status: "APPROVED", startDate: { gte: start }, endDate: { lte: end } },
        include: { leaveType: true },
      });

      const paidLeaves = leaves.filter((l) => l.leaveType.code !== "LOP").reduce((s, l) => s + l.totalDays, 0);
      const unpaidLeaves = leaves.filter((l) => l.leaveType.code === "LOP").reduce((s, l) => s + l.totalDays, 0);

      const payableDays = presentDays + (halfDays * 0.5) + wfhDays + paidLeaves;
      const perDaySalary = salary.grossSalary / totalDaysInMonth;
      const grossSalary = Math.round(perDaySalary * payableDays);
      const totalDeductions = salary.totalDeductions;
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      // Check if payroll already exists for this month
      const existing = await prisma.payroll.findUnique({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } },
      });

      // ── Anomaly Detection ──────────────────────────────────────
      const anomalies = [];

      // 1. Zero attendance — forgot to mark?
      if (payableDays === 0 && !emp.dateOfLeaving) {
        anomalies.push({ type: "ZERO_ATTENDANCE", severity: "high", message: "0 payable days — no attendance or leave recorded" });
      }

      // 2. Very low attendance (< 40% of month)
      if (payableDays > 0 && payableDays < totalDaysInMonth * 0.4 && !emp.dateOfLeaving) {
        anomalies.push({ type: "LOW_ATTENDANCE", severity: "medium", message: `Only ${payableDays} of ${totalDaysInMonth} days — verify with employee` });
      }

      // 3. Salary spike vs last month
      if (existing && existing.netSalary > 0) {
        const change = ((netSalary - existing.netSalary) / existing.netSalary) * 100;
        if (Math.abs(change) > 30) {
          anomalies.push({ type: "SALARY_SPIKE", severity: "high", message: `Net pay ${change > 0 ? "increased" : "decreased"} by ${Math.abs(change).toFixed(0)}% vs last processed` });
        }
      }

      // 4. Already processed this month
      if (existing) {
        anomalies.push({ type: "DUPLICATE", severity: "info", message: "Payroll already processed — will overwrite" });
      }

      // 5. Missing PAN (TDS compliance risk)
      if (!emp.panNumber) {
        anomalies.push({ type: "MISSING_PAN", severity: "medium", message: "PAN number missing — TDS at higher rate may apply" });
      }

      // 6. Probation employee
      if (emp.employmentStatus === "PROBATION") {
        anomalies.push({ type: "PROBATION", severity: "info", message: "Employee is on probation" });
      }

      // 7. New joiner (joined this month)
      if (emp.dateOfJoining) {
        const jd = new Date(emp.dateOfJoining);
        if (jd >= start && jd <= end) {
          const daysAfterJoin = totalDaysInMonth - jd.getDate() + 1;
          anomalies.push({ type: "NEW_JOINER", severity: "info", message: `Joined on ${jd.getDate()}th — eligible for ${daysAfterJoin} days max` });
        }
      }

      // 8. High LOP
      if (unpaidLeaves > 5) {
        anomalies.push({ type: "HIGH_LOP", severity: "medium", message: `${unpaidLeaves} unpaid leave days — significant salary impact` });
      }

      preview.push({
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        name: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name,
        designation: emp.designation?.name,
        totalDaysInMonth,
        presentDays,
        halfDays,
        absentDays,
        wfhDays,
        leaveDays,
        paidLeaves,
        unpaidLeaves,
        payableDays,
        perDaySalary: Math.round(perDaySalary),
        monthlySalary: salary.grossSalary,
        grossSalary,
        totalDeductions,
        netSalary,
        alreadyProcessed: !!existing,
        previousNetSalary: existing?.netSalary || null,
        anomalies,
      });
    }

    // Global anomalies
    const globalAnomalies = [];
    if (skipped.length > 0) globalAnomalies.push({ type: "MISSING_SALARY", severity: "high", message: `${skipped.length} employee(s) have no salary structure` });
    if (preview.filter(p => p.payableDays === 0).length > 3) globalAnomalies.push({ type: "MASS_ZERO", severity: "high", message: "Multiple employees with 0 attendance — bulk attendance import may be needed" });

    const totals = {
      totalGross: preview.reduce((s, p) => s + p.grossSalary, 0),
      totalDeductions: preview.reduce((s, p) => s + p.totalDeductions, 0),
      totalNet: preview.reduce((s, p) => s + p.netSalary, 0),
      employeeCount: preview.length,
      anomalyCount: preview.reduce((s, p) => s + p.anomalies.filter(a => a.severity === "high").length, 0),
    };

    return R.success(res, { preview, skipped, totals, month, year, totalDaysInMonth, globalAnomalies });
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Payroll Processing ────────────────────────────────────────────────────────

export const processPayroll = async (req, res) => {
  try {
    const { month, year, employeeIds, workingDaysOverride = {} } = req.body;

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

      // Calculate payable days: present + half days + WFH + paid leaves (all paid)
      // unpaidLeaves (LOP) are NOT payable - these are already excluded
      const calculatedPayableDays = presentDays + (halfDays * 0.5) + wfhDays + paidLeaves;

      // Use manual override if provided (e.g., for new joiners mid-month)
      const payableDays = workingDaysOverride[emp.id] !== undefined
        ? workingDaysOverride[emp.id]
        : calculatedPayableDays;

      // Prorated gross salary based on actual payable days
      const grossSalary = Math.round(perDaySalary * payableDays);

      // Deductions are also prorated (PF, PT, TDS based on actual salary earned)
      // For simplicity, we keep fixed deductions but you could also prorate them
      const totalDeductions = salary.totalDeductions;
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      // Store actual working days (payable days) for reference
      const payroll = await prisma.payroll.upsert({
        where: { employeeId_month_year: { employeeId: emp.id, month, year } },
        update: {
          workingDays: totalDaysInMonth,
          presentDays: payableDays,  // Now stores payable days (not just present)
          paidLeaves,
          unpaidLeaves,
          wfhDays,
          grossSalary,
          totalDeductions,
          netSalary,
          paymentStatus: "PROCESSED"
        },
        create: {
          employeeId: emp.id,
          month,
          year,
          workingDays: totalDaysInMonth,
          presentDays: payableDays,
          paidLeaves,
          unpaidLeaves,
          wfhDays,
          grossSalary,
          totalDeductions,
          netSalary,
          paymentStatus: "PROCESSED"
        },
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
        }).catch(() => { });
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

    console.log("Hello payroll updated", updated);

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
