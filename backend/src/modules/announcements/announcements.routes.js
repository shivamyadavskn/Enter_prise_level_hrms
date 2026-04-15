import { Router } from "express";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "./announcements.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/", getAnnouncements);
router.post("/", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), createAnnouncement);
router.put("/:id", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), updateAnnouncement);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), deleteAnnouncement);

export default router;
