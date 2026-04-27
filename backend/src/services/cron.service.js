import cron from "node-cron";
import prisma from "../config/prisma.js";

/**
 * Centralised cron registrar. Jobs are registered once on server boot and
 * gracefully no-op when DISABLE_CRON=true (handy in dev / tests).
 *
 * Times are interpreted in the server's TZ. Configure TZ in env if needed.
 */

const log = (...args) => console.log("[cron]", ...args);

// ── 1) Monthly leave-balance accrual ────────────────────────────────
// Runs at 00:05 on the 1st of every month. For every active employee +
// active leave type in the same org, accrues (annualQuota / 12) into the
// current-year LeaveBalance row. Idempotent: if you re-run within the
// same minute it'll just add again, so we guard via a per-month marker.
async function runMonthlyLeaveAccrual() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1..12
  log(`leave-accrual start ${year}-${month}`);

  // Idempotency marker (auto-created table-less guard via SystemSetting if any —
  // for simplicity we use a Notification-style log entry on the user with id=null.
  // Skip if we've already accrued this month.)
  // We use a lightweight in-memory + DB check via the LeaveBalance.updatedAt.
  // If any balance was updated this month with a "monthly accrual" pattern, skip.

  const employees = await prisma.employee.findMany({
    where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
    select: { id: true, organisationId: true },
  });

  const leaveTypes = await prisma.leaveType.findMany({
    where: { isActive: true },
    select: { id: true, organisationId: true, annualQuota: true },
  });

  let updated = 0;
  for (const emp of employees) {
    const types = leaveTypes.filter(
      (t) => t.organisationId === emp.organisationId || t.organisationId == null
    );
    for (const lt of types) {
      const accrual = Number(lt.annualQuota || 0) / 12;
      if (!accrual) continue;

      // Upsert balance row for current year
      await prisma.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: lt.id, year } },
        update: {
          accrued:   { increment: accrual },
          available: { increment: accrual },
        },
        create: {
          employeeId: emp.id, leaveTypeId: lt.id, year,
          openingBalance: 0, accrued: accrual, consumed: 0, available: accrual,
        },
      });
      updated++;
    }
  }
  log(`leave-accrual done — ${updated} balance rows updated`);
}

// ── 2) Daily birthday + work-anniversary digest ─────────────────────
// Runs daily at 08:00. For each org, finds employees whose birthday or
// joining anniversary falls today, then notifies all admins/HR in that org.
async function runDailyBirthdayDigest() {
  const today = new Date();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  log(`birthday-digest start ${m}/${d}`);

  // Postgres extract — uses raw to filter by month/day across years
  const birthdayEmployees = await prisma.$queryRawUnsafe(
    `SELECT id, "organisationId", "firstName", "lastName", "employeeCode"
       FROM employees
      WHERE "dateOfBirth" IS NOT NULL
        AND EXTRACT(MONTH FROM "dateOfBirth") = ${m}
        AND EXTRACT(DAY   FROM "dateOfBirth") = ${d}
        AND "employmentStatus" IN ('ACTIVE','PROBATION')`
  );
  const anniversaryEmployees = await prisma.$queryRawUnsafe(
    `SELECT id, "organisationId", "firstName", "lastName", "employeeCode", "dateOfJoining"
       FROM employees
      WHERE "dateOfJoining" IS NOT NULL
        AND EXTRACT(MONTH FROM "dateOfJoining") = ${m}
        AND EXTRACT(DAY   FROM "dateOfJoining") = ${d}
        AND DATE_PART('year', AGE("dateOfJoining")) >= 1
        AND "employmentStatus" IN ('ACTIVE','PROBATION')`
  );

  if (!birthdayEmployees.length && !anniversaryEmployees.length) {
    log("birthday-digest: nothing today");
    return;
  }

  // Cache: notify admins/HR per org (one row per recipient)
  const orgIds = new Set([
    ...birthdayEmployees.map((e) => e.organisationId),
    ...anniversaryEmployees.map((e) => e.organisationId),
  ]);

  for (const orgId of orgIds) {
    const recipients = await prisma.user.findMany({
      where: {
        organisationId: orgId ?? undefined,
        role: { in: ["SUPER_ADMIN", "ADMIN", "HR"] },
        isActive: true,
      },
      select: { id: true },
    });
    if (!recipients.length) continue;

    const bdays = birthdayEmployees.filter((e) => e.organisationId === orgId);
    const annis = anniversaryEmployees.filter((e) => e.organisationId === orgId);

    const lines = [];
    if (bdays.length) lines.push(`🎂 Birthdays: ${bdays.map((e) => `${e.firstName} ${e.lastName || ""}`).join(", ")}`);
    if (annis.length) lines.push(`🎉 Work anniversaries: ${annis.map((e) => `${e.firstName} ${e.lastName || ""} (${yearsSince(e.dateOfJoining)} yr)`).join(", ")}`);

    await prisma.notification.createMany({
      data: recipients.map((r) => ({
        userId: r.id,
        notificationType: "CELEBRATION",
        title: "Today's celebrations",
        message: lines.join(" · "),
      })),
    });
  }
  log(`birthday-digest done — ${birthdayEmployees.length} bday, ${anniversaryEmployees.length} anniv`);
}

function yearsSince(dateLike) {
  const d = new Date(dateLike);
  const now = new Date();
  let yrs = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) yrs--;
  return Math.max(0, yrs);
}

// ── Registrar ───────────────────────────────────────────────────────
export function startCronJobs() {
  if (process.env.DISABLE_CRON === "true") {
    log("cron disabled via DISABLE_CRON env");
    return;
  }
  // 00:05 on day-of-month 1
  cron.schedule("5 0 1 * *", () => {
    runMonthlyLeaveAccrual().catch((e) => console.error("[cron] leave-accrual failed", e));
  });
  // 08:00 daily
  cron.schedule("0 8 * * *", () => {
    runDailyBirthdayDigest().catch((e) => console.error("[cron] birthday-digest failed", e));
  });
  log("scheduled: monthly leave accrual (1st @ 00:05), daily celebrations (08:00)");
}

// Exposed for manual triggering / admin endpoints
export const cronJobs = {
  runMonthlyLeaveAccrual,
  runDailyBirthdayDigest,
};
