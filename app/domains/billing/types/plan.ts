import { z } from "zod";

export const PlanTierSchema = z.enum(["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"]);
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const PlanStatusSchema = z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED"]);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

export const PlanLimitsSchema = z.object({
  maxActiveCampaigns: z.number().nullable(), // null means unlimited
  maxExperiments: z.number().nullable(),
  maxVariantsPerExperiment: z.number(),
  maxCustomTemplates: z.number().nullable(),
});
export type PlanLimits = z.infer<typeof PlanLimitsSchema>;

export const PlanFeaturesSchema = z.object({
  experiments: z.boolean(),
  advancedTargeting: z.boolean(),
  customTemplates: z.boolean(),
  advancedAnalytics: z.boolean(),
  prioritySupport: z.boolean(),
  removeBranding: z.boolean(), // Remove "Powered by Revenue Boost" badge
});
export type PlanFeatures = z.infer<typeof PlanFeaturesSchema>;

export const PlanDefinitionSchema = z.object({
  name: z.string(),
  price: z.number(),
  monthlyImpressionCap: z.number().nullable(),
  limits: PlanLimitsSchema,
  features: PlanFeaturesSchema,
});
export type PlanDefinition = z.infer<typeof PlanDefinitionSchema>;

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  FREE: {
    name: "Free",
    price: 0,
    monthlyImpressionCap: 5000,
    limits: {
      maxActiveCampaigns: 1,
      maxExperiments: 0,
      maxVariantsPerExperiment: 0,
      maxCustomTemplates: 0,
    },
    features: {
      experiments: false,
      advancedTargeting: false,
      customTemplates: false,
      advancedAnalytics: false,
      prioritySupport: false,
      removeBranding: false, // Shows "Powered by Revenue Boost"
    },
  },
  STARTER: {
    name: "Starter",
    price: 9,
    monthlyImpressionCap: 25000,
    limits: {
      maxActiveCampaigns: null,
      maxExperiments: 0,
      maxVariantsPerExperiment: 0,
      maxCustomTemplates: 1,
    },
    features: {
      experiments: false,
      advancedTargeting: true,
      customTemplates: true,
      advancedAnalytics: false,
      prioritySupport: false,
      removeBranding: true,
    },
  },
  GROWTH: {
    name: "Growth",
    price: 29,
    monthlyImpressionCap: 100000,
    limits: {
      maxActiveCampaigns: null,
      maxExperiments: 5,
      maxVariantsPerExperiment: 2,
      maxCustomTemplates: 5,
    },
    features: {
      experiments: true,
      advancedTargeting: true,
      customTemplates: true,
      advancedAnalytics: true,
      prioritySupport: true,
      removeBranding: true,
    },
  },
  PRO: {
    name: "Pro",
    price: 79,
    monthlyImpressionCap: 400000,
    limits: {
      maxActiveCampaigns: null,
      maxExperiments: null,
      maxVariantsPerExperiment: 4,
      maxCustomTemplates: null,
    },
    features: {
      experiments: true,
      advancedTargeting: true,
      customTemplates: true,
      advancedAnalytics: true,
      prioritySupport: true,
      removeBranding: true,
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 149, // Starting price
    monthlyImpressionCap: null, // > 400k
    limits: {
      maxActiveCampaigns: null,
      maxExperiments: null,
      maxVariantsPerExperiment: 8,
      maxCustomTemplates: null,
    },
    features: {
      experiments: true,
      advancedTargeting: true,
      customTemplates: true,
      advancedAnalytics: true,
      prioritySupport: true,
      removeBranding: true,
    },
  },
};

export const PLAN_ORDER: PlanTier[] = ["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"];
