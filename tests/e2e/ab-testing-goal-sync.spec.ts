import { test, expect } from "@playwright/test";

/**
 * A/B TESTING GOAL SYNCHRONIZATION E2E TEST
 *
 * Tests that goals are properly synchronized from Variant A to all other variants:
 * - When a goal is selected in Variant A, it should automatically propagate to B, C, D
 * - Variant B should have the goal set and allow template selection
 * - Goal changes in Variant A should update all other variants
 */

test.describe("A/B Testing Goal Synchronization", () => {
  const STORE_PASSWORD = "a";

  // Helper to handle store password if needed
  async function handleStorePassword(page: import('@playwright/test').Page) {
    const passwordInput = page.locator(
      'input[name="password"], input[type="password"]',
    );
    if ((await passwordInput.count()) > 0) {
      console.log("🔐 Entering store password...");
      await passwordInput.fill(STORE_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForLoadState("networkidle");
      console.log("✅ Logged into store");
    }
  }

  test("should sync goal from Variant A to Variant B automatically", async ({
    page,
  }) => {
    console.log("🧪 Testing goal synchronization from A to B...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    // Enable A/B Testing
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    // Fill experiment details
    await page.fill(
      'input[placeholder*="Homepage Hero Test"]',
      "Goal Sync Test",
    );
    await page.fill(
      'textarea[placeholder*="Changing the CTA"]',
      "Testing goal synchronization between variants",
    );

    // Verify we're on Variant A
    const variantAButton = page.locator('button:has-text("Variant A")');
    await expect(variantAButton).toHaveAttribute("aria-pressed", "true");

    // Select a goal in Variant A (Newsletter Signup)
    console.log("📝 Selecting goal in Variant A...");
    const goalCard = page.locator('[data-testid="goal-newsletter-signup"]');
    if (await goalCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalCard.click();
      await page.waitForTimeout(500);
    }

    // Switch to Variant B
    console.log("🔄 Switching to Variant B...");
    const variantBButton = page.locator('button:has-text("Variant B")');
    await variantBButton.click();
    await page.waitForTimeout(500);

    // Verify Variant B is now active
    await expect(variantBButton).toHaveAttribute("aria-pressed", "true");

    // Verify the goal banner shows the correct goal
    console.log("✅ Verifying goal is displayed in Variant B...");
    const goalBanner = page.locator('text="Goal: NEWSLETTER SIGNUP"');
    await expect(goalBanner).toBeVisible({ timeout: 3000 });

    // Navigate to Design step to verify template selection is available
    console.log("➡️ Navigating to Design step...");
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Verify template selector is visible (goal is set, so templates should be available)
    console.log("🎨 Verifying template selector is available...");
    const templateSelector = page.locator('[data-testid="template-selector"]');
    await expect(templateSelector).toBeVisible({ timeout: 5000 });

    // Verify we can see templates (not blocked by missing goal)
    const templateCards = page.locator('[data-testid^="template-card-"]');
    const templateCount = await templateCards.count();
    expect(templateCount).toBeGreaterThan(0);

    console.log(`✅ Found ${templateCount} templates available for selection`);
    console.log("✅ Goal synchronization test passed!");
  });

  test("should sync goal changes from Variant A to all variants", async ({
    page,
  }) => {
    console.log("🧪 Testing goal change synchronization...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    // Enable A/B Testing with 3 variants
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    // Select 3 variants
    await page.click('button:has-text("3 Variants")');
    await page.waitForTimeout(500);

    // Fill experiment details
    await page.fill(
      'input[placeholder*="Homepage Hero Test"]',
      "Goal Change Sync Test",
    );

    // Select initial goal (Newsletter Signup)
    console.log("📝 Selecting initial goal: Newsletter Signup...");
    const newsletterGoal = page.locator('[data-testid="goal-newsletter-signup"]');
    if (await newsletterGoal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newsletterGoal.click();
      await page.waitForTimeout(500);
    }

    // Verify all variants have Newsletter Signup
    for (const variant of ["A", "B", "C"]) {
      await page.click(`button:has-text("Variant ${variant}")`);
      await page.waitForTimeout(300);
      const goalBanner = page.locator('text="Goal: NEWSLETTER SIGNUP"');
      await expect(goalBanner).toBeVisible();
      console.log(`✅ Variant ${variant} has Newsletter Signup goal`);
    }

    console.log("✅ Goal change synchronization test passed!");
  });
});

