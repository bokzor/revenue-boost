/**
 * Campaign Domain JSON Utilities
 *
 * Type-safe JSON field parsing and serialization for campaign configurations
 */

import { z } from "zod";
import type { Campaign, Experiment } from "@prisma/client";
import type {
  ContentConfig,
  BaseContentConfig,
  DesignConfig,
  TargetRulesConfig,
  DiscountConfig,
  TemplateType,

  CampaignWithConfigs
} from "../types/campaign.js";
import {
  DesignConfigSchema,
  TargetRulesConfigSchema,
  DiscountConfigSchema,
} from "../types/campaign.js";
import { getContentSchemaForTemplate } from "~/domains/templates/registry/template-registry.js";
import type {
  TrafficAllocation,
  StatisticalConfig,
  SuccessMetrics,
  BaseExperiment
} from "../types/experiment.js";
import {
  TrafficAllocationSchema,
  StatisticalConfigSchema,
  SuccessMetricsSchema,
} from "../types/experiment.js";

// ============================================================================
// CORE JSON PARSING UTILITIES
// ============================================================================

/**
 * Safely parse and validate JSON field with Zod schema
 */
export function parseJsonField<T>(
  jsonValue: unknown,
  schema: z.ZodSchema<T>,
  defaultValue: T
): T {
  try {
    // Handle null/undefined
    if (jsonValue === null || jsonValue === undefined) {
      return defaultValue;
    }

    // Handle string JSON
    let parsed: unknown;
    if (typeof jsonValue === 'string') {
      parsed = JSON.parse(jsonValue);
    } else {
      parsed = jsonValue;
    }

    // Validate with schema
    const result = schema.safeParse(parsed);
    return result.success ? result.data : defaultValue;
  } catch (error) {
    console.warn('Failed to parse JSON field:', error);
    return defaultValue;
  }
}

/**
 * Safely stringify object for JSON field storage
 */
export function stringifyJsonField<T>(value: T): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Failed to stringify JSON field:', error);
    return '{}';
  }
}

// ============================================================================
// CAMPAIGN JSON FIELD PARSERS
// ============================================================================

/**
 * Parse campaign contentConfig JSON field with template-type validation
 * Returns ContentConfig when templateType is provided, otherwise BaseContentConfig
 */
export function parseContentConfig(
  jsonValue: unknown,
  templateType?: TemplateType
): ContentConfig | BaseContentConfig {
  const schema = getContentSchemaForTemplate(templateType);
  return parseJsonField(jsonValue, schema, {} as BaseContentConfig);
}

/**
 * Parse campaign designConfig JSON field
 */
export function parseDesignConfig(jsonValue: unknown): DesignConfig {
  return parseJsonField(jsonValue, DesignConfigSchema, {
    theme: "modern",
    position: "center",
    size: "medium",
    borderRadius: 8,
    imagePosition: "left",
    overlayOpacity: 0.8,
    animation: "fade",
  });
}

/**
 * Parse campaign targetRules JSON field
 */
export function parseTargetRules(jsonValue: unknown): TargetRulesConfig | null {
  return parseJsonField(jsonValue, TargetRulesConfigSchema, null);
}

/**
 * Parse campaign discountConfig JSON field
 */
export function parseDiscountConfig(jsonValue: unknown): DiscountConfig {
  return parseJsonField(jsonValue, DiscountConfigSchema, {
    enabled: false,
  });
}

// ============================================================================
// EXPERIMENT JSON FIELD PARSERS
// ============================================================================

/**
 * Parse experiment trafficAllocation JSON field
 */
export function parseTrafficAllocation(jsonValue: unknown): TrafficAllocation {
  return parseJsonField(jsonValue, TrafficAllocationSchema, {
    A: 50,
    B: 50,
  });
}

/**
 * Parse experiment statisticalConfig JSON field
 */
export function parseStatisticalConfig(jsonValue: unknown): StatisticalConfig {
  return parseJsonField(jsonValue, StatisticalConfigSchema, {
    confidenceLevel: 0.95,
    minimumSampleSize: 1000,
    minimumDetectableEffect: 0.05,
    maxDurationDays: 30,
  });
}

/**
 * Parse experiment successMetrics JSON field
 */
export function parseSuccessMetrics(jsonValue: unknown): SuccessMetrics {
  return parseJsonField(jsonValue, SuccessMetricsSchema, {
    primaryMetric: "conversion_rate",
  });
}

// ============================================================================
// ENTITY PARSING UTILITIES
// ============================================================================

/**
 * Raw campaign object from database (before JSON parsing)
 * Using Prisma Campaign type directly to ensure type compatibility
 */
export type RawCampaign = Campaign;

/**
 * Raw experiment object from database (before JSON parsing)
 * Using Prisma Experiment type directly to ensure type compatibility
 */
export type RawExperiment = Experiment;

/**
 * Parse all JSON fields from a raw campaign object from database
 */
export function parseCampaignFields(rawCampaign: RawCampaign): CampaignWithConfigs {
  return {
    ...rawCampaign,
    contentConfig: parseContentConfig(rawCampaign.contentConfig, rawCampaign.templateType),
    designConfig: parseDesignConfig(rawCampaign.designConfig),
    targetRules: parseTargetRules(rawCampaign.targetRules),
    discountConfig: parseDiscountConfig(rawCampaign.discountConfig),
  } as CampaignWithConfigs;
}

/**
 * Parse all JSON fields from a raw experiment object from database
 */
export function parseExperimentFields(rawExperiment: RawExperiment): BaseExperiment {
  return {
    ...rawExperiment,
    trafficAllocation: parseTrafficAllocation(rawExperiment.trafficAllocation),
    statisticalConfig: parseStatisticalConfig(rawExperiment.statisticalConfig),
    successMetrics: parseSuccessMetrics(rawExperiment.successMetrics),
  } as BaseExperiment;
}
