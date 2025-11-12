-- DropIndex
DROP INDEX "leads_campaignId_idx";

-- DropIndex
DROP INDEX "leads_createdAt_idx";

-- DropIndex
DROP INDEX "leads_storeId_idx";

-- DropIndex
DROP INDEX "leads_submittedAt_idx";

-- DropIndex
DROP INDEX "leads_visitorId_idx";

-- DropIndex
DROP INDEX "templates_isActive_idx";

-- DropIndex
DROP INDEX "templates_priority_idx";

-- DropIndex
DROP INDEX "templates_storeId_idx";

-- DropIndex
DROP INDEX "templates_templateType_idx";

-- CreateIndex
CREATE INDEX "leads_storeId_createdAt_idx" ON "leads"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "leads_campaignId_submittedAt_idx" ON "leads"("campaignId", "submittedAt");
