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

test.describe.serial('Scratch Card Template - E2E', () => {
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

        // Intercept the scratch-card bundle request and serve the local file
        await page.route('**/scratch-card.bundle.js*', async route => {
            console.log('Intercepting scratch-card.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/scratch-card.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders scratch card popup with default configuration', async ({ page }) => {
        // 1. Create campaign using factory
        const campaign = await (await factory.scratchCard().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup to appear
        const popup = page.locator('[data-splitpop="true"][data-template="scratch-card"]');

        const popupFallback = page.locator('.scratch-popup-container, [class*="ScratchCard"]');

        try {
            await expect(popup.or(popupFallback).first()).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.log('❌ Popup not found. Dumping body HTML:');
            console.log(await page.innerHTML('body'));
            throw e;
        }

        // 4. Verify headline
        await expect(page.getByText(/Scratch & Win!/i)).toBeVisible();

        // 5. Verify scratch card canvas
        const scratchCanvas = page.locator('canvas.scratch-card-canvas');
        await expect(scratchCanvas).toBeVisible();

        console.log('✅ Scratch Card popup rendered successfully');
    });

    test('renders with custom prizes', async ({ page }) => {
        // 1. Create campaign with custom prizes
        const campaign = await (await factory.scratchCard().init())
            .withPrizes([
                { label: '25% Off', probability: 0.5 },
                { label: '50% Off', probability: 0.3 },
                { label: 'Free Item', probability: 0.2 },
            ])
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify popup is visible
        const popup = page.locator('[data-splitpop="true"][data-template="scratch-card"]');
        await expect(popup).toBeVisible({ timeout: 10000 });

        //  4. Verify scratch card is ready
        const scratchCanvas = page.locator('canvas.scratch-card-canvas');
        await expect(scratchCanvas).toBeVisible();

        console.log('✅ Custom prizes configured');
    });

    test('requires email before scratching when configured', async ({ page }) => {
        // 1. Create campaign with email-before-scratching enabled
        const campaign = await (await factory.scratchCard().init())
            .withEmailBeforeScratching(true)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify email input is shown instead of scratch card
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible({ timeout: 10000 });

        // 4. Verify scratch card is NOT visible yet
        const scratchCanvas = page.locator('canvas.scratch-card-canvas');
        await expect(scratchCanvas).not.toBeVisible();

        console.log('✅ Email-before-scratching flow rendered');
    });
});
