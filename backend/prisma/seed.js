import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Leave Types ───────────────────────────────────────────────────────────
  // These are global defaults (organisationId = null) that apply to all orgs.
  // Departments, designations, and users must be created through the HRMS UI
  // by a Super Admin or Admin — never via seed.
  await prisma.leaveType.createMany({
    data: [
      { name: "Casual Leave", code: "CL", annualQuota: 12, carryForwardAllowed: false },
      { name: "Sick Leave", code: "SL", annualQuota: 12, carryForwardAllowed: false, requiresDocument: true },
      { name: "Earned Leave", code: "EL", annualQuota: 24, carryForwardAllowed: true, maxCarryForward: 30, encashmentAllowed: true },
      { name: "Maternity Leave", code: "ML", annualQuota: 180, carryForwardAllowed: false, requiresDocument: true },
      { name: "Paternity Leave", code: "PL", annualQuota: 15, carryForwardAllowed: false },
      { name: "Loss of Pay", code: "LOP", annualQuota: 0, carryForwardAllowed: false },
      { name: "Compensatory Off", code: "CO", annualQuota: 0, carryForwardAllowed: true, maxCarryForward: 5 },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seeding complete! Leave types are ready.");
  console.log("\n📋 Next steps:");
  console.log("   1. Log in as Super Admin via the HRMS UI.");
  console.log("   2. Create your Departments and Designations from the admin panel.");
  console.log("   3. Add employees and assign them roles/departments/designations.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());