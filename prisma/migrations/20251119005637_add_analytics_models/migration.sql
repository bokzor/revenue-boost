-- CreateEnum
CREATE TYPE "PopupEventType" AS ENUM ('VIEW', 'SUBMIT', 'COUPON_ISSUED', 'CLICK', 'CLOSE');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "marketingEventId" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- CreateTable
CREATE TABLE "segment_memberships" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "shopifySegmentId" TEXT NOT NULL,
    "shopifyCustomerId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segment_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_conversions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL,
    "discountCodes" TEXT[],
    "customerId" TEXT,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popup_events" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "experimentId" TEXT,
    "variantKey" "VariantKey",
    "leadId" TEXT,
    "sessionId" TEXT NOT NULL,
    "visitorId" TEXT,
    "eventType" "PopupEventType" NOT NULL,
    "pageUrl" TEXT,
    "pageTitle" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "popup_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "segment_memberships_storeId_shopifyCustomerId_idx" ON "segment_memberships"("storeId", "shopifyCustomerId");

-- CreateIndex
CREATE INDEX "segment_memberships_storeId_shopifySegmentId_idx" ON "segment_memberships"("storeId", "shopifySegmentId");

-- CreateIndex
CREATE UNIQUE INDEX "segment_memberships_storeId_shopifySegmentId_shopifyCustome_key" ON "segment_memberships"("storeId", "shopifySegmentId", "shopifyCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_conversions_orderId_key" ON "campaign_conversions"("orderId");

-- CreateIndex
CREATE INDEX "campaign_conversions_campaignId_idx" ON "campaign_conversions"("campaignId");

-- CreateIndex
CREATE INDEX "popup_events_storeId_createdAt_idx" ON "popup_events"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "popup_events_campaignId_createdAt_idx" ON "popup_events"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "popup_events_experimentId_createdAt_idx" ON "popup_events"("experimentId", "createdAt");

-- CreateIndex
CREATE INDEX "popup_events_storeId_eventType_createdAt_idx" ON "popup_events"("storeId", "eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "segment_memberships" ADD CONSTRAINT "segment_memberships_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_conversions" ADD CONSTRAINT "campaign_conversions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popup_events" ADD CONSTRAINT "popup_events_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popup_events" ADD CONSTRAINT "popup_events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popup_events" ADD CONSTRAINT "popup_events_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
