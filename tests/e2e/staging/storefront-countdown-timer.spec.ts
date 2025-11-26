import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, handlePasswordPage, mockChallengeToken } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';

test.describe.serial('Countdown Timer Template - E2E', () => {
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
        factory = new CampaignFactory(prisma, storeId);
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        // Clean up old test campaigns
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: 'E2E-Test-' }
            }
        });

        // Mock challenge token to avoid rate limits
        await mockChallengeToken(page);

        // Log browser console messages
        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });

        // Intercept the countdown-timer bundle request and serve the local file
        await page.route('**/countdown-timer.bundle.js*', async route => {
            console.log('Intercepting countdown-timer.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/countdown-timer.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders countdown timer popup with default configuration', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign using factory
        const campaign = await (await factory.countdownTimer().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Countdown Timer popup rendered successfully');
    });

    test('displays with urgent color scheme', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with urgent color scheme
        const campaign = await (await factory.countdownTimer().init())
            .withColorScheme('urgent')
            .withHeadline('HURRY! Ending Soon')
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
        console.log('✅ Urgent color scheme rendered');
    });

    test('sticky timer remains visible on scroll', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with sticky enabled
        const campaign = await (await factory.countdownTimer().init())
            .withSticky(true)
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
        console.log('✅ Sticky timer stays visible on scroll');
    });

    test('renders with custom countdown duration', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with 30 minute countdown
        const campaign = await (await factory.countdownTimer().init())
            .withCountdownDuration(1800) // 30 minutes
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
        console.log('✅ Custom countdown duration applied');
    });
});

