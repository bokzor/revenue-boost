/**
 * Verify Seed Data Script
 * 
 * Quick script to verify that templates and segments were seeded correctly
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("🔍 Verifying seeded data...\n");

  // Check templates
  const templates = await prisma.template.findMany({
    where: { storeId: null },
    select: {
      id: true,
      name: true,
      templateType: true,
      category: true,
      isDefault: true,
      priority: true,
      icon: true,
    },
    orderBy: { priority: "asc" },
  });

  console.log(`📋 Global Templates (${templates.length}):`);
  templates.forEach((t) => {
    console.log(`  ${t.icon || "📄"} ${t.name} (${t.templateType}) - Priority: ${t.priority}`);
  });

  // Check segments
  const segments = await prisma.customerSegment.findMany({
    where: { storeId: null },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      priority: true,
      isDefault: true,
    },
    orderBy: { priority: "asc" },
  });

  console.log(`\n🎯 Global Segments (${segments.length}):`);
  segments.forEach((s) => {
    console.log(`  ${s.icon || "👥"} ${s.name} - ${s.description}`);
  });

  // Check demo store
  const demoStore = await prisma.store.findUnique({
    where: { shopifyDomain: "revenue-boost-demo.myshopify.com" },
  });

  console.log(`\n🏪 Demo Store:`);
  if (demoStore) {
    console.log(`  ✅ ${demoStore.shopifyDomain} (ID: ${demoStore.id})`);
  } else {
    console.log(`  ❌ Demo store not found`);
  }

  console.log("\n✅ Verification complete!");

  await prisma.$disconnect();
}

verify().catch((e) => {
  console.error("❌ Verification failed:", e);
  process.exit(1);
});

