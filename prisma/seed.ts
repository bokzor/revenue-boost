/**
 * Database Seeding Script
 *
 * This script seeds the database with:
 * - Global system templates (3+ templates)
 * - Global system segments (11 segments)
 * - Demo store for development/testing
 *
 * Uses Prisma types for type safety and consistency with database schema.
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import { GLOBAL_SYSTEM_TEMPLATES } from "./template-data";
import { DEFAULT_SEGMENTS } from "../app/data/segments";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // Seed global system templates first
    console.log("🌟 Seeding global system templates...");
    await seedGlobalSystemTemplates();

    // Seed global system segments
    console.log("🎯 Seeding global system segments...");
    await seedGlobalSystemSegments();

    // Get or create a demo store with fixed ID for E2E tests
    console.log("🏪 Setting up demo store...");

    // Use a fixed ID for the test store to ensure consistency across test runs
    const FIXED_TEST_STORE_ID = process.env.TEST_STORE_ID || "test_store_001";

    // First, try to find existing store
    let demoStore = await prisma.store.findUnique({
      where: { shopifyDomain: "revenue-boost-demo.myshopify.com" },
    });

    // Prepare store data with proper Prisma types
    const storeData: Prisma.StoreCreateInput = {
      id: FIXED_TEST_STORE_ID,
      shopifyDomain: "revenue-boost-demo.myshopify.com",
      shopifyShopId: BigInt(12345678),
      accessToken: "demo_access_token",
      isActive: true,
    };

    if (!demoStore) {
      // Create with fixed ID if it doesn't exist
      demoStore = await prisma.store.create({
        data: storeData,
      });
    } else if (demoStore.id !== FIXED_TEST_STORE_ID) {
      // If store exists but with wrong ID, delete and recreate with correct ID
      console.log(
        `⚠️  Store exists with ID ${demoStore.id}, recreating with fixed ID ${FIXED_TEST_STORE_ID}...`
      );

      // Delete all campaigns for this store first
      await prisma.campaign.deleteMany({
        where: { storeId: demoStore.id },
      });

      // Delete the store
      await prisma.store.delete({
        where: { id: demoStore.id },
      });

      // Create with fixed ID
      demoStore = await prisma.store.create({
        data: storeData,
      });
    }

    console.log(`✅ Demo store ready: ${demoStore.shopifyDomain} (ID: ${demoStore.id})`);
    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
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

async function seedGlobalSystemSegments(): Promise<void> {
  console.log(
    `🎯 Seeding ${DEFAULT_SEGMENTS.length} global system segments...`
  );

  for (const segment of DEFAULT_SEGMENTS) {
    // Prepare create data with proper Prisma types
    const createData: Prisma.CustomerSegmentCreateInput = {
      name: segment.name,
      description: segment.description,
      conditions: segment.conditions as Prisma.InputJsonValue,
      icon: segment.icon,
      priority: segment.priority,
      isDefault: true,
      isActive: true,
    };

    // Prepare update data with proper Prisma types
    const updateData: Prisma.CustomerSegmentUpdateInput = {
      description: segment.description,
      conditions: segment.conditions as Prisma.InputJsonValue,
      icon: segment.icon,
      priority: segment.priority,
    };

    await prisma.customerSegment.upsert({
      where: {
        name_isDefault: {
          name: segment.name,
          isDefault: true,
        },
      },
      create: createData,
      update: updateData,
    });
  }

  console.log(
    `✅ Successfully seeded ${DEFAULT_SEGMENTS.length} global system segments`
  );
}

seed().catch((e) => {
  console.error("💥 Seed script failed:", e);
  process.exit(1);
});

