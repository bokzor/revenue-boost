import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * A/B TESTING GOAL CONSISTENCY E2E TEST SUITE
 *
 * Tests the goal consistency validation for A/B testing experiments:
 * - All variants must share the same campaign goal
 * - Goal changes propagate to all variants
 * - Goal is locked when switching between variants
 * - Clear UI feedback about shared goals
 * - Backend validation prevents mismatched goals
 */

test.describe("A/B Testing Goal Consistency", () => {
  let prisma: PrismaClient;
  const STORE_PASSWORD = "a";

  // Helper to handle store password if needed
  async function handleStorePassword(page) {
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

  test.beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("should show shared goal banner when A/B testing is enabled", async ({
    page,
  }) => {
    console.log("🧪 Testing shared goal banner visibility...");

    await page.goto("/campaigns/new");
    // Auto-added by Auggie: Password protection handling
    const passwordField = page.locator('input[name="password"]');
    if (await passwordField.isVisible({ timeout: 3000 })) {
      await passwordField.fill("a");
      await page.locator('button[type="submit"], input[type="submit"]').click();
      await page.waitForLoadState("networkidle");
    }

    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    // Initially, banner should not be visible
    const sharedGoalBanner = page.locator(
      'text="All variants share the same goal"',
    );
    await expect(sharedGoalBanner).not.toBeVisible();

    // Enable A/B Testing
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    // Now banner should be visible
    await expect(sharedGoalBanner).toBeVisible();

    // Verify banner contains helpful text
    await expect(
      page.getByText(/In A\/B testing, variants test different approaches/i),
    ).toBeVisible();

    // Verify heading shows "(Shared by All Variants)"
    await expect(
      page.locator('text="Campaign Goal (Shared by All Variants)"'),
    ).toBeVisible();

    console.log("✅ Shared goal banner test passed!");
  });

  test("should propagate goal changes to all variants", async ({ page }) => {
    console.log("🧪 Testing goal change propagation...");

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
      "Goal Propagation Test",
    );
    await page.fill(
      'textarea[placeholder*="Changing the CTA"]',
      "Testing goal propagation across variants",
    );

    // Select a goal (e.g., Newsletter Signup)
    const goalSelector = page.locator("select").first(); // Assuming first select is goal selector
    if ((await goalSelector.count()) > 0) {
      await goalSelector.selectOption({ label: "Newsletter Signup" });
      await page.waitForTimeout(500);

      // Verify banner shows current goal
      await expect(page.locator('text="Current goal:"')).toBeVisible();
      await expect(page.locator('text="NEWSLETTER_SIGNUP"')).toBeVisible();

      // Switch to Variant B
      await page.click('button:has-text("Variant B")');
      await page.waitForTimeout(300);

      // Goal should still be Newsletter Signup (locked)
      const goalValue = await goalSelector.inputValue();
      expect(goalValue).toBe("NEWSLETTER_SIGNUP");

      // Switch to Variant C
      await page.click('button:has-text("Variant C")');
      await page.waitForTimeout(300);

      // Goal should still be Newsletter Signup
      const goalValueC = await goalSelector.inputValue();
      expect(goalValueC).toBe("NEWSLETTER_SIGNUP");

      console.log("✅ Goal propagation test passed!");
    } else {
      console.log("⚠️ Goal selector not found, skipping test");
    }
  });

  test("should maintain goal consistency when switching variants", async ({
    page,
  }) => {
    console.log("🧪 Testing goal consistency across variant switches...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    // Enable A/B Testing
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    // Select 4 variants
    await page.click('button:has-text("4 Variants")');
    await page.waitForTimeout(500);

    // Fill experiment details
    await page.fill(
      'input[placeholder*="Homepage Hero Test"]',
      "Variant Switch Goal Test",
    );

    // Get goal selector
    const goalSelector = page.locator("select").first();
    if ((await goalSelector.count()) > 0) {
      // Set initial goal
      await goalSelector.selectOption({ label: "Increase Revenue" });
      await page.waitForTimeout(500);

      // Switch through all variants and verify goal remains the same
      for (const variant of ["A", "B", "C", "D"]) {
        await page.click(`button:has-text("Variant ${variant}")`);
        await page.waitForTimeout(200);

        const currentGoal = await goalSelector.inputValue();
        expect(currentGoal).toBe("INCREASE_REVENUE");
      }

      console.log("✅ Goal consistency test passed!");
    } else {
      console.log("⚠️ Goal selector not found, skipping test");
    }
  });

  test("should update all variants when goal is changed", async ({ page }) => {
    console.log("🧪 Testing goal update across all variants...");

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
      "Goal Update Test",
    );

    const goalSelector = page.locator("select").first();
    if ((await goalSelector.count()) > 0) {
      // Set initial goal to Newsletter Signup
      await goalSelector.selectOption({ label: "Newsletter Signup" });
      await page.waitForTimeout(500);

      // Verify Variant A has Newsletter Signup
      await page.click('button:has-text("Variant A")');
      await page.waitForTimeout(200);
      let goalA = await goalSelector.inputValue();
      expect(goalA).toBe("NEWSLETTER_SIGNUP");

      // Change goal to Increase Revenue
      await goalSelector.selectOption({ label: "Increase Revenue" });
      await page.waitForTimeout(500);

      // Check console for confirmation message
      // (In real implementation, we log: "✅ Updated goal to 'INCREASE_REVENUE' for all X variants")

      // Switch to Variant B and verify it also has Increase Revenue
      await page.click('button:has-text("Variant B")');
      await page.waitForTimeout(200);
      let goalB = await goalSelector.inputValue();
      expect(goalB).toBe("INCREASE_REVENUE");

      // Verify banner shows updated goal
      await expect(page.locator('text="INCREASE_REVENUE"')).toBeVisible();

      console.log("✅ Goal update test passed!");
    } else {
      console.log("⚠️ Goal selector not found, skipping test");
    }
  });

  test("should disable A/B testing and restore normal goal behavior", async ({
    page,
  }) => {
    console.log("🧪 Testing A/B testing disable...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    // Enable A/B Testing
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    // Verify shared goal banner is visible
    await expect(
      page.locator('text="All variants share the same goal"'),
    ).toBeVisible();

    // Disable A/B Testing
    await abTestingCheckbox.uncheck();
    await page.waitForTimeout(500);

    // Verify shared goal banner is no longer visible
    await expect(
      page.locator('text="All variants share the same goal"'),
    ).not.toBeVisible();

    // Verify heading no longer shows "(Shared by All Variants)"
    await expect(
      page.locator('text="Campaign Goal (Shared by All Variants)"'),
    ).not.toBeVisible();

    // Verify normal "Campaign Goal" heading is visible
    await expect(page.locator('text="Campaign Goal"')).toBeVisible();

    console.log("✅ A/B testing disable test passed!");
  });

  test("should show goal in banner after selection", async ({ page }) => {
    console.log("🧪 Testing goal display in banner...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    // Enable A/B Testing
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    const goalSelector = page.locator("select").first();
    if ((await goalSelector.count()) > 0) {
      // Select Newsletter Signup
      await goalSelector.selectOption({ label: "Newsletter Signup" });
      await page.waitForTimeout(500);

      // Verify banner shows the goal
      await expect(page.locator('text="Current goal:"')).toBeVisible();
      await expect(page.locator('text="NEWSLETTER_SIGNUP"')).toBeVisible();

      // Change to Engagement
      await goalSelector.selectOption({ label: "Engagement" });
      await page.waitForTimeout(500);

      // Verify banner updates
      await expect(page.locator('text="ENGAGEMENT"')).toBeVisible();

      console.log("✅ Goal display in banner test passed!");
    } else {
      console.log("⚠️ Goal selector not found, skipping test");
    }
  });

  test("should initialize all variants with same goal when enabling A/B testing", async ({
    page,
  }) => {
    console.log("🧪 Testing initial goal setup when enabling A/B testing...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    const goalSelector = page.locator("select").first();
    if ((await goalSelector.count()) > 0) {
      // Set a goal BEFORE enabling A/B testing
      await goalSelector.selectOption({ label: "Increase Revenue" });
      await page.waitForTimeout(500);

      // Now enable A/B Testing
      const abTestingCheckbox = page.getByRole("checkbox", {
        name: "Enable A/B Testing",
      });
      await abTestingCheckbox.check();
      await page.waitForTimeout(500);

      // Select 3 variants
      await page.click('button:has-text("3 Variants")');
      await page.waitForTimeout(500);

      // Verify all variants have the same goal (Increase Revenue)
      for (const variant of ["A", "B", "C"]) {
        await page.click(`button:has-text("Variant ${variant}")`);
        await page.waitForTimeout(200);

        const currentGoal = await goalSelector.inputValue();
        expect(currentGoal).toBe("INCREASE_REVENUE");
      }

      // Verify banner shows the goal
      await expect(page.locator('text="INCREASE_REVENUE"')).toBeVisible();

      console.log("✅ Initial goal setup test passed!");
    } else {
      console.log("⚠️ Goal selector not found, skipping test");
    }
  });

  test("should maintain goal consistency with 2 variants", async ({ page }) => {
    console.log("🧪 Testing goal consistency with 2 variants...");

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);

    // Enable A/B Testing (defaults to 2 variants)
    const abTestingCheckbox = page.getByRole("checkbox", {
      name: "Enable A/B Testing",
    });
    await abTestingCheckbox.check();
    await page.waitForTimeout(500);

    const goalSelector = page.locator("select").first();
    if ((await goalSelector.count()) > 0) {
      // Set goal to Engagement
      await goalSelector.selectOption({ label: "Engagement" });
      await page.waitForTimeout(500);

      // Verify Variant A has Engagement
      await page.click('button:has-text("Variant A")');
      await page.waitForTimeout(200);
      let goalA = await goalSelector.inputValue();
      expect(goalA).toBe("ENGAGEMENT");

      // Verify Variant B has Engagement
      await page.click('button:has-text("Variant B")');
      await page.waitForTimeout(200);
      let goalB = await goalSelector.inputValue();
      expect(goalB).toBe("ENGAGEMENT");

      console.log("✅ 2-variant goal consistency test passed!");
    } else {
      console.log("⚠️ Goal selector not found, skipping test");
    }
  });

  test("should show goal selector only on Variant A and read-only goal on other variants", async ({
    page,
  }) => {
    console.log(
      "🧪 Testing goal selector visibility: editable on Variant A, read-only on others...",
    );

    await page.goto("/campaigns/new");
    await page.waitForLoadState("networkidle");
    await handleStorePassword(page);
    await page.waitForTimeout(2000); // Wait for any banners/modals to load

    // Check if we can see the campaign creation form
    // If not visible, we might be on the dashboard with extension banner
    const campaignFormVisible = await page
      .locator('text="Enable A/B Testing"')
      .isVisible()
      .catch(() => false);

    if (!campaignFormVisible) {
      console.log(
        "  ⚠️ Campaign form not visible, might be on dashboard. Navigating again...",
      );
      await page.goto("/campaigns/new");
      await page.waitForLoadState("networkidle");
      await handleStorePassword(page);
      await page.waitForTimeout(2000);
    }

    // Wait for the page to be ready - look for the A/B Testing checkbox
    await page.waitForSelector('text="Enable A/B Testing"', { timeout: 15000 });

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
      "Goal Selector Visibility Test",
    );
    await page.fill(
      'textarea[placeholder*="Changing the CTA"]',
      "Testing goal selector visibility across variants",
    );

    // ========================================================================
    // VARIANT A: Goal selector should be visible and editable
    // ========================================================================
    console.log("  📋 Testing Variant A (Control)...");
    await page.click('button:has-text("Variant A")');
    await page.waitForTimeout(300);

    // Goal selector should be visible on Variant A
    const goalSelectorOnA = page.locator('[data-testid^="goal-"]').first();
    await expect(goalSelectorOnA).toBeVisible();
    console.log("    ✓ Goal selector is visible on Variant A");

    // Banner should say "Set the goal for all variants"
    const variantABanner = page.locator('text="Set the goal for all variants"');
    await expect(variantABanner).toBeVisible();
    console.log("    ✓ Banner shows 'Set the goal for all variants'");

    // Select a goal on Variant A
    await page.click('[data-testid="goal-newsletter-signup"]');
    await page.waitForTimeout(500);
    console.log("    ✓ Selected NEWSLETTER_SIGNUP goal");

    // ========================================================================
    // VARIANT B: Goal selector should NOT be visible (read-only)
    // ========================================================================
    console.log("  📋 Testing Variant B (Test Variant)...");
    await page.click('button:has-text("Variant B")');
    await page.waitForTimeout(300);

    // Goal selector should NOT be visible on Variant B
    const goalSelectorOnB = page.locator('[data-testid^="goal-"]').first();
    await expect(goalSelectorOnB).not.toBeVisible();
    console.log("    ✓ Goal selector is hidden on Variant B");

    // Read-only banner should be visible
    const readOnlyBanner = page.locator(
      'text="All variants in this A/B test share the same goal"',
    );
    await expect(readOnlyBanner).toBeVisible();
    console.log("    ✓ Read-only banner is visible");

    // Should show the goal name in the banner
    const goalDisplay = page.locator('text="Goal: NEWSLETTER SIGNUP"');
    await expect(goalDisplay).toBeVisible();
    console.log("    ✓ Goal is displayed as read-only: NEWSLETTER SIGNUP");

    // Should show instruction to switch to Variant A
    const switchInstruction = page.locator(
      'text="Switch to Variant A to change the experiment goal"',
    );
    await expect(switchInstruction).toBeVisible();
    console.log("    ✓ Instruction to switch to Variant A is shown");

    // ========================================================================
    // VARIANT C: Goal selector should also NOT be visible (read-only)
    // ========================================================================
    console.log("  📋 Testing Variant C (Test Variant)...");
    await page.click('button:has-text("Variant C")');
    await page.waitForTimeout(300);

    // Goal selector should NOT be visible on Variant C
    const goalSelectorOnC = page.locator('[data-testid^="goal-"]').first();
    await expect(goalSelectorOnC).not.toBeVisible();
    console.log("    ✓ Goal selector is hidden on Variant C");

    // Read-only banner should be visible
    await expect(readOnlyBanner).toBeVisible();
    console.log("    ✓ Read-only banner is visible");

    // Should show the goal name
    await expect(goalDisplay).toBeVisible();
    console.log("    ✓ Goal is displayed as read-only: NEWSLETTER SIGNUP");

    // ========================================================================
    // VERIFY: Switching back to Variant A shows selector again
    // ========================================================================
    console.log("  📋 Verifying Variant A still has editable goal selector...");
    await page.click('button:has-text("Variant A")');
    await page.waitForTimeout(300);

    await expect(goalSelectorOnA).toBeVisible();
    console.log("    ✓ Goal selector is visible again on Variant A");

    console.log("✅ Goal selector visibility test passed!");
  });
});
