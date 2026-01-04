-- AlterTable
ALTER TABLE "watched_repos" ADD COLUMN     "notifyComments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyCommits" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyIssues" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPRs" BOOLEAN NOT NULL DEFAULT true;
