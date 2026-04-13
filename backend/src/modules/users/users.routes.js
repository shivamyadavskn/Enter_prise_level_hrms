import { Router } from "express";
import { getUsers, getUserById, createUser, updateUser, deleteUser, toggleUserActive } from "./users.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { createUserSchema, updateUserSchema, userQuerySchema } from "./users.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("SUPER_ADMIN", "ADMIN"), validateQuery(userQuerySchema), getUsers);
router.get("/:id", authorize("SUPER_ADMIN", "ADMIN"), getUserById);
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), validate(createUserSchema), createUser);
router.put("/:id", authorize("SUPER_ADMIN", "ADMIN"), validate(updateUserSchema), updateUser);
router.delete("/:id", authorize("SUPER_ADMIN"), deleteUser);
router.patch("/:id/toggle-active", authorize("SUPER_ADMIN", "ADMIN"), toggleUserActive);

export default router;
