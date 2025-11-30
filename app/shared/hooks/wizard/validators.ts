/**
 * Wizard Step Validators
 *
 * Extracted from useWizardState to follow SOLID principles:
 * - Single Responsibility: Each validator handles one step
 * - Open/Closed: Easy to add new validators without modifying existing code
 */

import type { CampaignFormData } from "../useWizardState";

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: "error" | "warning";
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
  suggestions: Array<{
    field: string;
    message: string;
  }>;
}

// Goal step validator
export function validateGoalStep(data: CampaignFormData): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  if (!data.goal) {
    result.isValid = false;
    result.errors.push({
      field: "goal",
      message: "Please select a campaign goal",
      severity: "error",
    });
  } else {
    const goalMessages = {
      NEWSLETTER_SIGNUP: "Email collection",
      INCREASE_REVENUE: "Revenue generation",
      ENGAGEMENT: "Community building",
    };

    result.suggestions.push({
      field: "goal",
      message: `Great choice! ${goalMessages[data.goal] || "This"} campaigns typically perform well.`,
    });
  }

  return result;
}

// Content step validator
export function validateContentStep(data: CampaignFormData): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  if (!data.goal) {
    result.isValid = false;
    result.errors.push({
      field: "goal",
      message: "Please select a goal first",
      severity: "error",
    });
    return result;
  }

  if (!data.contentConfig.title && !data.contentConfig.headline) {
    result.warnings.push({
      field: "contentConfig.title",
      message: "Consider adding a compelling headline to improve conversion",
    });
  }

  if (!data.contentConfig.description) {
    result.suggestions.push({
      field: "contentConfig.description",
      message: "Add a description to explain the value proposition",
    });
  }

  if (data.goal === "NEWSLETTER_SIGNUP" && !data.contentConfig.incentive) {
    result.suggestions.push({
      field: "contentConfig.incentive",
      message: "Offer a discount or freebie to increase signup rates",
    });
  }

  if (data.goal === "INCREASE_REVENUE" && !data.contentConfig.offer) {
    result.warnings.push({
      field: "contentConfig.offer",
      message: "Revenue campaigns perform better with a clear offer or discount",
    });
  }

  return result;
}

// Template step validator
export function validateTemplateStep(data: CampaignFormData): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  if (!data.goal) {
    result.isValid = false;
    result.errors.push({
      field: "goal",
      message: "Please select a goal first",
      severity: "error",
    });
  } else if (!data.templateId) {
    result.isValid = false;
    result.errors.push({
      field: "templateId",
      message: "Please select a template or choose to start from scratch",
      severity: "error",
    });
  } else {
    result.suggestions.push({
      field: "templateId",
      message: "You can customize the template design in the next step",
    });
  }

  return result;
}

// Audience step validator
export function validateAudienceStep(data: CampaignFormData): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  if (!data.goal) {
    result.isValid = false;
    result.errors.push({
      field: "goal",
      message: "Please select a goal first",
      severity: "error",
    });
    return result;
  }

  // Validate audienceTargeting instead of legacy targetRules
  if (!data.audienceTargeting?.enabled) {
    result.suggestions.push({
      field: "audienceTargeting.enabled",
      message: "Consider targeting specific audiences for better conversion rates",
    });
  } else {
    const hasShopifySegments =
      !!data.audienceTargeting.shopifySegmentIds &&
      data.audienceTargeting.shopifySegmentIds.length > 0;

    if (!hasShopifySegments) {
      result.warnings.push({
        field: "audienceTargeting",
        message: "Add Shopify segments for better targeting",
      });
    }
  }

  return result;
}

// Design step validator
export function validateDesignStep(data: CampaignFormData): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  if (!data.templateId) {
    result.isValid = false;
    result.errors.push({
      field: "templateId",
      message: "Please select a template first",
      severity: "error",
    });
    return result;
  }

  if (!data.designConfig.customColors) {
    result.suggestions.push({
      field: "designConfig.customColors",
      message: "Customize colors to match your brand",
    });
  }

  if (data.designConfig && !data.designConfig.mobileOptimized) {
    result.warnings.push({
      field: "designConfig.mobileOptimized",
      message: "Ensure your design looks good on mobile devices",
    });
  }

  return result;
}

// Schedule step validator
export function validateScheduleStep(data: CampaignFormData): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };

  if (!data.status || data.status === "DRAFT") {
    result.suggestions.push({
      field: "status",
      message: "Remember to set status to ACTIVE when ready to launch",
    });
  }

  if (!data.startDate) {
    result.suggestions.push({
      field: "startDate",
      message: "Set a start date to schedule your campaign launch",
    });
  }

  return result;
}

// Review step validator (always valid)
export function validateReviewStep(): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  };
}

// Validator registry for easy lookup
export const stepValidators = {
  0: validateGoalStep,
  1: validateContentStep,
  2: validateTemplateStep,
  3: validateAudienceStep,
  4: validateDesignStep,
  5: validateScheduleStep,
  6: validateReviewStep,
} as const;

// Main validation function
export function validateStep(stepIndex: number, data: CampaignFormData): ValidationResult {
  const validator = stepValidators[stepIndex as keyof typeof stepValidators];

  if (!validator) {
    // Unknown step - allow navigation but warn
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  }

  return validator(data);
}
