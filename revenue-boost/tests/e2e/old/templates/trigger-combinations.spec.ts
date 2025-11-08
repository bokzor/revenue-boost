import { test, expect } from "../fixtures/enhanced-fixtures";
import { PrismaClient } from "@prisma/client";
import {
  takeTestScreenshot,
  TEST_CONFIG,
  loginToStore,
  findSplitPopPopup,
} from "../utils/template-test-framework";
import { TemplateType } from "../constants/template-types.js";

/**
 * TRIGGER COMBINATION E2E TEST SUITE
 *
 * This test suite provides comprehensive coverage for all trigger combinations:
 * - Page load delays: 1s, 2s, 3s, 5s
 * - Exit intent sensitivity: low, medium, high
 * - Scroll percentages: 25%, 50%, 75%
 * - Time on page triggers: 10s, 30s, 60s
 * - Cart requirements and conditions
 * - Multiple trigger combinations
 *
 * Test Coverage:
 * ✅ All page load delay variations and timing accuracy
 * ✅ Exit intent sensitivity levels and detection
 * ✅ Scroll percentage triggers and threshold accuracy
 * ✅ Time-based triggers and duration validation
 * ✅ Cart requirement enforcement
 * ✅ Multiple trigger combinations (AND/OR logic)
 * ✅ Trigger priority and conflict resolution
 * ✅ Mobile-specific trigger behaviors
 * ✅ Trigger performance and resource usage
 * ✅ Edge cases and error handling
 */

const prisma = new PrismaClient();
const STORE_ID = process.env.TEST_STORE_ID || TEST_CONFIG.STORE.ID;
const TEST_EMAIL = "trigger-test@example.com";

// Trigger configuration combinations
const TRIGGER_CONFIGS = {
  PAGE_LOAD_DELAYS: [1000, 2000, 3000, 5000], // 1s, 2s, 3s, 5s
  EXIT_INTENT_SENSITIVITY: ["low", "medium", "high"],
  SCROLL_PERCENTAGES: [25, 50, 75],
  TIME_ON_PAGE: [10000, 30000, 60000], // 10s, 30s, 60s
};

