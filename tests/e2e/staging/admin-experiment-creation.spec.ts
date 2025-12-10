/**
 * Admin A/B Experiment Creation E2E Tests
 *
 * Tests the full A/B experiment creation flow in the admin UI.
 * Verifies experiments and their variant campaigns are correctly saved in the database.
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

import { test, expect, type Page, type FrameLocator, type BrowserContext, type Locator } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

// Load E2E environment (supports .env.e2e, .env, or CI secrets)
import "./helpers/load-staging-env";

// =============================================================================
// CI/TEST MODE DETECTION
// =============================================================================
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
const TEST_PREFIX = "E2E-Experiment-";

// Session storage path for reusing login across tests
const SESSION_STORAGE_PATH = path.resolve(process.cwd(), "test-results/.auth/shopify-session.json");

// Type for working with either Page (TEST_MODE) or FrameLocator (iframe mode)
type AppContext = Page | FrameLocator;

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
    return ageMinutes < 30;
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
      await Promise.race([
        page.waitForURL(/admin\.shopify\.com\/store/, { timeout: 90000 }),
        ...adminIndicators.map((i) => i.waitFor({ state: "visible", timeout: 90000 }).catch(() => {})),
      ]);

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

    if (await emailField.isVisible().catch(() => false)) {
      console.log("📋 CAPTCHA solved, continuing with login...");
    } else {
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

  // Fill email
  await expect(emailField).toBeVisible({ timeout: 15000 });
  await emailField.fill(ADMIN_EMAIL);
  await page.waitForTimeout(500);

  // Click continue
  const continueButton = page.getByRole("button", { name: /Continue with email/i });
  await expect(continueButton).toBeEnabled({ timeout: 5000 });
  await continueButton.click();

  // Fill password
  const passwordField = page.getByRole("textbox", { name: /password/i }).or(page.locator('input[type="password"]'));
  await expect(passwordField).toBeVisible({ timeout: 15000 });
  await passwordField.fill(ADMIN_PASSWORD);

  // Click login
  const loginButton = page.getByRole("button", { name: /Log in/i }).or(page.getByRole("button", { name: /Continue/i }));
  await loginButton.click();

  // Wait for admin
  await page.waitForURL(/admin\.shopify\.com\/store/, { timeout: 30000 });
  console.log("✅ Logged in successfully");
  await saveSession(context);
}

/**
 * Navigate to experiment creation page
 */
async function navigateToExperimentCreate(page: Page): Promise<AppContext> {
  console.log("🚀 Navigating to experiment creation...");

  // In TEST_MODE, navigate directly to the app URL (no iframe)
  if (TEST_MODE) {
    await page.goto(`${TEST_SERVER_URL}/app/campaigns/create`);
    await page.waitForLoadState("domcontentloaded");

    // Wait for mode selection page
    await expect(page.getByText("What would you like to create?")).toBeVisible({ timeout: 30000 });
    console.log("📋 Mode selection page loaded (TEST_MODE)");

    // Click "A/B Experiment" card
    const experimentCard = page.getByRole("button", { name: /A\/B Experiment/i }).first();
    await expect(experimentCard).toBeVisible({ timeout: 10000 });
    await experimentCard.click();
    console.log("📋 Clicked A/B Experiment card");

    // Wait for experiment setup page - look for "Create A/B Experiment" header
    await expect(
      page.getByText("Create A/B Experiment").first()
    ).toBeVisible({ timeout: 15000 });
    console.log("✅ Experiment setup page loaded");
    return page;
  }

  // Normal mode: Navigate via Shopify admin iframe
  await page.goto(`${STORE_ADMIN_URL}/apps/${APP_SLUG}/app/campaigns/create`);
  await page.waitForLoadState("domcontentloaded");

  const appFrame = page.frameLocator("iframe").first();

  // Wait for mode selection page
  await expect(appFrame.getByText("What would you like to create?")).toBeVisible({ timeout: 30000 });
  console.log("📋 Mode selection page loaded");

  // Click "A/B Experiment" card
  const experimentCard = appFrame.getByRole("button", { name: /A\/B Experiment/i }).first();
  await expect(experimentCard).toBeVisible({ timeout: 10000 });
  await experimentCard.click();
  console.log("📋 Clicked A/B Experiment card");

  // Wait for experiment setup page
  await expect(
    appFrame.getByText(/Create A\/B Experiment/i).or(appFrame.getByText("EXPERIMENT DETAILS"))
  ).toBeVisible({ timeout: 15000 });
  console.log("✅ Experiment setup page loaded");
  return appFrame;
}

