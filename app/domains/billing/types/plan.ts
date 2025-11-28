import { z } from "zod";

export const PlanTierSchema = z.enum(["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"]);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const PlanStatusSchema = z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED"]);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

// Overage strategy determines how limits are enforced when exceeded
export const OverageStrategySchema = z.enum([
  "HARD_BLOCK", // Immediately block when limit reached
  "SOFT_BLOCK", // Show warning, allow 3-day grace period
  "NOTIFY_ONLY", // Allow overage but send email notification
]);
export type OverageStrategy = z.infer<typeof OverageStrategySchema>;

export const PlanLimitsSchema = z.object({
  maxActiveCampaigns: z.number().nullable(), // null means unlimited
  maxExperiments: z.number().nullable(),
  maxVariantsPerExperiment: z.number(),
  maxCustomTemplates: z.number().nullable(),
  // Usage-based limits
  maxLeadsPerMonth: z.number().nullable(), // Email/form captures per month
  maxDiscountCodesGenerated: z.number().nullable(), // Auto-generated discount codes
  maxDiscountPercentage: z.number().nullable(), // Cap on discount value (e.g., 10 = max 10% off)
});
export type PlanLimits = z.infer<typeof PlanLimitsSchema>;

export const PlanFeaturesSchema = z.object({
  // Core features
  experiments: z.boolean(),
  advancedTargeting: z.boolean(),
  customTemplates: z.boolean(),
  advancedAnalytics: z.boolean(),
  prioritySupport: z.boolean(),
  removeBranding: z.boolean(), // Remove "Powered by Revenue Boost" badge
  customCss: z.boolean(), // Allow custom CSS styling for popups
  // Template-level gating (premium templates)
  gamificationTemplates: z.boolean(), // Spin-to-Win, Scratch Card, etc.
  socialProofTemplates: z.boolean(), // FOMO, Recent Sales, etc.
  // Advanced features
  scheduledCampaigns: z.boolean(), // Time-based campaign scheduling
});
export type PlanFeatures = z.infer<typeof PlanFeaturesSchema>;

