/**
 * E2E Tests for Product Upsell Popup
 *
 * Tests the following scenarios:
 * 1. Popup shows when products are successfully fetched
 * 2. Popup does NOT show when API returns no products
 * 3. Popup does NOT show when API returns error (500)
 * 4. Popup does NOT show when API returns 404
 * 5. No flash/flicker when products cannot be loaded
 */

import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { TemplateType } from "../constants/template-types.js";

const STORE_URL = "https://split-pop.myshopify.com";
const STORE_PASSWORD = "a";
const STORE_ID = "cmhh2nulv000mt2emn7wqxfks"; // Updated to match current database

test.describe("Product Upsell Popup - Product Fetching", () => {
  let prisma: PrismaClient;
  let campaignId: string | null = null;

  test.beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.afterEach(async () => {
    // Clean up campaign if created
    if (campaignId) {
      await prisma.campaign
        .delete({ where: { id: campaignId } })
        .catch(() => {});
      campaignId = null;
    }
  });

  test("should show popup when products are successfully fetched", async ({
    page,
    context,
  }) => {
    console.log("🎯 Testing Product Upsell - Success Case...");

    // Capture console logs
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      console.log(`  Browser: [${msg.type()}] ${text}`);
    });

    // Create a product upsell campaign
    const campaign = await prisma.campaign.create({
      data: {
        storeId: STORE_ID,
        name: "Test Product Upsell - Success",
        goal: "INCREASE_REVENUE",
        templateType: TemplateType.PRODUCT_UPSELL,
        status: "ACTIVE",
        contentConfig: JSON.stringify({
          headline: "You May Also Like",
          description: "Complete your look",
          products: ["gid://shopify/Product/1", "gid://shopify/Product/2"],
        }),
        designConfig: JSON.stringify({
          backgroundColor: "#FFFFFF",
          textColor: "#000000",
          buttonColor: "#007BFF",
        }),
        targetRules: JSON.stringify({
          triggers: [
            {
              type: "page_load",
              config: { delay: 100 },
            },
          ],
          segments: [],
        }),
        discountConfig: "{}",
        performanceMetrics: "{}",
        tags: "[]",
        metadata: "{}",
        cartIntegration: "{}",
        audienceContracts: "{}",
        discountContracts: "{}",
        templateConfig: "{}",
        configVersion: 1,
        schemaVersion: 1,
        priority: 1,
      },
    });

    campaignId = campaign.id;

    // Mock successful product API response
    await context.route(
      "**/apps/split-pop/product-upsell/**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            products: [
              {
                id: "gid://shopify/Product/1",
                title: "Test Product 1",
                price: "29.99",
                image: "https://via.placeholder.com/150",
              },
              {
                id: "gid://shopify/Product/2",
                title: "Test Product 2",
                price: "39.99",
                image: "https://via.placeholder.com/150",
              },
            ],
            count: 2,
          }),
        });
      },
    );

    // Navigate to a product page
    await page.goto(`${STORE_URL}/products/the-collection-snowboard-liquid`);
    // Auto-added by Auggie: Password protection handling
    const passwordField = page.locator('input[name="password"]');
    if (await passwordField.isVisible({ timeout: 3000 })) {
      await passwordField.fill("a");
      await page.locator('button[type="submit"], input[type="submit"]').click();
      await page.waitForLoadState("networkidle");
    }

    // Handle password page if it appears
    const passwordInput = page.locator('input[name="password"]');
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(STORE_PASSWORD);
      await page.locator('button:has-text("Enter")').click();
      await page.waitForLoadState("networkidle");
    }

    // Wait for the popup to appear
    const popup = page
      .locator("[data-splitpop]")
      .or(page.locator(".modal-popup"))
      .or(page.locator("text=Test Product Upsell - Success"));

    // Should show popup within 5 seconds
    await expect(popup).toBeVisible({ timeout: 5000 });

    console.log("✅ Product Upsell - Success Case PASSED");
  });

  test("should NOT show popup when API returns no products", async ({
    page,
    context,
  }) => {
    console.log("🎯 Testing Product Upsell - No Products Case...");

    // Create a product upsell campaign
    const campaign = await prisma.campaign.create({
      data: {
        storeId: STORE_ID,
        name: "Test Product Upsell - No Products",
        goal: "INCREASE_REVENUE",
        templateType: TemplateType.PRODUCT_UPSELL,
        status: "ACTIVE",
        contentConfig: JSON.stringify({
          headline: "You May Also Like",
          description: "Complete your look",
          products: ["gid://shopify/Product/1"],
        }),
        designConfig: JSON.stringify({
          backgroundColor: "#FFFFFF",
          textColor: "#000000",
          buttonColor: "#007BFF",
        }),
        targetRules: JSON.stringify({
          triggers: [
            {
              type: "page_load",
              config: { delay: 100 },
            },
          ],
          segments: [],
        }),
        discountConfig: "{}",
        performanceMetrics: "{}",
        tags: "[]",
        metadata: "{}",
        cartIntegration: "{}",
        audienceContracts: "{}",
        discountContracts: "{}",
        templateConfig: "{}",
        configVersion: 1,
        schemaVersion: 1,
        priority: 1,
      },
    });

    campaignId = campaign.id;

    // Mock API response with no products
    await context.route(
      "**/apps/split-pop/product-upsell/**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            products: [],
            count: 0,
          }),
        });
      },
    );

    // Navigate to storefront
    await page.goto(STORE_URL);

    // Enter password if needed
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(STORE_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState("networkidle");
    }

    // Navigate to a product page
    await page.goto(`${STORE_URL}/products/test-product`);

    // Wait a bit to ensure popup would have appeared if it was going to
    await page.waitForTimeout(3000);

    // Popup should NOT be visible
    const popup = page
      .locator('[data-testid="product-upsell-popup"]')
      .or(page.locator(".product-upsell-popup"))
      .or(page.locator("text=You May Also Like"));

    await expect(popup).not.toBeVisible();

    console.log("✅ Product Upsell - No Products Case PASSED");
  });

  test("should NOT show popup when API returns error (500)", async ({
    page,
    context,
  }) => {
    console.log("🎯 Testing Product Upsell - API Error Case...");

    // Create a product upsell campaign
    const campaign = await prisma.campaign.create({
      data: {
        storeId: STORE_ID,
        name: "Test Product Upsell - API Error",
        goal: "INCREASE_REVENUE",
        templateType: TemplateType.PRODUCT_UPSELL,
        status: "ACTIVE",
        contentConfig: JSON.stringify({
          headline: "You May Also Like",
          description: "Complete your look",
          products: ["gid://shopify/Product/1"],
        }),
        designConfig: JSON.stringify({
          backgroundColor: "#FFFFFF",
          textColor: "#000000",
          buttonColor: "#007BFF",
        }),
        targetRules: JSON.stringify({
          triggers: [
            {
              type: "page_load",
              config: { delay: 100 },
            },
          ],
          segments: [],
        }),
        discountConfig: "{}",
        performanceMetrics: "{}",
        tags: "[]",
        metadata: "{}",
        cartIntegration: "{}",
        audienceContracts: "{}",
        discountContracts: "{}",
        templateConfig: "{}",
        configVersion: 1,
        schemaVersion: 1,
        priority: 1,
      },
    });

    campaignId = campaign.id;

    // Mock API error response
    await context.route(
      "**/apps/split-pop/product-upsell/**",
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Internal Server Error",
          }),
        });
      },
    );

    // Navigate to storefront
    await page.goto(STORE_URL);

    // Enter password if needed
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(STORE_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState("networkidle");
    }

    // Navigate to a product page
    await page.goto(`${STORE_URL}/products/test-product`);

    // Wait a bit to ensure popup would have appeared if it was going to
    await page.waitForTimeout(3000);

    // Popup should NOT be visible
    const popup = page
      .locator('[data-testid="product-upsell-popup"]')
      .or(page.locator(".product-upsell-popup"))
      .or(page.locator("text=You May Also Like"));

    await expect(popup).not.toBeVisible();

    console.log("✅ Product Upsell - API Error Case PASSED");
  });

  test("should NOT show popup when API returns 404", async ({
    page,
    context,
  }) => {
    console.log("🎯 Testing Product Upsell - 404 Case...");

    // Create a product upsell campaign
    const campaign = await prisma.campaign.create({
      data: {
        storeId: STORE_ID,
        name: "Test Product Upsell - 404",
        goal: "INCREASE_REVENUE",
        templateType: TemplateType.PRODUCT_UPSELL,
        status: "ACTIVE",
        contentConfig: JSON.stringify({
          headline: "You May Also Like",
          description: "Complete your look",
          products: ["gid://shopify/Product/1"],
        }),
        designConfig: JSON.stringify({
          backgroundColor: "#FFFFFF",
          textColor: "#000000",
          buttonColor: "#007BFF",
        }),
        targetRules: JSON.stringify({
          triggers: [
            {
              type: "page_load",
              config: { delay: 100 },
            },
          ],
          segments: [],
        }),
        discountConfig: "{}",
        performanceMetrics: "{}",
        tags: "[]",
        metadata: "{}",
        cartIntegration: "{}",
        audienceContracts: "{}",
        discountContracts: "{}",
        templateConfig: "{}",
        configVersion: 1,
        schemaVersion: 1,
        priority: 1,
      },
    });

    campaignId = campaign.id;

    // Mock 404 response
    await context.route(
      "**/apps/split-pop/product-upsell/**",
      async (route) => {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Campaign not found",
          }),
        });
      },
    );

    // Navigate to storefront
    await page.goto(STORE_URL);

    // Enter password if needed
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(STORE_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState("networkidle");
    }

    // Navigate to a product page
    await page.goto(`${STORE_URL}/products/test-product`);

    // Wait a bit to ensure popup would have appeared if it was going to
    await page.waitForTimeout(3000);

    // Popup should NOT be visible
    const popup = page
      .locator('[data-testid="product-upsell-popup"]')
      .or(page.locator(".product-upsell-popup"))
      .or(page.locator("text=You May Also Like"));

    await expect(popup).not.toBeVisible();

    console.log("✅ Product Upsell - 404 Case PASSED");
  });

  test("should NOT flash/flicker when products cannot be loaded", async ({
    page,
    context,
  }) => {
    console.log("🎯 Testing Product Upsell - No Flash/Flicker...");

    // Create a product upsell campaign
    const campaign = await prisma.campaign.create({
      data: {
        storeId: STORE_ID,
        name: "Test Product Upsell - No Flash",
        goal: "INCREASE_REVENUE",
        templateType: TemplateType.PRODUCT_UPSELL,
        status: "ACTIVE",
        contentConfig: JSON.stringify({
          headline: "You May Also Like",
          description: "Complete your look",
          products: ["gid://shopify/Product/1"],
        }),
        designConfig: JSON.stringify({
          backgroundColor: "#FFFFFF",
          textColor: "#000000",
          buttonColor: "#007BFF",
        }),
        targetRules: JSON.stringify({
          triggers: [
            {
              type: "page_load",
              config: { delay: 100 },
            },
          ],
          segments: [],
        }),
        discountConfig: "{}",
        performanceMetrics: "{}",
        tags: "[]",
        metadata: "{}",
        cartIntegration: "{}",
        audienceContracts: "{}",
        discountContracts: "{}",
        templateConfig: "{}",
        configVersion: 1,
        schemaVersion: 1,
        priority: 1,
      },
    });

    campaignId = campaign.id;

    // Mock API response with delay and no products
    await context.route(
      "**/apps/split-pop/product-upsell/**",
      async (route) => {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            products: [],
            count: 0,
          }),
        });
      },
    );

    // Navigate to storefront
    await page.goto(STORE_URL);

    // Enter password if needed
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(STORE_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState("networkidle");
    }

    // Navigate to a product page
    await page.goto(`${STORE_URL}/products/test-product`);

    // Track visibility changes
    const visibilityChanges: boolean[] = [];

    const popup = page
      .locator('[data-testid="product-upsell-popup"]')
      .or(page.locator(".product-upsell-popup"))
      .or(page.locator("text=You May Also Like"));

    // Monitor popup visibility every 100ms for 3 seconds
    for (let i = 0; i < 30; i++) {
      const isVisible = await popup.isVisible().catch(() => false);
      visibilityChanges.push(isVisible);
      await page.waitForTimeout(100);
    }

    // Popup should NEVER have been visible (all false)
    const wasEverVisible = visibilityChanges.some((v) => v === true);
    expect(wasEverVisible).toBe(false);

    // Should not have any transitions from visible to hidden (no flash)
    const hadFlash = visibilityChanges.some((current, index) => {
      if (index === 0) return false;
      const previous = visibilityChanges[index - 1];
      return previous === true && current === false;
    });

    expect(hadFlash).toBe(false);

    console.log("✅ Product Upsell - No Flash/Flicker PASSED");
  });
});
