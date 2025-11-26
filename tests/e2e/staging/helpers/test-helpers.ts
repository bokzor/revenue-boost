import type { Page } from '@playwright/test';
import "./load-staging-env";

/**
 * Shared test helpers for E2E tests
 */

export const STORE_URL = 'https://revenue-boost-staging.myshopify.com';
export const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
export const STORE_PASSWORD = process.env.STORE_PASSWORD || 'a';

/**
 * Handle Shopify password protection page
 */
export async function handlePasswordPage(page: Page) {
    const passwordInput = page.locator('input[type="password"]');

    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('🔒 Password page detected, logging in...');
        await passwordInput.fill(STORE_PASSWORD);
        await page.click('button[type="submit"]');
        // Wait for navigation to complete with a reasonable timeout
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000); // Give time for page to stabilize
    }
}

/**
 * Wait for popup to appear
 */
export async function waitForPopup(page: Page, templateType?: string, timeout: number = 10000) {
    const selector = templateType
        ? `[data-popup-type="${templateType}"], [data-splitpop="true"]`
        : '[data-splitpop="true"]';

    return page.waitForSelector(selector, { timeout });
}

/**
 * Fill email field
 */
export async function fillEmail(page: Page, email: string) {
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
    await emailInput.fill(email);
}

/**
 * Submit form
 */
export async function submitForm(page: Page) {
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Subscribe")');
    await submitButton.click();
}

/**
 * Close popup
 */
export async function closePopup(page: Page) {
    const closeButton = page.locator('[aria-label="Close"], button.close, .close-button');
    await closeButton.click();
}

/**
 * Mock challenge token request to avoid rate limits
 */
export async function mockChallengeToken(page: Page) {
    await page.route('**/api/challenge/request', async route => {
        const json = {
            success: true,
            challengeToken: 'mock-challenge-token-' + Date.now(),
            expiresAt: new Date(Date.now() + 600000).toISOString()
        };
        await route.fulfill({ json });
    });
}

/**
 * Clear Redis frequency capping state for tests
 * 
 * This prevents Redis state pollution between test runs that can cause
 * frequency capping counters to exceed limits unexpectedly.
 * 
 * @param visitorId - Optional specific visitor ID to clear
 * @param sessionId - Optional specific session ID to clear
 */
export async function clearFrequencyCappingState(visitorId?: string, sessionId?: string) {
    try {
        // Import Redis dynamically to avoid issues in environments without it
        const { getRedis } = await import('../../../../app/lib/redis.server.js');
        const redis = getRedis();

        if (!redis) {
            console.warn('[Test Helper] Redis not available, skipping frequency cap cleanup');
            return;
        }

        const patterns: string[] = [];

        // Build patterns to match frequency cap keys
        if (visitorId) {
            patterns.push(`frequency_cap:*:${visitorId}:*`);
            patterns.push(`frequency_cap:${visitorId}:*`);
        }
        if (sessionId) {
            patterns.push(`frequency_cap:*:${sessionId}:*`);
            patterns.push(`frequency_cap:${sessionId}:*`);
        }
        if (!visitorId && !sessionId) {
            // Clear all test-related frequency caps
            patterns.push(`frequency_cap:*test*`);
            patterns.push(`frequency_cap:*e2e*`);
        }

        let totalCleared = 0;
        for (const pattern of patterns) {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                totalCleared += keys.length;
                console.log(`[Test Helper] Cleared ${keys.length} frequency cap keys matching: ${pattern}`);
            }
        }

        if (totalCleared > 0) {
            console.log(`[Test Helper] ✅ Cleared ${totalCleared} total frequency cap keys`);
        } else {
            console.log('[Test Helper] No frequency cap keys found to clear');
        }
    } catch (error) {
        console.warn('[Test Helper] Failed to clear frequency capping state:', error);
        // Don't throw - failing to clear shouldn't break tests
    }
}

/**
 * Generate unique visitor and session IDs for test isolation
 *
 * @returns Object with unique visitorId and sessionId
 */
export function generateUniqueTestIds() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);

    return {
        visitorId: `e2e-visitor-${timestamp}-${random}`,
        sessionId: `e2e-session-${timestamp}-${random}`
    };
}

/**
 * Wait for popup to render and return true when visible
 */
export async function waitForPopupRendered(page: Page, timeout: number = 15000): Promise<boolean> {
    try {
        // Wait for the popup container to be visible
        await page.locator('#revenue-boost-popup-shadow-host')
            .waitFor({ state: 'visible', timeout });

        // Give it time to fully render
        await page.waitForTimeout(1500);

        // Verify the shadow root has content
        const hasContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            return host.shadowRoot.innerHTML.length > 100;
        });

        return hasContent;
    } catch {
        return false;
    }
}

