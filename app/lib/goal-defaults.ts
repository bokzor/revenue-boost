import type { CampaignGoal } from "@prisma/client";

/**
 * Simplified goal-based default configurations
 *
 * NOTE: Triggers, audience targeting, and frequency capping are now handled by templates.
 * This file only contains goal-specific settings like discounts, design preferences,
 * campaign priority, and template recommendations.
 *
 * See: app/lib/template-trigger-converter.ts for trigger conversion logic
 * See: prisma/templates-data.json for template definitions (database-first approach)
 */

export interface GoalDefaults {
  discount?: {
    enabled: boolean;
    type: "percentage" | "fixed";
    value: number;
    deliveryMode: "auto_apply_only" | "show_code_fallback" | "show_code_always";
    prefix: string;
    expiryDays: number;
    singleUse: boolean;
  };

  design: {
    size: "small" | "medium" | "large" | "fullscreen";
    style: "minimal" | "bold" | "elegant" | "playful";
    urgencyLevel: "none" | "low" | "medium" | "high";
  };

  campaign: {
    priority: number;
    status: "DRAFT" | "ACTIVE";
  };

  templates: {
    recommended: string[];
    categories: string[];
  };
}

export const GOAL_DEFAULTS: Record<CampaignGoal, GoalDefaults> = {
  NEWSLETTER_SIGNUP: {
    discount: {
      enabled: true,
      type: "percentage",
      value: 10,
      deliveryMode: "show_code_fallback",
      prefix: "WELCOME",
      expiryDays: 14,
      singleUse: true,
    },
    design: {
      size: "medium",
      style: "minimal",
      urgencyLevel: "low",
    },
    campaign: {
      priority: 8,
      status: "DRAFT",
    },
    templates: {
      recommended: ["newsletter"],
      categories: ["newsletter", "exit-intent"],
    },
  },

  INCREASE_REVENUE: {
    discount: {
      enabled: true,
      type: "percentage",
      value: 20,
      deliveryMode: "auto_apply_only",
      prefix: "SALE",
      expiryDays: 2,
      singleUse: false,
    },
    design: {
      size: "large",
      style: "bold",
      urgencyLevel: "high",
    },
    campaign: {
      priority: 10,
      status: "DRAFT",
    },
    templates: {
      recommended: [
        "flash-sale-modal",
        "countdown-timer-banner",
        "product-recommendation",
        "cart_upsell",
      ],
      categories: ["sales", "product-recommendation"],
    },
  },

  ENGAGEMENT: {
    discount: {
      enabled: false,
      type: "percentage",
      value: 5,
      deliveryMode: "show_code_fallback",
      prefix: "ENGAGE",
      expiryDays: 7,
      singleUse: false,
    },
    design: {
      size: "medium",
      style: "playful",
      urgencyLevel: "none",
    },
    campaign: {
      priority: 5,
      status: "DRAFT",
    },
    templates: {
      recommended: [
        "lottery-spin",
        "scratch-card",
        "announcement-slide",
        "social-proof-notification",
      ],
      categories: ["gamification", "announcement", "social-proof"],
    },
  },
};

/**
 * Get default configuration for a specific goal
 */
export function getGoalDefaults(goal: CampaignGoal): GoalDefaults {
  return GOAL_DEFAULTS[goal] || GOAL_DEFAULTS.NEWSLETTER_SIGNUP;
}
