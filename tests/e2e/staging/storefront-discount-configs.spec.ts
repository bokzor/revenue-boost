import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { STORE_DOMAIN, handlePasswordPage } from './helpers/test-helpers';
import { CampaignFactory } from './factories/campaign-factory';

dotenv.config({ path: '.env.staging.env' });

/**
 * Discount Configuration E2E Tests
 * 
 * Tests various discount configurations:
 * - Percentage discounts (10%, 25%, 50%)
 * - Fixed amount discounts ($5, $10)
 * - Free shipping discounts
 * - Single code vs generated codes
 * - Discount code display and copy functionality
 */

test.describe('Discount Configurations', () => {
    let prisma: PrismaClient;
    let factory: CampaignFactory;
    let store: { id: string };

    test.beforeAll(async () => {
        prisma = new PrismaClient();

        // Find store by domain
        const foundStore = await prisma.store.findUnique({
            where: { shopifyDomain: STORE_DOMAIN }
        });

        if (!foundStore) {
            throw new Error(`Store not found: ${STORE_DOMAIN}`);
        }

        store = foundStore;
        factory = new CampaignFactory(prisma, store.id);
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test('shows popup with 25% percentage discount', async ({ page }) => {
        console.log('🧪 Testing 25% percentage discount...');

        // Create campaign with percentage discount
        const campaign = await (await factory.newsletter().init())
            .withName('Discount-Percentage-25')
            .withPriority(500)
            .withPercentageDiscount(25, 'SAVE25')
            .create();

        try {
            // Visit storefront
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);
            await page.waitForLoadState('networkidle');

            // Wait for popup to appear
            const popup = page.locator('[data-splitpop="true"]');
            await expect(popup).toBeVisible({ timeout: 10000 });

            // Look for discount code display (should show generated code)
            // The exact selector depends on the popup template
            const discountDisplay = popup.locator('text=/SAVE25/i');
            await expect(discountDisplay).toBeVisible({ timeout: 5000 });

            console.log('✅ 25% percentage discount displayed successfully');
        } finally {
            // Cleanup
            await prisma.campaign.delete({ where: { id: campaign.id } });
        }
    });

    test('shows popup with $10 fixed amount discount', async ({ page }) => {
        console.log('🧪 Testing $10 fixed amount discount...');

        // Create campaign with fixed amount discount
        const campaign = await (await factory.newsletter().init())
            .withName('Discount-Fixed-10')
            .withPriority(500)
            .withFixedAmountDiscount(10, 'SAVE10')
            .create();

        try {
            // Visit storefront
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);
            await page.waitForLoadState('networkidle');

            // Wait for popup to appear
            const popup = page.locator('[data-splitpop="true"]');
            await expect(popup).toBeVisible({ timeout: 10000 });

            // Look for discount code display
            const discountDisplay = popup.locator('text=/SAVE10/i');
            await expect(discountDisplay).toBeVisible({ timeout: 5000 });

            console.log('✅ $10 fixed amount discount displayed successfully');
        } finally {
            // Cleanup
            await prisma.campaign.delete({ where: { id: campaign.id } });
        }
    });

    test('shows popup with free shipping discount', async ({ page }) => {
        console.log('🧪 Testing free shipping discount...');

        // Create campaign with free shipping discount
        const campaign = await (await factory.newsletter().init())
            .withName('Discount-FreeShip')
            .withPriority(500)
            .withFreeShippingDiscount('FREESHIP')
            .create();

        try {
            // Visit storefront
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);
            await page.waitForLoadState('networkidle');

            // Wait for popup to appear
            const popup = page.locator('[data-splitpop="true"]');
            await expect(popup).toBeVisible({ timeout: 10000 });

            // Look for discount code display
            const discountDisplay = popup.locator('text=/FREESHIP/i');
            await expect(discountDisplay).toBeVisible({ timeout: 5000 });

            console.log('✅ Free shipping discount displayed successfully');
        } finally {
            // Cleanup
            await prisma.campaign.delete({ where: { id: campaign.id } });
        }
    });

    test('shows popup with single discount code (shared)', async ({ page }) => {
        console.log('🧪 Testing single shared discount code...');

        // Create campaign with single shared code
        const campaign = await (await factory.newsletter().init())
            .withName('Discount-Single-Code')
            .withPriority(500)
            .withSingleDiscountCode('WELCOME2024')
            .create();

        try {
            // Visit storefront
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);
            await page.waitForLoadState('networkidle');

            // Wait for popup to appear
            const popup = page.locator('[data-splitpop="true"]');
            await expect(popup).toBeVisible({ timeout: 10000 });

            // Look for the exact code
            const discountDisplay = popup.locator('text=/WELCOME2024/i');
            await expect(discountDisplay).toBeVisible({ timeout: 5000 });

            console.log('✅ Single shared discount code displayed successfully');
        } finally {
            // Cleanup
            await prisma.campaign.delete({ where: { id: campaign.id } });
        }
    });

    test('allows copying discount code to clipboard', async ({ page }) => {
        console.log('🧪 Testing discount code copy functionality...');

        // Create campaign with discount
        const campaign = await (await factory.newsletter().init())
            .withName('Discount-Copy-Test')
            .withPriority(500)
            .withPercentageDiscount(20, 'COPY20')
            .create();

        try {
            // Grant clipboard permissions
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

            // Visit storefront
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);
            await page.waitForLoadState('networkidle');

            // Wait for popup to appear
            const popup = page.locator('[data-splitpop="true"]');
            await expect(popup).toBeVisible({ timeout: 10000 });

            // Find and click the discount code (or copy button)
            const discountCode = popup.locator('text=/COPY20/i').first();
            await expect(discountCode).toBeVisible({ timeout: 5000 });
            await discountCode.click();

            // Wait a bit for clipboard operation
            await page.waitForTimeout(500);

            // Verify clipboard content
            const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
            expect(clipboardText).toContain('COPY20');

            console.log('✅ Discount code copy functionality works correctly');
        } finally {
            // Cleanup
            await prisma.campaign.delete({ where: { id: campaign.id } });
        }
    });
});
