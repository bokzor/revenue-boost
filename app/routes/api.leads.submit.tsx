/**
 * Lead Submission API Endpoint
 * 
 * POST /api/leads/submit
 * Handles email submissions from popups and generates discount codes
 */

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { z } from "zod";
import prisma from "~/db.server";
import { storefrontCors } from "~/lib/cors.server";
import { getStoreIdFromShop } from "~/lib/auth-helpers.server";
import { generateDiscountCode } from "~/domains/popups/services/discounts/discount.server";

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
  referrer: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: storefrontCors(request),
    });
  }

  if (request.method !== "POST") {
    return data(
      { success: false, error: "Method not allowed" },
      { status: 405, headers: storefrontCors(request) }
    );
  }

  try {
    // Get shop domain from headers
    const shop = new URL(request.url).searchParams.get("shop");
    if (!shop) {
      return data(
        { success: false, error: "Missing shop parameter" },
        { status: 400, headers: storefrontCors(request) }
      );
    }

    const storeId = await getStoreIdFromShop(shop);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = LeadSubmissionSchema.parse(body);

    // Get campaign and its discount config
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: validatedData.campaignId,
        storeId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        discountConfig: true,
      },
    });

    if (!campaign) {
      return data(
        { success: false, error: "Campaign not found or inactive" },
        { status: 404, headers: storefrontCors(request) }
      );
    }

    // Parse discount config
    const discountConfig = typeof campaign.discountConfig === 'string' 
      ? JSON.parse(campaign.discountConfig)
      : campaign.discountConfig;

    // Generate discount code if enabled
    let discountCode: string | undefined;
    if (discountConfig?.enabled) {
      const type = (discountConfig.type || discountConfig.valueType?.toLowerCase()) as "percentage" | "fixed_amount" | "free_shipping";
      const value = discountConfig.value || 10;
      const prefix = discountConfig.prefix || "WELCOME";
      const expiryDays = discountConfig.expiryDays || 30;

      const generated = generateDiscountCode({
        type,
        value,
        prefix,
        expiresInDays: expiryDays,
        usageLimit: discountConfig.usageLimit,
      });

      discountCode = generated.code;
    }

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
        discountCode: discountCode || null,
        userAgent: request.headers.get("User-Agent") || null,
        ipAddress: getClientIP(request),
        referrer: validatedData.referrer || null,
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
      },
      select: {
        id: true,
      },
    });

    console.log(`[Lead Submission] Created lead ${lead.id} for campaign ${campaign.id} with discount code: ${discountCode}`);

    return data(
      {
        success: true,
        leadId: lead.id,
        discountCode: discountCode || null,
      },
      {
        status: 200,
        headers: storefrontCors(request),
      }
    );
  } catch (error) {
    console.error("[Lead Submission] Error:", error);
    
    if (error instanceof z.ZodError) {
      return data(
        {
          success: false,
          error: "Invalid request data",
          errors: error.errors,
        },
        { status: 400, headers: storefrontCors(request) }
      );
    }

    return data(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500, headers: storefrontCors(request) }
    );
  }
}

function getClientIP(request: Request): string | null {
  const headers = [
    "CF-Connecting-IP",
    "X-Forwarded-For",
    "X-Real-IP",
    "X-Client-IP",
  ];
  
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      return value.split(",")[0].trim();
    }
  }
  
  return null;
}

