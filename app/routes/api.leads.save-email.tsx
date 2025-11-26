/**
 * API endpoint to save email with existing discount code
 * Used by scratch cards to store email after prize is already revealed
 * Does NOT generate a new discount code - uses the one provided
 */

import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import prisma from "~/db.server";
import { storefrontCors } from "~/lib/cors.server";
import { getStoreIdFromShop, createAdminApiContext } from "~/lib/auth-helpers.server";
import {
  upsertCustomer,
  sanitizeCustomerData,
  extractCustomerId,
  type CustomerUpsertData,
} from "~/lib/shopify/customer.server";
import {
  checkRateLimit,
  createEmailCampaignKey,
  RATE_LIMITS,
} from "~/domains/security/services/rate-limit.server";

const SaveEmailSchema = z.object({
  email: z.string().email(),
  campaignId: z.string(),
  sessionId: z.string(),
  discountCode: z.string(), // REQUIRED: The existing discount code to associate with this email
  visitorId: z.string().optional(),
  consent: z.boolean().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  pageUrl: z.string().optional(),
  referrer: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  console.log("[Save Email] Processing request");

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: storefrontCors() });
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
    const validatedData = SaveEmailSchema.parse(body);

    // PREVIEW MODE: Return mock success
    // BYPASS RATE LIMITING and database checks for preview mode
    const isPreviewCampaign = validatedData.campaignId.startsWith("preview-");
    if (isPreviewCampaign) {
      console.log(`[Save Email] ✅ Preview mode - returning mock success (BYPASSING RATE LIMITS)`);
      return data(
        {
          success: true,
          leadId: "preview-lead-id",
          discountCode: validatedData.discountCode,
          message: "Preview mode: Email saved (mock data)",
        },
        { status: 200, headers: storefrontCors() }
      );
    }

    // SECURITY: Verify discount code exists and was generated for this campaign/session
    // This prevents abuse by ensuring the discount code was legitimately generated
    const leadWithDiscountCode = await prisma.lead.findFirst({
      where: {
        discountCode: validatedData.discountCode,
        campaignId: validatedData.campaignId,
        sessionId: validatedData.sessionId,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!leadWithDiscountCode) {
      console.warn(
        `[Save Email] Invalid discount code or session mismatch: ${validatedData.discountCode}`
      );
      return data(
        {
          success: false,
          error: "Invalid discount code. Please refresh and try again.",
        },
        { status: 403, headers: storefrontCors() }
      );
    }

    // If email already exists and is not an anonymous placeholder, return success (idempotent)
    const isAnonymousEmail = leadWithDiscountCode.email?.endsWith("@anonymous.local");
    if (leadWithDiscountCode.email && !isAnonymousEmail) {
      console.log(
        `[Save Email] Email already exists for lead ${leadWithDiscountCode.id}, returning success`
      );
      return data(
        {
          success: true,
          leadId: leadWithDiscountCode.id,
          discountCode: validatedData.discountCode,
          message: "Email already saved",
        },
        {
          status: 200,
          headers: storefrontCors(),
        }
      );
    }

    // SECURITY: Rate limit per email+campaign (once per day)
    const rateLimitKey = createEmailCampaignKey(validatedData.email, validatedData.campaignId);
    const rateLimitResult = await checkRateLimit(
      rateLimitKey,
      "save_email",
      RATE_LIMITS.EMAIL_PER_CAMPAIGN,
      { email: validatedData.email, campaignId: validatedData.campaignId }
    );

    if (!rateLimitResult.allowed) {
      console.warn(`[Save Email] Rate limit exceeded for ${validatedData.email}`);
      return data(
        {
          success: false,
          error: "You've already submitted for this campaign today",
          retryAfter: rateLimitResult.resetAt,
        },
        { status: 429, headers: storefrontCors() }
      );
    }

    console.log("[Save Email] Validated data:", {
      email: validatedData.email,
      campaignId: validatedData.campaignId,
      discountCode: validatedData.discountCode,
    });

    // Get campaign and store with access token
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: validatedData.campaignId,
        storeId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
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

    // Initialize Shopify admin API
    if (!campaign.store.accessToken) {
      console.warn("[Save Email] Cannot create customer: missing access token");
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
      source: "revenue-boost-scratch-card",
      campaignId: validatedData.campaignId,
    });

    // Upsert customer in Shopify
    const customerResult = await upsertCustomer(admin, customerData);
    if (!customerResult.success) {
      console.warn("[Save Email] Failed to create/update customer:", customerResult.errors);
      // Continue without customer - not critical
    }

    // Update the existing lead record with email and customer info
    const lead = await prisma.lead.update({
      where: {
        id: leadWithDiscountCode.id,
      },
      data: {
        email: validatedData.email.toLowerCase(),
        firstName: validatedData.firstName || null,
        lastName: validatedData.lastName || null,
        phone: validatedData.phone || null,
        marketingConsent: validatedData.consent || false,
        shopifyCustomerId: customerResult.shopifyCustomerId
          ? BigInt(extractCustomerId(customerResult.shopifyCustomerId))
          : null,
        referrer: validatedData.referrer || null,
        pageUrl: validatedData.pageUrl || null,
      },
    });

    console.log(`[Save Email] Lead updated successfully: ${lead.id}`);

    return data(
      {
        success: true,
        leadId: lead.id,
        discountCode: validatedData.discountCode,
        isNewCustomer: customerResult.isNewCustomer,
        message: "Email saved successfully",
      },
      {
        status: 200,
        headers: storefrontCors(),
      }
    );
  } catch (error) {
    console.error("[Save Email] Error:", error);

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
