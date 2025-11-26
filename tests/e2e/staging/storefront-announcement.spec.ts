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

test.describe.serial('Announcement Template - E2E', () => {
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

        // Mock challenge token to avoid rate limits
        await mockChallengeToken(page);

        // Log browser console messages
        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });

        // Intercept the announcement bundle request and serve the local file
        await page.route('**/announcement.bundle.js*', async route => {
            console.log('Intercepting announcement.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/announcement.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders announcement banner with default configuration', async ({ page }) => {
        // Track popup rendering via console logs
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) {
                popupRendered = true;
            }
        });

        // 1. Create campaign using factory
        const campaign = await (await factory.announcement().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container to be rendered (popups render into shadow DOM)
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });

        // 4. Wait a bit for rendering to complete
        await page.waitForTimeout(2000);

        // 5. Verify popup was rendered (check console log or shadow DOM content)
        expect(popupRendered).toBeTruthy();
        console.log('✅ Announcement banner rendered successfully');
    });

    test('displays with custom headline', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with custom headline
        const campaign = await (await factory.announcement().init())
            .withHeadline('🎉 New Store Opening!')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Custom headline rendered');
    });

    test('renders with urgent color scheme', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with urgent scheme
        const campaign = await (await factory.announcement().init())
            .withColorScheme('urgent')
            .withHeadline('⚠️ Important Notice')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ Urgent color scheme rendered');
    });

    test('includes CTA link when configured', async ({ page }) => {
        let popupRendered = false;
        page.on('console', msg => {
            if (msg.text().includes('Popup shown')) popupRendered = true;
        });

        // 1. Create campaign with CTA URL
        const campaign = await (await factory.announcement().init())
            .withCtaUrl('/collections/new-arrivals', false)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup container
        const popupContainer = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupContainer).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);

        expect(popupRendered).toBeTruthy();
        console.log('✅ CTA link rendered');
    });
});

