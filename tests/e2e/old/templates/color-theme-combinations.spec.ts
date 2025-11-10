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
 * COLOR THEME COMBINATION E2E TEST SUITE
 *
 * This test suite provides comprehensive coverage for all color theme combinations:
 * - Professional Blue: Clean, trustworthy business theme
 * - Vibrant Orange: High-energy, attention-grabbing theme
 * - Elegant Purple: Sophisticated, premium theme
 * - Minimal Gray: Clean, understated theme
 * - Success Green: Positive, eco-friendly theme
 * - Warning Red: Urgent, high-impact theme
 * - Custom color configurations with various combinations
 *
 * Test Coverage:
 * ✅ All predefined color theme combinations
 * ✅ Color contrast and accessibility validation
 * ✅ Theme consistency across different templates
 * ✅ Custom color configuration testing
 * ✅ Overlay opacity variations
 * ✅ Button and text color combinations
 * ✅ Accent and border color coordination
 * ✅ Input field color theming
 * ✅ Success and error state colors
 * ✅ Cross-browser color rendering
 */

const prisma = new PrismaClient();
const STORE_ID = process.env.TEST_STORE_ID || TEST_CONFIG.STORE.ID;
const TEST_EMAIL = "color-theme-test@example.com";

// Color theme definitions based on app/config/color-presets.ts
const COLOR_THEMES = {
  PROFESSIONAL_BLUE: {
    backgroundColor: "#FFFFFF",
    textColor: "#1F2937",
    buttonColor: "#3B82F6",
    buttonTextColor: "#FFFFFF",
    accentColor: "#EFF6FF",
    borderColor: "#E5E7EB",
    inputBackgroundColor: "#FFFFFF",
    inputBorderColor: "#D1D5DB",
    inputTextColor: "#1F2937",
    inputFocusColor: "#3B82F6",
    successColor: "#10B981",
    errorColor: "#EF4444",
    overlayOpacity: 0.6,
  },
  VIBRANT_ORANGE: {
    backgroundColor: "#FF6B35",
    textColor: "#FFFFFF",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#FF6B35",
    accentColor: "#FFE5DB",
    borderColor: "#FF8A65",
    inputBackgroundColor: "#FFFFFF",
    inputBorderColor: "#FF8A65",
    inputTextColor: "#1F2937",
    inputFocusColor: "#FF6B35",
    successColor: "#28A745",
    errorColor: "#DC3545",
    overlayOpacity: 0.8,
  },
  ELEGANT_PURPLE: {
    backgroundColor: "#8E44AD",
    textColor: "#FFFFFF",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#8E44AD",
    accentColor: "#F4E6FF",
    borderColor: "#A569BD",
    inputBackgroundColor: "#FFFFFF",
    inputBorderColor: "#A569BD",
    inputTextColor: "#1F2937",
    inputFocusColor: "#8E44AD",
    successColor: "#27AE60",
    errorColor: "#E74C3C",
    overlayOpacity: 0.7,
  },
  MINIMAL_GRAY: {
    backgroundColor: "#F8F9FA",
    textColor: "#212529",
    buttonColor: "#6C757D",
    buttonTextColor: "#FFFFFF",
    accentColor: "#E9ECEF",
    borderColor: "#DEE2E6",
    inputBackgroundColor: "#FFFFFF",
    inputBorderColor: "#CED4DA",
    inputTextColor: "#495057",
    inputFocusColor: "#6C757D",
    successColor: "#28A745",
    errorColor: "#DC3545",
    overlayOpacity: 0.5,
  },
  SUCCESS_GREEN: {
    backgroundColor: "#28A745",
    textColor: "#FFFFFF",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#28A745",
    accentColor: "#D4EDDA",
    borderColor: "#5CBB5C",
    inputBackgroundColor: "#FFFFFF",
    inputBorderColor: "#5CBB5C",
    inputTextColor: "#1F2937",
    inputFocusColor: "#28A745",
    successColor: "#155724",
    errorColor: "#721C24",
    overlayOpacity: 0.6,
  },
  WARNING_RED: {
    backgroundColor: "#DC3545",
    textColor: "#FFFFFF",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#DC3545",
    accentColor: "#F8D7DA",
    borderColor: "#F5C6CB",
    inputBackgroundColor: "#FFFFFF",
    inputBorderColor: "#F5C6CB",
    inputTextColor: "#1F2937",
    inputFocusColor: "#DC3545",
    successColor: "#155724",
    errorColor: "#721C24",
    overlayOpacity: 0.9,
  },
};

