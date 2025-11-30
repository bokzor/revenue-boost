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
    verifyNewsletterContent,
    verifySpinToWinContent,
    verifyScratchCardContent,
    verifyFlashSaleContent,
    fillEmailInShadowDOM,
    submitFormInShadowDOM,
    waitForFormSuccess,
    cleanupAllE2ECampaigns,
    MAX_TEST_PRIORITY
} from './helpers/test-helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-complete-flows.spec.ts');

/**
 * Complete User Flows E2E Tests
 *
 * Tests ACTUAL end-to-end flows against REAL APIs:
 * - Campaign appears on storefront (deployed extension code)
 * - Template-specific content renders
 * - Form submission works (real lead submission API)
 * - Success state is achieved
 *
 * NOTE: These tests run against deployed extension code (no bundle mocking)
 * and real API endpoints (no API mocking).
 */

test.describe.serial('Complete User Flows', () => {
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

        await mockChallengeToken(page);
        await page.context().clearCookies();

        // No bundle mocking - tests use deployed extension code
    });

    test('Newsletter: complete signup flow', async ({ page }) => {
        // No lead submission mocking - test against real API

        const campaign = await (await factory.newsletter().init())
            .withName('E2E-Newsletter-Complete')
            .withPriority(MAX_TEST_PRIORITY)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Wait for popup
        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });
        console.log('✅ Newsletter popup appeared');

        // Verify newsletter content
        const verification = await verifyNewsletterContent(page, { hasEmailInput: true });
        expect(verification.valid).toBe(true);
        console.log('✅ Email input verified');

        // Fill and submit
        const testEmail = `flow-test-${Date.now()}@example.com`;
        const filled = await fillEmailInShadowDOM(page, testEmail);
        expect(filled).toBe(true);
        console.log(`✅ Email "${testEmail}" entered`);

        await submitFormInShadowDOM(page);
        console.log('✅ Form submitted');

        // Wait for success - hard assertion
        const success = await waitForFormSuccess(page, 10000);
        expect(success).toBe(true);
        console.log('✅ COMPLETE: Newsletter signup flow successful!');
    });

    test('Spin-to-Win: complete flow', async ({ page }) => {
        const campaign = await (await factory.spinToWin().init())
            .withName('E2E-SpinToWin-Complete')
            .withPriority(MAX_TEST_PRIORITY)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });
        console.log('✅ Spin-to-Win popup appeared');

        // Verify wheel content - hard assertion
        const verification = await verifySpinToWinContent(page, { hasSpinButton: true });
        expect(verification.valid).toBe(true);
        console.log('✅ Spin button verified');

        // Check for wheel canvas or wheel-related content
        const hasWheel = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            return !!host.shadowRoot.querySelector('canvas') ||
                   host.shadowRoot.innerHTML.toLowerCase().includes('wheel');
        });

        expect(hasWheel).toBe(true);
        console.log('✅ Wheel content verified');
        console.log('✅ COMPLETE: Spin-to-Win popup rendered with wheel');
    });

    test('Scratch Card: complete flow', async ({ page }) => {
        const campaign = await (await factory.scratchCard().init())
            .withName('E2E-ScratchCard-Complete')
            .withPriority(MAX_TEST_PRIORITY)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });
        console.log('✅ Scratch Card popup appeared');

        // Verify scratch card content - hard assertion
        const hasScratchContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML.toLowerCase();
            return html.includes('scratch') || !!host.shadowRoot.querySelector('canvas');
        });

        expect(hasScratchContent).toBe(true);
        console.log('✅ Scratch content verified');
        console.log('✅ COMPLETE: Scratch Card popup rendered');
    });

    test('Flash Sale: complete flow', async ({ page }) => {
        const campaign = await (await factory.flashSale().init())
            .withName('E2E-FlashSale-Complete')
            .withPriority(MAX_TEST_PRIORITY)
            .withDiscountPercentage(20)
            .withUrgencyMessage('Limited time offer!')
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });
        console.log('✅ Flash Sale popup appeared');

        // Verify flash sale content - hard assertion
        const verification = await verifyFlashSaleContent(page, {
            hasCountdown: true
        });
        expect(verification.valid).toBe(true);
        console.log('✅ Countdown timer verified');

        // Check for discount content - hard assertion
        const hasDiscountContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML;
            return html.includes('20%') || html.toLowerCase().includes('off');
        });

        expect(hasDiscountContent).toBe(true);
        console.log('✅ Discount content verified');
        console.log('✅ COMPLETE: Flash Sale popup rendered with urgency elements');
    });

    test('Multi-template priority: highest priority wins', async ({ page }) => {
        // Create multiple campaigns with different priorities
        const lowPriority = await (await factory.newsletter().init())
            .withName('E2E-LowPriority')
            .withPriority(1)
            .create();
        console.log(`✅ Low priority campaign: ${lowPriority.id}`);

        const highPriority = await (await factory.spinToWin().init())
            .withName('E2E-HighPriority')
            .withPriority(100)
            .create();
        console.log(`✅ High priority campaign: ${highPriority.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify it's the spin-to-win (high priority) - hard assertion
        const isSpinToWin = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML.toLowerCase();
            return html.includes('spin') || html.includes('wheel') ||
                   !!host.shadowRoot.querySelector('canvas');
        });

        expect(isSpinToWin).toBe(true);
        console.log('✅ COMPLETE: High priority Spin-to-Win campaign displayed over Newsletter');
    });
});

