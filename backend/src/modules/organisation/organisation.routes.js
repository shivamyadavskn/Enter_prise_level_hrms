import { Router } from "express";
import { registerOrganisation, getOrganisation, updateOrganisation } from "./organisation.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.post("/register", registerOrganisation);

router.use(authenticate);
router.get("/", authorize("SUPER_ADMIN", "ADMIN"), getOrganisation);
router.put("/", authorize("SUPER_ADMIN", "ADMIN"), updateOrganisation);

export default router;
