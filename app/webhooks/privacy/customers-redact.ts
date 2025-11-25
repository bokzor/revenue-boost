/**
 * Handler for customers/redact webhook
 * 
 * Deletes or anonymizes all customer PII when Shopify instructs us to redact customer data.
 * This webhook is triggered when a customer requests data deletion or after account deletion.
 * 
 * IMPORTANT: This handler is idempotent - multiple calls for the same customer will not cause errors.
 */

import prisma from "~/db.server";
import { Prisma } from "@prisma/client";
import type { CustomersRedactPayload } from "./types";

export async function handleCustomersRedact(
  shop: string,
  payload: CustomersRedactPayload
): Promise<void> {
  console.log(`[Privacy Webhook] Processing customers/redact for ${shop}`, {
    customerId: payload.customer.id,
    customerEmail: payload.customer.email,
    ordersToRedact: payload.orders_to_redact.length,
  });

  // Find the store
  const store = await prisma.store.findUnique({
    where: { shopifyDomain: shop },
    select: { id: true },
  });

  if (!store) {
    console.warn(`[Privacy Webhook] Store not found for ${shop}, nothing to redact`);
    return;
  }

  const customerId = BigInt(payload.customer.id);
  const customerEmail = payload.customer.email;

  // Execute all deletions in a transaction for atomicity
  await prisma.$transaction(async (tx) => {
    // 1. Delete or anonymize Leads
    // We'll anonymize instead of delete to preserve campaign analytics
    const leadsToAnonymize = await tx.lead.findMany({
      where: {
        storeId: store.id,
        OR: [
          { shopifyCustomerId: customerId },
          { email: customerEmail },
        ],
      },
      select: { id: true },
    });

    if (leadsToAnonymize.length > 0) {
      await tx.lead.updateMany({
        where: {
          id: { in: leadsToAnonymize.map((l) => l.id) },
        },
        data: {
          email: 'redacted@privacy.local',
          firstName: null,
          lastName: null,
          phone: null,
          shopifyCustomerId: null,
          ipAddress: null,
          userAgent: null,
          referrer: null,
          metadata: null,
        },
      });
      console.log(`[Privacy Webhook] Anonymized ${leadsToAnonymize.length} leads`);
    }

    // 2. Anonymize PopupEvents linked to these leads
    const eventsToAnonymize = await tx.popupEvent.findMany({
      where: {
        storeId: store.id,
        leadId: { in: leadsToAnonymize.map((l) => l.id) },
      },
      select: { id: true },
    });

    if (eventsToAnonymize.length > 0) {
      await tx.popupEvent.updateMany({
        where: {
          id: { in: eventsToAnonymize.map((e) => e.id) },
        },
        data: {
          ipAddress: null,
          userAgent: null,
          referrer: null,
          visitorId: null,
          metadata: Prisma.JsonNull,
        },
      });
      console.log(`[Privacy Webhook] Anonymized ${eventsToAnonymize.length} popup events`);
    }

    // 3. Anonymize CampaignConversions
    const conversionsToAnonymize = await tx.campaignConversion.findMany({
      where: {
        customerId: String(payload.customer.id),
        campaign: {
          storeId: store.id,
        },
      },
      select: { id: true },
    });

    if (conversionsToAnonymize.length > 0) {
      await tx.campaignConversion.updateMany({
        where: {
          id: { in: conversionsToAnonymize.map((c) => c.id) },
        },
        data: {
          customerId: null,
        },
      });
      console.log(`[Privacy Webhook] Anonymized ${conversionsToAnonymize.length} conversions`);
    }
  });

  console.log(`[Privacy Webhook] Successfully redacted customer data for ${payload.customer.id}`);
}

