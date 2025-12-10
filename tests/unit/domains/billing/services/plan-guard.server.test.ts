/**
 * Unit Tests for Plan Guard Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { PlanGuardService } from "~/domains/billing/services/plan-guard.server";
import { PlanLimitError } from "~/domains/billing/errors";

// Mock Prisma
vi.mock("~/db.server", () => ({
  default: {
    store: {
      findUnique: vi.fn(),
    },
    campaign: {
      count: vi.fn().mockResolvedValue(0),
    },
    experiment: {
      count: vi.fn().mockResolvedValue(0),
    },
    template: {
      count: vi.fn().mockResolvedValue(0),
    },
    popupEvent: {
      count: vi.fn().mockResolvedValue(0),
    },
    lead: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
  Prisma: {
    DbNull: Symbol("DbNull"),
  },
}));

import prisma from "~/db.server";

describe("PlanGuardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPlanContext", () => {
    it("should return plan context for existing store", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        shopifyDomain: "test.myshopify.com",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const context = await PlanGuardService.getPlanContext("store-1");

      expect(context.planTier).toBe("GROWTH");
      expect(context.isActive).toBe(true);
    });

    it("should throw error for non-existent store", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      await expect(PlanGuardService.getPlanContext("non-existent")).rejects.toThrow(
        "Store not found"
      );
    });

    it("should mark FREE plan as always active", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        shopifyDomain: "test.myshopify.com",
        planTier: "FREE",
        planStatus: "CANCELLED",
        shopifySubscriptionStatus: null,
      } as any);

      const context = await PlanGuardService.getPlanContext("store-1");

      expect(context.isActive).toBe(true);
    });
  });

  describe("canAccessFeature", () => {
    it("should return true for available feature", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        shopifyDomain: "test.myshopify.com",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const canAccess = await PlanGuardService.canAccessFeature("store-1", "experiments");

      expect(canAccess).toBe(true);
    });

    it("should return false for unavailable feature", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        shopifyDomain: "test.myshopify.com",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const canAccess = await PlanGuardService.canAccessFeature("store-1", "experiments");

      expect(canAccess).toBe(false);
    });
  });

  describe("getMinimumPlanForFeature", () => {
    it("should return GROWTH for experiments", () => {
      const minPlan = PlanGuardService.getMinimumPlanForFeature("experiments");
      expect(minPlan).toBe("GROWTH");
    });

    it("should return STARTER for customTemplates", () => {
      const minPlan = PlanGuardService.getMinimumPlanForFeature("customTemplates");
      expect(minPlan).toBe("STARTER");
    });
  });

  describe("canUseTemplateType", () => {
    it("should allow basic templates on FREE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        shopifyDomain: "test.myshopify.com",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const canUse = await PlanGuardService.canUseTemplateType("store-1", "NEWSLETTER");

      expect(canUse).toBe(true);
    });

    it("should block gamification templates on FREE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        shopifyDomain: "test.myshopify.com",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const canUse = await PlanGuardService.canUseTemplateType("store-1", "SPIN_TO_WIN");

      expect(canUse).toBe(false);
    });
  });
});

