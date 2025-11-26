import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { STORE_DOMAIN, handlePasswordPage, mockChallengeToken } from './helpers/test-helpers';
import { CampaignFactory } from './factories/campaign-factory';

dotenv.config({ path: '.env.staging.env' });

/**
 * Session Rules & Frequency Capping E2E Tests
 * 
 * Tests session rules and frequency capping configurations:
 * - Max impressions per session
 * - Cooldown between triggers
 * - Session persistence across page reloads
 */

test.describe('Session Rules & Frequency Capping', () => {
    let prisma: PrismaClient;
    let factory: CampaignFactory;
    let store: { id: string };

    test.beforeAll(async () => {
        prisma = new PrismaClient();

        const foundStore = await prisma.store.findUnique({
            where: { shopifyDomain: STORE_DOMAIN }
        });

        if (!foundStore) {
            throw new Error(`Store not found: ${STORE_DOMAIN}`);
        }

        store = foundStore;
        factory = new CampaignFactory(prisma, store.id);

        // Cleanup old test campaigns
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: 'E2E-Test-' }
            }
        });
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        // CRITICAL: Delete ALL E2E test campaigns before each test
        // This ensures only ONE campaign exists when the test runs
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: 'E2E-Test-' }
            }
        });
        console.log('[Test Setup] Cleaned up all E2E test campaigns');

        // Wait for cleanup to propagate to the API server
        // Cloud Run may have cached campaign data
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('[Test Setup] Waited for cleanup to propagate');

        // Mock challenge tokens to avoid rate limits
        await mockChallengeToken(page);

        // Log browser console messages for debugging
        page.on('console', msg => {
            console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
        });
    });

    test('max impressions per session - shows only once', async ({ page }) => {
        console.log('🧪 Testing max impressions per session (1)...');

        // Create campaign with max 1 impression per session
        const campaign = await (await factory.newsletter().init())
            .withName('Session-Max-1')
            .withPriority(9001)
            .withMaxImpressionsPerSession(1)
            .create();

        try {
            // Visit 1: Should show popup
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);

            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });
            console.log('✅ Popup shown on first visit');

            // Close popup with Escape key
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);

            // Visit 2: Should NOT show popup (same session)
            await page.reload();
            await handlePasswordPage(page);
            await page.waitForTimeout(3000);

            const popupVisible = await popupHost.isVisible().catch(() => false);
            expect(popupVisible).toBeFalsy();
            console.log('✅ Popup not shown on second visit (max impressions reached)');

        } finally {
            await prisma.campaign.delete({ where: { id: campaign.id } });
        }
    });

    test('max impressions per session - shows 3 times', async ({ page }) => {
        console.log('🧪 Testing max impressions per session (3)...');

        // Create campaign with max 3 impressions per session
        const campaign = await (await factory.newsletter().init())
            .withName('Session-Max-3')
            .withPriority(9002)
            .withMaxImpressionsPerSession(3)
            .create();

        try {
            const popupHost = page.locator('#revenue-boost-popup-shadow-host');

            for (let i = 1; i <= 4; i++) {
                console.log(`Visit ${i}...`);
                await page.goto(`https://${STORE_DOMAIN}`);
                if (i === 1) await handlePasswordPage(page);

                if (i <= 3) {
                    // Should show for first 3 visits
                    await expect(popupHost).toBeVisible({ timeout: 10000 });
                    console.log(`✅ Visit ${i}: Popup showed (${i}/3)`);

                    // Close popup with Escape key
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(1000);
                } else {
                    // Should NOT show on 4th visit
                    await page.waitForTimeout(3000);
                    const popupVisible = await popupHost.isVisible().catch(() => false);
                    expect(popupVisible).toBeFalsy();
                    console.log('✅ Visit 4: Popup correctly hidden (limit reached)');
                }
            }

        } finally {
            await prisma.campaign.delete({ where: { id: campaign.id } });
        }
    });

    test('cooldown between triggers - enforces wait time', async ({ page }) => {
        console.log('🧪 Testing cooldown between triggers (5 seconds)...');

        // Create campaign with 5 second cooldown
        const campaign = await (await factory.newsletter().init())
            .withName('Session-Cooldown-5s')
            .withPriority(9003)
            .withMaxImpressionsPerSession(10) // High limit
            .withCooldownBetweenTriggers(5) // 5 second cooldown
            .create();

        try {
            // Visit 1: Should show immediately
            console.log('Visit 1: Should show immediately...');
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);

            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });
            console.log('✅ Popup showed on visit 1');

            // Close popup with Escape key
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);

            // Visit 2: Immediately after (should be blocked by cooldown)
            console.log('Visit 2: Immediately after (should be blocked)...');
            await page.reload();
            await handlePasswordPage(page);
            await page.waitForTimeout(3000);

            let popupVisible = await popupHost.isVisible().catch(() => false);
            expect(popupVisible).toBeFalsy();
            console.log('✅ Popup correctly blocked during cooldown');

            // Wait for cooldown to expire
            console.log('Waiting 6 seconds for cooldown to expire...');
            await page.waitForTimeout(6000);

            // Visit 3: After cooldown (should show again)
            console.log('Visit 3: After cooldown (should show)...');
            await page.reload();
            await handlePasswordPage(page);

            await expect(popupHost).toBeVisible({ timeout: 10000 });
            console.log('✅ Popup showed again after cooldown expired');

        } finally {
            await prisma.campaign.delete({ where: { id: campaign.id } });
        }
    });

    test('session persists across page reloads', async ({ page }) => {
        console.log('🧪 Testing session persistence across reloads...');

        // Create campaign with max 1 impression per session
        const campaign = await (await factory.newsletter().init())
            .withName('Session-Persistence')
            .withPriority(9004)
            .withMaxImpressionsPerSession(1)
            .create();

        try {
            // Visit homepage
            console.log('Visit homepage and see popup...');
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);

            const popupHost = page.locator('#revenue-boost-popup-shadow-host');
            await expect(popupHost).toBeVisible({ timeout: 10000 });
            console.log('✅ Popup showed on homepage');

            // Close popup with Escape key
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);

            // Navigate to a product page (different URL, same session)
            console.log('Navigate to different page...');
            await page.goto(`https://${STORE_DOMAIN}/collections/all`);
            await handlePasswordPage(page);
            await page.waitForTimeout(3000);

            let popupVisible = await popupHost.isVisible().catch(() => false);
            expect(popupVisible).toBeFalsy();
            console.log('✅ Popup correctly hidden on different page (same session)');

            // Reload the same page
            console.log('Reload page...');
            await page.reload();
            await handlePasswordPage(page);
            await page.waitForTimeout(3000);

            popupVisible = await popupHost.isVisible().catch(() => false);
            expect(popupVisible).toBeFalsy();
            console.log('✅ Session persisted across reload');

        } finally {
            await prisma.campaign.delete({ where: { id: campaign.id } });
        }
    });
});
