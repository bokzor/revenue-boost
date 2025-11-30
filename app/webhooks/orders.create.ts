import { Prisma } from "@prisma/client";
import prisma from "~/db.server";

// Attribution window for view-through conversions (7 days in milliseconds)
const VIEW_THROUGH_ATTRIBUTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface OrderPayload {
  id: number;
  name: string;
  total_price: string;
  currency: string;
  customer?: {
    id: number;
  };
  discount_codes: Array<{
    code: string;
    amount: string;
    type: string;
  }>;
  source_name: string;
  landing_site?: string;
  referring_site?: string;
}

export async function handleOrderCreate(shop: string, payload: OrderPayload) {
  console.log(`[Webhook] Processing ORDERS_CREATE for ${shop}`, {
    orderId: payload.id,
    orderNumber: payload.name,
    discounts: payload.discount_codes,
    customerId: payload.customer?.id,
  });

  // 1. Find store
  const store = await prisma.store.findUnique({
    where: { shopifyDomain: shop },
  });

  if (!store) {
    console.error(`[Webhook] Store not found for shop ${shop}`);
    return;
  }

  // Track if we've already attributed this order to prevent double-counting
  let attributed = false;

  // 2. First, try discount code attribution (highest confidence)
  if (payload.discount_codes && payload.discount_codes.length > 0) {
    for (const discount of payload.discount_codes) {
      const code = discount.code;

      // Try to find a campaign that generated this code
      // Check Lead table first (for unique codes from Spin To Win, Scratch Card, etc.)
      const lead = await prisma.lead.findFirst({
        where: {
          storeId: store.id,
          discountCode: code,
        },
        include: {
          campaign: true,
        },
      });

      if (lead) {
        console.log(`[Webhook] Found lead attribution for code ${code}`, {
          leadId: lead.id,
          campaignId: lead.campaignId,
        });

        await recordConversion({
          storeId: store.id,
          campaignId: lead.campaignId,
          orderPayload: payload,
          discountCode: code,
          discountAmount: discount.amount,
          customerId: lead.shopifyCustomerId ? String(lead.shopifyCustomerId) : undefined,
          source: "discount_code",
        });
        attributed = true;
        continue;
      }

      // If not found in leads, attempt static/prefix matching from campaign.discountConfig
      const campaign = await findCampaignByDiscountCode(store.id, code);
      if (campaign) {
        console.log(`[Webhook] Found campaign attribution for code ${code}`, {
          campaignId: campaign.id,
        });

        await recordConversion({
          storeId: store.id,
          campaignId: campaign.id,
          orderPayload: payload,
          discountCode: code,
          discountAmount: discount.amount,
          customerId: payload.customer ? String(payload.customer.id) : undefined,
          source: "discount_code",
        });
        attributed = true;
      }
    }
  }

  // 3. If no discount code attribution, try view-through attribution
  // This captures conversions where user saw/interacted with popup but didn't use code
  if (!attributed && payload.customer?.id) {
    await tryViewThroughAttribution(store.id, payload);
  }
}

/**
 * Attempt view-through attribution for orders without discount codes.
 *
 * Looks for recent popup interactions (VIEW, SUBMIT, CLICK) by the customer
 * within the attribution window. This captures:
 * - User saw popup, closed it, but was influenced to purchase
 * - User submitted email but forgot to use the code
 * - Newsletter signups that led to purchase without discount
 */
