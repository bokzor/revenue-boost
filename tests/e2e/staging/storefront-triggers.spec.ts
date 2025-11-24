import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, handlePasswordPage, mockChallengeToken } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

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

        const store = await prisma.store.findFirst();
        if (!store) {
            throw new Error('No store found in database');
        }

        factory = new CampaignFactory(prisma, store.id);
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        await mockChallengeToken(page);
        // Log browser console for debugging
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'error') {
                console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
            }
        });
    });

    test('shows popup after page load delay', async ({ page }) => {
        const headline = `Delayed Popup ${Date.now()}`;
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Page-Load-Delay')
            .withTriggerDelay(2000) // 2 second delay
            .withHeadline(headline)
            .withPriority(400)
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Should not be visible immediately
        await expect(page.getByText(headline)).toBeHidden({ timeout: 1000 });

        // Should be visible after delay
        await expect(page.getByText(headline)).toBeVisible({ timeout: 3000 });
    });

    test('shows popup when user scrolls to depth', async ({ page }) => {
        const headline = `Scroll Popup ${Date.now()}`;
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Scroll-Depth-Trigger')
            .withScrollDepthTrigger(50, 'down')
            .withoutPageLoadTrigger()
            .withHeadline(headline)
            .withPriority(401)
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Add tall content to make page scrollable
        await page.evaluate(() => {
            const div = document.createElement('div');
            div.style.height = '3000px';
            div.style.background = 'linear-gradient(white, lightblue)';
            document.body.appendChild(div);
        });

        // Should not be visible initially
        await expect(page.getByText(headline)).toBeHidden({ timeout: 2000 });

        // Scroll to 50% depth
        await page.evaluate(() => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo(0, scrollHeight * 0.5);
        });

        // Wait a bit for scroll event to process
        await page.waitForTimeout(500);

        // Should be visible after scroll
        await expect(page.getByText(headline)).toBeVisible({ timeout: 3000 });
    });

    test('shows popup after time delay', async ({ page }) => {
        const headline = `Time Delay Popup ${Date.now()}`;
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Time-Delay-Trigger')
            .withTimeDelayTrigger(3) // 3 seconds
            .withoutPageLoadTrigger()
            .withHeadline(headline)
            .withPriority(402)
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Should not be visible within 2 seconds
        await expect(page.getByText(headline)).toBeHidden({ timeout: 2000 });

        // Should be visible after 3+ seconds
        await expect(page.getByText(headline)).toBeVisible({ timeout: 3000 });
    });

    test('shows popup when all triggers pass (AND logic)', async ({ page }) => {
        const headline = `AND Logic Popup ${Date.now()}`;
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('AND-Logic-Trigger')
            .withScrollDepthTrigger(30, 'down')
            .withTimeDelayTrigger(3)
            .withTriggerLogic('AND')
            .withoutPageLoadTrigger()
            .withHeadline(headline)
            .withPriority(403)
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Add tall content
        await page.evaluate(() => {
            const div = document.createElement('div');
            div.style.height = '3000px';
            div.style.background = 'linear-gradient(white, lightgreen)';
            document.body.appendChild(div);
        });

        // Scroll to 30% immediately
        await page.evaluate(() => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo(0, scrollHeight * 0.3);
        });

        await page.waitForTimeout(500);

        // Should not be visible yet (scroll met, but time not met)
        await expect(page.getByText(headline)).toBeHidden({ timeout: 2000 });

        // Wait for time trigger (3 seconds total from page load)
        await page.waitForTimeout(2000);

        // Should now be visible (both conditions met)
        await expect(page.getByText(headline)).toBeVisible({ timeout: 2000 });
    });

    test('shows popup when any trigger passes (OR logic)', async ({ page }) => {
        const headline = `OR Logic Popup ${Date.now()}`;
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('OR-Logic-Trigger')
            .withScrollDepthTrigger(80, 'down')
            .withTimeDelayTrigger(3)
            .withTriggerLogic('OR')
            .withoutPageLoadTrigger()
            .withHeadline(headline)
            .withPriority(404)
            .create();

        console.log(`Created campaign: ${campaign.name}`);

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Add tall content
        await page.evaluate(() => {
            const div = document.createElement('div');
            div.style.height = '3000px';
            div.style.background = 'linear-gradient(white, lightyellow)';
            document.body.appendChild(div);
        });

        // Don't scroll - just wait for time trigger
        // Should not be visible within 2 seconds
        await expect(page.getByText(headline)).toBeHidden({ timeout: 2000 });

        // Should be visible after 3 seconds (time trigger met, scroll not needed with OR)
        await expect(page.getByText(headline)).toBeVisible({ timeout: 2000 });
    });
});
