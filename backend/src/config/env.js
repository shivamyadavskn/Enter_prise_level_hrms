/**
 * Validates required environment variables at boot.
 * Fails fast in production if anything critical is missing or weak.
 */
const required = ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"];
const recommended = ["CORS_ORIGIN", "REDIS_URL", "SMTP_HOST", "NODE_ENV"];

export function validateEnv() {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`\n[FATAL] Missing required env vars: ${missing.join(", ")}`);
    console.error("Refer to .env.example for the full list.\n");
    process.exit(1);
  }

  const isProd = process.env.NODE_ENV === "production";
  for (const key of ["JWT_SECRET", "JWT_REFRESH_SECRET"]) {
    if (process.env[key].length < 32) {
      const msg = `[SECURITY] ${key} is too short (< 32 chars). Use a strong secret.`;
      if (isProd) { console.error(msg); process.exit(1); }
      else console.warn("\x1b[33m%s\x1b[0m", msg);
    }
  }

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    const msg = "[SECURITY] JWT_SECRET and JWT_REFRESH_SECRET must be different.";
    if (isProd) { console.error(msg); process.exit(1); }
    else console.warn("\x1b[33m%s\x1b[0m", msg);
  }

  const missingRecommended = recommended.filter((k) => !process.env[k]);
  if (missingRecommended.length) {
    console.warn(`\x1b[33m[WARN]\x1b[0m Optional env vars not set: ${missingRecommended.join(", ")}`);
  }

  if (isProd && (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === "*")) {
    console.error("[SECURITY] CORS_ORIGIN must be a comma-separated allowlist in production. Wildcard '*' is unsafe.");
    process.exit(1);
  }
}
