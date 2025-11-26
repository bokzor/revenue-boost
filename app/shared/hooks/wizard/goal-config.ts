/**
 * Goal-based Configuration
 *
 * Extracted from useWizardState to follow SOLID principles:
 * - Single Responsibility: Only handles goal-specific configuration
 * - Separation of Concerns: Isolates discount and design logic
 */

import type { CampaignGoal, CampaignFormData, PopupDesignFormData } from "../useWizardState";
import { getGoalDefaults } from "../../../lib/goal-defaults";
import type { DiscountConfig } from "~/domains/commerce/services/discounts/discount.server";

// Build discount configuration from goal defaults
export function buildDiscountConfig(
  goal: CampaignGoal,
  currentDiscountConfig: DiscountConfig
): DiscountConfig {
  const defaults = getGoalDefaults(goal);

  if (!defaults.discount) {
    // Preserve existing discount config if it exists, especially for FREE_SHIPPING
    if (currentDiscountConfig?.valueType === "FREE_SHIPPING") {
      return currentDiscountConfig;
    }

    return {
      enabled: false,
      showInPreview: true,
      type: "shared" as const,
      valueType: "PERCENTAGE" as const,
      value: 10,
      expiryDays: 7,
      prefix: "SAVE",
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
    };
  }

  return {
    enabled: defaults.discount.enabled,
    showInPreview: true,
    type: defaults.discount.singleUse ? "single_use" : "shared",
    valueType: defaults.discount.type === "percentage" ? "PERCENTAGE" : "FIXED_AMOUNT",
    value: defaults.discount.value,
    expiryDays: defaults.discount.expiryDays,
    prefix: defaults.discount.prefix,
    behavior: defaults.discount.behavior,
    usageLimit: defaults.discount.singleUse ? 1 : undefined,
  };
}

// Build design configuration from goal defaults
export function buildDesignConfig(
  goal: CampaignGoal,
  currentPopupDesign: PopupDesignFormData
): PopupDesignFormData {
  const defaults = getGoalDefaults(goal);

  return {
    ...currentPopupDesign,
    size: defaults.design.size,
  };
}

// Get recommended template ID for goal
export function getRecommendedTemplateId(goal: CampaignGoal): string | undefined {
  const defaults = getGoalDefaults(goal);
  return defaults.templates.recommended[0] || undefined;
}

// Build complete goal-based updates
export function buildGoalUpdates(
  goal: CampaignGoal,
  currentData: CampaignFormData
): Partial<CampaignFormData> {
  const defaults = getGoalDefaults(goal);
  // Don't set templateId here - let user select template in Design step
  // const recommendedTemplateId = getRecommendedTemplateId(goal);

  const updates: Partial<CampaignFormData> = {
    goal,
    status: defaults.campaign.status,
    priority: defaults.campaign.priority,
    discountConfig: buildDiscountConfig(goal, currentData.discountConfig),
    popupDesign: buildDesignConfig(goal, currentData.popupDesign!),
    // templateId: recommendedTemplateId, // Removed - don't auto-set template
  };

  // For simple (non-variant) campaigns, set a default name if none is provided
  if (!currentData.variantKey) {
    const hasName = typeof currentData.name === "string" && currentData.name.trim().length > 0;
    if (!hasName) {
      const humanizedGoal = goal
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      updates.name = `Campaign - ${humanizedGoal}`;
    }
  }

  return updates;
}
