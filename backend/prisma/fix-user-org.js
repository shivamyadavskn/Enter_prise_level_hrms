/**
 * One-time patch: fixes users who were created without an organisationId.
 *
 * For every user that has organisationId = null but has an employee record
 * linked to an organisation, this script copies the org from the employee
 * to the user account so they can see org-scoped data (departments, designations, etc.)
 *
 * Run once: /Users/essence/.nvm/versions/node/v22.22.1/bin/node prisma/fix-user-org.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Fixing users with missing organisationId...\n");

  // Find all users where organisationId is null but they have an employee record
  // that belongs to an organisation
  const usersWithoutOrg = await prisma.user.findMany({
    where: { organisationId: null, NOT: { role: "PLATFORM_ADMIN" } },
    select: {
      id: true,
      email: true,
      role: true,
      employee: { select: { organisationId: true } },
    },
  });

  let fixed = 0;
  for (const user of usersWithoutOrg) {
    const orgId = user.employee?.organisationId;
    if (orgId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { organisationId: orgId },
      });
      console.log(`  ✅ Fixed: ${user.email} (${user.role}) → org ${orgId}`);
      fixed++;
    } else {
      console.log(`  ⚠️  Skipped: ${user.email} (${user.role}) — no employee org found`);
    }
  }

  console.log(`\n✨ Done! Fixed ${fixed} of ${usersWithoutOrg.length} unlinked user(s).`);
  if (fixed < usersWithoutOrg.length) {
    console.log("   Skipped users have no employee record \u2014 assign them to an org manually");
    console.log("   via the Roles & Permissions → User Role Assignment panel.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Fix failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
