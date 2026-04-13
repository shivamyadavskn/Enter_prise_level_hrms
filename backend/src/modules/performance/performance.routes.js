import { Router } from "express";
import {
  getReviews, getReviewById, createReview,
  submitSelfAppraisal, submitManagerAppraisal, acknowledgeReview,
} from "./performance.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { createReviewSchema, selfAppraisalSchema, managerAppraisalSchema, performanceQuerySchema } from "./performance.schema.js";

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(performanceQuerySchema), getReviews);
router.post("/", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validate(createReviewSchema), createReview);
router.get("/:id", getReviewById);
router.patch("/:id/self-appraisal", validate(selfAppraisalSchema), submitSelfAppraisal);
router.patch("/:id/manager-appraisal", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validate(managerAppraisalSchema), submitManagerAppraisal);
router.patch("/:id/acknowledge", acknowledgeReview);

export default router;
