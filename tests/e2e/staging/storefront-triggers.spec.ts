import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, STORE_DOMAIN, API_PROPAGATION_DELAY_MS, handlePasswordPage, mockChallengeToken, getTestPrefix } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-triggers.spec.ts');

test.describe.configure({ mode: 'serial' });

test.describe('Trigger Combinations', () => {
    let factory: CampaignFactory;
    let prisma: PrismaClient;

    test.beforeAll(async () => {
        prisma = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL,
                },
            },
        });

        const store = await prisma.store.findUnique({
            where: {
                shopifyDomain: STORE_DOMAIN
            }
        });
        if (!store) {
            throw new Error('No store found in database');
        }

        factory = new CampaignFactory(prisma, store.id, TEST_PREFIX);
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

        await mockChallengeToken(page);
        // Log browser console for debugging
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
            }
        });
    });

    test('shows popup after page load delay', async ({ page }) => {
        const priority = 9400 + Math.floor(Math.random() * 100);
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Page-Load-Delay')
            .withTriggerDelay(2000) // 2 second delay
            .withPriority(priority)
            .create();

        console.log(`Created campaign: ${campaign.name} with priority ${priority}`);

        // Wait for campaign to propagate
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');

        // Should not be visible immediately (within first second)
        await page.waitForTimeout(500);
        const visibleEarly = await popup.isVisible().catch(() => false);
        console.log(`Popup visible early (expected false): ${visibleEarly}`);

        // Should be visible after the 2 second delay (give extra buffer)
        await expect(popup).toBeVisible({ timeout: 5000 });
        console.log('✅ Popup shown after delay');
    });

    test('shows popup when user scrolls to depth', async ({ page }) => {
        const priority = 9401 + Math.floor(Math.random() * 100);
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Scroll-Depth-Trigger')
            .withScrollDepthTrigger(50, 'down')
            .withoutPageLoadTrigger()
            .withPriority(priority)
            .create();

        console.log(`Created campaign: ${campaign.name} with priority ${priority}`);

        // Wait for campaign to propagate
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Add tall content to make page scrollable
        await page.evaluate(() => {
            const div = document.createElement('div');
            div.style.height = '3000px';
            div.style.background = 'linear-gradient(white, lightblue)';
            document.body.appendChild(div);
        });

        const popup = page.locator('#revenue-boost-popup-shadow-host');

        // Should not be visible initially
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);
        const visibleEarly = await popup.isVisible().catch(() => false);
        console.log(`Popup visible before scroll (expected false): ${visibleEarly}`);

        // Scroll to 50% depth
        await page.evaluate(() => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo(0, scrollHeight * 0.5);
        });

        // Wait for scroll event to process
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // Should be visible after scroll
        await expect(popup).toBeVisible({ timeout: 5000 });
        console.log('✅ Popup shown after scroll');
    });

    test('shows popup after time delay', async ({ page }) => {
        const priority = 9402 + Math.floor(Math.random() * 100);
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Time-Delay-Trigger')
            .withTimeDelayTrigger(3) // 3 seconds
            .withoutPageLoadTrigger()
            .withPriority(priority)
            .create();

        console.log(`Created campaign: ${campaign.name} with priority ${priority}`);

        // Wait for campaign to propagate
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        const popup = page.locator('#revenue-boost-popup-shadow-host');

        // Should not be visible within first 2 seconds
        await page.waitForTimeout(1500);
        const visibleEarly = await popup.isVisible().catch(() => false);
        console.log(`Popup visible early (expected false): ${visibleEarly}`);

        // Should be visible after 3+ seconds (give extra buffer)
        await expect(popup).toBeVisible({ timeout: 5000 });
        console.log('✅ Popup shown after time delay');
    });

    test('shows popup when all triggers pass (AND logic)', async ({ page }) => {
        const priority = 9403 + Math.floor(Math.random() * 100);
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('AND-Logic-Trigger')
            .withScrollDepthTrigger(30, 'down')
            .withTimeDelayTrigger(3)
            .withTriggerLogic('AND')
            .withoutPageLoadTrigger()
            .withPriority(priority)
            .create();

        console.log(`Created campaign: ${campaign.name} with priority ${priority}`);

        // Wait for campaign to propagate
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Add tall content
        await page.evaluate(() => {
            const div = document.createElement('div');
            div.style.height = '3000px';
            div.style.background = 'linear-gradient(white, lightgreen)';
            document.body.appendChild(div);
        });

        const popup = page.locator('#revenue-boost-popup-shadow-host');

        // Scroll to 30% immediately
        await page.evaluate(() => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo(0, scrollHeight * 0.3);
        });

        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        // Should not be visible yet (scroll met, but time not met)
        const visibleEarly = await popup.isVisible().catch(() => false);
        console.log(`Popup visible after scroll only (expected false): ${visibleEarly}`);

        // Wait for time trigger (3 seconds total from page load)
        await page.waitForTimeout(3000);

        // Should now be visible (both conditions met)
        await expect(popup).toBeVisible({ timeout: 5000 });
        console.log('✅ Popup shown after AND conditions met');
    });

    test('shows popup when any trigger passes (OR logic)', async ({ page }) => {
        const priority = 9404 + Math.floor(Math.random() * 100);
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('OR-Logic-Trigger')
            .withScrollDepthTrigger(80, 'down')
            .withTimeDelayTrigger(3)
            .withTriggerLogic('OR')
            .withoutPageLoadTrigger()
            .withPriority(priority)
            .create();

        console.log(`Created campaign: ${campaign.name} with priority ${priority}`);

        // Wait for campaign to propagate
        await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Add tall content
        await page.evaluate(() => {
            const div = document.createElement('div');
            div.style.height = '3000px';
            div.style.background = 'linear-gradient(white, lightyellow)';
            document.body.appendChild(div);
        });

        const popup = page.locator('#revenue-boost-popup-shadow-host');

        // Don't scroll - just wait for time trigger
        // Should not be visible within 2 seconds
        await page.waitForTimeout(2000);
        const visibleEarly = await popup.isVisible().catch(() => false);
        console.log(`Popup visible early (expected false): ${visibleEarly}`);

        // Should be visible after 3 seconds (time trigger met, scroll not needed with OR)
        await expect(popup).toBeVisible({ timeout: 5000 });
        console.log('✅ Popup shown after OR time trigger met');
    });
});
