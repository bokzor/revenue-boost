-- CreateEnum
CREATE TYPE "CampaignGoal" AS ENUM ('NEWSLETTER_SIGNUP', 'INCREASE_REVENUE', 'ENGAGEMENT');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VariantKey" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('NEWSLETTER', 'SPIN_TO_WIN', 'FLASH_SALE', 'EXIT_INTENT', 'CART_ABANDONMENT', 'PRODUCT_UPSELL', 'SOCIAL_PROOF', 'COUNTDOWN_TIMER', 'SCRATCH_CARD', 'ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "shopifyDomain" TEXT NOT NULL,
    "shopifyShopId" BIGINT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goal" "CampaignGoal" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT,
    "templateType" "TemplateType" NOT NULL,
    "contentConfig" JSONB NOT NULL DEFAULT '{}',
    "designConfig" JSONB NOT NULL DEFAULT '{}',
    "targetRules" JSONB NOT NULL DEFAULT '{}',
    "discountConfig" JSONB NOT NULL DEFAULT '{}',
    "experimentId" TEXT,
    "variantKey" "VariantKey",
    "isControl" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hypothesis" TEXT,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'DRAFT',
    "trafficAllocation" JSONB NOT NULL DEFAULT '{}',
    "statisticalConfig" JSONB NOT NULL DEFAULT '{}',
    "successMetrics" JSONB NOT NULL DEFAULT '{}',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "plannedDurationDays" INTEGER,
    "winnerId" TEXT,
    "winnerDeclaredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "templateType" "TemplateType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "goals" "CampaignGoal"[],
    "contentConfig" JSONB NOT NULL DEFAULT '{}',
    "fields" JSONB NOT NULL DEFAULT '[]',
    "targetRules" JSONB NOT NULL DEFAULT '{}',
    "discountConfig" JSONB NOT NULL DEFAULT '{}',
    "designConfig" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "icon" TEXT,
    "preview" TEXT,
    "conversionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_shopifyDomain_key" ON "stores"("shopifyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "stores_shopifyShopId_key" ON "stores"("shopifyShopId");

-- CreateIndex
CREATE INDEX "stores_shopifyDomain_isActive_idx" ON "stores"("shopifyDomain", "isActive");

-- CreateIndex
CREATE INDEX "campaigns_storeId_status_idx" ON "campaigns"("storeId", "status");

-- CreateIndex
CREATE INDEX "campaigns_experimentId_variantKey_idx" ON "campaigns"("experimentId", "variantKey");

-- CreateIndex
CREATE INDEX "campaigns_goal_status_idx" ON "campaigns"("goal", "status");

-- CreateIndex
CREATE INDEX "campaigns_priority_idx" ON "campaigns"("priority");

-- CreateIndex
CREATE INDEX "experiments_storeId_status_idx" ON "experiments"("storeId", "status");

-- CreateIndex
CREATE INDEX "experiments_status_startDate_endDate_idx" ON "experiments"("status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "experiments_winnerId_idx" ON "experiments"("winnerId");

-- CreateIndex
CREATE INDEX "templates_storeId_idx" ON "templates"("storeId");

-- CreateIndex
CREATE INDEX "templates_templateType_idx" ON "templates"("templateType");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- CreateIndex
CREATE INDEX "templates_isActive_idx" ON "templates"("isActive");

-- CreateIndex
CREATE INDEX "templates_priority_idx" ON "templates"("priority");

-- CreateIndex
CREATE INDEX "templates_goals_idx" ON "templates"("goals");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
