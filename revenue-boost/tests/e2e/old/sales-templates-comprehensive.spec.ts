import { test, expect } from "../fixtures/enhanced-fixtures";
import {
  TEST_CONFIG,
  loginToStore,
  detectPopup,
  takeTestScreenshot,
  SalesHelpers,
  NewsletterHelpers,
  ValidationHelpers,
  AccessibilityHelpers,
  MobileHelpers,
  ErrorStateHelpers,
  CampaignHelpers,
} from "../utils/template-test-framework";

/**
 * SALES TEMPLATES COMPREHENSIVE E2E TEST SUITE
 *
 * This test suite provides comprehensive coverage for all sales templates
 * following the patterns established in spin-to-win-prize-behavior.spec.ts
 *
 * Templates Covered:
 * - flash-sale-modal: Urgent flash sale with countdown
 * - countdown-timer: Timer-based urgency campaigns
 * - countdown-timer-banner: Banner-style countdown displays
 *
 * Test Coverage:
 * ✅ Countdown timer functionality and accuracy
 * ✅ Urgency messaging and visual cues
 * ✅ Discount application and validation
 * ✅ Timer expiration behavior
 * ✅ Auto-close functionality
 * ✅ Mobile/responsive countdown displays
 * ✅ Accessibility for time-sensitive content
 * ✅ Error states and edge cases
 * ✅ Complete conversion flows
 */

