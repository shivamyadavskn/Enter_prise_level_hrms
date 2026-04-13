import { PrismaClient, UserRole, EmploymentStatus, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Departments ────────────────────────────────────────────────────────────
  const depts = await Promise.all([
    prisma.department.upsert({
      where: { code: "ENG" },
      update: {},
      create: { name: "Engineering", code: "ENG", description: "Software Engineering" },
    }),
    prisma.department.upsert({
      where: { code: "HR" },
      update: {},
      create: { name: "Human Resources", code: "HR", description: "HR & People Operations" },
    }),
    prisma.department.upsert({
      where: { code: "FIN" },
      update: {},
      create: { name: "Finance", code: "FIN", description: "Finance & Accounts" },
    }),
    prisma.department.upsert({
      where: { code: "OPS" },
      update: {},
      create: { name: "Operations", code: "OPS", description: "Business Operations" },
    }),
  ]);

  // ── Designations ──────────────────────────────────────────────────────────
  const desigs = await Promise.all([
    prisma.designation.upsert({ where: { id: 1 }, update: {}, create: { name: "CEO", level: 1 } }),
    prisma.designation.upsert({ where: { id: 2 }, update: {}, create: { name: "Engineering Manager", level: 3 } }),
    prisma.designation.upsert({ where: { id: 3 }, update: {}, create: { name: "Senior Software Engineer", level: 5 } }),
    prisma.designation.upsert({ where: { id: 4 }, update: {}, create: { name: "Software Engineer", level: 6 } }),
    prisma.designation.upsert({ where: { id: 5 }, update: {}, create: { name: "HR Manager", level: 3 } }),
    prisma.designation.upsert({ where: { id: 6 }, update: {}, create: { name: "Finance Manager", level: 3 } }),
    prisma.designation.upsert({ where: { id: 7 }, update: {}, create: { name: "Junior Software Engineer", level: 7 } }),
  ]);

  // ── Leave Types ───────────────────────────────────────────────────────────
  const leaveTypes = await Promise.all([
    prisma.leaveType.upsert({
      where: { code: "CL" },
      update: {},
      create: { name: "Casual Leave", code: "CL", annualQuota: 12, carryForwardAllowed: false },
    }),
    prisma.leaveType.upsert({
      where: { code: "SL" },
      update: {},
      create: { name: "Sick Leave", code: "SL", annualQuota: 12, carryForwardAllowed: false, requiresDocument: true },
    }),
    prisma.leaveType.upsert({
      where: { code: "EL" },
      update: {},
      create: { name: "Earned Leave", code: "EL", annualQuota: 24, carryForwardAllowed: true, maxCarryForward: 30, encashmentAllowed: true },
    }),
    prisma.leaveType.upsert({
      where: { code: "ML" },
      update: {},
      create: { name: "Maternity Leave", code: "ML", annualQuota: 180, carryForwardAllowed: false, requiresDocument: true },
    }),
    prisma.leaveType.upsert({
      where: { code: "PL" },
      update: {},
      create: { name: "Paternity Leave", code: "PL", annualQuota: 15, carryForwardAllowed: false },
    }),
    prisma.leaveType.upsert({
      where: { code: "LOP" },
      update: {},
      create: { name: "Loss of Pay", code: "LOP", annualQuota: 0, carryForwardAllowed: false },
    }),
    prisma.leaveType.upsert({
      where: { code: "CO" },
      update: {},
      create: { name: "Compensatory Off", code: "CO", annualQuota: 0, carryForwardAllowed: true, maxCarryForward: 5 },
    }),
  ]);

  // ── Users ─────────────────────────────────────────────────────────────────
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email: "superadmin@hrms.com" },
    update: {},
    create: {
      username: "superadmin",
      email: "superadmin@hrms.com",
      passwordHash: hash("SuperAdmin@123"),
      role: UserRole.SUPER_ADMIN,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@hrms.com" },
    update: {},
    create: {
      username: "hradmin",
      email: "admin@hrms.com",
      passwordHash: hash("Admin@123"),
      role: UserRole.ADMIN,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@hrms.com" },
    update: {},
    create: {
      username: "engmanager",
      email: "manager@hrms.com",
      passwordHash: hash("Manager@123"),
      role: UserRole.MANAGER,
    },
  });

  const financeUser = await prisma.user.upsert({
    where: { email: "finance@hrms.com" },
    update: {},
    create: {
      username: "financeuser",
      email: "finance@hrms.com",
      passwordHash: hash("Finance@123"),
      role: UserRole.FINANCE,
    },
  });

  const empUser1 = await prisma.user.upsert({
    where: { email: "alice@hrms.com" },
    update: {},
    create: {
      username: "alice.johnson",
      email: "alice@hrms.com",
      passwordHash: hash("Employee@123"),
      role: UserRole.EMPLOYEE,
    },
  });

  const empUser2 = await prisma.user.upsert({
    where: { email: "bob@hrms.com" },
    update: {},
    create: {
      username: "bob.smith",
      email: "bob@hrms.com",
      passwordHash: hash("Employee@123"),
      role: UserRole.EMPLOYEE,
    },
  });

  // ── Employees ─────────────────────────────────────────────────────────────
  const superAdminEmp = await prisma.employee.upsert({
    where: { employeeCode: "EMP0001" },
    update: {},
    create: {
      userId: superAdminUser.id,
      employeeCode: "EMP0001",
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@hrms.com",
      phone: "9000000001",
      gender: Gender.MALE,
      dateOfJoining: new Date("2020-01-01"),
      employmentStatus: EmploymentStatus.ACTIVE,
      departmentId: depts[2].id,
      designationId: desigs[0].id,
    },
  });

  const adminEmp = await prisma.employee.upsert({
    where: { employeeCode: "EMP0002" },
    update: {},
    create: {
      userId: adminUser.id,
      employeeCode: "EMP0002",
      firstName: "HR",
      lastName: "Admin",
      email: "admin@hrms.com",
      phone: "9000000002",
      gender: Gender.FEMALE,
      dateOfJoining: new Date("2020-06-01"),
      employmentStatus: EmploymentStatus.ACTIVE,
      departmentId: depts[1].id,
      designationId: desigs[4].id,
    },
  });

  const managerEmp = await prisma.employee.upsert({
    where: { employeeCode: "EMP0003" },
    update: {},
    create: {
      userId: managerUser.id,
      employeeCode: "EMP0003",
      firstName: "John",
      lastName: "Manager",
      email: "manager@hrms.com",
      phone: "9000000003",
      gender: Gender.MALE,
      dateOfJoining: new Date("2021-03-15"),
      employmentStatus: EmploymentStatus.ACTIVE,
      departmentId: depts[0].id,
      designationId: desigs[1].id,
    },
  });

  const financeEmp = await prisma.employee.upsert({
    where: { employeeCode: "EMP0004" },
    update: {},
    create: {
      userId: financeUser.id,
      employeeCode: "EMP0004",
      firstName: "Finance",
      lastName: "Manager",
      email: "finance@hrms.com",
      phone: "9000000004",
      gender: Gender.MALE,
      dateOfJoining: new Date("2021-01-10"),
      employmentStatus: EmploymentStatus.ACTIVE,
      departmentId: depts[2].id,
      designationId: desigs[5].id,
    },
  });

  const aliceEmp = await prisma.employee.upsert({
    where: { employeeCode: "EMP0005" },
    update: {},
    create: {
      userId: empUser1.id,
      employeeCode: "EMP0005",
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice@hrms.com",
      phone: "9000000005",
      gender: Gender.FEMALE,
      dateOfBirth: new Date("1995-05-20"),
      dateOfJoining: new Date("2022-07-01"),
      dateOfConfirmation: new Date("2023-01-01"),
      employmentStatus: EmploymentStatus.ACTIVE,
      departmentId: depts[0].id,
      designationId: desigs[2].id,
      managerId: managerEmp.id,
    },
  });

  const bobEmp = await prisma.employee.upsert({
    where: { employeeCode: "EMP0006" },
    update: {},
    create: {
      userId: empUser2.id,
      employeeCode: "EMP0006",
      firstName: "Bob",
      lastName: "Smith",
      email: "bob@hrms.com",
      phone: "9000000006",
      gender: Gender.MALE,
      dateOfBirth: new Date("1998-11-10"),
      dateOfJoining: new Date("2023-03-01"),
      employmentStatus: EmploymentStatus.PROBATION,
      departmentId: depts[0].id,
      designationId: desigs[6].id,
      managerId: managerEmp.id,
    },
  });

  // ── Update dept heads ─────────────────────────────────────────────────────
  await prisma.department.update({ where: { id: depts[0].id }, data: { headId: managerEmp.id } });
  await prisma.department.update({ where: { id: depts[1].id }, data: { headId: adminEmp.id } });
  await prisma.department.update({ where: { id: depts[2].id }, data: { headId: financeEmp.id } });

  // ── Leave Balances for all employees (CL, SL, EL) ────────────────────────
  const currentYear = new Date().getFullYear();
  const allEmps = [superAdminEmp, adminEmp, managerEmp, financeEmp, aliceEmp, bobEmp];
  for (const emp of allEmps) {
    for (const lt of [leaveTypes[0], leaveTypes[1], leaveTypes[2]]) {
      await prisma.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: lt.id, year: currentYear } },
        update: {},
        create: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          year: currentYear,
          openingBalance: lt.annualQuota,
          accrued: lt.annualQuota,
          consumed: 0,
          available: lt.annualQuota,
        },
      });
    }
  }

  // ── Salary Structure for Alice ────────────────────────────────────────────
  await prisma.salaryStructure.upsert({
    where: { id: 1 },
    update: {},
    create: {
      employeeId: aliceEmp.id,
      effectiveFrom: new Date("2022-07-01"),
      basicSalary: 30000,
      hra: 15000,
      conveyanceAllowance: 1600,
      medicalAllowance: 1250,
      specialAllowance: 12150,
      grossSalary: 60000,
      pfEmployee: 3600,
      pfEmployer: 3600,
      professionalTax: 200,
      tds: 2500,
      totalDeductions: 6300,
      netSalary: 53700,
      ctc: 763200,
      isActive: true,
    },
  });

  console.log("✅ Seeding complete!");
  console.log("\n📋 Sample Login Credentials:");
  console.log("   Super Admin : superadmin@hrms.com / SuperAdmin@123");
  console.log("   HR Admin    : admin@hrms.com      / Admin@123");
  console.log("   Manager     : manager@hrms.com    / Manager@123");
  console.log("   Finance     : finance@hrms.com    / Finance@123");
  console.log("   Employee 1  : alice@hrms.com      / Employee@123");
  console.log("   Employee 2  : bob@hrms.com        / Employee@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
