-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'premium');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'free',
ADD COLUMN     "planExpiresAt" TIMESTAMP(3);
