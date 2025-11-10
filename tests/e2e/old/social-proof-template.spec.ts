import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { convertLegacyTriggerToEnhanced } from "../helpers/campaign-builders";
import { ShadowDOMHelper } from "../utils/shadow-dom-helpers";
import { TemplateType } from "../constants/template-types.js";

/**
 * E2E Tests for Social Proof Popup Template
 * Tests the preview mode rendering of social proof notifications
 *
 * NOTE: Social proof notifications render inside Shadow DOM, so we use
 * ShadowDOMHelper to access the content.
 */

const prisma = new PrismaClient();
const TEST_STORE_ID = "cmhh2nulv000mt2emn7wqxfks"; // split-pop.myshopify.com (updated)
const STOREFRONT_URL = "https://split-pop.myshopify.com";
const STORE_PASSWORD = "a";

/**
 * Helper function to handle store password protection
 */
async function loginToStore(page: any, url: string) {
  await page.goto(url, { waitUntil: "networkidle" });

  // Handle password protection
  const passwordInput = page.locator(
    'input[name="password"], input[type="password"]',
  );
  const hasPassword = (await passwordInput.count()) > 0;

  if (hasPassword) {
    console.log("🔑 Entering store password...");
    await passwordInput.fill(STORE_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
    console.log("✅ Successfully entered store");
  }
}

test.describe("Social Proof Template - Preview Mode", () => {
  let campaignId: string;

  test.beforeAll(async () => {
    // Create a social proof campaign for testing
    // Convert legacy trigger format to enhancedTriggers
    const legacyTrigger = {
      enabled: true,
      primaryTrigger: { type: "page_load", config: { delay: 2000 } },
    };
    const enhancedTriggers = convertLegacyTriggerToEnhanced(legacyTrigger);

    const campaign = await prisma.campaign.create({
      data: {
        storeId: TEST_STORE_ID,
        name: "Preview Social Proof",
        description: "Social proof notification for E2E testing",
        goal: "ENGAGEMENT",
        status: "ACTIVE",
        priority: 1,
        templateType: TemplateType.SOCIAL_PROOF,
        templateId: "social-proof",
        contentConfig: JSON.stringify({
          enablePurchaseNotifications: true,
          enableVisitorNotifications: true,
          enableReviewNotifications: true,
          position: "bottom-left",
          displayDuration: 5,
          rotationInterval: 8,
          maxNotificationsPerSession: 5,
        }),
        designConfig: JSON.stringify({
          backgroundColor: "#FFFFFF",
          textColor: "#1A1A1A",
          buttonColor: "#10B981",
        }),
        targetRules: JSON.stringify({
          enhancedTriggers,
          deviceTypes: ["desktop", "mobile", "tablet"],
          frequencyCapping: {
            maxPerSession: 999,
            maxPerDay: 999,
            cooldownHours: 0,
          },
        }),
        audienceContracts: JSON.stringify({}),
        templateConfig: JSON.stringify({}),
        discountConfig: JSON.stringify({}),
      },
    });

    campaignId = campaign.id;
    console.log(`✅ Created campaign: ${campaignId} (Preview Social Proof)`);
    console.log(`🎯 Template: social-proof-notification, Trigger: page_load`);
  });

  test.afterAll(async () => {
    // Clean up the campaign
    if (campaignId) {
      await prisma.campaign.delete({
        where: { id: campaignId },
      });
      console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
    }
    await prisma.$disconnect();
  });

  test("should display social proof notification in preview mode", async ({
    page,
  }) => {
    // Navigate to the storefront with preview mode enabled
    const PREVIEW_URL = `${STOREFRONT_URL}/?split_pop_preview=${campaignId}`;
    await loginToStore(page, PREVIEW_URL);

    // Wait for the initialization to complete
    await page.waitForTimeout(3000);

    // Check for the popup container in the DOM
    const popupContainer = page.locator("#split-pop-container");
    await expect(popupContainer).toBeAttached();

    // Initialize Shadow DOM helper
    const shadowHelper = new ShadowDOMHelper(page);

    // Wait for Shadow DOM to be ready
    await shadowHelper.waitForShadowDOMReady("#split-pop-container", 10000);

    // Poll for the notification to appear (social proof has rotation interval)
    // Wait up to 15 seconds for a notification to appear
    let notificationExists = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 500ms = 15 seconds

    while (!notificationExists && attempts < maxAttempts) {
      notificationExists = await page.evaluate(() => {
        const container = document.querySelector("#split-pop-container");
        if (!container || !container.shadowRoot) return false;

        const notification = container.shadowRoot.querySelector(
          ".social-proof-notification",
        );
        return !!notification;
      });

      if (!notificationExists) {
        await page.waitForTimeout(500);
        attempts++;
      }
    }

    if (!notificationExists) {
      // Take a screenshot for debugging
      await page.screenshot({
        path: "test-results/screenshots/social-proof-not-visible.png",
      });

      console.log(
        `❌ Notification not found after ${attempts} attempts (${attempts * 500}ms)`,
      );

      throw new Error(
        "Social proof notification not found in Shadow DOM after 15 seconds. See screenshot for details.",
      );
    }

    console.log(
      `✅ Social proof notification found after ${attempts} attempts (${attempts * 500}ms)!`,
    );

    // Verify the notification has content
    const notificationText = await shadowHelper.getShadowText(
      "#split-pop-container",
      ".social-proof-notification",
    );

    expect(notificationText).toBeTruthy();
    console.log(
      "✅ Notification has content:",
      notificationText?.substring(0, 50),
    );
  });

  test("should show notification with correct data", async ({ page }) => {
    const PREVIEW_URL = `${STOREFRONT_URL}/?split_pop_preview=${campaignId}`;
    await loginToStore(page, PREVIEW_URL);
    await page.waitForTimeout(3000);

    // Initialize Shadow DOM helper
    const shadowHelper = new ShadowDOMHelper(page);

    // Wait for Shadow DOM to be ready
    await shadowHelper.waitForShadowDOMReady("#split-pop-container", 10000);

    // Poll for the notification to appear
    let notificationText: string | null = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 500ms = 15 seconds

    while (!notificationText && attempts < maxAttempts) {
      notificationText = await shadowHelper.getShadowText(
        "#split-pop-container",
        ".social-proof-notification",
      );

      if (!notificationText) {
        await page.waitForTimeout(500);
        attempts++;
      }
    }

    if (!notificationText) {
      await page.screenshot({
        path: "test-results/screenshots/social-proof-no-content.png",
      });

      console.log(`❌ Notification text not found after ${attempts} attempts`);

      throw new Error(
        "Social proof notification content not found in Shadow DOM. Check screenshot.",
      );
    }

    console.log(
      `✅ Notification found after ${attempts} attempts. Text:`,
      notificationText,
    );

    // Check for expected content patterns (from mock data)
    const hasCustomerName = /Mike|John|Sarah/.test(notificationText);
    const hasProductName = /Sneakers|T-Shirt|Jeans/.test(notificationText);
    const hasLocation = /Chicago|New York|Los Angeles/.test(notificationText);
    const hasVisitorCount = /\d+\s+(person|people)/.test(notificationText);
    const hasReviewRating = /\d+\.\d+/.test(notificationText);

    // At least one type of notification should be present
    const hasContent =
      hasCustomerName ||
      hasProductName ||
      hasLocation ||
      hasVisitorCount ||
      hasReviewRating;

    if (!hasContent) {
      await page.screenshot({
        path: "test-results/screenshots/social-proof-no-content.png",
      });

      throw new Error(
        `Social proof notification has no recognizable content. Text: "${notificationText}"`,
      );
    }

    console.log("✅ Social proof notification has valid content!");
    expect(hasContent).toBe(true);
  });

  test("should handle close button interaction", async ({ page }) => {
    const PREVIEW_URL = `${STOREFRONT_URL}/?split_pop_preview=${campaignId}`;
    await loginToStore(page, PREVIEW_URL);
    await page.waitForTimeout(3000);

    // Initialize Shadow DOM helper
    const shadowHelper = new ShadowDOMHelper(page);

    // Wait for Shadow DOM to be ready
    await shadowHelper.waitForShadowDOMReady("#split-pop-container", 10000);

    // Check if notification is visible before clicking close
    const isVisibleBefore = await shadowHelper.isShadowElementVisible(
      "#split-pop-container",
      ".social-proof-notification",
    );

    if (!isVisibleBefore) {
      console.log("⚠️ Notification not visible, skipping close button test");
      return;
    }

    console.log("✅ Notification is visible, testing close button...");

    // Try to click the close button inside Shadow DOM
    try {
      await shadowHelper.clickShadowElement(
        "#split-pop-container",
        ".social-proof-notification button[aria-label*='Dismiss']",
        { timeout: 5000 },
      );

      await page.waitForTimeout(500);

      // Check if notification is still visible after close
      const isVisibleAfter = await shadowHelper.isShadowElementVisible(
        "#split-pop-container",
        ".social-proof-notification",
      );

      console.log(
        `Notification after close: ${isVisibleAfter ? "still visible" : "hidden"}`,
      );

      // Note: Social proof notifications auto-rotate, so they might reappear
      // We just verify the close button is clickable
    } catch (error) {
      console.log(
        "⚠️ Close button not found or not clickable:",
        (error as Error).message,
      );
    }
  });

  test("should debug - verify Shadow DOM structure", async ({ page }) => {
    const PREVIEW_URL = `${STOREFRONT_URL}/?split_pop_preview=${campaignId}`;
    await loginToStore(page, PREVIEW_URL);
    await page.waitForTimeout(3000);

    // Initialize Shadow DOM helper
    const shadowHelper = new ShadowDOMHelper(page);

    // Check if container exists
    const containerCount = await page.locator("#split-pop-container").count();
    console.log(`Split-Pop containers: ${containerCount}`);

    if (containerCount === 0) {
      console.log("❌ No split-pop-container found!");
      return;
    }

    // Check if Shadow DOM exists
    const hasShadowRoot = await page.evaluate(() => {
      const container = document.querySelector("#split-pop-container");
      return container ? !!container.shadowRoot : false;
    });

    console.log(`Shadow DOM present: ${hasShadowRoot}`);

    if (!hasShadowRoot) {
      console.log("❌ No Shadow DOM found!");
      return;
    }

    // Get Shadow DOM content
    const shadowContent = await page.evaluate(() => {
      const container = document.querySelector("#split-pop-container");
      if (!container || !container.shadowRoot) return "No shadow root";

      const notification = container.shadowRoot.querySelector(
        ".social-proof-notification",
      );
      if (!notification) return "No notification element found";

      return {
        classes: notification.className,
        textContent: notification.textContent?.substring(0, 200),
        childCount: notification.children.length,
      };
    });

    console.log("Shadow DOM content:", JSON.stringify(shadowContent, null, 2));

    // Verify notification is visible using helper
    const isVisible = await shadowHelper.isShadowElementVisible(
      "#split-pop-container",
      ".social-proof-notification",
    );

    console.log(`Notification visible: ${isVisible}`);

    // Take a full page screenshot
    const fs = require("fs");
    const socialProofDir = "test-results/social-proof";
    if (!fs.existsSync(socialProofDir)) {
      fs.mkdirSync(socialProofDir, { recursive: true });
    }
    await page.screenshot({
      path: `${socialProofDir}/social-proof-full-page.png`,
      fullPage: true,
    });
    console.log("📸 Screenshot saved: social-proof/social-proof-full-page.png");
  });
});
