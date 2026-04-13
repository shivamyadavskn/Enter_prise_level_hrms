import { Router } from "express";
import multer from "multer";
import path from "path";
import { uploadDocument, getDocuments, getDocumentById, downloadDocument, deleteDocument } from "./documents.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/rbac.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { uploadDocumentSchema, documentQuerySchema } from "./documents.schema.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/documents/"),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(authenticate);

router.get("/", validateQuery(documentQuerySchema), getDocuments);
router.post("/upload", upload.single("file"), validate(uploadDocumentSchema), uploadDocument);
router.get("/:id", getDocumentById);
router.get("/:id/download", downloadDocument);
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), deleteDocument);

export default router;
