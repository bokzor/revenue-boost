/**
 * Design Editor Type Definitions
 *
 * Proper type definitions for the PopupDesignEditor component
 */

import type { PopupDesignConfig as StorefrontPopupDesignConfig } from "~/domains/storefront/popups-new/types";
import type {
  EnhancedTriggersConfig,
  DiscountConfig,
  TemplateType,
  TargetRulesConfig,
} from "~/domains/campaigns/types/campaign";

/**
 * Animation settings for popup entrance, exit, hover, and attention effects
 */
export interface AnimationSettings {
  entrance?: {
    animation: string;
    duration: number;
    easing: string;
    delay?: number;
  };
  exit?: {
    animation: string;
    duration: number;
    easing: string;
    delay?: number;
  };
  hover?: {
    enabled: boolean;
    animation: string;
    duration: number;
    easing: string;
  };
  attention?: {
    enabled: boolean;
    animation: string;
    duration: number;
    easing: string;
    interval?: number;
  };
}

/**
 * Animation configuration for a single animation
 */
export interface AnimationConfig {
  name: string;
  duration: number;
  easing: string;
  delay?: number;
}

/**
 * Mobile optimization configuration
 */
export interface MobileOptimizationConfig {
  enabled?: boolean;
  responsiveBreakpoint?: number;
  mobilePosition?: "top" | "bottom" | "center";
  mobileSize?: "small" | "medium" | "large" | "full";
  hideOnMobile?: boolean;
  [key: string]: unknown;
}

/**
 * Template object from database
 */
export interface TemplateObject {
  id: string;
  templateId?: string;

  name: string;
  templateType: TemplateType;
  category: string;
  description: string;
  preview?: string;
  contentConfig?: Record<string, unknown>;
  designConfig?: Record<string, unknown>;
  targetRules?: TargetRulesConfig;
  discountConfig?: Record<string, unknown>;
  [key: string]: unknown;
}

// Re-export types for convenience
export type { EnhancedTriggersConfig, DiscountConfig };

/**
 * Campaign context for smart recommendations
 */
export interface CampaignContext {
  triggerType?: string;
  name?: string;
  description?: string;
  campaignGoal?: "sales" | "email_capture" | "engagement" | "retention";
}

/**
 * Pending template change state
 */
export interface PendingTemplateChange {
  templateId: string;
  templateType: TemplateType;
  template?: TemplateObject;
}

/**
 * Extended popup design configuration for the design editor
 * Combines design properties with content fields for editing
 *
 * This is a UNION type that allows both:
 * - Pure design fields from StorefrontPopupDesignConfig
 * - Content fields from any ContentConfig type (headline, subheadline, etc.)
 * - Editor-specific fields (animations, mobileOptimization, etc.)
 */
export interface PopupDesignConfig extends StorefrontPopupDesignConfig {
  // Editor-specific animation settings

  slideDirection?: "left" | "right" | "bottom";
  width?: string;
  height?: string;
  sticky?: boolean;
  animations?: AnimationSettings;
  mobileOptimization?: MobileOptimizationConfig;

  // Content fields (from ContentConfig types)
  // These are optional to support all template types
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  ctaText?: string;
  successMessage?: string;
  failureMessage?: string;

  // Template-specific content fields (all optional)
  emailPlaceholder?: string;
  submitButtonText?: string;
  spinButtonText?: string;
  urgencyMessage?: string;
  // ... add more as needed

  // Generic content container for template-specific fields
  content?: Record<string, unknown>;
}
