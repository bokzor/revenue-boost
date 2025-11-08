/**
 * Campaign Domain Exports
 *
 * Central export point for all campaign domain functionality
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
// SCHEMAS
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
  getContentSchemaForTemplate,
  DesignConfigSchema,
  EnhancedTriggersConfigSchema,
  AudienceTargetingConfigSchema,
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
// VALIDATION
// ============================================================================

export type {
  ValidationResult,
  ValidationError,
} from "./validation/campaign-validation.js";

export {
  validateContentConfig,
  validateCampaignCreateData,
  validateCampaignUpdateData,
  validateExperimentCreateData,
  validateExperimentUpdateData,
} from "./validation/campaign-validation.js";

// ============================================================================
// SERVICES
// ============================================================================

export {
  CampaignService,
} from "./services/campaign.server.js";

export {
  ExperimentService,
} from "./services/experiment.server.js";

// Service errors are now exported from ~/lib/errors.server
export { CampaignServiceError, ExperimentServiceError } from "~/lib/errors.server";

// ============================================================================
// UTILITIES
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
