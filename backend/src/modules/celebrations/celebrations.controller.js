import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { cronJobs } from "../../services/cron.service.js";

/**
 * GET /api/celebrations/upcoming?days=30
 * Returns birthdays + work anniversaries within the next N days for the
 * caller's organisation.
 */
export const getUpcoming = async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
    const orgClause = req.organisationId
      ? `AND "organisationId" = ${Number(req.organisationId)}`
      : "";

    // Birthdays in window — match month/day by mapping today + offset.
    // We fan out N day-of-year filters in JS to keep SQL simple.
    const today = new Date();
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return { m: d.getMonth() + 1, d: d.getDate(), iso: d.toISOString().slice(0, 10) };
    });

    const employees = await prisma.employee.findMany({
      where: {
        employmentStatus: { in: ["ACTIVE", "PROBATION"] },
        ...(req.organisationId ? { organisationId: req.organisationId } : {}),
      },
      select: {
        id: true, firstName: true, lastName: true, employeeCode: true,
        dateOfBirth: true, dateOfJoining: true,
        designation: { select: { name: true } },
        department:  { select: { name: true } },
      },
    });

    const birthdays = [];
    const anniversaries = [];
    const dateLookup = new Map(dates.map((x) => [`${x.m}-${x.d}`, x.iso]));

    for (const e of employees) {
      if (e.dateOfBirth) {
        const m = e.dateOfBirth.getMonth() + 1, d = e.dateOfBirth.getDate();
        const iso = dateLookup.get(`${m}-${d}`);
        if (iso) birthdays.push({ ...e, on: iso });
      }
      if (e.dateOfJoining) {
        const m = e.dateOfJoining.getMonth() + 1, d = e.dateOfJoining.getDate();
        const iso = dateLookup.get(`${m}-${d}`);
        const yearsCompleted = today.getFullYear() - e.dateOfJoining.getFullYear();
        if (iso && yearsCompleted >= 1) {
          anniversaries.push({ ...e, on: iso, years: yearsCompleted });
        }
      }
    }

    birthdays.sort((a, b) => a.on.localeCompare(b.on));
    anniversaries.sort((a, b) => a.on.localeCompare(b.on));
    void orgClause;

    return R.success(res, { birthdays, anniversaries });
  } catch (err) {
    return R.error(res, err.message);
  }
};

/** POST /api/celebrations/run-cron — admin manual trigger for the daily digest. */
export const runDigestNow = async (req, res) => {
  try {
    await cronJobs.runDailyBirthdayDigest();
    return R.success(res, null, "Digest dispatched");
  } catch (err) {
    return R.error(res, err.message);
  }
};

/** POST /api/celebrations/run-accrual — admin manual trigger for monthly accrual. */
export const runAccrualNow = async (req, res) => {
  try {
    await cronJobs.runMonthlyLeaveAccrual();
    return R.success(res, null, "Leave accrual completed");
  } catch (err) {
    return R.error(res, err.message);
  }
};
