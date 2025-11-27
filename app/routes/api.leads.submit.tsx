/**
 * Lead Submission API Endpoint
 *
 * POST /api/leads/submit
 * Handles email submissions from popups and generates discount codes via Shopify Admin API
 */

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { z } from "zod";
import prisma from "~/db.server";
import { storefrontCors } from "~/lib/cors.server";
import { getStoreIdFromShop, createAdminApiContext } from "~/lib/auth-helpers.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import {
  getCampaignDiscountCode,
  parseDiscountConfig,
  shouldShowDiscountCode,
  getSuccessMessage,
} from "~/domains/commerce/services/discount.server";
import {
  upsertCustomer,
  sanitizeCustomerData,
  extractCustomerId,
  type CustomerUpsertData,
} from "~/lib/shopify/customer.server";

const LeadSubmissionSchema = z.object({
  email: z.string().email(),
  campaignId: z.string(),
  sessionId: z.string(),
  visitorId: z.string().optional(),
  consent: z.boolean().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  pageUrl: z.string().optional(),
  pageTitle: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  // Bot detection fields
  popupShownAt: z.number().optional(),
  honeypot: z.string().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: storefrontCors(),
    });
  }

  if (request.method !== "POST") {
    return data(
      { success: false, error: "Method not allowed" },
      { status: 405, headers: storefrontCors() }
    );
  }

  try {
    // Get shop domain from headers
    const shop = new URL(request.url).searchParams.get("shop");
    if (!shop) {
      return data(
        { success: false, error: "Missing shop parameter" },
        { status: 400, headers: storefrontCors() }
      );
    }

    const storeId = await getStoreIdFromShop(shop);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = LeadSubmissionSchema.parse(body);

    // Check if this is a preview campaign
    const isPreviewCampaign = validatedData.campaignId.startsWith("preview-");

    // Get campaign and store with access token (skip for preview campaigns)
    let campaign = null;
    if (!isPreviewCampaign) {
      campaign = await prisma.campaign.findFirst({
        where: {
          id: validatedData.campaignId,
          storeId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          discountConfig: true,
          store: {
            select: {
              id: true,
              shopifyDomain: true,
              accessToken: true,
            },
          },
        },
      });

      if (!campaign) {
        return data(
          { success: false, error: "Campaign not found or inactive" },
          { status: 404, headers: storefrontCors() }
        );
      }
    }

    // SECURITY: Generic storefront request validation
    const { validateStorefrontRequest } = await import(
      "~/domains/security/services/submission-validator.server"
    );
    const validation = await validateStorefrontRequest(request, validatedData);

    if (!validation.valid) {
      if (validation.isBotLikely) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        console.warn(`[Lead Submit] 🤖 Bot detected (${validation.reason}) for campaign ${validatedData.campaignId}, IP: ${ip}`);
        return data(
          { success: true, leadId: "processed", message: "Thank you!" },
          { status: 200, headers: storefrontCors() }
        );
      }
      return data(
        { success: false, error: validation.reason === "session_expired" ? "Session expired. Please refresh the page." : "Invalid request" },
        { status: 400, headers: storefrontCors() }
      );
    }

    // PREVIEW MODE: Return success without saving to database
    // BYPASS RATE LIMITING for preview mode to allow unlimited testing
    if (isPreviewCampaign) {
      console.log(`[Lead Submit] ✅ Preview mode - returning mock success response (BYPASSING RATE LIMITS)`);
      return data(
        {
          success: true,
          leadId: "preview-lead-id",
          message: "Preview mode: Lead submission successful (not saved to database)",
          discountCode: undefined, // Don't generate discount codes in preview
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        },
        { status: 200, headers: storefrontCors() }
      );
    }

    // PRODUCTION MODE: Rate limit per email+campaign (1 per day)
    const { checkRateLimit, RATE_LIMITS, createEmailCampaignKey } = await import(
      "~/domains/security/services/rate-limit.server"
    );
    const rateLimitKey = createEmailCampaignKey(validatedData.email, validatedData.campaignId);
    const rateLimitResult = await checkRateLimit(
      rateLimitKey,
      "lead_submission",
      RATE_LIMITS.EMAIL_PER_CAMPAIGN,
      { email: validatedData.email, campaignId: validatedData.campaignId }
    );

    if (!rateLimitResult.allowed) {
      console.warn(`[Lead Submit] Rate limit exceeded for ${validatedData.email}`);
      return data(
        {
          success: false,
          error: "You've already submitted for this campaign today",
          retryAfter: rateLimitResult.resetAt,
        },
        { status: 429, headers: storefrontCors() }
      );
    }

    // Check for existing lead to prevent duplicates
    const existingLead = await prisma.lead.findUnique({
      where: {
        storeId_campaignId_email: {
          storeId,
          campaignId: validatedData.campaignId,
          email: validatedData.email.toLowerCase(),
        },
      },
      select: {
        id: true,
        discountCode: true,
        createdAt: true,
      },
    });

    if (existingLead) {
      console.log(`[Lead Submission] Lead already exists: ${existingLead.id}`);

      if (!campaign) {
        return data(
          {
            success: true,
            leadId: existingLead.id,
            discountCode: null,
            message: "Already subscribed to this campaign",
          },
          { status: 200, headers: storefrontCors() }
        );
      }

      // Parse discount config to determine behavior
      const discountConfig = parseDiscountConfig(campaign.discountConfig);
      const behavior = discountConfig.behavior || "SHOW_CODE_AND_AUTO_APPLY";
      const showCode = shouldShowDiscountCode(behavior);

      // If a code already exists for this lead, return it immediately
      if (existingLead.discountCode) {
        return data(
          {
            success: true,
            leadId: existingLead.id,
            discountCode: showCode ? existingLead.discountCode : undefined,
            behavior,
            message: getSuccessMessage(behavior),
          },
          { status: 200, headers: storefrontCors() }
        );
      }

      // Otherwise, try to generate a code now (retroactive issuance)
      if (!campaign.store.accessToken) {
        console.warn("[Lead Submission] Cannot retro-issue code: missing access token");
        return data(
          {
            success: true,
            leadId: existingLead.id,
            discountCode: null,
            message: "Already subscribed to this campaign",
          },
          { status: 200, headers: storefrontCors() }
        );
      }

      const admin = createAdminApiContext(campaign.store.shopifyDomain, campaign.store.accessToken);

      // Adjust discount config for email-authorization mode
      if (discountConfig.behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL") {
        discountConfig.authorizedEmail = validatedData.email;
        discountConfig.requireEmailMatch = true;
      }

      const discountResult = await getCampaignDiscountCode(
        admin,
        storeId,
        validatedData.campaignId,
        discountConfig,
        validatedData.email
      );

      if (discountResult.success && discountResult.discountCode) {
        // Persist the newly created code on the existing lead
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            discountCode: discountResult.discountCode,
            discountId: discountResult.discountId || null,
          },
        });

        return data(
          {
            success: true,
            leadId: existingLead.id,
            discountCode: showCode ? discountResult.discountCode : undefined,
            discountId: discountResult.discountId,
            behavior,
            message: getSuccessMessage(behavior),
          },
          { status: 200, headers: storefrontCors() }
        );
      }

      // Failed to generate retroactive code; return existing lead without a code
      return data(
        {
          success: true,
          leadId: existingLead.id,
          discountCode: null,
          message: "Already subscribed to this campaign",
        },
        { status: 200, headers: storefrontCors() }
      );
    }

    // Create admin API context from store's access token
    if (!campaign) {
      console.error("[Lead Submission] Campaign is null");
      return data(
        { success: false, error: "Campaign not found" },
        { status: 404, headers: storefrontCors() }
      );
    }

    if (!campaign.store.accessToken) {
      console.error("[Lead Submission] Store has no access token");
      return data(
        { success: false, error: "Store not properly configured" },
        { status: 500, headers: storefrontCors() }
      );
    }

    const admin = createAdminApiContext(campaign.store.shopifyDomain, campaign.store.accessToken);

    // Sanitize customer data
    const customerData: CustomerUpsertData = sanitizeCustomerData({
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
      marketingConsent: validatedData.consent,
      source: "revenue-boost-popup",
      campaignId: validatedData.campaignId,
    });

    // Upsert customer in Shopify
    const customerResult = await upsertCustomer(admin, customerData);
    if (!customerResult.success) {
      console.warn("[Lead Submission] Failed to create/update customer:", customerResult.errors);
      // Continue without customer - not critical
    }

    // Parse discount config
    const discountConfig = parseDiscountConfig(campaign.discountConfig);

    // For email authorization, add the subscriber's email to the config
    if (discountConfig.behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL") {
      discountConfig.authorizedEmail = validatedData.email;
      discountConfig.requireEmailMatch = true;
    }

    // NOTE [Tiered discounts]: lead-based issuance does not include cart subtotal.
    // If tiers are configured, selection may default to the first tier.
    // Prefer issuing tiered discounts via /api/discounts.issue with cartSubtotalCents close to checkout/cart.
    // TODO: When discountConfig.tiers?.length, consider deferring issuance to the cart-aware flow instead
    // of issuing here, to avoid UX confusion when cart value changes after code generation.

    // Get or create discount code via Shopify Admin API
    const discountResult = await getCampaignDiscountCode(
      admin,
      storeId,
      validatedData.campaignId,
      discountConfig,
      validatedData.email
    );

    if (!discountResult.success) {
      console.warn("[Lead Submission] Failed to create discount code:", discountResult.errors);
      // Continue without discount code - don't fail the entire process
    }

    // Build metadata
    const metadata = {
      pageUrl: validatedData.pageUrl,
      pageTitle: validatedData.pageTitle,
      referrer: validatedData.referrer,
      utmSource: validatedData.utmSource,
      utmMedium: validatedData.utmMedium,
      utmCampaign: validatedData.utmCampaign,
      ...validatedData.metadata,
    };

    const userAgent = request.headers.get("User-Agent") || null;
    const ipAddress = getClientIP(request);

    // Create lead record
    const lead = await prisma.lead.create({
      data: {
        storeId,
        campaignId: validatedData.campaignId,
        email: validatedData.email.toLowerCase(),
        firstName: validatedData.firstName || null,
        lastName: validatedData.lastName || null,
        phone: validatedData.phone || null,
        marketingConsent: validatedData.consent || false,
        sessionId: validatedData.sessionId,
        visitorId: validatedData.visitorId || null,
        shopifyCustomerId: customerResult.shopifyCustomerId
          ? BigInt(extractCustomerId(customerResult.shopifyCustomerId))
          : null,
        discountCode: discountResult.discountCode || null,
        discountId: discountResult.discountId || null,
        userAgent,
        ipAddress,
        referrer: validatedData.referrer || null,
        pageUrl: validatedData.pageUrl || null,
        pageTitle: validatedData.pageTitle || null,
        utmSource: validatedData.utmSource || null,
        utmMedium: validatedData.utmMedium || null,
        utmCampaign: validatedData.utmCampaign || null,
        metadata: JSON.stringify(metadata),
        submittedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    // Record popup events for analytics
    await recordLeadEvents(
      storeId,
      lead.id,
      validatedData,
      discountResult.discountCode || null,
      userAgent,
      ipAddress
    );

    // Determine what to return based on behavior
    const behavior = discountConfig.behavior || "SHOW_CODE_AND_AUTO_APPLY";
    const showCode = shouldShowDiscountCode(behavior);

    // Check if this is a free gift campaign and include product details
    const freeGift = discountConfig.freeGift;
    const freeGiftData =
      freeGift && (freeGift.variantId || freeGift.productId)
        ? {
            variantId: freeGift.variantId || "",
            productId: freeGift.productId || "",
            quantity: freeGift.quantity || 1,
          }
        : undefined;

    if (freeGiftData) {
      console.log("[Lead Submission] Free gift data:", freeGiftData);
    }

    console.log(
      `[Lead Submission] ✅ Created lead ${lead.id} for campaign ${campaign.id} with discount code: ${discountResult.discountCode}`
    );

    return data(
      {
        success: true,
        leadId: lead.id,
        discountCode: showCode ? discountResult.discountCode : undefined,
        discountId: discountResult.discountId,
        isNewCustomer: customerResult.isNewCustomer,
        behavior,
        message: getSuccessMessage(behavior),
        freeGift: freeGiftData, // Include free gift details for cart addition
      },
      {
        status: 200,
        headers: storefrontCors(),
      }
    );
  } catch (error) {
    console.error("[Lead Submission] Error:", error);

    if (error instanceof z.ZodError) {
      return data(
        {
          success: false,
          error: "Invalid request data",
          errors: error.issues,
        },
        { status: 400, headers: storefrontCors() }
      );
    }

    return data(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500, headers: storefrontCors() }
    );
  }
}

