/**
 * Seed E2E Test Prerequisites
 *
 * This script ensures the staging database has the required data for E2E tests:
 * 1. A Store record for the staging store
 * 2. All template types seeded
 *
 * Run with: npx tsx scripts/seed-e2e-prerequisites.ts
 *
 * For staging DB: Uses DATABASE_URL from environment or .env.staging.env
 */

import { PrismaClient, TemplateType } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load staging environment if not in CI (CI sets env vars directly)
if (!process.env.CI) {
  dotenv.config({
    path: path.resolve(process.cwd(), '.env.staging.env'),
    override: true
  });
}

console.log('Using DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

const STAGING_STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';

const prisma = new PrismaClient();

async function ensureStoreExists() {
  console.log('📦 Checking for staging store...');

  let store = await prisma.store.findUnique({
    where: { shopifyDomain: STAGING_STORE_DOMAIN }
  });

  if (!store) {
    console.log('  Creating staging store record...');
    // Use a unique shopifyShopId for the staging store
    // This is a placeholder - real ID would come from Shopify OAuth
    const stagingShopId = BigInt(1234567890);

    store = await prisma.store.create({
      data: {
        shopifyDomain: STAGING_STORE_DOMAIN,
        shopifyShopId: stagingShopId,
        accessToken: 'e2e-test-token', // Placeholder - real token set by OAuth
        isActive: true,
      }
    });
    console.log(`  ✅ Created store: ${store.id}`);
  } else {
    console.log(`  ✅ Store exists: ${store.id}`);
  }

  return store;
}

async function ensureTemplatesExist() {
  console.log('📋 Checking for templates...');

  const templateTypes = Object.values(TemplateType);
  
  for (const templateType of templateTypes) {
    const existing = await prisma.template.findFirst({
      where: { templateType }
    });

    if (!existing) {
      console.log(`  Creating template: ${templateType}...`);
      await prisma.template.create({
        data: {
          name: `${templateType.replace(/_/g, ' ')} Template`,
          description: `Default ${templateType} template for E2E testing`,
          templateType,
          category: getTemplateCategory(templateType),
          goals: ['NEWSLETTER_SIGNUP'],
          contentConfig: getDefaultContentConfig(templateType),
          designConfig: getDefaultDesignConfig(),
          fields: [],
          isActive: true,
        }
      });
      console.log(`  ✅ Created template: ${templateType}`);
    } else {
      console.log(`  ✅ Template exists: ${templateType}`);
    }
  }
}

function getTemplateCategory(templateType: TemplateType): string {
  switch (templateType) {
    case 'NEWSLETTER':
    case 'SPIN_TO_WIN':
    case 'SCRATCH_CARD':
    case 'FLASH_SALE':
    case 'EXIT_INTENT':
    case 'COUNTDOWN_TIMER':
    case 'PRODUCT_UPSELL':
    case 'CART_ABANDONMENT':
    case 'GIFT_WITH_PURCHASE':
      return 'popup';
    case 'FREE_SHIPPING':
    case 'ANNOUNCEMENT':
      return 'bar';
    case 'SOCIAL_PROOF':
      return 'notification';
    default:
      return 'popup';
  }
}

function getDefaultContentConfig(templateType: TemplateType): Record<string, unknown> {
  const baseConfig = {
    headline: 'Welcome!',
    subheadline: 'Get exclusive offers',
    submitButtonText: 'Subscribe',
    emailPlaceholder: 'Enter your email',
  };

  switch (templateType) {
    case 'SPIN_TO_WIN':
      return {
        ...baseConfig,
        wheelSegments: [
          { label: '10% OFF', discount: 10, probability: 0.3 },
          { label: '20% OFF', discount: 20, probability: 0.2 },
          { label: 'Free Shipping', discount: 0, probability: 0.3 },
          { label: 'Try Again', discount: 0, probability: 0.2 },
        ],
        spinButtonText: 'Spin to Win!',
      };
    case 'SCRATCH_CARD':
      return {
        ...baseConfig,
        scratchInstructions: 'Scratch to reveal your prize!',
        revealMessage: 'Congratulations!',
      };
    case 'FLASH_SALE':
      return {
        ...baseConfig,
        urgencyMessage: 'Limited time offer!',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    case 'FREE_SHIPPING':
      return {
        ...baseConfig,
        thresholdMessage: 'Free shipping on orders over $50',
        threshold: 50,
      };
    case 'COUNTDOWN_TIMER':
      return {
        ...baseConfig,
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timerLabel: 'Sale ends in:',
      };
    case 'ANNOUNCEMENT':
      return {
        headline: 'New Arrivals!',
        message: 'Check out our latest collection',
        ctaText: 'Shop Now',
        ctaUrl: '/collections/new',
      };
    case 'SOCIAL_PROOF':
      return {
        ...baseConfig,
        recentPurchaseMessage: '{customer} from {location} just purchased {product}',
      };
    default:
      return baseConfig;
  }
}

function getDefaultDesignConfig(): Record<string, unknown> {
  return {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    primaryColor: '#4F46E5',
    borderRadius: 8,
    position: 'center',
  };
}

async function main() {
  console.log('🚀 Seeding E2E test prerequisites...\n');

  try {
    await ensureStoreExists();
    await ensureTemplatesExist();
    console.log('\n✅ E2E prerequisites seeded successfully!');
  } catch (error) {
    console.error('\n❌ Failed to seed prerequisites:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

