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
import organisationRoutes from "./modules/organisation/organisation.routes.js";
import platformRoutes from "./modules/platform/platform.routes.js";
import permissionRoutes from "./modules/permissions/permissions.routes.js";
import announcementRoutes from "./modules/announcements/announcements.routes.js";
import assetRoutes from "./modules/assets/assets.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import pulseRoutes from "./modules/pulse/pulse.routes.js";
import customRoleRoutes from "./modules/custom-roles/custom-roles.routes.js";
import letterRoutes from "./modules/letters/letters.routes.js";
import complianceRoutes from "./modules/compliance/compliance.routes.js";
import separationRoutes from "./modules/separation/separation.routes.js";
import { authenticate } from "./middlewares/auth.middleware.js";
import { requestId } from "./middlewares/requestId.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Ensure upload directories exist ──────────────────────────────────────────
["uploads/documents", "uploads/receipts", "logs"].forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// ── Request correlation ID (must come first) ──────────────────────────────────
app.use(requestId);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS: allow comma-separated list of origins via CORS_ORIGIN.
// SECURITY: never use credentials:true with wildcard origin.
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin (mobile apps, curl, server-to-server) and allowed origins
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true); // dev fallback
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Org-Id"],
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Stricter limit for auth endpoints to prevent brute-force / credential stuffing.
app.use("/api/auth/login", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                              // 20 login attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Try again in 15 minutes." },
}));

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,                             // refresh, me, change-password, etc.
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth requests, please try again later" },
}));

app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,                             // 600 req / 15 min per IP — safe for enterprise UX
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
}));

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Static Files ──────────────────────────────────────────────────────────────
// SECURITY: gate /uploads behind authentication. For fine-grained access
// (ownership/org isolation) the dedicated endpoints under /api/documents
// and /api/reimbursements handle authorization.
app.use("/uploads", authenticate, express.static(path.join(process.cwd(), "uploads"), {
  dotfiles: "deny",
  index: false,
}));

// ── Health Checks ─────────────────────────────────────────────────────────────
// /health         -> cheap liveness probe (server up & responding)
// /health/ready   -> deep readiness probe (DB + Redis reachable)
app.get("/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.get("/health/ready", async (_req, res) => {
  const checks = { db: "unknown", redis: "unknown" };
  let ok = true;
  try {
    const prisma = (await import("./config/prisma.js")).default;
    await prisma.$queryRaw`SELECT 1`;
    checks.db = "ok";
  } catch (e) { ok = false; checks.db = `error: ${e.message}`; }
  try {
    const redis = (await import("./utils/redis.js")).default;
    await redis.ping();
    checks.redis = "ok";
  } catch (e) { ok = false; checks.redis = `error: ${e.message}`; }
  res.status(ok ? 200 : 503).json({ status: ok ? "READY" : "DEGRADED", checks, timestamp: new Date().toISOString() });
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
app.use("/api/organisation", organisationRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/pulse", pulseRoutes);
app.use("/api/custom-roles", customRoleRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/separation", separationRoutes);

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
