/**
 * Billing Service Tests
 *
 * Tests for Shopify subscription management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { BillingService } from "~/domains/billing/services/billing.server";
import prisma from "~/db.server";

// Mock Prisma
vi.mock("~/db.server", () => ({
  default: {
    store: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock the BILLING_PLANS export
vi.mock("~/shopify.server", () => ({
  BILLING_PLANS: {
    STARTER: "Starter",
    GROWTH: "Growth",
    PRO: "Pro",
    ENTERPRISE: "Enterprise",
  },
}));

describe("BillingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getCurrentSubscription", () => {
    it("should return FREE plan when no active subscriptions", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              currentAppInstallation: {
                activeSubscriptions: [],
              },
            },
          }),
        }),
      };

      const result = await BillingService.getCurrentSubscription(mockAdmin, "test.myshopify.com");

      expect(result.planTier).toBe("FREE");
      expect(result.hasActiveSubscription).toBe(false);
      expect(result.subscription).toBeNull();
    });

    it("should return GROWTH plan when Growth subscription is active", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              currentAppInstallation: {
                activeSubscriptions: [
                  {
                    id: "gid://shopify/AppSubscription/123",
                    name: "Growth",
                    status: "ACTIVE",
                    currentPeriodEnd: "2024-02-01T00:00:00Z",
                    trialDays: 0,
                    test: false,
                  },
                ],
              },
            },
          }),
        }),
      };

      const result = await BillingService.getCurrentSubscription(mockAdmin, "test.myshopify.com");

      expect(result.planTier).toBe("GROWTH");
      expect(result.hasActiveSubscription).toBe(true);
      expect(result.subscription?.id).toBe("gid://shopify/AppSubscription/123");
      expect(result.subscription?.name).toBe("Growth");
      expect(result.isTrialing).toBe(false);
    });

    it("should detect trial period when trialDays > 0", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              currentAppInstallation: {
                activeSubscriptions: [
                  {
                    id: "gid://shopify/AppSubscription/456",
                    name: "Pro",
                    status: "ACTIVE",
                    currentPeriodEnd: "2024-02-01T00:00:00Z",
                    trialDays: 5,
                    test: false,
                  },
                ],
              },
            },
          }),
        }),
      };

      const result = await BillingService.getCurrentSubscription(mockAdmin, "test.myshopify.com");

      expect(result.planTier).toBe("PRO");
      expect(result.isTrialing).toBe(true);
      expect(result.trialEndsAt).toEqual(new Date("2024-02-01T00:00:00Z"));
    });

    it("should throw BillingApiError on API failure", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: vi.fn().mockResolvedValue({}),
        }),
      };

      await expect(
        BillingService.getCurrentSubscription(mockAdmin, "test.myshopify.com")
      ).rejects.toThrow("Shopify API returned status 500");
    });

    it("should throw BillingApiError on GraphQL errors", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            errors: [{ message: "Access denied" }],
          }),
        }),
      };

      await expect(
        BillingService.getCurrentSubscription(mockAdmin, "test.myshopify.com")
      ).rejects.toThrow("GraphQL errors: Access denied");
    });
  });

  describe("syncSubscriptionToDatabase", () => {
    it("should update store with subscription info", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              currentAppInstallation: {
                activeSubscriptions: [
                  {
                    id: "gid://shopify/AppSubscription/789",
                    name: "Starter",
                    status: "ACTIVE",
                    currentPeriodEnd: "2024-03-01T00:00:00Z",
                    trialDays: 0,
                    test: false,
                  },
                ],
              },
            },
          }),
        }),
      };

      vi.mocked(prisma.store.updateMany).mockResolvedValue({ count: 1 });

      await BillingService.syncSubscriptionToDatabase(mockAdmin, "test.myshopify.com");

      expect(prisma.store.updateMany).toHaveBeenCalledWith({
        where: { shopifyDomain: "test.myshopify.com" },
        data: expect.objectContaining({
          planTier: "STARTER",
          planStatus: "ACTIVE",
          shopifySubscriptionId: "gid://shopify/AppSubscription/789",
          shopifySubscriptionName: "Starter",
        }),
      });
    });

    it("should fall back to cached context on API error", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          ok: false,
          status: 503,
          json: vi.fn().mockResolvedValue({}),
        }),
      };

      // Mock cached context exists
      vi.mocked(prisma.store.findFirst).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionId: "gid://shopify/AppSubscription/999",
        shopifySubscriptionStatus: "ACTIVE",
        shopifySubscriptionName: "Growth",
        trialEndsAt: null,
        currentPeriodEnd: new Date("2024-04-01T00:00:00Z"),
      } as any);

      const result = await BillingService.syncSubscriptionToDatabase(
        mockAdmin,
        "test.myshopify.com"
      );

      // Should return cached GROWTH plan, not downgrade to FREE
      expect(result.planTier).toBe("GROWTH");
      expect(result.hasActiveSubscription).toBe(true);
      // Should NOT update the database on API error
      expect(prisma.store.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("getBillingContextFromDb", () => {
    it("should return billing context from database", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionId: "gid://shopify/AppSubscription/999",
        shopifySubscriptionStatus: "ACTIVE",
        shopifySubscriptionName: "Growth",
        trialEndsAt: null,
        currentPeriodEnd: new Date("2024-04-01T00:00:00Z"),
      } as any);

      const result = await BillingService.getBillingContextFromDb("store-1");

      expect(result).not.toBeNull();
      expect(result?.planTier).toBe("GROWTH");
      expect(result?.hasActiveSubscription).toBe(true);
      expect(result?.isTrialing).toBe(false);
    });

    it("should return null when store not found", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const result = await BillingService.getBillingContextFromDb("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getBillingPlanKey", () => {
    it("should return correct plan key for each tier", () => {
      expect(BillingService.getBillingPlanKey("STARTER")).toBe("Starter");
      expect(BillingService.getBillingPlanKey("GROWTH")).toBe("Growth");
      expect(BillingService.getBillingPlanKey("PRO")).toBe("Pro");
      expect(BillingService.getBillingPlanKey("ENTERPRISE")).toBe("Enterprise");
    });

    it("should return null for FREE tier", () => {
      expect(BillingService.getBillingPlanKey("FREE")).toBeNull();
    });
  });

  describe("getUpgradePath", () => {
    it("should return all paid tiers for FREE plan", () => {
      const path = BillingService.getUpgradePath("FREE");
      expect(path).toEqual(["STARTER", "GROWTH", "PRO", "ENTERPRISE"]);
    });

    it("should return higher tiers for STARTER plan", () => {
      const path = BillingService.getUpgradePath("STARTER");
      expect(path).toEqual(["GROWTH", "PRO", "ENTERPRISE"]);
    });

    it("should return highest tiers for GROWTH plan", () => {
      const path = BillingService.getUpgradePath("GROWTH");
      expect(path).toEqual(["PRO", "ENTERPRISE"]);
    });

    it("should return only ENTERPRISE for PRO plan", () => {
      const path = BillingService.getUpgradePath("PRO");
      expect(path).toEqual(["ENTERPRISE"]);
    });

    it("should return empty array for ENTERPRISE plan", () => {
      const path = BillingService.getUpgradePath("ENTERPRISE");
      expect(path).toEqual([]);
    });
  });

  describe("getPlanDefinition", () => {
    it("should return correct plan definition", () => {
      const freeDef = BillingService.getPlanDefinition("FREE");
      expect(freeDef.name).toBe("Free");
      expect(freeDef.price).toBe(0);
      expect(freeDef.features.customCss).toBe(false);

      const growthDef = BillingService.getPlanDefinition("GROWTH");
      expect(growthDef.name).toBe("Growth");
      expect(growthDef.price).toBe(29);
      expect(growthDef.features.customCss).toBe(true);
      expect(growthDef.features.experiments).toBe(true);
    });
  });
});

