/**
 * Unit Tests for Billing Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { BillingService, BillingApiError } from "~/domains/billing/services/billing.server";

// Mock dependencies
vi.mock("~/db.server", () => ({
  default: {
    store: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("~/shopify.server", () => ({
  BILLING_PLANS: {
    FREE: { name: "Free", price: 0 },
    STARTER: { name: "Starter", price: 9 },
    GROWTH: { name: "Growth", price: 29 },
    PRO: { name: "Pro", price: 79 },
    ENTERPRISE: { name: "Enterprise", price: 199 },
  },
}));

vi.mock("~/lib/env.server", () => ({
  isBillingBypassed: vi.fn().mockReturnValue(false),
}));

vi.mock("~/domains/billing/constants", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/domains/billing/constants")>();
  return {
    ...actual,
    getPlanTierFromName: vi.fn((name: string) => {
      if (name === "Growth") return "GROWTH";
      if (name === "Starter") return "STARTER";
      if (name === "Pro") return "PRO";
      if (name === "Enterprise") return "ENTERPRISE";
      return "FREE";
    }),
  };
});

describe("BillingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentSubscription", () => {
    it("should return billing context for active subscription", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          ok: true,
          json: vi.fn().mockResolvedValue({
            data: {
              currentAppInstallation: {
                activeSubscriptions: [
                  {
                    id: "sub-1",
                    name: "Growth",
                    status: "ACTIVE",
                    currentPeriodEnd: "2024-12-31",
                    trialDays: 0,
                    test: false,
                  },
                ],
              },
            },
          }),
        }),
      };

      const result = await BillingService.getCurrentSubscription(
        mockAdmin,
        "test.myshopify.com"
      );

      expect(result.hasActiveSubscription).toBe(true);
      expect(result.planTier).toBe("GROWTH");
    });

    it("should return FREE tier when no active subscription", async () => {
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

      const result = await BillingService.getCurrentSubscription(
        mockAdmin,
        "test.myshopify.com"
      );

      expect(result.hasActiveSubscription).toBe(false);
      expect(result.planTier).toBe("FREE");
    });

    it("should throw BillingApiError on GraphQL failure", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockRejectedValue(new Error("Network error")),
      };

      await expect(
        BillingService.getCurrentSubscription(mockAdmin, "test.myshopify.com")
      ).rejects.toThrow(BillingApiError);
    });

    it("should throw BillingApiError on non-OK response", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
        }),
      };

      await expect(
        BillingService.getCurrentSubscription(mockAdmin, "test.myshopify.com")
      ).rejects.toThrow(BillingApiError);
    });
  });

  describe("BillingApiError", () => {
    it("should create error with message", () => {
      const error = new BillingApiError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.name).toBe("BillingApiError");
      expect(error.isTransient).toBe(true);
    });

    it("should allow setting isTransient to false", () => {
      const error = new BillingApiError("Permanent error", false);

      expect(error.isTransient).toBe(false);
    });
  });
});

