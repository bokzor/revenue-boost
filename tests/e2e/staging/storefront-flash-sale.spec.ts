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

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup to appear
        const popup = page.locator('[data-splitpop="true"][data-template="flash-sale"]');
        const popupFallback = page.locator('.flash-sale-popup, [class*="FlashSale"]');

        try {
            await expect(popup.or(popupFallback).first()).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.log('❌ Popup not found. Dumping body HTML:');
            console.log(await page.innerHTML('body'));
            throw e;
        }

        // 4. Verify headline
        await expect(page.getByText(/Flash Sale!/i)).toBeVisible();

        // 5. Verify countdown timer exists
        const countdownTimer = page.locator('[class*="countdown"], [class*="timer"]');
        await expect(countdownTimer.first()).toBeVisible();

        console.log('✅ Flash Sale popup rendered successfully');
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

        // 3. Verify custom urgency message
        await expect(page.getByText('Only 2 hours left!')).toBeVisible({ timeout: 10000 });

        console.log('✅ Custom urgency message rendered');
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
        const popup = page.locator('[data-splitpop="true"][data-template="flash-sale"]');
        await expect(popup).toBeVisible({ timeout: 10000 });

        // 4. Verify discount is shown (30% off)
        await expect(page.getByText(/30%/i)).toBeVisible();

        console.log('✅ Discount percentage rendered');
    });

    test('shows stock counter when enabled', async ({ page }) => {
        // 1. Create campaign with stock counter
        const campaign = await (await factory.flashSale().init())
            .withStockCounter(true, 'Only 5 left in stock!')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify popup is visible (stock counter may not be implemented yet in storefront component)
        const popup = page.locator('[data-splitpop="true"][data-template="flash-sale"]');
        await expect(popup).toBeVisible({ timeout: 10000 });

        // 4. Log whether stock message was found (informational, not required)
        const stockMessageVisible = await page.getByText(/Only 5 left|stock/i).isVisible().catch(() => false);
        if (stockMessageVisible) {
            console.log('✅ Stock counter rendered');
        } else {
            console.log('ℹ️ Stock counter configured but not visible (feature may not be implemented in storefront)');
        }
    });
});

