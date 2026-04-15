import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

// ── Create Pulse Survey ───────────────────────────────────────────────────────

export const createPulseSurvey = async (req, res) => {
  try {
    const { title, question, frequency, endsAt } = req.body;
    if (!title) return R.badRequest(res, "Title is required");

    const survey = await prisma.pulseSurvey.create({
      data: {
        organisationId: req.organisationId || null,
        title,
        question: question || "How are you feeling about work this week?",
        frequency: frequency || "WEEKLY",
        endsAt: endsAt ? new Date(endsAt) : null,
        createdBy: req.user.id,
      },
    });

    // Notify all org employees
    const orgUsers = await prisma.user.findMany({
      where: {
        organisationId: req.organisationId || undefined,
        isActive: true,
        id: { not: req.user.id },
      },
      select: { id: true },
    });
    if (orgUsers.length > 0) {
      await prisma.notification.createMany({
        data: orgUsers.map(u => ({
          userId: u.id,
          notificationType: "PULSE_SURVEY",
          title: "📊 New Pulse Survey",
          message: `A new survey "${title}" is available. Share your anonymous feedback!`,
        })),
      });
    }

    return R.created(res, survey, "Pulse survey created");
  } catch (err) { return R.error(res, err.message); }
};

// ── List Surveys ──────────────────────────────────────────────────────────────

export const getPulseSurveys = async (req, res) => {
  try {
    const orgId = req.organisationId || null;
    const surveys = await prisma.pulseSurvey.findMany({
      where: { isActive: true, ...(orgId ? { organisationId: orgId } : {}) },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { responses: true } } },
    });
    return R.success(res, surveys);
  } catch (err) { return R.error(res, err.message); }
};

// ── Submit Response ───────────────────────────────────────────────────────────

function getWeekLabel(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export const submitPulseResponse = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return R.badRequest(res, "Rating must be between 1 and 5");
    }

    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee profile not found");

    const survey = await prisma.pulseSurvey.findUnique({ where: { id: surveyId } });
    if (!survey || !survey.isActive) return R.notFound(res, "Survey not found or inactive");
    if (survey.endsAt && new Date() > new Date(survey.endsAt)) {
      return R.badRequest(res, "This survey has ended");
    }

    const weekLabel = getWeekLabel();

    const response = await prisma.pulseSurveyResponse.upsert({
      where: { surveyId_employeeId_weekLabel: { surveyId, employeeId: emp.id, weekLabel } },
      update: { rating: Number(rating), comment: comment || null },
      create: {
        surveyId, employeeId: emp.id,
        rating: Number(rating), comment: comment || null,
        weekLabel,
      },
    });

    return R.success(res, response, "Response recorded");
  } catch (err) { return R.error(res, err.message); }
};

// ── Get Pulse Results (Anonymous Aggregate) ───────────────────────────────────

export const getPulseResults = async (req, res) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await prisma.pulseSurvey.findUnique({ where: { id: surveyId } });
    if (!survey) return R.notFound(res, "Survey not found");

    const responses = await prisma.pulseSurveyResponse.findMany({
      where: { surveyId },
      include: { employee: { select: { department: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    if (responses.length === 0) {
      return R.success(res, { survey, totalResponses: 0, averageRating: 0, trend: [], distribution: {} });
    }

    // Average rating
    const avgRating = (responses.reduce((s, r) => s + r.rating, 0) / responses.length).toFixed(2);

    // Distribution 1-5
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    responses.forEach(r => distribution[r.rating]++);

    // Weekly trend (anonymous — only aggregate)
    const weekMap = {};
    responses.forEach(r => {
      if (!weekMap[r.weekLabel]) weekMap[r.weekLabel] = { sum: 0, count: 0 };
      weekMap[r.weekLabel].sum += r.rating;
      weekMap[r.weekLabel].count++;
    });
    const trend = Object.entries(weekMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, data]) => ({ week, average: (data.sum / data.count).toFixed(2), responses: data.count }));

    // Department breakdown (anonymous)
    const deptMap = {};
    responses.forEach(r => {
      const dept = r.employee.department?.name || "Unassigned";
      if (!deptMap[dept]) deptMap[dept] = { sum: 0, count: 0 };
      deptMap[dept].sum += r.rating;
      deptMap[dept].count++;
    });
    const departmentBreakdown = Object.entries(deptMap).map(([dept, data]) => ({
      department: dept,
      averageRating: (data.sum / data.count).toFixed(2),
      responses: data.count,
    }));

    // Mood label
    const moodLabels = { 1: "😞 Very Low", 2: "😕 Low", 3: "😐 Neutral", 4: "🙂 Good", 5: "😊 Excellent" };
    const moodIndex = Math.round(Number(avgRating));

    return R.success(res, {
      survey: { id: survey.id, title: survey.title, question: survey.question },
      totalResponses: responses.length,
      averageRating: Number(avgRating),
      moodLabel: moodLabels[moodIndex] || "😐 Neutral",
      distribution,
      trend,
      departmentBreakdown,
    });
  } catch (err) { return R.error(res, err.message); }
};

// ── My Pulse History ──────────────────────────────────────────────────────────

export const getMyPulseHistory = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.success(res, []);

    const responses = await prisma.pulseSurveyResponse.findMany({
      where: { employeeId: emp.id },
      include: { survey: { select: { id: true, title: true, question: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return R.success(res, responses);
  } catch (err) { return R.error(res, err.message); }
};

// ── Close Survey ──────────────────────────────────────────────────────────────

export const closePulseSurvey = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.pulseSurvey.update({ where: { id }, data: { isActive: false, endsAt: new Date() } });
    return R.success(res, null, "Survey closed");
  } catch (err) { return R.error(res, err.message); }
};
