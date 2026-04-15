import { Router } from "express";
import multer from "multer";
import { getClaims, createClaim, approveClaim, rejectClaim, uploadReceipt, getReimbursementReport } from "./reimbursements.controller.js";
import { getPolicies, upsertPolicy, deletePolicy } from "./expense-policies.controller.js";
import { createTravelClaim, getTravelClaims, approveTravelClaim, rejectTravelClaim, getTravelAnalytics } from "./travel.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const upload = multer({ storage: multer.diskStorage({ destination: "uploads/receipts", filename: (_r, file, cb) => cb(null, `${Date.now()}-${file.originalname}`) }), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();
router.use(authenticate);

// Expense Policies
router.get("/policies", getPolicies);
router.post("/policies", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), upsertPolicy);
router.delete("/policies/:id", authorize("SUPER_ADMIN", "ADMIN"), deletePolicy);

// Reports
router.get("/report", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getReimbursementReport);

// Claims
router.get("/", getClaims);
router.post("/", createClaim);
router.post("/:id/receipt", upload.single("receipt"), uploadReceipt);
router.patch("/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "FINANCE", "MANAGER"), approveClaim);
router.patch("/:id/reject", authorize("SUPER_ADMIN", "ADMIN", "FINANCE", "MANAGER"), rejectClaim);

// Travel Claims
router.get("/travel/analytics", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), getTravelAnalytics);
router.get("/travel", getTravelClaims);
router.post("/travel", createTravelClaim);
router.patch("/travel/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "FINANCE", "MANAGER"), approveTravelClaim);
router.patch("/travel/:id/reject", authorize("SUPER_ADMIN", "ADMIN", "FINANCE", "MANAGER"), rejectTravelClaim);

export default router;
