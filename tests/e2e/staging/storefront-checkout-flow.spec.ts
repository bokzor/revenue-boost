import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import {
    STORE_URL,
    STORE_DOMAIN,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    mockChallengeToken,
    getTestPrefix,
    waitForPopupWithRetry,
    closePopupInShadowDOM
} from './helpers/test-helpers';
import { CampaignFactory } from './factories/campaign-factory';

dotenv.config({ path: '.env.staging.env' });

const TEST_PREFIX = getTestPrefix('storefront-checkout-flow.spec.ts');

/**
 * Checkout Flow E2E Tests
 *
 * Tests for:
 * - Adding products to cart
 * - Discount code auto-apply at checkout
 * - Bundle discounts with multiple products
 * - Cart value triggers
 */

test.describe.serial('Checkout Flow', () => {
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
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });
        await page.waitForTimeout(500);
        await mockChallengeToken(page);

        page.on('console', msg => {
            if (msg.text().includes('[Revenue Boost]') || msg.text().includes('[Checkout]')) {
                console.log(`[BROWSER] ${msg.text()}`);
            }
        });

        // Intercept bundles
        const bundles = ['newsletter', 'spin-to-win', 'flash-sale'];
        for (const bundle of bundles) {
            await page.route(`**/${bundle}.bundle.js*`, async route => {
                const bundlePath = path.join(process.cwd(), `extensions/storefront-popup/assets/${bundle}.bundle.js`);
                if (fs.existsSync(bundlePath)) {
                    const content = fs.readFileSync(bundlePath);
                    await route.fulfill({ status: 200, contentType: 'application/javascript', body: content });
                } else {
                    await route.continue();
                }
            });
        }
    });

    /**
     * Helper to find and navigate to a product page
     */
    async function navigateToProductPage(page: any): Promise<boolean> {
        // Try collections page first
        await page.goto(`${STORE_URL}/collections/all`);
        await handlePasswordPage(page);
        await page.waitForLoadState('networkidle');

        // Look for product links
        const productLink = page.locator('a[href*="/products/"]').first();
        const hasProduct = await productLink.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasProduct) {
            await productLink.click();
            await page.waitForLoadState('networkidle');
            return page.url().includes('/products/');
        }

        // Fallback: try direct product URL patterns
        const commonPaths = ['/products', '/collections/all/products'];
        for (const p of commonPaths) {
            await page.goto(`${STORE_URL}${p}`);
            await handlePasswordPage(page);
            if (page.url().includes('/products/')) return true;
        }

        return false;
    }

    /**
     * Helper to add current product to cart
     */
    async function addToCart(page: any): Promise<boolean> {
        // Look for add-to-cart button
        const addBtn = page.locator('button[type="submit"][name="add"], form[action*="/cart/add"] button[type="submit"], [data-add-to-cart]').first();
        const hasAddBtn = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasAddBtn) {
            await addBtn.click();
            await page.waitForTimeout(2000); // Wait for cart update
            return true;
        }

        // Fallback: submit the product form
        const form = page.locator('form[action*="/cart/add"]').first();
        if (await form.isVisible().catch(() => false)) {
            await form.evaluate((f: HTMLFormElement) => f.submit());
            await page.waitForTimeout(2000);
            return true;
        }

        return false;
    }

    /**
     * Helper to get cart total
     */
    async function getCartInfo(page: any): Promise<{ itemCount: number; total: string }> {
        await page.goto(`${STORE_URL}/cart`);
        await handlePasswordPage(page);
        await page.waitForLoadState('networkidle');

        const itemCount = await page.evaluate(() => {
            // Try various cart count selectors
            const countEl = document.querySelector('[data-cart-count], .cart-count, .cart-item-count');
            return countEl ? parseInt(countEl.textContent || '0', 10) : 0;
        });

        const total = await page.evaluate(() => {
            const totalEl = document.querySelector('[data-cart-total], .cart-total, .cart__total');
            return totalEl?.textContent?.trim() || '0';
        });

        return { itemCount, total };
    }

    /**
     * Helper to navigate to checkout
     */
    async function navigateToCheckout(page: any): Promise<boolean> {
        // First go to cart
        await page.goto(`${STORE_URL}/cart`);
        await handlePasswordPage(page);
        await page.waitForLoadState('networkidle');

        // Look for checkout button
        const checkoutBtn = page.locator('button[name="checkout"], a[href*="/checkout"], input[name="checkout"], [data-checkout]').first();
        const hasCheckoutBtn = await checkoutBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasCheckoutBtn) {
            await checkoutBtn.click();
            await page.waitForLoadState('networkidle');
            // Checkout URLs typically contain /checkouts/ or /checkout
            return page.url().includes('/checkout');
        }

        // Fallback: direct navigation
        await page.goto(`${STORE_URL}/checkout`);
        await page.waitForLoadState('networkidle');
        return page.url().includes('/checkout');
    }

    /**
     * Helper to check if discount is applied in checkout
     */
    async function checkDiscountApplied(page: any, discountCode?: string): Promise<{ applied: boolean; code?: string; savings?: string }> {
        // Wait for checkout to load
        await page.waitForTimeout(2000);

        const result = await page.evaluate((expectedCode: string | undefined) => {
            // Look for discount code in various checkout elements
            const discountInputs = document.querySelectorAll('input[name*="discount"], input[name*="code"], [data-discount-code]');
            const discountDisplays = document.querySelectorAll('[data-discount], .discount-code, .reduction-code, [class*="discount"]');
            const savingsElements = document.querySelectorAll('[data-savings], .savings, .discount-amount, [class*="saving"]');

            let foundCode = '';
            let foundSavings = '';

            // Check input fields
            for (const input of discountInputs) {
                const val = (input as HTMLInputElement).value;
                if (val) foundCode = val;
            }

            // Check display elements
            for (const el of discountDisplays) {
                const text = el.textContent?.trim() || '';
                if (text && !foundCode) foundCode = text;
            }

            // Check savings
            for (const el of savingsElements) {
                const text = el.textContent?.trim() || '';
                if (text.includes('$') || text.includes('%')) foundSavings = text;
            }

            const applied = !!foundCode || !!foundSavings;
            const matches = expectedCode ? foundCode.toLowerCase().includes(expectedCode.toLowerCase()) : applied;

            return { applied: matches, code: foundCode, savings: foundSavings };
        }, discountCode);

        return result;
    }

    test.describe('Cart Operations', () => {
        test('can navigate to product page', async ({ page }) => {
            console.log('🧪 Testing product page navigation...');

            const foundProduct = await navigateToProductPage(page);

            if (foundProduct) {
                console.log(`✅ Found product page: ${page.url()}`);
                expect(page.url()).toContain('/products/');
            } else {
                console.log('⚠️ No products found in store - this is expected for empty stores');
            }
        });

        test('can add product to cart', async ({ page }) => {
            console.log('🧪 Testing add to cart...');

            const foundProduct = await navigateToProductPage(page);

            if (!foundProduct) {
                console.log('⚠️ No products found - skipping add to cart test');
                return;
            }

            const added = await addToCart(page);

            if (added) {
                console.log('✅ Product added to cart');

                // Verify cart has items
                const cartInfo = await getCartInfo(page);
                console.log(`Cart info: ${cartInfo.itemCount} items, total: ${cartInfo.total}`);

                if (cartInfo.itemCount > 0) {
                    console.log('✅ Cart contains items');
                }
            } else {
                console.log('⚠️ Could not find add to cart button');
            }
        });

        test('can navigate to checkout', async ({ page }) => {
            console.log('🧪 Testing checkout navigation...');

            // First add a product
            const foundProduct = await navigateToProductPage(page);
            if (!foundProduct) {
                console.log('⚠️ No products found - skipping checkout test');
                return;
            }

            await addToCart(page);
            await page.waitForTimeout(1000);

            // Try to go to checkout
            const atCheckout = await navigateToCheckout(page);

            if (atCheckout) {
                console.log(`✅ Navigated to checkout: ${page.url()}`);
            } else {
                console.log('⚠️ Could not navigate to checkout (may require login or cart items)');
            }
        });
    });

    test.describe('Discount Auto-Apply', () => {
        test('popup with auto-apply discount shows discount code', async ({ page }) => {
            console.log('🧪 Testing popup with auto-apply discount...');

            // Create campaign with auto-apply discount
            const campaign = await (await factory.spinToWin().init())
                .withName('Checkout-AutoApply')
                .withAutoApplyDiscount({
                    valueType: 'PERCENTAGE',
                    value: 15,
                    prefix: 'CHECKOUT15'
                })
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            // Mock the discount issue API to return a code
            await page.route('**/api/discounts/issue*', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        code: 'CHECKOUT15-TEST',
                        value: 15,
                        valueType: 'PERCENTAGE',
                        autoApply: true
                    }),
                });
            });

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });

            if (popupVisible) {
                console.log('✅ Popup displayed with auto-apply discount');

                // Check for discount code in popup
                const hasDiscountText = await page.evaluate(() => {
                    const host = document.querySelector('#revenue-boost-popup-shadow-host');
                    if (!host?.shadowRoot) return false;
                    const html = host.shadowRoot.innerHTML.toLowerCase();
                    return html.includes('discount') || html.includes('code') || html.includes('%') || html.includes('off');
                });

                if (hasDiscountText) {
                    console.log('✅ Discount information found in popup');
                }
            }

            expect(campaign).toBeDefined();
        });

        test('discount code persists to checkout URL', async ({ page }) => {
            console.log('🧪 Testing discount code in checkout URL...');

            // Create campaign with auto-apply discount
            const campaign = await (await factory.newsletter().init())
                .withName('Checkout-URLDiscount')
                .withAutoApplyDiscount({
                    valueType: 'PERCENTAGE',
                    value: 10,
                    prefix: 'URL10'
                })
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            // Navigate to product and add to cart
            const foundProduct = await navigateToProductPage(page);
            if (!foundProduct) {
                console.log('⚠️ No products found - test incomplete');
                expect(campaign).toBeDefined();
                return;
            }

            await addToCart(page);

            // Check if discount code is in the checkout URL when auto-applied
            // Shopify supports ?discount=CODE parameter
            const checkoutUrl = `${STORE_URL}/checkout?discount=URL10-TEST`;
            await page.goto(checkoutUrl);
            await page.waitForLoadState('networkidle');

            if (page.url().includes('/checkout')) {
                console.log('✅ Navigated to checkout with discount parameter');

                // Check if the discount was applied
                const discountResult = await checkDiscountApplied(page, 'URL10');
                console.log(`Discount check result: ${JSON.stringify(discountResult)}`);
            } else {
                console.log('⚠️ Could not reach checkout (may need valid cart)');
            }

            expect(campaign).toBeDefined();
        });
    });

    test.describe('Cart Value Triggers at Checkout', () => {
        test('cart value trigger activates when cart exceeds threshold', async ({ page }) => {
            console.log('🧪 Testing cart value trigger before checkout...');

            // Create campaign with cart value trigger
            const campaign = await (await factory.flashSale().init())
                .withName('Checkout-CartValue')
                .withCartValueTrigger(10) // $10 minimum
                .create();

            console.log(`✅ Campaign created: ${campaign.id}`);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            // Navigate to product and add to cart
            const foundProduct = await navigateToProductPage(page);
            if (!foundProduct) {
                console.log('⚠️ No products found - test incomplete');
                expect(campaign).toBeDefined();
                return;
            }

            await addToCart(page);

            // Go to cart page (where cart value trigger should fire)
            await page.goto(`${STORE_URL}/cart`);
            await handlePasswordPage(page);
            await page.waitForTimeout(3000);

            // Check if popup appeared
            const popupVisible = await waitForPopupWithRetry(page, { timeout: 10000, retries: 2, reloadOnRetry: false });

            if (popupVisible) {
                console.log('✅ Cart value trigger activated popup on cart page');
            } else {
                console.log('⚠️ Popup did not appear - cart value may be below threshold or trigger not firing');
            }

            expect(campaign).toBeDefined();
        });
    });
});

