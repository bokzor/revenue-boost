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

        // 3. Wait for popup to appear
        const popup = page.locator('[data-splitpop="true"], [class*="SpinToWin"]');
        try {
            await expect(popup).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.log('❌ Popup not found. Dumping body HTML:');
            console.log(await page.innerHTML('body'));
            throw e;
        }

        // 4. Verify headline
        await expect(page.getByText(/Spin & Win!/i)).toBeVisible();

        // 5. Verify wheel is rendered
        const wheel = page.locator('canvas');
        await expect(wheel).toBeVisible();

        console.log('✅ Spin to Win popup rendered successfully');
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

        // 3. Verify custom headline
        await expect(page.getByText('Custom Wheel!')).toBeVisible({ timeout: 10000 });

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

        // 3. Wait for popup
        await expect(page.locator('[data-splitpop="true"]')).toBeVisible({ timeout: 10000 });

        // 4. Verify email input is present
        const emailInput = page.locator('input[type="email"]');
        await expect(emailInput).toBeVisible();

        //  5. Try to spin without email (button should be disabled or require email first)
        const spinButton = page.locator('button:has-text("Spin"), button:has-text("Spin Now")');

        // If button is enabled, clicking might show validation
        if (await spinButton.isEnabled().catch(() => false)) {
            await spinButton.click();
            // Should see validation message - the EmailInput component renders it with id="email-error"
            const validationMessage = page.locator('#email-error');
            await expect(validationMessage).toBeVisible({ timeout: 3000 });
        }

        console.log('✅ Email validation working');
    });

    test('can set high priority to ensure selection', async ({ page }) => {
        // 1. Create campaign with very high priority
        const campaign = await (await factory.spinToWin().init())
            .withPriority(20)
            .withName('HighPriority')
            .create();

        console.log(`✅ High priority campaign created: ${campaign.id} `);

        // 2. Setup console listener BEFORE navigation
        const logs: string[] = [];
        page.on('console', msg => {
            console.log(`[BROWSER LOG]: ${msg.text()}`);
            if (msg.text().includes('Selected campaigns')) {
                logs.push(msg.text());
            }
        });

        // 3. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Wait for campaigns to load
        await page.waitForTimeout(3000);

        // 4. The high priority campaign should be mentioned in logs
        const hasHighPriorityCampaign = logs.some(log => log.includes('HighPriority'));
        expect(hasHighPriorityCampaign).toBeTruthy();

        console.log('✅ High priority campaign selected');
    });
});
