import { Router } from "express";
import {
  getTasks, createTask, updateTask, deleteTask,
  getEmployeeChecklist, initChecklist, updateChecklistItem,
  getMyChecklist, getAllChecklists,
} from "./onboarding.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

// Master task management (Admin only)
router.get("/tasks", getTasks);
router.post("/tasks", authorize("SUPER_ADMIN", "ADMIN"), createTask);
router.put("/tasks/:id", authorize("SUPER_ADMIN", "ADMIN"), updateTask);
router.delete("/tasks/:id", authorize("SUPER_ADMIN", "ADMIN"), deleteTask);

// My checklist (employee self)
router.get("/my", getMyChecklist);

// All checklists (Admin/Manager view)
router.get("/all", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), getAllChecklists);

// Per-employee checklist
router.get("/:employeeId", getEmployeeChecklist);
router.post("/:employeeId/init", authorize("SUPER_ADMIN", "ADMIN"), initChecklist);
router.patch("/item/:id", updateChecklistItem);

export default router;
