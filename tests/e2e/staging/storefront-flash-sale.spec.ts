import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, API_PROPAGATION_DELAY_MS, handlePasswordPage, mockChallengeToken, getTestPrefix, waitForPopupWithRetry } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
const TEST_PREFIX = getTestPrefix('storefront-flash-sale.spec.ts');

test.describe.serial('Flash Sale Template - E2E', () => {
    let prisma: PrismaClient;
    let storeId: string;
    let factory: CampaignFactory;

    test.beforeAll(async () => {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined');
        }

        prisma = new PrismaClient();

        // Get store ID
        const store = await prisma.store.findUnique({
            where: { shopifyDomain: STORE_DOMAIN }
        });

        if (!store) {
            throw new Error(`Store not found: ${STORE_DOMAIN}`);
        }

        storeId = store.id;
        factory = new CampaignFactory(prisma, storeId, TEST_PREFIX);
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

        // Mock challenge token to avoid rate limits
        await mockChallengeToken(page);

        // Log browser console messages
        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });

        // Intercept the flash-sale bundle request and serve the local file
        await page.route('**/flash-sale.bundle.js*', async route => {
            console.log('Intercepting flash-sale.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/flash-sale.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders flash sale popup with default configuration', async ({ page }) => {
        // 1. Create campaign using factory
        const campaign = await (await factory.flashSale().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Wait for campaign to propagate to API (Cloud Run caching)
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // 3. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 4. Wait for popup shadow host to appear
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });
        console.log('✅ Flash Sale popup visible');
    });

    test('displays custom urgency message', async ({ page }) => {
        // 1. Create campaign with custom urgency message
        const campaign = await (await factory.flashSale().init())
            .withUrgencyMessage('Only 2 hours left!')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify popup shadow host is visible
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });

        console.log('✅ Custom urgency message popup rendered');
    });

    test('displays discount percentage', async ({ page }) => {
        // 1. Create campaign with specific discount
        const campaign = await (await factory.flashSale().init())
            .withDiscountPercentage(30)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify popup is visible
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });
        console.log('✅ Flash Sale with discount visible');
    });

    test('shows stock counter when enabled', async ({ page }) => {
        // 1. Create campaign with stock counter
        const campaign = await (await factory.flashSale().init())
            .withStockCounter(true, 'Only 5 left in stock!')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Wait for campaign to propagate to API (Cloud Run caching)
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // 3. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 4. Verify popup is visible (with retry for API propagation)
        const popupVisible = await waitForPopupWithRetry(page, { timeout: 10000, retries: 3 });
        expect(popupVisible).toBe(true);
        console.log('✅ Flash Sale with stock counter visible');
    });
});

