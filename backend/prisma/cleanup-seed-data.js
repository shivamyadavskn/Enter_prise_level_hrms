/**
 * One-time cleanup script.
 * Removes departments and designations that were created by the old seed
 * (these have organisationId = null and should not exist in an org-scoped system).
 *
 * Run once: node prisma/cleanup-seed-data.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning up null-org seed data...\n");

  // ── Remove seeded departments (organisationId = null) ─────────────────────
  // These were created by the old seed.js with codes: ENG, HR, FIN, OPS
  // Real departments must be created by Super Admin/Admin via the UI with an org.
  const deletedDepts = await prisma.department.deleteMany({
    where: { organisationId: null },
  });
  console.log(`✅ Removed ${deletedDepts.count} global (null-org) department(s)`);

  // ── Remove seeded designations (organisationId = null) ────────────────────
  // These were: CEO, Engineering Manager, Senior/Junior Software Engineer, etc.
  const deletedDesigs = await prisma.designation.deleteMany({
    where: { organisationId: null },
  });
  console.log(`✅ Removed ${deletedDesigs.count} global (null-org) designation(s)`);

  console.log("\n✨ Cleanup complete!");
  console.log("   All departments and designations must now be created by");
  console.log("   Super Admin or Admin through the HRMS admin panel.");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
