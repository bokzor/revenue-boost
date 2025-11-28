/**
 * Validation Helpers
 *
 * Utility functions for data validation following source project patterns
 * Provides consistent validation error handling across the application
 */

import { z } from "zod";

// ============================================================================
// TYPES
// ============================================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: string[],
    public context?: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

// ============================================================================
// ZOD ERROR FORMATTING UTILITIES
// ============================================================================

/**
 * Format Zod validation errors into human-readable messages
 *
 * @param error - The ZodError object
 * @returns Array of formatted error strings in "path: message" format
 *
 * @example
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   const errors = formatZodErrors(result.error);
 *   // ["email: Invalid email", "name: Required"]
 * }
 */
export function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

/**
 * Format Zod validation errors as a single joined string
 *
 * @param error - The ZodError object
 * @param separator - Separator between error messages (default: ", ")
 * @returns Single string with all errors joined
 *
 * @example
 * const errorMessage = formatZodErrorsAsString(result.error);
 * // "email: Invalid email, name: Required"
 */
export function formatZodErrorsAsString(error: z.ZodError, separator = ", "): string {
  return formatZodErrors(error).join(separator);
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Safely parse and validate data with Zod schema
 * Throws ValidationError if validation fails
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return result.data;
    } else {
      throw new ValidationError(
        `Validation failed${context ? ` for ${context}` : ""}`,
        formatZodErrors(result.error),
        context
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError(
      `Validation error${context ? ` for ${context}` : ""}`,
      [error instanceof Error ? error.message : "Unknown validation error"],
      context
    );
  }
}

/**
 * Get validation errors as formatted strings
 * Returns empty array if data is valid
 */
export function getValidationErrors<T>(schema: z.ZodSchema<T>, data: unknown): string[] {
  const result = schema.safeParse(data);

  if (result.success) {
    return [];
  }

  return formatZodErrors(result.error);
}
