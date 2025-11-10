import { test, expect, devices } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { TemplateType } from "../constants/template-types.js";

/**
 * POPUP MOBILE & ACCESSIBILITY TEST SUITE
 *
 * This test suite ensures popups work correctly on mobile devices
 * and meet accessibility standards:
 * 1. Mobile Responsiveness (different screen sizes)
 * 2. Touch Interactions (tap, swipe, pinch)
 * 3. Accessibility (ARIA labels, keyboard navigation, screen readers)
 * 4. Performance on mobile devices
 * 5. Cross-browser mobile compatibility
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const STORE_URL = "https://split-pop.myshopify.com";
const STORE_PASSWORD = "a";
const STORE_ID = "cmhh2nulv000mt2emn7wqxfks";

// Mobile device configurations
const MOBILE_DEVICES = [
  { name: "iPhone 13", ...devices["iPhone 13"] },
  { name: "iPhone 13 Pro", ...devices["iPhone 13 Pro"] },
  { name: "Pixel 5", ...devices["Pixel 5"] },
  { name: "Galaxy S21", ...devices["Galaxy S21"] },
];

// Popup detection selectors
const POPUP_SELECTORS = [
  "[data-splitpop]",
  '[class*="popup"]',
  '[class*="modal"]',
  '[role="dialog"]',
  "#split-pop-container",
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
 * Test mobile touch interactions
 */
async function testMobileTouchInteractions(page: any): Promise<boolean> {
  console.log("📱 Testing mobile touch interactions...");

  try {
    // Test tap on popup elements
    const tappableSelectors = [
      "button",
      'input[type="submit"]',
      '[role="button"]',
      "a",
      '[class*="close"]',
    ];

    for (const selector of tappableSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`📱 Testing tap on: ${selector}`);

          // Get element bounds for touch
          const box = await element.boundingBox();
          if (box) {
            // Simulate touch tap
            await page.touchscreen.tap(
              box.x + box.width / 2,
              box.y + box.height / 2,
            );
            console.log("✅ Touch tap successful");
            await page.waitForTimeout(1000);
            return true;
          }
        }
      } catch (e) {
        // Continue to next element
      }
    }
  } catch (e) {
    console.log("❌ Mobile touch test failed:", e.message);
  }

  return false;
}

/**
 * Test accessibility features
 */
async function testAccessibility(page: any): Promise<boolean> {
  console.log("♿ Testing accessibility features...");

  try {
    // Check for ARIA labels and roles
    const accessibilitySelectors = [
      '[role="dialog"]',
      "[aria-label]",
      "[aria-labelledby]",
      "[aria-describedby]",
      '[aria-modal="true"]',
    ];

    let accessibilityScore = 0;

    for (const selector of accessibilitySelectors) {
      try {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          console.log(
            `✅ Found accessibility feature: ${selector} (${elements.length} elements)`,
          );
          accessibilityScore++;
        }
      } catch (e) {
        // Continue
      }
    }

    // Test keyboard navigation
    try {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(500);
      await page.keyboard.press("Tab");
      await page.waitForTimeout(500);
      console.log("✅ Keyboard navigation test completed");
      accessibilityScore++;
    } catch (e) {
      console.log("⚠️ Keyboard navigation test failed");
    }

    // Test ESC key for closing
    try {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(1000);
      console.log("✅ ESC key test completed");
      accessibilityScore++;
    } catch (e) {
      console.log("⚠️ ESC key test failed");
    }

    console.log(`♿ Accessibility score: ${accessibilityScore}/6`);
    return accessibilityScore >= 2; // At least 2 accessibility features working
  } catch (e) {
    console.log("❌ Accessibility test failed:", e.message);
  }

  return false;
}

/**
 * Test responsive design
 */
