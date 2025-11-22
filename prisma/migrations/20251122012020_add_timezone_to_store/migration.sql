-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "timezoneUpdatedAt" TIMESTAMP(3);
