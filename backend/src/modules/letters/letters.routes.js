import { Router } from "express";
import {
  getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate,
  seedDefaultTemplates, getVariables, previewLetter, generateLetter, bulkGenerateLetters,
  getGeneratedLetters, getLetterById, deleteLetter,
} from "./letters.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";

const router = Router();
router.use(authenticate);

// Templates
router.get("/templates", authorize("SUPER_ADMIN", "ADMIN", "HR"), getTemplates);
router.get("/templates/:id", authorize("SUPER_ADMIN", "ADMIN", "HR"), getTemplateById);
router.post("/templates", authorize("SUPER_ADMIN", "ADMIN", "HR"), createTemplate);
router.put("/templates/:id", authorize("SUPER_ADMIN", "ADMIN", "HR"), updateTemplate);
router.delete("/templates/:id", authorize("SUPER_ADMIN", "ADMIN", "HR"), deleteTemplate);
router.post("/templates/seed", authorize("SUPER_ADMIN", "ADMIN", "HR"), seedDefaultTemplates);

// Variables
router.get("/variables", authorize("SUPER_ADMIN", "ADMIN", "HR"), getVariables);

// Preview & Generate
router.post("/preview", authorize("SUPER_ADMIN", "ADMIN", "HR"), previewLetter);
router.post("/generate", authorize("SUPER_ADMIN", "ADMIN", "HR"), generateLetter);
router.post("/bulk-generate", authorize("SUPER_ADMIN", "ADMIN", "HR"), bulkGenerateLetters);

// Generated Letters
router.get("/", authorize("SUPER_ADMIN", "ADMIN", "HR"), getGeneratedLetters);
router.get("/:id", authorize("SUPER_ADMIN", "ADMIN", "HR"), getLetterById);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN", "HR"), deleteLetter);

export default router;
