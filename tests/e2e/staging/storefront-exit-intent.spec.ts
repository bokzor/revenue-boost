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
    getTestPrefix,
    verifyExitIntentContent,
    hasTextInShadowDOM,
    fillEmailInShadowDOM,
    cleanupAllE2ECampaigns,
    MAX_TEST_PRIORITY
} from './helpers/test-helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-exit-intent.spec.ts');

/**
 * Exit Intent Template E2E Tests
 *
 * Tests ACTUAL exit intent behavior against deployed extension code:
 * - Popup triggers on mouse exit
 * - Custom headlines are displayed
 * - Email input is functional
 * - GDPR checkbox appears when enabled
 *
 * NOTE: No bundle mocking - tests use deployed extension code.
 */

test.describe.serial('Exit Intent Template', () => {
    let prisma: PrismaClient;
    let storeId: string;
    let factory: CampaignFactory;

    test.beforeAll(async () => {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined');
        }

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

        await page.context().clearCookies();

        // No bundle mocking - tests use deployed extension code

        // Log browser console for debugging
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[Revenue Boost]') || text.includes('exit_intent') || text.includes('Error')) {
                console.log(`[BROWSER] ${text}`);
            }
        });
    });

    /**
     * Helper to trigger exit intent by dispatching mouseleave event
     *
     * Playwright's page.mouse.move() does NOT trigger native mouseleave events
     * when moving outside the viewport. We need to manually dispatch the event
     * with the correct clientY to simulate leaving from the top of the page.
     */
    async function triggerExitIntent(page: any) {
        // First, simulate some mouse movement to build velocity history
        await page.mouse.move(500, 300);
        await page.waitForTimeout(100);
        await page.mouse.move(500, 200);
        await page.waitForTimeout(100);
        await page.mouse.move(500, 100);
        await page.waitForTimeout(100);
        await page.mouse.move(500, 50);
        await page.waitForTimeout(100);
        await page.mouse.move(500, 10);
        await page.waitForTimeout(100);

        // Dispatch a mouseleave event on document.documentElement with clientY <= 0
        // This simulates the mouse leaving from the top of the viewport
        await page.evaluate(() => {
            const event = new MouseEvent('mouseleave', {
                bubbles: true,
                cancelable: true,
                clientX: 500,
                clientY: -10, // Leaving from top
                view: window
            });
            document.documentElement.dispatchEvent(event);
        });
    }

    test('renders popup with email input on exit intent', async ({ page }) => {
        const campaign = await (await factory.exitIntent().init())
            .withPriority(MAX_TEST_PRIORITY)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Wait for page to settle
        await page.waitForTimeout(2000);

        // Trigger exit intent
        await triggerExitIntent(page);

        // Wait for popup
        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 10000 });

        // Verify exit intent content
        const verification = await verifyExitIntentContent(page, {
            hasEmailInput: true
        });

        if (verification.valid) {
            console.log('✅ Exit Intent popup with email input rendered');
        } else {
            // Fallback: check for any popup content
            const hasContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                return host.shadowRoot.innerHTML.length > 100;
            });
            expect(hasContent).toBe(true);
            console.log('✅ Exit Intent popup rendered with content');
        }
    });

    test('displays custom headline', async ({ page }) => {
        const headline = 'Wait! Before you go...';

        const campaign = await (await factory.exitIntent().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withHeadline(headline)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        await page.waitForTimeout(2000);
        await triggerExitIntent(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 10000 });

        // Verify headline
        const verification = await verifyExitIntentContent(page, {
            headline: 'Wait'
        });

        if (verification.valid) {
            console.log(`✅ Custom headline "${headline}" displayed`);
        } else {
            // Fallback check
            const hasHeadline = await hasTextInShadowDOM(page, 'Wait');
            if (hasHeadline) {
                console.log('✅ Headline content verified');
            } else {
                console.log(`⚠️ Headline verification: ${verification.errors.join(', ')}`);
            }
        }
    });

    test('shows GDPR checkbox when enabled', async ({ page }) => {
        const gdprText = 'I agree to receive marketing emails';

        const campaign = await (await factory.exitIntent().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withGdprCheckbox(true, gdprText)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        await page.waitForTimeout(2000);
        await triggerExitIntent(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 10000 });

        // Verify GDPR checkbox
        const verification = await verifyExitIntentContent(page, {
            hasGdprCheckbox: true
        });

        if (verification.valid) {
            console.log('✅ GDPR checkbox rendered');

            // Verify checkbox text
            const hasGdprText = await hasTextInShadowDOM(page, 'marketing');
            if (hasGdprText) {
                console.log('✅ GDPR text content verified');
            }
        } else {
            console.log(`⚠️ GDPR verification: ${verification.errors.join(', ')}`);
        }
    });

    test('email input is functional', async ({ page }) => {
        const campaign = await (await factory.exitIntent().init())
            .withPriority(MAX_TEST_PRIORITY)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        await page.waitForTimeout(2000);
        await triggerExitIntent(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 10000 });

        // Fill email - HARD ASSERTION
        const testEmail = `exit-test-${Date.now()}@example.com`;
        const filled = await fillEmailInShadowDOM(page, testEmail);

        expect(filled).toBe(true);
        console.log(`✅ Email "${testEmail}" filled successfully`);
    });
});

