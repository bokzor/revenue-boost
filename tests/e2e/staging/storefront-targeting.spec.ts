import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, handlePasswordPage, mockChallengeToken, waitForAnyPopup } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';

test.describe.serial('Targeting Combinations', () => {
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
        // Cleanup campaigns created during tests
        // Note: In a real scenario, we might want to delete them.
        // For now, we rely on the unique names to avoid collisions.
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        // Mock API calls to prevent actual backend processing where not needed
        // This ensures we don't spam the backend with leads/discounts during targeting tests
        await page.route(/\/.*\/api\/leads\/submit.*/, async route => {
            const json = { success: true, leadId: 'mock-lead-id', discountCode: 'MOCK-DISCOUNT-123' };
            await route.fulfill({ json });
        });

        await page.route(/\/.*\/api\/discounts\/issue.*/, async route => {
            const json = { success: true, discountCode: 'MOCK-DISCOUNT-123' };
            await route.fulfill({ json });
        });

        // Mock challenge token to avoid rate limits
        await mockChallengeToken(page);

        // Intercept bundle requests to serve local files
        await page.route('**/newsletter.bundle.js*', async route => {
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/newsletter.bundle.js');
            const content = fs.readFileSync(bundlePath, 'utf8');
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content
            });
        });

        await page.route('**/spin-to-win.bundle.js*', async route => {
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/spin-to-win.bundle.js');
            const content = fs.readFileSync(bundlePath, 'utf8');
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content
            });
        });

        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });
    });

    test('respects "once per session" frequency cap', async ({ page }) => {
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Freq-Cap-Session')
            .withFrequencyCapping(1, 100, 0) // 1 per session, many per day
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // First visit: Should show
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Wait for popup
        await waitForAnyPopup(page, 10000);
        console.log('✅ Popup shown on first visit');

        // Close the popup by pressing Escape or clicking outside
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        // Reload: Should NOT show (same session - frequency cap reached)
        await page.reload();
        await handlePasswordPage(page);
        await page.waitForTimeout(3000);

        const popupVisible = await page.locator('#revenue-boost-popup-shadow-host').isVisible().catch(() => false);
        expect(popupVisible).toBeFalsy();
        console.log('✅ Popup not shown on reload (frequency cap)');

        // Clear session storage, local storage, and cookies (simulate new session/visitor)
        await page.context().clearCookies();
        await page.evaluate(() => {
            sessionStorage.clear();
            localStorage.clear();
        });

        // Reload: Should show again (new session)
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await waitForAnyPopup(page, 10000);
        console.log('✅ Popup shown on new session');
    });

    test('respects "once per day" frequency cap', async ({ page }) => {
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Freq-Cap-Daily')
            .withFrequencyCapping(100, 1, 86400) // Many per session, 1 per day
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // First visit: Should show
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        await expect(page.locator('[data-template="newsletter"]')).toBeVisible({ timeout: 10000 });

        // Close it
        await page.locator('.popup-close-button').click();

        // Reload: Should NOT show (same day)
        await page.reload();
        await expect(page.locator('[data-template="newsletter"]')).toBeHidden({ timeout: 5000 });

        // Force new session (just to be sure it's not session cap blocking)
        await page.evaluate(() => sessionStorage.clear());
        await page.reload();
        await expect(page.locator('[data-template="newsletter"]')).toBeHidden({ timeout: 5000 });
    });

    test('targets new visitors only', async ({ page }) => {
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Target-New-Visitor')
            .withSessionTargeting('new_visitor')
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // First visit (clean context): Should show
        await page.context().clearCookies();

        // Navigate to store (will hit password page) to establish domain context
        await page.goto(STORE_URL);

        // Now clear storage on the domain
        await page.evaluate(() => {
            sessionStorage.clear();
            localStorage.clear();
        });

        // Log in
        await handlePasswordPage(page);

        await expect(page.locator('[data-template="newsletter"]')).toBeVisible({ timeout: 10000 });

        // Simulate returning visitor
        // We are already on the page, so we can access localStorage
        await page.evaluate(() => {
            localStorage.setItem('revenue_boost_visit_count', '5');
        });

        // Reload to apply the new visitor state
        await page.reload();
        await expect(page.locator('[data-template="newsletter"]')).toBeHidden({ timeout: 5000 });
    });

    test('shows only on specific pages', async ({ page }) => {
        // Target collections page
        const uniqueHeadline = `Collection Offer ${Date.now()}`;
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Target-Collection-Page')
            .withPageTargeting(['*/collections/all'])
            .withHeadline(uniqueHeadline)
            .withPriority(200) // Much higher priority to ensure it wins
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // Home page: Should NOT show THIS popup
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await expect(page.getByText(uniqueHeadline)).toBeHidden({ timeout: 5000 });

        // Collection page: Should show THIS popup
        await page.goto(`${STORE_URL}/collections/all`);
        await expect(page.getByText(uniqueHeadline)).toBeVisible({ timeout: 10000 });
    });

    test('targets mobile devices only', async ({ page }) => {
        const mobileHeadline = `Mobile Only ${Date.now()}`;
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Target-Mobile-Only')
            .withDeviceTargeting(['mobile'])
            .withHeadline(mobileHeadline)
            .withPriority(201)
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // Desktop viewport and user-agent: Should NOT show
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await expect(page.getByText(mobileHeadline)).toBeHidden({ timeout: 5000 });

        // Mobile viewport and user-agent: Should show
        // Set mobile user-agent BEFORE reload to ensure device detection works
        await page.context().clearCookies();
        await page.setViewportSize({ width: 375, height: 667 });
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        });
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await expect(page.getByText(mobileHeadline)).toBeVisible({ timeout: 10000 });
    });

    test('targets desktop devices only', async ({ page }) => {
        const desktopHeadline = `Desktop Only ${Date.now()}`;
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Target-Desktop-Only')
            .withDeviceTargeting(['desktop'])
            .withHeadline(desktopHeadline)
            .withPriority(202)
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // Mobile viewport and user-agent: Should NOT show
        await page.context().clearCookies();
        await page.setViewportSize({ width: 375, height: 667 });
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        });
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await expect(page.getByText(desktopHeadline)).toBeHidden({ timeout: 5000 });

        // Desktop viewport and user-agent: Should show
        await page.context().clearCookies();
        await page.setViewportSize({ width: 1280, height: 720 });
        // Reset to desktop user-agent
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await expect(page.getByText(desktopHeadline)).toBeVisible({ timeout: 10000 });
    });
});
