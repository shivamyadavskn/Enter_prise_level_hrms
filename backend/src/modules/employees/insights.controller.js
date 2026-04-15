import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

/**
 * Employee Self-Service Insights — Personal dashboard data
 * Unique feature for small businesses: employees get a rich overview of their status.
 */
export const getMyInsights = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({
      where: { userId: req.user.id },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
    });
    if (!emp) return R.notFound(res, "Employee profile not found");

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // 1. Attendance streak
    const recentAttendance = await prisma.attendance.findMany({
      where: { employeeId: emp.id, date: { lte: today } },
      orderBy: { date: "desc" },
      take: 60,
    });

    let streak = 0;
    for (const a of recentAttendance) {
      if (["PRESENT", "WFH"].includes(a.status)) streak++;
      else break;
    }

    // This month attendance summary
    const monthAttendance = recentAttendance.filter(a => new Date(a.date) >= startOfMonth);
    const monthSummary = {
      present: monthAttendance.filter(a => a.status === "PRESENT").length,
      wfh: monthAttendance.filter(a => a.status === "WFH").length,
      absent: monthAttendance.filter(a => a.status === "ABSENT").length,
      leave: monthAttendance.filter(a => a.status === "LEAVE").length,
      halfDay: monthAttendance.filter(a => a.status === "HALF_DAY").length,
    };

    // 2. Leave balances
    const leaveBalances = await prisma.leaveBalance.findMany({
      where: { employeeId: emp.id, year: today.getFullYear() },
      include: { leaveType: { select: { name: true, code: true } } },
    });

    // 3. Pending requests
    const [pendingLeaves, pendingWfh, pendingReimbursements, pendingTravel] = await Promise.all([
      prisma.leaveApplication.count({ where: { employeeId: emp.id, status: "PENDING" } }),
      prisma.wfhRequest.count({ where: { employeeId: emp.id, status: "PENDING" } }),
      prisma.reimbursementClaim.count({ where: { employeeId: emp.id, status: "PENDING" } }),
      prisma.travelClaim.count({ where: { employeeId: emp.id, status: "SUBMITTED" } }),
    ]);

    // 4. Payroll trend (last 6 months)
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const payrollHistory = await prisma.payroll.findMany({
      where: {
        employeeId: emp.id,
        OR: [
          { year: { gt: sixMonthsAgo.getFullYear() } },
          { year: sixMonthsAgo.getFullYear(), month: { gte: sixMonthsAgo.getMonth() + 1 } },
        ],
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
      select: { month: true, year: true, grossSalary: true, netSalary: true, totalDeductions: true, paymentStatus: true },
    });

    // 5. Upcoming holidays (next 30 days)
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const holidays = await prisma.holiday.findMany({
      where: {
        date: { gte: today, lte: thirtyDaysLater },
        isActive: true,
        ...(req.organisationId ? { organisationId: req.organisationId } : {}),
      },
      orderBy: { date: "asc" },
      select: { name: true, date: true, type: true },
    });

    // 6. Recent notifications (unread)
    const unreadNotifications = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    // 7. My assets
    const myAssets = await prisma.asset.findMany({
      where: { assignedToId: emp.id, isActive: true },
      select: { name: true, assetCode: true, category: true },
    });

    // 8. Work anniversary / tenure
    const tenure = emp.dateOfJoining
      ? Math.floor((today - new Date(emp.dateOfJoining)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;
    const daysInCompany = emp.dateOfJoining
      ? Math.floor((today - new Date(emp.dateOfJoining)) / (24 * 60 * 60 * 1000))
      : null;

    return R.success(res, {
      profile: {
        name: `${emp.firstName} ${emp.lastName || ""}`.trim(),
        employeeCode: emp.employeeCode,
        department: emp.department?.name,
        designation: emp.designation?.name,
        manager: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName || ""}`.trim() : null,
        tenureYears: tenure,
        daysSinceJoining: daysInCompany,
        dateOfJoining: emp.dateOfJoining,
      },
      attendance: {
        currentStreak: streak,
        thisMonth: monthSummary,
      },
      leaveBalances: leaveBalances.map(lb => ({
        type: lb.leaveType.name,
        code: lb.leaveType.code,
        available: lb.available,
        consumed: lb.consumed,
        total: lb.openingBalance + lb.accrued,
      })),
      pendingRequests: {
        leaves: pendingLeaves,
        wfh: pendingWfh,
        reimbursements: pendingReimbursements,
        travel: pendingTravel,
        total: pendingLeaves + pendingWfh + pendingReimbursements + pendingTravel,
      },
      payrollTrend: payrollHistory,
      upcomingHolidays: holidays,
      unreadNotifications,
      myAssets,
    });
  } catch (err) { return R.error(res, err.message); }
};
