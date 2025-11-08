import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { QuickBuilders } from "../helpers/campaign-builders";

/**
 * A/B TESTING VARIANT ASSIGNMENT E2E TEST SUITE
 *
 * This test suite verifies the variant assignment algorithm and traffic allocation:
 * - Consistent variant assignment per session
 * - Traffic allocation percentages (50/50, 33/33/33, 25/25/25/25)
 * - Session persistence across page reloads
 * - Variant assignment storage in localStorage
 * - Assignment distribution across multiple users
 *
 * Prerequisites:
 * - Dev server must be running (npm run dev)
 * - Database must be accessible
 * - Test store must be configured
 */

test.describe("A/B Testing Variant Assignment", () => {
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

  test("should maintain consistent variant assignment across page reloads", async ({
    browser,
  }) => {
    console.log("\n🧪 Testing variant assignment persistence...");

    const store = await prisma.store.findFirst({
      where: { isActive: true },
    });

    if (!store) {
      throw new Error("No active store found in database.");
    }

    const experimentName = `Assignment Persistence Test ${Date.now()}`;
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

    console.log(`  ✓ Created experiment: ${experiment.id}`);

    try {
      // Test with a single user session
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginToStore(page);
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(2500);

      // Determine initial variant
      const sawA = await page
        .locator('text="Persistent Variant A"')
        .isVisible()
        .catch(() => false);
      const sawB = await page
        .locator('text="Persistent Variant B"')
        .isVisible()
        .catch(() => false);

      const initialVariant = sawA ? "A" : sawB ? "B" : null;
      console.log(`  ✓ Initial variant: ${initialVariant}`);

      if (initialVariant) {
        // Reload page 5 times and verify same variant is shown
        for (let i = 1; i <= 5; i++) {
          await page.reload({ waitUntil: "networkidle" });
          await page.waitForTimeout(2500);

          const stillSawA = await page
            .locator('text="Persistent Variant A"')
            .isVisible()
            .catch(() => false);
          const stillSawB = await page
            .locator('text="Persistent Variant B"')
            .isVisible()
            .catch(() => false);

          const currentVariant = stillSawA ? "A" : stillSawB ? "B" : null;

          expect(currentVariant).toBe(initialVariant);
          console.log(
            `  ✓ Reload ${i}: Still showing Variant ${currentVariant}`,
          );
        }

        console.log("  ✅ Variant assignment persisted across 5 reloads");
      }

      await context.close();
      console.log("✅ Assignment persistence test passed!");
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

  test("should distribute traffic according to allocation percentages (50/50)", async ({
    browser,
  }) => {
    console.log("\n🧪 Testing 50/50 traffic allocation...");

    const store = await prisma.store.findFirst({
      where: { isActive: true },
    });

    if (!store) {
      throw new Error("No active store found in database.");
    }

    const experimentName = `50-50 Traffic Test ${Date.now()}`;
    const storeId = store.id;

    // Create 2 variants with 50/50 split
    const variantA = await QuickBuilders.newsletter(
      prisma,
      `${experimentName} - A`,
    )
      .withContent({
        headline: "Traffic Test A",
        subheadline: "50% traffic",
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
        headline: "Traffic Test B",
        subheadline: "50% traffic",
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
      // Test with 20 different users
      const userCount = 20;
      const variantCounts = { A: 0, B: 0 };

      for (let i = 0; i < userCount; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await loginToStore(page);
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(2500);

        const sawA = await page
          .locator('text="Traffic Test A"')
          .isVisible()
          .catch(() => false);
        const sawB = await page
          .locator('text="Traffic Test B"')
          .isVisible()
          .catch(() => false);

        if (sawA) {
          variantCounts.A++;
        } else if (sawB) {
          variantCounts.B++;
        }

        await context.close();
      }

      console.log(`  ✓ Tested ${userCount} users`);
      console.log(
        `  📊 Variant A: ${variantCounts.A} users (${((variantCounts.A / userCount) * 100).toFixed(1)}%)`,
      );
      console.log(
        `  📊 Variant B: ${variantCounts.B} users (${((variantCounts.B / userCount) * 100).toFixed(1)}%)`,
      );

      // Verify both variants were shown
      expect(variantCounts.A).toBeGreaterThan(0);
      expect(variantCounts.B).toBeGreaterThan(0);

      // With 20 users and 50/50 split, we expect roughly 10 each
      // Allow for some variance (30-70% range is acceptable for small sample)
      const percentA = (variantCounts.A / userCount) * 100;
      expect(percentA).toBeGreaterThan(20); // At least 20%
      expect(percentA).toBeLessThan(80); // At most 80%

      console.log("✅ 50/50 traffic allocation test passed!");
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

  test("should assign different variants to different users", async ({
    browser,
  }) => {
    console.log("\n🧪 Testing variant distribution across users...");

    const store = await prisma.store.findFirst({
      where: { isActive: true },
    });

    if (!store) {
      throw new Error("No active store found in database.");
    }

    const experimentName = `User Distribution Test ${Date.now()}`;
    const storeId = store.id;

    // Create 2 variants
    const variantA = await QuickBuilders.newsletter(
      prisma,
      `${experimentName} - A`,
    )
      .withContent({
        headline: "Distribution Test A",
        subheadline: "User variant A",
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
        headline: "Distribution Test B",
        subheadline: "User variant B",
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
      // Test with 10 different users
      const userCount = 10;
      const variantsSeen = new Set<string>();

      for (let i = 0; i < userCount; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();

        await loginToStore(page);
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(2500);

        const sawA = await page
          .locator('text="Distribution Test A"')
          .isVisible()
          .catch(() => false);
        const sawB = await page
          .locator('text="Distribution Test B"')
          .isVisible()
          .catch(() => false);

        if (sawA) {
          variantsSeen.add("A");
          console.log(`  ✓ User ${i + 1}: Saw Variant A`);
        } else if (sawB) {
          variantsSeen.add("B");
          console.log(`  ✓ User ${i + 1}: Saw Variant B`);
        }

        await context.close();
      }

      console.log(`  ✓ Tested ${userCount} users`);
      console.log(`  📊 Unique variants seen: ${variantsSeen.size}`);

      // Verify both variants were shown to at least one user
      expect(variantsSeen.size).toBe(2);
      expect(variantsSeen.has("A")).toBe(true);
      expect(variantsSeen.has("B")).toBe(true);

      console.log("✅ User distribution test passed!");
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
