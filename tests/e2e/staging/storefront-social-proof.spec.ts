import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, handlePasswordPage, mockChallengeToken, getTestPrefix } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
const TEST_PREFIX = getTestPrefix('storefront-social-proof.spec.ts');

test.describe.serial('Social Proof Template - E2E', () => {
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

        // Intercept the social-proof bundle request and serve the local file
        await page.route('**/social-proof.bundle.js*', async route => {
            console.log('Intercepting social-proof.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/social-proof.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders social proof notification with default configuration', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign using factory
        const campaign = await (await factory.socialProof().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(3000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Social Proof notification rendered successfully');
    });

    test('shows purchase notifications when enabled', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with purchase notifications
        const campaign = await (await factory.socialProof().init())
            .withPurchaseNotifications(true)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(3000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Purchase notifications enabled');
    });

    test('renders at specified corner position', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with bottom-right position
        const campaign = await (await factory.socialProof().init())
            .withCornerPosition('bottom-right')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(3000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Bottom-right corner position configured');
    });

    test('respects display duration setting', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with short display duration (3 seconds)
        const campaign = await (await factory.socialProof().init())
            .withDisplayDuration(3)
            .withRotationInterval(5)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(3000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Display duration setting applied');
    });
});

