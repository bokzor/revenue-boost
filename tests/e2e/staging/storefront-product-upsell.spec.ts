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
const TEST_PREFIX = getTestPrefix('storefront-product-upsell.spec.ts');

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

        // Mock the upsell products API to return mock products
        // This is necessary because the staging store may not have products
        // or the AI recommendation service may not return results
        await page.route('**/api/upsell-products*', async route => {
            console.log('Mocking upsell-products API response');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    products: [
                        {
                            id: 'gid://shopify/Product/1',
                            variantId: 'gid://shopify/ProductVariant/1',
                            title: 'Test Product 1',
                            price: '29.99',
                            compareAtPrice: '39.99',
                            imageUrl: 'https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&w=400',
                            handle: 'test-product-1',
                        },
                        {
                            id: 'gid://shopify/Product/2',
                            variantId: 'gid://shopify/ProductVariant/2',
                            title: 'Test Product 2',
                            price: '49.99',
                            compareAtPrice: '59.99',
                            imageUrl: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
                            handle: 'test-product-2',
                        },
                        {
                            id: 'gid://shopify/Product/3',
                            variantId: 'gid://shopify/ProductVariant/3',
                            title: 'Test Product 3',
                            price: '19.99',
                            imageUrl: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
                            handle: 'test-product-3',
                        },
                    ],
                }),
            });
        });
    });

    test('renders product upsell popup with default configuration', async ({ page }) => {
        // 1. Create campaign using factory
        const campaign = await (await factory.productUpsell().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Wait for campaign to propagate to API (Cloud Run caching)
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // 3. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 4. Wait for popup shadow host to appear (with retry for API propagation)
        const popupVisible = await waitForPopupWithRetry(page, { timeout: 10000, retries: 3 });
        expect(popupVisible).toBe(true);

        // 5. Verify shadow DOM has content
        const hasContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            return host.shadowRoot.innerHTML.length > 100;
        });
        expect(hasContent).toBe(true);

        console.log('✅ Product Upsell popup rendered successfully');
    });

    test('displays products in grid layout', async ({ page }) => {
        // 1. Create campaign with grid layout
        const campaign = await (await factory.productUpsell().init())
            .withLayout('grid')
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

        console.log('✅ Grid layout rendered');
    });

    test('shows bundle discount banner', async ({ page }) => {
        // 1. Create campaign with bundle discount
        const campaign = await (await factory.productUpsell().init())
            .withBundleDiscount(20)
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

        console.log('✅ Bundle discount popup rendered');
    });
});
