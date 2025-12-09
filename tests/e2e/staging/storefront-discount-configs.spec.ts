import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';
import {
    STORE_URL,
    STORE_DOMAIN,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    getTestPrefix,
    verifyNewsletterContent,
    fillEmailInShadowDOM,
    submitFormInShadowDOM,
    waitForFormSuccess,
    verifyDiscountCodeDisplayed,
    cleanupAllE2ECampaigns,
    MAX_TEST_PRIORITY
} from './helpers/test-helpers';
import { CampaignFactory } from './factories/campaign-factory';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-discount-configs.spec.ts');

/**
 * Discount Configuration E2E Tests
 *
 * Tests ACTUAL discount display and functionality:
 * - Discount code appears after form submission
 * - Different discount types show correct values
 * - Copy to clipboard functionality works
 */

test.describe.serial('Discount Configurations', () => {
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

        await page.context().clearCookies();

        // NO API MOCKING - tests use real lead submission API
    });

    test('displays discount code after email submission', async ({ page }) => {
        const discountCode = 'SAVE25TEST';

        const campaign = await (await factory.newsletter().init())
            .withName('Discount-Percentage-25')
            .withPriority(MAX_TEST_PRIORITY)
            .withPercentageDiscount(25, discountCode)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // NO API MOCKING - use real lead submission API

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify newsletter form is shown
        const verification = await verifyNewsletterContent(page, { hasEmailInput: true });
        expect(verification.valid).toBe(true);
        console.log('✅ Newsletter popup with email form displayed');

        // Fill and submit form
        const filled = await fillEmailInShadowDOM(page, `test-${Date.now()}@example.com`);
        expect(filled).toBe(true);
        console.log('✅ Email filled in form');

        await submitFormInShadowDOM(page);
        console.log('✅ Form submitted');

        // Wait for success state - HARD ASSERTION
        const success = await waitForFormSuccess(page, 10000);
        expect(success).toBe(true);
        console.log('✅ Form submission successful');

        // Verify discount code is displayed - HARD ASSERTION
        const discountResult = await verifyDiscountCodeDisplayed(page, discountCode);
        expect(discountResult.found).toBe(true);
        console.log(`✅ Discount code "${discountCode}" displayed in popup`);
    });

    test('shows percentage discount value in popup content', async ({ page }) => {
        const campaign = await (await factory.newsletter().init())
            .withName('Discount-ShowPercent')
            .withPriority(MAX_TEST_PRIORITY)
            .withPercentageDiscount(25, 'PERCENT25')
            .withHeadline('Get 25% Off Your Order!')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify the percentage is mentioned in popup content - HARD ASSERTION
        const hasPercentage = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            return host.shadowRoot.innerHTML.includes('25%') ||
                   host.shadowRoot.innerHTML.toLowerCase().includes('25 percent');
        });

        expect(hasPercentage).toBe(true);
        console.log('✅ 25% discount value displayed in popup');
    });

    test('shows fixed amount discount in popup', async ({ page }) => {
        const campaign = await (await factory.newsletter().init())
            .withName('Discount-Fixed-10')
            .withPriority(MAX_TEST_PRIORITY)
            .withFixedAmountDiscount(10, 'SAVE10')
            .withHeadline('Get $10 Off Your Order!')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify the amount is mentioned in popup - HARD ASSERTION
        const hasAmount = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            return host.shadowRoot.innerHTML.includes('$10') ||
                   host.shadowRoot.innerHTML.includes('10 off');
        });

        expect(hasAmount).toBe(true);
        console.log('✅ $10 fixed discount displayed in popup');
    });

    test('shows free shipping messaging', async ({ page }) => {
        const campaign = await (await factory.newsletter().init())
            .withName('Discount-FreeShip')
            .withPriority(MAX_TEST_PRIORITY)
            .withFreeShippingDiscount('FREESHIP')
            .withHeadline('Get Free Shipping!')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify free shipping is mentioned - HARD ASSERTION
        const hasFreeShipping = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML.toLowerCase();
            return html.includes('free shipping') || html.includes('free delivery');
        });

        expect(hasFreeShipping).toBe(true);
        console.log('✅ Free shipping messaging displayed in popup');
    });

    test('copy button copies discount code to clipboard', async ({ page, context }) => {
        const discountCode = 'COPYTEST123';

        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        const campaign = await (await factory.newsletter().init())
            .withName('Discount-Copy-Test')
            .withPriority(MAX_TEST_PRIORITY)
            .withPercentageDiscount(20, discountCode)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // NO API MOCKING - use real lead submission API

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Fill and submit form
        const filled = await fillEmailInShadowDOM(page, `copy-test-${Date.now()}@example.com`);
        expect(filled).toBe(true);

        await submitFormInShadowDOM(page);

        // Wait for success state - HARD ASSERTION
        const success = await waitForFormSuccess(page, 10000);
        expect(success).toBe(true);
        console.log('✅ Form submission successful');

        // Try to find and click copy button
        const copyClicked = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;

            // Try various CSS selectors for copy button (no Playwright-specific selectors)
            const selectors = [
                'button[class*="copy"]',
                '[data-copy]',
                '[data-action="copy"]',
                'button[title*="copy" i]',
                'button[aria-label*="copy" i]'
            ];

            let copyBtn: HTMLElement | null = null;
            for (const selector of selectors) {
                const el = host.shadowRoot?.querySelector(selector);
                if (el instanceof HTMLElement) {
                    copyBtn = el;
                    break;
                }
            }

            // Fallback: find button with "copy" text content
            if (!copyBtn) {
                const buttons = host.shadowRoot?.querySelectorAll('button') || [];
                for (const btn of buttons) {
                    if (btn.textContent?.toLowerCase().includes('copy')) {
                        copyBtn = btn as HTMLElement;
                        break;
                    }
                }
            }

            if (copyBtn) {
                copyBtn.click();
                return true;
            }
            return false;
        });

        // HARD ASSERTION - Copy button must exist and be clickable
        expect(copyClicked).toBe(true);
        console.log('✅ Copy button clicked');

        // Verify clipboard content
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toContain(discountCode);
        console.log(`✅ Discount code "${discountCode}" copied to clipboard`);
    });
});
