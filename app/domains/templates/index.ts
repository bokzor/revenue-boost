/**
 * Templates Domain Exports
 *
 * Central export point for all template domain functionality
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  TemplateField,
  BaseTemplate,
  TemplateWithConfigs,
  TemplateCreateData,
  TemplateUpdateData,
  // Template-type specific types with properly typed contentConfig
  NewsletterTemplate,
  FlashSaleTemplate,
  SpinToWinTemplate,
  TypedTemplate,
  // Re-exported config types
  ContentConfig,
  BaseContentConfig,
  TemplateType,
} from "./types/template.js";

// ============================================================================
// SCHEMAS
// ============================================================================

export {
  TemplateFieldSchema,
  BaseTemplateSchema,
  TemplateWithConfigsSchema,
  TemplateCreateDataSchema,
  TemplateUpdateDataSchema,
  // Template-type specific schemas
  NewsletterTemplateSchema,
  FlashSaleTemplateSchema,
  SpinToWinTemplateSchema,
  // Utility functions
  getTemplateSchemaForType,
  getTemplateContentSchema,
  parseTemplateContentConfig,
} from "./types/template.js";

// ============================================================================
// SERVICES
// ============================================================================

export {
  TemplateService,
} from "./services/template.server.js";

// Service errors are now exported from ~/lib/errors.server
export { TemplateServiceError } from "~/lib/errors.server";

// ============================================================================
// UTILITIES
// ============================================================================

export {
  parseJsonField,
  stringifyJsonField,
} from "../campaigns/utils/json-helpers.js";
