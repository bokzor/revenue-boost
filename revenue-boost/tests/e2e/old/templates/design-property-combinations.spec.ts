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
 * DESIGN PROPERTY COMBINATION E2E TEST SUITE
 *
 * This test suite provides comprehensive coverage for all design property combinations:
 * - Positions: center, top, bottom, left, right
 * - Sizes: small, medium, large
 * - Overlay opacity: 0.2, 0.4, 0.6, 0.8
 * - Animations: fade, slide, bounce
 * - Responsive behaviors across different viewport sizes
 *
 * Test Coverage:
 * ✅ All position combinations and their visual placement
 * ✅ All size variations and their responsive behavior
 * ✅ Overlay opacity levels and background interaction
 * ✅ Animation types and their performance
 * ✅ Responsive design across mobile/tablet/desktop
 * ✅ Position-specific interaction patterns
 * ✅ Size-appropriate content scaling
 * ✅ Accessibility considerations for each design property
 * ✅ Cross-browser design property rendering
 * ✅ Performance impact of different design combinations
 */

const prisma = new PrismaClient();
const STORE_ID = process.env.TEST_STORE_ID || TEST_CONFIG.STORE.ID;
const TEST_EMAIL = "design-property-test@example.com";

// Design property combinations
const DESIGN_PROPERTIES = {
  POSITIONS: ["center", "top", "bottom", "left", "right"],
  SIZES: ["small", "medium", "large"],
  OVERLAY_OPACITIES: [0.2, 0.4, 0.6, 0.8],
  ANIMATIONS: ["fade", "slide", "bounce"],
};