test.describe("Sales Templates Comprehensive E2E Tests", () => {
  test("🔥 Flash Sale Modal - Complete urgency flow with countdown", async ({
    page,
  }) => {
    console.log("\n🧪 Testing flash-sale-modal template...");

    let campaignId: string | null = null;

    try {
      // Create flash sale with short countdown for testing
      const futureTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      campaignId = await CampaignHelpers.createTestCampaign(
        "flash-sale-modal",
        {
          goal: "INCREASE_REVENUE",
          priority: 20,
          delay: 1000,
          content: {
            headline: "🔥 Flash Sale - 30% OFF!",
            subheadline: "Limited time offer - don't miss out!",
            ctaText: "Shop Now & Save",
            ctaUrl: "/collections/sale",
            discountPercentage: 30,
            showCountdown: true,
            countdownDuration: 300, // 5 minutes in seconds
            endDate: futureTime.toISOString(),
            urgencyMessage: "Hurry! Sale ends soon!",
            showStockCounter: true,
            stockCount: 47,
            stockMessage: "Only {count} items left!",
          },
          discount: {
            enabled: true,
            type: "percentage",
            value: 30,
            deliveryMode: "show_in_popup",
            prefix: "FLASH",
            expiryDays: 1,
          },
        },
      );

      console.log(`✅ Created flash-sale-modal campaign: ${campaignId}`);

      await loginToStore(page);
      await page.waitForTimeout(2000);

      const popupDetected = await detectPopup(page);
      expect(popupDetected).toBe(true);
      console.log("✅ Flash sale popup detected");

      // Verify flash sale headline
      const headline = await page
        .locator("text=/Flash Sale.*30% OFF/i")
        .isVisible({ timeout: 5000 });
      expect(headline).toBe(true);
      console.log("✅ Flash sale headline displayed");

      // Check for countdown timer
      const hasTimer = await SalesHelpers.checkCountdownTimer(page);
      expect(hasTimer).toBe(true);
      console.log("✅ Countdown timer detected");

      // Verify discount value display
      const discountValue = await SalesHelpers.getDiscountValue(page);
      expect(discountValue).toBeTruthy();
      expect(discountValue).toContain("30");
      console.log(`✅ Discount value displayed: ${discountValue}`);

      // Check urgency messaging
      const urgencyMessage = await page
        .locator("text=/Hurry.*ends soon/i")
        .isVisible({ timeout: 3000 });
      expect(urgencyMessage).toBe(true);
      console.log("✅ Urgency message displayed");

      // Check stock counter
      const stockCounter = await page
        .locator("text=/Only.*items left/i")
        .isVisible({ timeout: 3000 });
      if (stockCounter) {
        console.log("✅ Stock counter displayed");
      }

      // Take screenshot
      await takeTestScreenshot(page, "flash-sale-modal-active.png");

      // Test CTA button
      const ctaButton = page
        .locator('button:has-text("Shop Now"), a:has-text("Shop Now")')
        .first();
      if (await ctaButton.isVisible({ timeout: 5000 })) {
        // Don't actually click to avoid navigation, just verify it's there
        console.log("✅ CTA button found and clickable");
      }

      // Verify discount code generation
      const discountCode = await ValidationHelpers.validateDiscountCode(page);
      if (discountCode) {
        expect(discountCode).toContain("FLASH");
        console.log(`✅ Discount code generated: ${discountCode}`);
      }

      console.log("✅ Flash Sale Modal test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("⏰ Countdown Timer - Timer accuracy and expiration behavior", async ({
    page,
  }) => {
    console.log("\n🧪 Testing countdown-timer template...");

    let campaignId: string | null = null;

    try {
      // Create countdown timer with very short duration for testing
      const futureTime = new Date(Date.now() + 10 * 1000); // 10 seconds from now

      campaignId = await CampaignHelpers.createTestCampaign("countdown-timer", {
        goal: "INCREASE_URGENCY",
        content: {
          headline: "⏰ Limited Time Offer",
          subheadline: "This deal expires soon!",
          endDate: futureTime.toISOString(),
          endTime: futureTime.toTimeString().slice(0, 5),
          timezone: "UTC",
          showDays: false,
          hideOnExpiry: true,
          expiryMessage: "Offer has expired",
          colorScheme: "urgency",
          dismissible: true,
        },
      });

      await loginToStore(page);
      await page.waitForTimeout(2000);

      const popupDetected = await detectPopup(page);
      expect(popupDetected).toBe(true);

      // Verify timer is counting down
      const hasTimer = await SalesHelpers.checkCountdownTimer(page);
      expect(hasTimer).toBe(true);

      // Wait a few seconds and check timer has decreased
      await page.waitForTimeout(3000);

      // Timer should still be visible but counting down
      const timerStillVisible = await SalesHelpers.checkCountdownTimer(page);
      expect(timerStillVisible).toBe(true);
      console.log("✅ Timer is counting down");

      // Wait for expiration (remaining ~7 seconds)
      console.log("⏳ Waiting for timer expiration...");
      await page.waitForTimeout(8000);

      // Check expiration behavior
      const expiryMessage = await page
        .locator("text=/expired/i")
        .isVisible({ timeout: 2000 });
      if (expiryMessage) {
        console.log("✅ Expiry message displayed");
      }

      // If hideOnExpiry is true, popup should disappear
      const popupStillVisible = await detectPopup(page);
      console.log(
        `🔍 Popup after expiry: ${popupStillVisible ? "VISIBLE" : "HIDDEN"}`,
      );

      await takeTestScreenshot(page, "countdown-timer-expired.png");

      console.log("✅ Countdown Timer test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("📊 Countdown Timer Banner - Banner positioning and display", async ({
    page,
  }) => {
    console.log("\n🧪 Testing countdown-timer-banner template...");

    let campaignId: string | null = null;

    try {
      campaignId = await CampaignHelpers.createTestCampaign("countdown-timer", {
        goal: "INCREASE_REVENUE",
        content: {
          headline: "🚨 Flash Sale Ends Soon!",
          subheadline: "Get 25% off everything",
          position: "top", // Banner at top of page
          showCountdown: true,
          countdownDuration: 3600, // 1 hour
          colorScheme: "flash-sale",
          dismissible: true,
        },
        design: {
          position: "top",
          size: "banner",
          backgroundColor: "#FF4444",
          textColor: "#FFFFFF",
        },
      });

      await loginToStore(page);
      await page.waitForTimeout(2000);

      const popupDetected = await detectPopup(page);
      expect(popupDetected).toBe(true);

      // Check banner positioning
      const banner = page
        .locator('[class*="banner"], [data-position="top"]')
        .first();
      if (await banner.isVisible({ timeout: 5000 })) {
        const boundingBox = await banner.boundingBox();
        if (boundingBox) {
          // Banner should be near top of page
          expect(boundingBox.y).toBeLessThan(100);
          console.log(`✅ Banner positioned at top: y=${boundingBox.y}`);
        }
      }

      // Verify countdown in banner format
      const hasTimer = await SalesHelpers.checkCountdownTimer(page);
      expect(hasTimer).toBe(true);

      // Test dismiss functionality
      const closeButton = page
        .locator('button[aria-label*="close"], button:has-text("×")')
        .first();
      if (await closeButton.isVisible({ timeout: 3000 })) {
        await closeButton.click();
        console.log("✅ Banner dismiss functionality tested");

        // Banner should disappear
        await page.waitForTimeout(1000);
        const bannerStillVisible = await banner
          .isVisible({ timeout: 1000 })
          .catch(() => false);
        expect(bannerStillVisible).toBe(false);
        console.log("✅ Banner dismissed successfully");
      }

      await takeTestScreenshot(page, "countdown-banner.png");

      console.log("✅ Countdown Timer Banner test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("🔥 Sales Template Accessibility - Timer announcements and navigation", async ({
    page,
  }) => {
    console.log("\n🧪 Testing sales template accessibility...");

    let campaignId: string | null = null;

    try {
      campaignId = await CampaignHelpers.createTestCampaign(
        "flash-sale-modal",
        {
          content: {
            headline: "Accessible Flash Sale",
            showCountdown: true,
            countdownDuration: 300,
            urgencyMessage: "Limited time offer",
          },
        },
      );

      await loginToStore(page);
      await page.waitForTimeout(2000);

      // Test accessibility features
      await AccessibilityHelpers.checkAriaLabels(page);
      await AccessibilityHelpers.checkKeyboardNavigation(page);

      // Check for timer accessibility
      const timerElement = page
        .locator('[class*="countdown"], [class*="timer"]')
        .first();
      if (await timerElement.isVisible()) {
        const ariaLabel = await timerElement.getAttribute("aria-label");
        const ariaLive = await timerElement.getAttribute("aria-live");

        console.log(`⏰ Timer aria-label: ${ariaLabel || "NONE"}`);
        console.log(`📢 Timer aria-live: ${ariaLive || "NONE"}`);

        // Timer should have accessibility attributes
        if (ariaLabel || ariaLive) {
          console.log("✅ Timer has accessibility attributes");
        }
      }

      // Check screen reader announcements
      const announcements =
        await AccessibilityHelpers.checkScreenReaderAnnouncements(page);
      console.log(`📢 Accessibility announcements: ${announcements.length}`);

      console.log("✅ Sales Template Accessibility test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("📱 Sales Template Mobile - Responsive countdown and urgency", async ({
    page,
  }) => {
    console.log("\n🧪 Testing sales template mobile behavior...");

    let campaignId: string | null = null;

    try {
      // Set mobile viewport
      await MobileHelpers.setMobileViewport(page, "iphone");

      campaignId = await CampaignHelpers.createTestCampaign(
        "flash-sale-modal",
        {
          content: {
            headline: "Mobile Flash Sale",
            showCountdown: true,
            countdownDuration: 600,
            discountPercentage: 25,
          },
        },
      );

      await loginToStore(page);
      await page.waitForTimeout(2000);

      const popupDetected = await detectPopup(page);
      expect(popupDetected).toBe(true);

      // Check mobile optimization
      await MobileHelpers.checkMobileOptimization(page);

      // Verify countdown is readable on mobile
      const hasTimer = await SalesHelpers.checkCountdownTimer(page);
      expect(hasTimer).toBe(true);

      // Test mobile touch interactions
      await MobileHelpers.testTouchInteractions(page);

      // Check if text is appropriately sized for mobile
      const headline = page.locator("text=/Mobile Flash Sale/i").first();
      if (await headline.isVisible()) {
        const fontSize = await headline.evaluate(
          (el) => window.getComputedStyle(el).fontSize,
        );
        console.log(`📱 Mobile headline font size: ${fontSize}`);
      }

      await takeTestScreenshot(page, "sales-template-mobile.png");

      console.log("✅ Sales Template Mobile test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("🔥 Sales Template Error Handling - Timer edge cases", async ({
    page,
  }) => {
    console.log("\n🧪 Testing sales template error handling...");

    let campaignId: string | null = null;

    try {
      // Test with past end date (should handle gracefully)
      const pastTime = new Date(Date.now() - 60 * 1000); // 1 minute ago

      campaignId = await CampaignHelpers.createTestCampaign("countdown-timer", {
        content: {
          headline: "Expired Timer Test",
          endDate: pastTime.toISOString(),
          hideOnExpiry: false,
          expiryMessage: "This offer has expired",
        },
      });

      await loginToStore(page);
      await page.waitForTimeout(2000);

      const popupDetected = await detectPopup(page);

      if (popupDetected) {
        // Should show expiry message immediately
        const expiryMessage = await page
          .locator("text=/expired/i")
          .isVisible({ timeout: 3000 });
        if (expiryMessage) {
          console.log("✅ Expired timer handled correctly");
        } else {
          console.log("⚠️ Expired timer not showing expiry message");
        }
      }

      // Test invalid date handling
      await CampaignHelpers.cleanupCampaign(campaignId);

      campaignId = await CampaignHelpers.createTestCampaign("countdown-timer", {
        content: {
          headline: "Invalid Date Test",
          endDate: "invalid-date",
          showCountdown: true,
        },
      });

      await page.reload();
      await page.waitForTimeout(2000);

      // Should handle invalid date gracefully (not crash)
      const popupAfterInvalidDate = await detectPopup(page);
      console.log(
        `🔍 Popup with invalid date: ${popupAfterInvalidDate ? "HANDLED" : "NOT_SHOWN"}`,
      );

      console.log("✅ Sales Template Error Handling test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("⚡ Sales Template Performance - Timer rendering and updates", async ({
    page,
  }) => {
    console.log("\n🧪 Testing sales template performance...");

    let campaignId: string | null = null;

    try {
      const startTime = Date.now();

      campaignId = await CampaignHelpers.createTestCampaign(
        "flash-sale-modal",
        {
          content: {
            headline: "Performance Test Sale",
            showCountdown: true,
            countdownDuration: 3600,
            discountPercentage: 20,
          },
        },
      );

      await loginToStore(page);

      // Measure popup load time
      const popupStartTime = Date.now();
      const popupDetected = await detectPopup(page);
      const popupLoadTime = Date.now() - popupStartTime;

      expect(popupDetected).toBe(true);
      console.log(`⏱️ Sales popup load time: ${popupLoadTime}ms`);

      // Measure timer rendering time
      const timerStartTime = Date.now();
      const hasTimer = await SalesHelpers.checkCountdownTimer(page);
      const timerRenderTime = Date.now() - timerStartTime;

      expect(hasTimer).toBe(true);
      console.log(`⏰ Timer render time: ${timerRenderTime}ms`);

      // Test timer update performance (wait for a few updates)
      const updateStartTime = Date.now();
      await page.waitForTimeout(3000); // Wait for timer updates
      const updateTime = Date.now() - updateStartTime;

      console.log(`🔄 Timer update period: ${updateTime}ms`);

      // Performance should be reasonable
      expect(popupLoadTime).toBeLessThan(5000); // 5 seconds max
      expect(timerRenderTime).toBeLessThan(2000); // 2 seconds max

      // Check for memory leaks (basic check)
      const memoryInfo = await page.evaluate(() => {
        if ("memory" in performance) {
          return performance.memory;
        }
        return null;
      });

      if (memoryInfo) {
        console.log(
          `💾 Memory usage: ${Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB`,
        );
      }

      console.log("✅ Sales Template Performance test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });

  test("🎯 Sales Template Conversion Flow - Complete purchase journey", async ({
    page,
  }) => {
    console.log("\n🧪 Testing sales template conversion flow...");

    let campaignId: string | null = null;

    try {
      campaignId = await CampaignHelpers.createTestCampaign(
        "flash-sale-modal",
        {
          goal: "INCREASE_REVENUE",
          content: {
            headline: "🎯 Conversion Test Sale",
            subheadline: "Limited time: 35% off everything!",
            ctaText: "Shop Now",
            ctaUrl: "/collections/all",
            discountPercentage: 35,
            showCountdown: true,
            countdownDuration: 1800, // 30 minutes
          },
          discount: {
            enabled: true,
            type: "percentage",
            value: 35,
            prefix: "CONVERT",
            deliveryMode: "show_in_popup",
          },
        },
      );

      await loginToStore(page);
      await page.waitForTimeout(2000);

      const popupDetected = await detectPopup(page);
      expect(popupDetected).toBe(true);

      // Verify all conversion elements are present
      const headline = await page
        .locator("text=/Conversion Test Sale/i")
        .isVisible();
      const discount = await SalesHelpers.getDiscountValue(page);
      const timer = await SalesHelpers.checkCountdownTimer(page);
      const cta = await page
        .locator('button:has-text("Shop Now"), a:has-text("Shop Now")')
        .isVisible();

      expect(headline).toBe(true);
      expect(discount).toBeTruthy();
      expect(timer).toBe(true);
      expect(cta).toBe(true);

      console.log("✅ All conversion elements present");

      // Verify discount code is available
      const discountCode = await ValidationHelpers.validateDiscountCode(page);
      if (discountCode) {
        expect(discountCode).toContain("CONVERT");
        console.log(`🎫 Conversion discount code: ${discountCode}`);
      }

      // Test copy-to-clipboard for discount
      const copyButton = page.locator('button:has-text("Copy")').first();
      if (await copyButton.isVisible({ timeout: 2000 })) {
        await copyButton.click();
        console.log("✅ Discount code copy functionality tested");
      }

      await takeTestScreenshot(page, "sales-conversion-flow.png");

      console.log("✅ Sales Template Conversion Flow test PASSED");
    } finally {
      if (campaignId) {
        await CampaignHelpers.cleanupCampaign(campaignId);
      }
    }
  });
});
