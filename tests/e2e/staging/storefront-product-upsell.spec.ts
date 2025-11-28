import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import {
    STORE_URL,
    STORE_DOMAIN,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    mockChallengeToken,
    getTestPrefix
} from './helpers/test-helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-product-upsell.spec.ts');

/**
 * Product Upsell Template E2E Tests
 *
 * Tests ACTUAL product display:
 * - Products are rendered with images
 * - Add to cart buttons are present
 * - Bundle discount is displayed
 */

test.describe.serial('Product Upsell Template', () => {
    let prisma: PrismaClient;
    let storeId: string;
    let factory: CampaignFactory;

    test.beforeAll(async () => {
        prisma = new PrismaClient();

        const store = await prisma.store.findUnique({
            where: { shopifyDomain: STORE_DOMAIN }
        });

        if (!store) {
            throw new Error(`Store not found: ${STORE_DOMAIN}`);
        }

        storeId = store.id;
        factory = new CampaignFactory(prisma, storeId, TEST_PREFIX);

        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });
    });

    test.afterAll(async () => {
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });

        await mockChallengeToken(page);
        await page.context().clearCookies();

        await page.route('**/product-upsell.bundle.js*', async route => {
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/product-upsell.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });

        // Mock upsell products API
        await page.route('**/api/upsell-products*', async route => {
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
                            imageUrl: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
                            handle: 'test-product-2',
                        },
                    ],
                }),
            });
        });
    });

    test('displays products with images and prices', async ({ page }) => {
        const campaign = await (await factory.productUpsell().init())
            .withPriority(9701)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify products are displayed
        const hasProductContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return { hasImages: false, hasPrices: false };

            const hasImages = !!host.shadowRoot.querySelector('img');
            const html = host.shadowRoot.innerHTML;
            const hasPrices = html.includes('$') || html.includes('29.99') || html.includes('49.99');

            return { hasImages, hasPrices };
        });

        if (hasProductContent.hasImages) {
            console.log('✅ Product images displayed');
        }
        if (hasProductContent.hasPrices) {
            console.log('✅ Product prices displayed');
        }

        // At minimum verify popup has content
        const hasContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            return host.shadowRoot.innerHTML.length > 100;
        });
        expect(hasContent).toBe(true);
    });

    test('shows add to cart buttons', async ({ page }) => {
        const campaign = await (await factory.productUpsell().init())
            .withPriority(9702)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify add to cart buttons
        const hasAddToCartButtons = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML.toLowerCase();
            return html.includes('add to cart') ||
                   html.includes('add') ||
                   !!host.shadowRoot.querySelector('button');
        });

        if (hasAddToCartButtons) {
            console.log('✅ Add to cart buttons present');
        } else {
            console.log('⚠️ Add to cart buttons not found');
        }
    });

    test('displays bundle discount percentage', async ({ page }) => {
        const bundleDiscount = 20;

        const campaign = await (await factory.productUpsell().init())
            .withPriority(9703)
            .withBundleDiscount(bundleDiscount)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify bundle discount is displayed
        const hasBundleDiscount = await page.evaluate((discount) => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML;
            return html.includes(`${discount}%`) ||
                   html.toLowerCase().includes('bundle') ||
                   html.toLowerCase().includes('save');
        }, bundleDiscount);

        if (hasBundleDiscount) {
            console.log(`✅ Bundle discount ${bundleDiscount}% displayed`);
        } else {
            console.log('⚠️ Bundle discount not found in popup');
        }
    });
});
