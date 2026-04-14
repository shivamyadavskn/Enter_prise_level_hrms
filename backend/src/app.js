import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import employeeRoutes from "./modules/employees/employees.routes.js";
import departmentRoutes from "./modules/departments/departments.routes.js";
import designationRoutes from "./modules/designations/designations.routes.js";
import leaveRoutes from "./modules/leaves/leaves.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import wfhRoutes from "./modules/wfh/wfh.routes.js";
import payrollRoutes from "./modules/payroll/payroll.routes.js";
import performanceRoutes from "./modules/performance/performance.routes.js";
import documentRoutes from "./modules/documents/documents.routes.js";
import notificationRoutes from "./modules/notifications/notifications.routes.js";
import reportRoutes from "./modules/reports/reports.routes.js";
import holidayRoutes from "./modules/holidays/holidays.routes.js";
import reimbursementRoutes from "./modules/reimbursements/reimbursements.routes.js";
import onboardingRoutes from "./modules/onboarding/onboarding.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Ensure upload directories exist ──────────────────────────────────────────
["uploads/documents", "logs"].forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: "Too many requests, please try again later" },
}));

app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000,
  message: { success: false, message: "Too many requests, please try again later" },
}));

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Static Files ──────────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/wfh", wfhRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/reimbursements", reimbursementRoutes);
app.use("/api/onboarding", onboardingRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File size exceeds 10MB limit" });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

export default app;
