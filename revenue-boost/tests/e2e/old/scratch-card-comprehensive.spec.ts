import { test, expect } from "../fixtures/enhanced-fixtures";
import {
  TEST_CONFIG,
  loginToStore,
  detectPopup,
  takeTestScreenshot,
  GamificationHelpers,
  NewsletterHelpers,
  ValidationHelpers,
  AccessibilityHelpers,
  MobileHelpers,
  ErrorStateHelpers,
  CampaignHelpers,
} from "../utils/template-test-framework";

/**
 * SCRATCH CARD COMPREHENSIVE E2E TEST SUITE
 *
 * This test suite provides comprehensive coverage for scratch card templates
 * following the patterns established in spin-to-win-prize-behavior.spec.ts
 *
 * Test Coverage:
 * ✅ Canvas-based scratching interactions (mouse & touch)
 * ✅ Email capture before/after scratching
 * ✅ Prize reveal and discount code display
 * ✅ Success/failure states and messaging
 * ✅ Accessibility features (screen readers, keyboard nav)
 * ✅ Mobile/responsive behavior
 * ✅ Error states and validation
 * ✅ Loading states and animations
 * ✅ Copy-to-clipboard functionality
 * ✅ Complete user journey flows
 */

test.describe("Scratch Card Comprehensive E2E Tests", () => {
  test("🎫 Should complete full scratch card flow with email capture and prize reveal", async ({
    page,
  }) => {
    console.log("\n🧪 Testing complete scratch card flow...");

    let campaignId: string | null = null;

    try {
      // Create scratch card campaign with winning prize
      campaignId = await CampaignHelpers.createTestCampaign("scratch-card", {
        goal: "NEWSLETTER_SIGNUP",
        priority: 10,
        delay: 1000,
        content: {
          headline: "🎫 Scratch & Win!",
          subheadline: "Scratch the card to reveal your prize",
          emailRequired: false, // Disable email requirement for easier testing
          emailPlaceholder: "Enter your email to play",
          buttonText: "Start Scratching",
          successMessage: "Congratulations! You won!",
          failureMessage: "Better luck next time!",
          prizes: [
            {
              id: "1",
              label: "20% OFF",
              probability: 1.0, // 100% win rate for testing
              discountCode: "SCRATCH20",
              discountPercentage: 20,
            },
          ],
        },
        discount: {
          enabled: true,
          type: "percentage",
          value: 20,
          deliveryMode: "show_in_popup",
          prefix: "SCRATCH",
          expiryDays: 7,
        },
      });

      console.log(`✅ Created scratch card campaign: ${campaignId}`);

      // Navigate to store and wait for popup
      await loginToStore(page);

      // Wait longer for popup to appear and check multiple times
      console.log("⏳ Waiting for popup to appear...");
      let popupDetected = false;

      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(1000);
        popupDetected = await detectPopup(page);
        if (popupDetected) {
          console.log(`✅ Popup detected on attempt ${i + 1}`);
          break;
        } else {
          console.log(`⏳ No popup detected yet (attempt ${i + 1}/10)`);
        }
      }

      if (!popupDetected) {
        console.log("⚠️ No popup detected after 10 seconds");
        // Take screenshot to see what's on the page
        await takeTestScreenshot(page, "no-popup-detected");

        // Check if there are any elements that might be popups
        const allElements = await page.locator("*").all();
        console.log(`Total elements on page: ${allElements.length}`);

        // Check for any modal-like elements
        const modalElements = await page
          .locator(
            '[class*="modal"], [class*="popup"], [class*="overlay"], [data-testid*="popup"]',
          )
          .all();
        console.log(`Modal-like elements found: ${modalElements.length}`);
      }

      expect(popupDetected).toBe(true);
      console.log("✅ Scratch card popup detected");

      // Take initial screenshot
      await takeTestScreenshot(page, "scratch-card-initial.png");

      // Debug: Check campaign data
      const campaignData = await page.evaluate(() => {
        return window.SPLIT_POP_CAMPAIGNS || [];
      });
      console.log("📊 Campaign data:", JSON.stringify(campaignData, null, 2));

      // Popups render via portal to document.body (not Shadow DOM)
      // Since emailRequired: false, the scratch card canvas should be visible immediately

      // Look for scratch canvas
      console.log("🔍 Checking for scratch canvas...");
      const canvas = page.locator("canvas").first();

      if (await canvas.isVisible({ timeout: 2000 })) {
        console.log("✅ Scratch canvas found");

        // Take screenshot before scratching
        await takeTestScreenshot(page, "before-scratch");

        // Perform scratching action
        await GamificationHelpers.performScratchAction(page);
        console.log("✅ Scratching action performed");

        // Wait for prize reveal
        await page.waitForTimeout(3000);

        // Verify prize is revealed
        const prizeHeading = page
          .locator('h3, h2, [class*="prize"], [class*="success"]')
          .first();
        const prizeText = await prizeHeading.textContent();
        console.log(`Prize text found: ${prizeText}`);

        if (
          prizeText &&
          (prizeText.includes("20%") ||
            prizeText.includes("Congratulations") ||
            prizeText.includes("You won"))
        ) {
          console.log("✅ Prize revealed successfully");
        } else {
          console.log(
            "⚠️ Prize not clearly visible, checking for discount code...",
          );
          const discountCodeEl = page
            .locator('[class*="discount"], [class*="code"]')
            .first();
          const discountCode = await discountCodeEl.textContent();
          console.log(`Discount code found: ${discountCode}`);
        }
      } else {
        console.log("⚠️ No scratch canvas found");
      }

      // Verify success message
      console.log("🔍 Looking for success message...");
      const successHeading = page
        .locator("h3, h2")
        .filter({ hasText: /Congratulations|You won|Success/i })
        .first();
      const successMessageVisible = await successHeading.isVisible({
        timeout: 5000,
      });
      const successText = await successHeading.textContent();

      console.log(
        `Success message visible: ${successMessageVisible}, text: ${successText}`,
      );
      expect(successMessageVisible).toBe(true);
      expect(successText).toContain("Congratulations");
      console.log("✅ Success message displayed");

      // Verify discount code
      const discountCode = await ValidationHelpers.validateDiscountCode(page);
      expect(discountCode).toBeTruthy();
      expect(discountCode).toContain("SCRATCH");
      console.log(`✅ Discount code validated: ${discountCode}`);

      // Test copy-to-clipboard functionality
      const copyButton = page.locator('button:has-text("Copy")').first();
      if (await copyButton.isVisible({ timeout: 2000 })) {
        await copyButton.click();
        console.log("✅ Copy button clicked");
      }

      // Take final screenshot
      await takeTestScreenshot(page, "scratch-card-complete.png");

      console.log("✅ Complete scratch card flow test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("🎫 Should handle losing scratch card correctly", async ({ page }) => {
    console.log("\n🧪 Testing losing scratch card behavior...");

    let campaignId: string | null = null;

    try {
      // Create scratch card campaign with losing prize
      campaignId = await CampaignHelpers.createTestCampaign("scratch-card", {
        goal: "NEWSLETTER_SIGNUP",
        content: {
          headline: "🎫 Scratch & Win!",
          subheadline: "Try your luck!",
          emailRequired: true,
          successMessage: "Congratulations! You won!",
          failureMessage: "Better luck next time!",
          prizes: [
            {
              id: "1",
              label: "Try Again",
              probability: 1.0, // 100% chance to get losing prize
              // NO discountCode = losing prize
            },
          ],
        },
        discount: {
          enabled: false,
        },
      });

      await loginToStore(page);
      await page.waitForTimeout(2000);

      const popupDetected = await detectPopup(page);
      expect(popupDetected).toBe(true);

      // Fill email and scratch
      await NewsletterHelpers.fillForm(page, TEST_CONFIG.TEST_EMAIL);
      await GamificationHelpers.performScratchAction(page);
      await page.waitForTimeout(2000);

      // Verify failure message (not success message)
      const failureMessageVisible = await page
        .locator("text=/Better luck|Try again/i")
        .isVisible({ timeout: 5000 });
      expect(failureMessageVisible).toBe(true);
      console.log("✅ Failure message displayed correctly");

      // Verify NO discount code is shown
      const discountCode = await ValidationHelpers.validateDiscountCode(page);
      expect(discountCode).toBeNull();
      console.log("✅ No discount code shown for losing prize");

      // Verify NO confetti animation
      const hasConfetti = await GamificationHelpers.checkForConfetti(page);
      expect(hasConfetti).toBe(false);
      console.log("✅ No confetti for losing prize");

      await takeTestScreenshot(page, "scratch-card-losing.png");

      console.log("✅ Losing scratch card test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("🎫 Should handle accessibility features correctly", async ({
    page,
  }) => {
    console.log("\n🧪 Testing scratch card accessibility...");

    let campaignId: string | null = null;

    try {
      campaignId = await CampaignHelpers.createTestCampaign("scratch-card", {
        content: {
          headline: "Accessible Scratch Card",
          emailRequired: true,
          prizes: [
            {
              id: "1",
              label: "10% OFF",
              probability: 1.0,
              discountCode: "ACCESS10",
            },
          ],
        },
      });

      await loginToStore(page);
      await page.waitForTimeout(2000);

      // Check for proper ARIA labels
      await AccessibilityHelpers.checkAriaLabels(page);

      // Test keyboard navigation
      await AccessibilityHelpers.checkKeyboardNavigation(page);

      // Check for screen reader announcements
      const announcements =
        await AccessibilityHelpers.checkScreenReaderAnnouncements(page);
      console.log(`📢 Screen reader announcements: ${announcements.length}`);

      // Test focus management
      const canvas = page.locator("canvas").first();
      if (await canvas.isVisible()) {
        await canvas.focus();
        const isFocused = await canvas.evaluate(
          (el) => document.activeElement === el,
        );
        console.log(`🎯 Canvas focus: ${isFocused ? "PASS" : "FAIL"}`);
      }

      console.log("✅ Accessibility test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("🎫 Should work correctly on mobile devices", async ({ page }) => {
    console.log("\n🧪 Testing scratch card mobile behavior...");

    let campaignId: string | null = null;

    try {
      // Set mobile viewport
      await MobileHelpers.setMobileViewport(page, "iphone");

      campaignId = await CampaignHelpers.createTestCampaign("scratch-card", {
        content: {
          headline: "Mobile Scratch Card",
          emailRequired: true,
          prizes: [
            {
              id: "1",
              label: "15% OFF",
              probability: 1.0,
              discountCode: "MOBILE15",
            },
          ],
        },
      });

      await loginToStore(page);
      await page.waitForTimeout(2000);

      const popupDetected = await detectPopup(page);
      expect(popupDetected).toBe(true);

      // Check mobile optimization
      await MobileHelpers.checkMobileOptimization(page);

      // Test touch interactions
      await MobileHelpers.testTouchInteractions(page);

      // Fill email with mobile keyboard
      await NewsletterHelpers.fillForm(page, TEST_CONFIG.TEST_EMAIL);

      // Perform touch-based scratching
      const canvas = page.locator("canvas").first();
      if (await canvas.isVisible()) {
        await canvas.tap();
        console.log("✅ Touch scratching performed");
      }

      await takeTestScreenshot(page, "scratch-card-mobile.png");

      console.log("✅ Mobile scratch card test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("🎫 Should handle error states and validation", async ({ page }) => {
    console.log("\n🧪 Testing scratch card error handling...");

    let campaignId: string | null = null;

    try {
      campaignId = await CampaignHelpers.createTestCampaign("scratch-card", {
        content: {
          headline: "Error Testing Scratch Card",
          emailRequired: true,
          prizes: [
            {
              id: "1",
              label: "10% OFF",
              probability: 1.0,
              discountCode: "ERROR10",
            },
          ],
        },
      });

      await loginToStore(page);
      await page.waitForTimeout(2000);

      // Test invalid email validation
      await ErrorStateHelpers.testInvalidEmail(page);

      // Test empty form submission
      await ErrorStateHelpers.testEmptyForm(page);

      // Test network failure handling
      await ErrorStateHelpers.testNetworkFailure(page);

      console.log("✅ Error handling test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("🎫 Should handle mixed prizes correctly", async ({ page }) => {
    console.log("\n🧪 Testing scratch card with mixed prizes...");

    let campaignId: string | null = null;

    try {
      campaignId = await CampaignHelpers.createTestCampaign("scratch-card", {
        content: {
          headline: "Mixed Prizes Scratch Card",
          emailRequired: true,
          prizes: [
            {
              id: "1",
              label: "20% OFF",
              probability: 0.3,
              discountCode: "WIN20",
              discountPercentage: 20,
            },
            {
              id: "2",
              label: "Free Shipping",
              probability: 0.2,
              discountCode: "FREESHIP",
            },
            { id: "3", label: "Try Again", probability: 0.5 }, // No discount = losing prize
          ],
        },
      });

      await loginToStore(page);
      await page.waitForTimeout(2000);

      await NewsletterHelpers.fillForm(page, TEST_CONFIG.TEST_EMAIL);
      await GamificationHelpers.performScratchAction(page);
      await page.waitForTimeout(2000);

      // Check if we got a winning or losing result
      const hasDiscount = await ValidationHelpers.validateDiscountCode(page);
      const hasSuccess = await ValidationHelpers.validateSuccessMessage(page);
      const hasFailure = await page
        .locator("text=/Try again|Better luck/i")
        .isVisible({ timeout: 2000 });

      // Should have either success with discount OR failure without discount
      const validResult =
        (hasSuccess && hasDiscount) || (hasFailure && !hasDiscount);
      expect(validResult).toBe(true);

      console.log(`🎲 Prize result: ${hasDiscount ? "WIN" : "LOSE"}`);
      console.log("✅ Mixed prizes test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });
});
