/**
 * Campaign Domain Validation
 *
 * Template-type driven validation for campaign content and configuration
 */

import type {
  TemplateType,
  ContentConfig,
  CampaignCreateData,
  CampaignUpdateData,
} from "../types/campaign.js";
import { CampaignCreateDataSchema, CampaignUpdateDataSchema } from "../types/campaign.js";
import { getContentSchemaForTemplate } from "~/domains/templates/registry/template-registry.js";
import type { ExperimentCreateData, ExperimentUpdateData } from "../types/experiment.js";
import { ExperimentCreateDataSchema, ExperimentUpdateDataSchema } from "../types/experiment.js";
import { formatZodErrors } from "~/lib/validation-helpers";

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
        errors: formatZodErrors(result.error),
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : "Unknown error"}`],
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
      errors: formatZodErrors(result.error),
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
      errors: formatZodErrors(result.error),
    };
  }
}

// ============================================================================
// EXPERIMENT VALIDATION
// ============================================================================

/**
 * Validates experiment creation data
 */
export function validateExperimentCreateData(
  data: unknown
): ValidationResult<ExperimentCreateData> {
  const result = ExperimentCreateDataSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
}

/**
 * Validates experiment update data
 */
export function validateExperimentUpdateData(
  data: unknown
): ValidationResult<ExperimentUpdateData> {
  const result = ExperimentUpdateDataSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  } else {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    };
  }
}

// ============================================================================
// ACTIVATION VALIDATION
// ============================================================================

/**
 * Discount configuration for validation
 */
interface DiscountConfigForValidation {
  enabled?: boolean;
  type?: string;
  valueType?: string;
  value?: number;
  behavior?: string;
}

/**
 * Campaign data for activation validation
 */
interface CampaignForActivation {
  id: string;
  name: string;
  templateType: string;
  contentConfig: Record<string, unknown>;
  designConfig: Record<string, unknown>;
  discountConfig?: DiscountConfigForValidation | null;
  targetRules?: Record<string, unknown> | null;
}

/**
 * Templates that typically require a discount to be valuable
 */
const DISCOUNT_RECOMMENDED_TEMPLATES = [
  "FLASH_SALE",
  "NEWSLETTER", // For welcome discounts
  "SPIN_TO_WIN",
  "SCRATCH_CARD",
  "CART_ABANDONMENT",
  "FREE_SHIPPING",
];

/**
 * Validates that a campaign is ready to be activated.
 * Returns warnings (not errors) for missing discount configuration
 * since discounts are created at runtime.
 */
export function validateCampaignForActivation(
  campaign: CampaignForActivation
): ValidationResult<CampaignForActivation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check required fields are present
  if (!campaign.name || campaign.name.trim() === "") {
    errors.push("Campaign name is required");
  }

  if (!campaign.templateType) {
    errors.push("Template type is required");
  }

  // 2. Check content config has minimum required fields
  const contentConfig = campaign.contentConfig || {};
  if (!contentConfig.headline && !contentConfig.title) {
    warnings.push("Campaign has no headline or title - this may affect conversions");
  }

  // 3. Check discount configuration if template typically needs one
  if (DISCOUNT_RECOMMENDED_TEMPLATES.includes(campaign.templateType)) {
    const discountConfig = campaign.discountConfig;

    if (!discountConfig || !discountConfig.enabled) {
      // Not an error, just a warning - merchant may have a reason
      warnings.push(
        `This ${campaign.templateType.replace(/_/g, " ").toLowerCase()} campaign has no discount configured. ` +
          "Customers won't receive a discount code."
      );
    } else {
      // Discount is enabled - validate the configuration
      if (!discountConfig.valueType) {
        errors.push("Discount is enabled but value type (percentage/fixed/free shipping) is not set");
      }

      if (
        discountConfig.valueType !== "FREE_SHIPPING" &&
        (discountConfig.value === undefined || discountConfig.value === null)
      ) {
        errors.push("Discount is enabled but discount value is not set");
      }

      if (discountConfig.value !== undefined && discountConfig.value <= 0) {
        errors.push("Discount value must be greater than 0");
      }

      if (discountConfig.valueType === "PERCENTAGE" && discountConfig.value && discountConfig.value > 100) {
        errors.push("Percentage discount cannot exceed 100%");
      }
    }
  }

  // 4. Check design config
  const designConfig = campaign.designConfig || {};
  if (!designConfig.theme && !designConfig.backgroundColor) {
    warnings.push("No theme or background color set - campaign will use default styling");
  }

  // Return result
  if (errors.length > 0) {
    return {
      success: false,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  return {
    success: true,
    data: campaign,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Quick check if campaign has discount properly configured
 * Used for UI indicators (show warning badge, etc.)
 */
export function hasValidDiscountConfig(discountConfig?: DiscountConfigForValidation | null): boolean {
  if (!discountConfig || !discountConfig.enabled) {
    return false;
  }

  // Free shipping doesn't need a value
  if (discountConfig.valueType === "FREE_SHIPPING") {
    return true;
  }

  // Other types need a positive value
  return (
    discountConfig.value !== undefined &&
    discountConfig.value !== null &&
    discountConfig.value > 0
  );
}
