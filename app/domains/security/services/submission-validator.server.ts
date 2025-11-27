/**
 * Submission Validator Service
 *
 * Validates lead/discount submissions without requiring pre-fetched challenge tokens.
 * Uses honeypot fields, timing validation, and impression verification for bot detection.
 *
 * Replaces the challenge token system with zero-latency security checks.
 */

import { getRedis, REDIS_PREFIXES } from "~/lib/redis.server";

export interface SubmissionValidationInput {
  campaignId: string;
  visitorId: string;
  sessionId: string;
  /** Timestamp when popup was shown (client-provided) */
  popupShownAt?: number;
  /** Honeypot field - should always be empty for real users */
  honeypot?: string;
  /** Client IP address */
  ip: string;
}

export interface SubmissionValidationResult {
  valid: boolean;
  reason?: string;
  /** If true, return fake success to avoid revealing detection to bots */
  isBotLikely?: boolean;
}

// Minimum time (ms) between popup display and submission
// Real humans can't read and fill a form in less than 1.5 seconds
const MIN_INTERACTION_TIME_MS = 1500;

// Maximum time (ms) - if popup was shown more than 30 minutes ago, consider expired
const MAX_INTERACTION_TIME_MS = 30 * 60 * 1000;

// Redis key TTL for impression tracking (24 hours)
const IMPRESSION_TTL_SECONDS = 24 * 60 * 60;

/**
 * Validate a lead/discount submission for bot activity
 *
 * Checks:
 * 1. Honeypot field (must be empty)
 * 2. Timing validation (popup shown → submit must be reasonable)
 * 3. Impression verification (popup must have been served to this visitor)
 */
export async function validateSubmission(
  input: SubmissionValidationInput
): Promise<SubmissionValidationResult> {
  const { campaignId, visitorId, popupShownAt, honeypot, ip } = input;

  // 1. Honeypot check - bots often fill hidden fields
  if (honeypot) {
    console.log(`[Submission Validator] 🤖 Honeypot triggered for campaign ${campaignId}, IP: ${ip}`);
    return { valid: false, reason: "honeypot", isBotLikely: true };
  }

  // 2. Timing validation
  if (popupShownAt) {
    const interactionTime = Date.now() - popupShownAt;

    // Too fast - likely a bot
    if (interactionTime < MIN_INTERACTION_TIME_MS) {
      console.log(
        `[Submission Validator] 🤖 Too fast (${interactionTime}ms) for campaign ${campaignId}, IP: ${ip}`
      );
      return { valid: false, reason: "too_fast", isBotLikely: true };
    }

    // Too slow - session expired
    if (interactionTime > MAX_INTERACTION_TIME_MS) {
      console.log(
        `[Submission Validator] ⏰ Expired (${Math.round(interactionTime / 1000)}s) for campaign ${campaignId}`
      );
      return { valid: false, reason: "session_expired" };
    }
  }

  // 3. Impression verification (soft check - log but don't block)
  // The frequency recording can fail due to network issues, so this is advisory only.
  // The timing check (popupShownAt) is the primary validation.
  const redis = getRedis();
  if (redis && visitorId && campaignId) {
    try {
      const impressionKey = `${REDIS_PREFIXES.VISITOR}:impression:${visitorId}:${campaignId}`;
      const wasServed = await redis.exists(impressionKey);

      if (!wasServed) {
        // Log the missing impression but DON'T block if popupShownAt is provided
        // popupShownAt is set client-side when popup renders, so it's a reliable indicator
        // that the user actually saw the popup
        console.log(
          `[Submission Validator] ⚠️ No impression record for visitor ${visitorId}, campaign ${campaignId} ` +
          `(timing ${popupShownAt ? 'provided' : 'missing'})`
        );

        // Only block if BOTH impression AND timing are missing
        // This catches bots that submit directly without seeing the popup
        if (!popupShownAt) {
          console.log(`[Submission Validator] 🤖 No impression + no timing = likely bot`);
          return { valid: false, reason: "no_impression", isBotLikely: true };
        }
        // If timing is provided but impression is missing, it's likely a network issue
        // Allow the submission but log for monitoring
      }
    } catch (error) {
      // Don't fail validation if Redis check fails - log and continue
      console.warn("[Submission Validator] Redis impression check failed:", error);
    }
  }

  return { valid: true };
}

