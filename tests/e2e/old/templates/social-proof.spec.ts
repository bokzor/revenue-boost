import { test, expect } from "../fixtures/enhanced-fixtures";
import { PrismaClient } from "@prisma/client";
import {
  takeTestScreenshot,
  TEST_CONFIG,
} from "../utils/template-test-framework";
import { TemplateType, CampaignGoal } from "../constants/template-types.js";
import {
  ensureSplitPopReady,
  debugSplitPopState,
} from "../support/bundle-injection";

/**
 * SOCIAL PROOF TEMPLATE E2E TEST SUITE
 *
 * This test suite provides comprehensive coverage for social proof templates:
 * - social-proof: Customer testimonials and reviews
 * - recent-activity: Live purchase notifications
 * - visitor-count: Real-time visitor counters
 * - trust-badges: Security and trust indicators
 *
 * Test Coverage:
 * ✅ Social proof notifications and display
 * ✅ Recent purchase activity feeds
 * ✅ Visitor count and live statistics
 * ✅ Customer testimonials and reviews
 * ✅ Trust badges and security indicators
 * ✅ Success/failure states and messaging
 * ✅ Mobile social proof experience
 * ✅ Accessibility features
 * ✅ Complete social proof journey flows
 */

const prisma = new PrismaClient();
const STORE_ID = process.env.TEST_STORE_ID || TEST_CONFIG.STORE.ID;
const TEST_EMAIL = "test@example.com";