/**
 * Check if a popup is visible on the page
 * Uses the shadow host container which is the standard way popups are rendered
 */
export async function isPopupVisible(page: Page): Promise<boolean> {
    return page.locator('#revenue-boost-popup-shadow-host').isVisible().catch(() => false);
}

/**
 * Wait for any popup to be visible
 */
export async function waitForAnyPopup(page: Page, timeout: number = 10000): Promise<void> {
    await page.locator('#revenue-boost-popup-shadow-host').waitFor({
        state: 'visible',
        timeout
    });
}

/**
 * Wait for popup to be hidden/closed
 */
export async function waitForPopupHidden(page: Page, timeout: number = 5000): Promise<void> {
    await page.locator('#revenue-boost-popup-shadow-host').waitFor({
        state: 'hidden',
        timeout
    });
}

/**
 * Get the shadow root of the popup container
 */
export async function getShadowRoot(page: Page): Promise<any> {
    return page.evaluateHandle(() => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        return host?.shadowRoot;
    });
}

/**
 * Interact with elements inside shadow DOM
 */
export async function fillEmailInShadowDOM(page: Page, email: string): Promise<boolean> {
    return page.evaluate((emailValue) => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return false;

        const emailInput = shadow.querySelector('input[type="email"]') as HTMLInputElement;
        if (!emailInput) return false;

        emailInput.value = emailValue;
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }, email);
}

/**
 * Submit form inside shadow DOM
 */
export async function submitFormInShadowDOM(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return false;

        // Try various submit button selectors
        const submitBtn = shadow.querySelector(
            'button[type="submit"], ' +
            'button:not([type="button"]):not([aria-label*="close" i]):not([class*="close" i])'
        ) as HTMLButtonElement;

        if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
            return true;
        }

        // Try form submission
        const form = shadow.querySelector('form');
        if (form) {
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            return true;
        }

        return false;
    });
}

/**
 * Click spin button in shadow DOM for Spin-to-Win
 */
export async function clickSpinButton(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return false;

        const spinBtn = shadow.querySelector(
            'button[class*="spin" i], ' +
            'button:has-text("Spin"), ' +
            '[class*="spin-button" i]'
        ) as HTMLButtonElement;

        if (spinBtn && !spinBtn.disabled) {
            spinBtn.click();
            return true;
        }
        return false;
    });
}

/**
 * Scratch the scratch card in shadow DOM
 */
export async function scratchCard(page: Page): Promise<void> {
    const canvas = await page.evaluateHandle(() => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return null;
        return shadow.querySelector('canvas');
    });

    if (canvas) {
        // Simulate scratching by drawing lines across the canvas
        const box = await page.evaluate((el: any) => {
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        }, canvas);

        if (box) {
            // Scratch in a zig-zag pattern
            for (let i = 0; i < 5; i++) {
                await page.mouse.move(box.x + 20, box.y + 20 + i * 20);
                await page.mouse.down();
                await page.mouse.move(box.x + box.width - 20, box.y + 20 + i * 20);
                await page.mouse.up();
            }
        }
    }
}

/**
 * Get displayed discount code from shadow DOM
 */
export async function getDiscountCodeFromShadowDOM(page: Page): Promise<string | null> {
    return page.evaluate(() => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return null;

        // Look for discount code displays
        const codeSelectors = [
            '[class*="discount-code" i]',
            '[class*="discountCode" i]',
            '[class*="coupon-code" i]',
            '[data-discount-code]',
            'input[readonly][value]',
            '[class*="code-display" i]'
        ];

        for (const selector of codeSelectors) {
            const el = shadow.querySelector(selector) as HTMLElement;
            if (el) {
                // Try getting from data attribute, value, or text content
                const code = el.getAttribute('data-discount-code') ||
                             (el as HTMLInputElement).value ||
                             el.textContent?.trim();
                if (code && code.length > 0 && !code.includes(' ')) {
                    return code;
                }
            }
        }

        // Look for text matching discount code pattern (uppercase letters/numbers)
        const allText = shadow.innerHTML;
        const codeMatch = allText.match(/\b[A-Z0-9]{6,20}\b/);
        return codeMatch ? codeMatch[0] : null;
    });
}

/**
 * Check if success message is displayed in shadow DOM
 */
export async function hasSuccessMessage(page: Page, messagePattern?: RegExp): Promise<boolean> {
    return page.evaluate((pattern) => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return false;

        const successSelectors = [
            '[class*="success" i]',
            '[class*="thank" i]',
            '[class*="congratulation" i]',
            '[role="status"]'
        ];

        for (const selector of successSelectors) {
            const el = shadow.querySelector(selector);
            if (el) {
                if (pattern) {
                    const regex = new RegExp(pattern);
                    return regex.test(el.textContent || '');
                }
                return true;
            }
        }

        // Check for generic success indicators
        const html = shadow.innerHTML.toLowerCase();
        return html.includes('thank') || html.includes('success') || html.includes('congratulation');
    }, messagePattern?.source);
}

