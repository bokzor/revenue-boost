/**
 * E2E Tests: BOGO Campaigns & CTA Button Actions
 *
 * Tests the BOGO (Buy One Get One) recipe and the new unified CTA system.
 *
 * CTA Actions tested:
 * - navigate_collection: Navigate to a collection page
 * - navigate_url: Navigate to a custom URL
 * - add_to_cart: Add product to cart (requires staging store product)
 *
 * BOGO Features tested:
 * - BOGO headline and discount display
 * - Two-step flow: claim discount, then navigate/add to cart
 * - CTA button label updates after discount claim
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { CampaignFactory, FlashSaleBuilder } from './factories/campaign-factory';
import {
    handlePasswordPage,
    mockChallengeToken,
    API_PROPAGATION_DELAY_MS,
    STORE_URL,
    verifyFlashSaleContent,
} from './helpers/test-helpers';

// Extend FlashSaleBuilder with CTA methods
declare module './factories/campaign-factory' {
    interface FlashSaleBuilder {
        withCTA(cta: {
            label: string;
            action: string;
            collectionHandle?: string;
            url?: string;
            variantId?: string;
            quantity?: number;
            applyDiscountFirst?: boolean;
        }): FlashSaleBuilder;
        withSecondaryCTA(cta: { label: string; action: string }): FlashSaleBuilder;
        withBOGOContent(): FlashSaleBuilder;
    }
}

// Add CTA methods to FlashSaleBuilder prototype
FlashSaleBuilder.prototype.withCTA = function(cta) {
    if (!this.config) throw new Error('Config not initialized');
    this.config.contentConfig.cta = cta;
    return this;
};

FlashSaleBuilder.prototype.withSecondaryCTA = function(cta) {
    if (!this.config) throw new Error('Config not initialized');
    this.config.contentConfig.secondaryCta = cta;
    return this;
};

FlashSaleBuilder.prototype.withBOGOContent = function() {
    if (!this.config) throw new Error('Config not initialized');
    this.config.contentConfig = {
        ...this.config.contentConfig,
        headline: 'Buy 1 Get 1 FREE!',
        subheadline: 'Limited time offer - double your order',
        urgencyMessage: 'While supplies last',
        showCountdown: true,
    };
    return this;
};

const prisma = new PrismaClient();
const TEST_PREFIX = 'E2E-BOGO-CTA-';
const MAX_TEST_PRIORITY = 999999;

let storeId: string;
let factory: CampaignFactory;

test.describe('BOGO & CTA Button Tests', () => {
    test.beforeAll(async () => {
        const store = await prisma.store.findFirst({ select: { id: true } });
        if (!store) throw new Error('No store found');
        storeId = store.id;
        factory = new CampaignFactory(prisma, storeId, TEST_PREFIX);
    });

    test.afterAll(async () => {
        // Clean up test campaigns
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ context, page }) => {
        // Clean up any existing test campaigns to ensure isolation
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });
        await context.clearCookies();
        await mockChallengeToken(page);
    });

    test.describe('CTA Configuration', () => {
        test('displays custom CTA button label', async ({ page }) => {
            const campaign = await (await factory.flashSale().init())
                .withName('CTA-Custom-Label')
                .withPriority(MAX_TEST_PRIORITY)
                .withHeadline('Flash Sale!')
                .withCTA({
                    label: 'Get My BOGO Deal',
                    action: 'navigate_collection',
                    collectionHandle: 'all',
                    applyDiscountFirst: true,
                })
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popup = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popup).toBeVisible({ timeout: 15000 });

            // Verify CTA button has custom label
            const ctaLabel = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return null;
                const ctaBtn = host.shadowRoot.querySelector('.flash-sale-cta, button[class*="cta"]');
                return ctaBtn?.textContent?.trim();
            });

            expect(ctaLabel).toBe('Get My BOGO Deal');
            console.log(`✅ CTA button shows custom label: "${ctaLabel}"`);
        });

        test('CTA navigates to collection page', async ({ page }) => {
            const campaign = await (await factory.flashSale().init())
                .withName('CTA-Navigate-Collection')
                .withPriority(MAX_TEST_PRIORITY)
                .withCTA({
                    label: 'Shop the Sale',
                    action: 'navigate_collection',
                    collectionHandle: 'all',
                    applyDiscountFirst: false, // No discount, just navigate
                })
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popup = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popup).toBeVisible({ timeout: 15000 });

            // Click CTA button
            await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return;
                const ctaBtn = host.shadowRoot.querySelector('.flash-sale-cta, button[class*="cta"]') as HTMLButtonElement;
                ctaBtn?.click();
            });

            // Wait for navigation
            await page.waitForURL('**/collections/all**', { timeout: 10000 });
            expect(page.url()).toContain('/collections/all');
            console.log('✅ CTA navigated to collection page');
        });

        test('CTA navigates to custom URL', async ({ page }) => {
            const campaign = await (await factory.flashSale().init())
                .withName('CTA-Navigate-URL')
                .withPriority(MAX_TEST_PRIORITY)
                .withCTA({
                    label: 'View Products',
                    action: 'navigate_url',
                    url: '/products',
                    applyDiscountFirst: false,
                })
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            console.log(`📋 Campaign contentConfig:`, JSON.stringify(campaign.contentConfig, null, 2));
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popup = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popup).toBeVisible({ timeout: 15000 });

            // Click CTA button
            await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return;
                const ctaBtn = host.shadowRoot.querySelector('.flash-sale-cta, button[class*="cta"]') as HTMLButtonElement;
                ctaBtn?.click();
            });

            // Wait for navigation
            await page.waitForURL('**/products**', { timeout: 10000 });
            expect(page.url()).toContain('/products');
            console.log('✅ CTA navigated to custom URL');
        });

        test('secondary CTA dismisses popup', async ({ page }) => {
            const campaign = await (await factory.flashSale().init())
                .withName('CTA-Secondary-Dismiss')
                .withPriority(MAX_TEST_PRIORITY)
                .withCTA({
                    label: 'Shop Now',
                    action: 'navigate_collection',
                    collectionHandle: 'all',
                })
                .withSecondaryCTA({
                    label: 'Maybe later',
                    action: 'dismiss',
                })
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popup = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popup).toBeVisible({ timeout: 15000 });

            // Verify secondary CTA label
            const secondaryLabel = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return null;
                const secondaryBtn = host.shadowRoot.querySelector('.flash-sale-secondary-cta, button[class*="secondary"]');
                return secondaryBtn?.textContent?.trim();
            });

            expect(secondaryLabel).toBe('Maybe later');

            // Click secondary CTA
            await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return;
                const secondaryBtn = host.shadowRoot.querySelector('.flash-sale-secondary-cta, button[class*="secondary"]') as HTMLButtonElement;
                secondaryBtn?.click();
            });

            // Popup should be dismissed
            await expect(popup).not.toBeVisible({ timeout: 5000 });
            console.log('✅ Secondary CTA dismissed popup');
        });
    });

    test.describe('BOGO Recipe', () => {
        test('displays BOGO headline and content', async ({ page }) => {
            const campaign = await (await factory.flashSale().init())
                .withName('BOGO-Content')
                .withPriority(MAX_TEST_PRIORITY)
                .withBOGOContent()
                .withCTA({
                    label: 'Get My BOGO Deal',
                    action: 'navigate_collection',
                    collectionHandle: 'all',
                    applyDiscountFirst: true,
                })
                .withPercentageDiscount(50) // BOGO = 50% off
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            console.log(`📋 Campaign contentConfig:`, JSON.stringify(campaign.contentConfig, null, 2));
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popup = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popup).toBeVisible({ timeout: 15000 });

            // Verify BOGO content
            const content = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return null;
                const headline = host.shadowRoot.querySelector('h1, h2, [class*="headline"]');
                const subheadline = host.shadowRoot.querySelector('[class*="subheadline"], p');
                return {
                    headline: headline?.textContent?.trim(),
                    subheadline: subheadline?.textContent?.trim(),
                };
            });

            expect(content?.headline).toContain('Buy 1 Get 1 FREE');
            console.log(`✅ BOGO headline displayed: "${content?.headline}"`);
        });

        test('BOGO two-step flow: claim discount then navigate', async ({ page }) => {
            const campaign = await (await factory.flashSale().init())
                .withName('BOGO-Two-Step')
                .withPriority(MAX_TEST_PRIORITY)
                .withBOGOContent()
                .withCTA({
                    label: 'Get My BOGO Deal',
                    action: 'navigate_collection',
                    collectionHandle: 'all',
                    applyDiscountFirst: true,
                })
                .withPercentageDiscount(50)
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popup = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popup).toBeVisible({ timeout: 15000 });

            // Step 1: Click CTA to claim discount
            const initialLabel = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return null;
                const ctaBtn = host.shadowRoot.querySelector('.flash-sale-cta, button[class*="cta"]');
                return ctaBtn?.textContent?.trim();
            });
            expect(initialLabel).toBe('Get My BOGO Deal');
            console.log(`✅ Initial CTA label: "${initialLabel}"`);

            // Click to claim discount
            await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return;
                const ctaBtn = host.shadowRoot.querySelector('.flash-sale-cta, button[class*="cta"]') as HTMLButtonElement;
                ctaBtn?.click();
            });

            // Wait for discount to be applied
            await page.waitForTimeout(2000);

            // Step 2: Verify label changed to "Shop Now"
            const updatedLabel = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return null;
                const ctaBtn = host.shadowRoot.querySelector('.flash-sale-cta, button[class*="cta"]');
                return ctaBtn?.textContent?.trim();
            });

            // After discount claim, label should change to "Shop Now"
            expect(updatedLabel).toBe('Shop Now');
            console.log(`✅ CTA label updated after discount claim: "${updatedLabel}"`);

            // Step 3: Click again to navigate
            await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return;
                const ctaBtn = host.shadowRoot.querySelector('.flash-sale-cta, button[class*="cta"]') as HTMLButtonElement;
                ctaBtn?.click();
            });

            // Should navigate to collection
            await page.waitForURL('**/collections/all**', { timeout: 10000 });
            expect(page.url()).toContain('/collections/all');
            console.log('✅ Two-step BOGO flow completed successfully');
        });
    });

    test.describe('CTA with Discount Flow', () => {
        test('applies discount before navigation', async ({ page }) => {
            const campaign = await (await factory.flashSale().init())
                .withName('CTA-Apply-Discount-First')
                .withPriority(MAX_TEST_PRIORITY)
                .withCTA({
                    label: 'Claim 20% Off',
                    action: 'navigate_collection',
                    collectionHandle: 'all',
                    applyDiscountFirst: true,
                })
                .withPercentageDiscount(20)
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            console.log(`📋 Campaign discountConfig:`, JSON.stringify(campaign.discountConfig, null, 2));
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popup = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popup).toBeVisible({ timeout: 15000 });

            // First click - should claim discount, NOT navigate
            await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return;
                const ctaBtn = host.shadowRoot.querySelector('.flash-sale-cta, button[class*="cta"]') as HTMLButtonElement;
                ctaBtn?.click();
            });

            // Wait briefly for discount to be claimed
            await page.waitForTimeout(2000);

            // Should still be on the same page (discount was claimed, not navigated)
            expect(page.url()).not.toContain('/collections/all');
            console.log('✅ First click claimed discount without navigating');

            // Second click - should navigate
            await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return;
                const ctaBtn = host.shadowRoot.querySelector('.flash-sale-cta, button[class*="cta"]') as HTMLButtonElement;
                ctaBtn?.click();
            });

            await page.waitForURL('**/collections/all**', { timeout: 10000 });
            console.log('✅ Second click navigated to collection');
        });

        test('skips discount when applyDiscountFirst is false', async ({ page }) => {
            const campaign = await (await factory.flashSale().init())
                .withName('CTA-Skip-Discount')
                .withPriority(MAX_TEST_PRIORITY)
                .withCTA({
                    label: 'Browse Sale',
                    action: 'navigate_collection',
                    collectionHandle: 'all',
                    applyDiscountFirst: false, // Direct navigation
                })
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popup = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popup).toBeVisible({ timeout: 15000 });

            // Single click should navigate immediately
            await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return;
                const ctaBtn = host.shadowRoot.querySelector('.flash-sale-cta, button[class*="cta"]') as HTMLButtonElement;
                ctaBtn?.click();
            });

            // Should navigate immediately
            await page.waitForURL('**/collections/all**', { timeout: 10000 });
            console.log('✅ Single click navigated immediately (no discount step)');
        });
    });
});
