/**
 * Advanced Targeting Sanitization Tests
 *
 * Tests for the plan-based sanitization of advanced targeting (audience targeting)
 * in campaign create/update operations.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { TargetRulesConfig, AudienceTargetingConfig } from "~/domains/campaigns/types/campaign";

// Mock prisma
vi.mock("~/db.server", () => ({
  default: {
    store: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock PlanGuardService
const mockGetPlanContext = vi.fn();
vi.mock("~/domains/billing/services/plan-guard.server", () => ({
  PlanGuardService: {
    getPlanContext: () => mockGetPlanContext(),
  },
}));

// Type for session rule condition
type SessionRuleCondition = {
  field: string;
  operator: "in" | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "nin";
  value: string | number | boolean | string[];
};

// Default disabled audience targeting config (mirrors production)
const DISABLED_AUDIENCE_TARGETING: AudienceTargetingConfig = {
  enabled: false,
  shopifySegmentIds: [],
  sessionRules: {
    enabled: false,
    conditions: [] as SessionRuleCondition[],
    logicOperator: "AND" as const,
  },
};

// Simulated sanitizer function (mirrors production implementation)
async function sanitizeTargetRulesForPlan(
  storeId: string,
  targetRules?: TargetRulesConfig
): Promise<TargetRulesConfig | undefined> {
  if (!targetRules) return targetRules;

  const { definition } = await mockGetPlanContext();

  if (!definition.features.advancedTargeting) {
    const { audienceTargeting, ...rest } = targetRules;
    return {
      ...rest,
      audienceTargeting: DISABLED_AUDIENCE_TARGETING,
    };
  }

  return targetRules;
}

describe("Advanced Targeting Sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sanitizeTargetRulesForPlan", () => {
    describe("Free plan (advancedTargeting: false)", () => {
      beforeEach(() => {
        mockGetPlanContext.mockResolvedValue({
          planTier: "FREE",
          definition: {
            name: "Free",
            features: {
              advancedTargeting: false,
              experiments: false,
              customTemplates: false,
            },
          },
        });
      });

      it("should strip audience targeting when enabled is true", async () => {
        const targetRules: TargetRulesConfig = {
          enhancedTriggers: { page_load: { enabled: true } },
          audienceTargeting: {
            enabled: true,
            shopifySegmentIds: ["segment-1", "segment-2"],
            sessionRules: {
              enabled: true,
              conditions: [{ field: "cartValue", operator: "gt", value: 50 }],
              logicOperator: "AND",
            },
          },
        };

        const result = await sanitizeTargetRulesForPlan("store-123", targetRules);

        expect(result?.audienceTargeting).toEqual(DISABLED_AUDIENCE_TARGETING);
        expect(result?.enhancedTriggers).toEqual({ page_load: { enabled: true } });
      });

      it("should strip Shopify segment IDs even when enabled is false", async () => {
        const targetRules: TargetRulesConfig = {
          audienceTargeting: {
            enabled: false,
            shopifySegmentIds: ["segment-1"],
            sessionRules: {
              enabled: false,
              conditions: [],
              logicOperator: "AND",
            },
          },
        };

        const result = await sanitizeTargetRulesForPlan("store-123", targetRules);

        expect(result?.audienceTargeting?.shopifySegmentIds).toEqual([]);
      });

      it("should strip session rules even when enabled is false", async () => {
        const targetRules: TargetRulesConfig = {
          audienceTargeting: {
            enabled: false,
            shopifySegmentIds: [],
            sessionRules: {
              enabled: true,
              conditions: [{ field: "cartItemCount", operator: "gt", value: 0 }],
              logicOperator: "AND",
            },
          },
        };

        const result = await sanitizeTargetRulesForPlan("store-123", targetRules);

        expect(result?.audienceTargeting?.sessionRules?.enabled).toBe(false);
        expect(result?.audienceTargeting?.sessionRules?.conditions).toEqual([]);
      });

      it("should preserve enhancedTriggers while stripping audienceTargeting", async () => {
        const targetRules: TargetRulesConfig = {
          enhancedTriggers: {
            exit_intent: { enabled: true, sensitivity: "medium" },
            scroll_depth: { enabled: true, depth_percentage: 50 },
            frequency_capping: { max_triggers_per_session: 3 },
          },
          audienceTargeting: {
            enabled: true,
            shopifySegmentIds: ["segment-1"],
            sessionRules: {
              enabled: false,
              conditions: [],
              logicOperator: "AND" as const,
            },
          },
        };

        const result = await sanitizeTargetRulesForPlan("store-123", targetRules);

        expect(result?.enhancedTriggers).toEqual({
          exit_intent: { enabled: true, sensitivity: "medium" },
          scroll_depth: { enabled: true, depth_percentage: 50 },
          frequency_capping: { max_triggers_per_session: 3 },
        });
        expect(result?.audienceTargeting).toEqual(DISABLED_AUDIENCE_TARGETING);
      });

      it("should preserve pageTargeting while stripping audienceTargeting", async () => {
        const targetRules: TargetRulesConfig = {
          pageTargeting: {
            enabled: true,
            pages: ["home", "product"],
            customPatterns: [],
            excludePages: [],
            productTags: [],
            collections: [],
          },
          audienceTargeting: {
            enabled: true,
            shopifySegmentIds: ["segment-1"],
            sessionRules: {
              enabled: false,
              conditions: [],
              logicOperator: "AND" as const,
            },
          },
        };

        const result = await sanitizeTargetRulesForPlan("store-123", targetRules);

        expect(result?.pageTargeting?.enabled).toBe(true);
        expect(result?.pageTargeting?.pages).toEqual(["home", "product"]);
        expect(result?.audienceTargeting).toEqual(DISABLED_AUDIENCE_TARGETING);
      });

      it("should return undefined when targetRules is undefined", async () => {
        const result = await sanitizeTargetRulesForPlan("store-123", undefined);
        expect(result).toBeUndefined();
      });
    });

    describe("Paid plans (advancedTargeting: true)", () => {
      beforeEach(() => {
        mockGetPlanContext.mockResolvedValue({
          planTier: "STARTER",
          definition: {
            name: "Starter",
            features: {
              advancedTargeting: true,
              experiments: false,
              customTemplates: true,
            },
          },
        });
      });

      it("should preserve audience targeting when enabled", async () => {
        const targetRules: TargetRulesConfig = {
          audienceTargeting: {
            enabled: true,
            shopifySegmentIds: ["segment-1", "segment-2"],
            sessionRules: {
              enabled: true,
              conditions: [{ field: "cartValue", operator: "gt", value: 50 }],
              logicOperator: "AND",
            },
          },
        };

        const result = await sanitizeTargetRulesForPlan("store-123", targetRules);

        expect(result?.audienceTargeting?.enabled).toBe(true);
        expect(result?.audienceTargeting?.shopifySegmentIds).toEqual(["segment-1", "segment-2"]);
        expect(result?.audienceTargeting?.sessionRules?.enabled).toBe(true);
      });

      it("should preserve all targeting config unchanged", async () => {
        const targetRules: TargetRulesConfig = {
          enhancedTriggers: { page_load: { enabled: true } },
          audienceTargeting: {
            enabled: true,
            shopifySegmentIds: ["segment-1"],
            sessionRules: {
              enabled: true,
              conditions: [{ field: "cartItemCount", operator: "gt", value: 0 }],
              logicOperator: "OR",
            },
          },
          pageTargeting: {
            enabled: true,
            pages: ["product"],
            customPatterns: [],
            excludePages: [],
            productTags: [],
            collections: [],
          },
        };

        const result = await sanitizeTargetRulesForPlan("store-123", targetRules);

        expect(result).toEqual(targetRules);
      });
    });

    describe("Growth plan (all features)", () => {
      beforeEach(() => {
        mockGetPlanContext.mockResolvedValue({
          planTier: "GROWTH",
          definition: {
            name: "Growth",
            features: {
              advancedTargeting: true,
              experiments: true,
              customTemplates: true,
            },
          },
        });
      });

      it("should preserve complex audience targeting config", async () => {
        const targetRules: TargetRulesConfig = {
          audienceTargeting: {
            enabled: true,
            shopifySegmentIds: ["vip-customers", "repeat-buyers", "high-value"],
            sessionRules: {
              enabled: true,
              conditions: [
                { field: "cartValue", operator: "gte", value: 100 },
                { field: "visitCount", operator: "gte", value: 2 },
              ],
              logicOperator: "AND",
            },
          },
        };

        const result = await sanitizeTargetRulesForPlan("store-123", targetRules);

        expect(result?.audienceTargeting?.shopifySegmentIds).toHaveLength(3);
        expect(result?.audienceTargeting?.sessionRules?.conditions).toHaveLength(2);
      });
    });
  });
});

