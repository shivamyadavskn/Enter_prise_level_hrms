import { Router } from "express";
import { getPermissions, getRolePermissions, updateRolePermission, bulkUpdateRolePermissions, seedDefaultPermissions, getDefaultPermissions, getRoleAccessMatrix } from "./permissions.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", authorize("SUPER_ADMIN", "ADMIN"), getPermissions);
router.get("/defaults", authorize("SUPER_ADMIN", "ADMIN"), getDefaultPermissions);
router.get("/roles", authorize("SUPER_ADMIN", "ADMIN"), getRolePermissions);
router.put("/roles", authorize("SUPER_ADMIN", "ADMIN"), updateRolePermission);
router.put("/roles/bulk", authorize("SUPER_ADMIN", "ADMIN"), bulkUpdateRolePermissions);
router.post("/seed", authorize("SUPER_ADMIN"), seedDefaultPermissions);
router.get("/roles/matrix", authorize("SUPER_ADMIN", "ADMIN"), getRoleAccessMatrix);

export default router;
