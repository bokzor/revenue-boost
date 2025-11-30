import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import {
    STORE_URL,
    STORE_DOMAIN,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    mockChallengeToken,
    getTestPrefix,
    waitForPopupWithRetry,
    cleanupAllE2ECampaigns,
    MAX_TEST_PRIORITY
} from './helpers/test-helpers';
import { CampaignFactory } from './factories/campaign-factory';

dotenv.config({ path: '.env.staging.env' });

const TEST_PREFIX = getTestPrefix('storefront-cart-triggers.spec.ts');

/**
 * Cart-Based & Product Triggers E2E Tests
 *
 * Tests trigger configurations:
 * - Add to cart trigger (fires when product is added to cart)
 * - Cart value threshold trigger (min/max)
 * - Product view trigger (fires on product page)
 * - Idle timer trigger (fires after inactivity)
 * - Custom event trigger (fires on custom JS event)
 *
 * NOTE: These tests run against deployed extension code (no bundle mocking)
 * and real API endpoints (no API mocking).
 */

test.describe.serial('Cart & Product Triggers', () => {
    let prisma: PrismaClient;
    let factory: CampaignFactory;
    let store: { id: string };

    test.beforeAll(async () => {
        prisma = new PrismaClient();

        const foundStore = await prisma.store.findUnique({
            where: { shopifyDomain: STORE_DOMAIN }
        });

        if (!foundStore) {
            throw new Error(`Store not found: ${STORE_DOMAIN}`);
        }

        store = foundStore;
        factory = new CampaignFactory(prisma, store.id, TEST_PREFIX);
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
        // Clean up ALL E2E campaigns to avoid priority conflicts
        await cleanupAllE2ECampaigns(prisma);

        // Wait for cache invalidation
        await page.waitForTimeout(500);

        await mockChallengeToken(page);

        // Log browser console messages for debugging
        page.on('console', msg => {
            if (msg.text().includes('[Revenue Boost]')) {
                console.log(`[BROWSER] ${msg.text()}`);
            }
        });

        // No bundle mocking - tests use deployed extension code
    });

    test.describe('Add to Cart Trigger', () => {
        test('popup shows when add-to-cart event is dispatched', async ({ page }) => {
            console.log('🧪 Testing add-to-cart trigger...');

            // Create campaign with add-to-cart trigger
            const campaign = await (await factory.newsletter().init())
                .withName('AddToCart-Test')
                .withAddToCartTrigger()
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);

            // Wait for API propagation
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            // Navigate to storefront
            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            // Wait for Revenue Boost to initialize
            await page.waitForTimeout(2000);

            // Popup should NOT be visible yet (waiting for add-to-cart event)
            const popupHostEarly = page.locator('#revenue-boost-popup-shadow-host');
            const visibleEarly = await popupHostEarly.isVisible().catch(() => false);
            expect(visibleEarly).toBe(false);
            console.log('✅ Popup correctly hidden before add-to-cart event');

            // Simulate add-to-cart event (this is how Shopify themes typically dispatch it)
            await page.evaluate(() => {
                // Dispatch the standard Shopify add-to-cart event
                const event = new CustomEvent('cart:item-added', {
                    detail: {
                        productId: 'gid://shopify/Product/123',
                        variantId: 'gid://shopify/ProductVariant/456',
                        quantity: 1
                    }
                });
                document.dispatchEvent(event);
                console.log('[Test] Dispatched cart:item-added event');

                // Also try the alternative event format some themes use
                window.dispatchEvent(new CustomEvent('ajaxProduct:added'));
            });

            // Wait for popup to appear
            await page.waitForTimeout(2000);

            // Popup MUST appear after add-to-cart event - hard assertion
            const popupVisible = await waitForPopupWithRetry(page, { timeout: 5000, retries: 2, reloadOnRetry: false });
            expect(popupVisible).toBe(true);
            console.log('✅ Popup shown after add-to-cart event');
        });

        test('add-to-cart trigger respects delay config', async ({ page }) => {
            console.log('🧪 Testing add-to-cart trigger with delay...');

            const campaign = await (await factory.newsletter().init())
                .withName('AddToCart-Delay')
                .withAddToCartTriggerFiltered({
                    productIds: [],
                    delaySeconds: 2,
                    immediate: false
                })
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);
            await page.waitForTimeout(2000);

            // Dispatch add-to-cart event
            await page.evaluate(() => {
                document.dispatchEvent(new CustomEvent('cart:item-added', {
                    detail: { productId: 'test', quantity: 1 }
                }));
            });

            // Check popup is NOT visible immediately (delay is 2s)
            await page.waitForTimeout(500);
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            const visibleEarly = await popupHost.isVisible().catch(() => false);
            expect(visibleEarly).toBe(false);
            console.log('✅ Popup correctly delayed (not visible at 0.5s)');

            // Wait for delay to pass + buffer
            await page.waitForTimeout(2500);

            // Popup MUST appear after delay - hard assertion
            const popupVisible = await waitForPopupWithRetry(page, { timeout: 5000, retries: 2, reloadOnRetry: false });
            expect(popupVisible).toBe(true);
            console.log('✅ Popup appeared after configured delay');
        });
    });

    test.describe('Cart Value Trigger', () => {
        // Skip: Staging store is running OLD SDK version without polling implementation.
        // The current code has polling logic but hasn't been deployed to staging.
        // After deploying the extension (`shopify app deploy`), re-enable this test.
        // See docs/E2E_REMAINING_ISSUES.md for details.
        test.skip('popup shows when cart value exceeds min threshold', async ({ page }) => {
            console.log('🧪 Testing cart value trigger behavior...');

            const campaign = await (await factory.newsletter().init())
                .withName('CartValue-Behavior')
                .withCartValueTrigger(1)
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(`${STORE_URL}/collections/all`);
            await handlePasswordPage(page);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            const popupHostEarly = page.locator('#revenue-boost-popup-shadow-host');
            const visibleEarly = await popupHostEarly.isVisible().catch(() => false);
            expect(visibleEarly).toBe(false);
            console.log('✅ Popup correctly hidden before cart exceeds threshold');

            const productLinks = page.locator('a[href*="/products/"]:visible');
            await productLinks.first().click({ timeout: 10000 });
            await page.waitForLoadState('domcontentloaded');
            console.log('📦 Navigated to product page');

            await page.waitForTimeout(2000);

            const addToCartButton = page.locator([
                'button[name="add"]',
                'button:has-text("Add to cart")',
                'button:has-text("Add to Cart")',
                '[data-add-to-cart]',
                'form[action*="/cart/add"] button[type="submit"]',
                '.product-form__submit'
            ].join(', ')).first();

            await expect(addToCartButton).toBeVisible({ timeout: 10000 });
            await addToCartButton.click();
            console.log('🛒 Clicked Add to Cart button');

            await page.waitForTimeout(5000);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 10000, retries: 2, reloadOnRetry: false });
            expect(popupVisible).toBe(true);
            console.log('✅ Popup shown after cart value exceeded threshold');
        });
    });

    test.describe('Product View Trigger', () => {
        test('popup shows on product page after time delay', async ({ page }) => {
            console.log('🧪 Testing product view trigger on product page...');

            // Create campaign with product view trigger (any product, 2 second delay)
            const campaign = await (await factory.newsletter().init())
                .withName('ProductView-Behavior')
                .withProductViewTrigger({
                    timeOnPageSeconds: 2,
                    requireScroll: false
                })
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);

            // Wait for API propagation
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            // Navigate to collections page to find a product
            await page.goto(`${STORE_URL}/collections/all`);
            await handlePasswordPage(page);
            await page.waitForLoadState('networkidle');

            // Find visible product links (may need to scroll)
            const productLinks = page.locator('a[href*="/products/"]:visible');
            const count = await productLinks.count();
            console.log(`Found ${count} visible product links`);

            if (count === 0) {
                // Try scrolling to make products visible
                await page.evaluate(() => window.scrollTo(0, 500));
                await page.waitForTimeout(500);
            }

            // Click the first visible product
            await productLinks.first().click({ timeout: 10000 });
            await page.waitForLoadState('networkidle');

            // Verify we're on a product page
            expect(page.url()).toContain('/products/');
            console.log(`✅ On product page: ${page.url()}`);

            // Wait for the time delay (2 seconds) + buffer
            await page.waitForTimeout(3000);

            // Popup MUST appear on product page - hard assertion
            const popupVisible = await waitForPopupWithRetry(page, { timeout: 5000, retries: 2, reloadOnRetry: false });
            expect(popupVisible).toBe(true);
            console.log('✅ Popup shown on product page after time delay');
        });
    });

    test.describe('Idle Timer Trigger', () => {
        test('popup shows after user inactivity', async ({ page }) => {
            console.log('🧪 Testing idle timer trigger behavior...');

            // Create campaign with short idle timer (3 seconds for testing)
            const campaign = await (await factory.newsletter().init())
                .withName('IdleTimer-Behavior')
                .withIdleTimerTrigger(3)
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);

            // Wait for API propagation
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            // Navigate to storefront
            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            // Wait for Revenue Boost to initialize
            await page.waitForTimeout(1000);

            // Do some activity first
            await page.mouse.move(100, 100);
            await page.waitForTimeout(500);

            // Popup should NOT be visible yet
            const popupHostEarly = page.locator('#revenue-boost-popup-shadow-host');
            const visibleEarly = await popupHostEarly.isVisible().catch(() => false);
            expect(visibleEarly).toBe(false);
            console.log('✅ Popup correctly hidden during activity');

            // Now stay idle for the trigger duration + buffer
            console.log('Staying idle for 5 seconds...');
            await page.waitForTimeout(5000);

            // Popup MUST appear after idle time - hard assertion
            const popupVisible = await waitForPopupWithRetry(page, { timeout: 5000, retries: 2, reloadOnRetry: false });
            expect(popupVisible).toBe(true);
            console.log('✅ Popup shown after user was idle');
        });
    });

    test.describe('Custom Event Trigger', () => {
        test('popup shows when custom event is dispatched', async ({ page }) => {
            console.log('🧪 Testing custom event trigger behavior...');

            const eventName = 'test-popup-trigger';

            // Create campaign with custom event trigger
            const campaign = await (await factory.newsletter().init())
                .withName('CustomEvent-Behavior')
                .withCustomEventTrigger(eventName)
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);

            // Wait for API propagation
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            // Navigate to storefront
            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            // Wait for Revenue Boost to initialize
            await page.waitForTimeout(2000);

            // Popup should NOT be visible yet
            const popupHostEarly = page.locator('#revenue-boost-popup-shadow-host');
            const visibleEarly = await popupHostEarly.isVisible().catch(() => false);
            expect(visibleEarly).toBe(false);
            console.log('✅ Popup correctly hidden before custom event');

            // Dispatch the custom event
            await page.evaluate((evtName) => {
                const event = new CustomEvent(evtName, {
                    bubbles: true,
                    detail: { source: 'e2e-test' }
                });
                document.dispatchEvent(event);
                console.log(`[Test] Dispatched custom event: ${evtName}`);
            }, eventName);

            // Wait for popup to appear
            await page.waitForTimeout(2000);

            // Popup MUST appear after custom event - hard assertion
            const popupVisible = await waitForPopupWithRetry(page, { timeout: 5000, retries: 2, reloadOnRetry: false });
            expect(popupVisible).toBe(true);
            console.log('✅ Popup shown after custom event dispatched');
        });
    });
});
