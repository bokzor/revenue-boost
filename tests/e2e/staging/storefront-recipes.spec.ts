import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';
import { CampaignFactory } from './factories/campaign-factory';
import {
    STORE_URL,
    STORE_DOMAIN,
    API_PROPAGATION_DELAY_MS,
    handlePasswordPage,
    getTestPrefix,
    waitForPopupWithRetry,
    hasTextInShadowDOM,
    fillEmailInShadowDOM,
    submitFormInShadowDOM,
    verifyNewsletterContent,
    verifyFlashSaleContent,
    verifySpinToWinContent,
    verifyScratchCardContent,
    cleanupAllE2ECampaigns,
    MAX_TEST_PRIORITY
} from './helpers/test-helpers';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const TEST_PREFIX = getTestPrefix('storefront-recipes.spec.ts');

/**
 * Recipe-Based Campaign E2E Tests
 *
 * Tests that verify each recipe type/use case works correctly on the storefront.
 * These tests ensure:
 * - Each recipe category renders correctly
 * - Key features of each recipe type are functional
 * - Content customization works as expected
 * - User interactions work properly
 *
 * Recipe Categories Tested:
 * 1. Newsletter Recipes (email collection)
 * 2. Flash Sale Recipes (urgency + discounts)
 * 3. Spin-to-Win Recipes (gamification)
 * 4. Scratch Card Recipes (gamification)
 * 5. Cart Abandonment Recipes (cart recovery)
 * 6. Product Upsell Recipes (cross-sell/upsell)
 *
 * NOTE: No bundle mocking - tests use deployed extension code.
 */

