import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, API_PROPAGATION_DELAY_MS, handlePasswordPage, mockChallengeToken, waitForAnyPopup, getTestPrefix } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
const TEST_PREFIX = getTestPrefix('storefront-targeting.spec.ts');

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

    test('respects "once per session" frequency cap - config is correct', async ({ page }) => {
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Freq-Cap-Session')
            .withFrequencyCapping(1, 100, 0) // 1 per session, many per day
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // Verify frequency cap config
        const dbCampaign = await prisma.campaign.findUnique({
            where: { id: campaign.id },
            select: { targetRules: true }
        });

        const frequencyCapping = (dbCampaign?.targetRules as any)?.enhancedTriggers?.frequency_capping;
        expect(frequencyCapping).toBeDefined();
        expect(frequencyCapping.max_triggers_per_session).toBe(1);

        console.log('✅ Frequency cap config correct');
    });

    test('respects "once per day" frequency cap - config is correct', async ({ page }) => {
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Freq-Cap-Daily')
            .withFrequencyCapping(100, 1, 86400) // Many per session, 1 per day
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // Verify config
        const dbCampaign = await prisma.campaign.findUnique({
            where: { id: campaign.id },
            select: { targetRules: true }
        });

        const frequencyCapping = (dbCampaign?.targetRules as any)?.enhancedTriggers?.frequency_capping;
        expect(frequencyCapping).toBeDefined();
        expect(frequencyCapping.max_triggers_per_day).toBe(1);

        console.log('✅ Daily frequency cap config correct');
    });

    test('targets new visitors only - config is correct', async ({ page }) => {
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Target-New-Visitor')
            .withSessionTargeting('new_visitor')
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        // Verify config
        const dbCampaign = await prisma.campaign.findUnique({
            where: { id: campaign.id },
            select: { targetRules: true }
        });

        // Session targeting is stored in audienceTargeting.sessionRules
        const sessionRules = (dbCampaign?.targetRules as any)?.audienceTargeting?.sessionRules;
        expect(sessionRules).toBeDefined();
        expect(sessionRules.enabled).toBe(true);
        expect(Array.isArray(sessionRules.conditions)).toBe(true);

        // Should have a condition for isReturningVisitor = false
        const visitorCondition = sessionRules.conditions?.find((c: any) => c.field === 'isReturningVisitor');
        expect(visitorCondition).toBeDefined();

        console.log('✅ New visitor targeting config correct');
    });

    test('shows only on specific pages', async ({ page }) => {
        // Target collections page only with very high priority
        const builder = factory.newsletter();
        await builder.init();
        const priority = 9500 + Math.floor(Math.random() * 100);
        const campaign = await builder
            .withName('Target-Collection-Page')
            .withPageTargeting(['*/collections/*'])
            .withPriority(priority)
            .create();

        console.log(`Created campaign: ${campaign.name} with priority ${priority}`);

        // Wait for campaign to propagate
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // Collection page: Should show our high priority campaign
        await page.goto(`${STORE_URL}/collections/all`);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });
        console.log('✅ Popup shown on collections page');
    });

    test('targets mobile devices only', async ({ page }) => {
        const builder = factory.newsletter();
        await builder.init();
        const priority = 9600 + Math.floor(Math.random() * 100);
        const campaign = await builder
            .withName('Target-Mobile-Only')
            .withDeviceTargeting(['mobile'])
            .withPriority(priority)
            .create();

        console.log(`Created campaign: ${campaign.name} with priority ${priority}`);

        // Wait for campaign to propagate
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // Mobile viewport: Should show
        await page.setViewportSize({ width: 375, height: 667 });
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        });
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });
        console.log('✅ Popup shown on mobile viewport');
    });

    test('targets desktop devices only', async ({ page }) => {
        const builder = factory.newsletter();
        await builder.init();
        const priority = 9700 + Math.floor(Math.random() * 100);
        const campaign = await builder
            .withName('Target-Desktop-Only')
            .withDeviceTargeting(['desktop'])
            .withPriority(priority)
            .create();

        console.log(`Created campaign: ${campaign.name} with priority ${priority}`);

        // Wait for campaign to propagate
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // Desktop viewport: Should show
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });
        console.log('✅ Popup shown on desktop viewport');
    });
});
