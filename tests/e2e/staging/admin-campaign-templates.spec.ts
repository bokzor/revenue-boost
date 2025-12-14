/**
 * Admin Campaign Creation E2E Tests - Template Families
 *
 * Tests creating campaigns for different template families via the admin UI
 * and verifies the campaigns are correctly saved in the database.
 *
 * Template Families Tested:
 * - Newsletter (email leads)
 * - Spin-to-Win (gamification)
 * - Flash Sale (sales/promos)
 * - Social Proof (engagement)
 *
 * =============================================================================
 * MODES:
 * =============================================================================
 *
 * 1. REAL SHOPIFY ADMIN (default) - For local/manual testing
 *    - Requires ADMIN_EMAIL and ADMIN_PASSWORD
 *    - Tests run against real Shopify admin iframe
 *    - May require manual CAPTCHA intervention
 *
 * 2. TEST_MODE (CI) - For automated testing in CI/CD
 *    - Set TEST_MODE=true environment variable
 *    - Tests run against localhost:3001 directly (no iframe)
 *    - No Shopify login required
 *    - Start the test server first: npm run dev:test:ci
 *
 * =============================================================================
 */

import { test, expect, type Page, type FrameLocator, type BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

// Load E2E environment (supports .env.e2e, .env, or CI secrets)
import "./helpers/load-staging-env";

// =============================================================================
// CI/TEST MODE DETECTION
// =============================================================================
// When TEST_MODE=true, skip Shopify admin login and use localhost directly
const TEST_MODE = process.env.TEST_MODE === "true";
const TEST_SERVER_URL = process.env.TEST_SERVER_URL || "http://localhost:3001";

if (TEST_MODE) {
  console.log("🧪 Running in TEST_MODE - using local server at", TEST_SERVER_URL);
}

// Staging store admin URL (used in normal mode)
const STORE_ADMIN_URL = "https://admin.shopify.com/store/revenue-boost-staging";
const APP_SLUG = "revenue-boost";
const STORE_DOMAIN = process.env.TEST_SHOP_DOMAIN || "revenue-boost-staging.myshopify.com";

// Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "shopify.polio610@passmail.net";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bR0&Z4c&Ektaq7Yvggx*";

// Test prefix for cleanup
const TEST_PREFIX = "E2E-Admin-Template-";

// Session storage path for reusing login across tests
const SESSION_STORAGE_PATH = path.resolve(process.cwd(), "test-results/.auth/shopify-session.json");

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a saved session exists and is recent (less than 30 minutes old)
 */
function hasValidSession(): boolean {
  try {
    if (!fs.existsSync(SESSION_STORAGE_PATH)) return false;
    const stats = fs.statSync(SESSION_STORAGE_PATH);
    const ageMinutes = (Date.now() - stats.mtimeMs) / 1000 / 60;
    return ageMinutes < 30; // Session valid for 30 minutes
  } catch {
    return false;
  }
}

/**
 * Save the current browser context's storage state for reuse
 */
async function saveSession(context: BrowserContext): Promise<void> {
  try {
    const dir = path.dirname(SESSION_STORAGE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await context.storageState({ path: SESSION_STORAGE_PATH });
    console.log("💾 Session saved for reuse");
  } catch (e) {
    console.log("⚠️ Could not save session:", e);
  }
}

async function loginToShopifyAdmin(page: Page, context: BrowserContext): Promise<void> {
  console.log("🔐 Logging into Shopify admin...");
  await page.goto(STORE_ADMIN_URL);
  await page.waitForLoadState("domcontentloaded");

  // Multiple ways to detect if we're logged into admin
  const adminIndicators = [
    page.locator('[data-polaris-topbar], [class*="Polaris-TopBar"]'),
    page.getByRole("button", { name: /Search/i }),
    page.getByRole("button", { name: /Sidekick/i }),
    page.getByRole("link", { name: /Home/i }),
  ];

  // Check if already logged in using any indicator
  for (const indicator of adminIndicators) {
    const isVisible = await indicator.isVisible().catch(() => false);
    if (isVisible) {
      console.log("✅ Already logged in");
      return;
    }
  }

  const emailField = page.getByRole("textbox", { name: "Email" });
  const verificationChallenge = page.getByRole("heading", {
    name: /connection needs to be verified/i,
  });

  // Wait for either email field, CAPTCHA, or admin indicators
  await Promise.race([
    emailField.waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
    verificationChallenge.waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
    ...adminIndicators.map((i) => i.waitFor({ state: "visible", timeout: 15000 }).catch(() => {})),
  ]);

  // Check again if logged in
  for (const indicator of adminIndicators) {
    const isVisible = await indicator.isVisible().catch(() => false);
    if (isVisible) {
      console.log("✅ Already logged in");
      return;
    }
  }

  // Handle CAPTCHA
  if (await verificationChallenge.isVisible().catch(() => false)) {
    console.log("⚠️ CAPTCHA detected! Waiting 90s for manual intervention...");
    try {
      // Wait for either admin page or login page (CAPTCHA solved)
      await Promise.race([
        page.waitForURL(/admin\.shopify\.com\/store/, { timeout: 90000 }),
        ...adminIndicators.map((i) => i.waitFor({ state: "visible", timeout: 90000 }).catch(() => {})),
      ]);

      // Check if we're now logged in
      for (const indicator of adminIndicators) {
        if (await indicator.isVisible().catch(() => false)) {
          console.log("✅ Logged in after CAPTCHA");
          await saveSession(context);
          return;
        }
      }
    } catch {
      // Timeout expired
    }

    // Check if we're now on the login page (CAPTCHA solved but need to login)
    if (await emailField.isVisible().catch(() => false)) {
      console.log("📋 CAPTCHA solved, continuing with login...");
      // Fall through to login flow below
    } else {
      // Check if logged in
      for (const indicator of adminIndicators) {
        if (await indicator.isVisible().catch(() => false)) {
          console.log("✅ Logged in after CAPTCHA");
          await saveSession(context);
          return;
        }
      }
      throw new Error("CAPTCHA timeout - manual intervention required");
    }
  }

  // Proceed with login
  await expect(emailField).toBeVisible({ timeout: 15000 });
  await emailField.fill(ADMIN_EMAIL);
  await page.waitForTimeout(500);

  const continueButton = page.getByRole("button", { name: /Continue with email/i });
  await expect(continueButton).toBeEnabled({ timeout: 5000 });
  await continueButton.click();

  const passwordField = page
    .getByRole("textbox", { name: /password/i })
    .or(page.locator('input[type="password"]'));
  await expect(passwordField).toBeVisible({ timeout: 15000 });
  await passwordField.fill(ADMIN_PASSWORD);

  const loginButton = page
    .getByRole("button", { name: /Log in/i })
    .or(page.getByRole("button", { name: /Continue/i }));
  await loginButton.click();

  await page.waitForURL(/admin\.shopify\.com\/store/, { timeout: 30000 });
  console.log("✅ Logged in successfully");

  // Save session for subsequent tests
  await saveSession(context);
}

/**
 * A wrapper that provides a unified interface for both iframe and direct page access.
 * In TEST_MODE, we access the page directly. In normal mode, we access via iframe.
 */
type AppContext = FrameLocator | Page;

function getLocator(context: AppContext) {
  return context;
}

async function navigateToCampaignCreate(page: Page): Promise<AppContext> {
  console.log("🚀 Navigating to campaign creation...");

  // In TEST_MODE, navigate directly to the app URL (no iframe)
  if (TEST_MODE) {
    // Retry navigation up to 3 times to handle transient server issues
    let navigationSuccess = false;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3 && !navigationSuccess; attempt++) {
      try {
        console.log(`📍 Navigation attempt ${attempt}/3...`);
        await page.goto(`${TEST_SERVER_URL}/app/campaigns/create`, {
          timeout: 30000,
          waitUntil: "domcontentloaded",
        });

        // Wait for the choice page
        await expect(page.getByText("What would you like to create?")).toBeVisible({ timeout: 30000 });
        navigationSuccess = true;
        console.log("📋 Campaign type selection page loaded (TEST_MODE)");
      } catch (error) {
        lastError = error as Error;
        console.log(`⚠️ Navigation attempt ${attempt} failed: ${lastError.message}`);
        if (attempt < 3) {
          console.log("⏳ Waiting 3s before retry...");
          await page.waitForTimeout(3000);
        }
      }
    }

    if (!navigationSuccess) {
      throw new Error(`Failed to navigate to campaign creation after 3 attempts: ${lastError?.message}`);
    }

    // Click the "Single Campaign" card
    const singleCampaignCard = page.getByRole("button", { name: /Single Campaign/ }).first();
    let clicked = false;
    for (let attempt = 0; attempt < 3 && !clicked; attempt++) {
      await singleCampaignCard.click();
      console.log(`📋 Clicked Single Campaign card (attempt ${attempt + 1})`);
      try {
        await expect(page.getByText("Choose a Recipe", { exact: true })).toBeVisible({ timeout: 10000 });
        clicked = true;
      } catch {
        console.log("⚠️ Recipe page not visible, retrying click...");
      }
    }

    await expect(page.getByText("Choose a Recipe", { exact: true })).toBeVisible({ timeout: 30000 });
    console.log("✅ Recipe selection page loaded");
    return page;
  }

  // Normal mode: Navigate via Shopify admin iframe
  await page.goto(`${STORE_ADMIN_URL}/apps/${APP_SLUG}/app/campaigns/create`);
  await page.waitForLoadState("domcontentloaded");

  const appFrame = page.frameLocator("iframe").first();

  // Wait for the choice page
  await expect(appFrame.getByText("What would you like to create?")).toBeVisible({ timeout: 30000 });
  console.log("📋 Campaign type selection page loaded");

  // Click the "Single Campaign" card with retry
  const singleCampaignCard = appFrame.getByRole("button", { name: /Single Campaign/ }).first();
  let clicked = false;
  for (let attempt = 0; attempt < 3 && !clicked; attempt++) {
    await singleCampaignCard.click();
    console.log(`📋 Clicked Single Campaign card (attempt ${attempt + 1})`);
    try {
      await expect(appFrame.getByText("Choose a Recipe", { exact: true })).toBeVisible({ timeout: 10000 });
      clicked = true;
    } catch {
      console.log("⚠️ Recipe page not visible, retrying click...");
    }
  }

  await expect(appFrame.getByText("Choose a Recipe", { exact: true })).toBeVisible({ timeout: 30000 });
  console.log("✅ Recipe selection page loaded");
  return appFrame;
}

/**
 * Template type labels as shown in the sidebar
 */
const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  NEWSLETTER: "Newsletter",
  SPIN_TO_WIN: "Spin to Win",
  FLASH_SALE: "Flash Sale",
  SOCIAL_PROOF: "Social Proof",
  SCRATCH_CARD: "Scratch Card",
  ANNOUNCEMENT: "Announcement",
  COUNTDOWN_TIMER: "Countdown Timer",
  FREE_SHIPPING: "Free Shipping",
  CART_ABANDONMENT: "Cart Abandonment",
  PRODUCT_UPSELL: "Product Upsell",
  EXIT_INTENT: "Exit Intent",
};

