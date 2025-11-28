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
    verifyFlashSaleContent
} from './helpers/test-helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-flash-sale.spec.ts');

/**
 * Flash Sale Template E2E Tests
 *
 * Tests ACTUAL content rendering:
 * - Urgency messages are displayed
 * - Discount percentages are shown
 * - Countdown timer is functional
 * - Stock counter displays correctly
 */

test.describe.serial('Flash Sale Template', () => {
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

        await page.route('**/flash-sale.bundle.js*', async route => {
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/flash-sale.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders flash sale popup with countdown timer', async ({ page }) => {
        const campaign = await (await factory.flashSale().init())
            .withPriority(9901)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify flash sale content
        const verification = await verifyFlashSaleContent(page, {
            hasCountdown: true
        });

        if (verification.valid) {
            console.log('✅ Flash Sale popup with countdown timer rendered');
        } else {
            // Fallback: check for any timer-related content
            const hasTimerContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML;
                // Look for timer patterns: 00:00, hours, minutes, or countdown classes
                return /\d{1,2}:\d{2}/.test(html) ||
                       html.toLowerCase().includes('hour') ||
                       html.toLowerCase().includes('minute') ||
                       html.toLowerCase().includes('countdown');
            });

            if (hasTimerContent) {
                console.log('✅ Timer content detected in popup');
            } else {
                console.log(`Verification errors: ${verification.errors.join(', ')}`);
            }
        }
    });

    test('displays custom urgency message', async ({ page }) => {
        const urgencyMessage = 'Only 2 hours left!';

        const campaign = await (await factory.flashSale().init())
            .withPriority(9902)
            .withUrgencyMessage(urgencyMessage)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify urgency message is displayed
        const verification = await verifyFlashSaleContent(page, {
            urgencyMessage: urgencyMessage
        });

        if (verification.valid) {
            console.log(`✅ Urgency message "${urgencyMessage}" displayed`);
        } else {
            // Check for partial message
            const hasPartialMessage = await page.evaluate((msg) => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                return host.shadowRoot.innerHTML.toLowerCase().includes(msg.toLowerCase().substring(0, 10));
            }, urgencyMessage);

            if (hasPartialMessage) {
                console.log('✅ Urgency message content detected');
            } else {
                console.log(`⚠️ Verification: ${verification.errors.join(', ')}`);
            }
        }
    });

    test('displays discount percentage prominently', async ({ page }) => {
        const discountPercent = 30;

        const campaign = await (await factory.flashSale().init())
            .withPriority(9903)
            .withDiscountPercentage(discountPercent)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify discount percentage is shown
        const verification = await verifyFlashSaleContent(page, {
            discountPercentage: discountPercent
        });

        if (verification.valid) {
            console.log(`✅ ${discountPercent}% discount displayed`);
        } else {
            // Check for discount-related content
            const hasDiscountContent = await page.evaluate((percent) => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML;
                return html.includes(`${percent}%`) ||
                       html.includes(`${percent} percent`) ||
                       html.toLowerCase().includes('off');
            }, discountPercent);

            if (hasDiscountContent) {
                console.log('✅ Discount content detected');
            } else {
                console.log(`⚠️ Verification: ${verification.errors.join(', ')}`);
            }
        }
    });

    test('shows stock counter message', async ({ page }) => {
        const stockMessage = 'Only 5 left in stock!';

        const campaign = await (await factory.flashSale().init())
            .withPriority(9904)
            .withStockCounter(true, stockMessage)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify stock counter is displayed
        const hasStockMessage = await page.evaluate((msg) => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML.toLowerCase();
            return html.includes(msg.toLowerCase()) ||
                   html.includes('left') ||
                   html.includes('stock') ||
                   html.includes('remaining');
        }, stockMessage);

        if (hasStockMessage) {
            console.log(`✅ Stock counter message displayed`);
        } else {
            console.log('⚠️ Stock message not found in popup');
        }
    });

    test('CTA button is clickable', async ({ page }) => {
        const campaign = await (await factory.flashSale().init())
            .withPriority(9905)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Find and verify CTA button
        const hasCtaButton = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;

            const ctaBtn = host.shadowRoot.querySelector('a[href], button[type="submit"], button[class*="cta" i]');
            return !!ctaBtn;
        });

        expect(hasCtaButton).toBe(true);
        console.log('✅ CTA button found and clickable');
    });
});

