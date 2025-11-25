import type { Page } from '@playwright/test';
import "./load-staging-env";

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
