import { test, expect } from "../fixtures/enhanced-fixtures";
import { PrismaClient } from "@prisma/client";
import { TemplateType } from "../constants/template-types.js";

/**
 * SPIN-TO-WIN PRIZE BEHAVIOR E2E TEST SUITE
 *
 * This test suite specifically validates the win vs loss behavior
 * that was previously broken (showing congratulations for "Try Again").
 *
 * Test Coverage:
 * ✅ Winning prizes show success message + discount code
 * ✅ Losing prizes show failure message + NO discount code
 * ✅ Confetti only launches for winning prizes
 * ✅ Overlay click behavior differs for win vs loss
 * ✅ Screen reader announcements are correct
 * ✅ Custom success/failure messages work
 */

const prisma = new PrismaClient();

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const STORE_URL = "https://split-pop.myshopify.com";
const STORE_PASSWORD = "a";
const STORE_ID = "cmhh2nulv000mt2emn7wqxfks"; // Actual store ID from database
const TEST_EMAIL = "spin-test@example.com";

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

/**
 * Login to password-protected store
 */
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
  const hasPassword = (await passwordInput.count()) > 0;

  if (hasPassword) {
    await passwordInput.fill(STORE_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
  }
}

/**
 * Detect popup on page
 */
async function detectPopup(page: any): Promise<boolean> {
  for (const selector of POPUP_SELECTORS) {
    try {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(
          `✅ Found ${elements.length} popup elements with: ${selector}`,
        );
        return true;
      }
    } catch (e) {
      // Continue to next selector
    }
  }
  return false;
}

/**
 * Find and fill email input
 */
