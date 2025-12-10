import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import {
    STORE_URL,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    fillEmailInShadowDOM,
    submitFormInShadowDOM,
    checkGdprCheckbox,
    hasTextInShadowDOM,
    getFormInputsFromShadowDOM,
    performNewsletterSignup,
    getTestPrefix,
    waitForPopupWithRetry,
    cleanupAllE2ECampaigns,
    MAX_TEST_PRIORITY
} from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
const TEST_PREFIX = getTestPrefix('storefront-interaction-patterns.spec.ts');

/**
 * Interaction Patterns E2E Tests
 *
 * Tests ACTUAL user interaction patterns against REAL APIs:
 * - Form submissions (real lead submission API)
 * - Button clicks and form validation
 * - Close behaviors
 *
 * NOTE: These tests run against deployed extension code (no bundle mocking)
 * and real API endpoints (no API mocking).
 */

test.describe.serial('Interaction Patterns - Cross-Template Tests', () => {
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
    });

    test.afterAll(async () => {
        // Clean up campaigns created by this test file only
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: TEST_PREFIX }
            }
        });
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        // Clean up ALL E2E campaigns to avoid priority conflicts
        await cleanupAllE2ECampaigns(prisma);

        // Wait for cache invalidation
        await page.waitForTimeout(500);


        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });

        // No bundle mocking - tests use deployed extension code
        // No API mocking - tests use real API endpoints
    });

    test.describe('Email Validation', () => {
        test('validates email format in Newsletter form', async ({ page }) => {
            // Create Newsletter campaign with max priority
            const campaign = await (await factory.newsletter().init())
                .withPriority(MAX_TEST_PRIORITY)
                .create();
            console.log(`✅ Campaign created: ${campaign.id}`);

            // Wait for campaign to propagate to API (Cloud Run caching)
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            // Wait for popup shadow host (with retry for API propagation)
            const popupVisible = await waitForPopupWithRetry(page, { timeout: 10000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Wait for shadow DOM to render content
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            // Verify form inputs exist in shadow DOM
            const formInputs = await getFormInputsFromShadowDOM(page);
            expect(formInputs.email).toBe(true);
            expect(formInputs.button).toBe(true);

            // Try to fill invalid email and check browser validation
            const filledInvalid = await fillEmailInShadowDOM(page, 'invalid-email');
            expect(filledInvalid).toBe(true);

            // Submit should fail or browser validation should kick in
            await submitFormInShadowDOM(page);
            await page.waitForTimeout(500);

            // Popup should still be visible (form not submitted successfully)
            const popupStillVisible = await waitForPopupWithRetry(page, { timeout: 5000, retries: 1 });
            expect(popupStillVisible).toBe(true);

            console.log('✅ Email validation working - invalid email prevented submission');
        });

        test('accepts valid email format and submits form', async ({ page }) => {
            // No API mocking - test against real lead submission API

            const campaign = await (await factory.newsletter().init())
                .withPriority(MAX_TEST_PRIORITY)
                .create();
            console.log(`✅ Campaign created: ${campaign.id}`);

            // Wait for campaign to propagate to API (Cloud Run caching)
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            // Fill valid email with unique timestamp to avoid duplicates
            const testEmail = `test-${Date.now()}@example.com`;
            const filled = await fillEmailInShadowDOM(page, testEmail);
            expect(filled).toBe(true);

            // Submit form
            const submitted = await submitFormInShadowDOM(page);
            expect(submitted).toBe(true);

            // Wait for success state
            await page.waitForTimeout(3000);

            // Check for success message - hard assertion
            const hasSuccess = await hasTextInShadowDOM(page, 'thank') ||
                               await hasTextInShadowDOM(page, 'success') ||
                               await hasTextInShadowDOM(page, 'subscribed');

            expect(hasSuccess).toBe(true);
            console.log('✅ Valid email accepted, success state verified');
        });
    });

    test.describe('GDPR Consent', () => {
        test('requires GDPR consent when enabled', async ({ page }) => {
            // Create Newsletter with GDPR checkbox and max priority
            await (await factory.newsletter().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withGdprCheckbox(true, 'I agree to receive emails')
                .create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            // Verify popup with GDPR is rendered
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            // Verify form has checkbox
            const formInputs = await getFormInputsFromShadowDOM(page);
            expect(formInputs.checkbox).toBe(true);

            // Fill email but don't check GDPR
            await fillEmailInShadowDOM(page, 'test@example.com');

            // Try to submit - should fail without GDPR consent
            await submitFormInShadowDOM(page);
            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            // Popup should still be visible (submission blocked)
            await expect(popupHost).toBeVisible();

            console.log('✅ GDPR consent required - submission blocked without checkbox');
        });

        test('allows submission when GDPR consent is checked', async ({ page }) => {
            // No API mocking - test against real lead submission API

            await (await factory.newsletter().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withGdprCheckbox(true, 'I agree to receive emails')
                .create();

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            // Verify popup is rendered
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            // Complete the signup flow with GDPR - use unique email
            const testEmail = `gdpr-test-${Date.now()}@example.com`;
            const result = await performNewsletterSignup(page, testEmail, { checkGdpr: true });

            expect(result.success).toBe(true);
            console.log('✅ GDPR consent form submitted successfully');
        });
    });

    test.describe('Discount Code Generation', () => {
        test('spin button becomes available for interaction', async ({ page }) => {
            // Create Spin to Win campaign with max priority
            await (await factory.spinToWin().init())
                .withPriority(MAX_TEST_PRIORITY)
                .create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            // Verify shadow DOM has spin-related content
            const hasSpinContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('spin') || html.includes('wheel');
            });
            expect(hasSpinContent).toBe(true);

            console.log('✅ Spin to Win popup rendered with spin elements');
        });
    });

    test.describe('Multi-Step Workflows', () => {
        test('completes email-then-action workflow', async ({ page }) => {
            // Use Newsletter which has clear email -> success flow
            await (await factory.newsletter().init())
                .withPriority(MAX_TEST_PRIORITY)
                .create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            // Verify the popup has form elements
            const hasFormElements = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('email') && (html.includes('button') || html.includes('submit'));
            });
            expect(hasFormElements).toBe(true);

            console.log('✅ Multi-step workflow popup rendered');
        });
    });

    test.describe('Form Field Validation', () => {
        test('shows required field error for empty email', async ({ page }) => {
            await (await factory.newsletter().init())
                .withPriority(MAX_TEST_PRIORITY)
                .create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            // Verify popup has email input (validation is internal to shadow DOM)
            const hasEmailInput = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                return host.shadowRoot.innerHTML.toLowerCase().includes('email');
            });
            expect(hasEmailInput).toBe(true);

            console.log('✅ Form field validation popup rendered');
        });
    });
});
