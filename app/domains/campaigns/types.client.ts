/**
 * Campaign Domain Client-Safe Exports
 *
 * This file exports only types and schemas that are safe to use in client code.
 * It does NOT export server-only services.
 */

// ============================================================================
// TYPES
// ============================================================================

// Campaign types
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
  CampaignCreateData,
  CampaignUpdateData,
} from "./types/campaign.js";

// Experiment types
export type {
  ExperimentStatus,
  TrafficAllocation,
  StatisticalConfig,
  SuccessMetrics,
  BaseExperiment,
  ExperimentWithVariants,
  ExperimentCreateData,
  ExperimentUpdateData,
} from "./types/experiment.js";

// ============================================================================
// SCHEMAS (Safe for client-side validation)
// ============================================================================

// Campaign schemas
export {
  CampaignGoalSchema,
  CampaignStatusSchema,
  TemplateTypeSchema,
  NewsletterContentSchema,
  SpinToWinContentSchema,
  FlashSaleContentSchema,
  CartAbandonmentContentSchema,
  ProductUpsellContentSchema,
  SocialProofContentSchema,
  DesignConfigSchema,
  EnhancedTriggersConfigSchema,
  AudienceTargetingConfigSchema,
  PageTargetingConfigSchema,
  TargetRulesConfigSchema,
  DiscountConfigSchema,
  BaseCampaignSchema,
  CampaignWithConfigsSchema,
  CampaignCreateDataSchema,
  CampaignUpdateDataSchema,
} from "./types/campaign.js";

// Experiment schemas
export {
  ExperimentStatusSchema,
  TrafficAllocationSchema,
  StatisticalConfigSchema,
  SuccessMetricsSchema,
  BaseExperimentSchema,
  ExperimentWithVariantsSchema,
  ExperimentCreateDataSchema,
  ExperimentUpdateDataSchema,
} from "./types/experiment.js";

// ============================================================================
// VALIDATION (Client-safe validation functions)
// ============================================================================

export type { ValidationResult, ValidationError } from "./validation/campaign-validation.js";

export {
  validateContentConfig,
  validateCampaignCreateData,
  validateCampaignUpdateData,
  validateExperimentCreateData,
  validateExperimentUpdateData,
} from "./validation/campaign-validation.js";

// ============================================================================
// UTILITIES (Client-safe utilities)
// ============================================================================

export {
  parseJsonField,
  stringifyJsonField,
  parseContentConfig,
  parseDesignConfig,
  parseTargetRules,
  parseDiscountConfig,
  parseTrafficAllocation,
  parseStatisticalConfig,
  parseSuccessMetrics,
  parseCampaignFields,
  parseExperimentFields,
} from "./utils/json-helpers.js";
