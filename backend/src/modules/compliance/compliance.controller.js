import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

// ── Compliance Health Score ──────────────────────────────────────────────────

export const getComplianceHealth = async (req, res) => {
  try {
    const orgFilter = req.organisationId ? { organisationId: req.organisationId } : {};
    const empWhere = { employmentStatus: { in: ["ACTIVE", "PROBATION"] }, ...orgFilter };

    const employees = await prisma.employee.findMany({
      where: empWhere,
      include: {
        salaryStructures: { where: { isActive: true }, take: 1 },
        department: { select: { name: true } },
      },
    });

    const org = req.organisationId
      ? await prisma.organisation.findUnique({ where: { id: req.organisationId } })
      : null;

    const checks = [];
    let passed = 0;
    let warnings = 0;
    let critical = 0;

    // ── 1. PAN Number Compliance ────────────────────────────────
    const missingPan = employees.filter((e) => !e.panNumber);
    if (missingPan.length === 0) {
      checks.push({ id: "pan", category: "Tax", title: "PAN Number", status: "pass", message: "All employees have PAN on file", severity: "ok" });
      passed++;
    } else {
      checks.push({
        id: "pan", category: "Tax", title: "PAN Number Missing", status: "fail", severity: "critical",
        message: `${missingPan.length} employee(s) missing PAN — TDS will be deducted at higher rate (20%)`,
        employees: missingPan.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode })),
        action: "Update employee profiles with PAN numbers",
      });
      critical++;
    }

    // ── 2. Bank Details ─────────────────────────────────────────
    const missingBank = employees.filter((e) => !e.bankAccountNumber || !e.bankIFSC);
    if (missingBank.length === 0) {
      checks.push({ id: "bank", category: "Payroll", title: "Bank Details", status: "pass", message: "All employees have bank details", severity: "ok" });
      passed++;
    } else {
      checks.push({
        id: "bank", category: "Payroll", title: "Bank Details Missing", status: "fail", severity: "critical",
        message: `${missingBank.length} employee(s) missing bank account/IFSC — salary cannot be transferred`,
        employees: missingBank.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode })),
        action: "Collect bank details from employees",
      });
      critical++;
    }

    // ── 3. Salary Structure ─────────────────────────────────────
    const missingSalary = employees.filter((e) => !e.salaryStructures?.length);
    if (missingSalary.length === 0) {
      checks.push({ id: "salary", category: "Payroll", title: "Salary Structure", status: "pass", message: "All employees have active salary structure", severity: "ok" });
      passed++;
    } else {
      checks.push({
        id: "salary", category: "Payroll", title: "Salary Structure Missing", status: "fail", severity: "critical",
        message: `${missingSalary.length} employee(s) have no salary structure — payroll cannot be processed`,
        employees: missingSalary.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode })),
        action: "Set up salary structures in Payroll module",
      });
      critical++;
    }

    // ── 4. PF Compliance (employees earning < ₹15,000 basic must have PF) ──
    const pfMandatory = employees.filter((e) => {
      const sal = e.salaryStructures?.[0];
      return sal && sal.basicSalary <= 15000 && sal.pfEmployee === 0;
    });
    if (pfMandatory.length === 0) {
      checks.push({ id: "pf", category: "Statutory", title: "PF Compliance", status: "pass", message: "PF deductions are compliant for all eligible employees", severity: "ok" });
      passed++;
    } else {
      checks.push({
        id: "pf", category: "Statutory", title: "PF Compliance Issue", status: "fail", severity: "warning",
        message: `${pfMandatory.length} employee(s) with basic ≤ ₹15,000 have no PF deduction — PF is mandatory`,
        employees: pfMandatory.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode })),
        action: "Enable PF deduction for these employees",
      });
      warnings++;
    }

    // ── 5. Professional Tax ─────────────────────────────────────
    const missingPT = employees.filter((e) => {
      const sal = e.salaryStructures?.[0];
      return sal && sal.grossSalary > 15000 && sal.professionalTax === 0;
    });
    if (missingPT.length === 0) {
      checks.push({ id: "pt", category: "Statutory", title: "Professional Tax", status: "pass", message: "PT applied for all eligible employees", severity: "ok" });
      passed++;
    } else {
      checks.push({
        id: "pt", category: "Statutory", title: "Professional Tax Missing", status: "fail", severity: "warning",
        message: `${missingPT.length} employee(s) earning > ₹15,000 have no PT deduction`,
        employees: missingPT.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode })),
        action: "Add Professional Tax deduction (₹200/month typical)",
      });
      warnings++;
    }

    // ── 6. Emergency Contact ────────────────────────────────────
    const missingEmergency = employees.filter((e) => !e.emergencyContactName || !e.emergencyContactPhone);
    if (missingEmergency.length === 0) {
      checks.push({ id: "emergency", category: "Employee Safety", title: "Emergency Contacts", status: "pass", message: "All employees have emergency contacts", severity: "ok" });
      passed++;
    } else {
      checks.push({
        id: "emergency", category: "Employee Safety", title: "Emergency Contacts Missing", status: "fail", severity: "warning",
        message: `${missingEmergency.length} employee(s) missing emergency contact information`,
        employees: missingEmergency.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode })),
        action: "Request employees to update emergency contacts in their profile",
      });
      warnings++;
    }

    // ── 7. Date of Birth ────────────────────────────────────────
    const missingDob = employees.filter((e) => !e.dateOfBirth);
    if (missingDob.length === 0) {
      checks.push({ id: "dob", category: "Employee Records", title: "Date of Birth", status: "pass", message: "All employees have DOB on record", severity: "ok" });
      passed++;
    } else {
      checks.push({
        id: "dob", category: "Employee Records", title: "Date of Birth Missing", status: "fail", severity: "info",
        message: `${missingDob.length} employee(s) missing date of birth`,
        employees: missingDob.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode })),
        action: "Update employee profiles with date of birth",
      });
    }

    // ── 8. Date of Joining ──────────────────────────────────────
    const missingDoj = employees.filter((e) => !e.dateOfJoining);
    if (missingDoj.length === 0) {
      checks.push({ id: "doj", category: "Employee Records", title: "Date of Joining", status: "pass", message: "All employees have joining date", severity: "ok" });
      passed++;
    } else {
      checks.push({
        id: "doj", category: "Employee Records", title: "Date of Joining Missing", status: "fail", severity: "warning",
        message: `${missingDoj.length} employee(s) missing date of joining — experience letters cannot be generated`,
        employees: missingDoj.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode })),
        action: "Update employee profiles with joining dates",
      });
      warnings++;
    }

    // ── 9. TDS Deduction Check ──────────────────────────────────
    const lowTds = employees.filter((e) => {
      const sal = e.salaryStructures?.[0];
      return sal && sal.grossSalary * 12 > 500000 && sal.tds === 0;
    });
    if (lowTds.length === 0) {
      checks.push({ id: "tds", category: "Tax", title: "TDS Deductions", status: "pass", message: "TDS applied for all employees above ₹5L annual income", severity: "ok" });
      passed++;
    } else {
      checks.push({
        id: "tds", category: "Tax", title: "TDS Not Deducted", status: "fail", severity: "critical",
        message: `${lowTds.length} employee(s) earn > ₹5L/year but have zero TDS — employer liability risk`,
        employees: lowTds.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode, annual: (e.salaryStructures[0].grossSalary * 12).toFixed(0) })),
        action: "Calculate and apply TDS based on income tax slabs",
      });
      critical++;
    }

    // ── 10. Probation Overdue ───────────────────────────────────
    const probationOverdue = employees.filter((e) => {
      if (e.employmentStatus !== "PROBATION" || !e.dateOfJoining) return false;
      const monthsSince = (Date.now() - new Date(e.dateOfJoining).getTime()) / (30 * 86400000);
      return monthsSince > 6;
    });
    if (probationOverdue.length === 0) {
      checks.push({ id: "probation", category: "HR", title: "Probation Reviews", status: "pass", message: "No overdue probation confirmations", severity: "ok" });
      passed++;
    } else {
      checks.push({
        id: "probation", category: "HR", title: "Probation Overdue", status: "fail", severity: "warning",
        message: `${probationOverdue.length} employee(s) on probation for > 6 months — confirmation pending`,
        employees: probationOverdue.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, code: e.employeeCode })),
        action: "Process probation confirmation or extend with documented reason",
      });
      warnings++;
    }

    const total = checks.length;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;

    return R.success(res, {
      score,
      summary: { total, passed, warnings, critical, info: total - passed - warnings - critical },
      checks,
      employeeCount: employees.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── PF ECR File Generation ──────────────────────────────────────────────────

export const generatePfEcr = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();

    const payrolls = await prisma.payroll.findMany({
      where: {
        month: m, year: y,
        ...(req.organisationId ? { employee: { organisationId: req.organisationId } } : {}),
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, salaryStructures: { where: { isActive: true }, take: 1 } },
        },
      },
    });

    // ECR format: UAN | Member Name | Gross Wages | EPF Wages | EPS Wages | EDLI Wages | EPF Contribution | EPS Contribution | NCP Days | Refund
    const lines = ["#~#UAN#~#MEMBER NAME#~#GROSS WAGES#~#EPF WAGES#~#EPS WAGES#~#EDLI WAGES#~#EPF CONTRI#~#EPS CONTRI#~#NCP DAYS#~#REFUND"];
    for (const p of payrolls) {
      const sal = p.employee.salaryStructures[0];
      if (!sal) continue;
      const name = `${p.employee.firstName} ${p.employee.lastName || ""}`.trim().toUpperCase();
      const epfWages = Math.min(sal.basicSalary, 15000);
      const epfContri = Math.round(epfWages * 0.12);
      const epsContri = Math.round(epfWages * 0.0833);
      const ncpDays = p.workingDays - Math.round(p.presentDays);
      lines.push(`#~#${p.employee.employeeCode}#~#${name}#~#${Math.round(p.grossSalary)}#~#${Math.round(epfWages)}#~#${Math.round(epfWages)}#~#${Math.round(epfWages)}#~#${epfContri}#~#${epsContri}#~#${ncpDays}#~#0`);
    }

    return R.success(res, {
      month: m, year: y,
      employeeCount: payrolls.length,
      ecrContent: lines.join("\n"),
      fileName: `ECR_${y}_${String(m).padStart(2, "0")}.txt`,
    });
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── PT Challan Data ─────────────────────────────────────────────────────────

