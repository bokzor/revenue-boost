/**
 * Campaign Domain Validation
 *
 * Template-type driven validation for campaign content and configuration
 */

import type {
  TemplateType,
  ContentConfig,
  CampaignCreateData,
  CampaignUpdateData
} from "../types/campaign.js";
import {
  CampaignCreateDataSchema,
  CampaignUpdateDataSchema,
} from "../types/campaign.js";
import { getContentSchemaForTemplate } from "~/domains/templates/registry/template-registry.js";
import type {
  ExperimentCreateData,
  ExperimentUpdateData
} from "../types/experiment.js";
import {
  ExperimentCreateDataSchema,
  ExperimentUpdateDataSchema,
} from "../types/experiment.js";

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// CONTENT VALIDATION (Template-Type Driven)
// ============================================================================

/**
 * Validates content configuration based on template type
 * Each template type has its own content schema
 */
export function validateContentConfig(
  templateType: TemplateType,
  contentConfig: unknown
): ValidationResult<ContentConfig> {
  try {
    const schema = getContentSchemaForTemplate(templateType);
    const result = schema.safeParse(contentConfig);

    if (result.success) {
      return {
        success: true,
        data: result.data as ContentConfig,
      };
    } else {
      return {
        success: false,
        errors: result.error.issues.map(err =>
          `${err.path.join('.')}: ${err.message}`
        ),
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

// ============================================================================
// CAMPAIGN VALIDATION
// ============================================================================

/**
 * Validates campaign creation data with template-type driven content validation
 */
export function validateCampaignCreateData(data: unknown): ValidationResult<CampaignCreateData> {
  const result = CampaignCreateDataSchema.safeParse(data);

  if (result.success) {
    // Template-type driven content validation
    if (result.data.contentConfig && result.data.templateType) {
      const contentValidation = validateContentConfig(
        result.data.templateType,
        result.data.contentConfig
      );

      if (!contentValidation.success) {
        return {
          success: false,
          errors: contentValidation.errors,
        };
      }
    }

    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      errors: result.error.issues.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ),
    };
  }
}

/**
 * Validates campaign update data
 */
export function validateCampaignUpdateData(data: unknown): ValidationResult<CampaignUpdateData> {
  const result = CampaignUpdateDataSchema.safeParse(data);

  if (result.success) {
    // Template-type driven content validation if both are present
    if (result.data.contentConfig && result.data.templateType) {
      const contentValidation = validateContentConfig(
        result.data.templateType,
        result.data.contentConfig
      );

      if (!contentValidation.success) {
        return {
          success: false,
          errors: contentValidation.errors,
        };
      }
    }

    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      errors: result.error.issues.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ),
    };
  }
}

// ============================================================================
// EXPERIMENT VALIDATION
// ============================================================================

/**
 * Validates experiment creation data
 */
export function validateExperimentCreateData(data: unknown): ValidationResult<ExperimentCreateData> {
  const result = ExperimentCreateDataSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      errors: result.error.issues.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ),
    };
  }
}

/**
 * Validates experiment update data
 */
export function validateExperimentUpdateData(data: unknown): ValidationResult<ExperimentUpdateData> {
  const result = ExperimentUpdateDataSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      errors: result.error.issues.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ),
    };
  }
}
