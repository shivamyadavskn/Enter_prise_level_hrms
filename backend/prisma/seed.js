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

  // ── Find first organisation (needed for sample data) ─────────────────────
  const org = await prisma.organisation.findFirst({ orderBy: { id: "asc" } });
  const orgId = org ? org.id : null;

  if (orgId) {
    console.log(`📌 Found organisation: "${org.name}" (ID: ${orgId})`);
  } else {
    console.log("⚠️  No organisation found — sample data will be created without orgId.");
  }

  // ── Find first employee & user in this org (for foreign keys) ────────────
  const adminUser = orgId
    ? await prisma.user.findFirst({ where: { organisationId: orgId, role: { in: ["SUPER_ADMIN", "ADMIN"] } }, orderBy: { id: "asc" } })
    : await prisma.user.findFirst({ where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } }, orderBy: { id: "asc" } });

  const adminEmployee = adminUser
    ? await prisma.employee.findFirst({ where: { userId: adminUser.id } })
    : null;

  if (adminEmployee) {
    console.log(`👤 Using employee "${adminEmployee.firstName} ${adminEmployee.lastName}" (ID: ${adminEmployee.id}) for seeding`);
  } else {
    console.log("⚠️  No employee found — skipping Announcements & Pulse seeding (create an employee first).");
  }

  // ── Sample Announcements ──────────────────────────────────────────────────
  console.log("📢 Creating sample announcements...");
  const existingAnnouncements = await prisma.announcement.count();
  if (existingAnnouncements === 0 && adminEmployee) {
    await prisma.announcement.createMany({
      data: [
        {
          organisationId: orgId,
          createdById: adminEmployee.id,
          title: "Welcome to HRMS Enterprise!",
          content: "We're excited to launch our new HRMS system. This platform will streamline all HR operations including attendance, leaves, payroll, and performance management. Please explore the features and reach out to HR for any questions.",
          priority: "HIGH",
          isPinned: true,
          publishedAt: new Date(),
        },
        {
          organisationId: orgId,
          createdById: adminEmployee.id,
          title: "Company Holiday - Diwali",
          content: "The office will be closed on October 24th for Diwali celebrations. Wishing everyone a happy and prosperous Diwali!",
          priority: "NORMAL",
          isPinned: false,
          publishedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          organisationId: orgId,
          createdById: adminEmployee.id,
          title: "Quarterly Performance Reviews",
          content: "Q4 performance reviews will begin next week. Please complete your self-appraisals by Friday. Managers will schedule 1-on-1 meetings with team members.",
          priority: "URGENT",
          isPinned: true,
          publishedAt: new Date(),
        },
        {
          organisationId: orgId,
          createdById: adminEmployee.id,
          title: "New Parking Policy",
          content: "Starting next month, parking slots will be assigned on a first-come, first-served basis. Please register your vehicle with the admin team.",
          priority: "LOW",
          isPinned: false,
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      ],
    });
    console.log("   ✓ 4 announcements created");
  } else {
    console.log("   ⏭ Announcements already exist, skipping.");
  }

  // ── Sample Assets ─────────────────────────────────────────────────────────
  console.log("💻 Creating sample assets...");
  const existingAssets = await prisma.asset.count();
  if (existingAssets === 0) {
    await prisma.asset.createMany({
      data: [
        {
          organisationId: orgId,
          assetCode: "LAP-001",
          name: "MacBook Pro 16-inch M1",
          category: "Laptop",
          brand: "Apple",
          modelName: "M1 Pro",
          serialNumber: "C02XYZ123456",
          purchaseDate: new Date("2023-01-15"),
          purchasePrice: 250000,
          condition: "GOOD",
          notes: "High-performance laptop for development team",
        },
        {
          organisationId: orgId,
          assetCode: "LAP-002",
          name: "Dell XPS 15",
          category: "Laptop",
          brand: "Dell",
          modelName: "XPS 15 9520",
          serialNumber: "DELL123456789",
          purchaseDate: new Date("2023-03-20"),
          purchasePrice: 150000,
          condition: "GOOD",
        },
        {
          organisationId: orgId,
          assetCode: "MON-001",
          name: "LG UltraWide 34-inch",
          category: "Monitor",
          brand: "LG",
          modelName: "34WN80C-B",
          serialNumber: "LG987654321",
          purchaseDate: new Date("2023-02-10"),
          purchasePrice: 45000,
          condition: "NEW",
        },
        {
          organisationId: orgId,
          assetCode: "PHN-001",
          name: "iPhone 14 Pro",
          category: "Phone",
          brand: "Apple",
          modelName: "iPhone 14 Pro",
          serialNumber: "APPLE123456",
          purchaseDate: new Date("2023-09-25"),
          purchasePrice: 130000,
          condition: "NEW",
          notes: "For sales team lead",
        },
        {
          organisationId: orgId,
          assetCode: "DSK-001",
          name: "HP Desktop Workstation",
          category: "Desktop",
          brand: "HP",
          modelName: "Z2 Tower G9",
          serialNumber: "HP789456123",
          purchaseDate: new Date("2022-11-05"),
          purchasePrice: 80000,
          condition: "FAIR",
          notes: "Needs RAM upgrade",
        },
      ],
    });
    console.log("   ✓ 5 assets created");
  } else {
    console.log("   ⏭ Assets already exist, skipping.");
  }

  // ── Sample Pulse Surveys ──────────────────────────────────────────────────
  console.log("❤️ Creating sample pulse surveys...");
  const existingSurveys = await prisma.pulseSurvey.count();
  if (existingSurveys === 0 && adminUser) {
    await prisma.pulseSurvey.createMany({
      data: [
        {
          organisationId: orgId,
          createdBy: adminUser.id,
          title: "Weekly Team Pulse - Week 42",
          question: "How are you feeling about work this week?",
          frequency: "WEEKLY",
          isActive: true,
        },
        {
          organisationId: orgId,
          createdBy: adminUser.id,
          title: "Monthly Engagement Check",
          question: "How satisfied are you with your current projects and team collaboration?",
          frequency: "MONTHLY",
          isActive: true,
        },
        {
          organisationId: orgId,
          createdBy: adminUser.id,
          title: "Q3 Mood Survey",
          question: "How would you rate your overall work experience this quarter?",
          frequency: "MONTHLY",
          isActive: false,
          endsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ],
    });
    console.log("   ✓ 3 pulse surveys created");
  } else {
    console.log("   ⏭ Pulse surveys already exist, skipping.");
  }

  console.log("✅ Seeding complete!");
  console.log("\n📊 Sample data created:");
  console.log("   ✓ 7 Leave Types");
  console.log("   ✓ 4 Announcements (2 pinned)");
  console.log("   ✓ 5 Assets (Laptops, Monitor, Phone, Desktop)");
  console.log("   ✓ 3 Pulse Surveys (2 active)");
  console.log("\n📋 Next steps:");
  console.log("   1. Log in as Super Admin via the HRMS UI.");
  console.log("   2. Create your Departments and Designations from the admin panel.");
  console.log("   3. Add employees and assign them roles/departments/designations.");
  console.log("   4. Check Announcements, Assets, and Pulse Survey pages!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());