import { Router } from "express";
import { listOrganisations, getOrganisationDetail, getPlatformStats, seedPlatformAdmin, toggleOrgStatus } from "./platform.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();

router.post("/seed", seedPlatformAdmin);

router.use(authenticate);
router.use(authorize("PLATFORM_ADMIN"));

router.get("/stats", getPlatformStats);
router.get("/organisations", listOrganisations);
router.get("/organisations/:id", getOrganisationDetail);
router.patch("/organisations/:id/toggle", toggleOrgStatus);

export default router;