/**
 * Fill experiment setup form
 */
async function fillExperimentSetup(
  appContext: AppContext,
  experimentName: string,
  hypothesis: string,
  page: Page
): Promise<void> {
  console.log(`📝 Setting up experiment: ${experimentName}`);

  // Fill experiment name - the label is just "Name" in the ExperimentSetupView
  const nameInput = appContext.getByLabel(/^Name$/i);
  await expect(nameInput).toBeVisible({ timeout: 10000 });
  await nameInput.fill(experimentName);
  console.log(`📝 Filled experiment name: ${experimentName}`);

  // Fill hypothesis (optional but recommended)
  const hypothesisInput = appContext.getByLabel(/Hypothesis/i);
  if (await hypothesisInput.isVisible().catch(() => false)) {
    await hypothesisInput.fill(hypothesis);
    console.log(`📝 Filled hypothesis: ${hypothesis}`);
  }

  await page.waitForTimeout(500);
}


// Template type to sidebar filter text mapping
const TEMPLATE_TYPE_FILTERS: Record<string, string> = {
  NEWSLETTER: "Newsletter",
  SPIN_TO_WIN: "Spin to Win",
  SCRATCH_CARD: "Scratch Card",
  FLASH_SALE: "Flash Sale",
  SOCIAL_PROOF: "Social Proof",
  ANNOUNCEMENT: "Announcement",
  WELCOME_MAT: "Welcome Mat",
  EXIT_INTENT: "Exit Intent",
  GAMIFICATION: "Gamification",
  COUNTDOWN: "Countdown",
  UPSELL: "Upsell",
  CROSS_SELL: "Cross Sell",
};

/**
 * Configure a variant by selecting a recipe
 * @param templateType - Optional template type to filter recipes (e.g., "NEWSLETTER", "SPIN_TO_WIN")
 */
async function configureVariant(
  appContext: AppContext,
  variantKey: "A" | "B" | "C" | "D",
  page: Page,
  templateType?: string
): Promise<void> {
  console.log(`🔧 Configuring Variant ${variantKey}${templateType ? ` with ${templateType}` : ""}...`);

  // Check if we're on the ExperimentSetupView (has "Configure variant X" buttons)
  // or on the VariantConfigurator (has variant tabs like "A (Control)", "B")

  // First, try to find the variant card button on ExperimentSetupView
  // The VariantCard has aria-label="Configure variant A" etc.
  const variantCardButton = appContext.getByRole("button", { name: `Configure variant ${variantKey}` });

  if (await variantCardButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await variantCardButton.click();
    console.log(`📋 Clicked variant card for Variant ${variantKey}`);
    await page.waitForTimeout(1000);
  } else {
    // We might be in VariantConfigurator - look for variant tabs
    // The tabs show "A (Control)" or just "B", "C", "D"
    const tabPattern = variantKey === "A" ? /^A \(Control\)/ : new RegExp(`^${variantKey}$`);
    const variantTab = appContext.getByRole("button", { name: tabPattern });

    if (await variantTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await variantTab.click();
      console.log(`📋 Clicked variant tab for Variant ${variantKey}`);
      await page.waitForTimeout(1000);
    }
  }

  // Wait for recipe picker to appear - use expect with timeout for proper waiting
  const recipePickerHeading = appContext.getByRole("heading", { name: /Choose a Recipe/i });

  try {
    await expect(recipePickerHeading).toBeVisible({ timeout: 15000 });
    console.log(`📋 Recipe picker visible for Variant ${variantKey}`);

    // Wait for recipes to load
    await page.waitForTimeout(2000);

    // If templateType specified, click the sidebar filter
    if (templateType && TEMPLATE_TYPE_FILTERS[templateType]) {
      const filterName = TEMPLATE_TYPE_FILTERS[templateType];
      console.log(`🔍 Filtering by template type: ${filterName}`);

      // First, reset to "All Types" to clear any previous filter
      const allTypesButton = appContext.getByRole("button", { name: /All Types/i });
      if (await allTypesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await allTypesButton.click();
        console.log(`📋 Reset to All Types`);
        await page.waitForTimeout(1000);
      }

      // Now click the specific template type filter
      // The button contains icon + label + count, use text matching
      const filterButton = appContext.locator(`button:has-text("${filterName}")`).first();
      if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await filterButton.click();
        console.log(`📋 Clicked sidebar filter: ${filterName}`);
        await page.waitForTimeout(2000); // Wait for filter to apply and recipes to re-render
      } else {
        console.log(`⚠️ Sidebar filter button not found for: ${filterName}`);
        // Debug: list all visible buttons in the sidebar
        const allButtons = await appContext.locator("button").all();
        console.log(`📋 Found ${allButtons.length} buttons on page`);
        for (let i = 0; i < Math.min(allButtons.length, 20); i++) {
          const text = await allButtons[i].textContent().catch(() => "");
          if (text && text.length < 50) {
            console.log(`   Button ${i}: "${text.trim()}"`);
          }
        }
        // Take a screenshot for debugging
        await page.screenshot({ path: `test-results/debug-filter-${templateType}.png` });
      }
    }

    // Scroll down to see recipe cards with Select buttons
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);

    // Look for "Select" button on recipe cards
    // The RecipeCard component has a button with text "Select" or "Selected"
    const selectButton = appContext.getByRole("button", { name: "Select" }).first();

    await expect(selectButton).toBeVisible({ timeout: 15000 });
    await selectButton.scrollIntoViewIfNeeded();
    await selectButton.click();
    console.log(`📋 Clicked Select button for Variant ${variantKey}`);

    // Wait for the editor step to load (after recipe selection, it auto-saves and moves to editor)
    // The editor shows sections like "Design", "Content", etc.
    await page.waitForTimeout(3000);

    // Verify we're in the editor step by looking for the campaign editor form
    const editorVisible = await appContext.getByText(/Design|Content|Targeting/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (editorVisible) {
      console.log(`📋 Editor step loaded for Variant ${variantKey}`);
    }

    // The variant is now configured (auto-saved when recipe was selected)
    // We can either:
    // 1. Click "← Back to Variants" to go back to variant tabs (stays in VariantConfigurator)
    // 2. Click on another variant tab directly
    // 3. Click "Back to setup" to go back to ExperimentSetupView

    // For now, just wait - the variant data is already saved
    // The next variant configuration will click on the variant tab

  } catch (error) {
    console.log(`⚠️ Recipe picker not found for Variant ${variantKey}: ${error}`);
    // Take a screenshot for debugging
    await page.screenshot({ path: `test-results/debug-variant-${variantKey}.png` });
  }

  console.log(`✅ Variant ${variantKey} configured`);
}