/**
 * Select a recipe by template type
 * 1. Click the template type in the sidebar to filter
 * 2. Click the first recipe's "Select" button
 */
async function selectRecipeByTemplateType(
  appContext: AppContext,
  templateType: string,
  page: Page
): Promise<void> {
  const label = TEMPLATE_TYPE_LABELS[templateType] || templateType;
  console.log(`🔍 Filtering by template type: ${label}`);

  // Click the template type in the sidebar to filter recipes
  // The sidebar buttons contain the label text
  const sidebarButton = appContext.getByRole("button", { name: new RegExp(label, "i") }).first();
  await expect(sidebarButton).toBeVisible({ timeout: 10000 });
  await sidebarButton.click();
  console.log(`📋 Clicked sidebar filter: ${label}`);

  // Wait for filter to apply
  await page.waitForTimeout(1000);

  // Now click the first "Select" button in the filtered recipe grid
  const selectButton = appContext.getByRole("button", { name: "Select" }).first();
  await expect(selectButton).toBeVisible({ timeout: 10000 });
  await selectButton.click();
  console.log(`📋 Selected first ${label} recipe`);

  // Wait for editor to load
  await page.waitForTimeout(2000);
}

/**
 * Fill in campaign name and save as draft
 */
async function fillCampaignNameAndSave(
  appContext: AppContext,
  campaignName: string,
  page: Page
): Promise<string | null> {
  console.log(`📝 Setting campaign name: ${campaignName}`);

  // First, expand the "Campaign Name & Description" section by clicking on it
  const nameSection = appContext.getByRole("button", { name: /Campaign Name & Description/i });
  await expect(nameSection).toBeVisible({ timeout: 10000 });

  // Try clicking the section and wait for the input to appear (with retry)
  const nameInput = appContext.getByLabel(/Campaign Name/i);
  let inputVisible = false;
  for (let attempt = 0; attempt < 3 && !inputVisible; attempt++) {
    await nameSection.click();
    console.log(`📋 Clicked Campaign Name section (attempt ${attempt + 1})`);
    await page.waitForTimeout(1000);

    try {
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      inputVisible = true;
    } catch {
      console.log("⚠️ Campaign Name input not visible, retrying...");
    }
  }

  if (!inputVisible) {
    throw new Error("Campaign Name input not visible after 3 attempts");
  }

  // Find and fill the campaign name input
  await nameInput.fill(campaignName);
  await page.waitForTimeout(500);
  console.log(`📝 Filled campaign name: ${campaignName}`);

  // Click Save Draft button
  const saveDraftButton = appContext.getByRole("button", { name: /Save Draft/i });
  await expect(saveDraftButton).toBeVisible({ timeout: 10000 });
  await saveDraftButton.click();
  console.log("💾 Clicked Save Draft");

  // Wait for save to complete - URL should change to include campaign ID
  await page.waitForTimeout(3000);

  // Extract campaign ID from URL
  const url = page.url();
  const match = url.match(/campaigns\/([a-zA-Z0-9]+)/);
  const campaignId = match ? match[1] : null;

  if (campaignId) {
    console.log(`✅ Campaign saved with ID: ${campaignId}`);
  } else {
    console.log("⚠️ Could not extract campaign ID from URL");
  }

  return campaignId;
}

