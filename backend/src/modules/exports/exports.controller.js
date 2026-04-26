import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { streamPayslipPdf } from "../../services/pdf.service.js";
import { streamWorkbook, fmtDate, fmtNum } from "../../services/excel.service.js";
import { logAudit } from "../../services/audit.service.js";

/**
 * Loads a payroll record (with org-isolation + access check) and streams a
 * PDF payslip. EMPLOYEEs can only download their own payslip.
 *
 * GET /api/exports/payslip/:payrollId
 */
export const downloadPayslip = async (req, res) => {
  try {
    const id = Number(req.params.payrollId);
    if (!id || Number.isNaN(id)) return R.notFound(res, "Payroll not found");

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        adjustments: true,
        employee: {
          include: {
            organisation: true,
            designation: { select: { name: true } },
            department: { select: { name: true } },
            salaryStructures: { where: { isActive: true }, take: 1 },
            user: { select: { id: true } },
          },
        },
      },
    });
    if (!payroll) return R.notFound(res, "Payroll not found");

    const emp = payroll.employee;

    // SECURITY: org isolation
    if (req.organisationId && emp.organisationId !== req.organisationId) {
      return R.forbidden(res, "Access denied");
    }
    // SECURITY: employees can only download their own payslip
    if (req.user.role === "EMPLOYEE" && emp.user?.id !== req.user.id) {
      return R.forbidden(res, "Access denied");
    }

    logAudit({
      userId: req.user.id, organisationId: req.organisationId,
      action: "PAYSLIP_DOWNLOAD", module: "payroll",
      entityId: payroll.id, entityType: "Payroll",
      description: `Downloaded payslip for ${emp.firstName} ${emp.lastName} (${payroll.month}/${payroll.year})`,
      req,
    });

    return streamPayslipPdf(res, {
      payroll,
      employee: emp,
      organisation: emp.organisation,
      salaryStructure: emp.salaryStructures?.[0],
      adjustments: payroll.adjustments,
    });
  } catch (err) {
    console.error("[downloadPayslip]", err);
    if (!res.headersSent) return R.error(res, err.message);
  }
};

// ─── Excel exports ──────────────────────────────────────────────────

/** GET /api/exports/employees.xlsx */
export const exportEmployees = async (req, res) => {
  try {
    const where = {};
    if (req.organisationId) where.organisationId = req.organisationId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department:  { select: { name: true } },
        designation: { select: { name: true } },
        user:        { select: { email: true, role: true, isActive: true } },
        manager:     { select: { firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { employeeCode: "asc" },
    });

    const rows = employees.map((e) => ({
      "Employee Code": e.employeeCode,
      "First Name":    e.firstName,
      "Last Name":     e.lastName || "",
      "Email":         e.user?.email || "",
      "Role":          e.user?.role || "",
      "Department":    e.department?.name || "",
      "Designation":   e.designation?.name || "",
      "Manager":       e.manager ? `${e.manager.firstName} ${e.manager.lastName} (${e.manager.employeeCode})` : "",
      "Date of Joining": fmtDate(e.dateOfJoining),
      "Date of Birth":   fmtDate(e.dateOfBirth),
      "Gender":        e.gender || "",
      "Phone":         e.phone || "",
      "Employment Type": e.employmentType || "",
      "Status":        e.employmentStatus || "",
      "PAN":           e.panNumber || "",
      "Aadhaar":       e.aadhaarNumber || "",
      "Bank A/c":      e.bankAccountNumber || "",
      "IFSC":          e.bankIfscCode || "",
      "Active":        e.user?.isActive ? "Yes" : "No",
    }));

    return streamWorkbook(res, `employees_${new Date().toISOString().slice(0,10)}`,
      [{ name: "Employees", rows }]);
  } catch (err) { return R.error(res, err.message); }
};

