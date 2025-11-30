/**
 * Rate Limit Middleware
 *
 * Remix middleware for applying rate limits to routes
 * Returns 429 Too Many Requests when limit exceeded
 */

import { RateLimiter, RATE_LIMIT_CONFIGS } from "./rate-limiter.server";
import type { RateLimitConfig } from "./rate-limiter.server";

// Type definitions for loader/action args
type LoaderFunctionArgs = { request: Request; params: Record<string, string | undefined>; context: unknown };
type ActionFunctionArgs = { request: Request; params: Record<string, string | undefined>; context: unknown };

/**
 * Create JSON response
 */
function json<T>(data: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string {
  // Check common headers for IP (in order of preference)
  const headers = request.headers;

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return "unknown";
}

/**
 * Get store ID from request (if authenticated)
 */
function getStoreId(request: Request): string | null {
  // Only trust explicit headers set by authenticated upstream context.
  // Avoid using query params to prevent spoofing / bucket pollution.
  const headerStoreId =
    request.headers.get("x-rb-store-id") || request.headers.get("x-store-id") || null;

  if (!headerStoreId) return null;

  // Basic validation to avoid arbitrary/huge values
  const isValid = /^[A-Za-z0-9_-]+$/.test(headerStoreId);
  return isValid ? headerStoreId : null;
}

/**
 * Rate limit response with headers
 */
function rateLimitResponse(limit: number, remaining: number, resetAt: number) {
  const resetInSeconds = Math.ceil((resetAt - Date.now()) / 1000);

  return json(
    {
      success: false,
      error: "Too many requests. Please try again later.",
      retryAfter: resetInSeconds,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.floor(resetAt / 1000)),
        "Retry-After": String(resetInSeconds),
      },
    }
  );
}

/**
 * Apply rate limit to a loader or action
 */
export async function withRateLimit<T>(
  args: LoaderFunctionArgs | ActionFunctionArgs,
  config: RateLimitConfig,
  handler: (args: LoaderFunctionArgs | ActionFunctionArgs) => Promise<T>
): Promise<T | Response> {
  const { request } = args;

  // Check store-based rate limit first (if authenticated)
  const storeId = getStoreId(request);
  if (storeId) {
    const storeResult = RateLimiter.checkStore(storeId, config);
    if (!storeResult.allowed) {
      return rateLimitResponse(storeResult.limit, storeResult.remaining, storeResult.resetAt);
    }
  }

  // Check IP-based rate limit
  const ip = getClientIP(request);
  const ipResult = RateLimiter.checkIP(ip, config);
  if (!ipResult.allowed) {
    return rateLimitResponse(ipResult.limit, ipResult.remaining, ipResult.resetAt);
  }

  // Execute handler
  const response = await handler(args);

  // Add rate limit headers to successful responses
  if (response instanceof Response) {
    response.headers.set("X-RateLimit-Limit", String(ipResult.limit));
    response.headers.set("X-RateLimit-Remaining", String(ipResult.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.floor(ipResult.resetAt / 1000)));
  }

  return response;
}

/**
 * Convenience wrappers for different endpoint types
 */

export async function withPublicRateLimit<T>(
  args: LoaderFunctionArgs | ActionFunctionArgs,
  handler: (args: LoaderFunctionArgs | ActionFunctionArgs) => Promise<T>
): Promise<T | Response> {
  return withRateLimit(args, RATE_LIMIT_CONFIGS.PUBLIC, handler);
}

export async function withAuthRateLimit<T>(
  args: LoaderFunctionArgs | ActionFunctionArgs,
  handler: (args: LoaderFunctionArgs | ActionFunctionArgs) => Promise<T>
): Promise<T | Response> {
  return withRateLimit(args, RATE_LIMIT_CONFIGS.AUTHENTICATED, handler);
}

export async function withWriteRateLimit<T>(
  args: LoaderFunctionArgs | ActionFunctionArgs,
  handler: (args: LoaderFunctionArgs | ActionFunctionArgs) => Promise<T>
): Promise<T | Response> {
  return withRateLimit(args, RATE_LIMIT_CONFIGS.WRITE, handler);
}

export async function withAnalyticsRateLimit<T>(
  args: LoaderFunctionArgs | ActionFunctionArgs,
  handler: (args: LoaderFunctionArgs | ActionFunctionArgs) => Promise<T>
): Promise<T | Response> {
  return withRateLimit(args, RATE_LIMIT_CONFIGS.ANALYTICS, handler);
}

export async function withWebhookRateLimit<T>(
  args: LoaderFunctionArgs | ActionFunctionArgs,
  handler: (args: LoaderFunctionArgs | ActionFunctionArgs) => Promise<T>
): Promise<T | Response> {
  return withRateLimit(args, RATE_LIMIT_CONFIGS.WEBHOOK, handler);
}
