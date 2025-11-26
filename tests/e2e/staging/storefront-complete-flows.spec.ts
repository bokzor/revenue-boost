import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import {
    STORE_URL,
    handlePasswordPage,
    mockChallengeToken
} from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';

test.describe.serial('Complete User Flows - E2E', () => {
    let prisma: PrismaClient;
    let storeId: string;
    let factory: CampaignFactory;

    test.beforeAll(async () => {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined');
        }

        prisma = new PrismaClient();

        const store = await prisma.store.findUnique({
            where: { shopifyDomain: STORE_DOMAIN }
        });

        if (!store) {
            throw new Error(`Store not found: ${STORE_DOMAIN}`);
        }

        storeId = store.id;
        factory = new CampaignFactory(prisma, storeId);
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        // Clean up old test campaigns
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: 'E2E-Test-' } }
        });

        // Mock challenge token
        await mockChallengeToken(page);

        // Log browser console messages
        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });

        // Log page errors
        page.on('pageerror', error => {
            console.log(`[PAGE ERROR] ${error.message}`);
        });

        // Intercept bundle requests to use locally built versions
        // This is needed until the fix for React.useId() is deployed to staging
        const fs = await import('fs');

        const bundles = ['newsletter', 'spin-to-win', 'scratch-card', 'flash-sale'];
        for (const bundle of bundles) {
            await page.route(`**/${bundle}.bundle.js*`, async route => {
                const bundlePath = path.join(process.cwd(), `extensions/storefront-popup/assets/${bundle}.bundle.js`);
                try {
                    const content = fs.readFileSync(bundlePath);
                    await route.fulfill({ status: 200, contentType: 'application/javascript', body: content });
                } catch {
                    await route.continue();
                }
            });
        }
    });

    test('Newsletter: campaign triggers and popup container renders', async ({ page }) => {
        /**
         * This test verifies:
         * 1. Campaign is created successfully
         * 2. Storefront fetches and receives the campaign
         * 3. Triggers evaluate correctly and popup is triggered
         * 4. Popup container is created in the DOM
         *
         * NOTE: Full form interaction tests are pending resolution of
         * shadow DOM rendering issue in the deployed extension.
         */

        // Track popup events
        let popupShown = false;
        let campaignReceived = false;
        let triggersEvaluated = false;

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Popup shown')) popupShown = true;
            if (text.includes('Campaigns received')) campaignReceived = true;
            if (text.includes('Triggers passed')) triggersEvaluated = true;
        });

        // 1. Create newsletter campaign
        const campaign = await (await factory.newsletter().init())
            .withName('E2E-Test-Newsletter-Flow')
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for campaign to be processed
        await page.waitForTimeout(5000);

        // 4. Verify campaign was received by storefront
        expect(campaignReceived).toBeTruthy();
        console.log('✅ Campaign received by storefront');

        // 5. Verify triggers evaluated
        expect(triggersEvaluated).toBeTruthy();
        console.log('✅ Triggers evaluated successfully');

        // 6. Verify popup shown event
        expect(popupShown).toBeTruthy();
        console.log('✅ Popup shown event fired');

        // 7. Verify popup container exists
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 5000 });
        console.log('✅ Popup container created');

        console.log('✅ Newsletter campaign trigger flow verified!');
    });

    test('Spin-to-Win: campaign triggers and popup container renders', async ({ page }) => {
        /**
         * Smoke test for Spin-to-Win template
         */
        let popupShown = false;
        let campaignReceived = false;

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Popup shown')) popupShown = true;
            if (text.includes('Campaigns received')) campaignReceived = true;
        });

        const campaign = await (await factory.spinToWin().init())
            .withName('E2E-Test-SpinToWin-Flow')
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await page.waitForTimeout(5000);

        expect(campaignReceived).toBeTruthy();
        console.log('✅ Campaign received');

        expect(popupShown).toBeTruthy();
        console.log('✅ Popup shown');

        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 5000 });
        console.log('✅ Spin-to-Win popup container created');
    });

    test('Scratch Card: campaign triggers and popup container renders', async ({ page }) => {
        /**
         * Smoke test for Scratch Card template
         */
        let popupShown = false;
        let campaignReceived = false;

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Popup shown')) popupShown = true;
            if (text.includes('Campaigns received')) campaignReceived = true;
        });

        const campaign = await (await factory.scratchCard().init())
            .withName('E2E-Test-ScratchCard-Flow')
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await page.waitForTimeout(5000);

        expect(campaignReceived).toBeTruthy();
        console.log('✅ Campaign received');

        expect(popupShown).toBeTruthy();
        console.log('✅ Popup shown');

        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 5000 });
        console.log('✅ Scratch Card popup container created');
    });

    test('Flash Sale: campaign triggers and popup container renders', async ({ page }) => {
        /**
         * Smoke test for Flash Sale template
         */
        let popupShown = false;
        let campaignReceived = false;

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Popup shown')) popupShown = true;
            if (text.includes('Campaigns received')) campaignReceived = true;
        });

        const campaign = await (await factory.flashSale().init())
            .withName('E2E-Test-FlashSale-Flow')
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await page.waitForTimeout(5000);

        expect(campaignReceived).toBeTruthy();
        console.log('✅ Campaign received');

        expect(popupShown).toBeTruthy();
        console.log('✅ Popup shown');

        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 5000 });
        console.log('✅ Flash Sale popup container created');
    });
});

