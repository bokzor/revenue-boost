/**
 * Shared Error Classes
 * 
 * Base error classes for consistent error handling across the application
 */

/**
 * Base Service Error class
 * All service-specific errors should extend this class
 */
export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
    name: string = "ServiceError"
  ) {
    super(message);
    this.name = name;
  }
}

/**
 * Campaign Service Error
 * Used for campaign-related service operations
 */
export class CampaignServiceError extends ServiceError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, details, "CampaignServiceError");
  }
}

/**
 * Template Service Error
 * Used for template-related service operations
 */
export class TemplateServiceError extends ServiceError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, details, "TemplateServiceError");
  }
}

/**
 * Experiment Service Error
 * Used for experiment-related service operations
 */
export class ExperimentServiceError extends ServiceError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, details, "ExperimentServiceError");
  }
}

