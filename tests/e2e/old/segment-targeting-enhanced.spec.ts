import { test, expect } from "../fixtures/enhanced-fixtures";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { TEST_CONFIG } from "../config/test-config";
import { TemplateType } from "../constants/template-types.js";

/**
 * Enhanced Segment Targeting Tests
 *
 * These tests verify that segment targeting works correctly by testing BOTH:
 * 1. POSITIVE cases: Popup SHOULD appear for visitors matching the segment
 * 2. NEGATIVE cases: Popup should NOT appear for visitors NOT matching the segment
 *
 * This ensures the segment filtering logic in /api/campaigns/active is working correctly.
 */

// Use centralized config (map from TEST_CONFIG.STORE)
const {
  URL: STORE_URL,
  PASSWORD: STORE_PASSWORD,
  ID: STORE_ID,
} = TEST_CONFIG.STORE;

// Initialize Redis client for tests
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 50, 2000);
  },
});

// Helper functions
async function loginToStore(page: any) {
  await page.goto(STORE_URL);
  // Auto-added by Auggie: Password protection handling
  const passwordField = page.locator('input[name="password"]');
  if (await passwordField.isVisible({ timeout: 3000 })) {
    await passwordField.fill("a");
    await page.locator('button[type="submit"], input[type="submit"]').click();
    await page.waitForLoadState("networkidle");
  }

  const passwordInput = page.locator('input[type="password"]');
  if (await passwordInput.isVisible()) {
    await passwordInput.fill(STORE_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
  }
}

async function detectPopup(page: any): Promise<boolean> {
  const selectors = [
    '[class*="newsletter"]',
    '[class*="popup"]',
    '[class*="modal"]',
    '[class*="split-pop"]',
    '[data-testid="popup"]',
  ];

  for (const selector of selectors) {
    const elements = await page.locator(selector).count();
    if (elements > 0) {
      console.log(`✅ Found ${elements} popup elements with: ${selector}`);
      return true;
    }
  }

  return false;
}

// Helper to clear visitor data from Redis
async function clearVisitorFromRedis(visitorId: string) {
  const key = `visitor:${STORE_ID}:${visitorId}`;
  await redis.del(key);
  console.log(`🧹 Cleared Redis data for visitor: ${visitorId}`);
}

// Helper to set visitor data in Redis
async function setVisitorDataInRedis(visitorId: string, data: any) {
  const key = `visitor:${STORE_ID}:${visitorId}`;
  await redis.setex(key, 90 * 24 * 60 * 60, JSON.stringify(data));
  console.log(`✅ Set Redis data for visitor: ${visitorId}`, data);
}

test.describe("Enhanced Segment Targeting Tests", () => {
  let prisma: PrismaClient;

  test.beforeAll(() => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  // ============================================================================
  // NEW VISITOR SEGMENT TESTS
  // ============================================================================

  test("🎯 New Visitor Segment - SHOULD show for new visitors", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing New Visitor Segment - POSITIVE case (should show)",
    );

    let campaignId: string | null = null;

    try {
      // Clear all cookies to ensure we're a new visitor
      await page.context().clearCookies();

      // Get the "New Visitor" segment
      const newVisitorSegment = await prisma.customerSegment.findFirst({
        where: {
          name: "New Visitor",
          isDefault: true,
        },
      });

      if (!newVisitorSegment) {
        throw new Error("New Visitor segment not found in database");
      }

      console.log(
        `✅ Found segment: ${newVisitorSegment.name} (${newVisitorSegment.id})`,
      );

      // Create campaign targeting new visitors
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "New Visitor Test - Positive",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.ELEGANT,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [newVisitorSegment.id],
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(`✅ Created campaign: ${campaignId} targeting New Visitors`);

      // Navigate to store (first visit = new visitor)
      await loginToStore(page);

      // Wait for popup
      await page.waitForTimeout(3000);

      // Check if popup appeared (SHOULD appear for new visitors)
      const popupDetected = await detectPopup(page);
      console.log(
        `📊 Popup detection result: ${popupDetected ? "✅ Detected" : "❌ Not detected"}`,
      );

      expect(popupDetected).toBe(true);
      console.log("✅ New Visitor Segment POSITIVE Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
    }
  });

  test("🎯 New Visitor Segment - should NOT show for returning visitors", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing New Visitor Segment - NEGATIVE case (should NOT show)",
    );

    let campaignId: string | null = null;
    const testVisitorId = `test_returning_visitor_${Date.now()}`;

    try {
      // Set up returning visitor in Redis (visitCount > 1)
      await setVisitorDataInRedis(testVisitorId, {
        visitCount: 3,
        firstVisit: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days ago
        lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        pages: [{ url: "/", timestamp: new Date().toISOString() }],
        utm: {},
        device: { userAgent: "", type: "desktop" as const },
      });

      // Get the "New Visitor" segment
      const newVisitorSegment = await prisma.customerSegment.findFirst({
        where: {
          name: "New Visitor",
          isDefault: true,
        },
      });

      if (!newVisitorSegment) {
        throw new Error("New Visitor segment not found in database");
      }

      console.log(
        `✅ Found segment: ${newVisitorSegment.name} (${newVisitorSegment.id})`,
      );

      // Create campaign targeting new visitors
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "New Visitor Test - Negative",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.ELEGANT,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [newVisitorSegment.id],
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(`✅ Created campaign: ${campaignId} targeting New Visitors`);

      // Navigate to store first
      await loginToStore(page);

      // Set localStorage to use our test visitor ID as the session ID
      // The storefront will send this as session_id parameter to /api/campaigns/active
      await page.evaluate((visitorId) => {
        localStorage.setItem(
          "split-pop-session",
          JSON.stringify({
            sessionId: visitorId,
            shownCampaigns: [],
            timestamp: Date.now(),
          }),
        );
      }, testVisitorId);

      // Set up network request listener to debug
      const apiRequests: any[] = [];
      const apiResponses: any[] = [];
      const consoleLogs: string[] = [];

      page.on("request", (request) => {
        if (
          request.url().includes("/api/campaigns") ||
          request.url().includes("/apps/split-pop")
        ) {
          const url = new URL(request.url());
          apiRequests.push({
            url: request.url(),
            sessionId: url.searchParams.get("session_id"),
            shop: url.searchParams.get("shop"),
          });
        }
      });

      page.on("response", async (response) => {
        if (response.url().includes("/campaigns/active")) {
          try {
            const json = await response.json();
            const debugHeader = response.headers()["x-debug-info"];
            apiResponses.push({
              url: response.url(),
              status: response.status(),
              campaigns: json.campaigns?.length || 0,
              campaignIds: json.campaigns?.map((c: any) => c.id) || [],
              debugInfo: debugHeader ? JSON.parse(debugHeader) : null,
            });
          } catch (error) {
            console.log("Error parsing response:", error);
          }
        }
      });

      page.on("console", (msg) => {
        const text = msg.text();
        if (text.includes("Split-Pop") || text.includes("split-pop")) {
          consoleLogs.push(text);
        }
      });

      // Reload page to pick up the new session ID
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for potential popup
      await page.waitForTimeout(3000);

      // Debug: Log API requests, responses, and console
      console.log(`🔍 API requests:`, apiRequests);
      console.log(`🔍 API responses:`, apiResponses);
      console.log(`🔍 Console logs:`, consoleLogs.slice(0, 10)); // First 10 logs
      console.log(`🔍 Expected session_id: ${testVisitorId}`);
      console.log(`🔍 Our campaign ID: ${campaignId}`);

      // Check if our specific campaign is in the response
      const campaignInResponse = apiResponses.some((response) =>
        response.campaignIds?.includes(campaignId),
      );
      console.log(
        `📊 Our campaign in response: ${campaignInResponse ? "❌ YES (FAIL)" : "✅ NO (PASS)"}`,
      );

      // The test passes if our campaign is NOT in the response
      // (Other campaigns may be in the response, but our segment-targeted campaign should be filtered out)
      expect(campaignInResponse).toBe(false);
      console.log("✅ New Visitor Segment NEGATIVE Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
      // Clean up Redis data
      await clearVisitorFromRedis(testVisitorId);
    }
  });

  // ============================================================================
  // RETURNING VISITOR SEGMENT TESTS
  // ============================================================================

  test("🎯 Returning Visitor Segment - SHOULD show for returning visitors", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing Returning Visitor Segment - POSITIVE case (should show)",
    );

    let campaignId: string | null = null;
    const testVisitorId = `test_returning_visitor_pos_${Date.now()}`;

    try {
      // Set up returning visitor in Redis (visitCount > 1)
      await setVisitorDataInRedis(testVisitorId, {
        visitCount: 5,
        firstVisit: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days ago
        lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        pages: [
          { url: "/", timestamp: new Date().toISOString() },
          { url: "/products", timestamp: new Date().toISOString() },
        ],
        utm: {},
        device: { userAgent: "", type: "desktop" as const },
      });

      // Set visitor cookie
      await page.context().addCookies([
        {
          name: "split_pop_visitor_id",
          value: testVisitorId,
          domain: "split-pop.myshopify.com",
          path: "/",
        },
      ]);

      // Get the "Returning Visitor" segment
      const returningVisitorSegment = await prisma.customerSegment.findFirst({
        where: {
          name: "Returning Visitor",
          isDefault: true,
        },
      });

      if (!returningVisitorSegment) {
        throw new Error("Returning Visitor segment not found in database");
      }

      console.log(
        `✅ Found segment: ${returningVisitorSegment.name} (${returningVisitorSegment.id})`,
      );

      // Create campaign targeting returning visitors
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Returning Visitor Test - Positive",
          goal: "INCREASE_REVENUE",
          templateType: TemplateType.FLASH_SALE_MODAL,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [returningVisitorSegment.id],
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(
        `✅ Created campaign: ${campaignId} targeting Returning Visitors`,
      );

      // Navigate to store
      await loginToStore(page);

      // Wait for popup
      await page.waitForTimeout(3000);

      // Check if popup appeared (SHOULD appear for returning visitors)
      const popupDetected = await detectPopup(page);
      console.log(
        `📊 Popup detection result: ${popupDetected ? "✅ Detected" : "❌ Not detected"}`,
      );

      expect(popupDetected).toBe(true);
      console.log("✅ Returning Visitor Segment POSITIVE Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
      await clearVisitorFromRedis(testVisitorId);
    }
  });

  test("🎯 Returning Visitor Segment - should NOT show for new visitors", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing Returning Visitor Segment - NEGATIVE case (should NOT show)",
    );

    let campaignId: string | null = null;
    const testVisitorId = `test_new_visitor_${Date.now()}`;

    try {
      // Set Redis data for a NEW visitor (visitCount = 1)
      await setVisitorDataInRedis(testVisitorId, {
        visitCount: 1,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        pages: [{ url: "/", timestamp: new Date().toISOString() }],
        utm: {},
        device: { userAgent: "", type: "desktop" },
      });

      // Get the "Returning Visitor" segment
      const returningVisitorSegment = await prisma.customerSegment.findFirst({
        where: {
          name: "Returning Visitor",
          isDefault: true,
        },
      });

      if (!returningVisitorSegment) {
        throw new Error("Returning Visitor segment not found in database");
      }

      console.log(
        `✅ Found segment: ${returningVisitorSegment.name} (${returningVisitorSegment.id})`,
      );

      // Create campaign targeting returning visitors
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Returning Visitor Test - Negative",
          goal: "INCREASE_REVENUE",
          templateType: TemplateType.FLASH_SALE_MODAL,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [returningVisitorSegment.id],
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(
        `✅ Created campaign: ${campaignId} targeting Returning Visitors`,
      );

      // Navigate to store first
      await loginToStore(page);

      // Set localStorage to use our test visitor ID as the session ID
      await page.evaluate((visitorId) => {
        localStorage.setItem(
          "split-pop-session",
          JSON.stringify({
            sessionId: visitorId,
            shownCampaigns: [],
            timestamp: Date.now(),
          }),
        );
      }, testVisitorId);

      // Set up network response listener
      const apiResponses: any[] = [];
      page.on("response", async (response) => {
        if (response.url().includes("/campaigns/active")) {
          try {
            const json = await response.json();
            apiResponses.push({
              campaignIds: json.campaigns?.map((c: any) => c.id) || [],
            });
          } catch (error) {
            // Ignore parse errors
          }
        }
      });

      // Reload page to pick up the new session ID
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for potential popup
      await page.waitForTimeout(3000);

      // Check if our specific campaign is in the response
      const campaignInResponse = apiResponses.some((response) =>
        response.campaignIds?.includes(campaignId),
      );
      console.log(
        `📊 Our campaign in response: ${campaignInResponse ? "❌ YES (FAIL)" : "✅ NO (PASS)"}`,
      );

      expect(campaignInResponse).toBe(false);
      console.log("✅ Returning Visitor Segment NEGATIVE Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
      await clearVisitorFromRedis(testVisitorId);
    }
  });

  // ============================================================================
  // MOBILE USER SEGMENT TESTS
  // ============================================================================

  test("🎯 Mobile User Segment - SHOULD show for mobile visitors", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing Mobile User Segment - POSITIVE case (should show)",
    );

    let campaignId: string | null = null;
    const testVisitorId = `test_mobile_visitor_${Date.now()}`;

    try {
      // Set mobile viewport
      await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12

      // Set up mobile visitor in Redis
      await setVisitorDataInRedis(testVisitorId, {
        visitCount: 1,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        pages: [{ url: "/", timestamp: new Date().toISOString() }],
        utm: {},
        device: {
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
          type: "mobile" as const,
        },
      });

      // Set visitor cookie
      await page.context().addCookies([
        {
          name: "split_pop_visitor_id",
          value: testVisitorId,
          domain: "split-pop.myshopify.com",
          path: "/",
        },
      ]);

      // Get the "Mobile User" segment
      const mobileUserSegment = await prisma.customerSegment.findFirst({
        where: {
          name: "Mobile User",
          isDefault: true,
        },
      });

      if (!mobileUserSegment) {
        throw new Error("Mobile User segment not found in database");
      }

      console.log(
        `✅ Found segment: ${mobileUserSegment.name} (${mobileUserSegment.id})`,
      );

      // Create campaign targeting mobile users
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Mobile User Test - Positive",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.MINIMAL,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [mobileUserSegment.id],
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(`✅ Created campaign: ${campaignId} targeting Mobile Users`);

      // Navigate to store
      await loginToStore(page);

      // Wait for popup
      await page.waitForTimeout(3000);

      // Check if popup appeared (SHOULD appear for mobile users)
      const popupDetected = await detectPopup(page);
      console.log(
        `📊 Popup detection result: ${popupDetected ? "✅ Detected" : "❌ Not detected"}`,
      );

      expect(popupDetected).toBe(true);
      console.log("✅ Mobile User Segment POSITIVE Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
      await clearVisitorFromRedis(testVisitorId);
    }
  });

  test("🎯 Mobile User Segment - should NOT show for desktop visitors", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing Mobile User Segment - NEGATIVE case (should NOT show)",
    );

    let campaignId: string | null = null;
    const testVisitorId = `test_desktop_visitor_${Date.now()}`;

    try {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Set up desktop visitor in Redis
      await setVisitorDataInRedis(testVisitorId, {
        visitCount: 1,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        pages: [{ url: "/", timestamp: new Date().toISOString() }],
        utm: {},
        device: {
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          type: "desktop" as const,
        },
      });

      // Set visitor cookie
      await page.context().addCookies([
        {
          name: "split_pop_visitor_id",
          value: testVisitorId,
          domain: "split-pop.myshopify.com",
          path: "/",
        },
      ]);

      // Get the "Mobile User" segment
      const mobileUserSegment = await prisma.customerSegment.findFirst({
        where: {
          name: "Mobile User",
          isDefault: true,
        },
      });

      if (!mobileUserSegment) {
        throw new Error("Mobile User segment not found in database");
      }

      console.log(
        `✅ Found segment: ${mobileUserSegment.name} (${mobileUserSegment.id})`,
      );

      // Create campaign targeting mobile users
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Mobile User Test - Negative",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.MINIMAL,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [mobileUserSegment.id],
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(`✅ Created campaign: ${campaignId} targeting Mobile Users`);

      // Navigate to store first
      await loginToStore(page);

      // Set localStorage to use our test visitor ID as the session ID
      await page.evaluate((visitorId) => {
        localStorage.setItem(
          "split-pop-session",
          JSON.stringify({
            sessionId: visitorId,
            shownCampaigns: [],
            timestamp: Date.now(),
          }),
        );
      }, testVisitorId);

      // Set up network response listener
      const apiResponses: any[] = [];
      page.on("response", async (response) => {
        if (response.url().includes("/campaigns/active")) {
          try {
            const json = await response.json();
            apiResponses.push({
              campaignIds: json.campaigns?.map((c: any) => c.id) || [],
            });
          } catch (error) {
            // Ignore parse errors
          }
        }
      });

      // Reload page to pick up the new session ID
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for potential popup
      await page.waitForTimeout(3000);

      // Check if our specific campaign is in the response
      const campaignInResponse = apiResponses.some((response) =>
        response.campaignIds?.includes(campaignId),
      );
      console.log(
        `📊 Our campaign in response: ${campaignInResponse ? "❌ YES (FAIL)" : "✅ NO (PASS)"}`,
      );

      expect(campaignInResponse).toBe(false);
      console.log("✅ Mobile User Segment NEGATIVE Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
      await clearVisitorFromRedis(testVisitorId);
    }
  });

  // ========================================
  // CART-BASED SEGMENT TESTS
  // ========================================

  test("🛒 Cart Abandoner Segment - SHOULD show for visitors with cart items", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing Cart Abandoner Segment - POSITIVE case (should show)",
    );

    let campaignId: string | null = null;
    const testVisitorId = `test_cart_visitor_${Date.now()}`;

    try {
      // Set Redis data for a visitor with cart items
      await setVisitorDataInRedis(testVisitorId, {
        visitCount: 1,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        pages: [{ url: "/cart", timestamp: new Date().toISOString() }],
        utm: {},
        device: { userAgent: "", type: "desktop" },
      });

      // Get the "Cart Abandoner" segment
      const cartAbandonerSegment = await prisma.customerSegment.findFirst({
        where: {
          name: "Cart Abandoner",
          isDefault: true,
        },
      });

      if (!cartAbandonerSegment) {
        throw new Error("Cart Abandoner segment not found in database");
      }

      console.log(
        `✅ Found segment: ${cartAbandonerSegment.name} (${cartAbandonerSegment.id})`,
      );

      // Create campaign targeting cart abandoners
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Cart Abandoner Test - Positive",
          goal: "INCREASE_REVENUE",
          templateType: TemplateType.CART_RECOVERY_MODAL,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [cartAbandonerSegment.id],
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(
        `✅ Created campaign: ${campaignId} targeting Cart Abandoners`,
      );

      // Navigate to store first
      await loginToStore(page);

      // Set localStorage with session ID AND cart data
      await page.evaluate((visitorId) => {
        localStorage.setItem(
          "split-pop-session",
          JSON.stringify({
            sessionId: visitorId,
            shownCampaigns: [],
            timestamp: Date.now(),
          }),
        );
      }, testVisitorId);

      // Reload page to pick up the new session ID
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for potential popup
      await page.waitForTimeout(3000);

      // Check if popup appeared
      const popupDetected = await detectPopup(page);
      console.log(
        `📊 Popup detection result: ${popupDetected ? "✅ Detected" : "❌ Not detected (FAIL)"}`,
      );

      expect(popupDetected).toBe(true);
      console.log("✅ Cart Abandoner Segment POSITIVE Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
      await clearVisitorFromRedis(testVisitorId);
    }
  });

  test("🛒 Cart Abandoner Segment - should NOT show for visitors without cart items", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing Cart Abandoner Segment - NEGATIVE case (should NOT show)",
    );

    let campaignId: string | null = null;
    const testVisitorId = `test_no_cart_visitor_${Date.now()}`;

    try {
      // Set Redis data for a visitor WITHOUT cart items
      await setVisitorDataInRedis(testVisitorId, {
        visitCount: 1,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        pages: [{ url: "/", timestamp: new Date().toISOString() }],
        utm: {},
        device: { userAgent: "", type: "desktop" },
      });

      // Get the "Cart Abandoner" segment
      const cartAbandonerSegment = await prisma.customerSegment.findFirst({
        where: {
          name: "Cart Abandoner",
          isDefault: true,
        },
      });

      if (!cartAbandonerSegment) {
        throw new Error("Cart Abandoner segment not found in database");
      }

      console.log(
        `✅ Found segment: ${cartAbandonerSegment.name} (${cartAbandonerSegment.id})`,
      );

      // Create campaign targeting cart abandoners
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Cart Abandoner Test - Negative",
          goal: "INCREASE_REVENUE",
          templateType: TemplateType.CART_RECOVERY_MODAL,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [cartAbandonerSegment.id],
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(
        `✅ Created campaign: ${campaignId} targeting Cart Abandoners`,
      );

      // Navigate to store first
      await loginToStore(page);

      // Set localStorage to use our test visitor ID as the session ID
      await page.evaluate((visitorId) => {
        localStorage.setItem(
          "split-pop-session",
          JSON.stringify({
            sessionId: visitorId,
            shownCampaigns: [],
            timestamp: Date.now(),
          }),
        );
      }, testVisitorId);

      // Set up network response listener
      const apiResponses: any[] = [];
      page.on("response", async (response) => {
        if (response.url().includes("/campaigns/active")) {
          try {
            const json = await response.json();
            apiResponses.push({
              campaignIds: json.campaigns?.map((c: any) => c.id) || [],
            });
          } catch (error) {
            // Ignore parse errors
          }
        }
      });

      // Reload page to pick up the new session ID
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for potential popup
      await page.waitForTimeout(3000);

      // Check if our specific campaign is in the response
      const campaignInResponse = apiResponses.some((response) =>
        response.campaignIds?.includes(campaignId),
      );
      console.log(
        `📊 Our campaign in response: ${campaignInResponse ? "❌ YES (FAIL)" : "✅ NO (PASS)"}`,
      );

      expect(campaignInResponse).toBe(false);
      console.log("✅ Cart Abandoner Segment NEGATIVE Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
      await clearVisitorFromRedis(testVisitorId);
    }
  });

  // ========================================
  // CUSTOM SEGMENT TESTS
  // ========================================

  test("🧪 Custom Segment - SHOULD show for matching visitors", async ({
    page,
  }) => {
    console.log("\n🧪 Testing Custom Segment - POSITIVE case (should show)");

    let campaignId: string | null = null;
    let customSegmentId: string | null = null;
    const testVisitorId = `test_custom_visitor_${Date.now()}`;

    try {
      // Create a custom segment for engaged visitors (5+ visits, 3+ page views)
      const customSegment = await prisma.customerSegment.create({
        data: {
          store: { connect: { id: STORE_ID } },
          name: "Super Engaged Visitor",
          description: "Visitors with 5+ visits and 3+ page views",
          isDefault: false,
          isActive: true,
          conditions: JSON.stringify([
            { field: "visitCount", operator: "gte", value: 5, weight: 3 },
            { field: "pageViews", operator: "gte", value: 3, weight: 2 },
          ]),
        },
      });
      customSegmentId = customSegment.id;
      console.log(
        `✅ Created custom segment: ${customSegment.name} (${customSegmentId})`,
      );

      // Set Redis data for a super engaged visitor
      await setVisitorDataInRedis(testVisitorId, {
        visitCount: 7,
        firstVisit: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days ago
        lastVisit: new Date().toISOString(),
        pages: [
          { url: "/", timestamp: new Date().toISOString() },
          { url: "/products", timestamp: new Date().toISOString() },
          { url: "/collections", timestamp: new Date().toISOString() },
          { url: "/about", timestamp: new Date().toISOString() },
        ],
        utm: {},
        device: { userAgent: "", type: "desktop" },
      });

      // Create campaign targeting the custom segment
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Custom Segment Test - Positive",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.ELEGANT,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [customSegmentId],
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(
        `✅ Created campaign: ${campaignId} targeting custom segment`,
      );

      // Navigate to store first
      await loginToStore(page);

      // Set localStorage to use our test visitor ID as the session ID
      await page.evaluate((visitorId) => {
        localStorage.setItem(
          "split-pop-session",
          JSON.stringify({
            sessionId: visitorId,
            shownCampaigns: [],
            timestamp: Date.now(),
          }),
        );
      }, testVisitorId);

      // Reload page to pick up the new session ID
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for potential popup
      await page.waitForTimeout(3000);

      // Check if popup appeared
      const popupDetected = await detectPopup(page);
      console.log(
        `📊 Popup detection result: ${popupDetected ? "✅ Detected" : "❌ Not detected (FAIL)"}`,
      );

      expect(popupDetected).toBe(true);
      console.log("✅ Custom Segment POSITIVE Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
      if (customSegmentId) {
        await prisma.customerSegment.delete({ where: { id: customSegmentId } });
        console.log(`🧹 Cleaned up custom segment: ${customSegmentId}`);
      }
      await clearVisitorFromRedis(testVisitorId);
    }
  });

  // ========================================
  // MULTIPLE SEGMENTS COMBINATION TESTS
  // ========================================

  test("🎯 Multiple Segments - SHOULD show when visitor matches ANY segment (OR logic)", async ({
    page,
  }) => {
    console.log("\n🧪 Testing Multiple Segments - OR logic (should show)");

    let campaignId: string | null = null;
    const testVisitorId = `test_multi_segment_${Date.now()}`;

    try {
      // Set Redis data for a NEW visitor (matches "New Visitor" but NOT "Returning Visitor")
      await setVisitorDataInRedis(testVisitorId, {
        visitCount: 1,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        pages: [{ url: "/", timestamp: new Date().toISOString() }],
        utm: {},
        device: { userAgent: "", type: "desktop" },
      });

      // Get both segments
      const newVisitorSegment = await prisma.customerSegment.findFirst({
        where: { name: "New Visitor", isDefault: true },
      });
      const returningVisitorSegment = await prisma.customerSegment.findFirst({
        where: { name: "Returning Visitor", isDefault: true },
      });

      if (!newVisitorSegment || !returningVisitorSegment) {
        throw new Error("Required segments not found in database");
      }

      console.log(
        `✅ Found segments: New Visitor (${newVisitorSegment.id}), Returning Visitor (${returningVisitorSegment.id})`,
      );

      // Create campaign targeting BOTH segments (OR logic - match ANY)
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Multi Segment Test - OR Logic",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.ELEGANT,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [newVisitorSegment.id, returningVisitorSegment.id], // OR logic
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(
        `✅ Created campaign: ${campaignId} targeting multiple segments`,
      );

      // Navigate to store first
      await loginToStore(page);

      // Set localStorage to use our test visitor ID as the session ID
      await page.evaluate((visitorId) => {
        localStorage.setItem(
          "split-pop-session",
          JSON.stringify({
            sessionId: visitorId,
            shownCampaigns: [],
            timestamp: Date.now(),
          }),
        );
      }, testVisitorId);

      // Reload page to pick up the new session ID
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for potential popup
      await page.waitForTimeout(3000);

      // Check if popup appeared (should appear because visitor matches "New Visitor")
      const popupDetected = await detectPopup(page);
      console.log(
        `📊 Popup detection result: ${popupDetected ? "✅ Detected" : "❌ Not detected (FAIL)"}`,
      );

      expect(popupDetected).toBe(true);
      console.log("✅ Multiple Segments OR Logic Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
      await clearVisitorFromRedis(testVisitorId);
    }
  });

  test("🎯 Custom + Predefined Segments - SHOULD show when visitor matches custom segment", async ({
    page,
  }) => {
    console.log(
      "\n🧪 Testing Custom + Predefined Segments combination (should show)",
    );

    let campaignId: string | null = null;
    let customSegmentId: string | null = null;
    const testVisitorId = `test_combo_visitor_${Date.now()}`;

    try {
      // Create a custom segment for high-engagement mobile users
      const customSegment = await prisma.customerSegment.create({
        data: {
          store: { connect: { id: STORE_ID } },
          name: "High Engagement Mobile",
          description: "Mobile users with 3+ visits",
          isDefault: false,
          isActive: true,
          conditions: JSON.stringify([
            { field: "deviceType", operator: "eq", value: "mobile", weight: 3 },
            { field: "visitCount", operator: "gte", value: 3, weight: 2 },
          ]),
        },
      });
      customSegmentId = customSegment.id;
      console.log(
        `✅ Created custom segment: ${customSegment.name} (${customSegmentId})`,
      );

      // Get the predefined "Mobile User" segment
      const mobileUserSegment = await prisma.customerSegment.findFirst({
        where: { name: "Mobile User", isDefault: true },
      });

      if (!mobileUserSegment) {
        throw new Error("Mobile User segment not found in database");
      }

      console.log(
        `✅ Found predefined segment: ${mobileUserSegment.name} (${mobileUserSegment.id})`,
      );

      // Set Redis data for a high-engagement mobile user
      await setVisitorDataInRedis(testVisitorId, {
        visitCount: 5,
        firstVisit: new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 14 days ago
        lastVisit: new Date().toISOString(),
        pages: [
          { url: "/", timestamp: new Date().toISOString() },
          { url: "/products", timestamp: new Date().toISOString() },
        ],
        utm: {},
        device: {
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
          type: "mobile",
        },
      });

      // Create campaign targeting BOTH custom and predefined segments
      const campaign = await prisma.campaign.create({
        data: {
          storeId: STORE_ID,
          name: "Custom + Predefined Segment Test",
          goal: "NEWSLETTER_SIGNUP",
          templateType: TemplateType.ELEGANT,
          status: "ACTIVE",
          priority: 5,
          targetRules: JSON.stringify({
            enabled: true,
            enhancedTriggers: {
              enabled: true,
              page_load: {
                enabled: true,
                delay: 2000,
              },
            },
            audienceTargeting: {
              enabled: true,
              segments: [customSegmentId, mobileUserSegment.id], // Both custom and predefined
            },
          }),
          designConfig: JSON.stringify({}),
          contentConfig: JSON.stringify({}),
        },
      });
      campaignId = campaign.id;
      console.log(
        `✅ Created campaign: ${campaignId} targeting custom + predefined segments`,
      );

      // Navigate to store first
      await loginToStore(page);

      // Set localStorage to use our test visitor ID as the session ID
      await page.evaluate((visitorId) => {
        localStorage.setItem(
          "split-pop-session",
          JSON.stringify({
            sessionId: visitorId,
            shownCampaigns: [],
            timestamp: Date.now(),
          }),
        );
      }, testVisitorId);

      // Reload page to pick up the new session ID
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for potential popup
      await page.waitForTimeout(3000);

      // Check if popup appeared (should appear because visitor matches both segments)
      const popupDetected = await detectPopup(page);
      console.log(
        `📊 Popup detection result: ${popupDetected ? "✅ Detected" : "❌ Not detected (FAIL)"}`,
      );

      expect(popupDetected).toBe(true);
      console.log("✅ Custom + Predefined Segments Test PASSED");
    } finally {
      if (campaignId) {
        await prisma.campaign.delete({ where: { id: campaignId } });
        console.log(`🧹 Cleaned up campaign: ${campaignId}`);
      }
      if (customSegmentId) {
        await prisma.customerSegment.delete({ where: { id: customSegmentId } });
        console.log(`🧹 Cleaned up custom segment: ${customSegmentId}`);
      }
      await clearVisitorFromRedis(testVisitorId);
    }
  });
});
