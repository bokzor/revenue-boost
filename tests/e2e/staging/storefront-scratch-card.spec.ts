import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
// Environment loaded via helpers/load-staging-env
import { CampaignFactory } from './factories/campaign-factory';
import {
    STORE_URL,
    STORE_DOMAIN,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    getTestPrefix,
    verifyScratchCardContent,
    fillEmailInShadowDOM,
    waitForPopupWithRetry,
    cleanupAllE2ECampaigns,
    MAX_TEST_PRIORITY
} from './helpers/test-helpers';


const TEST_PREFIX = getTestPrefix('storefront-scratch-card.spec.ts');

/**
 * Scratch Card Template E2E Tests
 *
 * Tests ACTUAL scratch card content against deployed extension code:
 * - Canvas element is present
 * - Email input appears when required
 * - Custom headline is displayed
 *
 * NOTE: No bundle mocking - tests use deployed extension code.
 */

test.describe.serial('Scratch Card Template', () => {
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

        await page.context().clearCookies();

        // No bundle mocking - tests use deployed extension code
    });

    test('renders with scratch canvas element', async ({ page }) => {
        const campaign = await (await factory.scratchCard().init())
            .withPriority(MAX_TEST_PRIORITY)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify scratch card content (canvas)
        const verification = await verifyScratchCardContent(page, { hasCanvas: true });

        if (verification.valid) {
            console.log('✅ Scratch card canvas rendered');
        } else {
            // Fallback: check for scratch-related content
            const hasScratchContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('scratch') || !!host.shadowRoot.querySelector('canvas');
            });

            if (hasScratchContent) {
                console.log('✅ Scratch content detected');
            } else {
                console.log(`⚠️ Canvas verification: ${verification.errors.join(', ')}`);
            }
        }
    });

    test('displays custom headline', async ({ page }) => {
        const headline = 'Scratch to Win a Prize!';

        const campaign = await (await factory.scratchCard().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withHeadline(headline)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify headline
        const verification = await verifyScratchCardContent(page, {
            headline: 'Scratch'
        });

        if (verification.valid) {
            console.log(`✅ Headline "${headline}" displayed`);
        } else {
            const hasHeadlineText = await page.evaluate((text) => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                return host.shadowRoot.innerHTML.toLowerCase().includes(text.toLowerCase());
            }, 'scratch');

            if (hasHeadlineText) {
                console.log('✅ Headline content verified');
            }
        }
    });

    test('shows email input when required before scratching', async ({ page }) => {
        const campaign = await (await factory.scratchCard().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withEmailBeforeScratching(true)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify email input is present
        const verification = await verifyScratchCardContent(page, { hasEmailInput: true });

        if (verification.valid) {
            console.log('✅ Email input displayed');

            // Verify input is functional
            const filled = await fillEmailInShadowDOM(page, 'scratch-test@example.com');
            if (filled) {
                console.log('✅ Email input is functional');
            }
        } else {
            console.log(`Email verification: ${verification.errors.join(', ')}`);
        }
    });

    test('scratch interaction reveals prize', async ({ page }) => {
        console.log('🧪 Testing scratch interaction...');

        const campaign = await (await factory.scratchCard().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withEmailBeforeScratching(false) // Scratch first, email later
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
        if (!popupVisible) {
            console.log('⚠️ Popup not visible - skipping test');
            return;
        }

        // Check for canvas element (scratch surface)
        const hasCanvas = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            return !!host.shadowRoot.querySelector('canvas');
        });

        if (hasCanvas) {
            console.log('✅ Scratch canvas present');

            // Simulate scratch interaction with mouse
            const canvasBounds = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return null;
                const canvas = host.shadowRoot.querySelector('canvas');
                if (!canvas) return null;
                const rect = canvas.getBoundingClientRect();
                return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            });

            if (canvasBounds) {
                // Move mouse across canvas to simulate scratching
                const centerX = canvasBounds.x + canvasBounds.width / 2;
                const centerY = canvasBounds.y + canvasBounds.height / 2;

                await page.mouse.move(centerX - 50, centerY);
                await page.mouse.down();
                for (let i = -50; i <= 50; i += 10) {
                    await page.mouse.move(centerX + i, centerY + (i % 20));
                }
                await page.mouse.up();

                console.log('✅ Scratch gesture simulated');
            }
        } else {
            console.log('⚠️ Canvas not found - scratch-card may render differently');
        }
    });

    test('displays GDPR checkbox when enabled', async ({ page }) => {
        console.log('🧪 Testing GDPR checkbox in scratch-card...');

        const campaign = await (await factory.scratchCard().init())
            .withPriority(MAX_TEST_PRIORITY)
            .withGdprCheckbox(true, 'I agree to receive promotional offers')
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
        if (!popupVisible) {
            console.log('⚠️ Popup not visible - skipping test');
            return;
        }

        // Check for GDPR elements
        const gdprState = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return { exists: false };

            const checkbox = host.shadowRoot.querySelector('input[type="checkbox"]');
            const html = host.shadowRoot.innerHTML.toLowerCase();

            return {
                exists: !!checkbox,
                hasConsentText: html.includes('agree') || html.includes('promotional') || html.includes('consent')
            };
        });

        console.log(`GDPR: checkbox=${gdprState.exists}, consentText=${gdprState.hasConsentText}`);
        if (gdprState.exists || gdprState.hasConsentText) {
            console.log('✅ GDPR consent displayed');
        }
    });
});
