-- CreateIndex
CREATE INDEX "campaigns_storeId_status_priority_idx" ON "campaigns"("storeId", "status", "priority");

-- CreateIndex
CREATE INDEX "campaigns_templateId_idx" ON "campaigns"("templateId");

-- CreateIndex
CREATE INDEX "templates_storeId_isActive_templateType_idx" ON "templates"("storeId", "isActive", "templateType");

-- CreateIndex
CREATE INDEX "templates_storeId_isActive_priority_idx" ON "templates"("storeId", "isActive", "priority");

-- CreateIndex
CREATE INDEX "templates_isActive_priority_idx" ON "templates"("isActive", "priority");
