/**
 * API Route: Discount Code Issuance
 *
 * Dynamically issues discount codes for campaigns with tier selection.
 * Handles basic, tiered, BOGO, and free gift discounts.
 *
 * Features:
 * - Smart tier selection based on cart subtotal
 * - Idempotency per session to prevent spam
 * - Usage tracking and metadata
 */

import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import { getCampaignDiscountCode } from "~/domains/commerce/services/discount.server";

// Request validation schema
const IssueDiscountRequestSchema = z.object({
  campaignId: z.string().min(1).refine(
    (id) => id.startsWith("preview-") || /^[cC][^\s-]{8,}$/.test(id),
    "Invalid campaign ID format"
  ),
  cartSubtotalCents: z.number().int().min(0).optional(),
  sessionId: z.string(),
  challengeToken: z.string(), // REQUIRED: Challenge token for security
  lineItems: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .optional(),
});

// Response types
interface DiscountIssueResponse {
  success: boolean;
  code?: string;
  type?: string;
  tierUsed?: string;
  expiresAt?: string;
  usageRemaining?: number;
  applicability?: {
    scope: string;
    productIds?: string[];
    collectionIds?: string[];
  };
  autoApplyMode?: string;
  error?: string;
}

// Simple in-memory session tracking for idempotency (30 min TTL)
interface SessionIssue {
  campaignId: string;
  code: string;
  timestamp: number;
}

