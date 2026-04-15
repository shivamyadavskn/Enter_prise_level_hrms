import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { logAudit } from "../../services/audit.service.js";

const empSelect = {
  select: {
    id: true, firstName: true, lastName: true, employeeCode: true,
    department: { select: { name: true } },
    designation: { select: { name: true } },
  },
};

// ── Create Travel Claim ───────────────────────────────────────────────────────

export const createTravelClaim = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee profile not found");

    const {
      title, purpose, fromCity, toCity, travelStartDate, travelEndDate,
      travelMode, hotelAmount, transportAmount, mealsAmount,
      perDiemAmount, miscAmount, itinerary, remarks,
    } = req.body;

    if (!title || !fromCity || !toCity || !travelStartDate || !travelEndDate) {
      return R.badRequest(res, "title, fromCity, toCity, travelStartDate, travelEndDate are required");
    }

    const totalAmount = (Number(hotelAmount) || 0) + (Number(transportAmount) || 0) +
      (Number(mealsAmount) || 0) + (Number(perDiemAmount) || 0) + (Number(miscAmount) || 0);

    // Check expense policy for auto-approval
    const policy = await prisma.expensePolicy.findFirst({
      where: { organisationId: req.organisationId || undefined, category: "TRAVEL", isActive: true },
    });

    let autoApproved = false;
    if (policy?.autoApproveBelow && totalAmount < policy.autoApproveBelow) {
      autoApproved = true;
    }
    if (policy?.maxAmountPerClaim && totalAmount > policy.maxAmountPerClaim) {
      return R.badRequest(res, `Total amount ₹${totalAmount} exceeds policy limit of ₹${policy.maxAmountPerClaim}`);
    }

    const claim = await prisma.travelClaim.create({
      data: {
        employeeId: emp.id,
        organisationId: req.organisationId || null,
        title, purpose: purpose || null,
        fromCity, toCity,
        travelStartDate: new Date(travelStartDate),
        travelEndDate: new Date(travelEndDate),
        travelMode: travelMode || null,
        hotelAmount: Number(hotelAmount) || 0,
        transportAmount: Number(transportAmount) || 0,
        mealsAmount: Number(mealsAmount) || 0,
        perDiemAmount: Number(perDiemAmount) || 0,
        miscAmount: Number(miscAmount) || 0,
        totalAmount,
        itinerary: itinerary || null,
        remarks: remarks || null,
        status: autoApproved ? "APPROVED" : "SUBMITTED",
        ...(autoApproved ? { approvedOn: new Date() } : {}),
      },
      include: { employee: empSelect },
    });

    // Notify admins of new travel claim
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN", "FINANCE"] }, isActive: true },
      select: { id: true },
    });
    if (admins.length > 0 && !autoApproved) {
      await prisma.notification.createMany({
        data: admins.map(u => ({
          userId: u.id,
          notificationType: "TRAVEL_CLAIM",
          title: "New Travel Claim",
          message: `${emp.firstName} ${emp.lastName} submitted travel claim: ${title} (₹${totalAmount.toLocaleString("en-IN")})`,
        })),
      });
    }

    await logAudit({
      userId: req.user.id, organisationId: req.organisationId,
      action: "CREATE", module: "travel_claims", entityId: claim.id,
      entityType: "TravelClaim", description: `${title}: ${fromCity} → ${toCity}`, req,
    });

    return R.created(res, claim, autoApproved ? "Travel claim auto-approved" : "Travel claim submitted");
  } catch (err) { return R.error(res, err.message); }
};

// ── List Travel Claims ────────────────────────────────────────────────────────

export const getTravelClaims = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, month, year } = req.query;
    const orgId = req.organisationId || null;
    const where = { ...(orgId ? { organisationId: orgId } : {}) };

    // Employees see only their own
    if (req.user.role === "EMPLOYEE") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!emp) return R.paginated(res, [], 0, page, limit);
      where.employeeId = emp.id;
    } else if (req.user.role === "MANAGER") {
      const mgr = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (mgr) {
        const teamIds = (await prisma.employee.findMany({
          where: { managerId: mgr.id }, select: { id: true },
        })).map(e => e.id);
        where.employeeId = { in: [...teamIds, mgr.id] };
      }
    }

    if (status) where.status = status;
    if (month && year) {
      const m = Number(month), y = Number(year);
      where.travelStartDate = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0) };
    }

    const [claims, total] = await Promise.all([
      prisma.travelClaim.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: { employee: empSelect, approvedBy: empSelect },
      }),
      prisma.travelClaim.count({ where }),
    ]);

    return R.paginated(res, claims, total, page, limit);
  } catch (err) { return R.error(res, err.message); }
};

