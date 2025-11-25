import type { Page } from '@playwright/test';

/**
 * Shared test helpers for E2E tests
 */

export const STORE_URL = 'https://revenue-boost-staging.myshopify.com';
export const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
export const STORE_PASSWORD = 'a';

/**
 * Handle Shopify password protection page
 */
export async function handlePasswordPage(page: Page) {
    const passwordInput = page.locator('input[type="password"]');

    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('🔒 Password page detected, logging in...');
        await passwordInput.fill(STORE_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
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