/**
 * Add a product to cart on Shopify storefront
 */
export async function addProductToCart(page: Page, productUrl?: string): Promise<boolean> {
    try {
        // Navigate to a product page if URL provided
        if (productUrl) {
            await page.goto(productUrl);
            await handlePasswordPage(page);
        } else {
            // Find and click on first product
            const productLink = page.locator('a[href*="/products/"]').first();
            if (await productLink.isVisible({ timeout: 5000 }).catch(() => false)) {
                await productLink.click();
                await page.waitForLoadState('networkidle');
            } else {
                // Navigate to collections page first
                await page.goto(`${STORE_URL}/collections/all`);
                await handlePasswordPage(page);
                await page.locator('a[href*="/products/"]').first().click();
                await page.waitForLoadState('networkidle');
            }
        }

        // Click Add to Cart button
        const addToCartBtn = page.locator(
            'button[name="add"], ' +
            'button:has-text("Add to cart"), ' +
            'button:has-text("Add to Cart"), ' +
            '[data-add-to-cart], ' +
            'form[action*="/cart/add"] button[type="submit"]'
        ).first();

        await addToCartBtn.waitFor({ state: 'visible', timeout: 5000 });
        await addToCartBtn.click();

        // Wait for cart to update
        await page.waitForTimeout(2000);

        return true;
    } catch (error) {
        console.error('Failed to add product to cart:', error);
        return false;
    }
}

/**
 * Get current cart total
 */
export async function getCartTotal(page: Page): Promise<number> {
    try {
        // Try to get cart total from the page
        const cartTotal = await page.evaluate(() => {
            // Check for Shopify cart object
            const shopifyCart = (window as any).Shopify?.cart;
            if (shopifyCart?.total_price) {
                return shopifyCart.total_price / 100; // Convert cents to dollars
            }

            // Try to find cart total in DOM
            const totalSelectors = [
                '.cart-total',
                '.cart__subtotal',
                '[data-cart-total]',
                '.totals__subtotal-value'
            ];

            for (const selector of totalSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                    const text = el.textContent || '';
                    const match = text.match(/[\d,.]+/);
                    if (match) {
                        return parseFloat(match[0].replace(',', ''));
                    }
                }
            }

            return 0;
        });

        return cartTotal;
    } catch {
        return 0;
    }
}

/**
 * Check if discount is applied to cart
 */
export async function isDiscountAppliedToCart(page: Page, discountCode?: string): Promise<boolean> {
    try {
        // Navigate to cart page
        await page.goto(`${STORE_URL}/cart`);
        await handlePasswordPage(page);

        // Look for applied discount
        return page.evaluate((code) => {
            const discountSelectors = [
                '.cart-discount',
                '[data-discount-code]',
                '.applied-discount',
                '.discount-code-applied'
            ];

            for (const selector of discountSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                    if (code) {
                        return el.textContent?.toUpperCase().includes(code.toUpperCase()) || false;
                    }
                    return true;
                }
            }

            // Check URL for discount parameter
            const url = window.location.href;
            if (url.includes('discount=') || url.includes('code=')) {
                if (code) {
                    return url.toUpperCase().includes(code.toUpperCase());
                }
                return true;
            }

            return false;
        }, discountCode);
    } catch {
        return false;
    }
}

/**
 * Mock lead submission API to return specific discount code
 */
export async function mockLeadSubmission(page: Page, discountCode: string): Promise<void> {
    await page.route('**/apps/revenue-boost/api/leads/submit*', async (route) => {
        console.log(`[Mock] Intercepting lead submission, returning code: ${discountCode}`);
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                leadId: `mock-lead-${Date.now()}`,
                discountCode,
                behavior: 'SHOW_CODE_AND_AUTO_APPLY',
                message: 'Thanks for subscribing!'
            })
        });
    });
}

/**
 * Mock discount issue API
 */
export async function mockDiscountIssue(page: Page, discountCode: string): Promise<void> {
    await page.route('**/apps/revenue-boost/api/discounts/issue*', async (route) => {
        console.log(`[Mock] Intercepting discount issue, returning code: ${discountCode}`);
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                code: discountCode,
                discountId: `mock-discount-${Date.now()}`
            })
        });
    });
}

/**
 * Wait for and capture API response
 */
export async function captureLeadSubmissionResponse(page: Page): Promise<any> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for lead submission'));
        }, 30000);

        page.on('response', async (response) => {
            if (response.url().includes('/api/leads/submit')) {
                clearTimeout(timeout);
                try {
                    const json = await response.json();
                    resolve(json);
                } catch {
                    resolve({ success: false });
                }
            }
        });
    });
}
