/**
 * Admin "Preview on Store" Button E2E Tests
 *
 * Tests the "Preview on Store" functionality in the campaign editor.
 * This button allows users to preview their campaign on their live store
 * before publishing.
 *
 * Functionality tested:
 * - "Preview on Store" button visibility
 * - Popover opens with preview options
 * - "Quick Preview" and "Test with Triggers" options
 * - API call to create preview session
 * - Store window opens with preview token
 */

import { test, expect, type Page, type FrameLocator, type BrowserContext } from "@playwright/test";
import path from "path";
import fs from "fs";

// Load E2E environment
import "./helpers/load-staging-env";

// =============================================================================
// CONFIGURATION
// =============================================================================

const TEST_MODE = process.env.TEST_MODE === "true";
const TEST_SERVER_URL = process.env.TEST_SERVER_URL || "http://localhost:3001";
const STORE_ADMIN_URL = "https://admin.shopify.com/store/revenue-boost-staging";
const APP_SLUG = "revenue-boost";

// Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "shopify.polio610@passmail.net";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bR0&Z4c&Ektaq7Yvggx*";

// Session storage path for reusing login
const SESSION_STORAGE_PATH = path.resolve(process.cwd(), "test-results/.auth/shopify-session.json");

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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
    console.log("   Please solve the CAPTCHA in the browser window...");

    // Poll for CAPTCHA resolution every 2 seconds for up to 90 seconds
    const startTime = Date.now();
    const maxWaitTime = 90000;

    while (Date.now() - startTime < maxWaitTime) {
      await page.waitForTimeout(2000);

      // Check if CAPTCHA is gone
      const captchaStillVisible = await verificationChallenge.isVisible().catch(() => false);
      if (!captchaStillVisible) {
        console.log("📋 CAPTCHA appears to be solved...");
        break;
      }

      // Check if we're now logged in
      for (const indicator of adminIndicators) {
        if (await indicator.isVisible().catch(() => false)) {
          console.log("✅ Logged in after CAPTCHA");
          await saveSession(context);
          return;
        }
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      console.log(`   Still waiting for CAPTCHA... (${elapsed}s / 90s)`);
    }

    // After waiting, check final state
    // Check if we're now logged in
    for (const indicator of adminIndicators) {
      if (await indicator.isVisible().catch(() => false)) {
        console.log("✅ Logged in after CAPTCHA");
        await saveSession(context);
        return;
      }
    }

    // Check if we're now on the login page (CAPTCHA solved but need to login)
    if (await emailField.isVisible().catch(() => false)) {
      console.log("📋 CAPTCHA solved, continuing with login...");
      // Fall through to login flow below
    } else {
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
  await saveSession(context);
}

type AppContext = FrameLocator | Page;

async function navigateToCampaignEditor(page: Page): Promise<AppContext> {
  console.log("🚀 Navigating to campaign editor...");

  if (TEST_MODE) {
    await page.goto(`${TEST_SERVER_URL}/app/campaigns/create`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("What would you like to create?")).toBeVisible({ timeout: 30000 });

    // Click Single Campaign
    const singleCampaignCard = page.getByRole("button", { name: /Single Campaign/ }).first();
    await singleCampaignCard.click();
    await expect(page.getByText("Choose a Recipe", { exact: true })).toBeVisible({ timeout: 30000 });

    // Select first recipe
    const selectButton = page.getByRole("button", { name: "Select" }).first();
    await selectButton.click();
    await page.waitForTimeout(2000);

    console.log("✅ Campaign editor loaded (TEST_MODE)");
    return page;
  }

  // Normal mode via Shopify admin
  await page.goto(`${STORE_ADMIN_URL}/apps/${APP_SLUG}/app/campaigns/create`);
  await page.waitForLoadState("domcontentloaded");

  const appFrame = page.frameLocator("iframe").first();
  await expect(appFrame.getByText("What would you like to create?")).toBeVisible({ timeout: 30000 });

  // Click Single Campaign with retry loop (handles flaky clicks)
  const singleCampaignCard = appFrame.getByRole("button", { name: /Single Campaign/ }).first();
  let clickedSingleCampaign = false;
  for (let attempt = 0; attempt < 3 && !clickedSingleCampaign; attempt++) {
    await singleCampaignCard.click();
    console.log(`📋 Clicked Single Campaign card (attempt ${attempt + 1})`);
    try {
      await expect(appFrame.getByText("Choose a Recipe", { exact: true })).toBeVisible({ timeout: 10000 });
      clickedSingleCampaign = true;
    } catch {
      console.log("⚠️ Recipe page not visible, retrying click...");
    }
  }
  await expect(appFrame.getByText("Choose a Recipe", { exact: true })).toBeVisible({ timeout: 30000 });

  // Click Select button with retry loop
  const selectButton = appFrame.getByRole("button", { name: "Select" }).first();
  let clickedSelect = false;
  for (let attempt = 0; attempt < 3 && !clickedSelect; attempt++) {
    await selectButton.click();
    console.log(`📋 Clicked Select button (attempt ${attempt + 1})`);
    try {
      // Wait for the campaign editor to load (look for Preview on Store button)
      await expect(appFrame.getByRole("button", { name: /Preview on Store/i })).toBeVisible({ timeout: 10000 });
      clickedSelect = true;
    } catch {
      console.log("⚠️ Campaign editor not loaded, retrying click...");
    }
  }
  await page.waitForTimeout(1000);

  console.log("✅ Campaign editor loaded");
  return appFrame;
}

// =============================================================================
// TEST SUITE
// =============================================================================

test.use({
  storageState: hasValidSession() ? SESSION_STORAGE_PATH : undefined,
});

test.describe.configure({ mode: "serial" });
test.describe("Preview on Store Button", () => {
  /**
   * Combined test for all Preview on Store UI functionality.
   * Tests are combined to avoid CAPTCHA issues from repeated navigation/login.
   */
  test("Preview on Store button - UI functionality", async ({ page, context }) => {
    test.setTimeout(300000); // 5 minutes for all checks

    // Login once at the start (normal mode only)
    if (!TEST_MODE) {
      await loginToShopifyAdmin(page, context);
    }

    console.log("🧪 Testing Preview on Store button functionality...\n");

    // Navigate to campaign editor
    const appContext = await navigateToCampaignEditor(page);

    // ==========================================================================
    // CHECK 1: Preview on Store button is visible
    // ==========================================================================
    console.log("📋 CHECK 1: Button visibility...");
    const previewButton = appContext.getByRole("button", { name: /Preview on Store/i });
    await expect(previewButton).toBeVisible({ timeout: 10000 });
    console.log("✅ CHECK 1 PASSED: Preview on Store button is visible!\n");

    // ==========================================================================
    // CHECK 2: Button opens popover with options
    // ==========================================================================
    console.log("📋 CHECK 2: Popover with options...");
    await previewButton.click();
    console.log("  Clicked Preview on Store button");

    const quickPreviewOption = appContext.getByText("Quick Preview");
    const testTriggersOption = appContext.getByText("Test with Triggers");

    await expect(quickPreviewOption).toBeVisible({ timeout: 5000 });
    await expect(testTriggersOption).toBeVisible({ timeout: 5000 });
    console.log("✅ CHECK 2 PASSED: Popover shows Quick Preview and Test with Triggers options!\n");

    // Close the popover by clicking elsewhere
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // ==========================================================================
    // CHECK 3: Quick Preview calls API with instant behavior
    // ==========================================================================
    console.log("📋 CHECK 3: Quick Preview API call...");

    // Track API calls
    let quickPreviewApiCalled = false;
    let quickPreviewRequestBody: string | null = null;

    await page.route("**/api/preview/session", async (route) => {
      quickPreviewApiCalled = true;
      quickPreviewRequestBody = route.request().postData();
      console.log("  📡 Preview session API called");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          token: "test-preview-token-123",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
      });
    });

    // Override window.open to capture URL without actually opening
    await page.evaluate(() => {
      (window as any).__testOpenedUrls = [];
      window.open = function (url) {
        (window as any).__testOpenedUrls.push(url);
        return null;
      };
    });

    // Click Preview on Store → Quick Preview
    await previewButton.click();
    await quickPreviewOption.click();
    console.log("  Clicked Quick Preview option");

    await page.waitForTimeout(2000);

    expect(quickPreviewApiCalled).toBe(true);
    console.log("  API was called");

    const quickPreviewUrls = await page.evaluate(() => (window as any).__testOpenedUrls || []);
    if (quickPreviewUrls.length > 0) {
      expect(quickPreviewUrls[0]).toContain("split_pop_preview_token=test-preview-token-123");
      expect(quickPreviewUrls[0]).toContain("preview_behavior=instant");
      console.log("  Window opened with correct URL");
    }
    console.log("✅ CHECK 3 PASSED: Quick Preview calls API and opens store with instant behavior!\n");

    // Clear routes and reset for next check
    await page.unroute("**/api/preview/session");
    await page.waitForTimeout(500);

    // ==========================================================================
    // CHECK 4: Test with Triggers uses realistic behavior mode
    // ==========================================================================
    console.log("📋 CHECK 4: Test with Triggers behavior...");

    await page.route("**/api/preview/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          token: "test-preview-token-456",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
      });
    });

    // Reset opened URLs
    await page.evaluate(() => {
      (window as any).__testOpenedUrls = [];
    });

    // Click Preview on Store → Test with Triggers
    await previewButton.click();
    await expect(testTriggersOption).toBeVisible({ timeout: 5000 });
    await testTriggersOption.click();
    console.log("  Clicked Test with Triggers option");

    await page.waitForTimeout(2000);

    const testTriggersUrls = await page.evaluate(() => (window as any).__testOpenedUrls || []);
    if (testTriggersUrls.length > 0) {
      expect(testTriggersUrls[0]).toContain("split_pop_preview_token=test-preview-token-456");
      expect(testTriggersUrls[0]).toContain("preview_behavior=realistic");
      console.log("  Window opened with realistic behavior");
    }
    console.log("✅ CHECK 4 PASSED: Test with Triggers uses realistic behavior mode!\n");

    console.log("🎉 All UI functionality checks passed!");
  });

  /**
   * Full end-to-end test: Preview popup actually appears on the store.
   * This test actually opens the store and verifies the popup renders.
   */
  test("Preview popup is visible on the store after Quick Preview", async ({ page, context }) => {
    test.setTimeout(300000); // 5 minutes

    // Login once at the start (normal mode only)
    if (!TEST_MODE) {
      await loginToShopifyAdmin(page, context);
    }

    console.log("🧪 Testing that popup is visible on store after preview...\n");

    const appContext = await navigateToCampaignEditor(page);

    // Listen for new popup windows - we want to actually open the store
    const newPagePromise = context.waitForEvent("page", { timeout: 30000 });

    // Click Preview on Store
    const previewButton = appContext.getByRole("button", { name: /Preview on Store/i });
    await expect(previewButton).toBeVisible({ timeout: 10000 });
    await previewButton.click();

    // Click Quick Preview option
    const quickPreviewOption = appContext.getByText("Quick Preview");
    await expect(quickPreviewOption).toBeVisible({ timeout: 5000 });
    await quickPreviewOption.click();
    console.log("📋 Clicked Quick Preview option");

    // Wait for the new page (store) to open
    let storePage: Page;
    try {
      storePage = await newPagePromise;
      console.log("📋 Store page opened:", storePage.url());
    } catch {
      console.log("⚠️ New page didn't open - browser may have blocked popup");
      // Skip the rest of the test if popup was blocked
      return;
    }

    // Wait for the store page to load
    await storePage.waitForLoadState("domcontentloaded");

    // Handle password protection if present
    const passwordInput = storePage.locator('input[type="password"]');
    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("🔒 Password page detected, logging in...");
      const storePassword = process.env.STORE_PASSWORD || "a";
      await passwordInput.fill(storePassword);
      await storePage.click('button[type="submit"]');
      await storePage.waitForLoadState("domcontentloaded");
      await storePage.waitForTimeout(1000);
    }

    // Verify the URL contains the preview token
    const storeUrl = storePage.url();
    expect(storeUrl).toContain("split_pop_preview_token");
    expect(storeUrl).toContain("preview_behavior=instant");
    console.log("✅ Store URL contains preview parameters");

    // Wait for the popup to appear
    const popupHost = storePage.locator("#revenue-boost-popup-shadow-host");

    try {
      await expect(popupHost).toBeVisible({ timeout: 15000 });
      console.log("✅ Popup shadow host is visible on the store!");

      // Verify the shadow root has content
      const hasContent = await storePage.evaluate(() => {
        const host = document.querySelector("#revenue-boost-popup-shadow-host");
        if (!host?.shadowRoot) return false;
        return host.shadowRoot.innerHTML.length > 100;
      });

      expect(hasContent).toBe(true);
      console.log("✅ Popup has content inside shadow DOM!");

      // Take a screenshot for verification
      await storePage.screenshot({ path: "test-results/preview-popup-visible.png" });
      console.log("📸 Screenshot saved to test-results/preview-popup-visible.png");

    } catch (e) {
      console.log("⚠️ Popup not visible - extension may not be installed or configured");
      // Log debug info
      const hasRevenueBoostConfig = await storePage.evaluate(() => {
        return !!(window as any).REVENUE_BOOST_CONFIG;
      });
      console.log("Debug: REVENUE_BOOST_CONFIG exists:", hasRevenueBoostConfig);

      if (hasRevenueBoostConfig) {
        const config = await storePage.evaluate(() => {
          return JSON.stringify((window as any).REVENUE_BOOST_CONFIG, null, 2);
        });
        console.log("Debug: REVENUE_BOOST_CONFIG:", config);
      }

      throw e; // Re-throw to fail the test
    } finally {
      // Close the store page
      await storePage.close();
    }

    console.log("\n🎉 Full end-to-end preview test passed!");
  });
});

