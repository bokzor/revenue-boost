import type { Page } from '@playwright/test';
import "./load-staging-env";

/**
 * Shared test helpers for E2E tests
 */

export const STORE_URL = 'https://revenue-boost-staging.myshopify.com';
export const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
export const STORE_PASSWORD = process.env.STORE_PASSWORD || 'a';

/**
 * Time to wait for API to propagate new campaigns (in milliseconds)
 * Cloud Run has caching that requires time to reflect database changes.
 * Increased to 5 seconds for more reliable staging tests.
 */
export const API_PROPAGATION_DELAY_MS = 5000;

/**
 * Generate a unique test session ID to avoid conflicts between parallel tests.
 * This ID can be used to clear browser storage and ensure fresh sessions.
 */
export function generateTestSessionId(): string {
    return `e2e_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Clear browser storage to ensure a fresh session.
 * This prevents campaigns from being cached in the browser across tests.
 */
export async function clearBrowserSession(page: Page): Promise<void> {
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
}

/**
 * Navigate to storefront with a fresh session.
 * Clears storage, navigates to the URL, and handles password page.
 */
export async function navigateToStorefrontFresh(page: Page, url: string = STORE_URL): Promise<void> {
    // Clear any existing session data first
    try {
        await page.goto(url);
        await clearBrowserSession(page);
    } catch {
        // First navigation might fail, that's ok
    }

    // Navigate fresh
    await page.goto(url);
    await handlePasswordPage(page);

    // Clear storage again after password page
    await clearBrowserSession(page);
}

/**
 * Generate a unique prefix for test campaigns based on the test file name.
 * This prevents race conditions when tests run in parallel by ensuring
 * each test file only cleans up its own campaigns.
 *
 * @param testFileName - The test file name (e.g., 'storefront-newsletter.spec.ts')
 * @returns A unique prefix like 'E2E-newsletter-'
 */
export function getTestPrefix(testFileName: string): string {
    // Extract the template/feature name from the test file name
    // e.g., 'storefront-newsletter.spec.ts' -> 'newsletter'
    // e.g., 'storefront-flash-sale.spec.ts' -> 'flash-sale'
    const match = testFileName.match(/storefront-([a-z-]+)\.spec\.ts$/i);
    const feature = match ? match[1] : 'generic';
    return `E2E-${feature}-`;
}

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

/**
 * Check/uncheck GDPR checkbox inside shadow DOM
 */
export async function checkGdprCheckbox(page: Page, check: boolean = true): Promise<boolean> {
    return page.evaluate((shouldCheck) => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return false;

        const checkbox = shadow.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (!checkbox) return false;

        if (shouldCheck && !checkbox.checked) {
            checkbox.click();
        } else if (!shouldCheck && checkbox.checked) {
            checkbox.click();
        }
        return true;
    }, check);
}

/**
 * Get text content from shadow DOM by selector pattern
 */
export async function getTextFromShadowDOM(page: Page, textPattern: RegExp | string): Promise<string | null> {
    return page.evaluate((pattern) => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return null;

        const html = shadow.innerHTML;
        const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : new RegExp(pattern);
        const match = html.match(regex);
        return match ? match[0] : null;
    }, typeof textPattern === 'string' ? textPattern : textPattern.source);
}

/**
 * Check if specific text exists in shadow DOM
 */
export async function hasTextInShadowDOM(page: Page, text: string): Promise<boolean> {
    return page.evaluate((searchText) => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return false;

        const html = shadow.innerHTML.toLowerCase();
        return html.includes(searchText.toLowerCase());
    }, text);
}

/**
 * Click a button in shadow DOM by text
 */
export async function clickButtonInShadowDOM(page: Page, buttonText: string): Promise<boolean> {
    return page.evaluate((text) => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return false;

        // Find all buttons
        const buttons = shadow.querySelectorAll('button');
        for (const btn of buttons) {
            if (btn.textContent?.toLowerCase().includes(text.toLowerCase())) {
                btn.click();
                return true;
            }
        }
        return false;
    }, buttonText);
}

/**
 * Close popup using close button in shadow DOM
 */
export async function closePopupInShadowDOM(page: Page): Promise<boolean> {
    return page.evaluate(() => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return false;

        // Try various close button selectors
        const closeSelectors = [
            'button[aria-label*="close" i]',
            'button[aria-label*="Close" i]',
            'button[class*="close" i]',
            'button:has(svg)',
            '[role="button"][aria-label*="close" i]'
        ];

        for (const selector of closeSelectors) {
            const closeBtn = shadow.querySelector(selector) as HTMLButtonElement;
            if (closeBtn) {
                closeBtn.click();
                return true;
            }
        }
        return false;
    });
}

/**
 * Get all form inputs from shadow DOM
 */
export async function getFormInputsFromShadowDOM(page: Page): Promise<{email: boolean, checkbox: boolean, button: boolean}> {
    return page.evaluate(() => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;
        if (!shadow) return { email: false, checkbox: false, button: false };

        return {
            email: !!shadow.querySelector('input[type="email"]'),
            checkbox: !!shadow.querySelector('input[type="checkbox"]'),
            button: !!shadow.querySelector('button[type="submit"], button:not([type="button"])')
        };
    });
}

/**
 * Perform a complete newsletter signup flow
 */
export async function performNewsletterSignup(
    page: Page,
    email: string,
    options: { checkGdpr?: boolean } = {}
): Promise<{ success: boolean; error?: string }> {
    try {
        // Fill email
        const emailFilled = await fillEmailInShadowDOM(page, email);
        if (!emailFilled) {
            return { success: false, error: 'Could not fill email' };
        }

        // Check GDPR if needed
        if (options.checkGdpr) {
            await checkGdprCheckbox(page, true);
        }

        // Submit form
        const submitted = await submitFormInShadowDOM(page);
        if (!submitted) {
            return { success: false, error: 'Could not submit form' };
        }

        // Wait for response
        await page.waitForTimeout(2000);

        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

/**
 * Wait for campaign to be available in API
 * This helps with race conditions where campaign is created but not yet visible
 */
export async function waitForCampaignInAPI(
    page: Page,
    campaignId: string,
    timeout: number = 10000
): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        try {
            const response = await page.evaluate(async (id) => {
                const res = await fetch(`/apps/revenue-boost/api/campaigns/${id}`);
                return res.ok;
            }, campaignId);

            if (response) {
                return true;
            }
        } catch {
            // Ignore errors and retry
        }

        await page.waitForTimeout(500);
    }

    return false;
}

/**
 * Robust test setup - ensures clean state before each test
 */
export async function setupTestEnvironment(
    page: Page,
    prisma: any,
    options: {
        cleanupPrefix?: string;
        waitTime?: number;
    } = {}
): Promise<void> {
    const { cleanupPrefix = 'E2E-Test-', waitTime = 1000 } = options;

    // 1. Clean up old test campaigns
    const deleted = await prisma.campaign.deleteMany({
        where: {
            name: { startsWith: cleanupPrefix }
        }
    });

    if (deleted.count > 0) {
        console.log(`[Test Setup] Cleaned up ${deleted.count} old test campaigns`);
    }

    // 2. Wait for cleanup to propagate
    await page.waitForTimeout(waitTime);
    console.log('[Test Setup] Waited for cleanup to propagate');

    // 3. Mock challenge token
    await mockChallengeToken(page);
}

/**
 * Generate a unique high priority for test campaigns
 * Uses timestamp to ensure uniqueness across parallel tests
 */
export function generateTestPriority(base: number = 9000): number {
    return base + Math.floor(Math.random() * 1000);
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryOperation<T>(
    operation: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
        onRetry?: (attempt: number, error: Error) => void;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 500,
        maxDelay = 5000,
        onRetry
    } = options;

    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxRetries) {
                onRetry?.(attempt, lastError);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(delay * 2, maxDelay);
            }
        }
    }

    throw lastError;
}

/**
 * Wait for popup with retry - handles timing issues
 */
export async function waitForPopupWithRetry(
    page: Page,
    options: {
        timeout?: number;
        retries?: number;
        reloadOnRetry?: boolean;
    } = {}
): Promise<boolean> {
    const { timeout = 10000, retries = 2, reloadOnRetry = true } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const popup = page.locator('#revenue-boost-popup-shadow-host');
            await popup.waitFor({ state: 'visible', timeout });
            return true;
        } catch {
            if (attempt < retries && reloadOnRetry) {
                console.log(`[Retry ${attempt}] Popup not visible, reloading page...`);
                await page.reload();
                await handlePasswordPage(page);
                await page.waitForTimeout(2000);
            }
        }
    }

    return false;
}

/**
 * Wait for API to reflect a newly created campaign.
 * This is necessary because Cloud Run may cache the campaign list
 * and take a few seconds to reflect new campaigns.
 *
 * @param page - Playwright Page instance
 * @param campaignId - ID of the campaign to wait for
 * @param maxWaitMs - Maximum time to wait (default 5000ms)
 */
export async function waitForCampaignInApi(
    page: Page,
    campaignId: string,
    maxWaitMs: number = 5000
): Promise<boolean> {
    const startTime = Date.now();
    const apiUrl = `/apps/revenue-boost/api/campaigns/active?shop=${STORE_DOMAIN}`;

    while (Date.now() - startTime < maxWaitMs) {
        try {
            const response = await page.request.get(`${STORE_URL}${apiUrl}`);
            if (response.ok()) {
                const data = await response.json();
                if (data.campaigns?.some((c: { id: string }) => c.id === campaignId)) {
                    console.log(`✅ Campaign ${campaignId} found in API after ${Date.now() - startTime}ms`);
                    return true;
                }
            }
        } catch {
            // Ignore errors during polling
        }
        await page.waitForTimeout(500);
    }

    console.log(`⚠️ Campaign ${campaignId} not found in API after ${maxWaitMs}ms`);
    return false;
}

// =============================================================================
// TEMPLATE-SPECIFIC VERIFICATION HELPERS
// These helpers verify actual rendered content, not just presence
// =============================================================================

/**
 * Verify newsletter popup content is rendered correctly
 */
export async function verifyNewsletterContent(page: Page, expected: {
    headline?: string;
    emailPlaceholder?: string;
    buttonText?: string;
    hasGdprCheckbox?: boolean;
    hasEmailInput?: boolean;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        // Check headline
        if (exp.headline) {
            const hasHeadline = shadow.innerHTML.toLowerCase().includes(exp.headline.toLowerCase());
            if (!hasHeadline) {
                errors.push(`Headline "${exp.headline}" not found`);
            }
        }

        // Check email input
        const emailInput = shadow.querySelector('input[type="email"]') as HTMLInputElement;
        if (exp.hasEmailInput !== undefined) {
            if (exp.hasEmailInput && !emailInput) {
                errors.push('Email input expected but not found');
            } else if (!exp.hasEmailInput && emailInput) {
                errors.push('Email input found but not expected');
            }
        }

        if (emailInput && exp.emailPlaceholder) {
            const placeholder = emailInput.placeholder?.toLowerCase() || '';
            if (!placeholder.includes(exp.emailPlaceholder.toLowerCase())) {
                errors.push(`Email placeholder "${exp.emailPlaceholder}" not found, got "${emailInput.placeholder}"`);
            }
        }

        // Check button text
        if (exp.buttonText) {
            const buttons = shadow.querySelectorAll('button');
            const hasButton = Array.from(buttons).some(btn =>
                btn.textContent?.toLowerCase().includes(exp.buttonText!.toLowerCase())
            );
            if (!hasButton) {
                errors.push(`Button with text "${exp.buttonText}" not found`);
            }
        }

        // Check GDPR checkbox
        if (exp.hasGdprCheckbox !== undefined) {
            const checkbox = shadow.querySelector('input[type="checkbox"]');
            if (exp.hasGdprCheckbox && !checkbox) {
                errors.push('GDPR checkbox expected but not found');
            } else if (!exp.hasGdprCheckbox && checkbox) {
                errors.push('GDPR checkbox found but not expected');
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Verify spin-to-win popup content is rendered correctly
 */
export async function verifySpinToWinContent(page: Page, expected: {
    headline?: string;
    segments?: string[];
    hasSpinButton?: boolean;
    hasEmailInput?: boolean;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        const html = shadow.innerHTML.toLowerCase();

        // Check headline
        if (exp.headline) {
            if (!html.includes(exp.headline.toLowerCase())) {
                errors.push(`Headline "${exp.headline}" not found`);
            }
        }

        // Check wheel segments
        if (exp.segments && exp.segments.length > 0) {
            for (const segment of exp.segments) {
                if (!html.includes(segment.toLowerCase())) {
                    errors.push(`Wheel segment "${segment}" not found`);
                }
            }
        }

        // Check for spin button
        if (exp.hasSpinButton !== false) {
            const hasSpinBtn = html.includes('spin') ||
                shadow.querySelector('button[class*="spin" i], [data-spin-button]');
            if (!hasSpinBtn) {
                errors.push('Spin button not found');
            }
        }

        // Check email input
        if (exp.hasEmailInput) {
            const emailInput = shadow.querySelector('input[type="email"]');
            if (!emailInput) {
                errors.push('Email input expected but not found');
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Verify flash sale popup content is rendered correctly
 */
export async function verifyFlashSaleContent(page: Page, expected: {
    headline?: string;
    urgencyMessage?: string;
    discountPercentage?: number;
    hasCountdown?: boolean;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        const html = shadow.innerHTML.toLowerCase();

        // Check headline
        if (exp.headline) {
            if (!html.includes(exp.headline.toLowerCase())) {
                errors.push(`Headline "${exp.headline}" not found`);
            }
        }

        // Check urgency message
        if (exp.urgencyMessage) {
            if (!html.includes(exp.urgencyMessage.toLowerCase())) {
                errors.push(`Urgency message "${exp.urgencyMessage}" not found`);
            }
        }

        // Check discount percentage
        if (exp.discountPercentage) {
            if (!html.includes(`${exp.discountPercentage}%`)) {
                errors.push(`Discount "${exp.discountPercentage}%" not found`);
            }
        }

        // Check countdown
        if (exp.hasCountdown) {
            // Look for countdown indicators (digits, colons, timer elements)
            const hasTimer = shadow.querySelector('[class*="countdown" i], [class*="timer" i], [data-countdown]') ||
                html.match(/\d{1,2}:\d{2}/);
            if (!hasTimer) {
                errors.push('Countdown timer not found');
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Verify scratch card popup content is rendered correctly
 */
export async function verifyScratchCardContent(page: Page, expected: {
    headline?: string;
    hasCanvas?: boolean;
    hasEmailInput?: boolean;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        const html = shadow.innerHTML.toLowerCase();

        // Check headline
        if (exp.headline) {
            if (!html.includes(exp.headline.toLowerCase())) {
                errors.push(`Headline "${exp.headline}" not found`);
            }
        }

        // Check for scratch canvas
        if (exp.hasCanvas !== false) {
            const canvas = shadow.querySelector('canvas');
            if (!canvas) {
                errors.push('Scratch canvas not found');
            }
        }

        // Check email input
        if (exp.hasEmailInput) {
            const emailInput = shadow.querySelector('input[type="email"]');
            if (!emailInput) {
                errors.push('Email input expected but not found');
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Verify exit intent popup content is rendered correctly
 */
export async function verifyExitIntentContent(page: Page, expected: {
    headline?: string;
    hasEmailInput?: boolean;
    hasGdprCheckbox?: boolean;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        const html = shadow.innerHTML.toLowerCase();

        // Check headline
        if (exp.headline) {
            if (!html.includes(exp.headline.toLowerCase())) {
                errors.push(`Headline "${exp.headline}" not found`);
            }
        }

        // Check email input
        if (exp.hasEmailInput !== false) {
            const emailInput = shadow.querySelector('input[type="email"]');
            if (!emailInput) {
                errors.push('Email input not found');
            }
        }

        // Check GDPR checkbox
        if (exp.hasGdprCheckbox) {
            const checkbox = shadow.querySelector('input[type="checkbox"]');
            if (!checkbox) {
                errors.push('GDPR checkbox expected but not found');
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Verify free shipping bar content is rendered correctly
 */
export async function verifyFreeShippingContent(page: Page, expected: {
    threshold?: number;
    currency?: string;
    message?: string;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        const html = shadow.innerHTML.toLowerCase();

        // Check for threshold amount
        if (exp.threshold) {
            const thresholdStr = exp.threshold.toString();
            if (!html.includes(thresholdStr)) {
                errors.push(`Threshold amount "${exp.threshold}" not found`);
            }
        }

        // Check currency symbol
        if (exp.currency) {
            if (!shadow.innerHTML.includes(exp.currency)) {
                errors.push(`Currency symbol "${exp.currency}" not found`);
            }
        }

        // Check message
        if (exp.message) {
            if (!html.includes(exp.message.toLowerCase())) {
                errors.push(`Message "${exp.message}" not found`);
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Verify social proof notification content is rendered correctly
 */
export async function verifySocialProofContent(page: Page, expected: {
    hasProductImage?: boolean;
    hasTimestamp?: boolean;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        // Check for product image
        if (exp.hasProductImage) {
            const img = shadow.querySelector('img');
            if (!img) {
                errors.push('Product image not found');
            }
        }

        // Check for timestamp
        if (exp.hasTimestamp) {
            const html = shadow.innerHTML.toLowerCase();
            const hasTime = html.includes('ago') || html.includes('minute') ||
                html.includes('hour') || html.includes('just now');
            if (!hasTime) {
                errors.push('Timestamp not found');
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Verify announcement bar content is rendered correctly
 */
export async function verifyAnnouncementContent(page: Page, expected: {
    headline?: string;
    hasCtaButton?: boolean;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        const html = shadow.innerHTML.toLowerCase();

        // Check headline
        if (exp.headline) {
            if (!html.includes(exp.headline.toLowerCase())) {
                errors.push(`Headline "${exp.headline}" not found`);
            }
        }

        // Check for CTA button/link
        if (exp.hasCtaButton) {
            const hasLink = shadow.querySelector('a[href], button');
            if (!hasLink) {
                errors.push('CTA button/link not found');
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Verify countdown timer content is rendered correctly
 */
export async function verifyCountdownTimerContent(page: Page, expected: {
    headline?: string;
    hasTimer?: boolean;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        const html = shadow.innerHTML.toLowerCase();

        // Check headline
        if (exp.headline) {
            if (!html.includes(exp.headline.toLowerCase())) {
                errors.push(`Headline "${exp.headline}" not found`);
            }
        }

        // Check for timer
        if (exp.hasTimer !== false) {
            const hasTimer = shadow.querySelector('[class*="countdown" i], [class*="timer" i], [data-countdown]') ||
                html.match(/\d{1,2}:\d{2}/);
            if (!hasTimer) {
                errors.push('Countdown timer not found');
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Verify cart abandonment popup content is rendered correctly
 */
export async function verifyCartAbandonmentContent(page: Page, expected: {
    headline?: string;
    hasUrgencyTimer?: boolean;
    hasEmailInput?: boolean;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        const html = shadow.innerHTML.toLowerCase();

        // Check headline
        if (exp.headline) {
            if (!html.includes(exp.headline.toLowerCase())) {
                errors.push(`Headline "${exp.headline}" not found`);
            }
        }

        // Check urgency timer
        if (exp.hasUrgencyTimer) {
            const hasTimer = shadow.querySelector('[class*="timer" i], [class*="countdown" i]') ||
                html.match(/\d{1,2}:\d{2}/);
            if (!hasTimer) {
                errors.push('Urgency timer not found');
            }
        }

        // Check email input
        if (exp.hasEmailInput) {
            const emailInput = shadow.querySelector('input[type="email"]');
            if (!emailInput) {
                errors.push('Email input not found');
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Verify product upsell popup content is rendered correctly
 */
export async function verifyProductUpsellContent(page: Page, expected: {
    headline?: string;
    productCount?: number;
    hasImages?: boolean;
    hasPrices?: boolean;
}): Promise<{ valid: boolean; errors: string[] }> {
    return page.evaluate((exp) => {
        const errors: string[] = [];
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { valid: false, errors: ['Shadow DOM not found'] };
        }

        const html = shadow.innerHTML.toLowerCase();

        // Check headline
        if (exp.headline) {
            if (!html.includes(exp.headline.toLowerCase())) {
                errors.push(`Headline "${exp.headline}" not found`);
            }
        }

        // Check product images
        if (exp.hasImages) {
            const images = shadow.querySelectorAll('img');
            if (images.length === 0) {
                errors.push('Product images not found');
            }
        }

        // Check for prices
        if (exp.hasPrices) {
            const hasPrices = html.includes('$') || html.includes('€') || html.includes('£');
            if (!hasPrices) {
                errors.push('Prices not found');
            }
        }

        return { valid: errors.length === 0, errors };
    }, expected);
}

/**
 * Get the current popup state (visible, form state, etc.)
 */
export async function getPopupState(page: Page): Promise<{
    isVisible: boolean;
    hasContent: boolean;
    templateType: string | null;
    formState: 'initial' | 'success' | 'error' | 'loading' | 'unknown';
}> {
    return page.evaluate(() => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return {
                isVisible: false,
                hasContent: false,
                templateType: null,
                formState: 'unknown' as const
            };
        }

        const html = shadow.innerHTML.toLowerCase();
        const isVisible = host instanceof HTMLElement &&
            window.getComputedStyle(host).display !== 'none';

        // Detect form state
        let formState: 'initial' | 'success' | 'error' | 'loading' | 'unknown' = 'unknown';
        if (html.includes('thank') || html.includes('success') || html.includes('congratulation')) {
            formState = 'success';
        } else if (html.includes('error') || html.includes('invalid') || html.includes('required')) {
            formState = 'error';
        } else if (html.includes('loading') || html.includes('submitting')) {
            formState = 'loading';
        } else if (shadow.querySelector('form, input[type="email"]')) {
            formState = 'initial';
        }

        // Detect template type from content
        let templateType: string | null = null;
        if (html.includes('spin') && html.includes('wheel')) {
            templateType = 'SPIN_TO_WIN';
        } else if (html.includes('scratch')) {
            templateType = 'SCRATCH_CARD';
        } else if (html.includes('flash') || html.includes('sale')) {
            templateType = 'FLASH_SALE';
        } else if (html.includes('free shipping')) {
            templateType = 'FREE_SHIPPING';
        } else if (shadow.querySelector('input[type="email"]')) {
            templateType = 'NEWSLETTER';
        }

        return {
            isVisible,
            hasContent: html.length > 50,
            templateType,
            formState
        };
    });
}

/**
 * Wait for popup to show success state after form submission
 */
export async function waitForFormSuccess(page: Page, timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const state = await getPopupState(page);
        if (state.formState === 'success') {
            return true;
        }
        await page.waitForTimeout(200);
    }

    return false;
}

/**
 * Verify discount code is displayed after form submission
 */
export async function verifyDiscountCodeDisplayed(page: Page, expectedCode?: string): Promise<{
    found: boolean;
    code: string | null;
}> {
    return page.evaluate((expected) => {
        const host = document.querySelector('#revenue-boost-popup-shadow-host');
        const shadow = host?.shadowRoot;

        if (!shadow) {
            return { found: false, code: null };
        }

        // Look for discount code patterns
        const html = shadow.innerHTML;

        // Match common discount code patterns (uppercase alphanumeric, 6-20 chars)
        const codeMatch = html.match(/\b[A-Z0-9]{6,20}\b/g);

        if (expected) {
            const found = html.toUpperCase().includes(expected.toUpperCase());
            return { found, code: expected };
        }

        // Return first found code
        const code = codeMatch ? codeMatch[0] : null;
        return { found: !!code, code };
    }, expectedCode);
}
