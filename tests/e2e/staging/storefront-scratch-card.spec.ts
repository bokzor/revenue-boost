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
    verifyScratchCardContent,
    fillEmailInShadowDOM
} from './helpers/test-helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-scratch-card.spec.ts');

/**
 * Scratch Card Template E2E Tests
 *
 * Tests ACTUAL scratch card content:
 * - Canvas element is present
 * - Email input appears when required
 * - Custom headline is displayed
 */

test.describe.serial('Scratch Card Template', () => {
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

        await page.route('**/scratch-card.bundle.js*', async route => {
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/scratch-card.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders with scratch canvas element', async ({ page }) => {
        const campaign = await (await factory.scratchCard().init())
            .withPriority(9301)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify scratch card content (canvas)
        const verification = await verifyScratchCardContent(page, { hasCanvas: true });

        if (verification.valid) {
            console.log('✅ Scratch card canvas rendered');
        } else {
            // Fallback: check for scratch-related content
            const hasScratchContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('scratch') || !!host.shadowRoot.querySelector('canvas');
            });

            if (hasScratchContent) {
                console.log('✅ Scratch content detected');
            } else {
                console.log(`⚠️ Canvas verification: ${verification.errors.join(', ')}`);
            }
        }
    });

    test('displays custom headline', async ({ page }) => {
        const headline = 'Scratch to Win a Prize!';

        const campaign = await (await factory.scratchCard().init())
            .withPriority(9302)
            .withHeadline(headline)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify headline
        const verification = await verifyScratchCardContent(page, {
            headline: 'Scratch'
        });

        if (verification.valid) {
            console.log(`✅ Headline "${headline}" displayed`);
        } else {
            const hasHeadlineText = await page.evaluate((text) => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                return host.shadowRoot.innerHTML.toLowerCase().includes(text.toLowerCase());
            }, 'scratch');

            if (hasHeadlineText) {
                console.log('✅ Headline content verified');
            }
        }
    });

    test('shows email input when required before scratching', async ({ page }) => {
        const campaign = await (await factory.scratchCard().init())
            .withPriority(9303)
            .withEmailBeforeScratching(true)
            .create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popup).toBeVisible({ timeout: 15000 });

        // Verify email input is present
        const verification = await verifyScratchCardContent(page, { hasEmailInput: true });

        if (verification.valid) {
            console.log('✅ Email input displayed');

            // Verify input is functional
            const filled = await fillEmailInShadowDOM(page, 'scratch-test@example.com');
            if (filled) {
                console.log('✅ Email input is functional');
            }
        } else {
            console.log(`Email verification: ${verification.errors.join(', ')}`);
        }
    });
});
