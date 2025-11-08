/**
 * API Error Handler
 * 
 * Centralized error handling for API routes
 * Provides consistent error responses across all endpoints
 */

import { data } from "react-router";
import { createApiResponse } from "~/lib/api-types";
import { ServiceError } from "~/lib/errors.server";
import { ValidationError } from "~/lib/validation-helpers";

/**
 * Handle API errors consistently across all routes
 *
 * @param error - The error object to handle
 * @param context - Context string for logging (e.g., "GET /api/campaigns")
 * @returns React Router data response with appropriate status code
 */
export function handleApiError(error: unknown, context: string) {
  console.error(`[API Error] ${context}:`, error);

  // Handle service errors (CampaignServiceError, TemplateServiceError, etc.)
  if (error instanceof ServiceError) {
    return data(
      createApiResponse(false, undefined, error.message, [error.message]),
      { status: error.code === "VALIDATION_FAILED" ? 400 : 500 }
    );
  }

  // Handle validation errors
  if (error instanceof ValidationError) {
    return data(
      createApiResponse(false, undefined, error.message, error.errors),
      { status: 400 }
    );
  }

  // Handle errors with custom status codes (from validation helpers)
  if (error instanceof Error && 'status' in error) {
    const statusCode = typeof (error as { status?: number }).status === 'number'
      ? (error as { status: number }).status
      : 500;
    return data(
      createApiResponse(false, undefined, error.message),
      { status: statusCode }
    );
  }

  // Handle unknown errors
  return data(
    createApiResponse(false, undefined, "Internal server error"),
    { status: 500 }
  );
}

