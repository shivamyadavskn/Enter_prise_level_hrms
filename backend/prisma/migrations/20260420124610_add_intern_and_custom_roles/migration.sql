-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'INTERN';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "customRoleId" INTEGER;

-- CreateTable
CREATE TABLE "custom_roles" (
    "id" SERIAL NOT NULL,
    "organisationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "baseRole" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_roles_organisationId_slug_key" ON "custom_roles"("organisationId", "slug");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "custom_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_roles" ADD CONSTRAINT "custom_roles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
