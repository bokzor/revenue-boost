-- CreateTable
CREATE TABLE "customer_segments" (
    "id" TEXT NOT NULL,
    "storeId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "icon" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_segments_storeId_idx" ON "customer_segments"("storeId");

-- CreateIndex
CREATE INDEX "customer_segments_isActive_idx" ON "customer_segments"("isActive");

-- CreateIndex
CREATE INDEX "customer_segments_isDefault_idx" ON "customer_segments"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "customer_segments_storeId_name_key" ON "customer_segments"("storeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "customer_segments_name_isDefault_key" ON "customer_segments"("name", "isDefault");

-- AddForeignKey
ALTER TABLE "customer_segments" ADD CONSTRAINT "customer_segments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
