import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { STORE_DOMAIN, handlePasswordPage, mockChallengeToken } from './helpers/test-helpers';
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

        // Cleanup old test campaigns
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: 'E2E-Test-' }
            }
        });
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        await mockChallengeToken(page);

        // Log browser console messages
        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });

        // Log API responses for debugging
        page.on('response', async response => {
            if (response.url().includes('/api/campaigns') && response.status() === 200) {
                try {
                    const json = await response.json();
                    console.log(`[API] /api/campaigns response:`, JSON.stringify(json, null, 2));
                } catch (e) {
                    console.log(`[API] Failed to parse JSON for ${response.url()}`);
                }
            }
        });
        // Log requests to debug interception
        page.on('request', request => {
            if (request.url().includes('leads') || request.url().includes('api')) {
                console.log(`>> Request: ${request.method()} ${request.url()}`);
            }
        });
    });

    // Helper to submit the form
    async function submitForm(page: any, scope = page) {
        const emailInput = scope.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();
        await emailInput.fill(`test-${Date.now()}@example.com`);

        const submitBtn = scope.locator('button[type="submit"]');
        await submitBtn.click();
    }

    // Helper to mock lead submission (since we use mock challenge tokens)
    async function mockLeadSubmission(page: any, discountCode: string) {
        await page.route('**/apps/revenue-boost/api/leads/submit*', async (route: any) => {
            console.log(`Intercepting lead submission: ${route.request().url()}`);
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, discountCode })
            });
        });
    }

    test('shows popup with 25% percentage discount', async ({ page }) => {
        console.log('🧪 Testing 25% percentage discount...');
        await mockLeadSubmission(page, 'SAVE25');

        // Create campaign with percentage discount
        const campaign = await (await factory.newsletter().init())
            .withName('Discount-Percentage-25')
            .withPriority(500)
            .withPercentageDiscount(25, 'SAVE25')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);
        console.log(`   Name: ${campaign.name}`);
        console.log(`   Priority: ${campaign.priority}`);
        console.log(`   Status: ${campaign.status}`);
        console.log(`   Discount Config: ${JSON.stringify(campaign.discountConfig)}`);

        let testPassed = false;
        try {
            // Visit storefront
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);
            await page.waitForLoadState('networkidle');

            // Wait for popup to appear
            const popup = page.locator('[data-splitpop="true"]');
            await expect(popup).toBeVisible({ timeout: 10000 });

            // Submit form to see discount
            await submitForm(page, popup);

            // Wait for success message to appear
            const successMessage = popup.locator('text=/Thanks for subscribing/i');
            await expect(successMessage).toBeVisible({ timeout: 10000 });

            // Now look for discount code display
            const discountDisplay = popup.locator('text=/SAVE25/i');
            await expect(discountDisplay).toBeVisible({ timeout: 10000 });

            console.log('✅ 25% percentage discount displayed successfully');
            testPassed = true;
        } finally {
            // Only cleanup if test passed, otherwise leave for debugging
            if (testPassed) {
                await prisma.campaign.delete({ where: { id: campaign.id } });
                console.log(`🗑️  Cleaned up campaign: ${campaign.id}`);
            } else {
                console.log(`⚠️  Leaving campaign ${campaign.id} for debugging`);
            }
        }
    });

    test('shows popup with $10 fixed amount discount', async ({ page }) => {
        console.log('🧪 Testing $10 fixed amount discount...');
        await mockLeadSubmission(page, 'SAVE10');

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

            // Submit form to see discount
            await submitForm(page, popup);

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
        await mockLeadSubmission(page, 'FREESHIP');

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

            // Submit form to see discount
            await submitForm(page, popup);

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
        await mockLeadSubmission(page, 'WELCOME2024');

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

            // Submit form to see discount
            await submitForm(page, popup);

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
        await mockLeadSubmission(page, 'COPY20');

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

            // Submit form to see discount
            await submitForm(page, popup);

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
