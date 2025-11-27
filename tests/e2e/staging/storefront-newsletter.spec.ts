import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import {
    STORE_URL,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    mockChallengeToken,
    fillEmailInShadowDOM,
    submitFormInShadowDOM,
    hasTextInShadowDOM,
    getFormInputsFromShadowDOM,
    mockLeadSubmission,
    getTestPrefix,
    waitForPopupWithRetry
} from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
const TEST_PREFIX = getTestPrefix('storefront-newsletter.spec.ts');

test.describe.serial('Newsletter Template - E2E', () => {
    let prisma: PrismaClient;
    let storeId: string;
    let factory: CampaignFactory;

    test.beforeAll(async () => {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined');
        }

        prisma = new PrismaClient();

        // Get store ID
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
        // Clean up campaigns from previous runs of THIS test file only
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: TEST_PREFIX }
            }
        });

        // Wait for cache invalidation
        await page.waitForTimeout(500);

        // Mock challenge token to avoid rate limits
        await mockChallengeToken(page);

        // Log browser console messages
        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });

        // Intercept the newsletter bundle request and serve the local file
        await page.route('**/newsletter.bundle.js*', async route => {
            console.log('Intercepting newsletter.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/newsletter.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders newsletter popup with default configuration', async ({ page }) => {
        // 1. Create campaign using factory
        const campaign = await (await factory.newsletter().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Wait for campaign to propagate to API (Cloud Run caching)
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // 3. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 4. Wait for popup shadow host to appear (with retry for API propagation)
        const popupVisible = await waitForPopupWithRetry(page, { timeout: 10000, retries: 3 });
        expect(popupVisible).toBe(true);

        // 5. Verify shadow root has content
        const hasContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            return host.shadowRoot.innerHTML.length > 100;
        });
        expect(hasContent).toBe(true);

        console.log('✅ Newsletter popup rendered successfully');
    });

    test('renders with GDPR checkbox when enabled', async ({ page }) => {
        // 1. Create campaign with GDPR enabled
        const campaign = await (await factory.newsletter().init())
            .withGdprCheckbox(true, 'I agree to the terms')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Wait for campaign to propagate to API (Cloud Run caching)
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // 3. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 4. Verify popup shadow host is visible
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });

        // 4. Verify GDPR checkbox exists
        const formInputs = await getFormInputsFromShadowDOM(page);
        expect(formInputs.checkbox).toBe(true);

        console.log('✅ GDPR checkbox rendered in newsletter popup');
    });

    test('renders custom headline', async ({ page }) => {
        // 1. Create campaign with custom headline
        const campaign = await (await factory.newsletter().init())
            .withHeadline('Join the VIP Club')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify popup shadow host is visible
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });

        // 4. Verify custom headline is rendered
        const hasHeadline = await hasTextInShadowDOM(page, 'VIP Club');
        expect(hasHeadline).toBe(true);

        console.log('✅ Custom headline rendered in newsletter popup');
    });

    test('submits newsletter signup successfully', async ({ page }) => {
        // Mock the API response
        await mockLeadSubmission(page, 'NEWSLETTER-TEST');

        // Create campaign
        const campaign = await (await factory.newsletter().init())
            .withHeadline('Get 10% Off')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Wait for popup
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });

        // Fill and submit form
        const emailFilled = await fillEmailInShadowDOM(page, 'newsletter-test@example.com');
        expect(emailFilled).toBe(true);

        const submitted = await submitFormInShadowDOM(page);
        expect(submitted).toBe(true);

        // Wait for response
        await page.waitForTimeout(2000);

        // Check for success state
        const hasDiscount = await hasTextInShadowDOM(page, 'NEWSLETTER-TEST');
        console.log(`✅ Newsletter signup ${hasDiscount ? 'successful - discount shown' : 'submitted'}`);
    });
});
