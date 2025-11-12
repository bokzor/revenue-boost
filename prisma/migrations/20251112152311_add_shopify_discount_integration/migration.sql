/*
  Warnings:

  - A unique constraint covering the columns `[storeId,campaignId,email]` on the table `leads` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "discountId" TEXT,
ADD COLUMN     "pageTitle" TEXT,
ADD COLUMN     "pageUrl" TEXT,
ADD COLUMN     "shopifyCustomerId" BIGINT,
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- CreateIndex
CREATE INDEX "leads_shopifyCustomerId_idx" ON "leads"("shopifyCustomerId");

-- CreateIndex
CREATE INDEX "leads_submittedAt_idx" ON "leads"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "leads_storeId_campaignId_email_key" ON "leads"("storeId", "campaignId", "email");
