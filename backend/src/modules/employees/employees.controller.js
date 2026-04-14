import prisma from "../../config/prisma.js";
import * as R from "../../utils/response.js";
import { sendEmployeeWelcome } from "../../services/email.service.js";

const employeeInclude = {
  user: { select: { id: true, email: true, role: true, isActive: true } },
  department: { select: { id: true, name: true, code: true } },
  designation: { select: { id: true, name: true, level: true } },
  manager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
};

export const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, departmentId, designationId, employmentStatus, managerId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};

    if (req.user.role === "MANAGER") {
      const emp = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (emp) where.managerId = emp.id;
    }

    if (departmentId) where.departmentId = Number(departmentId);
    if (designationId) where.designationId = Number(designationId);
    if (employmentStatus) where.employmentStatus = employmentStatus;
    if (managerId) where.managerId = Number(managerId);
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({ where, skip, take: Number(limit), include: employeeInclude, orderBy: { createdAt: "desc" } }),
      prisma.employee.count({ where }),
    ]);

    return R.paginated(res, employees, total, page, limit);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return R.notFound(res, "Employee not found");

    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!self || self.id !== id) return R.forbidden(res, "Access denied");
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        ...employeeInclude,
        subordinates: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        salaryStructures: { where: { isActive: true }, take: 1 },
      },
    });

    if (!employee) return R.notFound(res, "Employee not found");
    return R.success(res, employee);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const createEmployee = async (req, res) => {
  try {
    const data = req.body;

    const existing = await prisma.employee.findFirst({
      where: { OR: [{ employeeCode: data.employeeCode }, { userId: data.userId }] },
    });
    if (existing) return R.badRequest(res, "Employee code or user already exists");

    const employee = await prisma.employee.create({
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : undefined,
      },
      include: employeeInclude,
    });

    if (employee.user?.email) {
      sendEmployeeWelcome({
        email: employee.user.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeCode: employee.employeeCode,
        designation: employee.designation?.name,
        department: employee.department?.name,
        dateOfJoining: employee.dateOfJoining,
      }).catch(() => {});
    }

    return R.created(res, employee, "Employee created successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!self || self.id !== id) return R.forbidden(res, "Access denied");
      const allowedFields = ["phone", "address", "city", "state", "country", "postalCode", "emergencyContactName", "emergencyContactPhone", "bankName", "bankAccountNumber", "bankIFSC", "bankAccountHolder", "panNumber"];
      const filtered = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowedFields.includes(k)));
      req.body = filtered;
    }

    const data = { ...req.body };
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.dateOfJoining) data.dateOfJoining = new Date(data.dateOfJoining);
    if (data.dateOfConfirmation) data.dateOfConfirmation = new Date(data.dateOfConfirmation);
    if (data.dateOfLeaving) data.dateOfLeaving = new Date(data.dateOfLeaving);

    const employee = await prisma.employee.update({ where: { id }, data, include: employeeInclude });
    return R.success(res, employee, "Employee updated successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return R.notFound(res, "Employee not found");

    await prisma.employee.update({
      where: { id },
      data: { employmentStatus: "TERMINATED", dateOfLeaving: new Date() },
    });

    return R.success(res, null, "Employee terminated successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: { userId: req.user.id },
      include: {
        ...employeeInclude,
        leaveBalances: { include: { leaveType: true } },
        salaryStructures: { where: { isActive: true }, take: 1 },
        experiences: { orderBy: { startDate: "desc" } },
        educations: { orderBy: { endYear: "desc" } },
        documents: { orderBy: { uploadedOn: "desc" } },
      },
    });
    if (!employee) return R.notFound(res, "Employee profile not found");
    return R.success(res, employee);
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Experience ─────────────────────────────────────────────────────────────────

export const getExperiences = async (req, res) => {
  try {
    const empId = Number(req.params.id);
    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!self || self.id !== empId) return R.forbidden(res, "Access denied");
    }
    const experiences = await prisma.employeeExperience.findMany({
      where: { employeeId: empId },
      orderBy: { startDate: "desc" },
    });
    return R.success(res, experiences);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const addExperience = async (req, res) => {
  try {
    const empId = Number(req.params.id);
    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!self || self.id !== empId) return R.forbidden(res, "Access denied");
    }
    const data = { ...req.body, employeeId: empId };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.isCurrent) data.endDate = null;
    const exp = await prisma.employeeExperience.create({ data });
    return R.created(res, exp, "Experience added successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateExperience = async (req, res) => {
  try {
    const id = Number(req.params.expId);
    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      const exp = await prisma.employeeExperience.findUnique({ where: { id } });
      if (!self || !exp || exp.employeeId !== self.id) return R.forbidden(res, "Access denied");
    }
    const data = { ...req.body };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.isCurrent) data.endDate = null;
    const exp = await prisma.employeeExperience.update({ where: { id }, data });
    return R.success(res, exp, "Experience updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteExperience = async (req, res) => {
  try {
    const id = Number(req.params.expId);
    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      const exp = await prisma.employeeExperience.findUnique({ where: { id } });
      if (!self || !exp || exp.employeeId !== self.id) return R.forbidden(res, "Access denied");
    }
    await prisma.employeeExperience.delete({ where: { id } });
    return R.success(res, null, "Experience deleted");
  } catch (err) {
    return R.error(res, err.message);
  }
};

// ── Education ──────────────────────────────────────────────────────────────────

export const getEducations = async (req, res) => {
  try {
    const empId = Number(req.params.id);
    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!self || self.id !== empId) return R.forbidden(res, "Access denied");
    }
    const educations = await prisma.employeeEducation.findMany({
      where: { employeeId: empId },
      orderBy: { endYear: "desc" },
    });
    return R.success(res, educations);
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const addEducation = async (req, res) => {
  try {
    const empId = Number(req.params.id);
    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      if (!self || self.id !== empId) return R.forbidden(res, "Access denied");
    }
    const edu = await prisma.employeeEducation.create({ data: { ...req.body, employeeId: empId } });
    return R.created(res, edu, "Education added successfully");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const updateEducation = async (req, res) => {
  try {
    const id = Number(req.params.eduId);
    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      const edu = await prisma.employeeEducation.findUnique({ where: { id } });
      if (!self || !edu || edu.employeeId !== self.id) return R.forbidden(res, "Access denied");
    }
    const edu = await prisma.employeeEducation.update({ where: { id }, data: req.body });
    return R.success(res, edu, "Education updated");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const id = Number(req.params.eduId);
    if (req.user.role === "EMPLOYEE") {
      const self = await prisma.employee.findFirst({ where: { userId: req.user.id } });
      const edu = await prisma.employeeEducation.findUnique({ where: { id } });
      if (!self || !edu || edu.employeeId !== self.id) return R.forbidden(res, "Access denied");
    }
    await prisma.employeeEducation.delete({ where: { id } });
    return R.success(res, null, "Education deleted");
  } catch (err) {
    return R.error(res, err.message);
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const manager = await prisma.employee.findFirst({ where: { userId: req.user.id } });
    if (!manager) return R.notFound(res, "Manager profile not found");

    const team = await prisma.employee.findMany({
      where: { managerId: manager.id },
      include: employeeInclude,
    });

    return R.success(res, team);
  } catch (err) {
    return R.error(res, err.message);
  }
};
