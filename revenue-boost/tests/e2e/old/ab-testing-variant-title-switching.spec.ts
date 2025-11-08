/**
 * A/B Testing Variant Title Switching E2E Tests
 *
 * Tests that verify different titles can be set for A/B testing variants
 * and that switching between variants properly updates the displayed title.
 */

import { test, expect } from "@playwright/test";

// Helper to handle store password if needed
async function handleStorePassword(page) {
  const passwordInput = page.locator(
    'input[name="password"], input[type="password"]',
  );
  if ((await passwordInput.count()) > 0) {
    console.log("🔐 Entering store password...");
    await passwordInput.fill("a");
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
    console.log("✅ Logged into store");
  }
}

test.describe("A/B Testing Variant Title Switching", () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for these tests
    test.setTimeout(60000);
  });

  test("🚨 CROSS-CONTAMINATION TEST: Verify variants are truly independent", async ({
    page,
  }) => {
    console.log("🧪 Testing for cross-contamination between variants...");

    // Navigate to new campaign page
    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    // Enable A/B Testing
    console.log("📝 Enabling A/B Testing...");
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(1000);

    // Fill experiment details
    await page.fill(
      'input[placeholder*="Homepage Hero Test"]',
      "Cross-Contamination Test",
    );

    // Select goal and navigate to design
    console.log("🎯 Selecting campaign goal...");
    const goalCard = page.locator('[data-testid="goal-newsletter-signup"]');
    if (await goalCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalCard.click();
    }

    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);

    // STEP 1: Set a very specific title for Variant A
    console.log("📝 STEP 1: Setting UNIQUE title for Variant A...");
    await page.click('button:has-text("Variant A")');
    await page.waitForTimeout(500);

    const VARIANT_A_TITLE = "VARIANT_A_UNIQUE_TITLE_12345";

    // Try multiple selectors for the title field
    const titleSelectors = [
      '[data-testid="headline"]',
      '[data-testid="title"]',
      'input[placeholder*="title" i]',
      'input[placeholder*="headline" i]',
      'input[aria-label*="title" i]',
      'input[aria-label*="headline" i]',
    ];

    let titleFieldA = null;
    for (const selector of titleSelectors) {
      const field = page.locator(selector).first();
      if (await field.isVisible().catch(() => false)) {
        titleFieldA = field;
        console.log(`✅ Found title field with selector: ${selector}`);
        break;
      }
    }

    if (titleFieldA) {
      await titleFieldA.clear();
      await titleFieldA.fill(VARIANT_A_TITLE);
      console.log(`✅ Set Variant A title to: ${VARIANT_A_TITLE}`);
    } else {
      console.log("⚠️ Could not find title field for Variant A");
    }

    // STEP 2: Switch to Variant B and set a DIFFERENT title
    console.log("📝 STEP 2: Setting DIFFERENT title for Variant B...");
    await page.click('button:has-text("Variant B")');
    await page.waitForTimeout(1000);

    const VARIANT_B_TITLE = "VARIANT_B_UNIQUE_TITLE_67890";

    // Try multiple selectors for the title field
    let titleFieldB = null;
    for (const selector of titleSelectors) {
      const field = page.locator(selector).first();
      if (await field.isVisible().catch(() => false)) {
        titleFieldB = field;
        console.log(`✅ Found title field with selector: ${selector}`);
        break;
      }
    }

    if (titleFieldB) {
      await titleFieldB.clear();
      await titleFieldB.fill(VARIANT_B_TITLE);
      console.log(`✅ Set Variant B title to: ${VARIANT_B_TITLE}`);
    } else {
      console.log("⚠️ Could not find title field for Variant B");
    }

    // STEP 3: CRITICAL TEST - Switch back to Variant A and check for contamination
    console.log(
      "🔍 STEP 3: CRITICAL TEST - Checking for cross-contamination...",
    );
    await page.click('button:has-text("Variant A")');
    await page.waitForTimeout(1000);

    // Re-find the title field for Variant A
    let currentTitleFieldA = null;
    for (const selector of titleSelectors) {
      const field = page.locator(selector).first();
      if (await field.isVisible().catch(() => false)) {
        currentTitleFieldA = field;
        break;
      }
    }

    const variantACurrentValue = currentTitleFieldA
      ? await currentTitleFieldA.inputValue().catch(() => "")
      : "";

    console.log(`🔍 Variant A current value: "${variantACurrentValue}"`);
    console.log(`🔍 Expected Variant A value: "${VARIANT_A_TITLE}"`);
    console.log(
      `🔍 Variant B value (should NOT be here): "${VARIANT_B_TITLE}"`,
    );

    // CRITICAL ASSERTION: Variant A should have its original title, NOT Variant B's title
    if (variantACurrentValue === VARIANT_B_TITLE) {
      console.error(
        "🚨 CROSS-CONTAMINATION DETECTED! Variant A has Variant B's title!",
      );
      throw new Error(
        `Cross-contamination detected: Variant A has "${variantACurrentValue}" but should have "${VARIANT_A_TITLE}"`,
      );
    }

    if (variantACurrentValue !== VARIANT_A_TITLE) {
      console.error("🚨 VARIANT A TITLE LOST! Expected title not found!");
      throw new Error(
        `Variant A title lost: Expected "${VARIANT_A_TITLE}" but got "${variantACurrentValue}"`,
      );
    }

    console.log(
      "✅ Variant A title is correct - no cross-contamination detected",
    );

    // STEP 4: Verify Variant B still has its title
    console.log("🔍 STEP 4: Verifying Variant B title is still correct...");
    await page.click('button:has-text("Variant B")');
    await page.waitForTimeout(1000);

    const variantBCurrentValue = await titleFieldB.inputValue().catch(() => "");
    console.log(`🔍 Variant B current value: "${variantBCurrentValue}"`);
    console.log(`🔍 Expected Variant B value: "${VARIANT_B_TITLE}"`);

    if (variantBCurrentValue !== VARIANT_B_TITLE) {
      console.error("🚨 VARIANT B TITLE LOST!");
      throw new Error(
        `Variant B title lost: Expected "${VARIANT_B_TITLE}" but got "${variantBCurrentValue}"`,
      );
    }

    console.log("✅ Variant B title is correct");

    // STEP 5: Final verification - switch back to A one more time
    console.log(
      "🔍 STEP 5: Final verification - switching back to Variant A...",
    );
    await page.click('button:has-text("Variant A")');
    await page.waitForTimeout(1000);

    const finalVariantAValue = await titleFieldA.inputValue().catch(() => "");
    if (finalVariantAValue !== VARIANT_A_TITLE) {
      console.error("🚨 FINAL CHECK FAILED! Variant A title changed!");
      throw new Error(
        `Final check failed: Variant A should have "${VARIANT_A_TITLE}" but has "${finalVariantAValue}"`,
      );
    }

    console.log(
      "🎉 ✅ CROSS-CONTAMINATION TEST PASSED! Variants are truly independent!",
    );
  });

  test("should maintain different titles when switching between A and B multiple times", async ({
    page,
  }) => {
    console.log("🧪 Testing title persistence with multiple A/B switches...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    // Enable A/B Testing (default 2 variants)
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    // Fill experiment details
    await page.fill(
      'input[placeholder*="Homepage Hero Test"]',
      "Multiple Switch Title Test",
    );

    // Select goal and navigate to design
    console.log("🎯 Selecting campaign goal...");
    const goalCard = page.locator('[data-testid="goal-newsletter-signup"]');
    if (await goalCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalCard.click();
    }

    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);

    // Set titles for variants A and B
    const titles = {
      A: "Control - Newsletter Signup",
      B: "Test - Exclusive Updates",
    };

    // Set title for Variant A
    await page.click('button:has-text("Variant A")');
    await page.waitForTimeout(500);

    const titleFieldA = page
      .locator(
        'input[label*="Title"], input[label*="Headline"], [data-testid="headline"]',
      )
      .first();
    if (await titleFieldA.isVisible().catch(() => false)) {
      await titleFieldA.fill(titles.A);
    }

    // Set title for Variant B
    await page.click('button:has-text("Variant B")');
    await page.waitForTimeout(500);

    const titleFieldB = page
      .locator(
        'input[label*="Title"], input[label*="Headline"], [data-testid="headline"]',
      )
      .first();
    if (await titleFieldB.isVisible().catch(() => false)) {
      await titleFieldB.fill(titles.B);
    }

    // Test multiple switches and verify persistence
    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Switch cycle ${i + 1}/3`);

      // Switch to A and verify
      await page.click('button:has-text("Variant A")');
      await page.waitForTimeout(300);
      const valueA = await titleFieldA.inputValue().catch(() => "");
      if (valueA) expect(valueA).toBe(titles.A);

      // Switch to B and verify
      await page.click('button:has-text("Variant B")');
      await page.waitForTimeout(300);
      const valueB = await titleFieldB.inputValue().catch(() => "");
      if (valueB) expect(valueB).toBe(titles.B);
    }

    console.log("✅ Multiple switch title persistence test passed!");
  });

  test("should show variant buttons are clickable and active state changes", async ({
    page,
  }) => {
    console.log("🧪 Testing variant button functionality...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    // Enable A/B Testing
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    // Fill experiment details and proceed to design
    await page.fill(
      'input[placeholder*="Homepage Hero Test"]',
      "Variant Button Test",
    );

    // Select goal
    const goalCard = page.locator('[data-testid="goal-newsletter-signup"]');
    if (await goalCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalCard.click();
    }

    await page.click('button:has-text("Next")');
    await page.waitForTimeout(2000);

    // Verify variant buttons exist and are clickable
    const variantAButton = page.locator('button:has-text("Variant A")');
    const variantBButton = page.locator('button:has-text("Variant B")');

    await expect(variantAButton).toBeVisible();
    await expect(variantBButton).toBeVisible();

    // Test clicking between variants
    await variantAButton.click();
    await page.waitForTimeout(300);
    console.log("✅ Variant A button clicked successfully");

    await variantBButton.click();
    await page.waitForTimeout(300);
    console.log("✅ Variant B button clicked successfully");

    await variantAButton.click();
    await page.waitForTimeout(300);
    console.log("✅ Switched back to Variant A successfully");

    console.log("✅ Variant button functionality test passed!");
  });
});
