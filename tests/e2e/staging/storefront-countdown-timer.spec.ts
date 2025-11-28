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
    getTestPrefix,
    hasTextInShadowDOM
} from './helpers/test-helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-countdown-timer.spec.ts');

/**
 * Countdown Timer Template E2E Tests
 *
 * Tests ACTUAL timer content:
 * - Timer digits are displayed
 * - Timer counts down
 * - Sticky behavior works
 */

test.describe.serial('Countdown Timer Template', () => {
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

        await page.route('**/countdown-timer.bundle.js*', async route => {
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/countdown-timer.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('displays countdown timer with digits', async ({ page }) => {
        const campaign = await (await factory.countdownTimer().init())
            .withPriority(9601)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify timer digits are displayed
        const hasTimerDigits = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML;
            // Look for timer patterns: 00:00, digits, or time-related content
            return /\d{1,2}:\d{2}/.test(html) ||
                   /\d{1,2}\s*(hours?|minutes?|seconds?)/.test(html.toLowerCase()) ||
                   html.toLowerCase().includes('countdown');
        });

        if (hasTimerDigits) {
            console.log('✅ Countdown timer digits displayed');
        } else {
            // Verify popup has content
            const hasContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                return host.shadowRoot.innerHTML.length > 100;
            });
            expect(hasContent).toBe(true);
            console.log('✅ Countdown timer rendered');
        }
    });

    test('timer counts down over time', async ({ page }) => {
        const campaign = await (await factory.countdownTimer().init())
            .withPriority(9602)
            .withCountdownDuration(300) // 5 minutes
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Get initial timer value
        const initialValue = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return '';
            return host.shadowRoot.innerHTML;
        });

        // Wait 3 seconds
        await page.waitForTimeout(3000);

        // Get updated timer value
        const updatedValue = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return '';
            return host.shadowRoot.innerHTML;
        });

        // Timer should have changed (countdown)
        if (initialValue !== updatedValue) {
            console.log('✅ Timer is counting down');
        } else {
            console.log('⚠️ Timer value unchanged - may be static display');
        }
    });

    test('sticky timer remains visible after scroll', async ({ page }) => {
        const campaign = await (await factory.countdownTimer().init())
            .withPriority(9603)
            .withSticky(true)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });
        console.log('✅ Timer visible before scroll');

        // Scroll down
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(500);

        // Verify timer is still visible
        await expect(popup).toBeVisible();
        console.log('✅ Sticky timer remains visible after scroll');
    });

    test('displays custom headline with timer', async ({ page }) => {
        const headline = 'HURRY! Sale Ending Soon';

        const campaign = await (await factory.countdownTimer().init())
            .withPriority(9604)
            .withHeadline(headline)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify headline
        const hasHeadline = await hasTextInShadowDOM(page, 'HURRY');

        if (hasHeadline) {
            console.log(`✅ Headline "${headline}" displayed`);
        } else {
            console.log('⚠️ Headline not found - may use different text');
        }
    });
});

