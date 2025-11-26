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
  apiAccess: z.boolean(), // API access for integrations
});
export type PlanFeatures = z.infer<typeof PlanFeaturesSchema>;

export const PlanDefinitionSchema = z.object({
  name: z.string(),
  price: z.number(),
  monthlyImpressionCap: z.number().nullable(),
  overageStrategy: OverageStrategySchema,
  limits: PlanLimitsSchema,
  features: PlanFeaturesSchema,
});
export type PlanDefinition = z.infer<typeof PlanDefinitionSchema>;

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  FREE: {
    name: "Free",
    price: 0,
    monthlyImpressionCap: 5000,
    overageStrategy: "HARD_BLOCK",
    limits: {
      maxActiveCampaigns: 1,
      maxExperiments: 0,
      maxVariantsPerExperiment: 0,
      maxCustomTemplates: 0,
      maxLeadsPerMonth: 100,
      maxDiscountCodesGenerated: 10,
      maxDiscountPercentage: 10, // Max 10% discount
    },
    features: {
      experiments: false,
      advancedTargeting: false,
      customTemplates: false,
      advancedAnalytics: false,
      prioritySupport: false,
      removeBranding: false,
      customCss: false,
      gamificationTemplates: false, // No Spin-to-Win, Scratch Card on Free
      socialProofTemplates: false, // No FOMO templates on Free
      scheduledCampaigns: false,
      apiAccess: false,
    },
  },
  STARTER: {
    name: "Starter",
    price: 9,
    monthlyImpressionCap: 25000,
    overageStrategy: "SOFT_BLOCK", // 3-day grace period
    limits: {
      maxActiveCampaigns: 3,
      maxExperiments: 0,
      maxVariantsPerExperiment: 0,
      maxCustomTemplates: 1,
      maxLeadsPerMonth: 500,
      maxDiscountCodesGenerated: 50,
      maxDiscountPercentage: 25,
    },
    features: {
      experiments: false,
      advancedTargeting: true,
      customTemplates: true,
      advancedAnalytics: true, // Moved from Growth to strengthen Starter value
      prioritySupport: false,
      removeBranding: true,
      customCss: false,
      gamificationTemplates: false, // Still gated to Growth+
      socialProofTemplates: true, // FOMO available on Starter
      scheduledCampaigns: true, // Scheduled campaigns on Starter
      apiAccess: false,
    },
  },
  GROWTH: {
    name: "Growth",
    price: 29,
    monthlyImpressionCap: 100000,
    overageStrategy: "SOFT_BLOCK",
    limits: {
      maxActiveCampaigns: null, // Unlimited
      maxExperiments: 5,
      maxVariantsPerExperiment: 2,
      maxCustomTemplates: 5,
      maxLeadsPerMonth: 2500,
      maxDiscountCodesGenerated: 250,
      maxDiscountPercentage: null, // Unlimited
    },
    features: {
      experiments: true,
      advancedTargeting: true,
      customTemplates: true,
      advancedAnalytics: true,
      prioritySupport: true,
      removeBranding: true,
      customCss: true,
      gamificationTemplates: true, // Spin-to-Win, Scratch Card unlocked
      socialProofTemplates: true,
      scheduledCampaigns: true,
      apiAccess: false,
    },
  },
  PRO: {
    name: "Pro",
    price: 79,
    monthlyImpressionCap: 400000,
    overageStrategy: "NOTIFY_ONLY", // Just email, don't block
    limits: {
      maxActiveCampaigns: null,
      maxExperiments: null, // Unlimited
      maxVariantsPerExperiment: 4,
      maxCustomTemplates: null, // Unlimited
      maxLeadsPerMonth: 10000,
      maxDiscountCodesGenerated: null, // Unlimited
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
      apiAccess: true, // API access on Pro+
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 149, // Starting price
    monthlyImpressionCap: null, // Unlimited
    overageStrategy: "NOTIFY_ONLY",
    limits: {
      maxActiveCampaigns: null,
      maxExperiments: null,
      maxVariantsPerExperiment: 8,
      maxCustomTemplates: null,
      maxLeadsPerMonth: null, // Unlimited
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
      apiAccess: true,
    },
  },
};

export const PLAN_ORDER: PlanTier[] = ["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"];

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
