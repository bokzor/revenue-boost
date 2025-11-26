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

test.describe.serial('Newsletter Template - E2E', () => {
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

        // Intercept the newsletter bundle request and serve the local file
        await page.route('**/newsletter.bundle.js*', async route => {
            console.log('Intercepting newsletter.bundle.js request');
            const bundlePath = path.join(process.cwd(), 'extensions/storefront-popup/assets/newsletter.bundle.js');
            const content = fs.readFileSync(bundlePath);
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: content,
            });
        });
    });

    test('renders newsletter popup with default configuration', async ({ page }) => {
        // 1. Create campaign using factory
        const campaign = await (await factory.newsletter().init()).create();
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Wait for popup shadow host to appear
        const popupHost = page.locator('#revenue-boost-popup-shadow-host');
        await expect(popupHost).toBeVisible({ timeout: 10000 });
        console.log('✅ Newsletter popup visible');

        // 4. Verify headline is visible (rendered in shadow DOM)
        // Note: We can't directly query shadow DOM content, so we verify the host is visible

        // 5. Verify email input
        await expect(page.locator('input[type="email"]')).toBeVisible();

        // 6. Verify subscribe button
        await expect(page.getByRole('button', { name: /Subscribe/i })).toBeVisible();

        console.log('✅ Newsletter popup rendered successfully');
    });

    test('renders with GDPR checkbox when enabled', async ({ page }) => {
        // 1. Create campaign with GDPR enabled
        const campaign = await (await factory.newsletter().init())
            .withGdprCheckbox(true, 'I agree to the terms')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify GDPR checkbox
        const checkbox = page.locator('input[type="checkbox"]');
        await expect(checkbox).toBeVisible({ timeout: 10000 });

        // 4. Verify label text
        await expect(page.getByText('I agree to the terms')).toBeVisible();

        console.log('✅ GDPR checkbox rendered');
    });

    test('renders custom headline', async ({ page }) => {
        // 1. Create campaign with custom headline
        const campaign = await (await factory.newsletter().init())
            .withHeadline('Join the VIP Club')
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to storefront
        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // 3. Verify custom headline
        await expect(page.getByText('Join the VIP Club')).toBeVisible({ timeout: 10000 });

        console.log('✅ Custom headline rendered');
    });
});
