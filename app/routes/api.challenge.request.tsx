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
    campaignId: z.string().cuid(),
    sessionId: z.string(),
});

export async function action({ request }: ActionFunctionArgs) {
    try {
        // Authenticate via app proxy (storefront context)
        const { session } = await authenticate.public.appProxy(request);

        if (!session?.shop) {
            return data(
                { success: false, error: "Invalid session" },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedRequest = ChallengeRequestSchema.parse(body);

        // Get client IP for rate limiting
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown";

        // Rate limit check: 3 challenge requests per 10 minutes per IP
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

        console.log(`[Challenge Token] Generated for campaign ${validatedRequest.campaignId}, IP: ${ip}`);

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

        return data(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