/**
 * Record popup events for analytics
 */
async function recordLeadEvents(
  storeId: string,
  leadId: string,
  leadData: z.infer<typeof LeadSubmissionSchema>,
  discountCode: string | null,
  userAgent: string | null,
  ipAddress: string | null
) {
  try {
    // Record submission event
    await PopupEventService.recordEvent({
      storeId,
      campaignId: leadData.campaignId,
      leadId,
      sessionId: leadData.sessionId || leadId,
      visitorId: leadData.visitorId || null,
      eventType: "SUBMIT",
      pageUrl: leadData.pageUrl || null,
      pageTitle: leadData.pageTitle || null,
      referrer: leadData.referrer || null,
      userAgent,
      ipAddress,
      deviceType: null,
      metadata: {
        email: leadData.email,
        marketingConsent: leadData.consent,
        utmSource: leadData.utmSource,
        utmMedium: leadData.utmMedium,
        utmCampaign: leadData.utmCampaign,
        ...leadData.metadata,
      },
    });

    // Record coupon issued event if discount code was generated
    if (discountCode) {
      await PopupEventService.recordEvent({
        storeId,
        campaignId: leadData.campaignId,
        leadId,
        sessionId: leadData.sessionId || leadId,
        visitorId: leadData.visitorId || null,
        eventType: "COUPON_ISSUED",
        pageUrl: leadData.pageUrl || null,
        userAgent,
        ipAddress,
        deviceType: null,
        metadata: {
          discountCode,
        },
      });
    }
  } catch (error) {
    console.error("[Lead Submission] Error recording events:", error);
    // Don't fail the entire process if event recording fails
  }
}

function getClientIP(request: Request): string | null {
  const headers = ["CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP", "X-Client-IP"];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      return value.split(",")[0].trim();
    }
  }

  return null;
}
