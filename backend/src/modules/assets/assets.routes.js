import { Router } from "express";
import { getAssets, getMyAssets, createAsset, updateAsset, assignAsset, deleteAsset, getAssetStats } from "./assets.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/my", getMyAssets);
router.get("/stats", authorize("SUPER_ADMIN", "ADMIN"), getAssetStats);
router.get("/", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), getAssets);
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), createAsset);
router.put("/:id", authorize("SUPER_ADMIN", "ADMIN"), updateAsset);
router.patch("/:id/assign", authorize("SUPER_ADMIN", "ADMIN"), assignAsset);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), deleteAsset);

export default router;
