-- CreateEnum
CREATE TYPE "WatchMode" AS ENUM ('webhook', 'polling');

-- AlterTable
ALTER TABLE "watched_repos" ADD COLUMN     "lastPolled" TIMESTAMP(3),
ADD COLUMN     "watchMode" "WatchMode" NOT NULL DEFAULT 'webhook';
