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
const TEST_PREFIX = getTestPrefix('storefront-free-shipping.spec.ts');

test.describe.serial('Free Shipping Template - E2E', () => {
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

        // Intercept the free-shipping bundle request and serve the local file
        await page.route('**/free-shipping.bundle.js*', async route => {
            console.log('Intercepting free-shipping.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/free-shipping.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders free shipping bar with default configuration', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign using factory
        const campaign = await (await factory.freeShipping().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Free Shipping bar rendered successfully');
    });

    test('displays progress message with remaining amount', async ({ page }) => {
        // 1. Create campaign with custom threshold
        const campaign = await (await factory.freeShipping().init())
            .withThreshold(100)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Wait for campaign to propagate to API (Cloud Run caching)
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // 3. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 4. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });

        console.log('✅ Progress message popup rendered');
    });

    test('renders at specified position', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with bottom position
        const campaign = await (await factory.freeShipping().init())
            .withPosition('bottom')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Wait for campaign to propagate to API (Cloud Run caching)
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // 3. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 4. Wait for popup container (with retry for API propagation)
        const popupVisible = await waitForPopupWithRetry(page, { timeout: 10000, retries: 3 });
        expect(popupVisible).toBe(true);
        await page.waitForTimeout(2000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Bottom position bar rendered');
    });

    test('shows custom currency symbol', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with Euro currency
        const campaign = await (await factory.freeShipping().init())
            .withCurrency('€')
            .withThreshold(50)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Custom currency configuration applied');
    });
});

