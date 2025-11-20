/*
  Warnings:

  - The values [BASIC] on the enum `PlanTier` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlanTier_new" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'PRO', 'ENTERPRISE');
ALTER TABLE "public"."stores" ALTER COLUMN "planTier" DROP DEFAULT;
ALTER TABLE "stores" ALTER COLUMN "planTier" TYPE "PlanTier_new" USING ("planTier"::text::"PlanTier_new");
ALTER TYPE "PlanTier" RENAME TO "PlanTier_old";
ALTER TYPE "PlanTier_new" RENAME TO "PlanTier";
DROP TYPE "public"."PlanTier_old";
ALTER TABLE "stores" ALTER COLUMN "planTier" SET DEFAULT 'FREE';
COMMIT;
