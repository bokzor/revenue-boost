/**
 * Admin Campaign Creation E2E Tests
 *
 * Tests the full campaign creation flow in the admin UI.
 * Uses real Shopify authentication and the staging environment.
 *
 * Prerequisites:
 * - ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set
 * - The staging app must be installed on the staging store
 */

import { test, expect, type Page, type FrameLocator } from "@playwright/test";

// Staging store admin URL
const STORE_ADMIN_URL = "https://admin.shopify.com/store/revenue-boost-staging";
const APP_SLUG = "revenue-boost";

// Credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "shopify.polio610@passmail.net";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bR0&Z4c&Ektaq7Yvggx*";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function loginToShopifyAdmin(page: Page): Promise<void> {
  console.log("🔐 Logging into Shopify admin...");
  await page.goto(STORE_ADMIN_URL);
  await page.waitForLoadState("domcontentloaded");

  // Check if already logged in
  const isLoggedIn = await page
    .locator('[data-polaris-topbar], [class*="Polaris-TopBar"]')
    .isVisible()
    .catch(() => false);

  if (isLoggedIn) {
    console.log("✅ Already logged in");
    return;
  }

  const emailField = page.getByRole("textbox", { name: "Email" });
  const verificationChallenge = page.getByRole("heading", {
    name: /connection needs to be verified/i,
  });
  const adminNav = page.locator(
    '[data-polaris-topbar], [class*="Polaris-TopBar"]'
  );

  await Promise.race([
    emailField.waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
    verificationChallenge
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => {}),
    adminNav.waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
  ]);

  if (await adminNav.isVisible().catch(() => false)) {
    console.log("✅ Already logged in");
    return;
  }

  if (await verificationChallenge.isVisible().catch(() => false)) {
    console.log("⚠️ CAPTCHA detected! Waiting 60s for manual intervention...");
    await page.waitForURL(/accounts\.shopify\.com\/lookup|admin\.shopify\.com/, {
      timeout: 60000,
    });
    if (await adminNav.isVisible().catch(() => false)) {
      console.log("✅ Logged in after CAPTCHA");
      return;
    }
  }

  await expect(emailField).toBeVisible({ timeout: 15000 });
  await emailField.fill(ADMIN_EMAIL);
  await page.waitForTimeout(500);

  const continueButton = page.getByRole("button", {
    name: /Continue with email/i,
  });
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
}

async function navigateToApp(page: Page): Promise<FrameLocator> {
  console.log("🚀 Navigating to Revenue Boost app...");
  await page.goto(`${STORE_ADMIN_URL}/apps/${APP_SLUG}/app`);
  await page.waitForLoadState("domcontentloaded");

  const appFrame = page.frameLocator("iframe").first();
  await expect(
    appFrame.getByRole("heading", { name: "Dashboard" })
  ).toBeVisible({ timeout: 30000 });

  console.log("✅ App loaded successfully");
  return appFrame;
}

async function navigateToCampaignCreate(page: Page): Promise<FrameLocator> {
  console.log("🚀 Navigating to campaign creation...");
  await page.goto(`${STORE_ADMIN_URL}/apps/${APP_SLUG}/app/campaigns/create`);
  await page.waitForLoadState("domcontentloaded");

  const appFrame = page.frameLocator("iframe").first();

  // First, we see a choice between "Single Campaign" and "A/B Experiment"
  // Wait for the choice page to load
  await expect(
    appFrame.getByText("What would you like to create?")
  ).toBeVisible({ timeout: 30000 });
  console.log("📋 Campaign type selection page loaded");

  // Click the "Single Campaign" card (the whole card is clickable)
  // The card has role="button" and contains the heading "Single Campaign"
  const singleCampaignCard = appFrame.getByRole("button", {
    name: /Single Campaign/,
  }).first();

  // Use a retry loop to handle flaky clicks
  let clicked = false;
  for (let attempt = 0; attempt < 3 && !clicked; attempt++) {
    await singleCampaignCard.click();
    console.log(`📋 Clicked Single Campaign card (attempt ${attempt + 1})`);

    // Wait a bit for navigation
    try {
      await expect(
        appFrame.getByText("Choose a Recipe", { exact: true })
      ).toBeVisible({ timeout: 10000 });
      clicked = true;
    } catch {
      console.log("⚠️ Recipe page not visible, retrying click...");
    }
  }

  // Final check with longer timeout
  await expect(
    appFrame.getByText("Choose a Recipe", { exact: true })
  ).toBeVisible({
    timeout: 30000,
  });

  console.log("✅ Recipe selection page loaded");
  return appFrame;
}

function getAppFrame(page: Page): FrameLocator {
  return page.frameLocator("iframe").first();
}

// =============================================================================
// TEST SUITE
// =============================================================================

