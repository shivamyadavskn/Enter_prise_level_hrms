-- CreateEnum
CREATE TYPE "LetterCategory" AS ENUM ('OFFER', 'APPOINTMENT', 'CONFIRMATION', 'SALARY_REVISION', 'EXPERIENCE', 'RELIEVING', 'WARNING', 'TERMINATION', 'INTERNSHIP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SeparationType" AS ENUM ('RESIGNATION', 'TERMINATION', 'RETIREMENT', 'ABSCONDING', 'CONTRACT_END', 'MUTUAL');

-- CreateEnum
CREATE TYPE "SeparationStatus" AS ENUM ('INITIATED', 'IN_PROGRESS', 'FNF_CALCULATED', 'FNF_APPROVED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "backupCodes" JSONB,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorEnrolledAt" TIMESTAMP(3),
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "letter_templates" (
    "id" SERIAL NOT NULL,
    "organisationId" INTEGER,
    "name" TEXT NOT NULL,
    "category" "LetterCategory" NOT NULL DEFAULT 'CUSTOM',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letter_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_letters" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "letterNumber" TEXT,
    "category" "LetterCategory" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "generatedBy" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "separations" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "organisationId" INTEGER,
    "separationType" "SeparationType" NOT NULL,
    "reason" TEXT,
    "initiatedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resignationDate" DATE,
    "lastWorkingDate" DATE,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "noticePeriodServed" INTEGER NOT NULL DEFAULT 0,
    "noticePeriodShortfall" INTEGER NOT NULL DEFAULT 0,
    "exitInterviewDone" BOOLEAN NOT NULL DEFAULT false,
    "exitFeedback" TEXT,
    "fnfAmount" DOUBLE PRECISION,
    "fnfBreakdown" JSONB,
    "assetRecoveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "assetsToRecover" JSONB,
    "status" "SeparationStatus" NOT NULL DEFAULT 'INITIATED',
    "completedDate" TIMESTAMP(3),
    "remarks" TEXT,
    "initiatedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "separations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "separations_employeeId_key" ON "separations"("employeeId");

-- CreateIndex
CREATE INDEX "separations_organisationId_status_idx" ON "separations"("organisationId", "status");

-- CreateIndex
CREATE INDEX "documents_employeeId_documentType_idx" ON "documents"("employeeId", "documentType");

-- CreateIndex
CREATE INDEX "documents_employeeId_uploadedOn_idx" ON "documents"("employeeId", "uploadedOn");

-- CreateIndex
CREATE INDEX "leave_applications_employeeId_status_idx" ON "leave_applications"("employeeId", "status");

-- CreateIndex
CREATE INDEX "leave_applications_employeeId_startDate_idx" ON "leave_applications"("employeeId", "startDate");

-- CreateIndex
CREATE INDEX "leave_applications_status_startDate_idx" ON "leave_applications"("status", "startDate");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "reimbursement_claims_employeeId_status_idx" ON "reimbursement_claims"("employeeId", "status");

-- CreateIndex
CREATE INDEX "reimbursement_claims_status_createdAt_idx" ON "reimbursement_claims"("status", "createdAt");

-- CreateIndex
CREATE INDEX "users_organisationId_email_idx" ON "users"("organisationId", "email");

-- CreateIndex
CREATE INDEX "users_organisationId_isActive_idx" ON "users"("organisationId", "isActive");

-- CreateIndex
CREATE INDEX "wfh_requests_employeeId_status_idx" ON "wfh_requests"("employeeId", "status");

-- CreateIndex
CREATE INDEX "wfh_requests_employeeId_startDate_idx" ON "wfh_requests"("employeeId", "startDate");

-- CreateIndex
CREATE INDEX "wfh_requests_status_startDate_idx" ON "wfh_requests"("status", "startDate");

-- AddForeignKey
ALTER TABLE "generated_letters" ADD CONSTRAINT "generated_letters_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "letter_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_letters" ADD CONSTRAINT "generated_letters_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "separations" ADD CONSTRAINT "separations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
