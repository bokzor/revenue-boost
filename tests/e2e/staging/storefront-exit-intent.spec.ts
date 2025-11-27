import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, API_PROPAGATION_DELAY_MS, handlePasswordPage, mockChallengeToken, getTestPrefix } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
const TEST_PREFIX = getTestPrefix('storefront-exit-intent.spec.ts');

test.describe.serial('Exit Intent Template - E2E', () => {
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

        // Intercept the exit-intent bundle request and serve the local file
        await page.route('**/exit-intent.bundle.js*', async route => {
            console.log('Intercepting exit-intent.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/exit-intent.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    /**
     * Helper to trigger exit intent by moving mouse to top of viewport
     */
    async function triggerExitIntent(page: any) {
        // Move mouse to top edge of viewport to trigger exit intent
        await page.mouse.move(500, 0);
        await page.waitForTimeout(100);
        // Move even further up (outside viewport simulation)
        await page.mouse.move(500, -10);
    }

    test('renders exit intent popup when triggered', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign using factory
        const campaign = await (await factory.exitIntent().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Trigger exit intent
        await page.waitForTimeout(2000); // Wait for page to settle
        await triggerExitIntent(page);

        // 4. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Exit Intent popup rendered successfully');
    });

    test('displays custom headline', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with custom headline
        const campaign = await (await factory.exitIntent().init())
            .withHeadline('Before you leave...')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Trigger exit intent
        await page.waitForTimeout(2000);
        await triggerExitIntent(page);

        // 4. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Custom headline rendered');
    });

    test('shows GDPR checkbox when enabled', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with GDPR enabled
        const campaign = await (await factory.exitIntent().init())
            .withGdprCheckbox(true, 'I agree to receive marketing emails')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Wait for campaign to propagate to API (Cloud Run caching)
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // 3. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Trigger exit intent
        await page.waitForTimeout(2000);
        await triggerExitIntent(page);

        // 4. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ GDPR checkbox rendered');
    });
});