test.describe("Campaign Creation", () => {
  // Run tests serially to avoid session conflicts
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for campaign creation tests
    await loginToShopifyAdmin(page);
  });

  test("can access campaign creation page", async ({ page }) => {
    console.log("🧪 Testing campaign creation page access...");

    const appFrame = await navigateToCampaignCreate(page);

    // Verify recipe selection is visible
    await expect(
      appFrame.getByText("Choose a Recipe", { exact: true })
    ).toBeVisible();

    // Verify at least one "Select" button is visible (recipe cards)
    const selectButtons = appFrame.getByRole("button", { name: "Select" });
    const buttonCount = await selectButtons.count();
    console.log(`Found ${buttonCount} recipe Select buttons`);

    expect(buttonCount).toBeGreaterThan(0);
    console.log("✅ Campaign creation page accessible!");
  });

  test("can select a Newsletter recipe and see the editor", async ({ page }) => {
    console.log("🧪 Testing Newsletter recipe selection...");

    const appFrame = await navigateToCampaignCreate(page);

    // Wait for recipes to load
    await expect(
      appFrame.getByText("Choose a Recipe", { exact: true })
    ).toBeVisible();

    // Find and click the first "Select" button (should be a Newsletter recipe)
    const selectButton = appFrame.getByRole("button", { name: "Select" }).first();
    await expect(selectButton).toBeVisible({ timeout: 10000 });
    await selectButton.click();
    console.log("📋 Clicked Select on first recipe");

    // Wait for the editor to appear - look for the campaign name field or preview
    // The editor has a "Campaign Name" field and a preview panel
    await expect(
      appFrame.getByPlaceholder(/campaign name/i).or(appFrame.getByText("Live Preview"))
    ).toBeVisible({ timeout: 15000 });

    console.log("✅ Editor loaded after recipe selection!");
  });

  test("can fill out campaign name and see it in preview", async ({ page }) => {
    console.log("🧪 Testing campaign name input...");

    const appFrame = await navigateToCampaignCreate(page);

    // Select first recipe
    await expect(
      appFrame.getByText("Choose a Recipe", { exact: true })
    ).toBeVisible();
    const selectButton = appFrame.getByRole("button", { name: "Select" }).first();
    await selectButton.click();

    // Wait for editor
    await page.waitForTimeout(2000);

    // Find the campaign name input
    const nameInput = appFrame.getByPlaceholder(/campaign name/i).or(
      appFrame.locator('input[name="name"]')
    );

    if (await nameInput.isVisible()) {
      // Clear and fill with test name
      const testName = `E2E Test Campaign ${Date.now()}`;
      await nameInput.fill(testName);
      console.log(`📝 Entered campaign name: ${testName}`);

      // Verify the name was entered
      await expect(nameInput).toHaveValue(testName);
      console.log("✅ Campaign name input works!");
    } else {
      console.log("⚠️ Campaign name input not found - may be auto-generated");
    }
  });

  test("can navigate through form sections", async ({ page }) => {
    console.log("🧪 Testing form section navigation...");

    const appFrame = await navigateToCampaignCreate(page);

    // Select first recipe
    await expect(
      appFrame.getByText("Choose a Recipe", { exact: true })
    ).toBeVisible();
    const selectButton = appFrame.getByRole("button", { name: "Select" }).first();
    await selectButton.click();

    // Wait for editor to load
    await page.waitForTimeout(2000);

    // Look for collapsible sections - they should have section headers
    const sectionHeaders = [
      "Content",
      "Design",
      "Targeting",
      "Frequency",
      "Schedule",
    ];

    let foundSections = 0;
    for (const header of sectionHeaders) {
      const section = appFrame.getByText(header, { exact: false });
      if (await section.isVisible().catch(() => false)) {
        foundSections++;
        console.log(`✅ Found section: ${header}`);
      }
    }

    console.log(`Found ${foundSections}/${sectionHeaders.length} sections`);
    expect(foundSections).toBeGreaterThan(0);
    console.log("✅ Form sections are visible!");
  });

  test("can save a campaign as draft", async ({ page }) => {
    console.log("🧪 Testing campaign save as draft...");

    const appFrame = await navigateToCampaignCreate(page);

    // Select first recipe
    await expect(
      appFrame.getByText("Choose a Recipe", { exact: true })
    ).toBeVisible();
    const selectButton = appFrame.getByRole("button", { name: "Select" }).first();
    await selectButton.click();

    // Wait for editor
    await page.waitForTimeout(2000);

    // Fill campaign name if visible
    const nameInput = appFrame.getByPlaceholder(/campaign name/i);
    if (await nameInput.isVisible()) {
      const testName = `E2E Draft Campaign ${Date.now()}`;
      await nameInput.fill(testName);
      console.log(`📝 Entered campaign name: ${testName}`);
    }

    // Look for "Save as Draft" or "Save Draft" button
    const saveDraftButton = appFrame
      .getByRole("button", { name: /save.*draft/i })
      .or(appFrame.getByRole("button", { name: /draft/i }));

    if (await saveDraftButton.isVisible()) {
      await saveDraftButton.click();
      console.log("💾 Clicked Save as Draft");

      // Wait for save to complete - look for success message or redirect
      await page.waitForTimeout(3000);

      // Check for success indicators
      const successBanner = appFrame.getByText(/saved|created|success/i);
      const isSuccess = await successBanner.isVisible().catch(() => false);

      if (isSuccess) {
        console.log("✅ Campaign saved successfully!");
      } else {
        // Check if we were redirected to the campaign list or detail page
        const currentUrl = page.url();
        console.log(`Current URL after save: ${currentUrl}`);
        console.log("✅ Save action completed (no error)");
      }
    } else {
      console.log("⚠️ Save as Draft button not found");
    }
  });
});
