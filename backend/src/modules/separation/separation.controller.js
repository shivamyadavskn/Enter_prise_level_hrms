import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

// ── Initiate Separation ──────────────────────────────────────────────────────

export const initiateSeparation = async (req, res) => {
  try {
    const { employeeId, separationType, reason, resignationDate, lastWorkingDate, noticePeriodDays } = req.body;

    const emp = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { salaryStructures: { where: { isActive: true }, take: 1 }, assignedAssets: { where: { isActive: true } } },
    });
    if (!emp) return R.notFound(res, "Employee not found");

    const existing = await prisma.separation.findUnique({ where: { employeeId } });
    if (existing) return R.badRequest(res, "Separation already initiated for this employee");

    const assets = emp.assignedAssets.map((a) => ({
      id: a.id, name: a.name, assetCode: a.assetCode, category: a.category, status: "PENDING",
    }));

    const separation = await prisma.separation.create({
      data: {
        employeeId,
        organisationId: emp.organisationId,
        separationType,
        reason,
        resignationDate: resignationDate ? new Date(resignationDate) : null,
        lastWorkingDate: lastWorkingDate ? new Date(lastWorkingDate) : null,
        noticePeriodDays: noticePeriodDays || 30,
        assetsToRecover: assets,
        assetRecoveryStatus: assets.length > 0 ? "PENDING" : "NA",
        initiatedBy: req.user.id,
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    });

    return R.created(res, separation, "Separation initiated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Get All Separations ──────────────────────────────────────────────────────

export const getSeparations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (req.organisationId) where.organisationId = req.organisationId;
    if (status) where.status = status;

    const [separations, total] = await Promise.all([
      prisma.separation.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true, employeeCode: true,
              department: { select: { name: true } }, designation: { select: { name: true } },
              dateOfJoining: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.separation.count({ where }),
    ]);

    return R.paginated(res, separations, total, Number(page), Number(limit));
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Get Separation by ID ────────────────────────────────────────────────────

export const getSeparationById = async (req, res) => {
  try {
    const sep = await prisma.separation.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        employee: {
          include: {
            department: { select: { name: true } },
            designation: { select: { name: true } },
            salaryStructures: { where: { isActive: true }, take: 1 },
            assignedAssets: { where: { isActive: true } },
          },
        },
      },
    });
    if (!sep) return R.notFound(res, "Separation not found");
    return R.success(res, sep);
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Calculate FnF (Full & Final Settlement) ─────────────────────────────────

export const calculateFnF = async (req, res) => {
  try {
    const sep = await prisma.separation.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        employee: {
          include: { salaryStructures: { where: { isActive: true }, take: 1 }, leaveBalances: { include: { leaveType: true } } },
        },
      },
    });
    if (!sep) return R.notFound(res, "Separation not found");

    const sal = sep.employee.salaryStructures[0];
    if (!sal) return R.badRequest(res, "No salary structure found for this employee");

    const perDaySalary = sal.grossSalary / 30;
    const lwd = sep.lastWorkingDate || new Date();

    // 1. Pending salary (from 1st to LWD of last month)
    const dayOfMonth = new Date(lwd).getDate();
    const pendingSalary = Math.round(perDaySalary * dayOfMonth);

    // 2. Notice period shortfall recovery
    const noticeDaysShort = Math.max(0, sep.noticePeriodDays - sep.noticePeriodServed);
    const noticeRecovery = Math.round(perDaySalary * noticeDaysShort);

    // 3. Leave encashment
    let leaveEncashment = 0;
    const encashableLeaves = sep.employee.leaveBalances.filter(
      (lb) => lb.leaveType.encashmentAllowed && lb.available > 0
    );
    for (const lb of encashableLeaves) {
      leaveEncashment += Math.round(lb.available * perDaySalary);
    }

    // 4. Gratuity (if > 5 years service)
    let gratuity = 0;
    if (sep.employee.dateOfJoining) {
      const yearsOfService = (lwd - new Date(sep.employee.dateOfJoining)) / (365.25 * 86400000);
      if (yearsOfService >= 5) {
        gratuity = Math.round((sal.basicSalary * 15 * yearsOfService) / 26);
      }
    }

    // 5. PF settlement (employee + employer)
    const pfSettlement = Math.round((sal.pfEmployee + (sal.pfEmployer || 0)));

    const breakdown = {
      pendingSalary,
      leaveEncashment,
      gratuity,
      pfSettlement,
      noticeRecovery,
      encashableLeaves: encashableLeaves.map((lb) => ({
        type: lb.leaveType.name,
        days: lb.available,
        amount: Math.round(lb.available * perDaySalary),
      })),
      totalEarnings: pendingSalary + leaveEncashment + gratuity + pfSettlement,
      totalDeductions: noticeRecovery + sal.totalDeductions,
      netPayable: pendingSalary + leaveEncashment + gratuity + pfSettlement - noticeRecovery - sal.totalDeductions,
    };

    const updated = await prisma.separation.update({
      where: { id: sep.id },
      data: {
        fnfAmount: breakdown.netPayable,
        fnfBreakdown: breakdown,
        noticePeriodShortfall: noticeDaysShort,
        status: "FNF_CALCULATED",
      },
    });

    return R.success(res, { separation: updated, fnfBreakdown: breakdown }, "FnF calculated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Update Separation ───────────────────────────────────────────────────────

export const updateSeparation = async (req, res) => {
  try {
    const { lastWorkingDate, noticePeriodServed, exitInterviewDone, exitFeedback, assetRecoveryStatus, assetsToRecover, status, remarks } = req.body;

    const data = {};
    if (lastWorkingDate !== undefined) data.lastWorkingDate = new Date(lastWorkingDate);
    if (noticePeriodServed !== undefined) data.noticePeriodServed = noticePeriodServed;
    if (exitInterviewDone !== undefined) data.exitInterviewDone = exitInterviewDone;
    if (exitFeedback !== undefined) data.exitFeedback = exitFeedback;
    if (assetRecoveryStatus !== undefined) data.assetRecoveryStatus = assetRecoveryStatus;
    if (assetsToRecover !== undefined) data.assetsToRecover = assetsToRecover;
    if (status !== undefined) data.status = status;
    if (remarks !== undefined) data.remarks = remarks;
    if (status === "COMPLETED") data.completedDate = new Date();

    const sep = await prisma.separation.update({
      where: { id: Number(req.params.id) },
      data,
    });

    // If completed, update employee status
    if (status === "COMPLETED") {
      await prisma.employee.update({
        where: { id: sep.employeeId },
        data: { employmentStatus: sep.separationType === "TERMINATION" ? "TERMINATED" : "RESIGNED", dateOfLeaving: sep.lastWorkingDate || new Date() },
      });
    }

    return R.success(res, sep, "Separation updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Cancel Separation ────────────────────────────────────────────────────────

export const cancelSeparation = async (req, res) => {
  try {
    const sep = await prisma.separation.update({
      where: { id: Number(req.params.id) },
      data: { status: "CANCELLED", remarks: req.body.reason || "Cancelled" },
    });
    return R.success(res, sep, "Separation cancelled");
  } catch (err) {
    return R.error(res, err.message);
  }
};