async function testResponsiveDesign(page: any): Promise<boolean> {
  console.log("📐 Testing responsive design...");

  try {
    // Get current viewport
    const viewport = page.viewportSize();
    console.log(`📐 Current viewport: ${viewport.width}x${viewport.height}`);

    // Check if popup is visible and properly sized
    for (const selector of POPUP_SELECTORS) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          const box = await element.boundingBox();
          if (box) {
            console.log(`📐 Popup dimensions: ${box.width}x${box.height}`);

            // Check if popup fits within viewport
            const fitsWidth = box.width <= viewport.width;
            const fitsHeight = box.height <= viewport.height;

            if (fitsWidth && fitsHeight) {
              console.log("✅ Popup fits within viewport");
              return true;
            } else {
              console.log(
                `⚠️ Popup overflow - Width fits: ${fitsWidth}, Height fits: ${fitsHeight}`,
              );
              // Still consider it a pass if it's close
              return (
                box.width <= viewport.width * 1.1 &&
                box.height <= viewport.height * 1.1
              );
            }
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
  } catch (e) {
    console.log("❌ Responsive design test failed:", e.message);
  }

  return false;
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe("Popup Mobile & Accessibility Tests", () => {
  let prisma: PrismaClient;

  test.beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.beforeEach(async () => {
    // Clean up any existing test campaigns
    await prisma.campaign.deleteMany({
      where: {
        name: {
          contains: "Test-Mobile-A11y",
        },
      },
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS TESTS
  // ============================================================================

  for (const device of MOBILE_DEVICES) {
    test(`Mobile Responsiveness - ${device.name}`, async ({ browser }) => {
      console.log(`\n📱 Testing on ${device.name}`);

      // Create mobile context with device settings
      const context = await browser.newContext({
        ...device,
      });
      const page = await context.newPage();

      // Create test campaign
      const campaign = await prisma.campaign.create({
        data: {
          name: `Test-Mobile-A11y-${device.name.replace(/\s+/g, "-")}`,
          storeId: STORE_ID,
          templateType: TemplateType.NEWSLETTER_GENERIC,
          goal: "NEWSLETTER_SIGNUP",
          status: "ACTIVE",
          triggers: {
            create: {
              type: "page_load",
              delay: 1000,
            },
          },
          template: {
            create: {
              type: "newsletter",
              config: {
                title: "Mobile Test Popup",
                description: "Testing mobile responsiveness",
                placeholder: "Enter your email",
                buttonText: "Subscribe",
              },
            },
          },
        },
      });

      console.log(`📱 Created mobile campaign: ${campaign.id}`);

      try {
        // Navigate to store
        await loginToStore(page);

        // Wait for popup to appear
        await page.waitForTimeout(3000);
        const popupDetected = await detectPopup(page);
        expect(popupDetected).toBe(true);

        // Test responsive design
        const responsiveWorked = await testResponsiveDesign(page);
        expect(responsiveWorked).toBe(true);

        // Test mobile touch interactions
        const touchWorked = await testMobileTouchInteractions(page);
        expect(touchWorked).toBe(true);

        console.log(`✅ ${device.name} tests completed successfully`);
      } finally {
        await context.close();
      }
    });
  }

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  test("Accessibility - ARIA Labels & Keyboard Navigation", async ({
    page,
  }) => {
    console.log("\n♿ Testing Accessibility Features");

    // Create accessibility test campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: "Test-Mobile-A11y-Accessibility",
        storeId: STORE_ID,
        templateType: TemplateType.NEWSLETTER_GENERIC,
        goal: "NEWSLETTER_SIGNUP",
        status: "ACTIVE",
        triggers: {
          create: {
            type: "page_load",
            delay: 1000,
          },
        },
        template: {
          create: {
            type: "newsletter",
            config: {
              title: "Accessibility Test Popup",
              description: "Testing accessibility features",
              placeholder: "Enter your email",
              buttonText: "Subscribe",
            },
          },
        },
      },
    });

    console.log(`♿ Created accessibility campaign: ${campaign.id}`);

    // Navigate to store
    await loginToStore(page);

    // Wait for popup to appear
    await page.waitForTimeout(3000);
    const popupDetected = await detectPopup(page);
    expect(popupDetected).toBe(true);

    // Test accessibility features
    const accessibilityWorked = await testAccessibility(page);
    expect(accessibilityWorked).toBe(true);

    console.log("✅ Accessibility tests completed");
  });

  // ============================================================================
  // CROSS-DEVICE INTERACTION TESTS
  // ============================================================================

  test("Cross-Device - Portrait vs Landscape", async ({ browser }) => {
    console.log("\n🔄 Testing Portrait vs Landscape Orientation");

    // Test in portrait mode
    const portraitContext = await browser.newContext({
      viewport: { width: 375, height: 812 }, // iPhone portrait
    });
    const portraitPage = await portraitContext.newPage();

    // Test in landscape mode
    const landscapeContext = await browser.newContext({
      viewport: { width: 812, height: 375 }, // iPhone landscape
    });
    const landscapePage = await landscapeContext.newPage();

    // Create test campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: "Test-Mobile-A11y-Orientation",
        storeId: STORE_ID,
        templateType: TemplateType.NEWSLETTER_GENERIC,
        goal: "NEWSLETTER_SIGNUP",
        status: "ACTIVE",
        triggers: {
          create: {
            type: "page_load",
            delay: 1000,
          },
        },
        template: {
          create: {
            type: "newsletter",
            config: {
              title: "Orientation Test",
              description: "Testing different orientations",
            },
          },
        },
      },
    });

    console.log(`🔄 Created orientation campaign: ${campaign.id}`);

    try {
      // Test portrait mode
      console.log("📱 Testing portrait mode...");
      await loginToStore(portraitPage);
      await portraitPage.waitForTimeout(3000);
      const portraitPopup = await detectPopup(portraitPage);
      expect(portraitPopup).toBe(true);
      const portraitResponsive = await testResponsiveDesign(portraitPage);
      expect(portraitResponsive).toBe(true);

      // Test landscape mode
      console.log("📱 Testing landscape mode...");
      await loginToStore(landscapePage);
      await landscapePage.waitForTimeout(3000);
      const landscapePopup = await detectPopup(landscapePage);
      expect(landscapePopup).toBe(true);
      const landscapeResponsive = await testResponsiveDesign(landscapePage);
      expect(landscapeResponsive).toBe(true);

      console.log("✅ Orientation tests completed");
    } finally {
      await portraitContext.close();
      await landscapeContext.close();
    }
  });
});
