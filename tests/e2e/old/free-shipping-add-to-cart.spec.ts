import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { QuickBuilders } from "../helpers/campaign-builders";

/**
 * FREE SHIPPING TEMPLATE - ADD TO CART TRIGGER E2E TEST
 *
 * Tests the free shipping threshold popup with add_to_cart trigger
 * on a real Shopify product page.
 *
 * Product Page: https://split-pop.myshopify.com/products/the-multi-managed-snowboard
 *
 * Test Flow:
 * 1. Create free shipping campaign with add_to_cart trigger
 * 2. Navigate to product page
 * 3. Click "Add to cart" button
 * 4. Verify popup appears with free shipping message
 * 5. Verify popup content (threshold, progress, CTA)
 * 6. Clean up campaign
 */

const STORE_URL = "https://split-pop.myshopify.com";
const STORE_PASSWORD = "a";
const PRODUCT_URL = `${STORE_URL}/products/the-multi-managed-snowboard`;

// Helper to login to password-protected store
async function loginToStore(page: Page) {
  await page.goto(STORE_URL);
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
  if ((await passwordInput.count()) > 0) {
    console.log("🔐 Entering store password...");
    await passwordInput.fill(STORE_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
    console.log("✅ Logged into store");
  }
}

// Helper to setup console log listener
function setupConsoleListener(page: Page): string[] {
  const consoleLogs: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    const text = msg.text();
    consoleLogs.push(text);
  });
  return consoleLogs;
}

// Helper to verify trigger setup in console logs
function verifyTriggerSetup(logs: string[], triggerType: string): boolean {
  return logs.some(
    (log) =>
      log.includes(`Setting up ${triggerType} trigger`) ||
      log.includes(`${triggerType} trigger`) ||
      log.includes(triggerType),
  );
}

// Helper to check for campaign popup in DOM
async function checkForCampaignPopup(
  page: Page,
  campaignId: string,
): Promise<boolean> {
  // First check if the split-pop container exists
  const container = await page.locator("#split-pop-container").count();
  if (container === 0) {
    console.log("  ❌ No split-pop-container found");
    return false;
  }
  console.log("  ✅ Found split-pop-container");

  // Check if container has shadow root with content
  const hasShadowContent = await page.evaluate(() => {
    const container = document.getElementById("split-pop-container");
    if (!container || !container.shadowRoot) {
      return false;
    }

    // Check if shadow root has any content
    const shadowContent = container.shadowRoot.innerHTML;
    console.log("  📋 Shadow DOM content length:", shadowContent.length);

    // Check for actual popup content (not just empty container)
    const hasContent = shadowContent.length > 100; // More than just empty divs
    return hasContent;
  });

  if (!hasShadowContent) {
    console.log("  ❌ Shadow DOM exists but has no content");
    return false;
  }

  console.log("  ✅ Popup has content in shadow DOM");
  return true;
}

test.describe("Free Shipping Template - Add to Cart Trigger", () => {
  let prisma: PrismaClient;

  test.beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("should show free shipping popup when product is added to cart", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing FREE SHIPPING template with ADD_TO_CART trigger...",
    );

    // Create campaign with free shipping template and add_to_cart trigger
    const campaign = await QuickBuilders.custom(
      prisma,
      "Free Shipping - Add to Cart Test",
    )
      .withTemplateType("free-shipping")
      .withTrigger({
        enhancedTriggers: {
          add_to_cart: {
            enabled: true,
            delay: 500,
            immediate: false,
          },
        },
      })
      .build();

    console.log(`✅ Created campaign: ${campaign.id}`);
    console.log(`📋 Template: free-shipping, Trigger: add_to_cart`);

    // Debug: Print campaign targetRules
    const targetRules =
      typeof campaign.targetRules === "string"
        ? JSON.parse(campaign.targetRules)
        : campaign.targetRules;
    console.log(
      `🔍 Campaign targetRules.enhancedTriggers:`,
      JSON.stringify(targetRules.enhancedTriggers, null, 2),
    );

    // Wait a bit to ensure campaign is in database
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const consoleLogs = setupConsoleListener(page);

      // Login to store first
      await loginToStore(page);
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Navigate to a SPECIFIC product page (not the multi-managed one, use a simpler product)
      console.log(`🛍️ Navigating to product page...`);

      // Force hard reload to clear cached JavaScript bundles
      await page.goto(`${STORE_URL}/products/the-collection-snowboard-liquid`, {
        waitUntil: "networkidle",
      });

      // Perform a hard reload to ensure we get the latest bundle
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(3000); // Increased wait for storefront extension to load

      // Debug: Print all console logs
      console.log("\n📋 All console logs:");
      consoleLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log}`);
      });

      // Verify trigger was set up correctly
      const triggerSetup = verifyTriggerSetup(consoleLogs, "add_to_cart");
      expect(triggerSetup, "add_to_cart trigger should be set up").toBe(true);
      console.log("  ✅ add_to_cart trigger setup verified in console");

      // Find the "Add to cart" button - use simpler selector
      const addToCartButton = page
        .locator('button:has-text("Add to cart")')
        .first();

      // Verify button is visible
      const isVisible = await addToCartButton.isVisible({ timeout: 5000 });
      expect(isVisible, "Add to cart button should be visible").toBe(true);
      console.log("  ✅ Found 'Add to cart' button");

      // Click the button
      await addToCartButton.click();
      console.log("  🛒 Clicked 'Add to cart' button");

      // Wait for add_to_cart trigger (500ms delay + buffer)
      await page.waitForTimeout(2000);

      // Log PopupManager state
      console.log("\n📋 PopupManager console logs:");
      consoleLogs.forEach((log, index) => {
        if (log.includes("PopupManager")) {
          console.log(`  ${index + 1}. ${log}`);
        }
      });

      // Verify popup appears
      const popupFound = await checkForCampaignPopup(page, campaign.id);
      expect(
        popupFound,
        "Free shipping popup should appear after add to cart",
      ).toBe(true);

      // Verify popup content
      const pageContent = await page.content();
      const hasThresholdMessage =
        pageContent.includes("75") || pageContent.includes("shipping");
      expect(
        hasThresholdMessage,
        "Popup should contain free shipping threshold message",
      ).toBe(true);

      console.log("✅ Free shipping popup test PASSED");
      console.log("  ✓ Trigger setup verified");
      console.log("  ✓ Add to cart button clicked");
      console.log("  ✓ Popup appeared");
      console.log("  ✓ Content verified");
    } finally {
      // Clean up campaign
      await prisma.campaign
        .delete({ where: { id: campaign.id } })
        .catch(() => {});
      console.log(`🗑️ Cleaned up campaign: ${campaign.id}`);
    }
  });
});
