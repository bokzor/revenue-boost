import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import './helpers/load-staging-env';
import { mockChallengeToken } from './helpers/test-helpers';


const STORE_URL = 'https://revenue-boost-staging.myshopify.com';
const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';
const STORE_PASSWORD = 'a';
const CAMPAIGN_NAME = 'E2E-Staging-Test-SpinWin';

test.describe('Staging Storefront E2E', () => {
    let prisma: PrismaClient;
    let storeId: string;

    test.beforeAll(async () => {
        // Ensure DATABASE_URL is set
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined. Run with dotenv -e .env.staging.env');
        }
        prisma = new PrismaClient();

        // Upsert store to ensure it exists (bypassing potential webhook issues)
        const store = await prisma.store.upsert({
            where: { shopifyDomain: STORE_DOMAIN },
            update: {},
            create: {
                shopifyDomain: STORE_DOMAIN,
                shopifyShopId: 8888888888n, // Dummy ID for E2E
                accessToken: 'dummy_token_e2e',
                isActive: true,
                planTier: 'GROWTH',
            },
        });

        storeId = store.id;
        console.log(`✅ Found/Created store ID: ${storeId}`);
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        await mockChallengeToken(page);
        // Clean up any existing test campaigns
        await prisma.campaign.deleteMany({
            where: {
                name: CAMPAIGN_NAME,
            },
        });
    });

    test('Should display Spin to Win popup on storefront', async ({ page }) => {
        // Setup console logging for debugging
        page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));

        // Log network requests for debugging
        page.on('request', request => console.log(`>> ${request.method()} ${request.url()}`));
        page.on('response', response => console.log(`<< ${response.status()} ${response.url()}`));

        // 1. Seed Campaign
        console.log('🌱 Seeding campaign...');

        // First, get the SPIN_TO_WIN template ID
        const spinToWinTemplate = await prisma.template.findFirst({
            where: { templateType: 'SPIN_TO_WIN' }
        });

        if (!spinToWinTemplate) {
            throw new Error('SPIN_TO_WIN template not found in database. Please seed templates first.');
        }

        const campaign = await prisma.campaign.create({
            data: {
                name: CAMPAIGN_NAME,
                storeId: storeId,
                templateId: spinToWinTemplate.id,  // Required for proper loading
                templateType: 'SPIN_TO_WIN',
                goal: 'NEWSLETTER_SIGNUP',
                status: 'ACTIVE',
                priority: 10,  // High priority to ensure this campaign is selected over others
                // Use complete targetRules structure matching manually created campaigns
                targetRules: {
                    pageTargeting: {
                        enabled: false,
                        pages: [],
                        excludePages: [],
                        collections: [],
                        productTags: [],
                        customPatterns: []
                    },
                    enhancedTriggers: {
                        enabled: true,
                        page_load: {
                            enabled: true,
                            delay: 0
                        },
                        device_targeting: {
                            enabled: true,
                            device_types: ['desktop', 'tablet', 'mobile']
                        },
                        frequency_capping: {
                            max_triggers_per_session: 1,
                            max_triggers_per_day: 1,
                            cooldown_between_triggers: 86400
                        }
                    },
                    audienceTargeting: {
                        enabled: false,
                        shopifySegmentIds: [],
                        sessionRules: {
                            enabled: false,
                            conditions: [],
                            logicOperator: 'AND'
                        }
                    }
                },
                contentConfig: {
                    headline: 'Spin & Win!',
                    subheadline: 'Try your luck',
                    wheelSegments: [
                        { id: '1', label: '10% Off', color: '#FF6B6B', probability: 25 },
                        { id: '2', label: '15% Off', color: '#4ECDC4', probability: 25 },
                        { id: '3', label: '20% Off', color: '#45B7D1', probability: 25 },
                        { id: '4', label: 'Free Shipping', color: '#FFA07A', probability: 25 },
                    ],
                },
                designConfig: {
                    theme: 'default'
                },
            },
        });
        console.log(`✅ Campaign created: ${campaign.id}`);

        // 2. Navigate to Storefront
        console.log('🌍 Navigating to storefront...');
        await page.goto(STORE_URL);

        // 3. Handle Password Page
        const passwordInput = page.locator('input[type="password"]');
        if (await passwordInput.isVisible()) {
            console.log('🔒 Password page detected, logging in...');
            await passwordInput.fill(STORE_PASSWORD);
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
        }

        // 4. Verify Popup
        console.log('👀 Waiting for popup...');
        // Wait for the popup container or specific element
        // Using a generic selector        console.log('👀 Waiting for popup...');

        // Wait a bit for the popup manager to initialize and process campaigns
        await page.waitForTimeout(5000);

        // Log all console messages including from the popup loader
        const allmessages = await page.evaluate(() => {
            return (window as any).__splitpopDebugLogs || 'No debug logs found';
        });
        console.log('[TEST] SplitPop Debug Logs:', allmessages);

        // Check if the popup manager initialized
        const hasPopupManager = await page.evaluate(() => {
            return !!(window as any).SplitPopManager || !!(window as any).RevenueBooststorefront;
        });
        console.log('[TEST] Popup Manager initialized:', hasPopupManager);

        // Check the DOM for any splitpop-related elements
        const splitpopElements = await page.evaluate(() => {
            const elements = document.querySelectorAll('[data-splitpop], [class*="splitpop"], [class*="SpinToWin"], [id*="popup"]');
            return Array.from(elements).map(el => ({
                tag: el.tagName,
                class: el.className,
                id: el.id,
                visible: el.checkVisibility ? el.checkVisibility() : false,
                display: window.getComputedStyle(el).display
            }));
        });
        console.log('[TEST] SplitPop-related elements:', splitpopElements);

        const popup = page.locator('#revenue-boost-popup-shadow-host');

        await expect(popup).toBeVisible({ timeout: 10000 });
        console.log('✅ Popup is visible!');
    });
});
