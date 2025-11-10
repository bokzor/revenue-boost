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

/**
 * Safely parse and validate data with Zod schema
 * Throws ValidationError if validation fails
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): T {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return result.data;
    } else {
      const errors = result.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );

      throw new ValidationError(
        `Validation failed${context ? ` for ${context}` : ""}`,
        errors,
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
export function getValidationErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): string[] {
  const result = schema.safeParse(data);

  if (result.success) {
    return [];
  }

  return result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );
}


