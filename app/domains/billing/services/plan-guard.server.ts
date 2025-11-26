import prisma, { Prisma } from "~/db.server";
import {
  PLAN_DEFINITIONS,
  GAMIFICATION_TEMPLATE_TYPES,
  SOCIAL_PROOF_TEMPLATE_TYPES,
  type PlanTier,
  type PlanFeatures,
  type PlanLimits,
  type OverageStrategy,
} from "../types/plan";
import { PlanLimitError } from "../errors";

export interface PlanContext {
  planTier: PlanTier;
  planStatus: string;
  definition: {
    name: string;
    price: number;
    monthlyImpressionCap: number | null;
    overageStrategy: OverageStrategy;
    limits: PlanLimits;
    features: PlanFeatures;
  };
  isActive: boolean;
}

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number | null;
  strategy: OverageStrategy;
  isInGracePeriod?: boolean;
  gracePeriodEndsAt?: Date;
  warningMessage?: string;
}

export class PlanGuardService {
  /**
   * Get the plan context for a store, including validation of subscription status
   */
  static async getPlanContext(storeId: string): Promise<PlanContext> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        planTier: true,
        planStatus: true,
        shopifySubscriptionStatus: true,
      },
    });

    if (!store) {
      throw new Error(`Store not found: ${storeId}`);
    }

    const planTier = store.planTier as PlanTier;
    const planDefinition = PLAN_DEFINITIONS[planTier];

    // Check if subscription is actually active
    const isActive =
      store.planStatus === "ACTIVE" ||
      store.planStatus === "TRIALING" ||
      planTier === "FREE"; // FREE is always "active"

    return {
      planTier,
      planStatus: store.planStatus,
      definition: planDefinition,
      isActive,
    };
  }

  /**
   * Check if a feature is available (without throwing)
   */
  static async canAccessFeature(storeId: string, feature: keyof PlanFeatures): Promise<boolean> {
    try {
      const { definition, isActive } = await this.getPlanContext(storeId);
      return isActive && definition.features[feature];
    } catch {
      return false;
    }
  }

  /** Ensure a given feature flag is enabled on the store's current plan. */
  static async assertFeatureEnabled(storeId: string, feature: keyof PlanFeatures) {
    const { planTier, definition, isActive } = await this.getPlanContext(storeId);

    if (!isActive) {
      throw new PlanLimitError(`Your subscription is not active. Please update your billing.`, {
        feature,
        planTier,
        reason: "subscription_inactive",
      });
    }

    if (!definition.features[feature]) {
      throw new PlanLimitError(`${definition.name} plan does not include ${feature}.`, {
        feature,
        planTier,
        upgradeTo: this.getMinimumPlanForFeature(feature),
      });
    }
  }

  /**
   * Assert that custom CSS is available for the store's plan.
   * Custom CSS is only available on Growth plan and above.
   */
  static async assertCanUseCustomCss(storeId: string) {
    return this.assertFeatureEnabled(storeId, "customCss");
  }

  /**
   * Get the minimum plan tier required for a feature
   */
  static getMinimumPlanForFeature(feature: keyof PlanFeatures): PlanTier | null {
    const tiers: PlanTier[] = ["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"];
    for (const tier of tiers) {
      if (PLAN_DEFINITIONS[tier].features[feature]) {
        return tier;
      }
    }
    return null;
  }

  static async assertCanCreateCampaign(storeId: string) {
    const { planTier, definition } = await this.getPlanContext(storeId);
    const limit = definition.limits.maxActiveCampaigns;

    if (limit === null) return; // Unlimited

    const activeCampaignsCount = await prisma.campaign.count({
      where: {
        storeId,
        status: "ACTIVE",
      },
    });

    if (activeCampaignsCount >= limit) {
      throw new PlanLimitError(
        `Plan limit reached: You can only have ${limit} active campaign(s) on the ${definition.name} plan.`,
        {
          limitType: "maxActiveCampaigns",
          current: activeCampaignsCount,
          max: limit,
          planTier,
        }
      );
    }
  }

  static async assertCanCreateExperiment(storeId: string) {
    const { planTier, definition } = await this.getPlanContext(storeId);

    if (!definition.features.experiments) {
      throw new PlanLimitError(`Experiments are not available on the ${definition.name} plan.`, {
        feature: "experiments",
        planTier,
      });
    }

    const limit = definition.limits.maxExperiments;
    if (limit === null) return; // Unlimited

    const activeExperimentsCount = await prisma.experiment.count({
      where: {
        storeId,
        status: { in: ["RUNNING", "DRAFT"] }, // Count drafts too
      },
    });

    if (activeExperimentsCount >= limit) {
      throw new PlanLimitError(
        `Plan limit reached: You can only have ${limit} experiment(s) on the ${definition.name} plan.`,
        {
          limitType: "maxExperiments",
          current: activeExperimentsCount,
          max: limit,
          planTier,
        }
      );
    }
  }

  static async assertCanAddVariant(storeId: string, experimentId: string) {
    const { planTier, definition } = await this.getPlanContext(storeId);
    const limit = definition.limits.maxVariantsPerExperiment;

    const currentVariantsCount = await prisma.campaign.count({
      where: {
        storeId,
        experimentId,
      },
    });

    if (currentVariantsCount >= limit) {
      throw new PlanLimitError(
        `Plan limit reached: You can only have ${limit} variants per experiment on the ${definition.name} plan.`,
        {
          limitType: "maxVariantsPerExperiment",
          current: currentVariantsCount,
          max: limit,
          planTier,
        }
      );
    }
  }

  /** Hard cap on number of custom (store-owned) templates. */
  static async assertCanCreateCustomTemplate(storeId: string) {
    const { planTier, definition } = await this.getPlanContext(storeId);
    const limit = definition.limits.maxCustomTemplates;
    if (limit === null) return; // Unlimited

    const current = await prisma.template.count({
      where: { storeId, isDefault: false },
    });

    if (current >= limit) {
      throw new PlanLimitError(
        `Plan limit reached: You can only have ${limit} custom template(s) on the ${definition.name} plan.`,
        {
          limitType: "maxCustomTemplates",
          current,
          max: limit,
          planTier,
        }
      );
    }
  }

  /** Ensure the store is still within its monthly impression cap (VIEW events). */
  static async assertWithinMonthlyImpressionCap(storeId: string) {
    const { planTier, definition } = await this.getPlanContext(storeId);
    const cap = definition.monthlyImpressionCap;
    if (cap == null) return; // Unlimited impressions

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const current = await prisma.popupEvent.count({
      where: {
        storeId,
        eventType: "VIEW",
        createdAt: { gte: startOfMonth },
      },
    });

    if (current >= cap) {
      throw new PlanLimitError(
        `Plan limit reached: You have hit your monthly impression cap (${cap.toLocaleString()}) on the ${definition.name} plan.`,
        {
          limitType: "monthlyImpressionCap",
          current,
          max: cap,
          planTier,
        }
      );
    }
  }

  // ===========================================================================
  // TEMPLATE TYPE GATING
  // ===========================================================================

  /**
   * Check if a template type is available on the store's plan.
   * Gamification templates (Spin-to-Win, Scratch Card) require Growth+
   * Social proof templates require Starter+
   */
  static async canUseTemplateType(storeId: string, templateType: string): Promise<boolean> {
    const { definition, isActive } = await this.getPlanContext(storeId);
    if (!isActive) return false;

    // Check if it's a gamification template
    if ((GAMIFICATION_TEMPLATE_TYPES as readonly string[]).includes(templateType)) {
      return definition.features.gamificationTemplates;
    }

    // Check if it's a social proof template
    if ((SOCIAL_PROOF_TEMPLATE_TYPES as readonly string[]).includes(templateType)) {
      return definition.features.socialProofTemplates;
    }

    // All other templates are available on all plans
    return true;
  }

  /**
   * Assert that a template type can be used (throws if not allowed)
   */
  static async assertCanUseTemplateType(storeId: string, templateType: string) {
    const { planTier, definition, isActive } = await this.getPlanContext(storeId);

    if (!isActive) {
      throw new PlanLimitError(`Your subscription is not active.`, {
        feature: "templateType",
        templateType,
        planTier,
        reason: "subscription_inactive",
      });
    }

    // Check gamification templates
    if ((GAMIFICATION_TEMPLATE_TYPES as readonly string[]).includes(templateType)) {
      if (!definition.features.gamificationTemplates) {
        throw new PlanLimitError(
          `${templateType.replace(/_/g, " ")} templates require the Growth plan or higher.`,
          {
            feature: "gamificationTemplates",
            templateType,
            planTier,
            upgradeTo: "GROWTH",
          }
        );
      }
    }

    // Check social proof templates
    if ((SOCIAL_PROOF_TEMPLATE_TYPES as readonly string[]).includes(templateType)) {
      if (!definition.features.socialProofTemplates) {
        throw new PlanLimitError(
          `Social proof templates require the Starter plan or higher.`,
          {
            feature: "socialProofTemplates",
            templateType,
            planTier,
            upgradeTo: "STARTER",
          }
        );
      }
    }
  }

  // ===========================================================================
  // USAGE-BASED LIMITS WITH OVERAGE STRATEGY
  // ===========================================================================

  /**
   * Check monthly lead capture limit with overage strategy
   * Returns detailed info about the limit status instead of throwing
   */
  static async checkLeadLimit(storeId: string): Promise<LimitCheckResult> {
    const { definition } = await this.getPlanContext(storeId);
    const limit = definition.limits.maxLeadsPerMonth;

    if (limit === null) {
      return { allowed: true, current: 0, max: null, strategy: definition.overageStrategy };
    }

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const current = await prisma.popupEvent.count({
      where: {
        storeId,
        eventType: "SUBMIT",
        createdAt: { gte: startOfMonth },
      },
    });

    const result: LimitCheckResult = {
      allowed: current < limit,
      current,
      max: limit,
      strategy: definition.overageStrategy,
    };

    // Apply overage strategy
    if (current >= limit) {
      switch (definition.overageStrategy) {
        case "HARD_BLOCK":
          result.allowed = false;
          break;
        case "SOFT_BLOCK": {
          // Allow 3-day grace period after hitting limit
          const gracePeriodDays = 3;
          const gracePeriodEnd = new Date();
          gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays);
          result.allowed = true;
          result.isInGracePeriod = true;
          result.gracePeriodEndsAt = gracePeriodEnd;
          result.warningMessage = `You've reached your monthly lead limit (${limit.toLocaleString()}). Upgrade to continue capturing leads after the grace period.`;
          break;
        }
        case "NOTIFY_ONLY":
          result.allowed = true;
          result.warningMessage = `You've exceeded your monthly lead limit (${limit.toLocaleString()}). Consider upgrading for more capacity.`;
          break;
      }
    } else if (current >= limit * 0.8) {
      // Warn at 80% usage
      result.warningMessage = `You're at ${Math.round((current / limit) * 100)}% of your monthly lead limit.`;
    }

    return result;
  }

  /**
   * Assert lead capture is allowed (with overage strategy applied)
   */
  static async assertCanCaptureLead(storeId: string) {
    const result = await this.checkLeadLimit(storeId);
    const { planTier } = await this.getPlanContext(storeId);

    if (!result.allowed) {
      throw new PlanLimitError(
        `Lead capture limit reached: You've captured ${result.current} leads this month (limit: ${result.max?.toLocaleString()}).`,
        {
          limitType: "maxLeadsPerMonth",
          current: result.current,
          max: result.max,
          planTier,
        }
      );
    }
  }

  /**
   * Check discount code generation limit
   */
  static async checkDiscountCodeLimit(storeId: string): Promise<LimitCheckResult> {
    const { definition } = await this.getPlanContext(storeId);
    const limit = definition.limits.maxDiscountCodesGenerated;

    if (limit === null) {
      return { allowed: true, current: 0, max: null, strategy: definition.overageStrategy };
    }

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    // Count discount codes generated this month (via campaign discounts)
    // Use Prisma.DbNull for JSON null comparison
    const current = await prisma.campaign.count({
      where: {
        storeId,
        NOT: { discountConfig: { equals: Prisma.DbNull } },
        createdAt: { gte: startOfMonth },
      },
    });

    return {
      allowed: current < limit,
      current,
      max: limit,
      strategy: definition.overageStrategy,
    };
  }

  /**
   * Check if a discount percentage is allowed on the current plan
   */
  static async isDiscountPercentageAllowed(storeId: string, percentage: number): Promise<boolean> {
    const { definition } = await this.getPlanContext(storeId);
    const maxPercentage = definition.limits.maxDiscountPercentage;

    if (maxPercentage === null) return true; // Unlimited
    return percentage <= maxPercentage;
  }

  /**
   * Assert discount percentage is within plan limits
   */
  static async assertDiscountPercentageAllowed(storeId: string, percentage: number) {
    const { planTier, definition } = await this.getPlanContext(storeId);
    const maxPercentage = definition.limits.maxDiscountPercentage;

    if (maxPercentage !== null && percentage > maxPercentage) {
      throw new PlanLimitError(
        `Discount percentage ${percentage}% exceeds your plan limit of ${maxPercentage}%. Upgrade to offer higher discounts.`,
        {
          limitType: "maxDiscountPercentage",
          requested: percentage,
          max: maxPercentage,
          planTier,
          upgradeTo: this.getMinimumPlanForDiscountPercentage(percentage),
        }
      );
    }
  }

  /**
   * Get minimum plan for a given discount percentage
   */
  private static getMinimumPlanForDiscountPercentage(percentage: number): PlanTier {
    const tiers: PlanTier[] = ["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"];
    for (const tier of tiers) {
      const limit = PLAN_DEFINITIONS[tier].limits.maxDiscountPercentage;
      if (limit === null || percentage <= limit) {
        return tier;
      }
    }
    return "ENTERPRISE";
  }

  // ===========================================================================
  // SCHEDULED CAMPAIGNS
  // ===========================================================================

  /**
   * Check if scheduled campaigns feature is available
   */
  static async canUseScheduledCampaigns(storeId: string): Promise<boolean> {
    return this.canAccessFeature(storeId, "scheduledCampaigns");
  }

  /**
   * Assert scheduled campaigns feature is available
   */
  static async assertCanUseScheduledCampaigns(storeId: string) {
    return this.assertFeatureEnabled(storeId, "scheduledCampaigns");
  }

  // ===========================================================================
  // API ACCESS
  // ===========================================================================

  // ===========================================================================
  // USAGE SUMMARY
  // ===========================================================================

  /**
   * Get a comprehensive usage summary for the store
   */
  static async getUsageSummary(storeId: string) {
    const context = await this.getPlanContext(storeId);
    const { limits } = context.definition;

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const [impressions, leads, activeCampaigns, experiments] = await Promise.all([
      prisma.popupEvent.count({
        where: { storeId, eventType: "VIEW", createdAt: { gte: startOfMonth } },
      }),
      prisma.popupEvent.count({
        where: { storeId, eventType: "SUBMIT", createdAt: { gte: startOfMonth } },
      }),
      prisma.campaign.count({
        where: { storeId, status: "ACTIVE" },
      }),
      prisma.experiment.count({
        where: { storeId, status: { in: ["RUNNING", "DRAFT"] } },
      }),
    ]);

    return {
      plan: context.planTier,
      planName: context.definition.name,
      overageStrategy: context.definition.overageStrategy,
      usage: {
        impressions: {
          current: impressions,
          max: context.definition.monthlyImpressionCap,
          percentage: context.definition.monthlyImpressionCap
            ? Math.round((impressions / context.definition.monthlyImpressionCap) * 100)
            : null,
        },
        leads: {
          current: leads,
          max: limits.maxLeadsPerMonth,
          percentage: limits.maxLeadsPerMonth
            ? Math.round((leads / limits.maxLeadsPerMonth) * 100)
            : null,
        },
        activeCampaigns: {
          current: activeCampaigns,
          max: limits.maxActiveCampaigns,
        },
        experiments: {
          current: experiments,
          max: limits.maxExperiments,
        },
      },
    };
  }
}
