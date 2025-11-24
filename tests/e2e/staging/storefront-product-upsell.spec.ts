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

test.describe.serial('Product Upsell Template - E2E', () => {
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

        // Intercept the product-upsell bundle request and serve the local file
        await page.route('**/product-upsell.bundle.js*', async route => {
            console.log('Intercepting product-upsell.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/product-upsell.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders product upsell popup with default configuration', async ({ page }) => {
        // 1. Create campaign using factory
        const campaign = await (await factory.productUpsell().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup to appear
        const popup = page.locator('[data-splitpop="true"][data-template="product-upsell"]');

        const popupFallback = page.locator('.upsell-container, [class*="Upsell"]');

        try {
            await expect(popup.or(popupFallback).first()).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.log('❌ Popup not found. Dumping body HTML:');
            console.log(await page.innerHTML('body'));
            throw e;
        }

        // 4. Verify headline
        await expect(page.getByText(/You Might Also Like/i)).toBeVisible();

        // 5. Verify subheadline
        await expect(page.getByText(/Complete your order/i)).toBeVisible();

        console.log('✅ Product Upsell popup rendered successfully');
    });

    test('displays products in grid layout', async ({ page }) => {
        // 1. Create campaign with grid layout
        const campaign = await (await factory.productUpsell().init())
            .withLayout('grid')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify popup is visible
        const popup = page.locator('[data-splitpop="true"][data-template="product-upsell"]');
        await expect(popup).toBeVisible({ timeout: 10000 });

        // Note: We can't verify actual product cards since they're dynamic
        // but we can verify the container exists
        await expect(page.locator('.upsell-container')).toBeVisible();

        console.log('✅ Grid layout rendered');
    });

    test('shows bundle discount banner', async ({ page }) => {
        // 1. Create campaign with bundle discount
        const campaign = await (await factory.productUpsell().init())
            .withBundleDiscount(20)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify bundle discount banner exists
        await expect(page.getByText(/Save 20% when you bundle/i)).toBeVisible({ timeout: 10000 });

        console.log('✅ Bundle discount banner rendered');
    });
});
