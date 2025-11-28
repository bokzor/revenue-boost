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
      customCss: true,
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
