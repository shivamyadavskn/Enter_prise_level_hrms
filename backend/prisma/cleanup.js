import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function cleanup() {
  console.log("🗑️ Cleaning old sample data...");
  await prisma.pulseSurveyResponse.deleteMany();
  await prisma.pulseSurvey.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.asset.deleteMany();
  console.log("✅ Done! Now run: npm run db:seed");
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
