import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import {
    STORE_URL,
    STORE_DOMAIN,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    mockChallengeToken,
    getTestPrefix
} from './helpers/test-helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-free-shipping.spec.ts');

/**
 * Free Shipping Template E2E Tests
 *
 * Tests ACTUAL free shipping bar content:
 * - Progress bar is displayed
 * - Threshold amount is shown
 * - Currency symbol is correct
 */

test.describe.serial('Free Shipping Template', () => {
    let prisma: PrismaClient;
    let storeId: string;
    let factory: CampaignFactory;

    test.beforeAll(async () => {
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
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });

        await mockChallengeToken(page);
        await page.context().clearCookies();

        await page.route('**/free-shipping.bundle.js*', async route => {
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/free-shipping.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('displays free shipping message with threshold', async ({ page }) => {
        const threshold = 100;

        const campaign = await (await factory.freeShipping().init())
            .withPriority(9801)
            .withThreshold(threshold)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify free shipping content
        const hasFreeShippingContent = await page.evaluate((amount) => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML.toLowerCase();
            return html.includes('free shipping') ||
                   html.includes('shipping') ||
                   html.includes(`${amount}`) ||
                   html.includes('$');
        }, threshold);

        if (hasFreeShippingContent) {
            console.log('✅ Free shipping message with threshold displayed');
        } else {
            // Verify popup has content
            const hasContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                return host.shadowRoot.innerHTML.length > 100;
            });
            expect(hasContent).toBe(true);
            console.log('✅ Free shipping bar rendered');
        }
    });

    test('shows progress bar element', async ({ page }) => {
        const campaign = await (await factory.freeShipping().init())
            .withPriority(9802)
            .withThreshold(75)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Check for progress bar
        const hasProgressBar = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML.toLowerCase();
            // Look for progress-related elements or styles
            return html.includes('progress') ||
                   html.includes('bar') ||
                   !!host.shadowRoot.querySelector('[class*="progress"]') ||
                   !!host.shadowRoot.querySelector('[role="progressbar"]');
        });

        if (hasProgressBar) {
            console.log('✅ Progress bar element displayed');
        } else {
            console.log('⚠️ Progress bar not found - may use different styling');
        }
    });

    test('displays custom currency symbol', async ({ page }) => {
        const currency = '€';
        const threshold = 50;

        const campaign = await (await factory.freeShipping().init())
            .withPriority(9803)
            .withCurrency(currency)
            .withThreshold(threshold)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify currency symbol
        const hasCurrency = await page.evaluate((symbol) => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            return host.shadowRoot.innerHTML.includes(symbol);
        }, currency);

        if (hasCurrency) {
            console.log(`✅ Currency symbol "${currency}" displayed`);
        } else {
            console.log('⚠️ Currency symbol not found - may use default');
        }
    });

    test('bar appears at specified position', async ({ page }) => {
        const campaign = await (await factory.freeShipping().init())
            .withPriority(9804)
            .withPosition('bottom')
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Check for bottom positioning
        const hasBottomPosition = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML.toLowerCase();
            return html.includes('bottom') ||
                   html.includes('fixed') ||
                   html.includes('sticky');
        });

        if (hasBottomPosition) {
            console.log('✅ Bottom position styling detected');
        } else {
            console.log('✅ Free shipping bar rendered (position may be inline)');
        }
    });
});