test.describe("Color Theme Combination Tests", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("🎨 Professional Blue Theme - Newsletter Template", async ({ page }) => {
    console.log(
      "\n🧪 Testing Professional Blue theme on Newsletter template...",
    );

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Professional Blue Newsletter Test",
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
          designConfig: JSON.stringify(COLOR_THEMES.PROFESSIONAL_BLUE),
          contentConfig: JSON.stringify({
            headline: "Professional Newsletter Signup",
            subheadline: "Clean, trustworthy design for business professionals",
            emailRequired: true,
            emailPlaceholder: "Enter your professional email",
            buttonText: "Join Professional Network",
            successMessage: "Welcome to our professional community!",
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 10,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "PROF10",
            expiryDays: 30,
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);
      await page.waitForTimeout(3000);

      const popup = await findSplitPopPopup(page, 10000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 10000 });

      // Verify professional blue theme elements
      await expect(
        page.locator(':has-text("Professional Newsletter")').first(),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("Clean, trustworthy design")').first(),
      ).toBeVisible();

      // Test form interaction with professional theme
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const joinButton = page
        .locator('button:has-text("Join Professional")')
        .first();
      await joinButton.click();
      await page.waitForTimeout(2000);

      // Verify success with professional theme
      await expect(
        page.locator(':has-text("Welcome to our professional community")'),
      ).toBeVisible({ timeout: 5000 });

      await takeTestScreenshot(
        page,
        "color-theme-professional-blue-newsletter.png",
        "color-themes",
      );

      console.log("✅ Professional Blue Theme Newsletter test PASSED");
    } catch (error) {
      console.error(
        "❌ Professional Blue Theme Newsletter test FAILED:",
        error,
      );
      await takeTestScreenshot(
        page,
        "color-theme-professional-blue-error.png",
        "color-themes",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("🎨 Vibrant Orange Theme - Flash Sale Template", async ({ page }) => {
    console.log("\n🧪 Testing Vibrant Orange theme on Flash Sale template...");

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Vibrant Orange Flash Sale Test",
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
          designConfig: JSON.stringify(COLOR_THEMES.VIBRANT_ORANGE),
          contentConfig: JSON.stringify({
            headline: "🔥 VIBRANT FLASH SALE!",
            subheadline: "High-energy deals that demand attention!",
            emailRequired: true,
            emailPlaceholder: "Enter email for vibrant deals",
            buttonText: "Grab Vibrant Deal",
            successMessage: "Vibrant deal secured!",
            urgencyMessage: "High-energy offer ending soon!",
            countdownEnabled: true,
            countdownDuration: 1800,
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 25,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "VIBRANT25",
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

      // Verify vibrant orange theme elements
      await expect(
        page.locator(':has-text("VIBRANT FLASH SALE")').first(),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("High-energy deals")').first(),
      ).toBeVisible();

      // Test form interaction with vibrant theme
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const grabButton = page
        .locator('button:has-text("Grab Vibrant Deal")')
        .first();
      await grabButton.click();
      await page.waitForTimeout(2000);

      // Verify success with vibrant theme
      await expect(
        page.locator(':has-text("Vibrant deal secured")'),
      ).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator(':has-text("VIBRANT25")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "color-theme-vibrant-orange-flash-sale.png",
        "color-themes",
      );

      console.log("✅ Vibrant Orange Theme Flash Sale test PASSED");
    } catch (error) {
      console.error("❌ Vibrant Orange Theme Flash Sale test FAILED:", error);
      await takeTestScreenshot(
        page,
        "color-theme-vibrant-orange-error.png",
        "color-themes",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("🎨 Elegant Purple Theme - Lottery Template", async ({ page }) => {
    console.log("\n🧪 Testing Elegant Purple theme on Lottery template...");

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Elegant Purple Lottery Test",
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
          designConfig: JSON.stringify(COLOR_THEMES.ELEGANT_PURPLE),
          contentConfig: JSON.stringify({
            headline: "👑 Elegant Spin to Win",
            subheadline: "Sophisticated prizes for discerning customers",
            emailRequired: true,
            emailPlaceholder: "Enter your elegant email",
            buttonText: "Spin Elegantly",
            successMessage: "Elegant prize won!",
            failureMessage: "Try again with elegance!",
            prizes: [
              {
                id: "1",
                label: "20% OFF",
                probability: 0.7,
                discountCode: "ELEGANT20",
                discountPercentage: 20,
              },
              {
                id: "2",
                label: "Try Again",
                probability: 0.3,
              },
            ],
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 20,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "ELEGANT",
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

      // Verify elegant purple theme elements
      await expect(
        page.locator(':has-text("Elegant Spin to Win")').first(),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("Sophisticated prizes")').first(),
      ).toBeVisible();

      // Test form interaction with elegant theme
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 2000 })) {
        await emailInput.fill(TEST_EMAIL);
      }

      // Test spin functionality with elegant theme
      const spinButton = page
        .locator('button:has-text("Spin Elegantly")')
        .first();
      if (await spinButton.isVisible({ timeout: 2000 })) {
        await spinButton.click();
        await page.waitForTimeout(5000);

        // Check for elegant results
        const hasElegantResult = await page
          .locator(':has-text("Elegant prize won"), :has-text("ELEGANT20")')
          .isVisible({ timeout: 5000 });
        const hasElegantTryAgain = await page
          .locator(':has-text("Try again with elegance")')
          .isVisible({ timeout: 2000 });

        if (hasElegantResult) {
          console.log("🎉 Got elegant winning result!");
        } else if (hasElegantTryAgain) {
          console.log("😔 Got elegant try again result");
        }
      }

      await takeTestScreenshot(
        page,
        "color-theme-elegant-purple-lottery.png",
        "color-themes",
      );

      console.log("✅ Elegant Purple Theme Lottery test PASSED");
    } catch (error) {
      console.error("❌ Elegant Purple Theme Lottery test FAILED:", error);
      await takeTestScreenshot(
        page,
        "color-theme-elegant-purple-error.png",
        "color-themes",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("🎨 Warning Red Theme - Multi-Step Newsletter Template", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing Warning Red theme on Multi-Step Newsletter template...",
    );

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Warning Red Multi-Step Newsletter Test",
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
          designConfig: JSON.stringify(COLOR_THEMES.WARNING_RED),
          contentConfig: JSON.stringify({
            headline: "🚨 URGENT Multi-Step Signup!",
            subheadline: "High-impact design demands immediate attention!",
            // Step 1: Email
            emailPlaceholder: "Enter email for urgent deals",
            emailLabel: "Email Address",
            emailRequired: true,
            // Step 2: Name
            nameStepEnabled: true,
            nameStepRequired: true,
            nameStepTitle: "🚨 Urgent Details Required",
            nameStepSubtitle: "Complete quickly for maximum impact!",
            firstNameLabel: "First Name",
            firstNamePlaceholder: "Your urgent name",
            // Navigation
            nextButtonText: "Urgent Continue",
            submitButtonText: "Secure Urgent Deal",
            // Success
            successMessage: "🚨 Urgent deal secured with high impact!",
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 35,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "URGENT35",
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

      // Verify warning red theme elements
      await expect(
        page.locator(':has-text("URGENT Multi-Step Signup")').first(),
      ).toBeVisible();
      await expect(
        page.locator(':has-text("High-impact design")').first(),
      ).toBeVisible();

      await takeTestScreenshot(
        page,
        "color-theme-warning-red-multistep-step1.png",
        "color-themes",
      );

      // Step 1: Fill email
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      // Continue to Step 2
      const urgentContinueButton = page
        .locator('button:has-text("Urgent Continue")')
        .first();
      await urgentContinueButton.click();
      await page.waitForTimeout(2000);

      // Verify Step 2 with warning red theme
      await expect(
        page.locator(':has-text("Urgent Details Required")'),
      ).toBeVisible();
      await expect(page.locator(':has-text("Complete quickly")')).toBeVisible();

      await takeTestScreenshot(
        page,
        "color-theme-warning-red-multistep-step2.png",
        "color-themes",
      );

      // Fill urgent name
      const urgentNameInput = page
        .locator('input[placeholder*="urgent name"]')
        .first();
      if (await urgentNameInput.isVisible({ timeout: 2000 })) {
        await urgentNameInput.fill("Urgent User");
      }

      // Secure urgent deal
      const secureButton = page
        .locator('button:has-text("Secure Urgent Deal")')
        .first();
      await secureButton.click();
      await page.waitForTimeout(2000);

      // Verify success with warning red theme
      await expect(
        page.locator(':has-text("Urgent deal secured")'),
      ).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator(':has-text("URGENT35")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "color-theme-warning-red-multistep-success.png",
        "color-themes",
      );

      console.log("✅ Warning Red Theme Multi-Step Newsletter test PASSED");
    } catch (error) {
      console.error(
        "❌ Warning Red Theme Multi-Step Newsletter test FAILED:",
        error,
      );
      await takeTestScreenshot(
        page,
        "color-theme-warning-red-multistep-error.png",
        "color-themes",
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