/** GET /api/exports/attendance.xlsx?from=YYYY-MM-DD&to=YYYY-MM-DD&employeeId=*/
export const exportAttendance = async (req, res) => {
  try {
    const { from, to, employeeId } = req.query;
    const where = {};
    if (from || to) where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to)   where.date.lte = new Date(to);
    if (employeeId) where.employeeId = Number(employeeId);
    if (req.organisationId) where.employee = { organisationId: req.organisationId };

    const records = await prisma.attendance.findMany({
      where,
      include: { employee: { select: { employeeCode: true, firstName: true, lastName: true, department: { select: { name: true } } } } },
      orderBy: [{ date: "asc" }, { employeeId: "asc" }],
      take: 10000,
    });

    const rows = records.map((r) => ({
      "Date":        fmtDate(r.date),
      "Code":        r.employee.employeeCode,
      "Employee":    `${r.employee.firstName} ${r.employee.lastName || ""}`.trim(),
      "Department":  r.employee.department?.name || "",
      "Status":      r.status,
      "Clock In":    r.clockIn ? new Date(r.clockIn).toLocaleTimeString("en-IN") : "",
      "Clock Out":   r.clockOut ? new Date(r.clockOut).toLocaleTimeString("en-IN") : "",
      "Total Hours": fmtNum(r.totalHours),
      "Overtime":    fmtNum(r.overtimeHours),
      "Notes":       r.notes || "",
    }));

    return streamWorkbook(res, `attendance_${from || "all"}_to_${to || "now"}`,
      [{ name: "Attendance", rows }]);
  } catch (err) { return R.error(res, err.message); }
};

/** GET /api/exports/payroll.xlsx?month=&year= */
export const exportPayroll = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = {};
    if (month) where.month = Number(month);
    if (year)  where.year  = Number(year);
    if (req.organisationId) where.employee = { organisationId: req.organisationId };

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: {
          include: {
            department:  { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { employeeId: "asc" }],
    });

    const rows = payrolls.map((p) => ({
      "Month/Year":       `${String(p.month).padStart(2,"0")}/${p.year}`,
      "Code":             p.employee.employeeCode,
      "Name":             `${p.employee.firstName} ${p.employee.lastName || ""}`.trim(),
      "Department":       p.employee.department?.name || "",
      "Designation":      p.employee.designation?.name || "",
      "Working Days":     fmtNum(p.workingDays),
      "Present Days":     fmtNum(p.presentDays),
      "Paid Leaves":      fmtNum(p.paidLeaves),
      "Unpaid Leaves":    fmtNum(p.unpaidLeaves),
      "WFH Days":         fmtNum(p.wfhDays),
      "Gross Salary":     fmtNum(p.grossSalary),
      "Total Deductions": fmtNum(p.totalDeductions),
      "Net Salary":       fmtNum(p.netSalary),
      "Status":           p.paymentStatus,
      "Payment Date":     fmtDate(p.paymentDate),
    }));

    return streamWorkbook(res, `payroll_${month || "all"}_${year || ""}`,
      [{ name: "Payroll", rows }]);
  } catch (err) { return R.error(res, err.message); }
};

/** GET /api/exports/leaves.xlsx?from=&to=&status= */
export const exportLeaves = async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (from || to) where.startDate = {};
    if (from) where.startDate.gte = new Date(from);
    if (to)   where.startDate.lte = new Date(to);
    if (req.organisationId) where.employee = { organisationId: req.organisationId };

    const leaves = await prisma.leaveApplication.findMany({
      where,
      include: {
        employee:  { select: { employeeCode: true, firstName: true, lastName: true, department: { select: { name: true } } } },
        leaveType: { select: { name: true, code: true } },
      },
      orderBy: { startDate: "desc" },
      take: 10000,
    });

    const rows = leaves.map((l) => ({
      "Code":        l.employee.employeeCode,
      "Employee":    `${l.employee.firstName} ${l.employee.lastName || ""}`.trim(),
      "Department":  l.employee.department?.name || "",
      "Leave Type":  l.leaveType?.name || "",
      "From":        fmtDate(l.startDate),
      "To":          fmtDate(l.endDate),
      "Days":        fmtNum(l.totalDays),
      "Status":      l.status,
      "Reason":      l.reason || "",
      "Applied On":  fmtDate(l.createdAt),
    }));

    return streamWorkbook(res, `leaves_${from || "all"}_to_${to || "now"}`,
      [{ name: "Leaves", rows }]);
  } catch (err) { return R.error(res, err.message); }
};
