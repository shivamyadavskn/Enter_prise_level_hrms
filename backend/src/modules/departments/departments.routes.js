import { Router } from "express";
import { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from "./departments.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { createDepartmentSchema, updateDepartmentSchema, departmentQuerySchema } from "./departments.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(departmentQuerySchema), getDepartments);
router.get("/:id", getDepartmentById);
router.post("/", authorize("SUPER_ADMIN", "ADMIN", "HR"), validate(createDepartmentSchema), createDepartment);
router.put("/:id", authorize("SUPER_ADMIN", "ADMIN", "HR"), validate(updateDepartmentSchema), updateDepartment);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN", "HR"), deleteDepartment);

export default router;
