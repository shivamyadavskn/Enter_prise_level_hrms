import prisma from "../config/prisma.js";

/**
 * Smart Attendance Anomaly Detection
 * Flags unusual patterns for small businesses to proactively manage attendance.
 */
export async function detectAnomalies(organisationId, { months = 3 } = {}) {
  const anomalies = [];
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const empWhere = {
    employmentStatus: { in: ["ACTIVE", "PROBATION"] },
    ...(organisationId ? { organisationId } : {}),
  };

  const employees = await prisma.employee.findMany({
    where: empWhere,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      department: { select: { name: true } },
    },
  });

  for (const emp of employees) {
    const attendance = await prisma.attendance.findMany({
      where: { employeeId: emp.id, date: { gte: cutoff } },
      orderBy: { date: "asc" },
    });

    if (attendance.length === 0) continue;

    // 1. Frequent Monday/Friday absences (> 30%)
    const monFriRecords = attendance.filter((a) => {
      const day = new Date(a.date).getDay();
      return day === 1 || day === 5;
    });
    const monFriAbsent = monFriRecords.filter(
      (a) => a.status === "ABSENT" || a.status === "LEAVE",
    ).length;
    if (
      monFriRecords.length >= 4 &&
      monFriAbsent / monFriRecords.length > 0.3
    ) {
      anomalies.push({
        type: "FREQUENT_MON_FRI_ABSENCE",
        severity: "MEDIUM",
        employee: {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          code: emp.employeeCode,
          department: emp.department?.name,
        },
        detail: `${monFriAbsent}/${monFriRecords.length} Monday/Friday absences (${((monFriAbsent / monFriRecords.length) * 100).toFixed(0)}%)`,
      });
    }

    // 2. Consistent late clock-ins (clock-in after 10:30 AM > 40% of days)
    const clockedIn = attendance.filter((a) => a.clockIn);
    const lateCount = clockedIn.filter((a) => {
      const hour = new Date(a.clockIn).getHours();
      const min = new Date(a.clockIn).getMinutes();
      return hour > 10 || (hour === 10 && min > 30);
    }).length;
    if (clockedIn.length >= 10 && lateCount / clockedIn.length > 0.4) {
      anomalies.push({
        type: "CONSISTENT_LATE_ARRIVAL",
        severity: "LOW",
        employee: {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          code: emp.employeeCode,
          department: emp.department?.name,
        },
        detail: `Late ${lateCount}/${clockedIn.length} days (${((lateCount / clockedIn.length) * 100).toFixed(0)}%)`,
      });
    }

    // 3. Sudden attendance drop (last 2 weeks vs previous avg)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentRecords = attendance.filter(
      (a) => new Date(a.date) >= twoWeeksAgo,
    );
    const olderRecords = attendance.filter(
      (a) => new Date(a.date) < twoWeeksAgo,
    );

    if (recentRecords.length >= 5 && olderRecords.length >= 10) {
      const recentPresent =
        recentRecords.filter((a) => ["PRESENT", "WFH"].includes(a.status))
          .length / recentRecords.length;
      const olderPresent =
        olderRecords.filter((a) => ["PRESENT", "WFH"].includes(a.status))
          .length / olderRecords.length;

      if (olderPresent > 0.7 && recentPresent < 0.5) {
        anomalies.push({
          type: "SUDDEN_ATTENDANCE_DROP",
          severity: "HIGH",
          employee: {
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            code: emp.employeeCode,
            department: emp.department?.name,
          },
          detail: `Attendance dropped from ${(olderPresent * 100).toFixed(0)}% to ${(recentPresent * 100).toFixed(0)}% in last 2 weeks`,
        });
      }
    }

    // 4. Excessive short leaves (> 5 single-day leaves in the period)
    const leaves = await prisma.leaveApplication.findMany({
      where: {
        employeeId: emp.id,
        startDate: { gte: cutoff },
        totalDays: 1,
        status: "APPROVED",
      },
    });
    if (leaves.length > 5) {
      anomalies.push({
        type: "EXCESSIVE_SHORT_LEAVES",
        severity: "LOW",
        employee: {
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          code: emp.employeeCode,
          department: emp.department?.name,
        },
        detail: `${leaves.length} single-day leaves in ${months} months`,
      });
    }
  }

  return anomalies.sort((a, b) => {
    const sev = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (sev[b.severity] || 0) - (sev[a.severity] || 0);
  });
}
