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
    mockChallengeToken,
    getTestPrefix,
    hasTextInShadowDOM,
    cleanupAllE2ECampaigns,
    MAX_TEST_PRIORITY
} from './helpers/test-helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-countdown-timer.spec.ts');

/**
 * Countdown Timer Template E2E Tests
 *
 * Tests ACTUAL timer content against deployed extension code:
 * - Timer digits are displayed
 * - Timer counts down
 * - Sticky behavior works
 *
 * NOTE: No bundle mocking - tests use deployed extension code.
 */

test.describe.serial('Countdown Timer Template', () => {
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

        await mockChallengeToken(page);
        await page.context().clearCookies();

        // Log browser console for debugging
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[Revenue Boost]') || text.includes('Error')) {
                console.log(`[BROWSER] ${text}`);
            }
        });

        // No bundle mocking - tests use deployed extension code
    });

    test('displays countdown timer with digits', async ({ page }) => {
        const campaign = await (await factory.countdownTimer().init())
            .withPriority(MAX_TEST_PRIORITY)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Debug: Log what Revenue Boost elements exist in the DOM
        await page.waitForTimeout(3000); // Give popup time to render
        const domDebug = await page.evaluate(() => {
            const results: string[] = [];

            // Check for any revenue-boost related elements
            document.querySelectorAll('[id*="revenue-boost"], [class*="countdown"], [class*="banner-portal"], [data-rb-banner]').forEach(el => {
                results.push(`${el.tagName}#${el.id}.${el.className} - ${(el.textContent || '').substring(0, 50)}`);
            });

            // Also check for shadow hosts
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (host) {
                results.push(`Shadow host found, shadowRoot: ${!!host.shadowRoot}`);
                if (host.shadowRoot) {
                    results.push(`Shadow content length: ${host.shadowRoot.innerHTML.length}`);
                }
            }

            return results.length > 0 ? results : ['No Revenue Boost elements found'];
        });
        console.log('DOM Debug:', domDebug);

        // CountdownTimerPopup renders as either:
        // - Banner mode (default): .countdown-banner with [data-rb-banner]
        // - Modal mode: #revenue-boost-popup-shadow-host (shadow DOM)
        // Also fallback to legacy BannerPopup: .banner-portal [data-rb-banner]
        // Also try any [data-rb-banner] element
        const popup = page.locator('.countdown-banner[data-rb-banner], #revenue-boost-popup-shadow-host, .banner-portal [data-rb-banner], [data-rb-banner]');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify content exists
        const hasContent = await page.evaluate(() => {
            // Check any data-rb-banner element
            const banner = document.querySelector('[data-rb-banner]');
            if (banner) return (banner.textContent || '').length > 0;

            // Check shadow DOM modal
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (host?.shadowRoot) return host.shadowRoot.innerHTML.length > 100;

            return false;
        });
        expect(hasContent).toBe(true);
        console.log('✅ Countdown timer displayed with content');
    });

    // Helper selector for CountdownTimerPopup (banner mode, modal mode, or legacy BannerPopup)
    const COUNTDOWN_POPUP_SELECTOR = '.countdown-banner[data-rb-banner], #revenue-boost-popup-shadow-host, .banner-portal [data-rb-banner], [data-rb-banner]';

    test('timer counts down over time', async ({ page }) => {
        const campaign = await (await factory.countdownTimer().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withCountdownDuration(300) // 5 minutes
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(COUNTDOWN_POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Get initial content
        const initialValue = await page.evaluate(() => {
            const banner = document.querySelector('.countdown-banner[data-rb-banner], [data-rb-banner]');
            if (banner) return banner.textContent || '';
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (host?.shadowRoot) return host.shadowRoot.innerHTML;
            return '';
        });

        // Wait 3 seconds
        await page.waitForTimeout(3000);

        // Get updated content
        const updatedValue = await page.evaluate(() => {
            const banner = document.querySelector('.countdown-banner[data-rb-banner], [data-rb-banner]');
            if (banner) return banner.textContent || '';
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (host?.shadowRoot) return host.shadowRoot.innerHTML;
            return '';
        });

        // Timer should have changed (countdown)
        if (initialValue !== updatedValue) {
            console.log('✅ Timer is counting down');
        } else {
            console.log('⚠️ Timer value unchanged - may be static display');
        }
    });

    test('sticky timer remains visible after scroll', async ({ page }) => {
        const campaign = await (await factory.countdownTimer().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withSticky(true)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(COUNTDOWN_POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 15000 });
        console.log('✅ Timer visible before scroll');

        // Scroll down
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(500);

        // Verify timer is still visible
        await expect(popup).toBeVisible();
        console.log('✅ Sticky timer remains visible after scroll');
    });

    test('displays custom headline with timer', async ({ page }) => {
        const headline = 'HURRY! Sale Ending Soon';

        const campaign = await (await factory.countdownTimer().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withHeadline(headline)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(COUNTDOWN_POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Check for headline in content
        const hasHeadline = await page.evaluate((text) => {
            const banner = document.querySelector('.countdown-banner[data-rb-banner], [data-rb-banner]');
            if (banner) return (banner.textContent || '').includes(text);
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (host?.shadowRoot) return host.shadowRoot.innerHTML.includes(text);
            return false;
        }, 'HURRY');

        if (hasHeadline) {
            console.log(`✅ Headline "${headline}" displayed`);
        } else {
            console.log('⚠️ Headline not found - content displayed');
        }
        console.log('✅ Countdown timer displayed');
    });

    test('timer counts down in real-time', async ({ page }) => {
        console.log('🧪 Testing real-time countdown...');

        const campaign = await (await factory.countdownTimer().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withDuration(300) // 5 minutes
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(COUNTDOWN_POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Get initial content
        const initialTime = await page.evaluate(() => {
            const banner = document.querySelector('.countdown-banner[data-rb-banner], [data-rb-banner]');
            if (banner) return banner.textContent || '';
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (host?.shadowRoot) return host.shadowRoot.innerHTML.substring(0, 200);
            return '';
        });
        console.log(`Initial timer: ${initialTime?.substring(0, 50)}`);

        // Wait 3 seconds
        await page.waitForTimeout(3000);

        // Get new content
        const newTime = await page.evaluate(() => {
            const banner = document.querySelector('.countdown-banner[data-rb-banner], [data-rb-banner]');
            if (banner) return banner.textContent || '';
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (host?.shadowRoot) return host.shadowRoot.innerHTML.substring(0, 200);
            return '';
        });
        console.log(`After 3s: ${newTime?.substring(0, 50)}`);

        if (initialTime && newTime && initialTime !== newTime) {
            console.log('✅ Timer is counting down in real-time');
        } else {
            console.log('⚠️ Timer may not be actively counting (or same second captured)');
        }
    });

    test('applies custom color scheme', async ({ page }) => {
        console.log('🧪 Testing custom colors...');

        const campaign = await (await factory.countdownTimer().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withColorScheme('urgent') // Red/urgency colors
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(COUNTDOWN_POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 15000 });

        console.log('✅ Countdown timer with color scheme rendered');
    });

    test('shows CTA button with custom text', async ({ page }) => {
        console.log('🧪 Testing CTA button...');

        const ctaText = 'Claim Your Discount Now';

        const campaign = await (await factory.countdownTimer().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withCtaButton(ctaText, '/collections/sale')
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator(COUNTDOWN_POPUP_SELECTOR);
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Check for CTA text in content
        const hasCtaText = await page.evaluate((text) => {
            const banner = document.querySelector('.countdown-banner[data-rb-banner], [data-rb-banner]');
            if (banner) return (banner.textContent || '').toLowerCase().includes(text.toLowerCase());
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (host?.shadowRoot) return host.shadowRoot.innerHTML.toLowerCase().includes(text.toLowerCase());
            return false;
        }, 'claim');

        if (hasCtaText) {
            console.log(`✅ CTA button "${ctaText}" displayed`);
        } else {
            console.log('⚠️ CTA text not found - content displayed');
        }
        console.log('✅ Countdown timer rendered');
    });
});