/**
 * Save experiment as draft or publish
 */
async function saveExperiment(
  appContext: AppContext,
  page: Page,
  publish: boolean = false
): Promise<string | null> {
  const buttonName = publish ? /Publish|Launch/i : /Save Draft/i;
  const saveButton = appContext.getByRole("button", { name: buttonName });

  await expect(saveButton).toBeVisible({ timeout: 10000 });
  await expect(saveButton).toBeEnabled({ timeout: 5000 });
  await saveButton.click();
  console.log(`💾 Clicked ${publish ? "Publish" : "Save Draft"}`);

  // Wait for redirect to experiment detail page
  // The route redirects to /app/experiments/{experimentId} after saving
  try {
    await page.waitForURL(/\/app\/experiments\/[a-zA-Z0-9]+/, { timeout: 15000 });
    console.log(`📍 Redirected to: ${page.url()}`);
  } catch {
    console.log(`⚠️ No redirect detected, current URL: ${page.url()}`);
  }

  // Extract experiment ID from URL
  const url = page.url();
  const match = url.match(/experiments\/([a-zA-Z0-9]+)/);
  const experimentId = match ? match[1] : null;

  if (experimentId) {
    console.log(`✅ Experiment saved with ID: ${experimentId}`);
  } else {
    console.log("⚠️ Could not extract experiment ID from URL");
  }

  return experimentId;
}

// =============================================================================
// TEST SUITE
// =============================================================================

// Use saved session if available to avoid repeated logins and CAPTCHA
test.use({
  storageState: hasValidSession() ? SESSION_STORAGE_PATH : undefined,
});