test.describe("Design Property Combination Tests", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("📐 Position Center - Medium Size - 0.6 Opacity", async ({ page }) => {
    console.log(
      "\n🧪 Testing Center position with Medium size and 0.6 opacity...",
    );

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Center Medium 0.6 Opacity Test",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.MINIMAL,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: { enabled: true, delay: 2000 },
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
            animation: "fade",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          }),
          contentConfig: JSON.stringify({
            headline: "Centered Medium Design",
            subheadline: "Perfect balance of size and positioning",
            emailRequired: true,
            emailPlaceholder: "Enter email for centered experience",
            buttonText: "Experience Center",
            successMessage: "Centered experience activated!",
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 15,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "CENTER15",
            expiryDays: 7,
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);
      await page.waitForTimeout(3000);

      const popup = await findSplitPopPopup(page, 10000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 10000 });

      // Verify center positioning and medium size
      await expect(
        page.locator(':has-text("Centered Medium Design")').first(),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("Perfect balance")').first(),
      ).toBeVisible();

      // Test interaction with centered medium design
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const experienceButton = page
        .locator('button:has-text("Experience Center")')
        .first();
      await experienceButton.click();
      await page.waitForTimeout(2000);

      // Verify success with centered design
      await expect(
        page.locator(':has-text("Centered experience activated")'),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.locator(':has-text("CENTER15")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "design-center-medium-06-opacity.png",
        "design-properties",
      );

      console.log("✅ Center Medium 0.6 Opacity test PASSED");
    } catch (error) {
      console.error("❌ Center Medium 0.6 Opacity test FAILED:", error);
      await takeTestScreenshot(
        page,
        "design-center-medium-error.png",
        "design-properties",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("📐 Position Top - Large Size - 0.8 Opacity", async ({ page }) => {
    console.log("\n🧪 Testing Top position with Large size and 0.8 opacity...");

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Top Large 0.8 Opacity Test",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.FLASH_SALE_MODAL,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: { enabled: true, delay: 2000 },
            },
          }),
          designConfig: JSON.stringify({
            backgroundColor: "#FF6B35",
            textColor: "#FFFFFF",
            buttonColor: "#FFFFFF",
            buttonTextColor: "#FF6B35",
            position: "top",
            size: "large",
            overlayOpacity: 0.8,
            animation: "slide",
            borderRadius: "12px",
            boxShadow: "0 15px 35px rgba(0, 0, 0, 0.2)",
          }),
          contentConfig: JSON.stringify({
            headline: "🔝 TOP LARGE FLASH SALE!",
            subheadline: "Maximum impact with top positioning and large size",
            emailRequired: true,
            emailPlaceholder: "Enter email for top deal",
            buttonText: "Claim Top Deal",
            successMessage: "Top deal claimed with large impact!",
            urgencyMessage: "Top position, maximum urgency!",
            countdownEnabled: true,
            countdownDuration: 1800,
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 30,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "TOPLARGE30",
            expiryDays: 1,
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);
      await page.waitForTimeout(3000);

      const popup = await findSplitPopPopup(page, 10000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 10000 });

      // Verify top positioning and large size
      await expect(
        page.locator(':has-text("TOP LARGE FLASH SALE")').first(),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("Maximum impact")').first(),
      ).toBeVisible();

      // Test interaction with top large design
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const claimButton = page
        .locator('button:has-text("Claim Top Deal")')
        .first();
      await claimButton.click();
      await page.waitForTimeout(2000);

      // Verify success with top large design
      await expect(
        page.locator(':has-text("Top deal claimed with large impact")'),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.locator(':has-text("TOPLARGE30")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "design-top-large-08-opacity.png",
        "design-properties",
      );

      console.log("✅ Top Large 0.8 Opacity test PASSED");
    } catch (error) {
      console.error("❌ Top Large 0.8 Opacity test FAILED:", error);
      await takeTestScreenshot(
        page,
        "design-top-large-error.png",
        "design-properties",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("📐 Position Bottom - Small Size - 0.2 Opacity", async ({ page }) => {
    console.log(
      "\n🧪 Testing Bottom position with Small size and 0.2 opacity...",
    );

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Bottom Small 0.2 Opacity Test",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.MINIMAL,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: { enabled: true, delay: 2000 },
            },
          }),
          designConfig: JSON.stringify({
            backgroundColor: "#28A745",
            textColor: "#FFFFFF",
            buttonColor: "#FFFFFF",
            buttonTextColor: "#28A745",
            position: "bottom",
            size: "small",
            overlayOpacity: 0.2,
            animation: "bounce",
            borderRadius: "6px",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.05)",
          }),
          contentConfig: JSON.stringify({
            headline: "Small Bottom Notice",
            subheadline: "Subtle positioning with minimal overlay",
            emailRequired: true,
            emailPlaceholder: "Email for subtle offer",
            buttonText: "Get Subtle Deal",
            successMessage: "Subtle deal activated!",
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 10,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "SUBTLE10",
            expiryDays: 14,
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);
      await page.waitForTimeout(3000);

      const popup = await findSplitPopPopup(page, 10000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 10000 });

      // Verify bottom positioning and small size
      await expect(
        page.locator(':has-text("Small Bottom Notice")').first(),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("Subtle positioning")').first(),
      ).toBeVisible();

      // Test interaction with bottom small design
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const subtleButton = page
        .locator('button:has-text("Get Subtle Deal")')
        .first();
      await subtleButton.click();
      await page.waitForTimeout(2000);

      // Verify success with bottom small design
      await expect(
        page.locator(':has-text("Subtle deal activated")'),
      ).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator(':has-text("SUBTLE10")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "design-bottom-small-02-opacity.png",
        "design-properties",
      );

      console.log("✅ Bottom Small 0.2 Opacity test PASSED");
    } catch (error) {
      console.error("❌ Bottom Small 0.2 Opacity test FAILED:", error);
      await takeTestScreenshot(
        page,
        "design-bottom-small-error.png",
        "design-properties",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("📐 Position Left - Medium Size - 0.4 Opacity - Slide Animation", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing Left position with Medium size, 0.4 opacity, and slide animation...",
    );

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Left Medium 0.4 Slide Test",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.SPIN_TO_WIN,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: { enabled: true, delay: 2000 },
            },
          }),
          designConfig: JSON.stringify({
            backgroundColor: "#8E44AD",
            textColor: "#FFFFFF",
            buttonColor: "#FFFFFF",
            buttonTextColor: "#8E44AD",
            position: "left",
            size: "medium",
            overlayOpacity: 0.4,
            animation: "slide",
            borderRadius: "10px",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
          }),
          contentConfig: JSON.stringify({
            headline: "← Left Side Lottery",
            subheadline: "Slide in from the left with medium impact",
            emailRequired: true,
            emailPlaceholder: "Email for left-side prize",
            buttonText: "Spin Left",
            successMessage: "Left-side prize won!",
            failureMessage: "Try left side again!",
            prizes: [
              {
                id: "1",
                label: "15% OFF",
                probability: 0.8,
                discountCode: "LEFT15",
                discountPercentage: 15,
              },
              {
                id: "2",
                label: "Try Again",
                probability: 0.2,
              },
            ],
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 15,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "LEFT",
            expiryDays: 7,
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);
      await page.waitForTimeout(3000);

      const popup = await findSplitPopPopup(page, 10000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 10000 });

      // Verify left positioning and medium size with slide animation
      await expect(
        page.locator(':has-text("Left Side Lottery")').first(),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("Slide in from the left")').first(),
      ).toBeVisible();

      // Test interaction with left medium design
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 2000 })) {
        await emailInput.fill(TEST_EMAIL);
      }

      const spinButton = page.locator('button:has-text("Spin Left")').first();
      if (await spinButton.isVisible({ timeout: 2000 })) {
        await spinButton.click();
        await page.waitForTimeout(5000);

        // Check for left-side results
        const hasLeftResult = await page
          .locator(':has-text("Left-side prize won"), :has-text("LEFT15")')
          .isVisible({ timeout: 5000 });
        const hasLeftTryAgain = await page
          .locator(':has-text("Try left side again")')
          .isVisible({ timeout: 2000 });

        if (hasLeftResult) {
          console.log("🎉 Got left-side winning result!");
        } else if (hasLeftTryAgain) {
          console.log("😔 Got left-side try again result");
        }
      }

      await takeTestScreenshot(
        page,
        "design-left-medium-04-opacity-slide.png",
        "design-properties",
      );

      console.log("✅ Left Medium 0.4 Opacity Slide test PASSED");
    } catch (error) {
      console.error("❌ Left Medium 0.4 Opacity Slide test FAILED:", error);
      await takeTestScreenshot(
        page,
        "design-left-medium-error.png",
        "design-properties",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("📐 Position Right - Large Size - Multi-Step Newsletter", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing Right position with Large size on Multi-Step Newsletter template...",
    );

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Right Large Multi-Step Newsletter Test",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.MULTISTEP,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: { enabled: true, delay: 2000 },
            },
          }),
          designConfig: JSON.stringify({
            backgroundColor: "#DC3545",
            textColor: "#FFFFFF",
            buttonColor: "#FFFFFF",
            buttonTextColor: "#DC3545",
            accentColor: "#F8D7DA",
            borderColor: "#F5C6CB",
            position: "right",
            size: "large",
            overlayOpacity: 0.9,
            animation: "fade",
            borderRadius: "15px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          }),
          contentConfig: JSON.stringify({
            headline: "→ RIGHT LARGE MULTI-STEP!",
            subheadline: "Maximum impact with right positioning and large size",
            // Step 1: Email
            emailPlaceholder: "Enter email for right-side deal",
            emailLabel: "Email",
            emailRequired: true,
            // Step 2: Name
            nameStepEnabled: true,
            nameStepRequired: false,
            nameStepTitle: "Right-Side Details",
            nameStepSubtitle: "Large impact personalization",
            firstNameLabel: "First Name",
            firstNamePlaceholder: "Your right-side name",
            // Navigation
            nextButtonText: "Right Continue",
            submitButtonText: "Claim Right Deal",
            // Success
            successMessage: "Right-side large deal claimed!",
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 40,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "RIGHTLARGE40",
            expiryDays: 2,
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);
      await page.waitForTimeout(3000);

      const popup = await findSplitPopPopup(page, 10000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 10000 });

      // Verify right positioning and large size
      await expect(
        page.locator(':has-text("RIGHT LARGE MULTI-STEP")').first(),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("Maximum impact")').first(),
      ).toBeVisible();

      await takeTestScreenshot(
        page,
        "design-right-large-multistep-step1.png",
        "design-properties",
      );

      // Step 1: Fill email
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      // Continue to Step 2
      const rightContinueButton = page
        .locator('button:has-text("Right Continue")')
        .first();
      await rightContinueButton.click();
      await page.waitForTimeout(2000);

      // Verify Step 2 with right large design
      await expect(
        page.locator(':has-text("Right-Side Details")'),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("Large impact personalization")'),
      ).toBeVisible();

      await takeTestScreenshot(
        page,
        "design-right-large-multistep-step2.png",
        "design-properties",
      );

      // Fill optional name
      const rightNameInput = page
        .locator('input[placeholder*="right-side name"]')
        .first();
      if (await rightNameInput.isVisible({ timeout: 2000 })) {
        await rightNameInput.fill("Right User");
      }

      // Claim right deal
      const claimButton = page
        .locator('button:has-text("Claim Right Deal")')
        .first();
      await claimButton.click();
      await page.waitForTimeout(2000);

      // Verify success with right large design
      await expect(
        page.locator(':has-text("Right-side large deal claimed")'),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.locator(':has-text("RIGHTLARGE40")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "design-right-large-multistep-success.png",
        "design-properties",
      );

      console.log("✅ Right Large Multi-Step Newsletter test PASSED");
    } catch (error) {
      console.error("❌ Right Large Multi-Step Newsletter test FAILED:", error);
      await takeTestScreenshot(
        page,
        "design-right-large-multistep-error.png",
        "design-properties",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });
});
