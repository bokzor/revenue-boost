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
  challengeToken: z.string(),
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

    // SECURITY: Validate challenge token before any side-effects
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { validateAndConsumeToken } = await import(
      "~/domains/security/services/challenge-token.server"
    );

    const tokenValidation = await validateAndConsumeToken(
      validatedData.challengeToken,
      validatedData.campaignId,
      validatedData.sessionId,
      ip,
      false // don't enforce strict IP checks to avoid mobile churn issues
    );

    if (!tokenValidation.valid) {
      console.warn(`[Save Email] Token validation failed: ${tokenValidation.error}`);
      return data(
        { success: false, error: tokenValidation.error || "Invalid or expired token" },
        { status: 403, headers: storefrontCors() }
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

    const admin = createAdminApiContext(
      campaign.store.shopifyDomain,
      campaign.store.accessToken
    );

    // Check if lead already exists
    const existingLead = await prisma.lead.findFirst({
      where: {
        storeId,
        campaignId: validatedData.campaignId,
        email: validatedData.email.toLowerCase(),
      },
    });

    if (existingLead) {
      console.log(`[Save Email] Lead already exists: ${existingLead.id}`);
      return data(
        {
          success: true,
          leadId: existingLead.id,
          discountCode: existingLead.discountCode || validatedData.discountCode,
          message: "Email already saved for this campaign",
        },
        { status: 200, headers: storefrontCors() }
      );
    }

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
      console.warn(
        "[Save Email] Failed to create/update customer:",
        customerResult.errors
      );
      // Continue without customer - not critical
    }

    // Create lead record with the PROVIDED discount code
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
        discountCode: validatedData.discountCode, // Use provided code, don't generate new one
        referrer: validatedData.referrer || null,
        pageUrl: validatedData.pageUrl || null,
      },
    });

    console.log(`[Save Email] Lead created successfully: ${lead.id}`);

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
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500, headers: storefrontCors() }
    );
  }
}