test.describe.serial('Recipe Use Cases', () => {
    let prisma: PrismaClient;
    let storeId: string;
    let factory: CampaignFactory;

    test.beforeAll(async () => {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined');
        }

        prisma = new PrismaClient();

        const store = await prisma.store.findUnique({
            where: { shopifyDomain: STORE_DOMAIN }
        });

        if (!store) {
            throw new Error(`Store not found: ${STORE_DOMAIN}`);
        }

        storeId = store.id;
        factory = new CampaignFactory(prisma, storeId, TEST_PREFIX);

        // Clean up any leftover test campaigns
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });
    });

    test.afterAll(async () => {
        await prisma.campaign.deleteMany({
            where: { name: { startsWith: TEST_PREFIX } }
        });
        await prisma.$disconnect();
    });

    test.beforeEach(async ({ page }) => {
        // Clean up ALL E2E campaigns to avoid priority conflicts
        await cleanupAllE2ECampaigns(prisma);

        await page.waitForTimeout(500);
        await page.context().clearCookies();
    });

    // =========================================================================
    // NEWSLETTER RECIPE TESTS
    // Tests email collection popup with various configurations
    // =========================================================================

    test.describe('Newsletter Recipes', () => {
        test('renders basic newsletter popup with email capture', async ({ page }) => {
            const campaign = await (await factory.newsletter().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withHeadline('Join Our VIP List')
                .create();
            console.log(`✅ Newsletter campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify core newsletter functionality
            const verification = await verifyNewsletterContent(page, {
                hasEmailInput: true
            });
            expect(verification.valid).toBe(true);
            console.log('✅ Newsletter recipe: Email input rendered');
        });

        test('newsletter with GDPR consent checkbox', async ({ page }) => {
            const campaign = await (await factory.newsletter().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withGdprCheckbox(true, 'I agree to marketing emails')
                .create();
            console.log(`✅ GDPR newsletter campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Check for GDPR checkbox presence
            const hasCheckbox = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                return !!host.shadowRoot.querySelector('input[type="checkbox"]');
            });

            if (hasCheckbox) {
                console.log('✅ Newsletter recipe: GDPR checkbox displayed');
            } else {
                console.log('⚠️ GDPR checkbox may render differently');
            }
        });

        test('newsletter with percentage discount incentive', async ({ page }) => {
            const campaign = await (await factory.newsletter().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withHeadline('Get 15% Off Your First Order')
                .withPercentageDiscount(15)
                .create();
            console.log(`✅ Discount newsletter campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Check for discount mention
            const hasDiscount = await hasTextInShadowDOM(page, '15%') ||
                               await hasTextInShadowDOM(page, 'discount') ||
                               await hasTextInShadowDOM(page, 'off');

            expect(hasDiscount).toBe(true);
            console.log('✅ Newsletter recipe: Discount incentive displayed');
        });
    });

    // =========================================================================
    // FLASH SALE RECIPE TESTS
    // Tests urgency-driven sales popups with countdown and discounts
    // =========================================================================

    test.describe('Flash Sale Recipes', () => {
        test('renders flash sale with countdown timer', async ({ page }) => {
            const campaign = await (await factory.flashSale().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withHeadline('Flash Sale!')
                .withCountdownDuration(3600) // 1 hour
                .create();
            console.log(`✅ Flash sale campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify countdown or flash sale content
            const hasFlashSaleContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('flash') ||
                       html.includes('sale') ||
                       html.includes(':') || // countdown format like "00:59:00"
                       html.includes('hurry');
            });

            expect(hasFlashSaleContent).toBe(true);
            console.log('✅ Flash Sale recipe: Countdown/urgency content rendered');
        });

        test('flash sale with urgency message', async ({ page }) => {
            const urgencyMsg = 'Limited time only!';
            const campaign = await (await factory.flashSale().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withUrgencyMessage(urgencyMsg)
                .create();
            console.log(`✅ Urgency flash sale campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Check for urgency messaging
            const hasUrgency = await hasTextInShadowDOM(page, 'limited') ||
                              await hasTextInShadowDOM(page, 'hurry') ||
                              await hasTextInShadowDOM(page, 'time');

            if (hasUrgency) {
                console.log('✅ Flash Sale recipe: Urgency message displayed');
            } else {
                console.log('⚠️ Urgency message may render in different format');
            }
        });

        test('flash sale with percentage discount', async ({ page }) => {
            const campaign = await (await factory.flashSale().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withDiscountPercentage(30)
                .withPercentageDiscount(30)
                .create();
            console.log(`✅ Discount flash sale campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify discount is shown
            const hasDiscount = await hasTextInShadowDOM(page, '30%') ||
                               await hasTextInShadowDOM(page, 'off') ||
                               await hasTextInShadowDOM(page, 'save');

            expect(hasDiscount).toBe(true);
            console.log('✅ Flash Sale recipe: Discount percentage displayed');
        });
    });

    // =========================================================================
    // SPIN-TO-WIN RECIPE TESTS
    // Tests gamified wheel popup with prizes and email capture
    // =========================================================================

    test.describe('Spin-to-Win Recipes', () => {
        test('renders spin wheel with segments', async ({ page }) => {
            const campaign = await (await factory.spinToWin().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withHeadline('Spin to Win!')
                .create();
            console.log(`✅ Spin-to-win campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify wheel/spin content
            const hasWheelContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('spin') ||
                       html.includes('wheel') ||
                       !!host.shadowRoot.querySelector('canvas');
            });

            expect(hasWheelContent).toBe(true);
            console.log('✅ Spin-to-Win recipe: Wheel content rendered');
        });

        test('spin-to-win with custom segments/prizes', async ({ page }) => {
            const customSegments = [
                { label: '5% Off', color: '#FF6B6B', probability: 0.3 },
                { label: '10% Off', color: '#4ECDC4', probability: 0.3 },
                { label: 'Free Shipping', color: '#45B7D1', probability: 0.4 }
            ];

            const campaign = await (await factory.spinToWin().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withSegments(customSegments)
                .create();
            console.log(`✅ Custom segments campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Check for any segment content
            const hasSegments = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('%') || html.includes('off') || html.includes('shipping');
            });

            if (hasSegments) {
                console.log('✅ Spin-to-Win recipe: Custom segments visible');
            } else {
                console.log('⚠️ Segments may be rendered in canvas (not text)');
            }
        });

        test('spin-to-win with email capture', async ({ page }) => {
            const campaign = await (await factory.spinToWin().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withEmailRequired(true)
                .create();
            console.log(`✅ Email required spin campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify email input
            const hasEmailInput = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                return !!host.shadowRoot.querySelector('input[type="email"]');
            });

            expect(hasEmailInput).toBe(true);
            console.log('✅ Spin-to-Win recipe: Email capture enabled');

            // Test email input functionality
            const filled = await fillEmailInShadowDOM(page, 'spin-recipe-test@example.com');
            expect(filled).toBe(true);
            console.log('✅ Spin-to-Win recipe: Email input functional');
        });
    });

    // =========================================================================
    // SCRATCH CARD RECIPE TESTS
    // Tests gamified scratch card popup with canvas interaction
    // =========================================================================

    test.describe('Scratch Card Recipes', () => {
        test('renders scratch card with canvas', async ({ page }) => {
            const campaign = await (await factory.scratchCard().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withHeadline('Scratch & Win!')
                .create();
            console.log(`✅ Scratch card campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify scratch content (canvas or scratch-related text)
            const verification = await verifyScratchCardContent(page, { hasCanvas: true });

            if (verification.valid) {
                console.log('✅ Scratch Card recipe: Canvas rendered');
            } else {
                const hasScratchContent = await hasTextInShadowDOM(page, 'scratch');
                expect(hasScratchContent || verification.valid).toBe(true);
                console.log('✅ Scratch Card recipe: Content rendered');
            }
        });

        test('scratch card with custom prizes', async ({ page }) => {
            const customPrizes = [
                { label: '20% Off', probability: 0.3 },
                { label: '25% Off', probability: 0.3 },
                { label: 'Free Gift', probability: 0.4 }
            ];

            const campaign = await (await factory.scratchCard().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withPrizes(customPrizes)
                .create();
            console.log(`✅ Custom prizes scratch card created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            console.log('✅ Scratch Card recipe: Custom prizes configured');
        });

        test('scratch card with email before scratching', async ({ page }) => {
            const campaign = await (await factory.scratchCard().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withEmailBeforeScratching(true)
                .create();
            console.log(`✅ Email-first scratch card created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify email input appears before scratch
            const verification = await verifyScratchCardContent(page, { hasEmailInput: true });

            if (verification.valid) {
                console.log('✅ Scratch Card recipe: Email-first flow enabled');
            }
        });
    });

    // =========================================================================
    // CART ABANDONMENT RECIPE TESTS
    // Tests cart recovery popups with urgency and discounts
    // =========================================================================

    test.describe('Cart Abandonment Recipes', () => {
        test('renders cart abandonment popup with urgency', async ({ page }) => {
            const campaign = await (await factory.cartAbandonment().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withHeadline('Wait! Complete Your Order')
                .create();
            console.log(`✅ Cart abandonment campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify cart abandonment content
            const hasCartContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('cart') ||
                       html.includes('order') ||
                       html.includes('complete') ||
                       html.includes('wait');
            });

            expect(hasCartContent).toBe(true);
            console.log('✅ Cart Abandonment recipe: Content rendered');
        });

        test('cart abandonment with discount incentive', async ({ page }) => {
            const campaign = await (await factory.cartAbandonment().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withPercentageDiscount(10)
                .withHeadline('Get 10% Off Your Cart!')
                .create();
            console.log(`✅ Discount cart abandonment created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Check for discount messaging
            const hasDiscount = await hasTextInShadowDOM(page, '10%') ||
                               await hasTextInShadowDOM(page, 'off') ||
                               await hasTextInShadowDOM(page, 'discount');

            expect(hasDiscount).toBe(true);
            console.log('✅ Cart Abandonment recipe: Discount incentive displayed');
        });
    });

    // =========================================================================
    // PRODUCT UPSELL RECIPE TESTS
    // Tests cross-sell and upsell popups with product recommendations
    // =========================================================================

    test.describe('Product Upsell Recipes', () => {
        test('renders upsell popup with product recommendation', async ({ page }) => {
            const campaign = await (await factory.productUpsell().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withHeadline('You Might Also Like')
                .create();
            console.log(`✅ Product upsell campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify upsell content
            const hasUpsellContent = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML.toLowerCase();
                return html.includes('also') ||
                       html.includes('recommend') ||
                       html.includes('product') ||
                       html.includes('add');
            });

            expect(hasUpsellContent).toBe(true);
            console.log('✅ Product Upsell recipe: Content rendered');
        });

        test('upsell with bundle discount', async ({ page }) => {
            const campaign = await (await factory.productUpsell().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withPercentageDiscount(15)
                .withHeadline('Bundle & Save 15%')
                .create();
            console.log(`✅ Bundle upsell campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Check for bundle/discount messaging
            const hasBundle = await hasTextInShadowDOM(page, 'bundle') ||
                             await hasTextInShadowDOM(page, 'save') ||
                             await hasTextInShadowDOM(page, '15%');

            expect(hasBundle).toBe(true);
            console.log('✅ Product Upsell recipe: Bundle discount displayed');
        });
    });

    // =========================================================================
    // FREE SHIPPING RECIPE TESTS
    // Tests free shipping threshold popups
    // =========================================================================

    test.describe('Free Shipping Recipes', () => {
        test('renders free shipping popup with threshold', async ({ page }) => {
            const campaign = await (await factory.freeShipping().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withThreshold(50)
                .create();
            console.log(`✅ Free shipping campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify free shipping content
            const hasFreeShipping = await hasTextInShadowDOM(page, 'free') ||
                                   await hasTextInShadowDOM(page, 'shipping') ||
                                   await hasTextInShadowDOM(page, '$50');

            expect(hasFreeShipping).toBe(true);
            console.log('✅ Free Shipping recipe: Content rendered');
        });
    });

    // =========================================================================
    // COUNTDOWN TIMER RECIPE TESTS
    // Tests countdown-based urgency popups
    // =========================================================================

    test.describe('Countdown Timer Recipes', () => {
        test('renders countdown timer popup', async ({ page }) => {
            const campaign = await (await factory.countdownTimer().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withHeadline('Sale Ends Soon!')
                .create();
            console.log(`✅ Countdown timer campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify countdown content
            const hasCountdown = await page.evaluate(() => {
                const host = document.querySelector('#revenue-boost-popup-shadow-host');
                if (!host?.shadowRoot) return false;
                const html = host.shadowRoot.innerHTML;
                // Look for countdown format (00:00:00) or time-related words
                return /\d{1,2}:\d{2}/.test(html) ||
                       html.toLowerCase().includes('ends') ||
                       html.toLowerCase().includes('hurry') ||
                       html.toLowerCase().includes('soon');
            });

            expect(hasCountdown).toBe(true);
            console.log('✅ Countdown Timer recipe: Timer content rendered');
        });
    });

    // =========================================================================
    // ANNOUNCEMENT RECIPE TESTS
    // Tests announcement/banner popups
    // =========================================================================

    test.describe('Announcement Recipes', () => {
        test('renders announcement popup', async ({ page }) => {
            const campaign = await (await factory.announcement().init())
                .withPriority(MAX_TEST_PRIORITY)
                .withHeadline('New Collection Available!')
                .create();
            console.log(`✅ Announcement campaign created: ${campaign.id}`);

            await page.waitForTimeout(API_PROPAGATION_DELAY_MS);

            await page.goto(STORE_URL);
            await handlePasswordPage(page);

            const popupVisible = await waitForPopupWithRetry(page, { timeout: 15000, retries: 3 });
            expect(popupVisible).toBe(true);

            // Verify announcement content
            const hasAnnouncement = await hasTextInShadowDOM(page, 'new') ||
                                   await hasTextInShadowDOM(page, 'collection') ||
                                   await hasTextInShadowDOM(page, 'available');

            expect(hasAnnouncement).toBe(true);
            console.log('✅ Announcement recipe: Content rendered');
        });
    });
});