export const PlanDefinitionSchema = z.object({
  name: z.string(),
  price: z.number(),
  monthlyImpressionCap: z.number().nullable(),
  overageStrategy: OverageStrategySchema,
  limits: PlanLimitsSchema,
  features: PlanFeaturesSchema,
  isEnabled: z.boolean().default(true), // Can be disabled without removing from code
});
export type PlanDefinition = z.infer<typeof PlanDefinitionSchema>;

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  FREE: {
    name: "Free",
    price: 0,
    monthlyImpressionCap: 5000,
    overageStrategy: "HARD_BLOCK",
    isEnabled: false, // Disabled for launch
    limits: {
      maxActiveCampaigns: 1,
      maxExperiments: 0,
      maxVariantsPerExperiment: 0,
      maxCustomTemplates: 0,
      maxLeadsPerMonth: 100,
      maxDiscountCodesGenerated: 10,
      maxDiscountPercentage: null,
    },
    features: {
      experiments: false,
      advancedTargeting: false,
      customTemplates: false,
      advancedAnalytics: false,
      prioritySupport: false,
      removeBranding: false,
      customCss: false,
      gamificationTemplates: false,
      socialProofTemplates: false,
      scheduledCampaigns: false,
    },
  },
  STARTER: {
    name: "Starter",
    price: 9,
    monthlyImpressionCap: 25000,
    overageStrategy: "SOFT_BLOCK",
    isEnabled: true,
    limits: {
      maxActiveCampaigns: 5,
      maxExperiments: 0,
      maxVariantsPerExperiment: 0,
      maxCustomTemplates: 1,
      maxLeadsPerMonth: 500,
      maxDiscountCodesGenerated: 50,
      maxDiscountPercentage: null,
    },
    features: {
      experiments: false,
      advancedTargeting: true,
      customTemplates: true,
      advancedAnalytics: true,
      prioritySupport: false,
      removeBranding: false, // Show "Powered by" branding on Starter plan
      customCss: false, // Custom CSS starts at Growth plan
      gamificationTemplates: false,
      socialProofTemplates: true,
      scheduledCampaigns: true,
    },
  },
  GROWTH: {
    name: "Growth",
    price: 29,
    monthlyImpressionCap: 100000,
    overageStrategy: "SOFT_BLOCK",
    isEnabled: true,
    limits: {
      maxActiveCampaigns: 15,
      maxExperiments: 5,
      maxVariantsPerExperiment: 2,
      maxCustomTemplates: 5,
      maxLeadsPerMonth: 2500,
      maxDiscountCodesGenerated: 250,
      maxDiscountPercentage: null,
    },
    features: {
      experiments: true,
      advancedTargeting: true,
      customTemplates: true,
      advancedAnalytics: true,
      prioritySupport: true,
      removeBranding: true,
      customCss: true,
      gamificationTemplates: true,
      socialProofTemplates: true,
      scheduledCampaigns: true,
    },
  },
  PRO: {
    name: "Pro",
    price: 79,
    monthlyImpressionCap: 400000,
    overageStrategy: "NOTIFY_ONLY",
    isEnabled: true,
    limits: {
      maxActiveCampaigns: null,
      maxExperiments: null,
      maxVariantsPerExperiment: 4,
      maxCustomTemplates: null,
      maxLeadsPerMonth: 10000,
      maxDiscountCodesGenerated: null,
      maxDiscountPercentage: null,
    },
    features: {
      experiments: true,
      advancedTargeting: true,
      customTemplates: true,
      advancedAnalytics: true,
      prioritySupport: true,
      removeBranding: true,
      customCss: true,
      gamificationTemplates: true,
      socialProofTemplates: true,
      scheduledCampaigns: true,
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 149,
    monthlyImpressionCap: 1000000,
    overageStrategy: "NOTIFY_ONLY",
    isEnabled: false, // Disabled for launch
    limits: {
      maxActiveCampaigns: null,
      maxExperiments: null,
      maxVariantsPerExperiment: 8,
      maxCustomTemplates: null,
      maxLeadsPerMonth: null,
      maxDiscountCodesGenerated: null,
      maxDiscountPercentage: null,
    },
    features: {
      experiments: true,
      advancedTargeting: true,
      customTemplates: true,
      advancedAnalytics: true,
      prioritySupport: true,
      removeBranding: true,
      customCss: true,
      gamificationTemplates: true,
      socialProofTemplates: true,
      scheduledCampaigns: true,
    },
  },
};

export const PLAN_ORDER: PlanTier[] = ["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"];

// Only enabled plans for UI display
export const ENABLED_PLAN_ORDER: PlanTier[] = PLAN_ORDER.filter(
  (tier) => PLAN_DEFINITIONS[tier].isEnabled
);

// Helper to check if a template type requires gamification feature
export const GAMIFICATION_TEMPLATE_TYPES = [
  "SPIN_TO_WIN",
  "SCRATCH_CARD",
  "PICK_A_GIFT",
] as const;

// Helper to check if a template type requires social proof feature
export const SOCIAL_PROOF_TEMPLATE_TYPES = [
  "SOCIAL_PROOF",
  "RECENT_SALES",
  "LIVE_VISITOR_COUNT",
  "LOW_STOCK_ALERT",
] as const;

// =============================================================================
// FEATURE METADATA - Single Source of Truth
// =============================================================================

/**
 * Feature category for organizing features in the UI
 */
export type FeatureCategory = "core" | "templates" | "customization" | "advanced";

/**
 * Complete metadata for a single feature
 * This is the single source of truth for feature display across the app
 */
