/**
 * Unit Tests for Plan Types
 */

import { describe, it, expect } from "vitest";

import {
  PlanTierSchema,
  PlanStatusSchema,
  OverageStrategySchema,
  PLAN_DEFINITIONS,
  PLAN_ORDER,
  ENABLED_PLAN_ORDER,
  GAMIFICATION_TEMPLATE_TYPES,
  SOCIAL_PROOF_TEMPLATE_TYPES,
  FEATURE_METADATA,
  FEATURE_CATEGORY_CONFIG,
  getFeaturesByCategory,
  getMinimumPlanForFeature,
  getFeatureName,
  getFeatureDescription,
} from "~/domains/billing/types/plan";

describe("PlanTierSchema", () => {
  it("should validate valid plan tiers", () => {
    expect(PlanTierSchema.safeParse("FREE").success).toBe(true);
    expect(PlanTierSchema.safeParse("STARTER").success).toBe(true);
    expect(PlanTierSchema.safeParse("GROWTH").success).toBe(true);
    expect(PlanTierSchema.safeParse("PRO").success).toBe(true);
    expect(PlanTierSchema.safeParse("ENTERPRISE").success).toBe(true);
  });

  it("should reject invalid plan tiers", () => {
    expect(PlanTierSchema.safeParse("INVALID").success).toBe(false);
    expect(PlanTierSchema.safeParse("").success).toBe(false);
  });
});

describe("PlanStatusSchema", () => {
  it("should validate valid statuses", () => {
    expect(PlanStatusSchema.safeParse("TRIALING").success).toBe(true);
    expect(PlanStatusSchema.safeParse("ACTIVE").success).toBe(true);
    expect(PlanStatusSchema.safeParse("PAST_DUE").success).toBe(true);
    expect(PlanStatusSchema.safeParse("CANCELLED").success).toBe(true);
  });
});

describe("OverageStrategySchema", () => {
  it("should validate valid strategies", () => {
    expect(OverageStrategySchema.safeParse("HARD_BLOCK").success).toBe(true);
    expect(OverageStrategySchema.safeParse("SOFT_BLOCK").success).toBe(true);
    expect(OverageStrategySchema.safeParse("NOTIFY_ONLY").success).toBe(true);
  });
});

describe("PLAN_DEFINITIONS", () => {
  it("should have all plan tiers defined", () => {
    expect(PLAN_DEFINITIONS.FREE).toBeDefined();
    expect(PLAN_DEFINITIONS.STARTER).toBeDefined();
    expect(PLAN_DEFINITIONS.GROWTH).toBeDefined();
    expect(PLAN_DEFINITIONS.PRO).toBeDefined();
    expect(PLAN_DEFINITIONS.ENTERPRISE).toBeDefined();
  });

  it("should have increasing prices", () => {
    expect(PLAN_DEFINITIONS.FREE.price).toBe(0);
    expect(PLAN_DEFINITIONS.STARTER.price).toBeLessThan(PLAN_DEFINITIONS.GROWTH.price);
    expect(PLAN_DEFINITIONS.GROWTH.price).toBeLessThan(PLAN_DEFINITIONS.PRO.price);
    expect(PLAN_DEFINITIONS.PRO.price).toBeLessThan(PLAN_DEFINITIONS.ENTERPRISE.price);
  });

  it("should have increasing impression caps", () => {
    expect(PLAN_DEFINITIONS.FREE.monthlyImpressionCap).toBeLessThan(
      PLAN_DEFINITIONS.STARTER.monthlyImpressionCap!
    );
    expect(PLAN_DEFINITIONS.STARTER.monthlyImpressionCap).toBeLessThan(
      PLAN_DEFINITIONS.GROWTH.monthlyImpressionCap!
    );
  });
});

describe("PLAN_ORDER", () => {
  it("should have 5 plans in order", () => {
    expect(PLAN_ORDER).toHaveLength(5);
    expect(PLAN_ORDER[0]).toBe("FREE");
    expect(PLAN_ORDER[4]).toBe("ENTERPRISE");
  });
});

describe("ENABLED_PLAN_ORDER", () => {
  it("should only include enabled plans", () => {
    for (const tier of ENABLED_PLAN_ORDER) {
      expect(PLAN_DEFINITIONS[tier].isEnabled).toBe(true);
    }
  });
});

describe("Template Type Constants", () => {
  it("should have gamification template types", () => {
    expect(GAMIFICATION_TEMPLATE_TYPES).toContain("SPIN_TO_WIN");
    expect(GAMIFICATION_TEMPLATE_TYPES).toContain("SCRATCH_CARD");
  });

  it("should have social proof template types", () => {
    expect(SOCIAL_PROOF_TEMPLATE_TYPES).toContain("SOCIAL_PROOF");
  });
});

describe("FEATURE_METADATA", () => {
  it("should have metadata for all features", () => {
    expect(FEATURE_METADATA.experiments).toBeDefined();
    expect(FEATURE_METADATA.advancedTargeting).toBeDefined();
    expect(FEATURE_METADATA.customTemplates).toBeDefined();
  });

  it("should have valid categories", () => {
    for (const meta of Object.values(FEATURE_METADATA)) {
      expect(["core", "templates", "customization", "advanced"]).toContain(meta.category);
    }
  });
});

describe("getFeaturesByCategory", () => {
  it("should return categories in order", () => {
    const categories = getFeaturesByCategory();
    expect(categories[0].category).toBe("core");
    expect(categories[1].category).toBe("templates");
  });

  it("should include features in each category", () => {
    const categories = getFeaturesByCategory();
    for (const cat of categories) {
      expect(cat.features.length).toBeGreaterThan(0);
    }
  });
});

describe("getMinimumPlanForFeature", () => {
  it("should return GROWTH for experiments", () => {
    expect(getMinimumPlanForFeature("experiments")).toBe("GROWTH");
  });

  it("should return STARTER for customTemplates", () => {
    expect(getMinimumPlanForFeature("customTemplates")).toBe("STARTER");
  });
});

describe("getFeatureName", () => {
  it("should return feature display name", () => {
    expect(getFeatureName("experiments")).toBe("A/B Testing");
    expect(getFeatureName("removeBranding")).toBe("Remove Branding");
  });
});

describe("getFeatureDescription", () => {
  it("should return feature description", () => {
    expect(getFeatureDescription("experiments")).toContain("A/B tests");
  });
});

