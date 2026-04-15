import { Router } from "express";
import {
  createPulseSurvey, getPulseSurveys, submitPulseResponse,
  getPulseResults, getMyPulseHistory, closePulseSurvey,
} from "./pulse.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/my-history", getMyPulseHistory);
router.get("/", getPulseSurveys);
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), createPulseSurvey);
router.post("/:id/respond", submitPulseResponse);
router.get("/:id/results", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), getPulseResults);
router.patch("/:id/close", authorize("SUPER_ADMIN", "ADMIN"), closePulseSurvey);

export default router;
