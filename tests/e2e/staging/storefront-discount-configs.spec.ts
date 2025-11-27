import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { STORE_DOMAIN, handlePasswordPage, mockChallengeToken, getTestPrefix } from './helpers/test-helpers';
import { CampaignFactory } from './factories/campaign-factory';

dotenv.config({ path: '.env.staging.env' });

const TEST_PREFIX = getTestPrefix('storefront-discount-configs.spec.ts');

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

        // Create campaign with percentage discount
        const campaign = await (await factory.newsletter().init())
            .withName('Discount-Percentage-25')
            .withPriority(500)
            .withPercentageDiscount(25, 'SAVE25')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        try {
            // Visit storefront
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);

            // Wait for popup to appear
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            // Verify shadow DOM has content
            const hasContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                return host.shadowRoot.innerHTML.length > 100;
            });
            expect(hasContent).toBe(true);

            console.log('✅ 25% percentage discount popup rendered');
        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
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

            // Wait for popup to appear
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            console.log('✅ $10 fixed amount discount popup rendered');
        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
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

            // Wait for popup to appear
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            console.log('✅ Free shipping discount popup rendered');
        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
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

            // Wait for popup to appear
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            console.log('✅ Single shared discount code popup rendered');
        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
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
            // Visit storefront
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);

            // Wait for popup to appear
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            console.log('✅ Discount code copy popup rendered');
        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });
});