// ── Approve / Reject Travel Claim ─────────────────────────────────────────────

export const approveTravelClaim = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const approver = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    const claim = await prisma.travelClaim.update({
      where: { id },
      data: { status: "APPROVED", approvedById: approver?.id, approvedOn: new Date() },
      include: { employee: { include: { user: true } } },
    });

    await prisma.notification.create({
      data: {
        userId: claim.employee.userId,
        notificationType: "TRAVEL_APPROVED",
        title: "Travel Claim Approved",
        message: `Your travel claim "${claim.title}" has been approved.`,
      },
    });

    await logAudit({
      userId: req.user.id, organisationId: req.organisationId,
      action: "APPROVE", module: "travel_claims", entityId: id,
      entityType: "TravelClaim", req,
    });

    return R.success(res, claim, "Travel claim approved");
  } catch (err) { return R.error(res, err.message); }
};

export const rejectTravelClaim = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rejectionReason } = req.body;
    if (!rejectionReason) return R.badRequest(res, "Rejection reason required");

    const approver = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    const claim = await prisma.travelClaim.update({
      where: { id },
      data: {
        status: "REJECTED", approvedById: approver?.id,
        approvedOn: new Date(), rejectionReason,
      },
      include: { employee: { include: { user: true } } },
    });

    await prisma.notification.create({
      data: {
        userId: claim.employee.userId,
        notificationType: "TRAVEL_REJECTED",
        title: "Travel Claim Rejected",
        message: `Your travel claim "${claim.title}" was rejected: ${rejectionReason}`,
      },
    });

    await logAudit({
      userId: req.user.id, organisationId: req.organisationId,
      action: "REJECT", module: "travel_claims", entityId: id,
      entityType: "TravelClaim", req,
    });

    return R.success(res, claim, "Travel claim rejected");
  } catch (err) { return R.error(res, err.message); }
};

// ── Travel Analytics ──────────────────────────────────────────────────────────

export const getTravelAnalytics = async (req, res) => {
  try {
    const { year } = req.query;
    const y = Number(year) || new Date().getFullYear();
    const orgId = req.organisationId || null;

    const where = {
      status: { in: ["APPROVED", "SETTLED"] },
      travelStartDate: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31) },
      ...(orgId ? { organisationId: orgId } : {}),
    };

    const claims = await prisma.travelClaim.findMany({
      where,
      include: { employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } } },
    });

    // Monthly trend
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0, count: 0,
    }));
    claims.forEach(c => {
      const m = new Date(c.travelStartDate).getMonth();
      monthlyTrend[m].total += c.totalAmount;
      monthlyTrend[m].count++;
    });

    // Category breakdown
    const categoryBreakdown = {
      hotel: claims.reduce((s, c) => s + c.hotelAmount, 0),
      transport: claims.reduce((s, c) => s + c.transportAmount, 0),
      meals: claims.reduce((s, c) => s + c.mealsAmount, 0),
      perDiem: claims.reduce((s, c) => s + c.perDiemAmount, 0),
      misc: claims.reduce((s, c) => s + c.miscAmount, 0),
    };

    // Department breakdown
    const deptMap = {};
    claims.forEach(c => {
      const dept = c.employee.department?.name || "Unassigned";
      if (!deptMap[dept]) deptMap[dept] = { total: 0, count: 0 };
      deptMap[dept].total += c.totalAmount;
      deptMap[dept].count++;
    });

    // Top spenders
    const empMap = {};
    claims.forEach(c => {
      const name = `${c.employee.firstName} ${c.employee.lastName || ""}`.trim();
      if (!empMap[name]) empMap[name] = 0;
      empMap[name] += c.totalAmount;
    });
    const topSpenders = Object.entries(empMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, amount]) => ({ name, amount }));

    return R.success(res, {
      year: y,
      totalClaims: claims.length,
      totalAmount: claims.reduce((s, c) => s + c.totalAmount, 0),
      monthlyTrend,
      categoryBreakdown,
      departmentBreakdown: Object.entries(deptMap).map(([dept, data]) => ({ department: dept, ...data })),
      topSpenders,
    });
  } catch (err) { return R.error(res, err.message); }
};
