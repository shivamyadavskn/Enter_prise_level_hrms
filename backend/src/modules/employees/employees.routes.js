import { Router } from "express";
import { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, getMyProfile, getTeamMembers, getExperiences, addExperience, updateExperience, deleteExperience, getEducations, addEducation, updateEducation, deleteEducation } from "./employees.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { createEmployeeSchema, updateEmployeeSchema, employeeQuerySchema } from "./employees.schema.js";

const router = Router();

router.use(authenticate);

router.get("/me", getMyProfile);
router.get("/team", authorize("MANAGER", "ADMIN", "SUPER_ADMIN"), getTeamMembers);
router.get("/", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validateQuery(employeeQuerySchema), getEmployees);
router.get("/:id", getEmployeeById);
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), validate(createEmployeeSchema), createEmployee);
router.put("/:id", validate(updateEmployeeSchema), updateEmployee);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), deleteEmployee);

router.get("/:id/experience", getExperiences);
router.post("/:id/experience", addExperience);
router.put("/:id/experience/:expId", updateExperience);
router.delete("/:id/experience/:expId", deleteExperience);

router.get("/:id/education", getEducations);
router.post("/:id/education", addEducation);
router.put("/:id/education/:eduId", updateEducation);
router.delete("/:id/education/:eduId", deleteEducation);

export default router;
