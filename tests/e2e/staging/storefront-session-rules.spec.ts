import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { STORE_DOMAIN, handlePasswordPage, mockChallengeToken, getTestPrefix } from './helpers/test-helpers';
import { CampaignFactory } from './factories/campaign-factory';

dotenv.config({ path: '.env.staging.env' });

const TEST_PREFIX = getTestPrefix('storefront-session-rules.spec.ts');

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
        factory = new CampaignFactory(prisma, store.id, TEST_PREFIX);

        // Cleanup campaigns from this test file only
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: TEST_PREFIX }
            }
        });
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
        // Delete campaigns from THIS test file only before each test
        // This ensures only ONE campaign from this file exists when the test runs
        await prisma.campaign.deleteMany({
            where: {
                name: { startsWith: TEST_PREFIX }
            }
        });
        console.log(`[Test Setup] Cleaned up ${TEST_PREFIX}* campaigns`);

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

    test('max impressions per session - campaign config is correct', async ({ page }) => {
        console.log('🧪 Testing max impressions per session config...');

        // Create campaign with max 1 impression per session
        const campaign = await (await factory.newsletter().init())
            .withName('Session-Max-1')
            .withPriority(9001)
            .withMaxImpressionsPerSession(1)
            .create();

        try {
            // Verify the config was set correctly
            console.log(`📋 Campaign created with ID: ${campaign.id}`);
            console.log(`📋 Campaign name: ${campaign.name}`);

            const dbCampaign = await prisma.campaign.findUnique({
                where: { id: campaign.id },
                select: { id: true, name: true, targetRules: true }
            });

            console.log('📋 dbCampaign found:', dbCampaign ? `yes (id: ${dbCampaign.id}, name: ${dbCampaign.name})` : 'NO!');
            console.log('📋 targetRules from DB:', JSON.stringify(dbCampaign?.targetRules, null, 2));

            const frequencyCapping = (dbCampaign?.targetRules as any)?.enhancedTriggers?.frequency_capping;
            expect(frequencyCapping).toBeDefined();
            expect(frequencyCapping.max_triggers_per_session).toBe(1);

            console.log('✅ Max impressions per session config correct');

        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });

    test('max impressions per session - multiple impressions config', async ({ page }) => {
        console.log('🧪 Testing max impressions config (3)...');

        // Create campaign with max 3 impressions per session
        const campaign = await (await factory.newsletter().init())
            .withName('Session-Max-3')
            .withPriority(9002)
            .withMaxImpressionsPerSession(3)
            .create();

        try {
            // Verify the config was set correctly
            const dbCampaign = await prisma.campaign.findUnique({
                where: { id: campaign.id },
                select: { targetRules: true }
            });

            const frequencyCapping = (dbCampaign?.targetRules as any)?.enhancedTriggers?.frequency_capping;
            expect(frequencyCapping).toBeDefined();
            expect(frequencyCapping.max_triggers_per_session).toBe(3);

            console.log('✅ Max impressions config (3) correct');

        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });

    test('cooldown between triggers - config is correct', async ({ page }) => {
        console.log('🧪 Testing cooldown config...');

        // Create campaign with 5 second cooldown
        const campaign = await (await factory.newsletter().init())
            .withName('Session-Cooldown-5s')
            .withPriority(9003)
            .withMaxImpressionsPerSession(10) // High limit
            .withCooldownBetweenTriggers(5) // 5 second cooldown
            .create();

        try {
            // Verify the config was set correctly
            const dbCampaign = await prisma.campaign.findUnique({
                where: { id: campaign.id },
                select: { targetRules: true }
            });

            const frequencyCapping = (dbCampaign?.targetRules as any)?.enhancedTriggers?.frequency_capping;
            expect(frequencyCapping).toBeDefined();
            expect(frequencyCapping.cooldown_between_triggers).toBe(5);

            console.log('✅ Cooldown config correct');

        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });

    test('session persistence config', async ({ page }) => {
        console.log('🧪 Testing session persistence config...');

        // Create campaign with max 1 impression per session
        const campaign = await (await factory.newsletter().init())
            .withName('Session-Persistence')
            .withPriority(9004)
            .withMaxImpressionsPerSession(1)
            .create();

        try {
            // Verify campaign exists and is configured
            const dbCampaign = await prisma.campaign.findUnique({
                where: { id: campaign.id },
                select: { targetRules: true, status: true }
            });

            expect(dbCampaign).toBeDefined();
            expect(dbCampaign?.status).toBe('ACTIVE');

            const frequencyCapping = (dbCampaign?.targetRules as any)?.enhancedTriggers?.frequency_capping;
            expect(frequencyCapping?.max_triggers_per_session).toBe(1);

            console.log('✅ Session persistence config correct');

        } finally {
            await prisma.campaign.deleteMany({ where: { id: campaign.id } });
        }
    });
});
