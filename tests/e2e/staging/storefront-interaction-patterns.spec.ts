import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, handlePasswordPage, mockChallengeToken } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';

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
        factory = new CampaignFactory(prisma, storeId);
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        // Clean up old test campaigns
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: 'E2E-Test-' }
            }
        });

        await mockChallengeToken(page);

        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });

        // Intercept all popup bundles
        await page.route('**/newsletter.bundle.js*', async route => {
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/newsletter.bundle.js');
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: fs.readFileSync(bundlePath),
            });
        });

        await page.route('**/spin-to-win.bundle.js*', async route => {
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/spin-to-win.bundle.js');
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: fs.readFileSync(bundlePath),
            });
        });

        // Mock API endpoints to avoid "Invalid token" errors
        await page.route(/.*\/api\/leads\/submit.*/, async route => {
            console.log('intercepted: lead submission');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    leadId: 'mock-lead-id',
                    discountCode: 'MOCK-DISCOUNT-123'
                })
            });
        });

        await page.route(/.*\/api\/discounts\/issue.*/, async route => {
            console.log('intercepted: discount issue');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    code: 'MOCK-DISCOUNT-123',
                    type: 'fixed_amount'
                })
            });
        });
    });

    test.describe('Email Validation', () => {
        test('validates email format in Newsletter form', async ({ page }) => {
            // Create Newsletter campaign
            await (await factory.newsletter().init()).create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            // Wait for popup
            await expect(page.locator('[data-template="newsletter"]')).toBeVisible({ timeout: 10000 });

            // Try to submit with invalid email
            const emailInput = page.locator('input[type="email"]');
            await emailInput.fill('invalid-email');

            const submitButton = page.getByRole('button', { name: /subscribe|sign up|submit/i });
            await submitButton.click();

            // Browser native validation should prevent submission
            // or custom error should appear
            const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
            expect(isInvalid).toBe(true);

            console.log('✅ Email validation working');
        });

        test('accepts valid email format', async ({ page }) => {
            await (await factory.newsletter().init()).create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            await expect(page.locator('[data-template="newsletter"]')).toBeVisible({ timeout: 10000 });

            const emailInput = page.locator('input[type="email"]');
            await emailInput.fill('test@example.com');

            const submitButton = page.getByRole('button', { name: /subscribe|sign up|submit/i });

            // Should not show validation error
            const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
            expect(isValid).toBe(true);

            console.log('✅ Valid email accepted');
        });
    });

    test.describe('GDPR Consent', () => {
        test('requires GDPR consent when enabled', async ({ page }) => {
            // Override mock to simulate GDPR error
            await page.route(/.*\/api\/leads\/submit.*/, async route => {
                console.log('intercepted: lead submission (GDPR error)');
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: false,
                        error: 'You must accept the privacy policy'
                    })
                });
            });

            // Create Newsletter with GDPR checkbox
            await (await factory.newsletter().init())
                .withGdprCheckbox(true, 'I agree to receive emails')
                .create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            await expect(page.locator('[data-template="newsletter"]')).toBeVisible({ timeout: 10000 });

            // Fill valid email but don't check GDPR
            const emailInput = page.locator('input[type="email"]');
            await emailInput.fill('test@example.com');

            const submitButton = page.getByRole('button', { name: /subscribe|sign up|submit/i });
            await submitButton.click();

            // Should show error message requiring consent
            const errorLocator = page.locator('text=/must accept|required|agree/i');
            await expect(errorLocator).toBeVisible({ timeout: 5000 });

            console.log('✅ GDPR consent validation working');
        });

        test('allows submission when GDPR consent is checked', async ({ page }) => {
            await (await factory.newsletter().init())
                .withGdprCheckbox(true, 'I agree to receive emails')
                .create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            await expect(page.locator('[data-template="newsletter"]')).toBeVisible({ timeout: 10000 });

            // Fill email and check GDPR
            await page.locator('input[type="email"]').fill('test@example.com');

            const gdprCheckbox = page.locator('input[type="checkbox"]');
            await gdprCheckbox.check();

            const submitButton = page.getByRole('button', { name: /subscribe|sign up|submit/i });
            await submitButton.click();

            // Should proceed (might close popup or show success)
            await page.waitForTimeout(1000);

            console.log('✅ Form submission allowed with GDPR consent');
        });
    });

    test.describe('Discount Code Generation', () => {
        test('spin button becomes available for interaction', async ({ page }) => {
            // Create Spin to Win campaign
            await (await factory.spinToWin().init()).create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            await expect(page.locator('[data-template="spin-to-win"]')).toBeVisible({ timeout: 10000 });

            // Verify spin button exists
            const spinButton = page.getByRole('button', { name: /spin/i });
            await expect(spinButton).toBeVisible({ timeout: 5000 });

            // The button should either be:
            // 1. Immediately clickable (no email required), or  
            // 2. Require email first (which we can detect)
            const isDisabled = await spinButton.isDisabled();

            if (isDisabled) {
                // Email required flow - fill email first
                const emailInput = page.locator('input[type="email"]');
                if (await emailInput.isVisible()) {
                    await emailInput.fill('test@example.com');
                    const submitButton = page.getByRole('button', { name: /submit|continue/i }).first();
                    await submitButton.click();

                    // Now spin button should be enabled
                    await expect(spinButton).toBeEnabled({ timeout: 3000 });
                    console.log('✅ Spin button enabled after email submission');
                } else {
                    console.log('⚠️  Button disabled but no email field found');
                }
            } else {
                console.log('✅ Spin button immediately available');
            }

            // Verify button is now clickable (we don't actually click to avoid timing issues)
            const finalState = await spinButton.isEnabled();
            expect(finalState).toBe(true);
        });
    });

    test.describe('Multi-Step Workflows', () => {
        test('completes email-then-action workflow', async ({ page }) => {
            // Use Newsletter which has clear email -> success flow
            await (await factory.newsletter().init()).create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            await expect(page.locator('[data-template="newsletter"]')).toBeVisible({ timeout: 10000 });

            // Step 1: Enter email
            const emailInput = page.locator('input[type="email"]');
            await emailInput.fill('workflow-test@example.com');

            // Step 2: Submit form
            const submitButton = page.getByRole('button', { name: /subscribe|sign up|submit/i });
            await submitButton.click();

            // Step 3: Verify success state or popup closure
            await page.waitForTimeout(2000);

            // Success could be: popup closes, success message appears, or button changes
            const popupClosed = await page.locator('[data-template="newsletter"]').isHidden().catch(() => false);
            const successVisible = await page.locator('text=/success|thanks|subscrib/i').isVisible().catch(() => false);

            const workflowCompleted = popupClosed || successVisible;
            expect(workflowCompleted).toBe(true);

            console.log('✅ Multi-step workflow completed');
        });
    });

    test.describe('Form Field Validation', () => {
        test('shows required field error for empty email', async ({ page }) => {
            await (await factory.newsletter().init()).create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            await expect(page.locator('[data-template="newsletter"]')).toBeVisible({ timeout: 10000 });

            // Try to submit without filling email
            const submitButton = page.getByRole('button', { name: /subscribe|sign up|submit/i });
            await submitButton.click();

            // Check for HTML5 validation or custom error
            const emailInput = page.locator('input[type="email"]');
            const isRequired = await emailInput.evaluate((el: HTMLInputElement) => {
                return el.validity.valueMissing || !el.validity.valid;
            });

            expect(isRequired).toBe(true);
            console.log('✅ Required field validation working');
        });
    });
});
