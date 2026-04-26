import multer from "multer";
import { error as errorRes, badRequest, notFound } from "../utils/response.js";

/**
 * Catch-all error handler — must be registered LAST in app.js.
 * Maps known error types to clean HTTP responses; redacts internals in prod.
 */
export function globalErrorHandler(err, req, res, _next) {
  // ── Multer (file upload) errors ────────────────────────────────
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") return badRequest(res, "File too large. Max 10 MB.");
    if (err.code === "LIMIT_UNEXPECTED_FILE") return badRequest(res, "Unexpected file field.");
    return badRequest(res, `Upload error: ${err.message}`);
  }

  // ── Body parser errors ─────────────────────────────────────────
  if (err.type === "entity.too.large") { 
    return badRequest(res, "Request body too large.");
  }
  if (err.type === "entity.parse.failed") {
    return badRequest(res, "Invalid JSON in request body.");
  }

  // ── Prisma errors ──────────────────────────────────────────────
  if (err.code && typeof err.code === "string" && err.code.startsWith("P")) {
    // Unique constraint violation
    if (err.code === "P2002") {
      const fields = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "field";
      return badRequest(res, `Duplicate value for ${fields}`);
    }
    // Record not found
    if (err.code === "P2025") return notFound(res, "Record not found");
    // Foreign key constraint
    if (err.code === "P2003") return badRequest(res, "Related record not found or in use");
  }

  // ── JWT errors (just in case they bubble) ──────────────────────
  if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
    return errorRes(res, "Invalid or expired token", 401);
  }

  // ── Fallback — generic 500 (response.js redacts in prod) ───────
  console.error("[UNHANDLED]", err.stack || err);
  return errorRes(res, err.message || "Internal server error", 500);
}

/**
 * 404 handler for unmatched routes. Register just before globalErrorHandler.
 */
export function notFoundHandler(req, res) {
  return notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
}
