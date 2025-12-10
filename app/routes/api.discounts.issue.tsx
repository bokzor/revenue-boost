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
import { handleApiError } from "~/lib/api-error-handler.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import {
  getCampaignDiscountCode,
  inferStrategy,
  normalizeDiscountConfig,
} from "~/domains/commerce/services/discount.server";
import { generatePreviewDiscountCode } from "~/lib/preview-discount.server";

// Request validation schema
const IssueDiscountRequestSchema = z.object({
  campaignId: z.string().min(1).refine(
    (id) => id.startsWith("preview-") || /^[cC][^\s-]{8,}$/.test(id),
    "Invalid campaign ID format"
  ),
  cartSubtotalCents: z.number().int().min(0).optional(),
  sessionId: z.string(),
  visitorId: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .optional(),
  // Product Upsell: selected product IDs for bundle discount scoping
  selectedProductIds: z.array(z.string()).optional(),
  // Cart Abandonment: product IDs from cart for cart-scoped discounts
  cartProductIds: z.array(z.string()).optional(),
  // Bot detection fields
  popupShownAt: z.number().optional(),
  honeypot: z.string().optional(),
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
  behavior?: string;
  error?: string;
}

import { getRedis } from "~/lib/redis.server";

// Redis-based session tracking for idempotency (30 min TTL)
interface SessionIssue {
  campaignId: string;
  code: string;
  timestamp: number;
}

const SESSION_CACHE_PREFIX = "discount_session";
const SESSION_TTL_SECONDS = 30 * 60; // 30 minutes

/**
 * Get cached discount code from Redis
 */
async function getCachedDiscountCode(sessionId: string, campaignId: string): Promise<SessionIssue | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const cacheKey = `${SESSION_CACHE_PREFIX}:${sessionId}:${campaignId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as SessionIssue;
    }
  } catch (error) {
    console.error("[Discount Issue] Redis cache read error:", error);
  }
  return null;
}

/**
 * Cache discount code in Redis
 */
async function cacheDiscountCode(sessionId: string, campaignId: string, code: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const cacheKey = `${SESSION_CACHE_PREFIX}:${sessionId}:${campaignId}`;
    const sessionIssue: SessionIssue = {
      campaignId,
      code,
      timestamp: Date.now(),
    };
    await redis.setex(cacheKey, SESSION_TTL_SECONDS, JSON.stringify(sessionIssue));
  } catch (error) {
    console.error("[Discount Issue] Redis cache write error:", error);
  }
}

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

    const {
      campaignId,
      cartSubtotalCents,
      sessionId,
      visitorId,
      selectedProductIds,
      cartProductIds,
      popupShownAt,
      honeypot,
    } = validatedRequest;

    // SECURITY: Generic storefront request validation
    const { validateStorefrontRequest } = await import(
      "~/domains/security/services/submission-validator.server"
    );
    const validation = await validateStorefrontRequest(request, {
      campaignId,
      sessionId,
      visitorId,
      popupShownAt,
      honeypot,
    });

    if (!validation.valid) {
      if (validation.isBotLikely) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        console.warn(`[Discount Issue] 🤖 Bot detected (${validation.reason}) for campaign ${campaignId}, IP: ${ip}`);
        return data(
          { success: true, code: "THANK-YOU-10", type: "PERCENTAGE", behavior: "SHOW_CODE_ONLY" },
          { status: 200 }
        );
      }
      return data(
        { success: false, error: validation.reason === "session_expired" ? "Session expired. Please refresh the page." : "Invalid request" },
        { status: 400 }
      );
    }

    // PREVIEW MODE: Return mock discount code
    // BYPASS RATE LIMITING for preview mode to allow unlimited testing
    const isPreviewCampaign = campaignId.startsWith("preview-");
    if (isPreviewCampaign) {
      console.log(`[Discount Issue] ✅ Preview mode - returning mock discount code (BYPASSING RATE LIMITS)`);

      // Try to fetch discount config from Redis preview session
      let previewDiscountCode = "PREVIEW-SAVE";
      let previewBehavior = "SHOW_CODE_AND_AUTO_APPLY";

      try {
        // Extract token from campaign ID (format: "preview-{token}")
        const previewToken = campaignId.replace("preview-", "");
        if (previewToken) {
          const { getRedis, REDIS_PREFIXES } = await import("~/lib/redis.server");
          const redis = getRedis();
          if (redis) {
            const PREVIEW_PREFIX = `${REDIS_PREFIXES.SESSION}:preview`;
            const redisKey = `${PREVIEW_PREFIX}:${previewToken}`;
            const sessionDataStr = await redis.get(redisKey);

            if (sessionDataStr) {
              const sessionData = JSON.parse(sessionDataStr);
              const discountConfig = sessionData.data?.discountConfig;

              if (discountConfig) {
                previewDiscountCode = generatePreviewDiscountCode(discountConfig) || "PREVIEW-SAVE";
                previewBehavior = discountConfig.behavior || "SHOW_CODE_AND_AUTO_APPLY";
                console.log(`[Discount Issue] 🎟️ Preview discount code generated: ${previewDiscountCode}`);
              }
            }
          }
        }
      } catch (error) {
        console.warn("[Discount Issue] Failed to fetch preview discount config:", error);
      }

      return data(
        {
          success: true,
          code: previewDiscountCode,
          behavior: previewBehavior,
          message: "Preview mode: Discount code generated (mock code)",
        },
        { status: 200 }
      );
    }

    // Check if rate limiting is bypassed (for staging/dev/testing)
    const { getEnv, isDevelopment } = await import("~/lib/env.server");
    const rateLimitBypass = getEnv().RATE_LIMIT_BYPASS || isDevelopment();

    if (!rateLimitBypass) {
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
    } else {
      console.log(`[Discount Issue] ⚠️ Rate limiting bypassed (RATE_LIMIT_BYPASS=true)`);
    }

    // Check idempotency: if this session recently issued a code for this campaign, reuse it
    if (sessionId) {
      const cached = await getCachedDiscountCode(sessionId, campaignId);

      if (cached) {
        console.log(`[Discount Issue] Reusing cached code for session ${sessionId}`);
        return data({
          success: true,
          code: cached.code,
          cached: true,
        });
      }
    }

    // Fetch campaign with discount config and content config
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        storeId: true,
        name: true,
        discountConfig: true,
        contentConfig: true,
        status: true,
      },
    });

    if (!campaign || campaign.status !== "ACTIVE") {
      return data({ success: false, error: "Campaign not found or inactive" }, { status: 404 });
    }

    // Parse discount config (no backward-compat bundle sync; require explicit config)
    const rawDiscountConfig =
      typeof campaign.discountConfig === "string"
        ? JSON.parse(campaign.discountConfig)
        : campaign.discountConfig || {};

    const discountConfig = normalizeDiscountConfig(rawDiscountConfig);

    if (!discountConfig?.enabled) {
      return data(
        { success: false, error: "Discount not enabled for this campaign" },
        { status: 400 }
      );
    }

    let discountConfigWithStrategy = {
      ...discountConfig,
      strategy: inferStrategy(discountConfig),
    };

    // BUNDLE DISCOUNT (Product Upsell):
    // If selectedProductIds are provided, scope discount to those specific products.
    // This allows dynamic scoping for AI-suggested products at runtime.
    // TODO: Add security validation to ensure productIds are valid for this campaign
    if (selectedProductIds && selectedProductIds.length > 0) {
      console.log("[Discount Issue] Bundle discount mode - scoping to selected products:", {
        selectedProductIds,
        count: selectedProductIds.length,
      });

      discountConfigWithStrategy = {
        ...discountConfigWithStrategy,
        strategy: "bundle",
        applicability: {
          scope: "products",
          productIds: selectedProductIds,
        },
      };
    }

    // CART-SCOPED DISCOUNT:
    // If scope is "cart" and cartProductIds are provided, convert to product-scoped discount
    if (
      discountConfigWithStrategy?.applicability?.scope === "cart" &&
      cartProductIds &&
      cartProductIds.length > 0
    ) {
      console.log("[Discount Issue] Cart-scoped discount mode:", {
        cartProductIds,
        originalScope: discountConfigWithStrategy.applicability.scope,
      });

      // Override applicability to use product IDs from cart
      discountConfigWithStrategy = {
        ...discountConfigWithStrategy,
        applicability: {
          scope: "products",
          productIds: cartProductIds,
        },
      };
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
      discountConfigWithStrategy,
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
      behavior: discountConfig.behavior || "SHOW_CODE_AND_AUTO_APPLY",
    };

    // Add tier info if applicable (from service result)
    if (
      result.tierUsed !== undefined &&
      discountConfigWithStrategy.tiers?.[result.tierUsed]
    ) {
      const tier = discountConfigWithStrategy.tiers[result.tierUsed];
      response.tierUsed = `Tier ${result.tierUsed + 1}: $${(tier.thresholdCents / 100).toFixed(2)}+`;
    }

    // Add applicability scope
    if (discountConfigWithStrategy.applicability) {
      response.applicability = {
        scope: discountConfigWithStrategy.applicability.scope || "all",
        productIds: discountConfigWithStrategy.applicability.productIds,
        collectionIds: discountConfigWithStrategy.applicability.collectionIds,
      };
    }

    // Add expiry if configured
    if (discountConfigWithStrategy.expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + discountConfigWithStrategy.expiryDays);
      response.expiresAt = expiryDate.toISOString();
    }

    // Add usage remaining if limited
    if (discountConfigWithStrategy.usageLimit) {
      // TODO: Query Shopify for actual usage; for now, return configured limit
      response.usageRemaining = discountConfigWithStrategy.usageLimit;
    }

    // Cache for idempotency (Redis with automatic TTL expiration)
    if (sessionId) {
      await cacheDiscountCode(sessionId, campaignId, result.discountCode);
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
    return handleApiError(error, "POST /api/discounts/issue");
  }
}

// Only allow POST requests
export async function loader() {
  return data({ error: "Method not allowed. Use POST to issue discounts." }, { status: 405 });
}
