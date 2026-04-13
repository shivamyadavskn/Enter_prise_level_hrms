import { Router } from "express";
import { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee, getMyProfile, getTeamMembers } from "./employees.controller.js";
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

export default router;
