import { Router } from "express";
import { getComplianceHealth, generatePfEcr, generatePtChallan, generateBankFile } from "./compliance.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/health", authorize("SUPER_ADMIN", "ADMIN", "HR", "FINANCE"), getComplianceHealth);
router.get("/pf-ecr", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), generatePfEcr);
router.get("/pt-challan", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), generatePtChallan);
router.get("/bank-file", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), generateBankFile);

export default router;