test.describe.configure({ mode: "serial" });
test.describe("Admin A/B Experiment Creation", () => {
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

    // Clean up old test experiments and campaigns
    const deletedCampaigns = await prisma.campaign.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } },
    });
    const deletedExperiments = await prisma.experiment.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } },
    });
    if (deletedCampaigns.count > 0 || deletedExperiments.count > 0) {
      console.log(`🧹 Cleaned up ${deletedExperiments.count} experiments, ${deletedCampaigns.count} campaigns`);
    }
  });

  test.afterAll(async () => {
    // Clean up test experiments and campaigns
    const deletedCampaigns = await prisma.campaign.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } },
    });
    const deletedExperiments = await prisma.experiment.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } },
    });
    if (deletedCampaigns.count > 0 || deletedExperiments.count > 0) {
      console.log(`🧹 Cleaned up ${deletedExperiments.count} experiments, ${deletedCampaigns.count} campaigns`);
    }
    await prisma.$disconnect();
  });

  test("can access experiment creation page", async ({ page, context }) => {
    test.setTimeout(180000);

    if (!TEST_MODE) {
      await loginToShopifyAdmin(page, context);
    }

    const appContext = await navigateToExperimentCreate(page);

    // Verify experiment setup form is visible - label is just "Name"
    await expect(appContext.getByLabel(/^Name$/i)).toBeVisible();
    console.log("✅ Experiment creation page accessible!");
  });

  test("can create a basic A/B experiment", async ({ page, context }) => {
    test.setTimeout(300000); // 5 minutes for full flow

    if (!TEST_MODE) {
      await loginToShopifyAdmin(page, context);
    }

    const appContext = await navigateToExperimentCreate(page);

    // Fill experiment setup
    const experimentName = `${TEST_PREFIX}Basic-AB-${Date.now()}`;
    const hypothesis = "Testing that variant B will outperform variant A";
    await fillExperimentSetup(appContext, experimentName, hypothesis, page);

    // Configure Variant A (Control)
    await configureVariant(appContext, "A", page);

    // Configure Variant B
    await configureVariant(appContext, "B", page);

    // Save as draft
    const experimentId = await saveExperiment(appContext, page, false);
    expect(experimentId).toBeTruthy();

    // Verify experiment in database
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId! },
      include: { campaigns: true },
    });

    expect(experiment).toBeTruthy();
    expect(experiment!.name).toBe(experimentName);
    expect(experiment!.storeId).toBe(storeId);
    expect(experiment!.campaigns.length).toBeGreaterThanOrEqual(2);

    console.log(`✅ Experiment verified in database:`);
    console.log(`   - ID: ${experiment!.id}`);
    console.log(`   - Name: ${experiment!.name}`);
    console.log(`   - Status: ${experiment!.status}`);
    console.log(`   - Variants: ${experiment!.campaigns.length}`);
  });

  test("can create A/B experiment with different template types (Spin-to-Win vs Scratch Card)", async ({ page, context }) => {
    test.setTimeout(300000); // 5 minutes for full flow

    if (!TEST_MODE) {
      await loginToShopifyAdmin(page, context);
    }

    const appContext = await navigateToExperimentCreate(page);

    // Fill experiment setup
    const experimentName = `${TEST_PREFIX}Different-Templates-${Date.now()}`;
    // Note: Both Spin-to-Win and Scratch Card have goal "ENGAGEMENT", so they can be compared
    const hypothesis = "Testing Spin-to-Win wheel (Control) against Scratch Card to see which gamification converts better";
    await fillExperimentSetup(appContext, experimentName, hypothesis, page);

    // Configure Variant A (Control) with Spin-to-Win template
    await configureVariant(appContext, "A", page, "SPIN_TO_WIN");

    // Configure Variant B with Scratch Card template
    await configureVariant(appContext, "B", page, "SCRATCH_CARD");

    // Save as draft
    const experimentId = await saveExperiment(appContext, page, false);
    expect(experimentId).toBeTruthy();

    // Verify experiment in database
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId! },
      include: { campaigns: true },
    });

    expect(experiment).toBeTruthy();
    expect(experiment!.name).toBe(experimentName);
    expect(experiment!.storeId).toBe(storeId);
    expect(experiment!.campaigns.length).toBeGreaterThanOrEqual(2);

    // Verify that variants have different template types
    const templateTypes = experiment!.campaigns.map(c => c.templateType);
    expect(templateTypes).toContain("SPIN_TO_WIN");
    expect(templateTypes).toContain("SCRATCH_CARD");

    console.log(`✅ Experiment with different templates verified:`);
    console.log(`   - ID: ${experiment!.id}`);
    console.log(`   - Name: ${experiment!.name}`);
    console.log(`   - Status: ${experiment!.status}`);
    console.log(`   - Variants: ${experiment!.campaigns.length}`);
    console.log(`   - Template Types: ${templateTypes.join(", ")}`);
  });
});

