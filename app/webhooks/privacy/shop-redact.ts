/**
 * Handler for shop/redact webhook
 *
 * Deletes all shop data when Shopify instructs us to redact a shop.
 * This webhook is triggered 48 hours after a shop uninstalls the app.
 *
 * IMPORTANT: This handler is idempotent - multiple calls for the same shop will not cause errors.
 */

import prisma from "~/db.server";
import type { ShopRedactPayload } from "./types";

export async function handleShopRedact(shop: string, payload: ShopRedactPayload): Promise<void> {
  console.log(`[Privacy Webhook] Processing shop/redact for ${shop}`, {
    shopId: payload.shop_id,
    shopDomain: payload.shop_domain,
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

  // Delete all shop data in a transaction
  // Note: Prisma cascade deletes will handle related records automatically
  // based on the schema's onDelete: Cascade settings
  await prisma.$transaction(async (tx) => {
    // 1. Delete all sessions for this shop
    const deletedSessions = await tx.session.deleteMany({
      where: { shop },
    });
    console.log(`[Privacy Webhook] Deleted ${deletedSessions.count} sessions`);

    // 2. Delete the store record
    // This will cascade delete:
    // - Campaigns (and their Leads, PopupEvents, CampaignConversions via cascade)
    // - Experiments
    // - Templates (store-specific only)
    // - CustomerSegments (store-specific only)
    // - SegmentMemberships
    const deletedStore = await tx.store.delete({
      where: { id: store.id },
    });
    console.log(`[Privacy Webhook] Deleted store ${deletedStore.id}`);

    // 3. Clean up any orphaned security records
    // ChallengeTokens and RateLimitLogs don't have direct foreign keys,
    // but we can clean them up based on timing or leave them to expire naturally
    // For now, we'll leave them as they don't contain shop PII
  });

  console.log(`[Privacy Webhook] Successfully redacted all data for shop ${shop}`);
}
