/**
 * Challenge Token Request API
 *
 * POST /api/challenge/request
 * Generates a one-time challenge token for secure discount code generation.
 * Requires proof of legitimate popup interaction before issuing discount codes.
 */

import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { generateChallengeToken } from "~/domains/security/services/challenge-token.server";
import {
  checkRateLimit,
  RATE_LIMITS,
  createIpKey,
} from "~/domains/security/services/rate-limit.server";
import { authenticate } from "~/shopify.server";

// Request validation schema
const ChallengeRequestSchema = z.object({
  campaignId: z.string(), // Allow any string (preview IDs are not CUIDs)
  sessionId: z.string(),
  previewToken: z.string().optional(), // Optional preview token for preview mode
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Authenticate via app proxy (storefront context)
    const { session } = await authenticate.public.appProxy(request);

    if (!session?.shop) {
      return data({ success: false, error: "Invalid session" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = ChallengeRequestSchema.parse(body);

    // Get client IP (needed for both preview and production)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // PREVIEW MODE: If previewToken is provided, validate it and generate a REAL token
    // BYPASS RATE LIMITING for preview mode to allow unlimited testing
    if (validatedRequest.previewToken) {
      console.log(`[Challenge Token] Preview mode detected with token: ${validatedRequest.previewToken}`);

      // Validate preview token exists in Redis
      const { getRedis, REDIS_PREFIXES } = await import("~/lib/redis.server");
      const redis = getRedis();

      if (redis) {
        const PREVIEW_PREFIX = `${REDIS_PREFIXES.SESSION}:preview`;
        const redisKey = `${PREVIEW_PREFIX}:${validatedRequest.previewToken}`;
        const sessionDataStr = await redis.get(redisKey);

        if (sessionDataStr) {
          // Preview token is valid - generate a REAL challenge token for testing
          console.log(`[Challenge Token] ✅ Preview token validated, generating real challenge token (BYPASSING RATE LIMITS)`);

          const tokenData = await generateChallengeToken(
            validatedRequest.campaignId, // Use preview campaign ID (e.g., "preview-{token}")
            validatedRequest.sessionId,
            ip,
            60 // 60 minute TTL for preview (longer than production for testing)
          );

          console.log(
            `[Challenge Token] Generated REAL preview token for campaign ${validatedRequest.campaignId}, IP: ${ip}`
          );

          return data(
            {
              success: true,
              challengeToken: tokenData.token,
              expiresAt: tokenData.expiresAt.toISOString(),
            },
            { status: 200 }
          );
        } else {
          console.warn(`[Challenge Token] ⚠️ Preview token not found or expired`);
          // Fall through to normal validation which will fail appropriately
        }
      }
    }

    // PRODUCTION MODE: Rate limit check (3 challenge requests per 10 minutes per IP)
    const rateLimitKey = createIpKey(ip, "challenge_request");
    const rateLimitResult = await checkRateLimit(
      rateLimitKey,
      "challenge_request",
      RATE_LIMITS.CHALLENGE_REQUEST,
      { campaignId: validatedRequest.campaignId }
    );

    if (!rateLimitResult.allowed) {
      return data(
        {
          success: false,
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimitResult.resetAt,
        },
        { status: 429 }
      );
    }

    // Generate challenge token
    const tokenData = await generateChallengeToken(
      validatedRequest.campaignId,
      validatedRequest.sessionId,
      ip,
      10 // 10 minute TTL
    );

    console.log(
      `[Challenge Token] Generated for campaign ${validatedRequest.campaignId}, IP: ${ip}`
    );

    return data(
      {
        success: true,
        challengeToken: tokenData.token,
        expiresAt: tokenData.expiresAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Challenge Token API] Error:", error);

    if (error instanceof z.ZodError) {
      return data(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return data({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
