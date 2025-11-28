/**
 * API Error Handler
 *
 * Centralized error handling for API routes
 * Provides consistent error responses across all endpoints
 * Sanitizes error messages in production to prevent information leakage
 */

import { data } from "react-router";
import { z } from "zod";
import { createApiResponse } from "~/lib/api-types";
import { ServiceError } from "~/lib/errors.server";
import { ValidationError, formatZodErrors } from "~/lib/validation-helpers";
import { isProduction } from "./env.server";
import { PlanLimitError } from "~/domains/billing/errors";

/**
 * Sensitive patterns that should never be exposed in production
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /database/i,
  /connection/i,
  /redis/i,
  /session/i,
  /cookie/i,
  /authorization/i,
  /bearer/i,
];

/**
 * Check if error message contains sensitive information
 */
function containsSensitiveInfo(message: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Sanitize error message for production
 * Removes stack traces and sensitive information
 */
function sanitizeErrorMessage(error: unknown, isProd: boolean): string {
  if (!isProd) {
    // In development, return full error details
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // In production, sanitize error messages
  if (error instanceof Error) {
    const message = error.message;

    // Check for sensitive information
    if (containsSensitiveInfo(message)) {
      return "An error occurred while processing your request";
    }

    // Return sanitized message (no stack traces)
    return message;
  }

  return "An error occurred while processing your request";
}

/**
 * Log error with full details (server-side only)
 * In production, logs to error monitoring service
 */
function logError(error: unknown, context: string): void {
  const isProd = isProduction();

  if (isProd) {
    // In production, log to error monitoring service (e.g., Sentry)
    // For now, log to console with sanitized output
    console.error(`[API Error] ${context}:`, {
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error,
      // Don't log stack traces in production console
    });
  } else {
    // In development, log full error details
    console.error(`[API Error] ${context}:`, error);
  }
}

/**
 * Handle API errors consistently across all routes
 *
 * @param error - The error object to handle
 * @param context - Context string for logging (e.g., "GET /api/campaigns")
 * @returns React Router data response with appropriate status code
 */
export function handleApiError(error: unknown, context: string) {
  const isProd = isProduction();

  // Log error with full details (server-side only)
  logError(error, context);

  // Handle Zod validation errors (safe to expose - user input validation)
  if (error instanceof z.ZodError) {
    return data(
      createApiResponse(false, undefined, "Invalid request data", formatZodErrors(error)),
      { status: 400 }
    );
  }

  // Handle plan/feature limit errors explicitly so the client can react
  if (error instanceof PlanLimitError) {
    const message = sanitizeErrorMessage(error, isProd);
    return data(
      {
        ...createApiResponse(false, undefined, message, isProd ? [] : []),
        errorCode: error.code,
        errorDetails: error.details,
      },
      { status: error.httpStatus }
    );
  }

  // Handle service errors (CampaignServiceError, TemplateServiceError, etc.)
  if (error instanceof ServiceError) {
    const message = sanitizeErrorMessage(error, isProd);
    return data(createApiResponse(false, undefined, message, isProd ? [] : [error.message]), {
      status: error.code === "VALIDATION_FAILED" ? 400 : 500,
    });
  }

  // Handle validation errors (safe to expose - user input validation)
  if (error instanceof ValidationError) {
    return data(createApiResponse(false, undefined, error.message, error.errors), { status: 400 });
  }

  // Handle errors with custom status codes
  if (error instanceof Error && "status" in error) {
    const statusCode =
      typeof (error as { status?: number }).status === "number"
        ? (error as { status: number }).status
        : 500;
    const message = sanitizeErrorMessage(error, isProd);
    return data(createApiResponse(false, undefined, message), {
      status: statusCode,
    });
  }

  // Handle unknown errors - never expose details in production
  const message = isProd ? "Internal server error" : sanitizeErrorMessage(error, false);

  return data(createApiResponse(false, undefined, message), { status: 500 });
}
