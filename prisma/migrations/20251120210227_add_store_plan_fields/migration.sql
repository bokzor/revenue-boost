-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'BASIC', 'PRO');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "planStatus" "PlanStatus" NOT NULL DEFAULT 'TRIALING',
ADD COLUMN     "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);
