import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { STORE_DOMAIN, handlePasswordPage, mockChallengeToken, getTestPrefix } from './helpers/test-helpers';
import { CampaignFactory } from './factories/campaign-factory';

dotenv.config({ path: '.env.staging.env' });

const TEST_PREFIX = getTestPrefix('storefront-cart-triggers.spec.ts');

/**
 * Cart-Based Triggers E2E Tests
 *
 * Tests cart-based trigger configurations:
 * - Add to cart trigger
 * - Cart value threshold trigger (min/max)
 * - Exit intent trigger
 */

test.describe('Cart-Based Triggers', () => {
    let prisma: PrismaClient;
    let factory: CampaignFactory;
    let store: { id: string };

    test.beforeAll(async () => {
        prisma = new PrismaClient();

        const foundStore = await prisma.store.findUnique({
            where: { shopifyDomain: STORE_DOMAIN }
        });

        if (!foundStore) {
            throw new Error(`Store not found: ${STORE_DOMAIN}`);
        }

        store = foundStore;
        factory = new CampaignFactory(prisma, store.id, TEST_PREFIX);

        // Cleanup campaigns from this test file only
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: TEST_PREFIX }
            }
        });
    });

    test.afterAll(async () => {
        // Clean up campaigns created by this test file only
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: TEST_PREFIX }
            }
        });
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        // Clean up campaigns from previous runs of THIS test file only
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: TEST_PREFIX }
            }
        });

        await mockChallengeToken(page);

        // Log browser console messages
        page.on('console', msg => {
            if (msg.text().includes('[Revenue Boost]')) {
                console.log(`[BROWSER] ${msg.text()}`);
            }
        });
    });

    test('add-to-cart trigger - campaign can be created', async ({ page }) => {
        console.log('🧪 Testing add-to-cart trigger campaign creation...');

        // Create campaign with add-to-cart trigger
        const campaign = await (await factory.newsletter().init())
            .withName('Cart-AddToCart')
            .withPriority(500)
            .withMaxImpressionsPerSession(10)
            .withAddToCartTrigger()
            .create();

        try {
            // Verify campaign was created with correct config
            expect(campaign).toBeDefined();
            expect(campaign.name).toContain('Cart-AddToCart');
            console.log(`✅ Campaign created: ${campaign.id}`);

            // Visit store to verify app is loading
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);

            // Just verify page loads - full add-to-cart testing requires product interaction
            await page.waitForTimeout(2000);
            console.log('✅ Add-to-cart trigger campaign ready');

        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });

    test('cart value threshold - campaign config is correct', async ({ page }) => {
        console.log('🧪 Testing cart value threshold config...');

        // Create campaign with cart value trigger (min $50)
        const campaign = await (await factory.newsletter().init())
            .withName('Cart-Value-Min50')
            .withPriority(500)
            .withMaxImpressionsPerSession(10)
            .withCartValueTrigger(50) // Minimum $50
            .create();

        try {
            // Verify campaign config
            const dbCampaign = await prisma.campaign.findUnique({
                where: { id: campaign.id },
                select: { targetRules: true }
            });

            const cartValue = (dbCampaign?.targetRules as any)?.enhancedTriggers?.cart_value;
            expect(cartValue).toBeDefined();
            expect(cartValue.enabled).toBe(true);
            expect(cartValue.min_value).toBe(50);

            console.log('✅ Cart value trigger configured correctly');

        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });

    test('cart value threshold - respects maximum value', async ({ page }) => {
        console.log('🧪 Testing cart value threshold (min $20, max $100)...');

        // Create campaign with cart value trigger (min $20, max $100)
        const campaign = await (await factory.newsletter().init())
            .withName('Cart-Value-Range')
            .withPriority(500)
            .withMaxImpressionsPerSession(10)
            .withCartValueTrigger(20, 100) // Between $20-$100
            .create();

        try {
            // This test verifies the configuration is set correctly
            // Full behavioral testing would require controlling cart value precisely

            const dbCampaign = await prisma.campaign.findUnique({
                where: { id: campaign.id },
                select: { targetRules: true }
            });

            const cartValue = (dbCampaign?.targetRules as any)?.enhancedTriggers?.cart_value;
            expect(cartValue).toBeDefined();
            expect(cartValue.enabled).toBe(true);
            expect(cartValue.min_value).toBe(20);
            expect(cartValue.max_value).toBe(100);

            console.log('✅ Cart value range configured correctly');

        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });

    test('exit intent trigger - campaign config is correct', async ({ page }) => {
        console.log('🧪 Testing exit intent trigger config...');

        // Create campaign with exit intent trigger
        const campaign = await (await factory.newsletter().init())
            .withName('Cart-ExitIntent')
            .withPriority(500)
            .withMaxImpressionsPerSession(10)
            .withExitIntentTrigger()
            .create();

        try {
            // Verify campaign config
            const dbCampaign = await prisma.campaign.findUnique({
                where: { id: campaign.id },
                select: { targetRules: true }
            });

            const exitIntent = (dbCampaign?.targetRules as any)?.enhancedTriggers?.exit_intent;
            expect(exitIntent).toBeDefined();
            expect(exitIntent.enabled).toBe(true);

            console.log('✅ Exit intent trigger configured correctly');

        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });
});
