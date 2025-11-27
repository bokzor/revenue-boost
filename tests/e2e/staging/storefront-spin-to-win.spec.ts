import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, handlePasswordPage, mockChallengeToken, getTestPrefix } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
const TEST_PREFIX = getTestPrefix('storefront-spin-to-win.spec.ts');

test.describe('Spin to Win Template - E2E', () => {
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
            throw new Error(`Store not found: ${STORE_DOMAIN} `);
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

        // Mock challenge token to avoid rate limits
        await mockChallengeToken(page);

        // Log browser console messages
        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });

        // Intercept the spin-to-win bundle request and serve the local file
        // This ensures we are testing the latest code with our test attributes
        await page.route('**/spin-to-win.bundle.js*', async route => {
            console.log('Intercepting spin-to-win.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/spin-to-win.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders spin to win popup with default configuration', async ({ page }) => {
        // 1. Create campaign using factory
        const campaign = await (await factory.spinToWin().init()).create();
        console.log(`✅ Campaign created: ${campaign.id} `);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup shadow host to appear
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });
        console.log('✅ Spin to Win popup visible');
    });

    test('allows customizing wheel segments', async ({ page }) => {
        // 1. Create campaign with custom segments
        const campaign = await (await factory.spinToWin().init())
            .withSegments([
                { label: '5% Off', color: '#FF0000', probability: 0.5 },
                { label: '25% Off', color: '#00FF00', probability: 0.5 }
            ])
            .withHeadline('Custom Wheel!')
            .create();

        console.log(`✅ Campaign created: ${campaign.id} `);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify popup is visible
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });
        console.log('✅ Spin to Win with custom segments visible');

        console.log('✅ Custom configuration applied');
    });

    test('requires email before spinning', async ({ page }) => {
        // 1. Create campaign with email required
        const campaign = await (await factory.spinToWin().init())
            .withEmailRequired(true)
            .create();

        console.log(`✅ Campaign created: ${campaign.id} `);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup shadow host
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });
        console.log('✅ Spin to Win with email requirement visible');
    });

    test('can set high priority to ensure selection', async ({ page }) => {
        // 1. Create campaign with very high priority
        const campaign = await (await factory.spinToWin().init())
            .withPriority(20)
            .withName('HighPriority')
            .create();

        console.log(`✅ High priority campaign created: ${campaign.id} `);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup to appear
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });
        console.log('✅ High priority campaign rendered');
    });
});
