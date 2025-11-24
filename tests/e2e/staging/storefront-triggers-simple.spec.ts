import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import { STORE_URL, handlePasswordPage, mockChallengeToken } from './helpers/test-helpers';

// Load staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

test.describe.configure({ mode: 'serial' });

test.describe('Trigger Combinations - Simple Test', () => {
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

    test('shows popup with default config', async ({ page }) => {
        const headline = `Simple Test ${Date.now()}`;
        const builder = factory.newsletter();
        await builder.init();
        const campaign = await builder
            .withName('Simple-Test')
            .withHeadline(headline)
            .withPriority(500)
            .create();

        console.log(`Created campaign: ${campaign.name} with ID: ${campaign.id}`);
        console.log(`Campaign status: ${campaign.status}`);
        console.log(`Campaign targetRules:`, JSON.stringify(campaign.targetRules, null, 2));

        await page.goto(STORE_URL);
        await handlePasswordPage(page);

        // Should be visible
        await expect(page.getByText(headline)).toBeVisible({ timeout: 10000 });
    });
});
