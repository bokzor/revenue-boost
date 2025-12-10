/**
 * API Route: Cart Email Recovery
 *
 * Used by cart-abandonment popups to:
 * - Capture an email address
 * - Issue a discount code (optionally email-locked)
 * - Let the storefront apply the code and redirect to checkout
 */

import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { authenticate } from "~/shopify.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import prisma from "~/db.server";
import {
  getCampaignDiscountCode,
  normalizeDiscountConfig,
  getSuccessMessage,
  shouldShowDiscountCode,
} from "~/domains/commerce/services/discount.server";
import { createDraftOrder } from "~/lib/shopify/order.server";

const EmailRecoveryRequestSchema = z.object({
  campaignId: z.string().min(1).refine(
    (id) => id.startsWith("preview-") || /^[cC][^\s-]{8,}$/.test(id),
    "Invalid campaign ID format"
  ),
  email: z.string().email(),
  sessionId: z.string(),
  visitorId: z.string().optional(),
  cartSubtotalCents: z.number().int().min(0).optional(),
  cartItems: z
    .array(
      z.object({
        id: z.number().optional(),
        variant_id: z.number().optional(),
        quantity: z.number(),
        properties: z.record(z.string(), z.string()).optional(),
        title: z.string().optional(),
        price: z.number().optional(),
      })
    )
    .optional(),
  // Bot detection fields
  popupShownAt: z.number().optional(),
  honeypot: z.string().optional(),
});

export type EmailRecoveryRequest = z.infer<typeof EmailRecoveryRequestSchema>;

interface EmailRecoveryResponse {
  success: boolean;
  discountCode?: string;
  behavior?: string;
  message?: string;
  error?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { admin, session } = await authenticate.public.appProxy(request);

    if (!session?.shop) {
      return data<EmailRecoveryResponse>(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = EmailRecoveryRequestSchema.parse(body);

    const campaign = await prisma.campaign.findUnique({
      where: { id: validated.campaignId },
      select: {
        id: true,
        storeId: true,
        name: true,
        discountConfig: true,
        status: true,
      },
    });

    if (!campaign || campaign.status !== "ACTIVE") {
      return data<EmailRecoveryResponse>(
        { success: false, error: "Campaign not found or inactive" },
        { status: 404 }
      );
    }

    // SECURITY: Generic storefront request validation
    const { validateStorefrontRequest } = await import(
      "~/domains/security/services/submission-validator.server"
    );
    const validation = await validateStorefrontRequest(request, validated);

    if (!validation.valid) {
      if (validation.isBotLikely) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        console.warn(`[Cart Recovery] 🤖 Bot detected (${validation.reason}) for campaign ${validated.campaignId}, IP: ${ip}`);
        return data<EmailRecoveryResponse>(
          { success: true, message: "Thank you!" },
          { status: 200 }
        );
      }
      return data<EmailRecoveryResponse>(
        { success: false, error: validation.reason === "session_expired" ? "Session expired. Please refresh the page." : "Invalid request" },
        { status: 400 }
      );
    }

    // PREVIEW MODE: Return mock success
    // BYPASS RATE LIMITING for preview mode to allow unlimited testing
    const isPreviewCampaign = validated.campaignId.startsWith("preview-");
    if (isPreviewCampaign) {
      console.log(`[Cart Recovery] ✅ Preview mode - returning mock success (BYPASSING RATE LIMITS)`);
      return data<EmailRecoveryResponse>(
        {
          success: true,
          message: "Preview mode: Cart recovery email sent (mock)",
        },
        { status: 200 }
      );
    }

    // PRODUCTION MODE: Rate limit per email+campaign
    const { checkRateLimit, RATE_LIMITS, createEmailCampaignKey } = await import(
      "~/domains/security/services/rate-limit.server"
    );
    const rateLimitKey = createEmailCampaignKey(validated.email, validated.campaignId);
    const rateLimitResult = await checkRateLimit(
      rateLimitKey,
      "cart_recovery",
      RATE_LIMITS.EMAIL_PER_CAMPAIGN,
      { email: validated.email, campaignId: validated.campaignId }
    );

    if (!rateLimitResult.allowed) {
      console.warn(`[Cart Recovery] Rate limit exceeded for ${validated.email}`);
      return data<EmailRecoveryResponse>(
        { success: false, error: "You've already recovered your cart today" },
        { status: 429 }
      );
    }

    // Parse and validate discount config
    const discountConfig = normalizeDiscountConfig(campaign.discountConfig);

    if (!discountConfig?.enabled) {
      return data<EmailRecoveryResponse>(
        { success: false, error: "Discount not enabled for this campaign" },
        { status: 400 }
      );
    }

    // When using email-locked discounts, authorize this email
    if (discountConfig.behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL") {
      discountConfig.authorizedEmail = validated.email;
      discountConfig.requireEmailMatch = true;
    }

    const discountResult = await getCampaignDiscountCode(
      admin,
      campaign.storeId,
      campaign.id,
      discountConfig,
      validated.email,
      validated.cartSubtotalCents
    );

    if (!discountResult.success || !discountResult.discountCode) {
      return data<EmailRecoveryResponse>(
        {
          success: false,
          error: discountResult.errors?.[0] || "Failed to generate discount code",
        },
        { status: 500 }
      );
    }

    // Create Draft Order if cart items are present
    if (validated.cartItems && validated.cartItems.length > 0) {
      try {
        // Find or create customer to get ID (optional, but good for linking)
        // For now, we'll just pass the email to createDraftOrder which handles it

        const draftOrderResult = await createDraftOrder(admin, {
          email: validated.email,
          lineItems: validated.cartItems,
          tags: [`revenue-boost:campaign:${campaign.id}`, "revenue-boost:recovery"],
          note: `Recovered from campaign: ${campaign.name}`,
        });

        if (draftOrderResult.success) {
          console.log(
            `[Cart Email Recovery] Created draft order: ${draftOrderResult.draftOrder?.id}`
          );
        } else {
          console.warn(
            `[Cart Email Recovery] Failed to create draft order:`,
            draftOrderResult.errors
          );
        }
      } catch (err) {
        console.error("[Cart Email Recovery] Error creating draft order:", err);
        // Don't fail the request if draft order creation fails, just log it
      }
    }

    const behavior = discountConfig.behavior || "SHOW_CODE_AND_AUTO_APPLY";
    const showCode = shouldShowDiscountCode(behavior);

    const response: EmailRecoveryResponse = {
      success: true,
      discountCode: showCode ? discountResult.discountCode : undefined,
      behavior,
      message: getSuccessMessage(behavior),
    };

    return data<EmailRecoveryResponse>(response, { status: 200 });
  } catch (error) {
    console.error("[Cart Email Recovery] Error:", error);
    return handleApiError(error, "POST /api/cart/email-recovery");
  }
}

export async function loader() {
  return data({ error: "Method not allowed. Use POST to submit email recovery." }, { status: 405 });
}
