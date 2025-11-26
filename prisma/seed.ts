/**
 * Database Seeding Script
 *
 * This script seeds the database with:
 * - Global system templates (3+ templates)
 * - Demo store for development/testing
 *
 * Uses Prisma types for type safety and consistency with database schema.
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import { GLOBAL_SYSTEM_TEMPLATES } from "./template-data";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // Seed global system templates first
    console.log("🌟 Seeding global system templates...");
    await seedGlobalSystemTemplates();

    // Only create demo stores if explicitly requested (for E2E tests)
    if (process.env.SEED_DEMO_STORES === "true") {
      console.log("🏪 Setting up demo stores...");

      // Store 1: Demo store for development
      const FIXED_TEST_STORE_ID = process.env.TEST_STORE_ID || "test_store_001";
      await upsertStore({
        id: FIXED_TEST_STORE_ID,
        shopifyDomain: "revenue-boost-demo.myshopify.com",
        shopifyShopId: BigInt(12345678),
        accessToken: "demo_access_token",
        isActive: true,
      });

      // Store 2: Mock-bridge test store (used by @getverdict/mock-bridge)
      await upsertStore({
        id: "test_store_mock",
        shopifyDomain: process.env.MOCK_SHOP || "test-shop.myshopify.com",
        shopifyShopId: BigInt(99999999),
        accessToken: "mock_access_token",
        isActive: true,
      });

      console.log(`✅ Demo stores ready`);
    } else {
      console.log("ℹ️  Skipping demo stores (set SEED_DEMO_STORES=true to create them)");
    }

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function upsertStore(storeData: Prisma.StoreCreateInput): Promise<void> {
  // First, try to find existing store
  const existingStore = await prisma.store.findUnique({
    where: { shopifyDomain: storeData.shopifyDomain },
  });

  if (!existingStore) {
    // Create with fixed ID if it doesn't exist
    await prisma.store.create({
      data: storeData,
    });
    console.log(`✅ Created store: ${storeData.shopifyDomain} (ID: ${storeData.id})`);
  } else if (existingStore.id !== storeData.id) {
    // If store exists but with wrong ID, delete and recreate with correct ID
    console.log(
      `⚠️  Store exists with ID ${existingStore.id}, recreating with fixed ID ${storeData.id}...`
    );

    // Delete all campaigns for this store first
    await prisma.campaign.deleteMany({
      where: { storeId: existingStore.id },
    });

    // Delete the store
    await prisma.store.delete({
      where: { id: existingStore.id },
    });

    // Create with fixed ID
    await prisma.store.create({
      data: storeData,
    });
    console.log(`✅ Recreated store: ${storeData.shopifyDomain} (ID: ${storeData.id})`);
  } else {
    console.log(`✅ Store already exists: ${storeData.shopifyDomain} (ID: ${storeData.id})`);
  }
}

async function seedGlobalSystemTemplates(): Promise<void> {
  console.log(
    `🌟 Seeding ${GLOBAL_SYSTEM_TEMPLATES.length} global system templates...`
  );

  for (const template of GLOBAL_SYSTEM_TEMPLATES) {
    const templateId = `SYSTEM_${template.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    // Prepare create data with proper Prisma types
    const createData: Prisma.TemplateCreateInput = {
      id: templateId,
      name: template.name,
      description: template.description,
      category: template.category,
      templateType: template.templateType,
      goals: template.goals,
      contentConfig: template.contentConfig as Prisma.InputJsonValue,
      fields: template.fields as Prisma.InputJsonValue,
      targetRules: template.targetRules as Prisma.InputJsonValue,
      designConfig: template.designConfig as Prisma.InputJsonValue,
      discountConfig: (template.discountConfig || {}) as Prisma.InputJsonValue,
      isDefault: template.isDefault,
      priority: template.priority,
      icon: template.icon,
      conversionRate: template.conversionRate,
      isActive: true,
    };

    // Prepare update data with proper Prisma types
    const updateData: Prisma.TemplateUpdateInput = {
      description: template.description,
      category: template.category,
      templateType: template.templateType,
      goals: template.goals,
      contentConfig: template.contentConfig as Prisma.InputJsonValue,
      fields: template.fields as Prisma.InputJsonValue,
      targetRules: template.targetRules as Prisma.InputJsonValue,
      designConfig: template.designConfig as Prisma.InputJsonValue,
      discountConfig: (template.discountConfig || {}) as Prisma.InputJsonValue,
      priority: template.priority,
      icon: template.icon,
      conversionRate: template.conversionRate,
    };

    await prisma.template.upsert({
      where: { id: templateId },
      create: createData,
      update: updateData,
    });
  }

  console.log(
    `✅ Successfully seeded ${GLOBAL_SYSTEM_TEMPLATES.length} global system templates`
  );
}

seed().catch((e) => {
  console.error("💥 Seed script failed:", e);
  process.exit(1);
});

