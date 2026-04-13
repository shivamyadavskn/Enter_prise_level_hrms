import { Router } from "express";
import { getDesignations, getDesignationById, createDesignation, updateDesignation, deleteDesignation } from "./designations.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { createDesignationSchema, updateDesignationSchema, designationQuerySchema } from "./designations.schema.js";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(designationQuerySchema), getDesignations);
router.get("/:id", getDesignationById);
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), validate(createDesignationSchema), createDesignation);
router.put("/:id", authorize("SUPER_ADMIN", "ADMIN"), validate(updateDesignationSchema), updateDesignation);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), deleteDesignation);

export default router;
