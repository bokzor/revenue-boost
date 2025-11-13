/**
 * Wizard Default State Factory
 *
 * Extracted from useWizardState to follow SOLID principles:
 * - Single Responsibility: Only handles default state creation
 * - DRY: Centralized default values
 *
 * NOTE: Page targeting defaults have been removed - templates now define
 * their own page targeting in the database (Template.targetRules.pageTargeting)
 */

import type { CampaignFormData, PageTargetingConfig } from "../useWizardState";
import type { TemplateType } from "~/domains/campaigns/types/campaign";
import { getFrequencyCappingDefaults } from "~/domains/campaigns/utils/frequency-defaults";

/**
 * Default popup design form data for wizard
 * Returns PopupDesignFormData (simplified wizard version)
 */
export function getDefaultPopupDesign() {
  return {
    id: "",
    title: "",
    description: "",
    buttonText: "Shop Now",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#007ace",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium",
    showCloseButton: true,
    overlayOpacity: 0.8,
  };
}

// Default enhanced triggers configuration
export function getDefaultEnhancedTriggers() {
  return {
    enabled: true,
    triggers: [
      {
        type: "page_load" as const,
        config: {
          delay: 3000,
          scrollDepth: 50,
          exitIntentSensitivity: "medium" as const,
          conditions: [],
        },
      },
    ],
  };
}

// Default audience targeting configuration
export function getDefaultAudienceTargeting() {
  return {
    enabled: false,
    segments: [],
    customRules: {
      enabled: false,
      conditions: [],
      logicOperator: "AND" as const,
    },
  };
}

// Default page targeting configuration
export function getDefaultPageTargeting(): PageTargetingConfig {
  return {
    enabled: false,
    pages: [],
    customPatterns: [],
    excludePages: [],
  };
}

// Default frequency capping configuration (server format)
export function getDefaultFrequencyCapping(templateType?: TemplateType) {
  // If templateType is provided, use template-specific defaults
  if (templateType) {
    return getFrequencyCappingDefaults(templateType);
  }

  // Fallback to generic defaults
  return {
    enabled: true,
    max_triggers_per_session: 1,
    max_triggers_per_day: 3,
    cooldown_between_triggers: 86400, // 24 hours
    respectGlobalCap: true,
  };
}

// Default discount configuration
export function getDefaultDiscountConfig(initialData?: Partial<CampaignFormData>) {
  return {
    enabled: false,
    showInPreview: true,
    type: "shared" as const,
    valueType: "PERCENTAGE" as const,
    value: 10,
    expiryDays: 7,
    prefix: "SAVE",
    deliveryMode: "show_code_fallback" as const,
    ...(initialData?.discountConfig || {}),
  };
}

// Create complete default campaign form data
export function createDefaultCampaignData(
  initialData?: Partial<CampaignFormData>
): CampaignFormData {
  return {
    contentConfig: {},
    designConfig: {
      popupDesign: getDefaultPopupDesign(),
    },
    isSaving: false,
    status: "DRAFT",
    priority: 1,
    tags: [],
    triggerType: "page_load",
    enhancedTriggers: getDefaultEnhancedTriggers(),
    audienceTargeting: getDefaultAudienceTargeting(),
    pageTargeting: getDefaultPageTargeting(),
    frequencyCapping: getDefaultFrequencyCapping(),
    discountConfig: getDefaultDiscountConfig(initialData),
    ...initialData,
  } as CampaignFormData;
}

