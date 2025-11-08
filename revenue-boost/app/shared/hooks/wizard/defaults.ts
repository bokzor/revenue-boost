/**
 * Wizard Default State Factory
 * 
 * Extracted from useWizardState to follow SOLID principles:
 * - Single Responsibility: Only handles default state creation
 * - DRY: Centralized default values
 */

import type { CampaignFormData, TemplateType, PageTargetingConfig } from "../useWizardState";

// Page targeting defaults for different template types
export function getPageTargetingDefaults(templateType: TemplateType): PageTargetingConfig {
  const defaults: Record<string, PageTargetingConfig> = {
    cart_upsell: {
      enabled: true,
      pages: ["/cart", "/checkout"],
      customPatterns: [],
      excludePages: [],
    },
    pdp_cross_sell: {
      enabled: true,
      pages: ["/products/*"],
      customPatterns: [],
      excludePages: [],
    },
    post_add_upsell: {
      enabled: true,
      pages: ["/products/*", "/collections/*"],
      customPatterns: [],
      excludePages: [],
    },
    "newsletter-elegant": {
      enabled: true,
      pages: ["/", "/collections/*", "/products/*"],
      customPatterns: [],
      excludePages: ["/checkout", "/account"],
    },
    "flash-sale-modal": {
      enabled: true,
      pages: ["/", "/collections/*"],
      customPatterns: [],
      excludePages: ["/checkout"],
    },
    scratch_card: {
      enabled: true,
      pages: ["/", "/collections/*", "/products/*"],
      customPatterns: [],
      excludePages: ["/checkout"],
    },
    spin_to_win: {
      enabled: true,
      pages: ["/", "/collections/*", "/products/*"],
      customPatterns: [],
      excludePages: ["/checkout"],
    },
  };

  return defaults[templateType] || {
    enabled: false,
    pages: [],
    customPatterns: [],
    excludePages: [],
  };
}

// Default popup design configuration
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

// Default frequency capping configuration
export function getDefaultFrequencyCapping() {
  return {
    enabled: true,
    maxViews: 3,
    timeWindow: 24,
    respectGlobalCap: true,
    cooldownHours: 0,
  };
}

// Default discount configuration
export function getDefaultDiscountConfig(initialData?: Partial<CampaignFormData>) {
  return {
    enabled: false,
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
    targetRules: {},
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