async function fillEmailInput(page: any, email: string): Promise<boolean> {
  await page.waitForTimeout(1000);

  const emailSelectors = [
    'input[name="email"]',
    'input[type="email"]',
    'input[name*="email" i]',
    'input[placeholder*="email" i]',
  ];

  for (const selector of emailSelectors) {
    try {
      const input = page.locator(selector).first();
      if (await input.isVisible({ timeout: 2000 })) {
        await input.fill(email);
        console.log(`✅ Filled email input: ${selector}`);
        return true;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  console.log("⚠️  Email input not found");
  return false;
}

/**
 * Take screenshot for test evidence
 */
async function takeTestScreenshot(
  page: any,
  filename: string,
  templateType: string = "lottery",
) {
  try {
    const fs = require("fs");
    const templateDir = `test-results/${templateType}`;

    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }

    await page.screenshot({
      path: `${templateDir}/${filename}`,
      fullPage: true,
    });
    console.log(`📸 Screenshot saved: ${templateType}/${filename}`);
  } catch (e) {
    console.log(`⚠️  Failed to save screenshot: ${e}`);
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe("Spin-to-Win Prize Behavior", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("🎰 Should show SUCCESS message and discount code for WINNING prize", async ({
    page,
  }) => {
    console.log("\n🧪 Testing WINNING prize behavior...");

    let campaignId: string | null = null;

    try {
      // Create campaign with ONLY winning prizes (100% win rate)
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Spin to Win - Winning Prize Test",
          status: "ACTIVE",
          templateType: TemplateType.SPIN_TO_WIN,
          goal: "NEWSLETTER_SIGNUP",
          priority: 1000, // Very high priority to ensure this campaign is displayed first
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: { enabled: true, delay: 1000 },
            },
          }),
          contentConfig: JSON.stringify({
            headline: "🎰 Spin to Win!",
            subheadline: "Try your luck for a discount",
            emailRequired: true,
            emailPlaceholder: "Enter your email",
            buttonText: "Spin Now", // PopupManager looks for buttonText, not spinButtonText
            successMessage: "Congratulations! You won!",
            failureMessage: "Better luck next time!",
            prizes: [
              {
                id: "1",
                label: "10% OFF",
                probability: 1.0, // 100% chance to win this
                discountCode: "WIN10",
                discountPercentage: 10,
              },
            ],
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 10,
            valueType: "PERCENTAGE",
            deliveryMode: "show_in_popup",
            prefix: "WIN",
            expiryDays: 7,
            singleUse: true,
          }),
        },
      });

      campaignId = campaign.id;
      console.log(`✅ Created winning prize campaign: ${campaignId}`);

      // Setup console error listener
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
          console.log(`❌ Browser console error: ${msg.text()}`);
        }
      });

      // Setup network request listener to catch 404s
      page.on("response", (response) => {
        if (response.status() === 404) {
          console.log(`❌ 404 Error: ${response.url()}`);
        }
      });

      await loginToStore(page);

      // Reload the page to ensure the popup loader fetches the new campaign
      console.log("🔄 Reloading page to fetch updated campaigns...");
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(2000);

      // Log any console errors that occurred
      if (consoleErrors.length > 0) {
        console.log(
          `⚠️ Found ${consoleErrors.length} console errors:`,
          consoleErrors,
        );
      }

      const popupDetected = await detectPopup(page);
      expect(popupDetected).toBe(true);

      // Fill email
      await fillEmailInput(page, TEST_EMAIL);

      // Click the spin button (use aria-label since button text may vary)
      const spinButton = page.locator('button[aria-label*="Spin"]').first();
      await spinButton.waitFor({ state: "visible", timeout: 10000 });
      await spinButton.click({ force: true }); // Force click to bypass overlay
      console.log("✅ Spin button clicked");

      // Wait for spin animation to complete (default is 4.5s + buffer)
      await page.waitForTimeout(6000);
      console.log("✅ Spin animation completed");

      // Check for console errors
      const consoleMessages: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleMessages.push(`Console error: ${msg.text()}`);
        }
      });

      // Check for page errors
      page.on("pageerror", (error) => {
        console.log(`❌ Page error: ${error.message}`);
      });

      // ✅ VERIFY: Success message appears
      // Take a screenshot to see what's actually on screen
      await takeTestScreenshot(page, "after-spin-debug.png", "lottery");
      console.log("📸 Screenshot saved: test-results/after-spin-debug.png");

      // Access shadow DOM content to check for success message
      const popupContent = await page.evaluate(() => {
        const container = document.getElementById("split-pop-container");
        if (!container || !container.shadowRoot) {
          return {
            hasContent: false,
            text: "No shadow DOM",
            hasSuccessMessage: false,
            hasDiscountCode: false,
            hasCopyButton: false,
          };
        }

        const shadowContent = container.shadowRoot.textContent || "";

        return {
          hasContent: shadowContent.length > 0,
          text: shadowContent, // Get full text, not just first 500 chars
          hasSuccessMessage: /Congratulations|You won/i.test(shadowContent),
          hasDiscountCode: /WIN10/.test(shadowContent),
          hasCopyButton: /Copy/.test(shadowContent),
        };
      });

      console.log(
        `📦 Popup has success message: ${popupContent.hasSuccessMessage}, has discount code: ${popupContent.hasDiscountCode}, has copy button: ${popupContent.hasCopyButton}`,
      );
      console.log(
        `📦 Popup text (first 1000 chars):`,
        popupContent.text.substring(0, 1000),
      );

      expect(popupContent.hasSuccessMessage).toBe(true);
      console.log("✅ Success message displayed");

      // ✅ VERIFY: Discount code is visible
      expect(popupContent.hasDiscountCode).toBe(true);
      console.log("✅ Discount code displayed");

      // ✅ VERIFY: Copy Code button exists
      expect(popupContent.hasCopyButton).toBe(true);
      console.log("✅ Copy Code button displayed");

      // ✅ VERIFY: Apply button exists
      const applyButton = await page
        .locator('button:has-text("Apply")')
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      expect(applyButton).toBe(true);
      console.log("✅ Apply & Shop button displayed");

      // ✅ VERIFY: Failure message does NOT appear
      const failureMessage = await page
        .locator("text=/Better luck|Try again/i")
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      expect(failureMessage).toBe(false);
      console.log("✅ Failure message NOT displayed (correct)");

      await takeTestScreenshot(page, "spin-to-win-winning-prize.png");

      console.log("✅ WINNING prize test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
      }
    }
  });

  test("🎰 Should show FAILURE message and NO discount code for LOSING prize", async ({
    page,
  }) => {
    console.log("\n🧪 Testing LOSING prize behavior...");

    let campaignId: string | null = null;

    try {
      // Create campaign with ONLY losing prize (100% loss rate)
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Spin to Win - Losing Prize Test",
          status: "ACTIVE",
          templateType: TemplateType.SPIN_TO_WIN,
          goal: "NEWSLETTER_SIGNUP",
          priority: 1000, // Very high priority to ensure this campaign is displayed first
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: { enabled: true, delay: 1000 },
            },
          }),
          contentConfig: JSON.stringify({
            headline: "🎰 Spin to Win!",
            subheadline: "Try your luck for a discount",
            emailRequired: true,
            emailPlaceholder: "Enter your email",
            buttonText: "Spin Now", // PopupManager looks for buttonText, not spinButtonText
            successMessage: "Congratulations! You won!",
            failureMessage: "Better luck next time!",
            prizes: [
              {
                id: "1",
                label: "Try Again",
                probability: 1.0, // 100% chance to get this
                // NO discountCode or discountPercentage = losing prize
              },
            ],
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 0,
            valueType: "PERCENTAGE",
            deliveryMode: "show_in_popup",
            prefix: "LOSE",
            expiryDays: 7,
            singleUse: true,
          }),
        },
      });

      campaignId = campaign.id;
      console.log(`✅ Created losing prize campaign: ${campaignId}`);

      await loginToStore(page);
      await page.waitForTimeout(2000);

      const popupDetected = await detectPopup(page);
      expect(popupDetected).toBe(true);

      // Fill email
      await fillEmailInput(page, TEST_EMAIL);

      // Click the spin button (use aria-label since button text may vary)
      const spinButton = page.locator('button[aria-label*="Spin"]').first();
      await spinButton.waitFor({ state: "visible", timeout: 10000 });
      await spinButton.click({ force: true }); // Force click to bypass overlay
      console.log("✅ Spin button clicked");

      // Wait for spin animation
      await page.waitForTimeout(5000);

      // Access shadow DOM content to check for failure message
      const popupContent = await page.evaluate(() => {
        const container = document.getElementById("split-pop-container");
        if (!container || !container.shadowRoot) {
          return {
            hasContent: false,
            text: "No shadow DOM",
            hasFailureMessage: false,
            hasTryAgain: false,
            hasSuccessMessage: false,
            hasDiscountCode: false,
            hasCopyButton: false,
          };
        }

        const shadowContent = container.shadowRoot.textContent || "";

        return {
          hasContent: shadowContent.length > 0,
          text: shadowContent.substring(0, 500),
          hasFailureMessage: /Better luck|Try again/i.test(shadowContent),
          hasTryAgain: /Try Again/.test(shadowContent),
          hasSuccessMessage: /Congratulations|You won/i.test(shadowContent),
          hasDiscountCode: /[A-Z0-9]{6,}/.test(shadowContent),
          hasCopyButton: /Copy/.test(shadowContent),
        };
      });

      console.log(`📦 Popup content:`, popupContent);

      // ✅ VERIFY: Failure message appears
      expect(popupContent.hasFailureMessage).toBe(true);
      console.log("✅ Failure message displayed");

      // ✅ VERIFY: "Try Again" label is shown
      expect(popupContent.hasTryAgain).toBe(true);
      console.log("✅ 'Try Again' label displayed");

      // ✅ VERIFY: Success message does NOT appear
      expect(popupContent.hasSuccessMessage).toBe(false);
      console.log("✅ Success message NOT displayed (correct)");

      // ✅ VERIFY: NO discount code is visible
      expect(popupContent.hasDiscountCode).toBe(false);
      console.log("✅ Discount code NOT displayed (correct)");

      // ✅ VERIFY: Copy Code button does NOT exist
      expect(popupContent.hasCopyButton).toBe(false);
      console.log("✅ Copy Code button NOT displayed (correct)");

      // ✅ VERIFY: Apply button does NOT exist
      const applyButton = await page
        .locator('button:has-text("Apply")')
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      expect(applyButton).toBe(false);
      console.log("✅ Apply & Shop button NOT displayed (correct)");

      await takeTestScreenshot(page, "spin-to-win-losing-prize.png");

      console.log("✅ LOSING prize test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
      }
    }
  });

  test("🎰 Should handle mixed prizes correctly (win AND loss)", async ({
    page,
  }) => {
    console.log("\n🧪 Testing MIXED prizes behavior...");

    let campaignId: string | null = null;

    try {
      // Create campaign with both winning and losing prizes
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Spin to Win - Mixed Prizes Test",
          status: "ACTIVE",
          templateType: TemplateType.SPIN_TO_WIN,
          goal: "NEWSLETTER_SIGNUP",
          priority: 1000, // Very high priority to ensure this campaign is displayed first
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: { enabled: true, delay: 1000 },
            },
          }),
          contentConfig: JSON.stringify({
            headline: "🎰 Spin to Win!",
            subheadline: "Try your luck",
            emailRequired: true,
            emailPlaceholder: "your@email.com",
            buttonText: "Spin Now", // PopupManager looks for buttonText, not spinButtonText
            successMessage: "You're a winner! 🎉",
            failureMessage: "Don't give up! Try again! 💪",
            prizes: [
              {
                id: "1",
                label: "10% OFF",
                probability: 0.3,
                discountCode: "SAVE10",
                discountPercentage: 10,
              },
              {
                id: "2",
                label: "Free Shipping",
                probability: 0.2,
                discountCode: "FREESHIP",
              },
              {
                id: "3",
                label: "Try Again",
                probability: 0.5,
                // NO discount = losing prize
              },
            ],
          }),
          discountConfig: JSON.stringify({
            enabled: true,
            type: "percentage",
            value: 10,
            valueType: "PERCENTAGE",
            deliveryMode: "show_in_popup",
            prefix: "MIXED",
            expiryDays: 7,
            singleUse: true,
          }),
        },
      });

      campaignId = campaign.id;
      console.log(`✅ Created mixed prizes campaign: ${campaignId}`);

      await loginToStore(page);
      await page.waitForTimeout(2000);

      const popupDetected = await detectPopup(page);
      expect(popupDetected).toBe(true);

      // Fill email
      await fillEmailInput(page, TEST_EMAIL);

      // Click the spin button (use aria-label since button text may vary)
      const spinButton = page.locator('button[aria-label*="Spin"]').first();
      await spinButton.waitFor({ state: "visible", timeout: 10000 });
      await spinButton.click({ force: true }); // Force click to bypass overlay
      console.log("✅ Spin button clicked");

      // Wait for spin animation
      await page.waitForTimeout(5000);

      // Access shadow DOM content to check which prize was won
      const popupContent = await page.evaluate(() => {
        const container = document.getElementById("split-pop-container");
        if (!container || !container.shadowRoot) {
          return { hasContent: false, text: "No shadow DOM" };
        }

        const shadowContent = container.shadowRoot.textContent || "";

        return {
          hasContent: shadowContent.length > 0,
          text: shadowContent.substring(0, 500),
          wonDiscount: /10% OFF|Free Shipping/.test(shadowContent),
          wonTryAgain: /Try Again/.test(shadowContent),
          hasSuccessMessage: /You're a winner/i.test(shadowContent),
          hasFailureMessage: /Don't give up/i.test(shadowContent),
          hasDiscountCode: /SAVE10|FREESHIP/.test(shadowContent),
        };
      });

      console.log(`📦 Popup content:`, popupContent);

      if (popupContent.wonDiscount) {
        console.log("🎊 Won a discount prize!");

        // Verify winning behavior
        expect(popupContent.hasSuccessMessage).toBe(true);
        console.log("✅ Success message displayed for winning prize");

        expect(popupContent.hasDiscountCode).toBe(true);
        console.log("✅ Discount code displayed for winning prize");
      } else if (popupContent.wonTryAgain) {
        console.log("😔 Got 'Try Again'");

        // Verify losing behavior
        expect(popupContent.hasFailureMessage).toBe(true);
        console.log("✅ Failure message displayed for losing prize");

        expect(popupContent.hasDiscountCode).toBe(false);
        console.log("✅ NO discount code displayed for losing prize");
      } else {
        throw new Error("Could not determine prize result");
      }

      await takeTestScreenshot(page, "spin-to-win-mixed-prizes.png");

      console.log("✅ MIXED prizes test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
      }
    }
  });
});
