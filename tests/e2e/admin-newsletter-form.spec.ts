/**
 * ADMIN E2E TEST - NEWSLETTER CAMPAIGN CREATION
 *
 * This test creates a complete Newsletter campaign through the admin UI,
 * filling in all form fields across all wizard steps, then verifies the
 * campaign was saved correctly in the database.
 *
 * Test Flow:
 * 1. Navigate to new campaign page
 * 2. Select NEWSLETTER_SIGNUP goal
 * 3. Select Newsletter template
 * 4. Fill in all content fields
 * 5. Configure targeting & triggers
 * 6. Configure frequency capping
 * 7. Save campaign
 * 8. Verify database state
 *
 * Prerequisites:
 * - App server running: npm run dev
 * - Mock-bridge running on port 3080
 */

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const MOCK_ADMIN_URL = process.env.MOCK_ADMIN_URL || 'http://localhost:3080';
const TEST_STORE_ID = process.env.TEST_STORE_ID || 'test_store_001';

test.describe('Admin - Newsletter Campaign Creation', () => {
  let prisma: PrismaClient;

  test.beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.beforeEach(async () => {
    // Clean up any existing test campaigns
    await prisma.campaign.deleteMany({
      where: {
        name: {
          contains: 'E2E Test Newsletter',
        },
      },
    });
  });

  test('should create a complete Newsletter campaign with all fields filled', async ({ page }) => {
    console.log('🧪 Starting Newsletter campaign creation test...');



    // Capture console logs and page errors from the app (including iframe)
    page.on('console', (msg) => {
      console.log(`[PW][console] ${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      console.log('[PW][pageerror]', err.message);
    });

    // ========== STEP 1: Navigate to mock admin and find app iframe ==========
    console.log('📍 Step 1: Navigating to mock admin...');
    await page.goto(MOCK_ADMIN_URL);


    // Wait for app iframe to load
    console.log('⏳ Waiting for app iframe...');
    const appFrame = page.frameLocator('#app-iframe');
    await expect(appFrame.locator('body')).toBeVisible({ timeout: 15000 });

    console.log('✅ App iframe loaded, navigating to campaigns page...');

    // ========== STEP 2: Navigate directly to new campaign page ==========
    console.log('📍 Step 2: Navigating directly to new campaign page...');
    await appFrame.locator('body').evaluate(() => {
      const url = new URL(window.location.href);
      window.location.href = `/app/campaigns/new${url.search}`;
    });
    await appFrame.locator('body').waitFor({ state: 'visible', timeout: 15000 });

    // ========== STEP 3: Select NEWSLETTER_SIGNUP goal ==========
    console.log('📍 Step 3: Selecting NEWSLETTER_SIGNUP goal...');
    const goalCard = appFrame.locator('[data-testid="goal-newsletter-signup"]');
    await expect(goalCard).toBeVisible({ timeout: 15000 });
    await goalCard.click();
    await page.waitForTimeout(1000);

    // Fill in campaign name and description
    console.log('📝 Filling campaign name and description...');
    await appFrame.locator('input[name="campaignName"]').fill('E2E Test Newsletter Campaign');
    await appFrame.locator('textarea[name="campaignDescription"]').fill('Automated E2E test campaign for newsletter signup');

    // Click Next to go to Design step
    console.log('➡️ Clicking Next to Design step...');
    await appFrame.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(2000);

    // ========== STEP 4: Select Newsletter template ==========
    console.log('📍 Step 4: Selecting Newsletter template...');

    // Wait for the template selector section to render
    await expect(
      appFrame.getByRole('heading', { name: 'Select a Template' })
    ).toBeVisible({ timeout: 15000 });

    // Wait for templates to finish loading ("Loading templates..." disappears)
    const loadingText = appFrame.locator('text=Loading templates...');
    try {
      await loadingText.waitFor({ state: 'detached', timeout: 15000 });
    } catch {
      // If the loading text never appeared or is already gone, that's fine
    }

    // Now select the specific Newsletter Signup template card by test id
    const templateCard = appFrame.locator('[data-testid="template-SYSTEM_newsletter_signup"]');
    await expect(templateCard).toBeVisible({ timeout: 10000 });
    await templateCard.click();
    await page.waitForTimeout(1000);

    // ========== STEP 5: Fill in all Newsletter content fields ==========
    console.log('📍 Step 5: Filling Newsletter content fields...');
    await appFrame.locator('input[name="content.headline"]').fill('Get 15% Off Your First Order!');
    await appFrame.locator('input[name="content.subheadline"]').fill('Join our newsletter for exclusive deals and updates');
    await appFrame.locator('input[name="content.buttonText"]').fill('Subscribe Now');
    await appFrame.locator('input[name="content.emailLabel"]').fill('Your Email');
    await appFrame.locator('input[name="content.emailPlaceholder"]').fill('you@example.com');
    await appFrame.locator('input[name="content.successMessage"]').fill('Thanks for subscribing! Check your inbox.');
    await appFrame.locator('input[name="content.failureMessage"]').fill('Oops! Something went wrong. Please try again.');

    // Enable name field and consent checkbox
    await appFrame.locator('input[name="content.nameFieldEnabled"]').check();
    await appFrame.locator('input[name="content.consentFieldEnabled"]').check();

    console.log('✅ All Newsletter content fields filled');

    // Navigate to Targeting step via stepper (more reliable than footer Next)
    console.log('➡️ Navigating to Targeting step via stepper...');
    await appFrame.getByRole('button', { name: /Step 3: Targeting & Triggers/ }).click();
    await page.waitForTimeout(2000);

    // ========== STEP 6: Configure Targeting & Triggers ==========
    console.log('📍 Step 6: Configuring targeting & triggers...');

    // Enable audience targeting (optional - can be left disabled for this test)
    // For now, we'll leave it disabled to keep the test simple

    // Navigate to Frequency Capping step via stepper
    console.log('➡️ Navigating to Frequency Capping step via stepper...');
    await appFrame.getByRole('button', { name: /Step 4: Frequency Capping/ }).click();
    await page.waitForTimeout(2000);

    // ========== STEP 7: Configure Frequency Capping ==========
    console.log('📍 Step 7: Configuring frequency capping...');

    // Enable frequency capping
    const frequencyCappingCheckbox = appFrame.getByRole('checkbox', { name: 'Enable frequency capping' });
    await expect(frequencyCappingCheckbox).toBeVisible({ timeout: 10000 });
    await frequencyCappingCheckbox.check();
    await page.waitForTimeout(1000);

    // Fill in frequency limits
    await appFrame.getByLabel('Max triggers per session').fill('1');
    await appFrame.getByLabel('Max triggers per day').fill('2');
    await appFrame.getByLabel('Cooldown between triggers (seconds)').fill('3600');

    console.log('✅ Frequency capping configured');

    // Navigate to Schedule step via stepper
    console.log('➡️ Navigating to Schedule step via stepper...');
    await appFrame.getByRole('button', { name: /Step 5: Schedule & Settings/ }).click();
    await page.waitForTimeout(2000);

    // ========== STEP 8: Save the campaign ==========
    console.log('📍 Step 8: Saving campaign...');

    // Click Save/Create Campaign button (use the footer wizard button, not the header one)
    const saveButton = appFrame.getByRole('button', { name: /Create Campaign|Save Changes/ }).last();
    await expect(saveButton).toBeVisible({ timeout: 10000 });
    await page.pause();

    await saveButton.click();
    await page.pause();

    // Handle post-save activation modal if it appears
    const activateModal = appFrame.getByRole('dialog', { name: 'Activate Campaign' });
    let modalVisible = false;
    try {
      modalVisible = await activateModal.isVisible({ timeout: 5000 });
    } catch {
      modalVisible = false;
    }

    if (modalVisible) {
      console.log('[TEST] Activate Campaign modal is visible, clicking "Not now"');
      await activateModal.getByRole('button', { name: 'Not now' }).click();
    }
    await page.pause();

    console.log('✅ Campaign save flow completed');

    // ========== STEP 9: Verify database state ==========
    console.log('📍 Step 9: Verifying database state...');

    // Query the database for the created campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        name: 'E2E Test Newsletter Campaign',
        storeId: TEST_STORE_ID,
      },
    });
    await page.pause();

    // Verify campaign exists
    expect(campaign).toBeTruthy();
    console.log(`✅ Campaign found in database: ${campaign?.id}`);

    // Verify basic fields
    expect(campaign?.name).toBe('E2E Test Newsletter Campaign');
    expect(campaign?.description).toBe('Automated E2E test campaign for newsletter signup');
    expect(campaign?.goal).toBe('NEWSLETTER_SIGNUP');
    expect(campaign?.templateType).toBe('NEWSLETTER');

    // Verify contentConfig
    const contentConfig = campaign?.contentConfig as any;
    expect(contentConfig).toBeTruthy();
    expect(contentConfig.headline).toBe('Get 15% Off Your First Order!');
    expect(contentConfig.subheadline).toBe('Join our newsletter for exclusive deals and updates');
    expect(contentConfig.buttonText).toBe('Subscribe Now');
    expect(contentConfig.emailLabel).toBe('Your Email');
    expect(contentConfig.emailPlaceholder).toBe('you@example.com');
    expect(contentConfig.successMessage).toBe('Thanks for subscribing! Check your inbox.');
    expect(contentConfig.failureMessage).toBe('Oops! Something went wrong. Please try again.');
    expect(contentConfig.nameFieldEnabled).toBe(true);
    expect(contentConfig.consentFieldEnabled).toBe(true);

    console.log('✅ Content config verified');

    // Verify targetRules and frequency capping
    const targetRules = campaign?.targetRules as any;
    expect(targetRules).toBeTruthy();
    expect(targetRules.enhancedTriggers).toBeTruthy();
    expect(targetRules.enhancedTriggers.frequency_capping).toBeTruthy();
    expect(targetRules.enhancedTriggers.frequency_capping.max_triggers_per_session).toBe(1);
    expect(targetRules.enhancedTriggers.frequency_capping.max_triggers_per_day).toBe(2);
    expect(targetRules.enhancedTriggers.frequency_capping.cooldown_between_triggers).toBe(3600);

    console.log('✅ Frequency capping verified');

    console.log('🎉 Newsletter campaign creation test completed successfully!');

    // Take screenshot for documentation
    await page.screenshot({
      path: 'test-results/newsletter-campaign-created.png',
      fullPage: true
    });
  });
});


