/**
 * Plan Guard Service Tests
 *
 * Tests for billing plan feature access and limit enforcement
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { PlanGuardService } from "~/domains/billing/services/plan-guard.server";
import { PlanLimitError } from "~/domains/billing/errors";
import prisma from "~/db.server";

// Mock Prisma with all required methods
vi.mock("~/db.server", () => ({
  default: {
    store: {
      findUnique: vi.fn(),
    },
    popupEvent: {
      count: vi.fn(),
    },
    campaign: {
      count: vi.fn(),
    },
    experiment: {
      count: vi.fn(),
    },
    template: {
      count: vi.fn(),
    },
  },
  Prisma: {
    DbNull: Symbol("DbNull"),
  },
}));

describe("PlanGuardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getPlanContext", () => {
    it("should return FREE plan context for store on free plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const context = await PlanGuardService.getPlanContext("store-1");

      expect(context.planTier).toBe("FREE");
      expect(context.isActive).toBe(true);
      expect(context.definition.name).toBe("Free");
      expect(context.definition.price).toBe(0);
    });

    it("should return GROWTH plan context for store on Growth plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const context = await PlanGuardService.getPlanContext("store-1");

      expect(context.planTier).toBe("GROWTH");
      expect(context.isActive).toBe(true);
      expect(context.definition.name).toBe("Growth");
      expect(context.definition.price).toBe(29);
    });

    it("should mark subscription as inactive when cancelled", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "CANCELLED",
        shopifySubscriptionStatus: "CANCELLED",
      } as any);

      const context = await PlanGuardService.getPlanContext("store-1");

      expect(context.planTier).toBe("GROWTH");
      expect(context.isActive).toBe(false);
    });

    it("should throw error when store not found", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      await expect(PlanGuardService.getPlanContext("non-existent")).rejects.toThrow(
        "Store not found: non-existent"
      );
    });
  });

  describe("canAccessFeature", () => {
    it("should return true for customCss on GROWTH plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const canAccess = await PlanGuardService.canAccessFeature("store-1", "customCss");
      expect(canAccess).toBe(true);
    });

    it("should return false for customCss on FREE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const canAccess = await PlanGuardService.canAccessFeature("store-1", "customCss");
      expect(canAccess).toBe(false);
    });

    it("should return true for customCss on STARTER plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "STARTER",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const canAccess = await PlanGuardService.canAccessFeature("store-1", "customCss");
      expect(canAccess).toBe(true);
    });

    it("should return false when subscription is inactive", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "CANCELLED",
        shopifySubscriptionStatus: "CANCELLED",
      } as any);

      const canAccess = await PlanGuardService.canAccessFeature("store-1", "customCss");
      expect(canAccess).toBe(false);
    });
  });

  describe("assertFeatureEnabled", () => {
    it("should not throw for customCss on GROWTH plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      await expect(
        PlanGuardService.assertFeatureEnabled("store-1", "customCss")
      ).resolves.not.toThrow();
    });

    it("should throw PlanLimitError for customCss on FREE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      await expect(
        PlanGuardService.assertFeatureEnabled("store-1", "customCss")
      ).rejects.toThrow(PlanLimitError);
    });

    it("should throw PlanLimitError with inactive subscription message", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "CANCELLED",
        shopifySubscriptionStatus: "CANCELLED",
      } as any);

      try {
        await PlanGuardService.assertFeatureEnabled("store-1", "customCss");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(PlanLimitError);
        expect((error as PlanLimitError).message).toContain("subscription is not active");
      }
    });
  });

  describe("assertCanUseCustomCss", () => {
    it("should not throw for GROWTH plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      await expect(
        PlanGuardService.assertCanUseCustomCss("store-1")
      ).resolves.not.toThrow();
    });

    it("should throw for FREE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      await expect(
        PlanGuardService.assertCanUseCustomCss("store-1")
      ).rejects.toThrow(PlanLimitError);
    });

    it("should throw for STARTER plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "STARTER",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      // STARTER plan now has customCss, so this should NOT throw
      await expect(
        PlanGuardService.assertCanUseCustomCss("store-1")
      ).resolves.not.toThrow();
    });
  });

  describe("getMinimumPlanForFeature", () => {
    it("should return STARTER for customCss", () => {
      const minPlan = PlanGuardService.getMinimumPlanForFeature("customCss");
      expect(minPlan).toBe("STARTER");
    });

    it("should return FREE for removeBranding (available on STARTER)", () => {
      const minPlan = PlanGuardService.getMinimumPlanForFeature("removeBranding");
      expect(minPlan).toBe("STARTER");
    });

    it("should return GROWTH for experiments", () => {
      const minPlan = PlanGuardService.getMinimumPlanForFeature("experiments");
      expect(minPlan).toBe("GROWTH");
    });

    it("should return GROWTH for gamificationTemplates", () => {
      const minPlan = PlanGuardService.getMinimumPlanForFeature("gamificationTemplates");
      expect(minPlan).toBe("GROWTH");
    });

    it("should return STARTER for socialProofTemplates", () => {
      const minPlan = PlanGuardService.getMinimumPlanForFeature("socialProofTemplates");
      expect(minPlan).toBe("STARTER");
    });

    it("should return STARTER for scheduledCampaigns", () => {
      const minPlan = PlanGuardService.getMinimumPlanForFeature("scheduledCampaigns");
      expect(minPlan).toBe("STARTER");
    });

  });

  // ===========================================================================
  // TEMPLATE TYPE GATING TESTS
  // ===========================================================================

  describe("canUseTemplateType", () => {
    it("should allow SPIN_TO_WIN on GROWTH plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const canUse = await PlanGuardService.canUseTemplateType("store-1", "SPIN_TO_WIN");
      expect(canUse).toBe(true);
    });

    it("should deny SPIN_TO_WIN on FREE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const canUse = await PlanGuardService.canUseTemplateType("store-1", "SPIN_TO_WIN");
      expect(canUse).toBe(false);
    });

    it("should deny SPIN_TO_WIN on STARTER plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "STARTER",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const canUse = await PlanGuardService.canUseTemplateType("store-1", "SPIN_TO_WIN");
      expect(canUse).toBe(false);
    });

    it("should allow SCRATCH_CARD on GROWTH plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const canUse = await PlanGuardService.canUseTemplateType("store-1", "SCRATCH_CARD");
      expect(canUse).toBe(true);
    });

    it("should allow SOCIAL_PROOF on STARTER plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "STARTER",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const canUse = await PlanGuardService.canUseTemplateType("store-1", "SOCIAL_PROOF");
      expect(canUse).toBe(true);
    });

    it("should deny SOCIAL_PROOF on FREE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const canUse = await PlanGuardService.canUseTemplateType("store-1", "SOCIAL_PROOF");
      expect(canUse).toBe(false);
    });

    it("should allow NEWSLETTER on all plans (basic template)", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const canUse = await PlanGuardService.canUseTemplateType("store-1", "NEWSLETTER");
      expect(canUse).toBe(true);
    });
  });

  describe("assertCanUseTemplateType", () => {
    it("should not throw for SPIN_TO_WIN on GROWTH plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      await expect(
        PlanGuardService.assertCanUseTemplateType("store-1", "SPIN_TO_WIN")
      ).resolves.not.toThrow();
    });

    it("should throw PlanLimitError for SPIN_TO_WIN on FREE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      await expect(
        PlanGuardService.assertCanUseTemplateType("store-1", "SPIN_TO_WIN")
      ).rejects.toThrow(PlanLimitError);
    });

    it("should include upgrade info in error for gamification templates", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "STARTER",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      try {
        await PlanGuardService.assertCanUseTemplateType("store-1", "SPIN_TO_WIN");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(PlanLimitError);
        expect((error as PlanLimitError).message).toContain("Growth");
      }
    });
  });

  // ===========================================================================
  // LEAD LIMIT TESTS
  // ===========================================================================

  describe("checkLeadLimit", () => {
    it("should return allowed=true when under limit", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);
      vi.mocked(prisma.popupEvent.count).mockResolvedValue(50); // Under 100 limit

      const result = await PlanGuardService.checkLeadLimit("store-1");

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(50);
      expect(result.max).toBe(100);
      expect(result.strategy).toBe("HARD_BLOCK");
    });

    it("should return allowed=false on FREE plan when at limit (HARD_BLOCK)", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);
      vi.mocked(prisma.popupEvent.count).mockResolvedValue(100); // At limit

      const result = await PlanGuardService.checkLeadLimit("store-1");

      expect(result.allowed).toBe(false);
      expect(result.strategy).toBe("HARD_BLOCK");
    });

    it("should return allowed=true with grace period on STARTER plan when at limit (SOFT_BLOCK)", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "STARTER",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);
      vi.mocked(prisma.popupEvent.count).mockResolvedValue(500); // At limit

      const result = await PlanGuardService.checkLeadLimit("store-1");

      expect(result.allowed).toBe(true);
      expect(result.isInGracePeriod).toBe(true);
      expect(result.gracePeriodEndsAt).toBeDefined();
      expect(result.warningMessage).toContain("reached your monthly lead limit");
    });

    it("should return allowed=true with warning on PRO plan when over limit (NOTIFY_ONLY)", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "PRO",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);
      vi.mocked(prisma.popupEvent.count).mockResolvedValue(15000); // Over 10000 limit

      const result = await PlanGuardService.checkLeadLimit("store-1");

      expect(result.allowed).toBe(true);
      expect(result.strategy).toBe("NOTIFY_ONLY");
      expect(result.warningMessage).toContain("exceeded your monthly lead limit");
    });

    it("should return warning at 80% usage", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);
      vi.mocked(prisma.popupEvent.count).mockResolvedValue(85); // 85% of 100

      const result = await PlanGuardService.checkLeadLimit("store-1");

      expect(result.allowed).toBe(true);
      expect(result.warningMessage).toContain("85%");
    });

    it("should return unlimited for ENTERPRISE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "ENTERPRISE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const result = await PlanGuardService.checkLeadLimit("store-1");

      expect(result.allowed).toBe(true);
      expect(result.max).toBeNull();
    });
  });

  describe("assertCanCaptureLead", () => {
    it("should not throw when under limit", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);
      vi.mocked(prisma.popupEvent.count).mockResolvedValue(50);

      await expect(
        PlanGuardService.assertCanCaptureLead("store-1")
      ).resolves.not.toThrow();
    });

    it("should throw PlanLimitError on FREE plan when at limit", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);
      vi.mocked(prisma.popupEvent.count).mockResolvedValue(100);

      await expect(
        PlanGuardService.assertCanCaptureLead("store-1")
      ).rejects.toThrow(PlanLimitError);
    });
  });

  // ===========================================================================
  // DISCOUNT PERCENTAGE LIMIT TESTS
  // ===========================================================================

  describe("isDiscountPercentageAllowed", () => {
    it("should allow 10% discount on FREE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const allowed = await PlanGuardService.isDiscountPercentageAllowed("store-1", 10);
      expect(allowed).toBe(true);
    });

    // All plans now have maxDiscountPercentage: null (unlimited)
    it("should allow any percentage on FREE plan (unlimited)", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const allowed = await PlanGuardService.isDiscountPercentageAllowed("store-1", 15);
      expect(allowed).toBe(true);
    });

    it("should allow 25% discount on STARTER plan (unlimited)", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "STARTER",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const allowed = await PlanGuardService.isDiscountPercentageAllowed("store-1", 25);
      expect(allowed).toBe(true);
    });

    it("should allow 30% discount on STARTER plan (unlimited)", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "STARTER",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const allowed = await PlanGuardService.isDiscountPercentageAllowed("store-1", 30);
      expect(allowed).toBe(true);
    });

    it("should allow any percentage on GROWTH plan (unlimited)", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const allowed = await PlanGuardService.isDiscountPercentageAllowed("store-1", 50);
      expect(allowed).toBe(true);
    });
  });

  describe("assertDiscountPercentageAllowed", () => {
    it("should not throw for any discount on FREE plan (unlimited)", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      await expect(
        PlanGuardService.assertDiscountPercentageAllowed("store-1", 20)
      ).resolves.not.toThrow();
    });

    it("should not throw for any discount on STARTER plan (unlimited)", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "STARTER",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      await expect(
        PlanGuardService.assertDiscountPercentageAllowed("store-1", 50)
      ).resolves.not.toThrow();
    });
  });

  // ===========================================================================
  // SCHEDULED CAMPAIGNS & API ACCESS TESTS
  // ===========================================================================

  describe("canUseScheduledCampaigns", () => {
    it("should return true for STARTER plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "STARTER",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);

      const canUse = await PlanGuardService.canUseScheduledCampaigns("store-1");
      expect(canUse).toBe(true);
    });

    it("should return false for FREE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "FREE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: null,
      } as any);

      const canUse = await PlanGuardService.canUseScheduledCampaigns("store-1");
      expect(canUse).toBe(false);
    });
  });

  // ===========================================================================
  // USAGE SUMMARY TESTS
  // ===========================================================================

  describe("getUsageSummary", () => {
    it("should return comprehensive usage data", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "GROWTH",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);
      vi.mocked(prisma.popupEvent.count)
        .mockResolvedValueOnce(5000) // impressions
        .mockResolvedValueOnce(150); // leads
      vi.mocked(prisma.campaign.count).mockResolvedValue(3);
      vi.mocked(prisma.experiment.count).mockResolvedValue(1);

      const summary = await PlanGuardService.getUsageSummary("store-1");

      expect(summary.plan).toBe("GROWTH");
      expect(summary.planName).toBe("Growth");
      expect(summary.overageStrategy).toBe("SOFT_BLOCK");
      expect(summary.usage.impressions.current).toBe(5000);
      expect(summary.usage.impressions.max).toBe(100000);
      expect(summary.usage.impressions.percentage).toBe(5);
      expect(summary.usage.leads.current).toBe(150);
      expect(summary.usage.leads.max).toBe(2500);
      expect(summary.usage.activeCampaigns.current).toBe(3);
      expect(summary.usage.activeCampaigns.max).toBe(15); // GROWTH has 15 max campaigns
      expect(summary.usage.experiments.current).toBe(1);
      expect(summary.usage.experiments.max).toBe(5);
    });

    it("should return null percentages for unlimited limits on ENTERPRISE plan", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: "store-1",
        planTier: "ENTERPRISE",
        planStatus: "ACTIVE",
        shopifySubscriptionStatus: "ACTIVE",
      } as any);
      vi.mocked(prisma.popupEvent.count)
        .mockResolvedValueOnce(500000)
        .mockResolvedValueOnce(50000);
      vi.mocked(prisma.campaign.count).mockResolvedValue(50);
      vi.mocked(prisma.experiment.count).mockResolvedValue(20);

      const summary = await PlanGuardService.getUsageSummary("store-1");

      // ENTERPRISE has: monthlyImpressionCap: 1000000, maxLeadsPerMonth: null
      // So impressions should have a percentage, leads should be null
      expect(summary.usage.impressions.percentage).toBe(50); // 500000/1000000 = 50%
      expect(summary.usage.leads.percentage).toBeNull(); // Unlimited
    });
  });
});

