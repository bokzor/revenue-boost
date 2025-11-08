import { test, expect } from "../fixtures/enhanced-fixtures";
import { PrismaClient } from "@prisma/client";
import { TEST_CONFIG } from "../config/test-config";
import { TemplateType } from "../constants/template-types.js";

/**
 * CAMPAIGN PRIORITY E2E TEST SUITE
 *
 * This test suite validates that campaigns are displayed according to their priority.
 * Higher priority campaigns should always be displayed first.
 *
 * Test Coverage:
 * ✅ Highest priority campaign is displayed when multiple campaigns are active
 * ✅ Lower priority campaigns are not displayed when higher priority campaign exists
 * ✅ Campaign with same trigger type and delay respects priority
 * ✅ Priority sorting works correctly (higher number = higher priority)
 */

const prisma = new PrismaClient();

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// Use centralized config
const { STORE_URL, STORE_PASSWORD, STORE_ID } = TEST_CONFIG.STORE;
const TEST_EMAIL = TEST_CONFIG.TEST_EMAIL;

const POPUP_SELECTORS = [
  "[data-splitpop]",
  '[class*="popup"]',
  '[class*="modal"]',
  '[role="dialog"]',
  '[class*="spin"]',
  '[class*="lottery"]',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loginToStore(page: any) {
  await page.goto(STORE_URL, { waitUntil: "networkidle" });
  // Auto-added by Auggie: Password protection handling
  const passwordField = page.locator('input[name="password"]');
  if (await passwordField.isVisible({ timeout: 3000 })) {
    await passwordField.fill("a");
    await page.locator('button[type="submit"], input[type="submit"]').click();
    await page.waitForLoadState("networkidle");
  }

  const passwordInput = page.locator(
    'input[name="password"], input[type="password"]',
  );
  if (await passwordInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await passwordInput.fill(STORE_PASSWORD);
    await page.locator('button[type="submit"], input[type="submit"]').click();
    await page.waitForLoadState("networkidle");
  }
}

async function findPopup(page: any) {
  // First, try to find the shadow host container
  const shadowHost = page.locator("#split-pop-container").first();
  if ((await shadowHost.count()) > 0) {
    // Access the shadow root content using Playwright's piercing selector
    // Use the deep selector to pierce through shadow DOM
    return page.locator("#split-pop-container").first();
  }

  // Fallback to original selectors
  for (const selector of POPUP_SELECTORS) {
    const elements = await page.locator(selector).all();
    if (elements.length > 0) {
      return elements[0];
    }
  }
  return null;
}

async function findTextInShadowDOM(page: any, text: string) {
  // The popup is rendered inside the Shadow DOM (previewMode: true)
  return await page.evaluate((searchText: string) => {
    const container = document.querySelector("#split-pop-container");
    if (!container || !container.shadowRoot) return false;

    const shadowContent = container.shadowRoot.textContent || "";
    return shadowContent.includes(searchText);
  }, text);
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe("Campaign Priority", () => {
  test.beforeEach(async ({ page }) => {
    await loginToStore(page);
  });

  test("🎯 Should display HIGHEST priority campaign when multiple campaigns are active", async ({
    page,
  }) => {
    console.log("🧪 Testing campaign priority...");

    // Create LOW priority campaign
    const lowPriorityCampaign = await prisma.campaign.create({
      data: {
        storeId: STORE_ID,
        name: "Low Priority Campaign - Priority Test",
        status: "ACTIVE",
        templateType: TemplateType.LOTTERY_WHEEL,
        goal: "NEWSLETTER_SIGNUP",
        priority: 10, // LOW priority
        targetRules: JSON.stringify({
          enabled: true,
          enhancedTriggers: {
            enabled: true,
            page_load: { enabled: true, delay: 1000 },
          },
        }),
        contentConfig: JSON.stringify({
          headline: "🔵 Low Priority Popup",
          subheadline: "This should NOT be displayed",
          emailRequired: true,
          emailPlaceholder: "Enter your email",
          buttonText: "Submit Low",
          successMessage: "Low priority success!",
          prizes: [
            {
              id: "1",
              label: "5% OFF",
              probability: 1.0,
              discountCode: "LOW5",
              discountPercentage: 5,
            },
          ],
        }),
        designConfig: JSON.stringify({
          popupDesign: {
            type: "modal",
            position: "center",
            overlay: true,
            closeButton: true,
            backgroundColor: "#ffffff",
            textColor: "#000000",
            buttonColor: "#007BFF",
            buttonTextColor: "#ffffff",
          },
        }),
        discountConfig: JSON.stringify({
          enabled: false,
        }),
        templateConfig: JSON.stringify({}),
      },
    });

    console.log(
      `✅ Created low priority campaign: ${lowPriorityCampaign.id} (priority: 10)`,
    );

    // Create HIGH priority campaign
    const highPriorityCampaign = await prisma.campaign.create({
      data: {
        storeId: STORE_ID,
        name: "High Priority Campaign - Priority Test",
        status: "ACTIVE",
        templateType: TemplateType.LOTTERY_WHEEL,
        goal: "NEWSLETTER_SIGNUP",
        priority: 1000, // HIGH priority
        targetRules: JSON.stringify({
          enabled: true,
          enhancedTriggers: {
            enabled: true,
            page_load: { enabled: true, delay: 1000 },
          },
        }),
        contentConfig: JSON.stringify({
          headline: "🔴 High Priority Popup",
          subheadline: "This SHOULD be displayed",
          emailRequired: true,
          emailPlaceholder: "Enter your email",
          buttonText: "Submit High",
          successMessage: "High priority success!",
          prizes: [
            {
              id: "1",
              label: "20% OFF",
              probability: 1.0,
              discountCode: "HIGH20",
              discountPercentage: 20,
            },
          ],
        }),
        designConfig: JSON.stringify({
          popupDesign: {
            type: "modal",
            position: "center",
            overlay: true,
            closeButton: true,
            backgroundColor: "#ffffff",
            textColor: "#000000",
            buttonColor: "#007BFF",
            buttonTextColor: "#ffffff",
          },
        }),
        discountConfig: JSON.stringify({
          enabled: false,
        }),
        templateConfig: JSON.stringify({}),
      },
    });

    console.log(
      `✅ Created high priority campaign: ${highPriorityCampaign.id} (priority: 1000)`,
    );

    try {
      // Navigate to store and wait for popup
      await page.goto(STORE_URL, { waitUntil: "networkidle" });

      // Capture console logs BEFORE reload
      const consoleLogs: string[] = [];
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        const text = msg.text();
        consoleLogs.push(text);
        if (msg.type() === "error") {
          consoleErrors.push(text);
        }
      });

      // Reload to fetch updated campaigns
      console.log("🔄 Reloading page to fetch updated campaigns...");
      await page.reload({ waitUntil: "networkidle" });

      // Wait for popup to appear
      await page.waitForTimeout(2000);

      // Find popup
      const popup = await findPopup(page);
      expect(popup).not.toBeNull();
      console.log("✅ Found popup");

      // Wait for popup content to be rendered
      await page.waitForTimeout(2000);

      // Log console output
      console.log(`📋 Console logs (${consoleLogs.length}):`);
      consoleLogs.slice(-20).forEach((log) => console.log(`  ${log}`));
      if (consoleErrors.length > 0) {
        console.log(`❌ Console errors (${consoleErrors.length}):`);
        consoleErrors.forEach((err) => console.log(`  ${err}`));
      }

      // Debug: Log shadow DOM content
      const shadowContent = await page.evaluate(() => {
        const container = document.querySelector("#split-pop-container");
        if (!container || !container.shadowRoot) return "No shadow DOM found";
        return container.shadowRoot.textContent || "Shadow DOM is empty";
      });
      console.log("🔍 Shadow DOM content:", shadowContent.substring(0, 500));

      // ✅ VERIFY: High priority headline is displayed
      const hasHighPriorityHeadline = await findTextInShadowDOM(
        page,
        "🔴 High Priority Popup",
      );
      expect(hasHighPriorityHeadline).toBe(true);
      console.log("✅ High priority campaign is displayed");

      // ✅ VERIFY: Low priority headline is NOT displayed
      const hasLowPriorityHeadline = await findTextInShadowDOM(
        page,
        "🔵 Low Priority Popup",
      );
      expect(hasLowPriorityHeadline).toBe(false);
      console.log("✅ Low priority campaign is NOT displayed");

      // ✅ VERIFY: High priority prize is in the wheel
      const hasHighPriorityPrize = await findTextInShadowDOM(page, "20% OFF");
      expect(hasHighPriorityPrize).toBe(true);
      console.log("✅ High priority prize (20% OFF) is in the wheel");

      // ✅ VERIFY: Low priority prize is NOT in the wheel
      const hasLowPriorityPrize = await findTextInShadowDOM(page, "5% OFF");
      expect(hasLowPriorityPrize).toBe(false);
      console.log("✅ Low priority prize (5% OFF) is NOT in the wheel");
    } finally {
      // Cleanup
      await prisma.campaign.delete({ where: { id: lowPriorityCampaign.id } });
      await prisma.campaign.delete({ where: { id: highPriorityCampaign.id } });
      console.log("🧹 Cleaned up test campaigns");
    }
  });

  test("🎯 Should display campaign with custom prizes (not default prizes)", async ({
    page,
  }) => {
    console.log("🧪 Testing custom prizes configuration...");

    // Create campaign with CUSTOM prizes
    const customPrizesCampaign = await prisma.campaign.create({
      data: {
        storeId: STORE_ID,
        name: "Custom Prizes Campaign - Config Test",
        status: "ACTIVE",
        templateType: TemplateType.LOTTERY_WHEEL,
        goal: "NEWSLETTER_SIGNUP",
        priority: 2000, // Very high priority
        targetRules: JSON.stringify({
          enabled: true,
          enhancedTriggers: {
            enabled: true,
            page_load: { enabled: true, delay: 1000 },
          },
        }),
        contentConfig: JSON.stringify({
          headline: "🎁 Custom Prizes Test",
          subheadline: "Testing custom prize configuration",
          emailRequired: true,
          emailPlaceholder: "Enter your email",
          buttonText: "Spin for Custom Prize",
          successMessage: "You won a custom prize!",
          prizes: [
            {
              id: "custom1",
              label: "CUSTOM 50% OFF",
              probability: 1.0,
              discountCode: "CUSTOM50",
              discountPercentage: 50,
            },
          ],
        }),
        designConfig: JSON.stringify({
          popupDesign: {
            type: "modal",
            position: "center",
            overlay: true,
            closeButton: true,
            backgroundColor: "#ffffff",
            textColor: "#000000",
            buttonColor: "#007BFF",
            buttonTextColor: "#ffffff",
          },
        }),
        discountConfig: JSON.stringify({
          enabled: false,
        }),
        templateConfig: JSON.stringify({}),
      },
    });

    console.log(
      `✅ Created custom prizes campaign: ${customPrizesCampaign.id}`,
    );

    try {
      // Navigate to store
      await page.goto(STORE_URL, { waitUntil: "networkidle" });

      // Reload to fetch updated campaigns
      console.log("🔄 Reloading page to fetch updated campaigns...");
      await page.reload({ waitUntil: "networkidle" });

      // Capture console logs
      const consoleLogs: string[] = [];
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        const text = msg.text();
        consoleLogs.push(text);
        if (msg.type() === "error") {
          consoleErrors.push(text);
        }
      });

      // Wait for popup
      await page.waitForTimeout(3000);

      // Log console output
      console.log(`📋 Console logs (${consoleLogs.length}):`);
      consoleLogs.forEach((log) => console.log(`  ${log}`));
      if (consoleErrors.length > 0) {
        console.log(`❌ Console errors (${consoleErrors.length}):`);
        consoleErrors.forEach((err) => console.log(`  ${err}`));
      }

      // Find popup
      const popup = await findPopup(page);
      if (!popup) {
        console.log("❌ No popup found!");
        console.log("📸 Taking screenshot for debugging...");
        await page.screenshot({ path: "test-results/no-popup-debug.png" });
      }
      expect(popup).not.toBeNull();
      console.log("✅ Found popup");

      // ✅ VERIFY: Custom prize is displayed (using shadow DOM helper)
      const hasCustomPrize = await findTextInShadowDOM(page, "CUSTOM 50% OFF");
      expect(hasCustomPrize).toBe(true);
      console.log("✅ Custom prize (CUSTOM 50% OFF) is displayed");

      // ✅ VERIFY: Default prizes are NOT displayed
      const hasDefaultPrize5 = await findTextInShadowDOM(page, "5% OFF");
      const hasDefaultPrize10 = await findTextInShadowDOM(page, "10% OFF");
      const hasDefaultPrize15 = await findTextInShadowDOM(page, "15% OFF");
      const hasDefaultPrize20 = await findTextInShadowDOM(page, "20% OFF");
      const hasDefaultFreeShipping = await findTextInShadowDOM(
        page,
        "Free Shipping",
      );
      const hasDefaultTryAgain = await findTextInShadowDOM(page, "Try Again");

      const hasAnyDefaultPrize =
        hasDefaultPrize5 ||
        hasDefaultPrize10 ||
        hasDefaultPrize15 ||
        hasDefaultPrize20 ||
        hasDefaultFreeShipping ||
        hasDefaultTryAgain;

      expect(hasAnyDefaultPrize).toBe(false);
      console.log("✅ Default prizes are NOT displayed");
    } finally {
      // Cleanup
      await prisma.campaign.delete({ where: { id: customPrizesCampaign.id } });
      console.log("🧹 Cleaned up test campaign");
    }
  });
});