// =============================================================================
// TEST SUITE
// =============================================================================

// Use saved session if available to avoid repeated logins and CAPTCHA
test.use({
  storageState: hasValidSession() ? SESSION_STORAGE_PATH : undefined,
});

test.describe.configure({ mode: "serial" });
test.describe("Admin Campaign Creation - Template Families", () => {
  let prisma: PrismaClient;
  let storeId: string;

  test.beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not defined");
    }

    prisma = new PrismaClient();

    // Get the store ID
    const store = await prisma.store.findUnique({
      where: { shopifyDomain: STORE_DOMAIN },
    });

    if (!store) {
      throw new Error(`Store not found: ${STORE_DOMAIN}`);
    }

    storeId = store.id;
    console.log(`📦 Using store: ${STORE_DOMAIN} (ID: ${storeId})`);

    // Clean up old test campaigns
    const deleted = await prisma.campaign.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } },
    });
    if (deleted.count > 0) {
      console.log(`🧹 Cleaned up ${deleted.count} old test campaigns`);
    }
  });

  test.afterAll(async () => {
    // Clean up test campaigns
    const deleted = await prisma.campaign.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } },
    });
    if (deleted.count > 0) {
      console.log(`🧹 Cleaned up ${deleted.count} test campaigns`);
    }
    await prisma.$disconnect();
  });

  // =========================================================================
  // COMBINED TEST: All Template Families
  // This test creates all 4 campaign types in a single test run to avoid
  // CAPTCHA issues from multiple logins
  // =========================================================================
  test("can create campaigns for all template families and verify in database", async ({ page, context }) => {
    test.setTimeout(300000); // 5 minutes for all 4 campaigns

    // In TEST_MODE, skip Shopify login - we access the app directly
    if (!TEST_MODE) {
      // Login once at the start (normal mode)
      await loginToShopifyAdmin(page, context);
    } else {
      console.log("🧪 TEST_MODE: Skipping Shopify login");
    }

    const templateTests = [
      { type: "NEWSLETTER" as const, name: "Newsletter" },
      { type: "SPIN_TO_WIN" as const, name: "SpinToWin" },
      { type: "FLASH_SALE" as const, name: "FlashSale" },
      { type: "SOCIAL_PROOF" as const, name: "SocialProof" },
    ];

    const createdCampaigns: Array<{ id: string; name: string; type: string }> = [];

    for (let i = 0; i < templateTests.length; i++) {
      const templateTest = templateTests[i];
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📋 Creating ${templateTest.name} campaign (${i + 1}/${templateTests.length})...`);
      console.log("=".repeat(60));

      // Add delay between campaign creations to let the server recover
      // This helps prevent net::ERR_ABORTED errors in CI
      if (i > 0) {
        console.log("⏳ Waiting 2s before next campaign creation...");
        await page.waitForTimeout(2000);
      }

      const appFrame = await navigateToCampaignCreate(page);

      // Select the recipe by filtering the sidebar
      await selectRecipeByTemplateType(appFrame, templateTest.type, page);

      // Fill campaign name and save
      const campaignName = `${TEST_PREFIX}${templateTest.name}-${Date.now()}`;
      const campaignId = await fillCampaignNameAndSave(appFrame, campaignName, page);

      expect(campaignId).toBeTruthy();

      // Verify in database
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId! },
      });

      expect(campaign).toBeTruthy();
      expect(campaign!.name).toBe(campaignName);
      expect(campaign!.templateType).toBe(templateTest.type);
      expect(campaign!.status).toBe("DRAFT");
      expect(campaign!.storeId).toBe(storeId);

      console.log(`✅ ${templateTest.name} campaign verified in database`);
      console.log(`   - ID: ${campaign!.id}`);
      console.log(`   - Name: ${campaign!.name}`);
      console.log(`   - Template: ${campaign!.templateType}`);
      console.log(`   - Status: ${campaign!.status}`);

      createdCampaigns.push({
        id: campaign!.id,
        name: campaign!.name,
        type: campaign!.templateType,
      });
    }

    // Final summary
    console.log(`\n${"=".repeat(60)}`);
    console.log("🎉 All template family campaigns created successfully!");
    console.log("=".repeat(60));
    for (const c of createdCampaigns) {
      console.log(`   ✅ ${c.type}: ${c.name} (${c.id})`);
    }
  });

  // =========================================================================
  // INDIVIDUAL TESTS (for running specific templates)
  // These can be run individually with --grep
  // =========================================================================
  test.skip("can create a Newsletter campaign and verify in database", async ({ page, context }) => {
    test.setTimeout(180000);
    await loginToShopifyAdmin(page, context);
    const appFrame = await navigateToCampaignCreate(page);

    // Select a Newsletter recipe by filtering the sidebar
    await selectRecipeByTemplateType(appFrame, "NEWSLETTER", page);

    // Fill campaign name and save
    const campaignName = `${TEST_PREFIX}Newsletter-${Date.now()}`;
    const campaignId = await fillCampaignNameAndSave(appFrame, campaignName, page);

    expect(campaignId).toBeTruthy();

    // Verify in database
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId! },
    });

    expect(campaign).toBeTruthy();
    expect(campaign!.name).toBe(campaignName);
    expect(campaign!.templateType).toBe("NEWSLETTER");
    expect(campaign!.status).toBe("DRAFT");
    expect(campaign!.storeId).toBe(storeId);

    console.log("✅ Newsletter campaign verified in database");
    console.log(`   - ID: ${campaign!.id}`);
    console.log(`   - Name: ${campaign!.name}`);
    console.log(`   - Template: ${campaign!.templateType}`);
    console.log(`   - Status: ${campaign!.status}`);
  });

  test.skip("can create a Spin-to-Win campaign and verify in database", async ({ page, context }) => {
    test.setTimeout(180000);
    await loginToShopifyAdmin(page, context);
    const appFrame = await navigateToCampaignCreate(page);

    // Select a Spin-to-Win recipe by filtering the sidebar
    await selectRecipeByTemplateType(appFrame, "SPIN_TO_WIN", page);

    // Fill campaign name and save
    const campaignName = `${TEST_PREFIX}SpinToWin-${Date.now()}`;
    const campaignId = await fillCampaignNameAndSave(appFrame, campaignName, page);

    expect(campaignId).toBeTruthy();

    // Verify in database
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId! },
    });

    expect(campaign).toBeTruthy();
    expect(campaign!.name).toBe(campaignName);
    expect(campaign!.templateType).toBe("SPIN_TO_WIN");
    expect(campaign!.status).toBe("DRAFT");
    expect(campaign!.storeId).toBe(storeId);

    console.log("✅ Spin-to-Win campaign verified in database");
    console.log(`   - ID: ${campaign!.id}`);
    console.log(`   - Name: ${campaign!.name}`);
    console.log(`   - Template: ${campaign!.templateType}`);
    console.log(`   - Status: ${campaign!.status}`);
  });

  test.skip("can create a Flash Sale campaign and verify in database", async ({ page, context }) => {
    test.setTimeout(180000);
    await loginToShopifyAdmin(page, context);
    const appFrame = await navigateToCampaignCreate(page);

    // Select a Flash Sale recipe by filtering the sidebar
    await selectRecipeByTemplateType(appFrame, "FLASH_SALE", page);

    // Fill campaign name and save
    const campaignName = `${TEST_PREFIX}FlashSale-${Date.now()}`;
    const campaignId = await fillCampaignNameAndSave(appFrame, campaignName, page);

    expect(campaignId).toBeTruthy();

    // Verify in database
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId! },
    });

    expect(campaign).toBeTruthy();
    expect(campaign!.name).toBe(campaignName);
    expect(campaign!.templateType).toBe("FLASH_SALE");
    expect(campaign!.status).toBe("DRAFT");
    expect(campaign!.storeId).toBe(storeId);

    console.log("✅ Flash Sale campaign verified in database");
    console.log(`   - ID: ${campaign!.id}`);
    console.log(`   - Name: ${campaign!.name}`);
    console.log(`   - Template: ${campaign!.templateType}`);
    console.log(`   - Status: ${campaign!.status}`);
  });

  test.skip("can create a Social Proof campaign and verify in database", async ({ page, context }) => {
    test.setTimeout(180000);
    await loginToShopifyAdmin(page, context);
    const appFrame = await navigateToCampaignCreate(page);

    // Select a Social Proof recipe by filtering the sidebar
    await selectRecipeByTemplateType(appFrame, "SOCIAL_PROOF", page);

    // Fill campaign name and save
    const campaignName = `${TEST_PREFIX}SocialProof-${Date.now()}`;
    const campaignId = await fillCampaignNameAndSave(appFrame, campaignName, page);

    expect(campaignId).toBeTruthy();

    // Verify in database
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId! },
    });

    expect(campaign).toBeTruthy();
    expect(campaign!.name).toBe(campaignName);
    expect(campaign!.templateType).toBe("SOCIAL_PROOF");
    expect(campaign!.status).toBe("DRAFT");
    expect(campaign!.storeId).toBe(storeId);

    console.log("✅ Social Proof campaign verified in database");
    console.log(`   - ID: ${campaign!.id}`);
    console.log(`   - Name: ${campaign!.name}`);
    console.log(`   - Template: ${campaign!.templateType}`);
    console.log(`   - Status: ${campaign!.status}`);
  });
});

