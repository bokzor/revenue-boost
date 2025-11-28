/**
 * Campaign Domain Shared Exports
 *
 * Shared exports for both server and client code.
 * This file contains types, schemas, validation, and utilities that are safe to use
 * in both server and client contexts.
 *
 * - index.server.ts re-exports this plus server-only services
 * - types.client.ts re-exports this (client-safe subset)
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
// VALIDATION
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

