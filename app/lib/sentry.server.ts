/**
 * Sentry Error Monitoring Integration
 *
 * Provides centralized error tracking for production debugging.
 */

import { logger } from "~/lib/logger.server";
import * as Sentry from "@sentry/node";
import { isProduction } from "./env.server";

let isInitialized = false;

/**
 * Initialize Sentry error monitoring
 * Call this once at app startup in entry.server.tsx
 */
export function initSentry(): void {
  if (isInitialized) return;
  isInitialized = true;

  // Only initialize in production
  if (!isProduction()) {
    logger.debug("[Sentry] Skipping initialization (not in production)");
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.warn("[Sentry] SENTRY_DSN not configured, error monitoring disabled");
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      release: process.env.APP_VERSION || "1.0.0",
      tracesSampleRate: 0.1,
      sampleRate: 1.0,
    });

    logger.debug("[Sentry] Initialized successfully");
  } catch (error) {
    logger.error({ error }, "[Sentry] Failed to initialize:");
  }
}

/**
 * Capture an exception with optional context
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  if (!isInitialized) {
    logger.error({ error, context }, "[Sentry] Error captured (Sentry not initialized)");
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message with optional context
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, unknown>
): void {
  if (!isInitialized) {
    // Map Sentry levels to pino logger methods (warning -> warn)
    const loggerLevel = level === "warning" ? "warn" : level;
    logger[loggerLevel]({ context }, `[Sentry] ${message} (Sentry not initialized)`);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureMessage(message, level);
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; shop?: string }): void {
  if (!isInitialized) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.shop,
  });
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (!isInitialized) return;
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: "debug" | "info" | "warning" | "error";
  data?: Record<string, unknown>;
}): void {
  if (!isInitialized) return;

  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level || "info",
    data: breadcrumb.data,
  });
}
