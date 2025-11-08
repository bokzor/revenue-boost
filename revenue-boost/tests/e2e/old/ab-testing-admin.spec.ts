import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * A/B TESTING ADMIN E2E TEST SUITE
 *
 * Tests the complete A/B testing campaign creation workflow in the admin panel:
 * - Creating experiments with multiple variants
 * - Configuring experiment settings
 * - Customizing individual variants
 * - Saving and validating experiments
 */

test.describe("A/B Testing Admin Flow", () => {
  let prisma: PrismaClient;

  test.beforeAll(async () => {
    prisma = new PrismaClient();

    // Verify E2E_TEST_MODE is enabled
    if (process.env.E2E_TEST_MODE !== "true") {
      console.warn(
        "⚠️  E2E_TEST_MODE is not enabled. Tests may fail due to authentication.",
      );
      console.warn("   Run with: E2E_TEST_MODE=true npm run test:e2e");
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("should create a 2-variant A/B test experiment", async ({ page }) => {
    console.log("🧪 Testing 2-variant A/B test UI...");

    // Navigate to create campaign page
    await page.goto("/campaigns/new");
    // Auto-added by Auggie: Password protection handling
    const passwordField = page.locator('input[name="password"]');
    if (await passwordField.isVisible({ timeout: 3000 })) {
      await passwordField.fill("a");
      await page.locator('button[type="submit"], input[type="submit"]').click();
      await page.waitForLoadState("networkidle");
    }

    await page.waitForLoadState("networkidle");

    // Verify A/B Testing panel is visible
    const abTestingPanel = page.locator('text="Enable A/B Testing"');
    await expect(abTestingPanel).toBeVisible();

    // Enable A/B Testing
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    // Verify Experiment Configuration section appears
    await expect(page.locator('text="Experiment Configuration"')).toBeVisible();

    // Fill in experiment details
    await page.fill(
      'input[placeholder*="Homepage Hero Test"]',
      "Newsletter CTA Color Test",
    );
    await page.fill(
      'textarea[placeholder*="Changing the CTA"]',
      "Green CTA button will increase conversions by 15%",
    );
    await page.fill(
      'textarea[placeholder*="Describe what you\'re testing"]',
      "Testing different CTA button colors for newsletter signup",
    );

    // Verify 2 variants is selected by default
    const twoVariantsButton = page.locator('button:has-text("2 Variants")');
    await expect(twoVariantsButton).toHaveAttribute("aria-pressed", "true");

    // Verify variant selector shows A and B
    await expect(page.locator('button:has-text("Variant A")')).toBeVisible();
    await expect(page.locator('button:has-text("Variant B")')).toBeVisible();

    // Verify variant A is selected by default and marked as Control
    const variantAButton = page.locator('button:has-text("Variant A")').first();
    await expect(variantAButton).toHaveAttribute("aria-pressed", "true");
    // Verify Control badge is visible within the Variant A button
    await expect(variantAButton.locator('text="Control"')).toBeVisible();

    // Switch to Variant B
    const variantBButton = page.locator('button:has-text("Variant B")').first();
    await variantBButton.click();
    await page.waitForTimeout(300);

    // Verify Variant B is now selected
    await expect(variantBButton).toHaveAttribute("aria-pressed", "true");

    // Verify experiment name is still visible (shared across variants)
    const experimentNameInput = page.locator(
      'input[placeholder*="Homepage Hero Test"]',
    );
    await expect(experimentNameInput).toHaveValue("Newsletter CTA Color Test");

    console.log("✅ 2-variant A/B test UI test successful!");
  });

  test("should create a 4-variant A/B test experiment", async ({ page }) => {
    console.log("🧪 Testing 4-variant A/B test UI...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");

    // Enable A/B Testing
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    // Fill experiment details
    await page.fill(
      'input[placeholder*="Homepage Hero Test"]',
      "Multi-Variant Headline Test",
    );
    await page.fill(
      'textarea[placeholder*="Changing the CTA"]',
      "Different headlines will impact conversion rates",
    );

    // Select 4 variants
    await page.click('button:has-text("4 Variants")');
    await page.waitForTimeout(500);

    // Verify all 4 variant buttons appear
    await expect(page.locator('button:has-text("Variant A")')).toBeVisible();
    await expect(page.locator('button:has-text("Variant B")')).toBeVisible();
    await expect(page.locator('button:has-text("Variant C")')).toBeVisible();
    await expect(page.locator('button:has-text("Variant D")')).toBeVisible();

    // Verify traffic allocation is displayed
    await expect(page.locator('text="Number of Variants: 4"')).toBeVisible();

    // Test switching between variants
    for (const variant of ["A", "B", "C", "D"]) {
      const variantButton = page
        .locator(`button:has-text("Variant ${variant}")`)
        .first();
      await variantButton.click();
      await page.waitForTimeout(200);

      // Verify the variant is selected
      await expect(variantButton).toHaveAttribute("aria-pressed", "true");

      // Verify "Editing:" label is visible
      await expect(page.locator('text="Editing:"')).toBeVisible();
    }

    // Verify Variant A is marked as Control
    const variantAButton = page.locator('button:has-text("Variant A")').first();
    await variantAButton.click();
    await page.waitForTimeout(200);
    // Verify Control badge is visible within the Variant A button
    await expect(variantAButton.locator('text="Control"')).toBeVisible();

    console.log("✅ 4-variant A/B test UI test successful!");
  });

  test("should validate required experiment fields", async ({ page }) => {
    console.log("🧪 Testing experiment validation...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");

    // Enable A/B Testing
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    // Try to save without filling experiment name
    const saveButton = page
      .locator('button:has-text("Create Campaign")')
      .first();

    // Navigate to last step
    for (let i = 0; i < 4; i++) {
      const nextButton = page.locator('button:has-text("Next")');
      if ((await nextButton.count()) > 0) {
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }

    // Attempt to save
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Should show validation error or stay on page
    // (Exact validation behavior depends on implementation)
    const currentUrl = page.url();
    expect(currentUrl).toContain("/campaigns/new");

    console.log("✅ Validation test complete!");
  });
});
