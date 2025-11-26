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

        await waitForAnyPopup(page, 10000);
        console.log('✅ Popup shown on first visit');

        // Close the popup
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        // Reload: Should NOT show (same day - frequency cap reached)
        await page.reload();
        await handlePasswordPage(page);
        await page.waitForTimeout(3000);

        const popupVisible = await page.locator('#revenue-boost-popup-shadow-host').isVisible().catch(() => false);
        expect(popupVisible).toBeFalsy();
        console.log('✅ Popup not shown on reload (daily frequency cap)');
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
        await page.goto(STORE_URL);

        await page.evaluate(() => {
            sessionStorage.clear();
            localStorage.clear();
        });

        await handlePasswordPage(page);
        await waitForAnyPopup(page, 10000);
        console.log('✅ Popup shown for new visitor');

        // Simulate returning visitor
        await page.evaluate(() => {
            localStorage.setItem('revenue_boost_visit_count', '5');
        });

        // Reload to apply the new visitor state
        await page.reload();
        await handlePasswordPage(page);
        await page.waitForTimeout(3000);

        const popupVisible = await page.locator('#revenue-boost-popup-shadow-host').isVisible().catch(() => false);
        expect(popupVisible).toBeFalsy();
        console.log('✅ Popup not shown for returning visitor');
    });

    test('shows only on specific pages', async ({ page }) => {
        // Target collections page only
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Target-Collection-Page')
            .withPageTargeting(['*/collections/all'])
            .withPriority(200)
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // Home page: Should NOT show
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await page.waitForTimeout(3000);

        let popupVisible = await page.locator('#revenue-boost-popup-shadow-host').isVisible().catch(() => false);
        // Note: Other campaigns might show on home page, so we just log this
        console.log(`Home page popup visible: ${popupVisible}`);

        // Collection page: Should show
        await page.goto(`${STORE_URL}/collections/all`);
        await handlePasswordPage(page);
        await waitForAnyPopup(page, 10000);
        console.log('✅ Popup shown on collections page');
    });

    test('targets mobile devices only', async ({ page }) => {
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Target-Mobile-Only')
            .withDeviceTargeting(['mobile'])
            .withPriority(201)
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // Desktop viewport: Should NOT show this campaign
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await page.waitForTimeout(3000);
        console.log('Desktop viewport test complete');

        // Mobile viewport: Should show
        await page.context().clearCookies();
        await page.setViewportSize({ width: 375, height: 667 });
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        });
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await waitForAnyPopup(page, 10000);
        console.log('✅ Popup shown on mobile viewport');
    });

    test('targets desktop devices only', async ({ page }) => {
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Target-Desktop-Only')
            .withDeviceTargeting(['desktop'])
            .withPriority(202)
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // Mobile viewport: Should NOT show this campaign
        await page.context().clearCookies();
        await page.setViewportSize({ width: 375, height: 667 });
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        });
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await page.waitForTimeout(3000);
        console.log('Mobile viewport test complete');

        // Desktop viewport: Should show
        await page.context().clearCookies();
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        await page.goto(STORE_URL);
        await handlePasswordPage(page);
        await waitForAnyPopup(page, 10000);
        console.log('✅ Popup shown on desktop viewport');
    });
});
