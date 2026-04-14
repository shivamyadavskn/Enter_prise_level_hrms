import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";

// ── Onboarding Tasks (Master) ─────────────────────────────────────────────────

export const getTasks = async (req, res) => {
  try {
    const tasks = await prisma.onboardingTask.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });
    return R.success(res, tasks);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createTask = async (req, res) => {
  try {
    const task = await prisma.onboardingTask.create({ data: req.body });
    return R.created(res, task, "Task created");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateTask = async (req, res) => {
  try {
    const task = await prisma.onboardingTask.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    return R.success(res, task, "Task updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteTask = async (req, res) => {
  try {
    await prisma.onboardingTask.update({
      where: { id: Number(req.params.id) },
      data: { isActive: false },
    });
    return R.success(res, null, "Task deactivated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Employee Onboarding Checklist ─────────────────────────────────────────────

export const getEmployeeChecklist = async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);

    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!self || self.id !== employeeId) return R.forbidden(res, "Access denied");
    }

    const items = await prisma.employeeOnboarding.findMany({
      where: { employeeId },
      include: { task: true },
      orderBy: [{ task: { category: "asc" } }, { task: { order: "asc" } }],
    });

    return R.success(res, items);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const initChecklist = async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);

    const tasks = await prisma.onboardingTask.findMany({ where: { isActive: true } });
    if (tasks.length === 0) return R.badRequest(res, "No onboarding tasks defined yet");

    let created = 0, skipped = 0;
    for (const task of tasks) {
      const exists = await prisma.employeeOnboarding.findUnique({
        where: { employeeId_taskId: { employeeId, taskId: task.id } },
      });
      if (exists) { skipped++; continue; }
      await prisma.employeeOnboarding.create({ data: { employeeId, taskId: task.id } });
      created++;
    }

    await prisma.notification.create({
      data: {
        userId: (await prisma.employee.findUnique({ where: { id: employeeId }, include: { user: true } })).user.id,
        notificationType: "ONBOARDING",
        title: "Onboarding Checklist Ready",
        message: `Your onboarding checklist has been assigned. Please complete ${created} task(s).`,
      },
    });

    return R.success(res, { created, skipped }, `Checklist initialized: ${created} tasks assigned`);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateChecklistItem = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, remarks } = req.body;

    const item = await prisma.employeeOnboarding.findUnique({ where: { id } });
    if (!item) return R.notFound(res, "Checklist item not found");

    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!self || self.id !== item.employeeId) return R.forbidden(res, "Access denied");
    }

    const updater = await prisma.employee.findFirst({ where: { userId: req.user.id } });

    const updated = await prisma.employeeOnboarding.update({
      where: { id },
      data: {
        status,
        remarks,
        completedAt: status === "COMPLETED" ? new Date() : null,
        completedBy: updater?.id ?? null,
      },
      include: { task: true },
    });

    return R.success(res, updated, "Checklist item updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getMyChecklist = async (req, res) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!emp) return R.notFound(res, "Employee profile not found");

    const items = await prisma.employeeOnboarding.findMany({
      where: { employeeId: emp.id },
      include: { task: true },
      orderBy: [{ task: { category: "asc" } }, { task: { order: "asc" } }],
    });

    return R.success(res, items);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getAllChecklists = async (req, res) => {
  try {
    const { status } = req.query;

    const employees = await prisma.employee.findMany({
      where: { employmentStatus: { in: ["ACTIVE", "PROBATION"] } },
      include: {
        onboardingItems: {
          include: { task: true },
          where: status ? { status } : undefined,
        },
      },
      orderBy: { dateOfJoining: "desc" },
    });

    const result = employees
      .filter((e) => e.onboardingItems.length > 0)
      .map((e) => ({
        employeeId: e.id,
        employeeCode: e.employeeCode,
        name: `${e.firstName} ${e.lastName}`,
        dateOfJoining: e.dateOfJoining,
        total: e.onboardingItems.length,
        completed: e.onboardingItems.filter((i) => i.status === "COMPLETED").length,
        pending: e.onboardingItems.filter((i) => i.status === "PENDING").length,
        items: e.onboardingItems,
      }));

    return R.success(res, result);
  } catch (err) {
    return R.error(res, err.message);
  }
};