export const generatePtChallan = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();

    const payrolls = await prisma.payroll.findMany({
      where: {
        month: m, year: y,
        ...(req.organisationId ? { employee: { organisationId: req.organisationId } } : {}),
      },
      include: {
        employee: {
          select: {
            firstName: true, lastName: true, employeeCode: true,
            salaryStructures: { where: { isActive: true }, take: 1 },
          },
        },
      },
    });

    const entries = payrolls.map((p) => {
      const sal = p.employee.salaryStructures[0];
      return {
        name: `${p.employee.firstName} ${p.employee.lastName || ""}`.trim(),
        code: p.employee.employeeCode,
        grossSalary: Math.round(p.grossSalary),
        ptAmount: sal ? sal.professionalTax : 0,
      };
    }).filter((e) => e.ptAmount > 0);

    const totalPt = entries.reduce((s, e) => s + e.ptAmount, 0);

    return R.success(res, {
      month: m, year: y,
      entries,
      totalPt,
      employeeCount: entries.length,
    });
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Bank Payment File (NEFT format) ─────────────────────────────────────────

export const generateBankFile = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();

    const payrolls = await prisma.payroll.findMany({
      where: {
        month: m, year: y,
        paymentStatus: { in: ["PROCESSED", "PENDING"] },
        ...(req.organisationId ? { employee: { organisationId: req.organisationId } } : {}),
      },
      include: {
        employee: {
          select: {
            firstName: true, lastName: true, employeeCode: true,
            bankAccountNumber: true, bankIFSC: true, bankAccountHolder: true, bankName: true,
          },
        },
      },
    });

    const entries = payrolls.map((p) => ({
      name: p.employee.bankAccountHolder || `${p.employee.firstName} ${p.employee.lastName || ""}`.trim(),
      accountNumber: p.employee.bankAccountNumber || "N/A",
      ifsc: p.employee.bankIFSC || "N/A",
      bankName: p.employee.bankName || "N/A",
      amount: p.netSalary,
      employeeCode: p.employee.employeeCode,
      missingBankDetails: !p.employee.bankAccountNumber || !p.employee.bankIFSC,
    }));

    const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
    const missingCount = entries.filter((e) => e.missingBankDetails).length;

    return R.success(res, {
      month: m, year: y,
      entries,
      totalAmount,
      employeeCount: entries.length,
      missingBankDetails: missingCount,
    });
  } catch (err) {
    return R.error(res, err.message);
  }
};
