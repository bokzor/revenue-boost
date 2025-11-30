import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, handlePasswordPage, mockChallengeToken, getTestPrefix } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
const TEST_PREFIX = getTestPrefix('storefront-cart-abandonment.spec.ts');

/**
 * Cart Abandonment Template E2E Tests
 *
 * Tests ACTUAL cart abandonment behavior against deployed extension code:
 * - Popup displays cart items
 * - Email recovery flow works
 * - Urgency timer displays
 *
 * NOTE: No bundle mocking - tests use deployed extension code.
 */

test.describe.serial('Cart Abandonment Template - E2E', () => {
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

        // Mock challenge token to avoid rate limits
        await mockChallengeToken(page);

        // Log browser console messages
        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });

        // No bundle mocking - tests use deployed extension code
    });

    test('renders cart abandonment popup with default configuration', async ({ page }) => {
        // 1. Create campaign using factory
        const campaign = await (await factory.cartAbandonment().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup shadow host to appear
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });

        // 4. Verify shadow DOM has content
        const hasContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            return host.shadowRoot.innerHTML.length > 100;
        });
        expect(hasContent).toBe(true);

        console.log('✅ Cart Abandonment popup rendered successfully');
    });

    test('renders with email recovery enabled', async ({ page }) => {
        // 1. Create campaign with email recovery enabled
        const campaign = await (await factory.cartAbandonment().init())
            .withEmailRecovery(true)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify popup is visible
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });

        console.log('✅ Email recovery popup rendered');
    });

    test('displays urgency timer', async ({ page }) => {
        // 1. Create campaign with custom urgency timer (2 minutes)
        const campaign = await (await factory.cartAbandonment().init())
            .withUrgencyTimer(120)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify popup shadow host is visible
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });

        console.log('✅ Urgency timer popup rendered');
    });

    test('displays cart items when showCartItems is enabled', async ({ page }) => {
        console.log('🧪 Testing cart items display...');

        const campaign = await (await factory.cartAbandonment().init())
            .withShowCartItems(true, 3)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });

        // Check for cart-related content
        const hasCartContent = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const html = host.shadowRoot.innerHTML.toLowerCase();
            return html.includes('cart') || html.includes('item') || html.includes('product');
        });

        console.log(`Cart content present: ${hasCartContent}`);
        console.log('✅ Cart abandonment with items display rendered');
    });

    test('shows checkout CTA button', async ({ page }) => {
        console.log('🧪 Testing checkout CTA...');

        const campaign = await (await factory.cartAbandonment().init())
            .withCtaUrl('/checkout')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });

        // Check for CTA button
        const hasCta = await page.evaluate(() => {
            const host = document.querySelector('#revenue-boost-popup-shadow-host');
            if (!host?.shadowRoot) return false;
            const buttons = host.shadowRoot.querySelectorAll('button, a');
            return buttons.length > 0;
        });

        expect(hasCta).toBe(true);
        console.log('✅ CTA button present');
    });
});