const sessionIssues = new Map<string, SessionIssue>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Authenticate via app proxy
    const { admin, session } = await authenticate.public.appProxy(request);

    if (!session?.shop) {
      return data({ success: false, error: "Invalid session" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = IssueDiscountRequestSchema.parse(body);

    const { campaignId, cartSubtotalCents, sessionId, challengeToken } = validatedRequest;

    // SECURITY: Validate challenge token
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { validateAndConsumeToken } = await import(
      "~/domains/security/services/challenge-token.server"
    );
    const tokenValidation = await validateAndConsumeToken(
      challengeToken,
      campaignId,
      sessionId,
      ip,
      false
    );

    if (!tokenValidation.valid) {
      console.warn(`[Discount Issue] Token validation failed: ${tokenValidation.error}`);
      return data(
        { success: false, error: tokenValidation.error || "Invalid or expired token" },
        { status: 403 }
      );
    }

    // PREVIEW MODE: Return mock discount code
    // BYPASS RATE LIMITING for preview mode to allow unlimited testing
    const isPreviewCampaign = campaignId.startsWith("preview-");
    if (isPreviewCampaign) {
      console.log(`[Discount Issue] ✅ Preview mode - returning mock discount code (BYPASSING RATE LIMITS)`);
      return data(
        {
          success: true,
          discountCode: "PREVIEW10",
          message: "Preview mode: Discount code generated (mock code)",
        },
        { status: 200 }
      );
    }

    // PRODUCTION MODE: Rate limit per session/IP
    const { checkRateLimit, RATE_LIMITS, createSessionKey } = await import(
      "~/domains/security/services/rate-limit.server"
    );
    // Use session ID for rate limiting as we might not have email here
    const rateLimitKey = createSessionKey(sessionId);
    const rateLimitResult = await checkRateLimit(
      rateLimitKey,
      "discount_issue",
      RATE_LIMITS.DISCOUNT_GENERATION, // 5 per hour
      { sessionId, campaignId }
    );

    if (!rateLimitResult.allowed) {
      console.warn(`[Discount Issue] Rate limit exceeded for session ${sessionId}`);
      return data(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Check idempotency: if this session recently issued a code for this campaign, reuse it
    if (sessionId) {
      const cacheKey = `${sessionId}:${campaignId}`;
      const cached = sessionIssues.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < SESSION_TTL_MS) {
        console.log(`[Discount Issue] Reusing cached code for session ${sessionId}`);
        return data({
          success: true,
          code: cached.code,
          cached: true,
        });
      }
    }

    // Fetch campaign with discount config
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        storeId: true,
        name: true,
        discountConfig: true,
        status: true,
      },
    });

    if (!campaign || campaign.status !== "ACTIVE") {
      return data({ success: false, error: "Campaign not found or inactive" }, { status: 404 });
    }

    // Parse discount config
    const discountConfig =
      typeof campaign.discountConfig === "string"
        ? JSON.parse(campaign.discountConfig)
        : campaign.discountConfig;

    if (!discountConfig?.enabled) {
      return data(
        { success: false, error: "Discount not enabled for this campaign" },
        { status: 400 }
      );
    }
    // NOTE [Tiered discounts]: we select the highest eligible tier based on cartSubtotalCents.
    // Shopify enforces each tier's minimum subtotal at checkout via minimumRequirement.
    // This means if the cart shrinks after issuance, a higher-tier code will not qualify at checkout.
    // TODO: Consider storefront cart listeners to downgrade/remove the code if subtotal drops
    // below the selected tier threshold for better UX.

    // Get or create discount code via service (with tier selection)
    const result = await getCampaignDiscountCode(
      admin,
      campaign.storeId,
      campaign.id,
      discountConfig,
      undefined, // leadEmail - optional for now
      cartSubtotalCents // Pass cart subtotal for tier selection
    );

    if (!result.success || !result.discountCode) {
      return data(
        {
          success: false,
          error: result.errors?.[0] || "Failed to generate discount code",
        },
        { status: 500 }
      );
    }

    // Build response
    const response: DiscountIssueResponse = {
      success: true,
      code: result.discountCode,
      type: discountConfig.valueType || "PERCENTAGE",
      autoApplyMode: discountConfig.autoApplyMode || "ajax",
    };

    // Add tier info if applicable (from service result)
    if (result.tierUsed !== undefined && discountConfig.tiers?.[result.tierUsed]) {
      const tier = discountConfig.tiers[result.tierUsed];
      response.tierUsed = `Tier ${result.tierUsed + 1}: $${(tier.thresholdCents / 100).toFixed(2)}+`;
    }

    // Add applicability scope
    if (discountConfig.applicability) {
      response.applicability = {
        scope: discountConfig.applicability.scope || "all",
        productIds: discountConfig.applicability.productIds,
        collectionIds: discountConfig.applicability.collectionIds,
      };
    }

    // Add expiry if configured
    if (discountConfig.expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + discountConfig.expiryDays);
      response.expiresAt = expiryDate.toISOString();
    }

    // Add usage remaining if limited
    if (discountConfig.usageLimit) {
      // TODO: Query Shopify for actual usage; for now, return configured limit
      response.usageRemaining = discountConfig.usageLimit;
    }

    // Cache for idempotency
    if (sessionId) {
      const cacheKey = `${sessionId}:${campaignId}`;
      sessionIssues.set(cacheKey, {
        campaignId,
        code: result.discountCode,
        timestamp: Date.now(),
      });

      // Clean up old entries (simple LRU)
      if (sessionIssues.size > 500) {
        const cutoff = Date.now() - SESSION_TTL_MS;
        for (const [key, entry] of sessionIssues.entries()) {
          if (entry.timestamp < cutoff) {
            sessionIssues.delete(key);
          }
        }
      }
    }

    // Log issuance for analytics/debugging
    console.log(
      `[Discount Issue] Issued code "${result.discountCode}" for campaign ${campaignId}`,
      {
        tierUsed: response.tierUsed,
        cartSubtotal: cartSubtotalCents ? `$${(cartSubtotalCents / 100).toFixed(2)}` : "N/A",
        isNew: result.isNewDiscount,
      }
    );

    // Record analytics event
    try {
      // Get visitor info from request if possible, or rely on what we have
      const userAgent = request.headers.get("User-Agent") || null;
      const ipAddress = request.headers.get("X-Forwarded-For")?.split(",")[0].trim() || null;

      await PopupEventService.recordEvent({
        storeId: campaign.storeId,
        campaignId: campaign.id,
        sessionId: sessionId || "unknown", // Should ideally always have sessionId
        eventType: "COUPON_ISSUED",
        userAgent,
        ipAddress,
        metadata: {
          discountCode: result.discountCode,
          tierUsed: result.tierUsed,
          cartSubtotalCents,
          source: "api_issue",
        },
      });
    } catch (err) {
      console.error("[Discount Issue] Failed to record analytics event:", err);
      // Don't fail the request
    }

    return data(response);
  } catch (error) {
    console.error("[Discount Issue] Error:", error);

    if (error instanceof z.ZodError) {
      return data(
        { success: false, error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return data({ success: false, error: "Failed to issue discount code" }, { status: 500 });
  }
}

// Only allow POST requests
export async function loader() {
  return data({ error: "Method not allowed. Use POST to issue discounts." }, { status: 405 });
}