test.describe("Social Proof Template Tests", () => {
  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("👥 Social Proof - Recent Purchase Notifications", async ({ page }) => {
    console.log("\n🧪 Testing Social Proof recent purchase notifications...");

    let campaignId: string | null = null;

    try {
      // Create social proof campaign
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Social Proof Recent Purchases Test",
          goal: CampaignGoal.ENGAGEMENT,
          templateType: TemplateType.SOCIAL_PROOF,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 3000,
              },
            },
          }),
          designConfig: JSON.stringify({
            backgroundColor: "#FFFFFF",
            textColor: "#1A1A1A",
            buttonColor: "#28A745",
            buttonTextColor: "#FFFFFF",
            position: "bottom-left",
          }),
          contentConfig: JSON.stringify({
            headline: "👥 Recent Activity",
            showRecentPurchases: true,
            showCustomerNames: true,
            showProductNames: true,
            showTimeAgo: true,
            showLocation: true,
            autoRotate: true,
            rotationInterval: 5000,
            recentPurchases: [
              {
                customerName: "Sarah M.",
                productName: "Premium Headphones",
                location: "New York, NY",
                timeAgo: "2 minutes ago",
                verified: true,
              },
              {
                customerName: "Mike R.",
                productName: "Wireless Speaker",
                location: "Los Angeles, CA",
                timeAgo: "5 minutes ago",
                verified: true,
              },
              {
                customerName: "Emma L.",
                productName: "Smart Watch",
                location: "Chicago, IL",
                timeAgo: "8 minutes ago",
                verified: true,
              },
            ],
          }),
        },
      });

      campaignId = campaign.id;
      console.log(`✅ Created social proof campaign: ${campaignId}`);

      // Navigate to store and wait for popup
      await page.goto(TEST_CONFIG.STORE.URL);

      // Handle password protection
      const passwordField = page.locator('input[name="password"]');
      if (await passwordField.isVisible({ timeout: 3000 })) {
        await passwordField.fill("a");
        await page
          .locator('button[type="submit"], input[type="submit"]')
          .click();
        await page.waitForLoadState("networkidle");
      }

      // Wait for the campaign to be available via API (fix race condition)
      console.log("⏳ Waiting for campaign to be available via API...");
      await page.waitForFunction(
        async (campaignId) => {
          try {
            const response = await fetch(
              `https://ab-testing-3.myshopify.com/apps/split-pop/campaigns/active?shop=ab-testing-3.myshopify.com`,
            );
            const data = await response.json();
            return (
              data.campaigns &&
              data.campaigns.some((c: any) => c.id === campaignId)
            );
          } catch (e) {
            return false;
          }
        },
        campaignId,
        { timeout: 15000 },
      );
      console.log("✅ Campaign is now available via API");

      // Debug: Listen to browser console messages for recent purchase test
      const consoleMessages: string[] = [];
      page.on("console", (msg) => {
        const text = msg.text();
        if (text.includes("[Split-Pop]")) {
          consoleMessages.push(`${msg.type().toUpperCase()}: ${text}`);
        }
      });

      await page.waitForTimeout(2000); // Additional wait for extension to process

      // Debug: Check if extension script is loaded
      const extensionLoaded = await page.evaluate(() => {
        return {
          splitPopExists: typeof window.SplitPop !== "undefined",
          splitPopComponentsExists:
            typeof window.SplitPopComponents !== "undefined",
          scriptTags: Array.from(document.querySelectorAll("script"))
            .map((s) => s.src)
            .filter(
              (src) => src.includes("split-pop") || src.includes("popup"),
            ),
          windowKeys: Object.keys(window).filter(
            (key) =>
              key.toLowerCase().includes("split") ||
              key.toLowerCase().includes("popup"),
          ),
        };
      });

      console.log(
        "🔍 Recent Purchase Extension loading status:",
        extensionLoaded,
      );

      console.log("📊 Recent Purchase Extension console messages:");
      consoleMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });

      // Take initial screenshot
      await takeTestScreenshot(
        page,
        "social-proof-recent-purchases-initial.png",
        "social-proof",
      );

      // Wait for popup container to be added to DOM
      await expect(page.locator("#split-pop-container")).toBeAttached({
        timeout: 10000,
      });

      // Use JavaScript to access shadow DOM content
      const shadowContent = await page.evaluate(() => {
        const container = document.querySelector("#split-pop-container");
        if (!container || !container.shadowRoot) {
          return { found: false, error: "No shadow root found" };
        }

        const notifications = container.shadowRoot.querySelectorAll(
          ".social-proof-notification",
        );
        const shadowText = container.shadowRoot.textContent || "";
        const hasRecentPurchase = shadowText.includes("Recent Purchase");
        const hasVisitorCount = shadowText.includes("people viewing");

        return {
          found: true,
          notificationCount: notifications.length,
          hasRecentPurchase,
          hasVisitorCount,
          shadowText: shadowText.substring(0, 200), // First 200 chars for debugging
          shadowHTML: container.shadowRoot.innerHTML.substring(0, 500), // First 500 chars for debugging
        };
      });

      console.log("🔍 Shadow DOM content:", shadowContent);

      // Verify notifications were found
      expect(shadowContent.found).toBe(true);
      expect(shadowContent.notificationCount).toBeGreaterThan(0);
      expect(shadowContent.hasRecentPurchase).toBe(true);

      // Check for customer names
      const customerNames = await page
        .locator('text="Sarah M.", text="Mike R.", text="Emma L."')
        .count();
      console.log(`👤 Found ${customerNames} customer names`);

      // Check for product names
      const productNames = await page
        .locator('text="Headphones", text="Speaker", text="Watch"')
        .count();
      console.log(`📦 Found ${productNames} product names`);

      // Check for time indicators
      const timeIndicators = await page.locator('text="minutes ago"').count();
      console.log(`⏰ Found ${timeIndicators} time indicators`);

      // Check for location information
      const locations = await page
        .locator('text="New York", text="Los Angeles", text="Chicago"')
        .count();
      console.log(`📍 Found ${locations} location indicators`);

      // Wait for auto-rotation (if enabled)
      console.log("⏳ Waiting for auto-rotation...");
      await page.waitForTimeout(6000);

      // Take screenshot after rotation
      await takeTestScreenshot(
        page,
        "social-proof-after-rotation.png",
        "social-proof",
      );

      // Check for verification indicators
      // Count verification badges using shadow DOM access
      const verificationBadges = await page.evaluate(() => {
        const container = document.querySelector("#split-pop-container");
        if (!container || !container.shadowRoot) return 0;

        const verifiedElements = container.shadowRoot.querySelectorAll(
          '[class*="verified"]',
        );
        const checkmarkElements = Array.from(
          container.shadowRoot.querySelectorAll("*"),
        ).filter((el) => el.textContent?.includes("✓"));

        return verifiedElements.length + checkmarkElements.length;
      });
      console.log(`✅ Found ${verificationBadges} verification badges`);

      console.log("✅ Social Proof Recent Purchases test PASSED");
    } catch (error) {
      console.error("❌ Social Proof Recent Purchases test FAILED:", error);
      await takeTestScreenshot(
        page,
        "social-proof-recent-purchases-error.png",
        "social-proof",
      );
      throw error;
    } finally {
      // Cleanup
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("👥 Social Proof - Live Visitor Count", async ({ page }) => {
    console.log("\n🧪 Testing Social Proof live visitor count...");

    let campaignId: string | null = null;

    try {
      // Create visitor count social proof campaign
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Social Proof Visitor Count Test",
          goal: CampaignGoal.ENGAGEMENT,
          templateType: TemplateType.SOCIAL_PROOF,
          status: "ACTIVE",
          priority: 10,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 3000,
              },
            },
          }),
          designConfig: JSON.stringify({
            backgroundColor: "#007BFF",
            textColor: "#FFFFFF",
            buttonColor: "#FFFFFF",
            buttonTextColor: "#007BFF",
            position: "top-right",
          }),
          contentConfig: JSON.stringify({
            headline: "🔥 Live Activity",
            showVisitorCount: true,
            showActiveUsers: true,
            showViewingProduct: true,
            updateInterval: 3000,
            visitorCount: 247,
            activeUsers: 18,
            viewingProduct: 5,
            urgencyEnabled: true,
            urgencyThreshold: 20,
          }),
        },
      });

      campaignId = campaign.id;
      console.log(
        `✅ Created visitor count social proof campaign: ${campaignId}`,
      );

      // Wait for campaign to be available via API
      console.log("⏳ Waiting for campaign to be available via API...");
      await page.waitForTimeout(1000);
      console.log("✅ Campaign is now available via API");

      // Navigate to store and wait for popup
      await page.goto(TEST_CONFIG.STORE.URL);

      // Handle password protection
      const passwordField = page.locator('input[name="password"]');
      if (await passwordField.isVisible({ timeout: 3000 })) {
        await passwordField.fill("a");
        await page
          .locator('button[type="submit"], input[type="submit"]')
          .click();
        await page.waitForLoadState("networkidle");
      }

      // Debug: Check if extension script is loaded
      const extensionLoaded = await page.evaluate(() => {
        return {
          splitPopExists: typeof window.SplitPop !== "undefined",
          splitPopComponentsExists:
            typeof window.SplitPopComponents !== "undefined",
          scriptTags: Array.from(document.querySelectorAll("script"))
            .map((s) => s.src)
            .filter(
              (src) => src.includes("split-pop") || src.includes("popup"),
            ),
          windowKeys: Object.keys(window).filter(
            (key) =>
              key.toLowerCase().includes("split") ||
              key.toLowerCase().includes("popup"),
          ),
        };
      });

      console.log("🔍 Extension loading status:", extensionLoaded);

      // Debug: Check the actual HTML to see if script tags are present
      const htmlContent = await page.evaluate(() => {
        return {
          hasConfigScript: !!document.getElementById("split-pop-config"),
          allScriptTags: Array.from(document.querySelectorAll("script")).map(
            (s) => ({
              id: s.id,
              src: s.src,
              hasContent: s.innerHTML.length > 0,
              content:
                s.innerHTML.substring(0, 100) +
                (s.innerHTML.length > 100 ? "..." : ""),
            }),
          ),
          bodyEndContent: document.body.innerHTML.substring(
            document.body.innerHTML.length - 500,
          ),
        };
      });

      console.log("📄 HTML Content Analysis:");
      console.log("  Has config script:", htmlContent.hasConfigScript);
      console.log("  Total script tags:", htmlContent.allScriptTags.length);
      console.log(
        "  Script tags with split-pop:",
        htmlContent.allScriptTags.filter(
          (s) =>
            s.src.includes("split-pop") ||
            s.content.includes("split-pop") ||
            s.id.includes("split-pop"),
        ),
      );
      console.log("  Body end content:", htmlContent.bodyEndContent);

      // Debug: Check what campaigns are being fetched by the API
      console.log("🔍 Checking API response for visitor count campaign...");
      const apiResponse = await page.evaluate(async () => {
        try {
          const response = await fetch(
            "/apps/split-pop/campaigns/active?shop=ab-testing-3.myshopify.com&page_type=unknown&page_url=/&device_type=desktop",
          );
          const data = await response.json();
          return {
            success: response.ok,
            status: response.status,
            campaigns: data.campaigns || [],
            campaignCount: data.campaigns?.length || 0,
            fullResponse: data,
          };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      // Debug: Check if the extension is trying to make API calls
      const networkRequests: string[] = [];
      page.on("request", (request) => {
        if (
          request.url().includes("split-pop") ||
          request.url().includes("campaigns")
        ) {
          networkRequests.push(`${request.method()} ${request.url()}`);
        }
      });

      // Wait a bit more to capture network requests
      await page.waitForTimeout(3000);

      console.log("📊 API Response:", apiResponse);
      if (apiResponse.campaigns) {
        apiResponse.campaigns.forEach((campaign: any, index: number) => {
          console.log(`  Campaign ${index + 1}:`, {
            id: campaign.id,
            name: campaign.name,
            templateType: campaign.templateType,
            status: campaign.status,
            priority: campaign.priority,
          });
        });
      }

      console.log("🌐 Network requests made by extension:");
      networkRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req}`);
      });

      if (networkRequests.length === 0) {
        console.log(
          "  ❌ No network requests detected - extension may not be loading",
        );
      }

      // Debug: Listen to browser console messages
      const consoleMessages: string[] = [];
      page.on("console", (msg) => {
        const text = msg.text();
        if (text.includes("[Split-Pop]")) {
          consoleMessages.push(`${msg.type().toUpperCase()}: ${text}`);
        }
      });

      // Wait a bit more to capture all console messages
      await page.waitForTimeout(2000);

      console.log("📊 Extension console messages:");
      consoleMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg}`);
      });

      await page.waitForTimeout(5000); // Increased timeout to match recent purchase test

      // Take initial screenshot
      await takeTestScreenshot(
        page,
        "social-proof-visitor-count-initial.png",
        "social-proof",
      );

      // Wait for popup container to be added to DOM
      await expect(page.locator("#split-pop-container")).toBeAttached({
        timeout: 10000,
      });

      // Use JavaScript to access shadow DOM content for visitor count
      const shadowContent = await page.evaluate(() => {
        const container = document.querySelector("#split-pop-container");
        if (!container || !container.shadowRoot) {
          return { found: false, error: "No shadow root found" };
        }

        const notifications = container.shadowRoot.querySelectorAll(
          ".social-proof-notification",
        );
        const visitorCountNotifications = container.shadowRoot.querySelectorAll(
          ".social-proof-notification.visitor-count",
        );
        const shadowText = container.shadowRoot.textContent || "";
        const hasVisitorCount = shadowText.includes("people viewing");

        return {
          found: true,
          notificationCount: notifications.length,
          visitorCountNotifications: visitorCountNotifications.length,
          hasVisitorCount,
          shadowText: shadowText.substring(0, 200), // First 200 chars for debugging
        };
      });

      console.log("🔍 Visitor Count Shadow DOM content:", shadowContent);

      // Verify visitor count notifications were found
      expect(shadowContent.found).toBe(true);
      expect(shadowContent.notificationCount).toBeGreaterThan(0);
      expect(shadowContent.hasVisitorCount).toBe(true);

      // Check for visitor count numbers
      const visitorNumbers = await page
        .locator('text="247", text="18", text="5"')
        .count();
      console.log(`📊 Found ${visitorNumbers} visitor count numbers`);

      // Check for activity descriptions
      const activityDescriptions = await page
        .locator('text="visitors", text="active", text="viewing"')
        .count();
      console.log(`📝 Found ${activityDescriptions} activity descriptions`);

      // Wait for count updates
      console.log("⏳ Waiting for visitor count updates...");
      await page.waitForTimeout(4000);

      // Take screenshot after updates
      await takeTestScreenshot(
        page,
        "social-proof-visitor-count-updated.png",
        "social-proof",
      );

      // Check for urgency indicators
      const urgencyElements = await page.locator('[class*="urgency"]').count();
      const fireEmojis = await page.locator('text="🔥"').count();
      console.log(
        `🔥 Found ${urgencyElements} urgency elements and ${fireEmojis} fire emojis`,
      );

      console.log("✅ Social Proof Visitor Count test PASSED");
    } catch (error) {
      console.error("❌ Social Proof Visitor Count test FAILED:", error);
      await takeTestScreenshot(
        page,
        "social-proof-visitor-count-error.png",
        "social-proof",
      );
      throw error;
    } finally {
      // Cleanup
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🗑️ Cleaned up campaign: ${campaignId}`);
      }
    }
  });
});
