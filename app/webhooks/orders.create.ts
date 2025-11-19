import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
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

export async function handleOrderCreate(
    shop: string,
    payload: OrderPayload,
    _admin: AdminApiContext | undefined
) {
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

        // If not found in leads, check if it matches a campaign's static code config
        // This is heavier, so we might want to optimize later.
        // For now, we can search campaigns where discountConfig contains the code.
        // Note: This is tricky with JSON fields.
        // A better approach for static codes is to rely on a naming convention or just skip for now if not unique.
        // Let's try to find by matching the code in the JSON config (Postgres JSONB query)

        // Simplified: Fetch active campaigns and check their config in memory (not ideal for scale but fine for MVP)
        // Or use a raw query.

        // Let's skip static code matching for this iteration unless requested, 
        // as unique codes are the primary use case for Revenue Boost.
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
                customerId: customerId || (orderPayload.customer ? String(orderPayload.customer.id) : undefined),
                source,
            },
        });
        console.log(`[Webhook] Recorded conversion for campaign ${campaignId}`);
    } catch (error) {
        // Ignore unique constraint violations (idempotency)
        if ((error as any).code === 'P2002') {
            console.log(`[Webhook] Conversion already recorded for order ${orderPayload.id}`);
        } else {
            console.error("[Webhook] Failed to record conversion:", error);
        }
    }
}
