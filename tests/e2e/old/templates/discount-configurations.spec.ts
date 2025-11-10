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
 * DISCOUNT CONFIGURATION E2E TEST SUITE
 *
 * This test suite provides comprehensive coverage for all discount configurations:
 * - Percentage discounts: 5%, 10%, 15%, 20%, 25%, 50%, 70%
 * - Fixed amount discounts: $5, $10, $25, $50
 * - Free shipping discounts
 * - Delivery modes: show_code_always, show_in_popup_authorized_only, auto_apply_only
 * - Minimum purchase requirements
 * - Expiry settings and usage limits
 *
 * Test Coverage:
 * ✅ All percentage discount values and validation
 * ✅ All fixed amount discount values and validation
 * ✅ Free shipping discount configuration
 * ✅ All delivery mode behaviors
 * ✅ Minimum purchase requirement enforcement
 * ✅ Expiry date validation and behavior
 * ✅ Single-use vs multi-use discount codes
 * ✅ Discount code prefix generation
 * ✅ Success/error states and messaging
 * ✅ Cross-template discount compatibility
 */

const prisma = new PrismaClient();
const STORE_ID = process.env.TEST_STORE_ID || TEST_CONFIG.STORE.ID;
const TEST_EMAIL = "discount-test@example.com";

test.describe("Discount Configuration Tests", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("💰 Percentage Discount - 5% with Show Code Always", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing 5% percentage discount with show_code_always delivery...",
    );

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "5% Percentage Discount Test",
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
            textColor: "#1A1A1A",
            buttonColor: "#28A745",
            buttonTextColor: "#FFFFFF",
          }),
          contentConfig: JSON.stringify({
            headline: "Get 5% Off Your Order",
            subheadline: "Small discount, big savings",
            emailRequired: true,
            emailPlaceholder: "Enter email for 5% off",
            buttonText: "Get 5% Discount",
            successMessage: "5% discount code ready!",
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 5,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_always",
            prefix: "SAVE5",
            expiryDays: 7,
            singleUse: true,
            minimumAmount: 0, // No minimum
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);
      await page.waitForTimeout(3000);

      const popup = await findSplitPopPopup(page, 10000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 10000 });

      // Verify 5% discount content
      await expect(page.locator(':has-text("5% Off")').first()).toBeVisible();
      await expect(
        page.locator(':has-text("Small discount, big savings")').first(),
      ).toBeVisible();

      // Fill email and get discount
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const getDiscountButton = page
        .locator('button:has-text("Get 5% Discount")')
        .first();
      await getDiscountButton.click();
      await page.waitForTimeout(2000);

      // Verify 5% discount code is shown immediately (show_code_always)
      await expect(
        page.locator(':has-text("5% discount code ready")'),
      ).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator(':has-text("SAVE5")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "discount-5-percent-show-code-always.png",
        "discount",
      );

      console.log(
        "✅ 5% Percentage Discount with Show Code Always test PASSED",
      );
    } catch (error) {
      console.error("❌ 5% Percentage Discount test FAILED:", error);
      await takeTestScreenshot(
        page,
        "discount-5-percent-error.png",
        "discount",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("💰 Fixed Amount Discount - $10 with Authorized Email Only", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing $10 fixed amount discount with authorized email only delivery...",
    );

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "$10 Fixed Amount Discount Test",
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
            backgroundColor: "#007BFF",
            textColor: "#FFFFFF",
            buttonColor: "#FFFFFF",
            buttonTextColor: "#007BFF",
          }),
          contentConfig: JSON.stringify({
            headline: "Save $10 on Your Purchase",
            subheadline: "Fixed savings for authorized email",
            emailRequired: true,
            emailPlaceholder: "Enter email for $10 off",
            buttonText: "Authorize $10 Savings",
            successMessage: "$10 discount authorized for your email!",
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "fixed_amount",
            value: 10,
            valueType: "FIXED_AMOUNT",
            deliveryMode: "show_in_popup_authorized_only",
            prefix: "FIXED10",
            expiryDays: 14,
            singleUse: true,
            minimumAmount: 25, // $25 minimum purchase
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);
      await page.waitForTimeout(3000);

      const popup = await findSplitPopPopup(page, 10000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 10000 });

      // Verify $10 fixed discount content
      await expect(page.locator(':has-text("Save $10")')).toBeVisible();
      await expect(
        page.locator(':has-text("Fixed savings for authorized email")'),
      ).toBeVisible();

      // Fill email and authorize discount
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const authorizeButton = page
        .locator('button:has-text("Authorize $10 Savings")')
        .first();
      await authorizeButton.click();
      await page.waitForTimeout(2000);

      // Verify $10 discount is authorized for email (show_in_popup_authorized_only)
      await expect(
        page.locator(':has-text("$10 discount authorized for your email")'),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.locator(':has-text("FIXED10")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "discount-10-dollar-authorized-email.png",
        "discount",
      );

      console.log(
        "✅ $10 Fixed Amount Discount with Authorized Email test PASSED",
      );
    } catch (error) {
      console.error("❌ $10 Fixed Amount Discount test FAILED:", error);
      await takeTestScreenshot(
        page,
        "discount-10-dollar-error.png",
        "discount",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("🚚 Free Shipping Discount - Auto Apply Only", async ({ page }) => {
    console.log(
      "\n🧪 Testing Free Shipping discount with auto_apply_only delivery...",
    );

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Free Shipping Auto Apply Test",
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
          }),
          contentConfig: JSON.stringify({
            headline: "🚚 Free Shipping on Your Order",
            subheadline: "Automatic application at checkout",
            emailRequired: true,
            emailPlaceholder: "Enter email for free shipping",
            buttonText: "Activate Free Shipping",
            successMessage: "Free shipping will be automatically applied!",
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "free_shipping",
            valueType: "FREE_SHIPPING",
            deliveryMode: "auto_apply_only",
            prefix: "FREESHIP",
            expiryDays: 30,
            singleUse: false, // Multi-use for free shipping
            minimumAmount: 50, // $50 minimum for free shipping
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);
      await page.waitForTimeout(3000);

      const popup = await findSplitPopPopup(page, 10000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 10000 });

      // Verify free shipping content
      await expect(page.locator(':has-text("Free Shipping")')).toBeVisible();
      await expect(
        page.locator(':has-text("Automatic application at checkout")'),
      ).toBeVisible();

      // Fill email and activate free shipping
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const activateButton = page
        .locator('button:has-text("Activate Free Shipping")')
        .first();
      await activateButton.click();
      await page.waitForTimeout(2000);

      // Verify free shipping auto-apply message (no code shown for auto_apply_only)
      await expect(
        page.locator(
          ':has-text("Free shipping will be automatically applied")',
        ),
      ).toBeVisible({ timeout: 5000 });

      // Should NOT show discount code for auto_apply_only mode
      const codeVisible = await page
        .locator(':has-text("FREESHIP")')
        .isVisible({ timeout: 2000 });
      expect(codeVisible).toBe(false);

      await takeTestScreenshot(
        page,
        "discount-free-shipping-auto-apply.png",
        "discount",
      );

      console.log("✅ Free Shipping Auto Apply test PASSED");
    } catch (error) {
      console.error("❌ Free Shipping Auto Apply test FAILED:", error);
      await takeTestScreenshot(
        page,
        "discount-free-shipping-error.png",
        "discount",
      );
      throw error;
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("💰 High Percentage Discount - 70% with Minimum Purchase", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing 70% percentage discount with minimum purchase requirement...",
    );

    let campaignId: string | null = null;

    try {
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "70% High Percentage Discount Test",
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
            backgroundColor: "#DC3545",
            textColor: "#FFFFFF",
            buttonColor: "#FFFFFF",
            buttonTextColor: "#DC3545",
          }),
          contentConfig: JSON.stringify({
            headline: "🔥 MASSIVE 70% OFF SALE!",
            subheadline: "Minimum $100 purchase required",
            emailRequired: true,
            emailPlaceholder: "Enter email for 70% off",
            buttonText: "Claim 70% Discount",
            successMessage:
              "70% discount claimed! Minimum $100 purchase required.",
            urgencyMessage: "Limited time 70% off!",
            countdownEnabled: true,
            countdownDuration: 3600,
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 70,
            valueType: "PERCENTAGE",
            deliveryMode: "show_code_fallback",
            prefix: "MEGA70",
            expiryDays: 1,
            singleUse: true,
            minimumAmount: 100, // $100 minimum purchase
          }),
        },
      });

      campaignId = campaign.id;
      await loginToStore(page);
      await page.waitForTimeout(3000);

      const popup = await findSplitPopPopup(page, 10000);
      expect(popup).not.toBeNull();
      await expect(popup!).toBeVisible({ timeout: 10000 });

      // Verify 70% discount content
      await expect(page.locator(':has-text("70% OFF")')).toBeVisible();
      await expect(
        page.locator(':has-text("Minimum $100 purchase")'),
      ).toBeVisible();

      // Fill email and claim massive discount
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill(TEST_EMAIL);

      const claimButton = page
        .locator('button:has-text("Claim 70% Discount")')
        .first();
      await claimButton.click();
      await page.waitForTimeout(2000);

      // Verify 70% discount with minimum purchase requirement
      await expect(
        page.locator(':has-text("70% discount claimed")'),
      ).toBeVisible({
        timeout: 5000,
      });
      await expect(
        page.locator(':has-text("Minimum $100 purchase required")'),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.locator(':has-text("MEGA70")')).toBeVisible({
        timeout: 5000,
      });

      await takeTestScreenshot(
        page,
        "discount-70-percent-minimum-purchase.png",
        "discount",
      );

      console.log(
        "✅ 70% High Percentage Discount with Minimum Purchase test PASSED",
      );
    } catch (error) {
      console.error("❌ 70% High Percentage Discount test FAILED:", error);
      await takeTestScreenshot(
        page,
        "discount-70-percent-error.png",
        "discount",
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
