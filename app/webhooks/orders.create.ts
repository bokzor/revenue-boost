import { Prisma } from "@prisma/client";
import prisma from "~/db.server";

interface OrderPayload {
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
  });

  if (!payload.discount_codes || payload.discount_codes.length === 0) {
    console.log("[Webhook] No discount codes in order, skipping attribution");
    return;
  }

  // 1. Find store
  const store = await prisma.store.findUnique({
    where: { shopifyDomain: shop },
  });

  if (!store) {
    console.error(`[Webhook] Store not found for shop ${shop}`);
    return;
  }

  // 2. Check each discount code to see if it belongs to a campaign
  for (const discount of payload.discount_codes) {
    const code = discount.code;

    // Try to find a campaign that generated this code
    // We check two places:
    // A. The Campaign model itself (if it has a static code or prefix)
    // B. The Lead model (if we stored the generated code there)
    // C. The PopupEvent metadata (if we stored it there)

    // For MVP, let's look up the code in the Lead table first, as that's the most direct link
    // for unique codes.
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
      continue; // Done with this code
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
    }
  }
}

async function recordConversion(params: {
  storeId: string;
  campaignId: string;
  orderPayload: OrderPayload;
  discountCode: string;
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
        discountCodes: [discountCode],
        customerId:
          customerId || (orderPayload.customer ? String(orderPayload.customer.id) : undefined),
        source,
      },
    });
    console.log(`[Webhook] Recorded conversion for campaign ${campaignId}`);
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