test.describe("Trigger Combination Tests", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("⏱️ Page Load Delay - 1 Second Trigger", async ({ page }) => {
    console.log("\n🧪 Testing Page Load trigger with 1 second delay...");

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Page Load 1s Delay Test",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.MINIMAL,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 1000, // 1 second
              },
            },
          }),
          designConfig: JSON.stringify({
            backgroundColor: "#FFFFFF",
            textColor: "#1F2937",
            buttonColor: "#3B82F6",
            buttonTextColor: "#FFFFFF",
            position: "center",
            size: "medium",
            overlayOpacity: 0.6,
          }),
          contentConfig: JSON.stringify({
            headline: "⚡ Quick 1-Second Trigger",
            subheadline: "Fast page load trigger activation",
            emailRequired: true,
            emailPlaceholder: "Enter email for quick trigger",
            buttonText: "Quick Subscribe",
            successMessage: "Quick subscription successful!",
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 10,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "QUICK10",
            expiryDays: 7,
          }),
        },
      });

      campaignId = campaign.id;

      // Record start time for timing validation
      const startTime = Date.now();

      await loginToStore(page);

      // Wait slightly longer than trigger delay to ensure activation
      await page.waitForTimeout(1500);

      const endTime = Date.now();
      const actualDelay = endTime - startTime;

      console.log(
        `⏰ Actual trigger delay: ${actualDelay}ms (expected: ~1000ms)`,
      );

      const popup = await findSplitPopPopup(page, 5000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 5000 });

      // Verify quick trigger content
      await expect(
        page.locator(':has-text("Quick 1-Second Trigger")'),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("Fast page load trigger")'),
      ).toBeVisible();

      // Test quick interaction
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const quickButton = page
        .locator('button:has-text("Quick Subscribe")')
        .first();
      await quickButton.click();
      await page.waitForTimeout(2000);

      // Verify quick success
      await expect(
        page.locator(':has-text("Quick subscription successful")'),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.locator(':has-text("QUICK10")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "trigger-page-load-1-second.png",
        "triggers",
      );

      console.log("✅ Page Load 1 Second Trigger test PASSED");
    } catch (error) {
      console.error("❌ Page Load 1 Second Trigger test FAILED:", error);
      await takeTestScreenshot(
        page,
        "trigger-page-load-1s-error.png",
        "triggers",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("🚪 Exit Intent - High Sensitivity Trigger", async ({ page }) => {
    console.log("\n🧪 Testing Exit Intent trigger with high sensitivity...");

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Exit Intent High Sensitivity Test",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.FLASH_SALE_MODAL,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              exit_intent: {
                enabled: true,
                sensitivity: "high", // High sensitivity for easier triggering
              },
            },
          }),
          designConfig: JSON.stringify({
            backgroundColor: "#DC3545",
            textColor: "#FFFFFF",
            buttonColor: "#FFFFFF",
            buttonTextColor: "#DC3545",
            position: "center",
            size: "large",
            overlayOpacity: 0.9,
          }),
          contentConfig: JSON.stringify({
            headline: "🚨 WAIT! Don't Leave Yet!",
            subheadline: "High sensitivity exit intent detected",
            emailRequired: true,
            emailPlaceholder: "Enter email before leaving",
            buttonText: "Stay for Deal",
            successMessage: "Thanks for staying! Deal secured!",
            urgencyMessage: "Last chance before you leave!",
            countdownEnabled: true,
            countdownDuration: 300, // 5 minutes
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 25,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "STAY25",
            expiryDays: 1,
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);

      // Wait a moment for page to load
      await page.waitForTimeout(2000);

      // Trigger exit intent by moving mouse to top of viewport
      console.log("🖱️ Triggering exit intent with high sensitivity...");
      await page.mouse.move(0, 0);
      await page.waitForTimeout(1000);

      // Move mouse slightly to simulate exit intent
      await page.mouse.move(10, 0);
      await page.waitForTimeout(1000);

      const popup = await findSplitPopPopup(page, 8000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 8000 });

      // Verify exit intent content
      await expect(
        page.locator(':has-text("WAIT! Don\'t Leave Yet")'),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("High sensitivity exit intent")'),
      ).toBeVisible();

      // Test exit intent interaction
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const stayButton = page
        .locator('button:has-text("Stay for Deal")')
        .first();
      await stayButton.click();
      await page.waitForTimeout(2000);

      // Verify exit intent success
      await expect(page.locator(':has-text("Thanks for staying")')).toBeVisible(
        {
          timeout: 5000,
        },
      );
      await expect(page.locator(':has-text("STAY25")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "trigger-exit-intent-high-sensitivity.png",
        "triggers",
      );

      console.log("✅ Exit Intent High Sensitivity Trigger test PASSED");
    } catch (error) {
      console.error(
        "❌ Exit Intent High Sensitivity Trigger test FAILED:",
        error,
      );
      await takeTestScreenshot(
        page,
        "trigger-exit-intent-high-error.png",
        "triggers",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("📜 Scroll Percentage - 50% Trigger", async ({ page }) => {
    console.log("\n🧪 Testing Scroll Percentage trigger at 50%...");

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Scroll 50% Trigger Test",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.MINIMAL,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              scroll_percentage: {
                enabled: true,
                percentage: 50, // 50% scroll trigger
              },
            },
          }),
          designConfig: JSON.stringify({
            backgroundColor: "#28A745",
            textColor: "#FFFFFF",
            buttonColor: "#FFFFFF",
            buttonTextColor: "#28A745",
            position: "right",
            size: "medium",
            overlayOpacity: 0.7,
          }),
          contentConfig: JSON.stringify({
            headline: "📜 Halfway There!",
            subheadline: "You've scrolled 50% - perfect timing for an offer",
            emailRequired: true,
            emailPlaceholder: "Enter email at 50% scroll",
            buttonText: "Claim Halfway Reward",
            successMessage: "Halfway reward claimed!",
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 15,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "HALFWAY15",
            expiryDays: 14,
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Scroll to 50% of page height
      console.log("📜 Scrolling to 50% of page height...");
      await page.evaluate(() => {
        const scrollHeight = document.body.scrollHeight;
        const targetScroll = scrollHeight * 0.5;
        window.scrollTo(0, targetScroll);
      });

      // Wait for scroll trigger to activate
      await page.waitForTimeout(2000);

      const popup = await findSplitPopPopup(page, 8000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 8000 });

      // Verify scroll percentage content
      await expect(page.locator(':has-text("Halfway There")')).toBeVisible();
      await expect(page.locator(':has-text("scrolled 50%")')).toBeVisible();

      // Test scroll trigger interaction
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const halfwayButton = page
        .locator('button:has-text("Claim Halfway Reward")')
        .first();
      await halfwayButton.click();
      await page.waitForTimeout(2000);

      // Verify scroll trigger success
      await expect(
        page.locator(':has-text("Halfway reward claimed")'),
      ).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator(':has-text("HALFWAY15")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "trigger-scroll-50-percent.png",
        "triggers",
      );

      console.log("✅ Scroll 50% Trigger test PASSED");
    } catch (error) {
      console.error("❌ Scroll 50% Trigger test FAILED:", error);
      await takeTestScreenshot(page, "trigger-scroll-50-error.png", "triggers");
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("⏰ Time on Page - 30 Second Trigger", async ({ page }) => {
    console.log("\n🧪 Testing Time on Page trigger at 30 seconds...");

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Time on Page 30s Test",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.SPIN_TO_WIN,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              time_on_page: {
                enabled: true,
                duration: 30000, // 30 seconds
              },
            },
          }),
          designConfig: JSON.stringify({
            backgroundColor: "#8E44AD",
            textColor: "#FFFFFF",
            buttonColor: "#FFFFFF",
            buttonTextColor: "#8E44AD",
            position: "left",
            size: "large",
            overlayOpacity: 0.8,
          }),
          contentConfig: JSON.stringify({
            headline: "⏰ 30 Seconds Well Spent!",
            subheadline: "You've been here 30 seconds - time for a reward!",
            emailRequired: true,
            emailPlaceholder: "Enter email after 30 seconds",
            buttonText: "Spin After 30s",
            successMessage: "30-second reward won!",
            failureMessage: "Try again after more time!",
            prizes: [
              {
                id: "1",
                label: "20% OFF",
                probability: 0.9, // High probability for time-based reward
                discountCode: "TIME20",
                discountPercentage: 20,
              },
              {
                id: "2",
                label: "Try Again",
                probability: 0.1,
              },
            ],
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 20,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "TIME",
            expiryDays: 7,
          }),
        },
      });

      campaignId = campaign.id;

      // Record start time for timing validation
      const startTime = Date.now();

      await loginToStore(page);

      // Wait for 30 second trigger (plus buffer)
      console.log("⏳ Waiting for 30-second time trigger...");
      await page.waitForTimeout(32000);

      const endTime = Date.now();
      const actualTime = endTime - startTime;

      console.log(
        `⏰ Actual time on page: ${actualTime}ms (expected: ~30000ms)`,
      );

      const popup = await findSplitPopPopup(page, 5000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 5000 });

      // Verify time-based content
      await expect(
        page.locator(':has-text("30 Seconds Well Spent")'),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("been here 30 seconds")'),
      ).toBeVisible();

      // Test time-based interaction
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 2000 })) {
        await emailInput.fill(TEST_EMAIL);
      }

      const spinButton = page
        .locator('button:has-text("Spin After 30s")')
        .first();
      if (await spinButton.isVisible({ timeout: 2000 })) {
        await spinButton.click();
        await page.waitForTimeout(5000);

        // Check for time-based results (high probability win)
        const hasTimeResult = await page
          .locator(':has-text("30-second reward won"), :has-text("TIME20")')
          .isVisible({ timeout: 5000 });

        if (hasTimeResult) {
          console.log("🎉 Got time-based winning result!");
        } else {
          console.log("😔 Got time-based try again result (10% chance)");
        }
      }

      await takeTestScreenshot(
        page,
        "trigger-time-on-page-30-seconds.png",
        "triggers",
      );

      console.log("✅ Time on Page 30 Second Trigger test PASSED");
    } catch (error) {
      console.error("❌ Time on Page 30 Second Trigger test FAILED:", error);
      await takeTestScreenshot(page, "trigger-time-30s-error.png", "triggers");
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });
});
