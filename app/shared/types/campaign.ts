/**
 * Shared Campaign Types
 *
 * Re-exports campaign types for backward compatibility
 */

export type {
  CampaignGoal,
  CampaignStatus,
  TemplateType,
  ContentConfig,
  BaseContentConfig,
  DesignConfig,
  EnhancedTriggersConfig,
  AudienceTargetingConfig,
  PageTargetingConfig,
  TargetRulesConfig,
  DiscountConfig,
  BaseCampaign,
  CampaignWithConfigs,
} from "~/domains/campaigns/types/campaign";

export type {
  ExperimentStatus,
  BaseExperiment,
  ExperimentWithVariants,
} from "~/domains/campaigns/types/experiment";

/**
 * Storefront Campaign Type
 * Represents a campaign as it appears on the storefront
 * Includes runtime properties that may be added for preview/display purposes
 */
import type { CampaignWithConfigs as CampaignWithConfigsType } from "~/domains/campaigns/types/campaign";

export type StorefrontCampaign = CampaignWithConfigsType & {
  // Runtime properties for storefront display
  previewMode?: boolean;
  campaignId?: string; // Alias for id
  buttonUrl?: string; // From contentConfig
  cooldownMinutes?: number; // From targetRules
  normalizedTemplateType?: string; // Normalized template type

  // Properties that may be flattened from configs for easier access
  title?: string; // From contentConfig
  buttonText?: string; // From contentConfig
  backgroundColor?: string; // From designConfig
  textColor?: string; // From designConfig
  buttonColor?: string; // From designConfig
  buttonTextColor?: string; // From designConfig
  position?: string; // From designConfig
  size?: string; // From designConfig
  imageUrl?: string; // From contentConfig
  overlayOpacity?: number; // From designConfig
  showCloseButton?: boolean; // From designConfig
  globalCustomCSS?: string; // From store settings

  // Additional runtime properties
  [key: string]: unknown;
};
