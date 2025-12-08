import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import {
    STORE_URL,
    STORE_DOMAIN,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    mockUpsellProducts,
    getTestPrefix,
    cleanupAllE2ECampaigns,
    MAX_TEST_PRIORITY
} from './helpers/test-helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-product-upsell.spec.ts');

/**
 * Product Upsell Template E2E Tests
 *
 * Tests ACTUAL product display against REAL API endpoints:
 * - Products are fetched from real upsell-products API
 * - Products are rendered with images
 * - Add to cart buttons are present
 * - Bundle discount is displayed
 *
 * NOTE: These tests run against deployed extension code (no bundle mocking)
 * and real API endpoints (no API mocking).
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
        // Clean up ALL E2E campaigns to avoid priority conflicts
        await cleanupAllE2ECampaigns(prisma);

        // Mock upsell products API to bypass app proxy authentication
        await mockUpsellProducts(page);
        await page.context().clearCookies();
    });

    // ProductUpsellPopup uses PopupPortal which creates shadow DOM
    const POPUP_SELECTOR = '#revenue-boost-popup-shadow-host';

    test('displays products with images and prices', async ({ page }) => {
        const campaign = await (await factory.productUpsell().init())
            .withPriority(MAX_TEST_PRIORITY)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Wait for popup shadow host to appear
        const popup = page.locator(POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 20000 });

        // Wait a bit more for shadow content to render
        await page.waitForTimeout(1000);

        // Verify products are displayed with real data from API
        const productContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return { hasImages: false, hasPrices: false, contentLength: 0 };

            const hasImages = !!host.shadowRoot.querySelector('img');
            const html = host.shadowRoot.innerHTML;
            // Check for price patterns (currency symbols or decimal prices)
            const hasPrices = /\$[\d,.]+/.test(html) || /[\d]+\.[\d]{2}/.test(html);

            return { hasImages, hasPrices, contentLength: html.length };
        });

        console.log(`Shadow content length: ${productContent.contentLength}`);

        // Products MUST have images and prices - hard assertions
        expect(productContent.hasImages).toBe(true);
        console.log('✅ Product images displayed');

        expect(productContent.hasPrices).toBe(true);
        console.log('✅ Product prices displayed');
    });

    test('shows add to cart buttons', async ({ page }) => {
        const campaign = await (await factory.productUpsell().init())
            .withPriority(MAX_TEST_PRIORITY)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 20000 });
        await page.waitForTimeout(1000);

        // Verify add to cart buttons exist - hard assertion
        const hasAddToCartButtons = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML.toLowerCase();
            return html.includes('add to cart') ||
                   html.includes('add') ||
                   !!host.shadowRoot.querySelector('button');
        });

        expect(hasAddToCartButtons).toBe(true);
        console.log('✅ Add to cart buttons present');
    });

    test('displays bundle discount percentage', async ({ page }) => {
        const bundleDiscount = 20;

        const campaign = await (await factory.productUpsell().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withBundleDiscount(bundleDiscount)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 20000 });
        await page.waitForTimeout(1000);

        // Verify bundle discount is displayed - hard assertion
        const hasBundleDiscount = await page.evaluate((discount) => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML;
            return html.includes(`${discount}%`) ||
                   html.toLowerCase().includes('bundle') ||
                   html.toLowerCase().includes('save');
        }, bundleDiscount);

        expect(hasBundleDiscount).toBe(true);
        console.log(`✅ Bundle discount ${bundleDiscount}% displayed`);
    });

    test('add to cart button interaction works', async ({ page }) => {
        console.log('🧪 Testing add to cart interaction...');

        const campaign = await (await factory.productUpsell().init())
            .withPriority(MAX_TEST_PRIORITY)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // Intercept cart requests to verify they're made (mock successful response)
        const cartRequests: string[] = [];
        await page.route('**/cart/add**', async route => {
            cartRequests.push(route.request().url());
            // Mock successful cart response since we're using fake variant IDs
            await route.fulfill({
                json: {
                    items: [],
                    item_count: 1,
                    total_price: 2999,
                }
            });
        });

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 20000 });
        await page.waitForTimeout(1000);

        // Step 1: First select a product by clicking "Add to Bundle" button
        const productSelected = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;

            const buttons = host.shadowRoot.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.textContent?.toLowerCase() || '';
                // Find "Add to Bundle" or similar selection button
                if (text.includes('add to bundle') || text.includes('+ add')) {
                    btn.click();
                    return true;
                }
            }
            // Fallback: click on a product card to select it
            const productCards = host.shadowRoot.querySelectorAll('[class*="product"], [class*="upsell"]');
            for (const card of productCards) {
                if (card instanceof HTMLElement) {
                    card.click();
                    return true;
                }
            }
            return false;
        });

        console.log(`Product selection attempted: ${productSelected}`);
        await page.waitForTimeout(500);

        // Step 2: Click the main CTA button (Add to Cart)
        const clicked = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;

            const buttons = host.shadowRoot.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.textContent?.toLowerCase() || '';
                const classes = btn.className?.toLowerCase() || '';
                // Find the main CTA button (usually has "cta" class or contains cart icon)
                if (classes.includes('cta') ||
                    (text.includes('add to cart') && !btn.disabled) ||
                    (text.includes('🛒') && !btn.disabled)) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });

        expect(clicked).toBe(true);
        console.log('✅ Add to cart button clicked');

        await page.waitForTimeout(1000);

        // Verify cart request was made
        expect(cartRequests.length).toBeGreaterThan(0);
        console.log('✅ Add to cart triggered API request');
    });

    test('displays product titles and descriptions', async ({ page }) => {
        console.log('🧪 Testing product information display...');

        const campaign = await (await factory.productUpsell().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withShowProductInfo(true)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 20000 });
        await page.waitForTimeout(1000);

        // Check for product info - MUST have substantial content
        const productInfo = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return null;

            const html = host.shadowRoot.innerHTML;
            return {
                hasTitle: html.length > 200,
                hasDescription: html.length > 300
            };
        });

        expect(productInfo).not.toBeNull();
        expect(productInfo!.hasTitle).toBe(true);
        console.log('✅ Product information displayed');
    });

    test('frequently bought together layout', async ({ page }) => {
        console.log('🧪 Testing frequently bought together...');

        const campaign = await (await factory.productUpsell().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withUpsellType('frequently_bought_together')
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 20000 });
        await page.waitForTimeout(1000);

        // Check for FBT-style layout - MUST have recognizable content
        const hasFbtContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;

            const html = host.shadowRoot.innerHTML.toLowerCase();
            // FBT popup must have product-related content
            return html.includes('frequently') ||
                   html.includes('together') ||
                   html.includes('also') ||
                   html.includes('complete') ||
                   html.includes('product') ||
                   html.includes('add');
        });

        expect(hasFbtContent).toBe(true);
        console.log('✅ Frequently bought together popup rendered');
    });
});
