import { Router } from "express";
import {
  getCustomRoles,
  getCustomRoleById,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  assignCustomRole,
  getAvailablePermissions,
} from "./custom-roles.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.use(authenticate);

// View custom roles — all HR+ roles can view
router.get("/", authorize("SUPER_ADMIN", "ADMIN", "HR"), getCustomRoles);
router.get("/available-permissions", authorize("SUPER_ADMIN", "ADMIN"), getAvailablePermissions);
router.get("/:id", authorize("SUPER_ADMIN", "ADMIN", "HR"), getCustomRoleById);

// Manage custom roles — SUPER_ADMIN and ADMIN only
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), createCustomRole);
router.put("/:id", authorize("SUPER_ADMIN", "ADMIN"), updateCustomRole);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), deleteCustomRole);

// Assign custom role to an employee
router.post("/assign", authorize("SUPER_ADMIN", "ADMIN", "HR"), assignCustomRole);

export default router;
