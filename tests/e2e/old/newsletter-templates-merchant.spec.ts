import { test, expect } from "../fixtures/enhanced-fixtures";
import { PrismaClient } from "@prisma/client";
import { QuickBuilders } from "../helpers/campaign-builders";
import { ShadowDOMHelper } from "../utils/shadow-dom-helpers";

/**
 * NEWSLETTER TEMPLATES - MERCHANT E2E TESTS
 *
 * Tests newsletter popup templates on real Shopify storefront
 * Based on correct methodology from quick-30min-merchant-test.spec.ts
 *
 * Templates tested:
 * - newsletter-elegant: Basic newsletter with email capture
 * - newsletter-minimal: Minimal design variant
 * - newsletter with name field: Additional name input
 * - newsletter with discount: Percentage/fixed discount codes
 */

test.describe("Newsletter Templates - Merchant Tests", () => {
  const STORE_URL = "https://split-pop.myshopify.com";
  const STORE_PASSWORD = "a";
  let prisma: PrismaClient;

  // Helper to login to password-protected store
  async function loginToStore(page) {
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

  // Helper to detect popup on page (Shadow DOM aware)
  async function detectPopup(page) {
    // First check if the split-pop-container exists
    const containerExists =
      (await page.locator("#split-pop-container").count()) > 0;

    if (!containerExists) {
      console.log("❌ #split-pop-container not found");
      return { popupFound: false, popupElement: null };
    }

    console.log("✅ #split-pop-container found");

    // Wait a bit for Shadow DOM to be created and content to render
    await page.waitForTimeout(2000);

    // Check if Shadow DOM exists and has content
    const shadowDOMInfo = await page.evaluate(() => {
      const container = document.querySelector("#split-pop-container");
      if (!container) {
        return { hasShadowRoot: false, hasContent: false, innerHTML: "" };
      }

      const shadowRoot = container.shadowRoot;
      if (!shadowRoot) {
        return { hasShadowRoot: false, hasContent: false, innerHTML: "" };
      }

      // Get the innerHTML of the shadow root
      const innerHTML = shadowRoot.innerHTML || "";
      const hasContent = innerHTML.trim().length > 0;

      // Check for specific popup elements
      const hasNewsletterClass =
        shadowRoot.querySelector('[class*="newsletter"]') !== null;
      const hasPopupClass =
        shadowRoot.querySelector('[class*="popup"]') !== null;
      const hasDialog = shadowRoot.querySelector('[role="dialog"]') !== null;
      const hasEmailInput =
        shadowRoot.querySelector('input[type="email"]') !== null;
      const hasAnyDiv = shadowRoot.querySelector("div") !== null;

      // Count total elements in Shadow DOM
      const totalElements = shadowRoot.querySelectorAll("*").length;

      // Get all element tag names
      const elementTags = Array.from(shadowRoot.querySelectorAll("*"))
        .map((el) => el.tagName.toLowerCase())
        .slice(0, 20); // First 20 elements

      return {
        hasShadowRoot: true,
        hasContent,
        innerHTML: innerHTML.substring(0, 1000), // First 1000 chars for debugging
        hasNewsletterClass,
        hasPopupClass,
        hasDialog,
        hasEmailInput,
        hasAnyDiv,
        totalElements,
        elementTags,
      };
    });

    console.log("📊 Shadow DOM Info:", shadowDOMInfo);

    // Consider popup found if Shadow DOM has any meaningful content
    const popupFound =
      shadowDOMInfo.hasShadowRoot &&
      (shadowDOMInfo.hasNewsletterClass ||
        shadowDOMInfo.hasPopupClass ||
        shadowDOMInfo.hasDialog ||
        shadowDOMInfo.hasEmailInput ||
        (shadowDOMInfo.hasContent && shadowDOMInfo.hasAnyDiv));

    const popupElement = popupFound
      ? page.locator("#split-pop-container")
      : null;

    if (popupFound) {
      console.log("✅ Popup detected in Shadow DOM");
    } else {
      console.log("❌ No popup content found in Shadow DOM");
    }

    return { popupFound, popupElement };
  }

  test.beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("✅ Newsletter Elegant - Basic Email Capture", async ({ page }) => {
    console.log("🎯 Testing Newsletter Elegant Template...");

    const campaign = await QuickBuilders.newsletter(
      prisma,
      "Newsletter Elegant Test",
    )
      .withTemplate("newsletter", "newsletter-elegant")
      .withContent({
        headline: "📧 Subscribe to Our Newsletter",
        subheadline: "Get exclusive offers and updates",
        emailPlaceholder: "Enter your email address",
        submitButtonText: "Subscribe Now",
        successMessage: "Thank you for subscribing!",
      })
      .withTrigger({
        enhancedTriggers: {
          page_load: {
            enabled: true,
            delay: 2000,
            showImmediately: false,
          },
        },
      })
      .build();

    console.log(`📝 Created campaign: ${campaign.id}`);

    // DEBUG: Verify campaign in database
    const dbCampaign = await prisma.campaign.findUnique({
      where: { id: campaign.id },
    });
    console.log("🔍 Campaign in DB:", {
      id: dbCampaign?.id,
      name: dbCampaign?.name,
      status: dbCampaign?.status,
      storeId: dbCampaign?.storeId,
      startDate: dbCampaign?.startDate,
      endDate: dbCampaign?.endDate,
      templateType: dbCampaign?.templateType,
    });

    // DEBUG: Verify store is active
    const store = await prisma.store.findUnique({
      where: { id: dbCampaign?.storeId },
    });
    console.log("🔍 Store in DB:", {
      id: store?.id,
      shopifyDomain: store?.shopifyDomain,
      isActive: store?.isActive,
    });

    try {
      // Capture browser console logs (BEFORE page loads!)
      const consoleLogs: string[] = [];
      page.on("console", (msg) => {
        const text = msg.text();
        consoleLogs.push(text);
        if (text.includes("[Split-Pop]") || text.includes("[PopupManager]")) {
          console.log(`🌐 Browser: ${text}`);
        }
      });

      // Capture network requests
      page.on("request", (request) => {
        if (request.url().includes("/api/campaigns/active")) {
          console.log(`🌐 Network Request: ${request.url()}`);
        }
      });

      page.on("response", async (response) => {
        if (response.url().includes("/api/campaigns/active")) {
          console.log(
            `🌐 Network Response: ${response.status()} ${response.url()}`,
          );
          try {
            const body = await response.json();
            console.log(`🌐 Response Body:`, JSON.stringify(body, null, 2));
          } catch (e) {
            console.log(`🌐 Response Body: (not JSON)`);
          }
        }
      });

      await loginToStore(page);
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Wait for popup to appear
      await page.waitForTimeout(4000);

      // Check if popup loader script is loaded (AFTER waiting)
      const scriptLoaded = await page.evaluate(() => {
        return typeof window.__splitPopApp !== "undefined";
      });
      console.log("📦 Popup loader script loaded:", scriptLoaded);

      // Check browser console for errors
      const consoleErrors = await page.evaluate(() => {
        return window.__SPLIT_POP_ERRORS || [];
      });
      if (consoleErrors.length > 0) {
        console.log("❌ Console errors:", consoleErrors);
      }

      const { popupFound, popupElement } = await detectPopup(page);

      // Verify popup is visible
      expect(popupFound, "Newsletter popup should be detected").toBe(true);

      if (popupFound) {
        // Test email input using Shadow DOM helper
        const shadowHelper = new ShadowDOMHelper(page);

        // Try to find email input in Shadow DOM
        const emailInputVisible = await shadowHelper.isShadowElementVisible(
          "#split-pop-container",
          'input[type="email"]',
        );

        if (emailInputVisible) {
          console.log("📧 Email input found in Shadow DOM, testing...");

          // Fill email using page.evaluate to access Shadow DOM
          await page.evaluate(() => {
            const container = document.querySelector("#split-pop-container");
            if (container && container.shadowRoot) {
              const emailInput = container.shadowRoot.querySelector(
                'input[type="email"]',
              ) as HTMLInputElement;
              if (emailInput) {
                emailInput.value = "test-newsletter@example.com";
                emailInput.dispatchEvent(new Event("input", { bubbles: true }));
                emailInput.dispatchEvent(
                  new Event("change", { bubbles: true }),
                );
              }
            }
          });

          // Verify email was filled
          const emailValue = await page.evaluate(() => {
            const container = document.querySelector("#split-pop-container");
            if (container && container.shadowRoot) {
              const emailInput = container.shadowRoot.querySelector(
                'input[type="email"]',
              ) as HTMLInputElement;
              return emailInput?.value || "";
            }
            return "";
          });

          expect(emailValue).toBe("test-newsletter@example.com");
          console.log("✅ Email input functional");
        }
      }

      // Take screenshot
      await page.screenshot({
        path: "test-results/newsletter-elegant-test.png",
        fullPage: true,
      });

      console.log("✅ Newsletter Elegant test PASSED");
    } finally {
      await prisma.campaign.delete({ where: { id: campaign.id } });
      console.log(`🗑️ Cleaned up campaign: ${campaign.id}`);
    }
  });

  test("✅ Newsletter with Name Field - Additional Input", async ({ page }) => {
    console.log("🎯 Testing Newsletter with Name Field...");

    const campaign = await QuickBuilders.newsletter(
      prisma,
      "Newsletter Name Field Test",
    )
      .withContent({
        headline: "👋 Join Our Community",
        subheadline: "We'd love to know your name",
        emailPlaceholder: "Your email",
        submitButtonText: "Join Now",
      })
      .withNameField(true, false)
      .withTrigger({
        enhancedTriggers: {
          page_load: {
            enabled: true,
            delay: 2000,
          },
        },
      })
      .build();

    console.log(`📝 Created campaign: ${campaign.id}`);

    try {
      await loginToStore(page);
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(4000);

      const { popupFound, popupElement } = await detectPopup(page);

      expect(popupFound, "Newsletter popup should be detected").toBe(true);

      if (popupElement) {
        // Test name input
        const nameInput = popupElement.locator(
          'input[type="text"], input[name="name"]',
        );
        if (await nameInput.isVisible({ timeout: 2000 })) {
          console.log("👤 Name input found, testing...");
          await nameInput.fill("John Doe");
          expect(await nameInput.inputValue()).toBe("John Doe");
          console.log("✅ Name input functional");
        }

        // Test email input
        const emailInput = popupElement.locator('input[type="email"]');
        if (await emailInput.isVisible({ timeout: 2000 })) {
          await emailInput.fill("john.doe@example.com");
          console.log("✅ Email input functional");
        }
      }

      await page.screenshot({
        path: "test-results/newsletter-name-field-test.png",
        fullPage: true,
      });

      console.log("✅ Newsletter with Name Field test PASSED");
    } finally {
      await prisma.campaign.delete({ where: { id: campaign.id } });
      console.log(`🗑️ Cleaned up campaign: ${campaign.id}`);
    }
  });

  test("✅ Newsletter Minimal - Minimal Design Variant", async ({ page }) => {
    console.log("🎯 Testing Newsletter Minimal Template...");

    const campaign = await QuickBuilders.newsletter(
      prisma,
      "Newsletter Minimal Test",
    )
      .withTemplate("newsletter", "newsletter-minimal")
      .withContent({
        headline: "Stay Updated",
        subheadline: "Simple newsletter signup",
        emailPlaceholder: "Email",
        submitButtonText: "Subscribe",
      })
      .withTrigger({
        enhancedTriggers: {
          page_load: {
            enabled: true,
            delay: 2000,
          },
        },
      })
      .build();

    console.log(`📝 Created campaign: ${campaign.id}`);

    try {
      await loginToStore(page);
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(4000);

      const { popupFound } = await detectPopup(page);

      expect(popupFound, "Newsletter minimal popup should be detected").toBe(
        true,
      );

      await page.screenshot({
        path: "test-results/newsletter-minimal-test.png",
        fullPage: true,
      });

      console.log("✅ Newsletter Minimal test PASSED");
    } finally {
      await prisma.campaign.delete({ where: { id: campaign.id } });
      console.log(`🗑️ Cleaned up campaign: ${campaign.id}`);
    }
  });

  test("✅ Newsletter with Percentage Discount", async ({ page }) => {
    console.log("🎯 Testing Newsletter with Percentage Discount...");

    const campaign = await QuickBuilders.newsletter(
      prisma,
      "Newsletter Discount Test",
    )
      .withContent({
        headline: "🎁 Get 10% Off Your First Order",
        subheadline: "Subscribe and save instantly",
        emailPlaceholder: "Enter your email",
        submitButtonText: "Get My Discount",
        successMessage: "Your discount code: WELCOME10",
        discountPercentage: 10,
        discountCode: "WELCOME10",
      })
      .withTrigger({
        enhancedTriggers: {
          page_load: {
            enabled: true,
            delay: 2000,
          },
        },
      })
      .build();

    console.log(`📝 Created campaign: ${campaign.id}`);

    try {
      await loginToStore(page);
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(4000);

      const { popupFound, popupElement } = await detectPopup(page);

      expect(popupFound, "Newsletter discount popup should be detected").toBe(
        true,
      );

      if (popupElement) {
        // Look for discount messaging
        const pageContent = await page.content();
        const hasDiscountText =
          pageContent.includes("10%") ||
          pageContent.includes("discount") ||
          pageContent.includes("WELCOME10");

        if (hasDiscountText) {
          console.log("💰 Discount messaging found in popup");
        }

        // Test email input
        const emailInput = popupElement.locator('input[type="email"]');
        if (await emailInput.isVisible({ timeout: 2000 })) {
          await emailInput.fill("discount-test@example.com");
          console.log("✅ Email input functional");
        }
      }

      await page.screenshot({
        path: "test-results/newsletter-discount-test.png",
        fullPage: true,
      });

      console.log("✅ Newsletter with Discount test PASSED");
    } finally {
      await prisma.campaign.delete({ where: { id: campaign.id } });
      console.log(`🗑️ Cleaned up campaign: ${campaign.id}`);
    }
  });

  test("✅ Newsletter with Consent Field", async ({ page }) => {
    console.log("🎯 Testing Newsletter with Consent Field...");

    const campaign = await QuickBuilders.newsletter(
      prisma,
      "Newsletter Consent Test",
    )
      .withContent({
        headline: "📬 Newsletter Signup",
        subheadline: "Stay informed with our updates",
        emailPlaceholder: "Your email",
        submitButtonText: "Subscribe",
      })
      .withConsentField(true, "I agree to receive marketing emails")
      .withTrigger({
        enhancedTriggers: {
          page_load: {
            enabled: true,
            delay: 2000,
          },
        },
      })
      .build();

    console.log(`📝 Created campaign: ${campaign.id}`);

    try {
      await loginToStore(page);
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(4000);

      const { popupFound, popupElement } = await detectPopup(page);

      expect(popupFound, "Newsletter consent popup should be detected").toBe(
        true,
      );

      if (popupElement) {
        // Look for consent checkbox
        const checkbox = popupElement.locator('input[type="checkbox"]');
        if (await checkbox.isVisible({ timeout: 2000 })) {
          console.log("☑️ Consent checkbox found");
          await checkbox.check();
          expect(await checkbox.isChecked()).toBe(true);
          console.log("✅ Consent checkbox functional");
        }
      }

      await page.screenshot({
        path: "test-results/newsletter-consent-test.png",
        fullPage: true,
      });

      console.log("✅ Newsletter with Consent test PASSED");
    } finally {
      await prisma.campaign.delete({ where: { id: campaign.id } });
      console.log(`🗑️ Cleaned up campaign: ${campaign.id}`);
    }
  });
});
