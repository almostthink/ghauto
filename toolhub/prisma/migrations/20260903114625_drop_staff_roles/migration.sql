-- DropIndex
DROP INDEX "User_role_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "active",
DROP COLUMN "role";

-- DropEnum
DROP TYPE "Role";

