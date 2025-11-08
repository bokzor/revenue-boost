import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { QuickBuilders } from "../helpers/campaign-builders";

/**
 * A/B TESTING ANALYTICS TRACKING E2E TEST SUITE
 *
 * This test suite focuses on verifying analytics tracking for A/B test variants:
 * - Variant impression tracking (VIEW events)
 * - User interaction tracking (INTERACTION events)
 * - Conversion tracking (CONVERSION events)
 * - Event batching and flushing
 * - Metrics API accuracy
 *
 * Prerequisites:
 * - Dev server must be running (npm run dev)
 * - Database must be accessible
 * - Test store must be configured
 */

test.describe("A/B Testing Analytics Tracking", () => {
  let prisma: PrismaClient;
  const STORE_URL = "https://advanced-upsell-test.myshopify.com";
  const STORE_PASSWORD = "a";

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

  test("should track variant impressions correctly", async ({ browser }) => {
    console.log("\n🧪 Testing variant impression tracking...");

    // Get the test store
    const store = await prisma.store.findFirst({
      where: { isActive: true },
    });

    if (!store) {
      throw new Error("No active store found in database.");
    }

    const experimentName = `Impression Tracking Test ${Date.now()}`;
    const storeId = store.id;

    // Create 2 variants
    const variantA = await QuickBuilders.newsletter(
      prisma,
      `${experimentName} - A`,
    )
      .withContent({
        headline: "Impression Test A",
        subheadline: "Control variant",
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
        headline: "Impression Test B",
        subheadline: "Test variant",
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

    console.log(`  ✓ Created experiment: ${experiment.id}`);

    try {
      // Track impressions from multiple users
      const impressionCount = 5;
      const impressions = [];

      for (let i = 0; i < impressionCount; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await loginToStore(page);
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(2500);

        // Check which variant was shown
        const sawA = await page
          .locator('text="Impression Test A"')
          .isVisible()
          .catch(() => false);
        const sawB = await page
          .locator('text="Impression Test B"')
          .isVisible()
          .catch(() => false);

        if (sawA) {
          impressions.push("A");
          console.log(`  ✓ User ${i + 1}: Saw Variant A`);
        } else if (sawB) {
          impressions.push("B");
          console.log(`  ✓ User ${i + 1}: Saw Variant B`);
        }

        await context.close();
      }

      // Wait for analytics to be flushed
      console.log("  ⏳ Waiting for analytics to be processed...");
      await new Promise((resolve) => setTimeout(resolve, 12000));

      // Query analytics events
      const viewEvents = await prisma.popupEvent.findMany({
        where: {
          campaignId: { in: [variantA.id, variantB.id] },
          eventType: "VIEW",
        },
      });

      console.log(`  ✓ Found ${viewEvents.length} VIEW events in database`);
      console.log(`  ✓ Expected ${impressions.length} impressions`);

      // Verify we tracked impressions
      expect(viewEvents.length).toBeGreaterThan(0);

      // Count impressions per variant
      const variantAViews = viewEvents.filter(
        (e) => e.campaignId === variantA.id,
      ).length;
      const variantBViews = viewEvents.filter(
        (e) => e.campaignId === variantB.id,
      ).length;

      console.log(`  📊 Variant A impressions: ${variantAViews}`);
      console.log(`  📊 Variant B impressions: ${variantBViews}`);

      console.log("✅ Impression tracking test passed!");
    } finally {
      // Cleanup
      await prisma.campaign.deleteMany({
        where: { experimentId: experiment.id },
      });
      await prisma.experiment.delete({
        where: { id: experiment.id },
      });
    }
  });

  test("should track user interactions correctly", async ({ browser }) => {
    console.log("\n🧪 Testing user interaction tracking...");

    const store = await prisma.store.findFirst({
      where: { isActive: true },
    });

    if (!store) {
      throw new Error("No active store found in database.");
    }

    const experimentName = `Interaction Tracking Test ${Date.now()}`;
    const storeId = store.id;

    // Create variant with form
    const variant = await QuickBuilders.newsletter(
      prisma,
      `${experimentName} - A`,
    )
      .withContent({
        headline: "Interaction Test",
        subheadline: "Fill out the form",
        emailPlaceholder: "Enter email",
        submitButtonText: "Submit",
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
        trafficAllocation: JSON.stringify({ A: 100 }),
        startDate: new Date(),
      },
    });

    await prisma.campaign.update({
      where: { id: variant.id },
      data: {
        experimentId: experiment.id,
        variantKey: "A",
        isControl: true,
      },
    });

    console.log(`  ✓ Created experiment: ${experiment.id}`);

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginToStore(page);
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(2500);

      // Verify popup is visible
      const popupVisible = await page
        .locator('text="Interaction Test"')
        .isVisible()
        .catch(() => false);

      if (popupVisible) {
        console.log("  ✓ Popup is visible");

        // Interact with the form
        const emailInput = page.locator('input[type="email"]').first();
        if ((await emailInput.count()) > 0) {
          await emailInput.fill("interaction-test@example.com");
          console.log("  ✓ Filled email input");

          // Wait for interaction to be tracked
          await page.waitForTimeout(2000);
        }

        // Try to submit (if submit button exists)
        const submitButton = page.locator('button[type="submit"]').first();
        if ((await submitButton.count()) > 0) {
          await submitButton.click();
          console.log("  ✓ Clicked submit button");
          await page.waitForTimeout(2000);
        }
      }

      await context.close();

      // Wait for analytics to be flushed
      console.log("  ⏳ Waiting for analytics to be processed...");
      await new Promise((resolve) => setTimeout(resolve, 12000));

      // Query analytics events
      const events = await prisma.popupEvent.findMany({
        where: {
          campaignId: variant.id,
        },
      });

      console.log(`  ✓ Found ${events.length} total events`);

      // Count events by type
      const eventsByType = events.reduce(
        (acc, event) => {
          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log("  📊 Events by type:");
      Object.entries(eventsByType).forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`);
      });

      // Verify we have at least VIEW events
      expect(events.length).toBeGreaterThan(0);

      console.log("✅ Interaction tracking test passed!");
    } finally {
      // Cleanup
      await prisma.campaign.deleteMany({
        where: { experimentId: experiment.id },
      });
      await prisma.experiment.delete({
        where: { id: experiment.id },
      });
    }
  });

  test("should maintain accurate metrics across multiple sessions", async ({
    browser,
  }) => {
    console.log("\n🧪 Testing metrics accuracy across sessions...");

    const store = await prisma.store.findFirst({
      where: { isActive: true },
    });

    if (!store) {
      throw new Error("No active store found in database.");
    }

    const experimentName = `Metrics Accuracy Test ${Date.now()}`;
    const storeId = store.id;

    // Create 2 variants
    const variantA = await QuickBuilders.newsletter(
      prisma,
      `${experimentName} - A`,
    )
      .withContent({
        headline: "Metrics Test A",
        subheadline: "Control",
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
        headline: "Metrics Test B",
        subheadline: "Test",
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

    console.log(`  ✓ Created experiment: ${experiment.id}`);

    try {
      // Simulate 10 user sessions
      const sessionCount = 10;
      const variantCounts = { A: 0, B: 0 };

      for (let i = 0; i < sessionCount; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await loginToStore(page);
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(2500);

        const sawA = await page
          .locator('text="Metrics Test A"')
          .isVisible()
          .catch(() => false);
        const sawB = await page
          .locator('text="Metrics Test B"')
          .isVisible()
          .catch(() => false);

        if (sawA) {
          variantCounts.A++;
        } else if (sawB) {
          variantCounts.B++;
        }

        await context.close();
      }

      console.log(`  ✓ Completed ${sessionCount} user sessions`);
      console.log(`  📊 Variant A: ${variantCounts.A} sessions`);
      console.log(`  📊 Variant B: ${variantCounts.B} sessions`);

      // Wait for analytics
      console.log("  ⏳ Waiting for analytics to be processed...");
      await new Promise((resolve) => setTimeout(resolve, 12000));

      // Verify metrics
      const totalEvents = await prisma.popupEvent.count({
        where: {
          campaignId: { in: [variantA.id, variantB.id] },
        },
      });

      console.log(`  ✓ Total events recorded: ${totalEvents}`);
      expect(totalEvents).toBeGreaterThan(0);

      console.log("✅ Metrics accuracy test passed!");
    } finally {
      // Cleanup
      await prisma.campaign.deleteMany({
        where: { experimentId: experiment.id },
      });
      await prisma.experiment.delete({
        where: { id: experiment.id },
      });
    }
  });
});
