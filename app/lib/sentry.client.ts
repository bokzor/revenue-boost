/**
 * Client-side Sentry Error Monitoring
 *
 * Provides centralized error tracking for browser-side errors.
 */

import * as Sentry from "@sentry/react";

let isInitialized = false;

/**
 * Initialize Sentry on the client side
 * Call this once when the app loads in the browser
 */
export function initSentryClient(): void {
  if (isInitialized) return;
  if (typeof window === "undefined") return;

  isInitialized = true;

  // Skip in development
  if (process.env.NODE_ENV !== "production") {
    console.log("[Sentry Client] Skipping initialization (not in production)");
    return;
  }

  // Get DSN from meta tag (injected by server)
  const dsnMeta = document.querySelector('meta[name="sentry-dsn"]');
  const dsn = dsnMeta?.getAttribute("content");

  if (!dsn) {
    console.warn("[Sentry Client] DSN not found in meta tag");
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });

    console.log("[Sentry Client] Initialized successfully");
  } catch (error) {
    console.error("[Sentry Client] Failed to initialize:", error);
  }
}

/**
 * Capture an exception on the client side
 */
export function captureClientException(
  error: Error | unknown,
  context?: Record<string, unknown>
): void {
  if (!isInitialized) {
    console.error("[Client Error]", error, context);
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
 * Set user context on the client
 */
export function setClientUser(user: { id: string; email?: string; shop?: string }): void {
  if (!isInitialized) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.shop,
  });
}

// Export Sentry ErrorBoundary for use in components
export { ErrorBoundary } from "@sentry/react";

