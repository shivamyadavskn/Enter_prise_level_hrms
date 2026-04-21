import { Router } from "express";
import { initiateSeparation, getSeparations, getSeparationById, calculateFnF, updateSeparation, cancelSeparation } from "./separation.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.post("/", authorize("SUPER_ADMIN", "ADMIN", "HR"), initiateSeparation);
router.get("/", authorize("SUPER_ADMIN", "ADMIN", "HR"), getSeparations);
router.get("/:id", authorize("SUPER_ADMIN", "ADMIN", "HR"), getSeparationById);
router.post("/:id/calculate-fnf", authorize("SUPER_ADMIN", "ADMIN", "HR", "FINANCE"), calculateFnF);
router.put("/:id", authorize("SUPER_ADMIN", "ADMIN", "HR"), updateSeparation);
router.patch("/:id/cancel", authorize("SUPER_ADMIN", "ADMIN", "HR"), cancelSeparation);

export default router;