export interface FeatureMetadata {
  /** Display name shown in UI */
  name: string;
  /** Short description for tooltips and upgrade prompts */
  description: string;
  /** Category for grouping in feature comparison tables */
  category: FeatureCategory;
  /** Order within category (lower = higher priority) */
  order: number;
}

/**
 * Single source of truth for all feature metadata
 * Used by: billing page, upgrade banners, feature gates, plan comparison
 */
export const FEATURE_METADATA: Record<keyof PlanFeatures, FeatureMetadata> = {
  // Core Features
  advancedTargeting: {
    name: "Advanced Targeting",
    description: "Target visitors by location, device, behavior, and custom rules",
    category: "core",
    order: 1,
  },
  advancedAnalytics: {
    name: "Advanced Analytics",
    description: "Detailed conversion funnels, heatmaps, and performance insights",
    category: "core",
    order: 2,
  },
  scheduledCampaigns: {
    name: "Scheduled Campaigns",
    description: "Schedule campaigns to start and stop at specific times",
    category: "core",
    order: 3,
  },

  // Templates
  customTemplates: {
    name: "Custom Templates",
    description: "Create and save your own popup templates for reuse",
    category: "templates",
    order: 1,
  },
  gamificationTemplates: {
    name: "Gamification",
    description: "Spin-to-Win, Scratch Cards, Pick-a-Gift interactive popups",
    category: "templates",
    order: 2,
  },
  socialProofTemplates: {
    name: "Social Proof & FOMO",
    description: "Recent sales, visitor counts, low stock alerts to drive urgency",
    category: "templates",
    order: 3,
  },

  // Customization
  removeBranding: {
    name: "Remove Branding",
    description: "Remove 'Powered by Revenue Boost' from your popups",
    category: "customization",
    order: 1,
  },
  customCss: {
    name: "Custom CSS",
    description: "Add custom CSS to fully customize popup appearance",
    category: "customization",
    order: 2,
  },

  // Advanced
  experiments: {
    name: "A/B Testing",
    description: "Run A/B tests to optimize popup performance and conversion rates",
    category: "advanced",
    order: 1,
  },
  prioritySupport: {
    name: "Priority Support",
    description: "Get faster responses and dedicated support via email and chat",
    category: "advanced",
    order: 2,
  },
};

/**
 * Category display configuration
 */
export const FEATURE_CATEGORY_CONFIG: Record<FeatureCategory, { name: string; order: number }> = {
  core: { name: "Core Features", order: 1 },
  templates: { name: "Templates", order: 2 },
  customization: { name: "Customization", order: 3 },
  advanced: { name: "Advanced", order: 4 },
};

/**
 * Get features organized by category for UI display
 * Returns categories with their features sorted by order
 */
export function getFeaturesByCategory(): Array<{
  category: FeatureCategory;
  name: string;
  features: Array<keyof PlanFeatures>;
}> {
  const categories = Object.entries(FEATURE_CATEGORY_CONFIG)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([category, config]) => ({
      category: category as FeatureCategory,
      name: config.name,
      features: (Object.entries(FEATURE_METADATA) as Array<[keyof PlanFeatures, FeatureMetadata]>)
        .filter(([, meta]) => meta.category === category)
        .sort(([, a], [, b]) => a.order - b.order)
        .map(([key]) => key),
    }));

  return categories;
}

/**
 * Get the minimum plan tier required for a feature
 * Checks ALL plans (including disabled ones) to ensure accurate gating
 */
export function getMinimumPlanForFeature(feature: keyof PlanFeatures): PlanTier | null {
  for (const tier of PLAN_ORDER) {
    if (PLAN_DEFINITIONS[tier].features[feature]) {
      return tier;
    }
  }
  return null;
}

/**
 * Get feature display name
 */
export function getFeatureName(feature: keyof PlanFeatures): string {
  return FEATURE_METADATA[feature].name;
}

/**
 * Get feature description
 */
export function getFeatureDescription(feature: keyof PlanFeatures): string {
  return FEATURE_METADATA[feature].description;
}
