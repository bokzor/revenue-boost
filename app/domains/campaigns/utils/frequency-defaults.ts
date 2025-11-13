/**
 * Template-Specific Frequency Capping Defaults
 *
 * Provides sensible default frequency capping configurations based on template type.
 * These defaults balance user experience with conversion optimization.
 */

import type { TemplateType } from "../types/campaign";

export interface FrequencyCappingDefaults {
  enabled: boolean;
  maxViews: number;
  timeWindow: number; // hours
  respectGlobalCap: boolean;
  cooldownHours: number;
  helpText: string;
  enhancedTriggers?: {
    frequency_capping?: {
      max_triggers_per_session?: number;
      max_triggers_per_day?: number;
      cooldown_between_triggers?: number; // seconds
    };
  };
}

/**
 * Get default frequency capping configuration for a template type
 */
export function getFrequencyCappingDefaults(
  templateType: TemplateType
): FrequencyCappingDefaults {
  switch (templateType) {
    // Banner Templates - Persistent by nature
    case "FREE_SHIPPING":
      return {
        enabled: false, // No frequency cap - show until dismissed
        maxViews: 999,
        timeWindow: 24,
        respectGlobalCap: false,
        cooldownHours: 0,
        helpText:
          "✨ This banner appears on every page until dismissed by the customer. Perfect for persistent cart value tracking.",
        enhancedTriggers: {
          frequency_capping: {
            max_triggers_per_session: 999,
            max_triggers_per_day: 999,
            cooldown_between_triggers: 0,
          },
        },
      };

    case "ANNOUNCEMENT":
      return {
        enabled: true,
        maxViews: 3,
        timeWindow: 24,
        respectGlobalCap: true,
        cooldownHours: 1,
        helpText:
          "📢 Announcement shows up to 3 times per session to avoid being intrusive while ensuring visibility.",
        enhancedTriggers: {
          frequency_capping: {
            max_triggers_per_session: 3,
            max_triggers_per_day: 10,
            cooldown_between_triggers: 3600, // 1 hour
          },
        },
      };

    case "SOCIAL_PROOF":
      return {
        enabled: true,
        maxViews: 5,
        timeWindow: 24,
        respectGlobalCap: true,
        cooldownHours: 0.5,
        helpText:
          "👥 Social proof notifications appear up to 5 times per session. Subtle reminders without overwhelming customers.",
        enhancedTriggers: {
          frequency_capping: {
            max_triggers_per_session: 5,
            max_triggers_per_day: 20,
            cooldown_between_triggers: 1800, // 30 minutes
          },
        },
      };

    // Modal Templates - One-time by nature
    case "NEWSLETTER":
    case "EXIT_INTENT":
      return {
        enabled: true,
        maxViews: 1,
        timeWindow: 24,
        respectGlobalCap: true,
        cooldownHours: 24,
        helpText:
          "📧 This popup shows once per session to avoid disrupting the shopping experience. Maximizes conversion without annoyance.",
        enhancedTriggers: {
          frequency_capping: {
            max_triggers_per_session: 1,
            max_triggers_per_day: 1,
            cooldown_between_triggers: 86400, // 24 hours
          },
        },
      };

    case "SPIN_TO_WIN":
    case "SCRATCH_CARD":
      return {
        enabled: true,
        maxViews: 1,
        timeWindow: 168, // 7 days
        respectGlobalCap: true,
        cooldownHours: 168,
        helpText:
          "🎰 Gamification popup shows once per week. Keeps the experience special and prevents discount abuse.",
        enhancedTriggers: {
          frequency_capping: {
            max_triggers_per_session: 1,
            max_triggers_per_day: 1,
            cooldown_between_triggers: 604800, // 7 days
          },
        },
      };

    case "FLASH_SALE":
    case "PRODUCT_UPSELL":
      return {
        enabled: true,
        maxViews: 2,
        timeWindow: 24,
        respectGlobalCap: true,
        cooldownHours: 4,
        helpText:
          "⚡ This offer shows up to 2 times per session. Balances urgency with user experience.",
        enhancedTriggers: {
          frequency_capping: {
            max_triggers_per_session: 2,
            max_triggers_per_day: 5,
            cooldown_between_triggers: 14400, // 4 hours
          },
        },
      };

    case "CART_ABANDONMENT":
      return {
        enabled: true,
        maxViews: 3,
        timeWindow: 24,
        respectGlobalCap: true,
        cooldownHours: 2,
        helpText:
          "🛒 Cart recovery popup shows up to 3 times per session. Gentle reminders to complete purchase.",
        enhancedTriggers: {
          frequency_capping: {
            max_triggers_per_session: 3,
            max_triggers_per_day: 6,
            cooldown_between_triggers: 7200, // 2 hours
          },
        },
      };

    case "COUNTDOWN_TIMER":
      return {
        enabled: true,
        maxViews: 5,
        timeWindow: 24,
        respectGlobalCap: true,
        cooldownHours: 1,
        helpText:
          "⏰ Countdown timer shows up to 5 times per session. Creates urgency without overwhelming customers.",
        enhancedTriggers: {
          frequency_capping: {
            max_triggers_per_session: 5,
            max_triggers_per_day: 15,
            cooldown_between_triggers: 3600, // 1 hour
          },
        },
      };

    default:
      // Default conservative settings
      return {
        enabled: true,
        maxViews: 1,
        timeWindow: 24,
        respectGlobalCap: true,
        cooldownHours: 24,
        helpText:
          "Default frequency capping: Shows once per session. Customize based on your campaign goals.",
        enhancedTriggers: {
          frequency_capping: {
            max_triggers_per_session: 1,
            max_triggers_per_day: 3,
            cooldown_between_triggers: 86400, // 24 hours
          },
        },
      };
  }
}

/**
 * Get help text explaining the frequency capping behavior for a template type
 */
export function getFrequencyCappingHelpText(templateType: TemplateType): string {
  return getFrequencyCappingDefaults(templateType).helpText;
}

/**
 * Check if a template type should have frequency capping enabled by default
 */
export function shouldEnableFrequencyCapping(templateType: TemplateType): boolean {
  return getFrequencyCappingDefaults(templateType).enabled;
}

