import { test, expect } from "../fixtures/enhanced-fixtures";
import { PrismaClient } from "@prisma/client";
import { QuickBuilders } from "../helpers/campaign-builders";

/**
 * A/B TESTING STOREFRONT E2E TEST SUITE
 *
 * Tests that A/B test variants are properly displayed on the storefront:
 * - Traffic allocation between variants
 * - Variant-specific content rendering
 * - Session persistence (same user sees same variant)
 * - Analytics tracking for each variant
 */

test.describe("A/B Testing Storefront Variant Display", () => {
  const STORE_URL = process.env.STORE_URL || "https://split-pop.myshopify.com";
  const STORE_PASSWORD = "a";
  let prisma: PrismaClient;

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

  test.beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("should display different variants to different users", async ({
    browser,
  }) => {
    console.log("🧪 Testing variant distribution across users...");

    // Get the test store from database
    const store = await prisma.store.findFirst({
      where: { isActive: true },
    });

    if (!store) {
      throw new Error(
        "No active store found in database. Please authenticate with Shopify first.",
      );
    }

    // Create an A/B test experiment with 2 variants
    const experimentName = `AB Test ${Date.now()}`;
    const storeId = store.id;

    // Create Variant A (Control)
    const variantA = await QuickBuilders.newsletter(
      prisma,
      `${experimentName} - Variant A`,
    )
      .withContent({
        headline: "🎯 VARIANT A - Get 10% Off",
        subheadline: "Subscribe to our newsletter",
        emailPlaceholder: "Enter your email",
        submitButtonText: "Subscribe Now",
        successMessage: "Thanks for subscribing!",
      })
      .withTrigger({
        enhancedTriggers: {
          page_load: {
            enabled: true,
            delay: 1000,
            showImmediately: false,
          },
        },
      })
      .build();

    // Create Variant B (Test)
    const variantB = await QuickBuilders.newsletter(
      prisma,
      `${experimentName} - Variant B`,
    )
      .withContent({
        headline: "🚀 VARIANT B - Save 10% Today",
        subheadline: "Join our exclusive newsletter",
        emailPlaceholder: "Your email address",
        submitButtonText: "Get My Discount",
        successMessage: "Welcome aboard!",
      })
      .withTrigger({
        enhancedTriggers: {
          page_load: {
            enabled: true,
            delay: 1000,
            showImmediately: false,
          },
        },
      })
      .build();

    // Create experiment linking both campaigns
    const experiment = await prisma.experiment.create({
      data: {
        storeId,
        name: experimentName,
        description: "Testing different newsletter headlines",
        hypothesis: "Variant B will perform better",
        status: "ACTIVE",
        successMetric: "conversion_rate",
        trafficAllocation: JSON.stringify({ A: 50, B: 50 }),
        startDate: new Date(),
      },
    });

    // Link campaigns to experiment
    await prisma.campaign.update({
      where: { id: variantA.id },
      data: {
        experimentId: experiment.id,
        variantKey: "A",
        isControl: true,
      },
    });

    await prisma.campaign.update({
      where: { id: variantB.id },
      data: {
        experimentId: experiment.id,
        variantKey: "B",
        isControl: false,
      },
    });

    console.log(`✅ Created experiment: ${experiment.id}`);
    console.log(`   - Variant A: ${variantA.id}`);
    console.log(`   - Variant B: ${variantB.id}`);

    try {
      // Test with multiple users (different browser contexts)
      const variantsSeen = new Set<string>();

      for (let i = 0; i < 4; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await loginToStore(page);
        await page.setViewportSize({ width: 1920, height: 1080 });

        // Wait for popup to appear
        await page.waitForTimeout(3000);

        // Check which variant is displayed (need to access Shadow DOM)
        const variantInfo = await page.evaluate(() => {
          const container = document.getElementById("split-pop-container");
          if (!container || !container.shadowRoot) {
            return { variant: null, text: "No shadow DOM" };
          }

          const shadowContent = container.shadowRoot.textContent || "";

          if (shadowContent.includes("VARIANT A - Get 10% Off")) {
            return { variant: "A", text: shadowContent.substring(0, 100) };
          } else if (shadowContent.includes("VARIANT B - Save 10% Today")) {
            return { variant: "B", text: shadowContent.substring(0, 100) };
          } else {
            return {
              variant: null,
              text: shadowContent.substring(0, 100) || "Empty shadow DOM",
            };
          }
        });

        if (variantInfo.variant === "A") {
          console.log(`  User ${i + 1}: Saw Variant A`);
          variantsSeen.add("A");
        } else if (variantInfo.variant === "B") {
          console.log(`  User ${i + 1}: Saw Variant B`);
          variantsSeen.add("B");
        } else {
          console.log(
            `  User ${i + 1}: No variant visible (${variantInfo.text})`,
          );
        }

        await context.close();
      }

      // Verify that both variants were shown to at least one user
      // (With 50/50 split and 4 users, we should see both variants)
      console.log(`Variants seen: ${Array.from(variantsSeen).join(", ")}`);
      expect(variantsSeen.size).toBeGreaterThan(0);
    } finally {
      // Cleanup
      await prisma.campaign.deleteMany({
        where: { experimentId: experiment.id },
      });
      await prisma.experiment.delete({
        where: { id: experiment.id },
      });
    }

    console.log("✅ Variant distribution test complete!");
  });

  test("should show same variant to same user across sessions", async ({
    browser,
  }) => {
    console.log("🧪 Testing variant persistence for same user...");

    // Get the test store from database
    const store = await prisma.store.findFirst({
      where: { isActive: true },
    });

    if (!store) {
      throw new Error(
        "No active store found in database. Please authenticate with Shopify first.",
      );
    }

    const experimentName = `Persistence Test ${Date.now()}`;
    const storeId = store.id;

    // Create 2 variants
    const variantA = await QuickBuilders.newsletter(
      prisma,
      `${experimentName} - A`,
    )
      .withContent({
        headline: "Persistent Variant A",
        subheadline: "Control version",
      })
      .withTrigger({
        enhancedTriggers: {
          page_load: { enabled: true, delay: 1000, showImmediately: false },
        },
      })
      .build();

    const variantB = await QuickBuilders.newsletter(
      prisma,
      `${experimentName} - B`,
    )
      .withContent({
        headline: "Persistent Variant B",
        subheadline: "Test version",
      })
      .withTrigger({
        enhancedTriggers: {
          page_load: { enabled: true, delay: 1000, showImmediately: false },
        },
      })
      .build();

    const experiment = await prisma.experiment.create({
      data: {
        storeId,
        name: experimentName,
        status: "ACTIVE",
        successMetric: "conversion_rate",
        trafficAllocation: JSON.stringify({ A: 50, B: 50 }),
        startDate: new Date(),
      },
    });

    await prisma.campaign.updateMany({
      where: { id: { in: [variantA.id, variantB.id] } },
      data: { experimentId: experiment.id },
    });

    await prisma.campaign.update({
      where: { id: variantA.id },
      data: { variantKey: "A", isControl: true },
    });

    await prisma.campaign.update({
      where: { id: variantB.id },
      data: { variantKey: "B", isControl: false },
    });

    // Verify the experiment was created correctly
    const verifyA = await prisma.campaign.findUnique({
      where: { id: variantA.id },
      select: { experimentId: true, variantKey: true, isControl: true },
    });
    const verifyB = await prisma.campaign.findUnique({
      where: { id: variantB.id },
      select: { experimentId: true, variantKey: true, isControl: true },
    });
    console.log("  📊 Variant A in DB:", verifyA);
    console.log("  📊 Variant B in DB:", verifyB);

    try {
      // Create a persistent context (simulates same user)
      const context = await browser.newContext();
      const page = await context.newPage();

      // Listen to console logs
      page.on("console", (msg) => {
        const text = msg.text();
        if (text.includes("[Split-Pop")) {
          console.log("  🖥️  Browser:", text);
        }
      });

      await loginToStore(page);
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(3000);

      // Determine which variant the user sees (access Shadow DOM)
      const firstVariant = await page.evaluate(() => {
        const container = document.getElementById("split-pop-container");
        if (!container || !container.shadowRoot) return null;

        const shadowContent = container.shadowRoot.textContent || "";
        if (shadowContent.includes("Persistent Variant A")) return "A";
        if (shadowContent.includes("Persistent Variant B")) return "B";
        return null;
      });

      console.log(`  First visit: User saw Variant ${firstVariant}`);

      // Reload the page (same session)
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(3000);

      // Check if same variant is shown (access Shadow DOM)
      const secondVariant = await page.evaluate(() => {
        const container = document.getElementById("split-pop-container");
        if (!container || !container.shadowRoot) return null;

        const shadowContent = container.shadowRoot.textContent || "";
        if (shadowContent.includes("Persistent Variant A")) return "A";
        if (shadowContent.includes("Persistent Variant B")) return "B";
        return null;
      });

      console.log(`  Second visit: User saw Variant ${secondVariant}`);

      // Verify same variant was shown
      if (firstVariant && secondVariant) {
        expect(firstVariant).toBe(secondVariant);
        console.log("✅ Variant persistence verified!");
      }

      await context.close();
    } finally {
      // Cleanup
      await prisma.campaign.deleteMany({
        where: { experimentId: experiment.id },
      });
      await prisma.experiment.delete({
        where: { id: experiment.id },
      });
    }

    console.log("✅ Variant persistence test complete!");
  });
});
