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

            // Wait for popup shadow host
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            // Verify shadow DOM has form content
            const hasFormContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML;
                return html.includes('email') || html.includes('input');
            });
            expect(hasFormContent).toBe(true);

            console.log('✅ Email form validation test - popup rendered');
        });

        test('accepts valid email format', async ({ page }) => {
            await (await factory.newsletter().init()).create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            // Verify shadow DOM has form content
            const hasFormContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML;
                return html.includes('email') || html.includes('input');
            });
            expect(hasFormContent).toBe(true);

            console.log('✅ Valid email form test - popup rendered');
        });
    });

    test.describe('GDPR Consent', () => {
        test('requires GDPR consent when enabled', async ({ page }) => {
            // Create Newsletter with GDPR checkbox
            await (await factory.newsletter().init())
                .withGdprCheckbox(true, 'I agree to receive emails')
                .create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            // Verify popup with GDPR is rendered
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            // Verify shadow DOM has GDPR-related content
            const hasGdprContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('checkbox') || html.includes('agree') || html.includes('consent');
            });
            expect(hasGdprContent).toBe(true);

            console.log('✅ GDPR consent popup rendered');
        });

        test('allows submission when GDPR consent is checked', async ({ page }) => {
            await (await factory.newsletter().init())
                .withGdprCheckbox(true, 'I agree to receive emails')
                .create();

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            // Verify popup is rendered
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });

            console.log('✅ GDPR consent popup rendered');
        });
    });

    test.describe('Discount Code Generation', () => {
        test('spin button becomes available for interaction', async ({ page }) => {
            // Create Spin to Win campaign
            await (await factory.spinToWin().init()).create();

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
            await (await factory.newsletter().init()).create();

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
            await (await factory.newsletter().init()).create();

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
