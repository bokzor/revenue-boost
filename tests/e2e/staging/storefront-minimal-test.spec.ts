import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';
import { STORE_DOMAIN, handlePasswordPage, mockChallengeToken, getTestPrefix } from './helpers/test-helpers';
import { CampaignFactory } from './factories/campaign-factory';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-minimal-test.spec.ts');

/**
 * MINIMAL REPRODUCTION TEST
 *
 * This test creates the simplest possible campaign to isolate
 * why campaigns aren't showing up on the storefront.
 */

test.describe('Minimal Reproduction', () => {
    let prisma: PrismaClient;
    let factory: CampaignFactory;
    let store: { id: string };

    test.beforeAll(async () => {
        console.log('[DEBUG] DATABASE_URL:', (process.env.DATABASE_URL || '').substring(0, 60));
        prisma = new PrismaClient();

        // Verify which database we're connected to
        const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_user`;
        console.log('[DEBUG] Connected to database:', dbInfo);

        const foundStore = await prisma.store.findUnique({
            where: { shopifyDomain: STORE_DOMAIN }
        });

        if (!foundStore) {
            throw new Error(`Store not found: ${STORE_DOMAIN}`);
        }

        store = foundStore;
        factory = new CampaignFactory(prisma, store.id, TEST_PREFIX);

        // Cleanup campaigns from this test file only
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: TEST_PREFIX }
            }
        });

        console.log('🧹 Cleaned up old test campaigns');
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
        await mockChallengeToken(page);
    });

    test('minimal campaign appears in API and on storefront', async ({ page }) => {
        console.log('\n🧪 MINIMAL REPRODUCTION TEST\n');
        console.log('===============================\n');

        // 1. Create campaign with Name and Priority overrides (but NO explicit frequency capping)
        console.log('\nStep 1: Creating minimal campaign (Name + Priority)...');
        const campaign = await (await factory.newsletter().init())
            .withName('E2E-Test-MINIMAL-TEST')
            .withPriority(999)
            .create();

        console.log(`✅ Campaign created: ${campaign.id}`);
        console.log(`   Name: ${campaign.name}`);
        console.log(`   Priority: ${campaign.priority}`);
        console.log(`   Status: ${campaign.status}`);
        console.log(`   Template: ${campaign.templateType}`);

        // Log the full campaign config for debugging
        console.log('\n📋 Full campaign config:');
        console.log('   targetRules:', JSON.stringify(campaign.targetRules, null, 2));
        console.log('   discountConfig:', JSON.stringify(campaign.discountConfig, null, 2));

        try {
            // Set up API monitoring
            console.log('\nStep 2: Setting up API monitoring...');
            let apiCampaigns: any[] = [];

            page.on('response', async response => {
                if (response.url().includes('/api/campaigns')) {
                    console.log(`\n📡 API Call URL: ${response.url()}`);
                    console.log(`   Status: ${response.status()}`);

                    if (response.status() === 200) {
                        try {
                            const json = await response.json();
                            apiCampaigns = json.campaigns || [];
                            console.log(`   Total campaigns: ${apiCampaigns.length}`);
                            if (apiCampaigns.length > 0) {
                                apiCampaigns.forEach((c: any, i: number) => {
                                    console.log(`   ${i + 1}. ${c.name} (priority: ${c.priority}, id: ${c.id})`);
                                });
                            }
                        } catch (e) {
                            console.error('   ❌ Failed to parse API response');
                        }
                    }
                }
            });

            // Log browser console
            page.on('console', msg => {
                const text = msg.text();
                if (text.includes('[Revenue Boost]')) {
                    console.log(`   [BROWSER] ${text}`);
                }
            });

            // Visit storefront
            console.log('\nStep 3: Visiting storefront...');

            // Clear all storage to ensure fresh visitor/session IDs
            await page.context().clearCookies();
            await page.goto(`https://${STORE_DOMAIN}`);
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });

            // Now visit again with clean state
            await page.goto(`https://${STORE_DOMAIN}`);
            await handlePasswordPage(page);
            await page.waitForLoadState('domcontentloaded');

            // Wait a bit for API call
            await page.waitForTimeout(4000);

            // Check if our campaign was returned
            console.log('\nStep 4: Checking API results...');
            console.log(`   Our campaign ID: ${campaign.id}`);
            console.log(`   Campaigns returned by API: ${apiCampaigns.length}`);
            if (apiCampaigns.length > 0) {
                apiCampaigns.forEach((c: any, i: number) => {
                    console.log(`   ${i + 1}. ${c.name} (${c.id}) - priority: ${c.priority}`);
                });
            }

            const ourCampaign = apiCampaigns.find((c: any) => c.id === campaign.id);

            if (!ourCampaign) {
                console.log(`\n❌ PROBLEM: Our campaign ${campaign.id} was NOT returned by API`);
                console.log(`   API returned ${apiCampaigns.length} campaigns total`);

                // Verify it still exists in database
                const dbCampaign = await prisma.campaign.findUnique({
                    where: { id: campaign.id },
                    select: { id: true, name: true, status: true, priority: true }
                });

                if (dbCampaign) {
                    console.log(`   ✅ Campaign still exists in DB: ${JSON.stringify(dbCampaign)}`);
                    console.log(`   ⚠️  CONCLUSION: Campaign is being filtered out by server-side logic`);
                } else {
                    console.log(`   ❌ Campaign was deleted from DB!`);
                }

                throw new Error('Campaign not returned by API - filtering issue confirmed');
            }

            console.log(`\n✅ SUCCESS: Campaign ${campaign.id} was returned by API`);

            // Now check if popup appears
            console.log('\nStep 5: Checking if popup appears...');
            const popup = page.locator('#revenue-boost-popup-shadow-host');

            try {
                await expect(popup).toBeVisible({ timeout: 10000 });
                console.log('✅ Popup appeared on storefront!');
                console.log('\n🎉 MINIMAL TEST PASSED - Campaign is working correctly\n');
            } catch (e) {
                console.log('❌ Popup did NOT appear');
                console.log('   Campaign was returned by API but popup not shown');
                console.log('   This indicates a client-side issue (triggers, rendering, etc.)');
                throw e;
            }

        } finally {
            // Don't cleanup - leave for manual inspection
            console.log(`\n⚠️  Leaving campaign ${campaign.id} in DB for inspection`);
            console.log(`   Run cleanup script to remove: npx tsx scripts/cleanup-e2e-campaigns.ts\n`);
        }
    });
});