/**
 * Record that a popup was shown to a visitor
 * Called when popup is displayed (frequency tracking)
 */
export async function recordImpression(
  visitorId: string,
  campaignId: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const impressionKey = `${REDIS_PREFIXES.VISITOR}:impression:${visitorId}:${campaignId}`;
    await redis.setex(impressionKey, IMPRESSION_TTL_SECONDS, Date.now().toString());
  } catch (error) {
    console.warn("[Submission Validator] Failed to record impression:", error);
  }
}

/**
 * Check if a visitor has seen a campaign (for debugging)
 */
export async function hasImpression(
  visitorId: string,
  campaignId: string
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // Assume valid if Redis unavailable

  try {
    const impressionKey = `${REDIS_PREFIXES.VISITOR}:impression:${visitorId}:${campaignId}`;
    return (await redis.exists(impressionKey)) === 1;
  } catch {
    return true; // Assume valid on error
  }
}

/**
 * Common body fields for storefront submissions
 * All storefront API endpoints should include these fields
 */
export interface StorefrontSubmissionBody {
  campaignId: string;
  sessionId: string;
  visitorId?: string;
  popupShownAt?: number;
  honeypot?: string;
}

/**
 * Generic validation for storefront requests
 *
 * This is the main entry point for validating submissions from the storefront.
 * It extracts visitor ID and IP from request/body and runs all security checks.
 *
 * Usage:
 * ```typescript
 * const validation = await validateStorefrontRequest(request, validatedBody);
 * if (!validation.valid) {
 *   if (validation.isBotLikely) {
 *     return data({ success: true }); // Fake success for bots
 *   }
 *   return data({ success: false, error: validation.reason });
 * }
 * ```
 */
export async function validateStorefrontRequest(
  request: Request,
  body: StorefrontSubmissionBody
): Promise<SubmissionValidationResult> {
  // Extract IP from headers
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Use visitorId from body (client's localStorage) - must match frequency tracking
  // Cookie-based visitor IDs don't work cross-origin due to SameSite policies
  const visitorId = body.visitorId || body.sessionId;

  return validateSubmission({
    campaignId: body.campaignId,
    visitorId,
    sessionId: body.sessionId,
    popupShownAt: body.popupShownAt,
    honeypot: body.honeypot,
    ip,
  });
}

/**
 * Helper to handle bot detection results consistently
 *
 * Returns a fake success response for likely bots to avoid revealing detection.
 * Returns null if validation passed (caller should continue with normal flow).
 *
 * Usage:
 * ```typescript
 * const botResponse = await handleBotDetection(request, validatedBody, {
 *   fakeSuccess: { success: true, code: "THANKS10" },
 *   errorMessage: "Invalid request",
 * });
 * if (botResponse) return botResponse;
 * // Continue with normal flow...
 * ```
 */
export async function handleBotDetection<TFakeSuccess, TError>(
  request: Request,
  body: StorefrontSubmissionBody,
  options: {
    fakeSuccess: TFakeSuccess;
    errorMessage?: string;
    logPrefix?: string;
  }
): Promise<{ response: TFakeSuccess | TError; isBot: boolean } | null> {
  const validation = await validateStorefrontRequest(request, body);

  if (!validation.valid) {
    const prefix = options.logPrefix || "Bot Detection";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (validation.isBotLikely) {
      console.warn(
        `[${prefix}] 🤖 Bot detected (${validation.reason}) for campaign ${body.campaignId}, IP: ${ip}`
      );
      return { response: options.fakeSuccess, isBot: true };
    }

    console.warn(`[${prefix}] Validation failed: ${validation.reason}`);
    const errorMessage =
      validation.reason === "session_expired"
        ? "Session expired. Please refresh the page."
        : options.errorMessage || "Invalid request";

    return {
      response: { success: false, error: errorMessage } as TError,
      isBot: false,
    };
  }

  return null; // Validation passed
}