async function tryViewThroughAttribution(
  storeId: string,
  payload: OrderPayload
): Promise<void> {
  const customerId = payload.customer?.id;
  if (!customerId) return;

  const attributionWindowStart = new Date(Date.now() - VIEW_THROUGH_ATTRIBUTION_WINDOW_MS);

  console.log(`[Webhook] Attempting view-through attribution for customer ${customerId}`);

  // Strategy 1: Find leads by Shopify customer ID (most reliable)
  const leadByCustomer = await prisma.lead.findFirst({
    where: {
      storeId,
      shopifyCustomerId: BigInt(customerId),
      createdAt: { gte: attributionWindowStart },
    },
    include: {
      campaign: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (leadByCustomer) {
    console.log(`[Webhook] View-through: Found lead for customer ${customerId}`, {
      leadId: leadByCustomer.id,
      campaignId: leadByCustomer.campaignId,
      hadDiscountCode: !!leadByCustomer.discountCode,
    });

    await recordConversion({
      storeId,
      campaignId: leadByCustomer.campaignId,
      orderPayload: payload,
      discountCode: null,
      discountAmount: "0",
      customerId: String(customerId),
      source: leadByCustomer.discountCode ? "view_through_with_code" : "view_through",
    });
    return;
  }

  // Strategy 2: Find popup events by customer ID in metadata
  // This catches cases where we tracked impressions but no lead was created
  // (e.g., user saw popup but didn't submit)
  const recentPopupEvent = await prisma.popupEvent.findFirst({
    where: {
      storeId,
      eventType: { in: ["VIEW", "SUBMIT", "CLICK"] },
      createdAt: { gte: attributionWindowStart },
      // Look for customer ID in metadata (stored during checkout tracking)
      metadata: {
        path: ["customerId"],
        equals: String(customerId),
      },
    },
    include: {
      campaign: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentPopupEvent) {
    console.log(`[Webhook] View-through: Found popup event for customer ${customerId}`, {
      eventId: recentPopupEvent.id,
      eventType: recentPopupEvent.eventType,
      campaignId: recentPopupEvent.campaignId,
    });

    await recordConversion({
      storeId,
      campaignId: recentPopupEvent.campaignId,
      orderPayload: payload,
      discountCode: null,
      discountAmount: "0",
      customerId: String(customerId),
      source: "view_through",
    });
    return;
  }

  console.log(`[Webhook] No view-through attribution found for customer ${customerId}`);
}

async function recordConversion(params: {
  storeId: string;
  campaignId: string;
  orderPayload: OrderPayload;
  discountCode: string | null;
  discountAmount: string;
  customerId?: string;
  source: string;
}) {
  const { campaignId, orderPayload, discountCode, discountAmount, customerId, source } = params;

  try {
    await prisma.campaignConversion.create({
      data: {
        campaignId,
        orderId: String(orderPayload.id),
        orderNumber: orderPayload.name,
        totalPrice: orderPayload.total_price,
        discountAmount: discountAmount,
        discountCodes: discountCode ? [discountCode] : [],
        customerId:
          customerId || (orderPayload.customer ? String(orderPayload.customer.id) : undefined),
        source,
      },
    });
    console.log(`[Webhook] Recorded conversion for campaign ${campaignId} (source: ${source})`);
  } catch (error) {
    // Ignore unique constraint violations (idempotency)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      console.log(`[Webhook] Conversion already recorded for order ${orderPayload.id}`);
    } else {
      console.error("[Webhook] Failed to record conversion:", error);
    }
  }
}

/**
 * Attempt to match a discount code to a campaign using static code or prefix.
 * Falls back to a simple in-memory scan of active campaigns for the store.
 */
async function findCampaignByDiscountCode(storeId: string, code: string) {
  // Quick win: prefix convention for generated codes
  const DEFAULT_PREFIX = "REVENUE-BOOST-";
  const campaigns = await prisma.campaign.findMany({
    where: {
      storeId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      discountConfig: true,
    },
  });

  for (const campaign of campaigns) {
    const config = parseDiscountConfig(campaign.discountConfig);
    if (!config) continue;

    if (config.code && config.code === code) {
      return campaign;
    }

    if (config.prefix && code.startsWith(config.prefix)) {
      return campaign;
    }

    if (!config.prefix && code.startsWith(DEFAULT_PREFIX)) {
      return campaign;
    }
  }

  return null;
}

function parseDiscountConfig(raw: unknown): { code?: string; prefix?: string } | null {
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null) {
    const parsed = raw as { code?: string; prefix?: string };
    return parsed;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as { code?: string; prefix?: string };
      return parsed;
    } catch (error) {
      console.warn("[Webhook] Failed to parse discountConfig JSON", error);
      return null;
    }
  }
  return null;
}
