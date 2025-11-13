/**
 * Template-Specific Frequency Capping Defaults
 *
 * Provides sensible default frequency capping configurations based on template type.
 * These defaults balance user experience with conversion optimization.
 *
 * Uses server format directly - single source of truth.
 */

import type { TemplateType } from "../types/campaign";

export interface FrequencyCappingDefaults {
  enabled: boolean; // UI-only field to toggle frequency capping on/off
  max_triggers_per_session?: number;
  max_triggers_per_day?: number;
  cooldown_between_triggers?: number; // in seconds
  respectGlobalCap: boolean;
  helpText: string;
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
        max_triggers_per_session: undefined, // Unlimited
        max_triggers_per_day: undefined, // Unlimited
        cooldown_between_triggers: undefined,
        respectGlobalCap: false, // Don't respect global caps - always show
        helpText:
          "✨ This banner appears on every page until dismissed by the customer. Perfect for persistent cart value tracking.",
      };

    case "ANNOUNCEMENT":
      return {
        enabled: true,
        max_triggers_per_session: 3,
        max_triggers_per_day: 10,
        cooldown_between_triggers: 3600, // 1 hour
        respectGlobalCap: false, // Don't respect global caps - persistent banner
        helpText:
          "📢 Announcement shows up to 3 times per session to avoid being intrusive while ensuring visibility.",
      };

    case "SOCIAL_PROOF":
      return {
        enabled: true,
        max_triggers_per_session: 5,
        max_triggers_per_day: 20,
        cooldown_between_triggers: 1800, // 30 minutes
        respectGlobalCap: true,
        helpText:
          "👥 Social proof notifications appear up to 5 times per session. Subtle reminders without overwhelming customers.",
      };

    // Modal Templates - One-time by nature
    case "NEWSLETTER":
    case "EXIT_INTENT":
      return {
        enabled: true,
        max_triggers_per_session: 1,
        max_triggers_per_day: 1,
        cooldown_between_triggers: 86400, // 24 hours
        respectGlobalCap: true,
        helpText:
          "📧 This popup shows once per session to avoid disrupting the shopping experience. Maximizes conversion without annoyance.",
      };

    case "SPIN_TO_WIN":
    case "SCRATCH_CARD":
      return {
        enabled: true,
        max_triggers_per_session: 1,
        max_triggers_per_day: 1,
        cooldown_between_triggers: 604800, // 7 days
        respectGlobalCap: true,
        helpText:
          "🎰 Gamification popup shows once per week. Keeps the experience special and prevents discount abuse.",
      };

    case "FLASH_SALE":
    case "PRODUCT_UPSELL":
      return {
        enabled: true,
        max_triggers_per_session: 2,
        max_triggers_per_day: 5,
        cooldown_between_triggers: 14400, // 4 hours
        respectGlobalCap: true,
        helpText:
          "⚡ This offer shows up to 2 times per session. Balances urgency with user experience.",
      };

    case "CART_ABANDONMENT":
      return {
        enabled: true,
        max_triggers_per_session: 3,
        max_triggers_per_day: 6,
        cooldown_between_triggers: 7200, // 2 hours
        respectGlobalCap: true,
        helpText:
          "🛒 Cart recovery popup shows up to 3 times per session. Gentle reminders to complete purchase.",
      };

    case "COUNTDOWN_TIMER":
      return {
        enabled: true,
        max_triggers_per_session: 5,
        max_triggers_per_day: 15,
        cooldown_between_triggers: 3600, // 1 hour
        respectGlobalCap: true,
        helpText:
          "⏰ Countdown timer shows up to 5 times per session. Creates urgency without overwhelming customers.",
      };

    default:
      // Default conservative settings
      return {
        enabled: true,
        max_triggers_per_session: 1,
        max_triggers_per_day: 3,
        cooldown_between_triggers: 86400, // 24 hours
        respectGlobalCap: true,
        helpText:
          "Default frequency capping: Shows once per session. Customize based on your campaign goals.",
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

/**
 * Get server-side frequency capping config (for database storage)
 * Extracts only the fields needed for enhancedTriggers.frequency_capping
 */
export function getServerFrequencyCapping(templateType: TemplateType): {
  max_triggers_per_session?: number;
  max_triggers_per_day?: number;
  cooldown_between_triggers?: number;
} | undefined {
  const defaults = getFrequencyCappingDefaults(templateType);

  // If frequency capping is disabled, return undefined (no limits)
  if (!defaults.enabled) {
    return undefined;
  }

  return {
    max_triggers_per_session: defaults.max_triggers_per_session,
    max_triggers_per_day: defaults.max_triggers_per_day,
    cooldown_between_triggers: defaults.cooldown_between_triggers,
  };
}

