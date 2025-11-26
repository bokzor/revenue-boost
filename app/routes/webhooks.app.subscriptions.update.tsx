import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  getPlanTierFromName,
  getPlanStatusFromShopifyStatus,
  isSubscriptionBeingCancelled,
} from "../domains/billing/constants";

interface SubscriptionWebhookPayload {
  app_subscription: {
    admin_graphql_api_id: string;
    name: string;
    status: string;
    admin_graphql_api_shop_id: string;
    created_at: string;
    updated_at: string;
    currency: string;
    capped_amount?: string;
  };
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`[Billing Webhook] Received ${topic} webhook for ${shop}`);

  if (!payload) {
    console.error("[Billing Webhook] No payload received");
    return new Response("No payload", { status: 400 });
  }

  const subscriptionPayload = payload as SubscriptionWebhookPayload;
  const subscription = subscriptionPayload.app_subscription;

  if (!subscription) {
    console.error("[Billing Webhook] No app_subscription in payload");
    return new Response("Invalid payload", { status: 400 });
  }

  console.log(`[Billing Webhook] Subscription update:`, {
    id: subscription.admin_graphql_api_id,
    name: subscription.name,
    status: subscription.status,
  });

  // Determine the plan tier and status using shared helpers (with logging for unknowns)
  const planTier = getPlanTierFromName(subscription.name);
  const planStatus = getPlanStatusFromShopifyStatus(subscription.status);

  // Check if subscription is being cancelled (downgrade to free)
  const isBeingCancelled = isSubscriptionBeingCancelled(subscription.status);

  try {
    // Update the store record
    const updateResult = await prisma.store.updateMany({
      where: { shopifyDomain: shop },
      data: {
        planTier: isBeingCancelled ? "FREE" : planTier,
        planStatus: planStatus,
        shopifySubscriptionId: isBeingCancelled ? null : subscription.admin_graphql_api_id,
        shopifySubscriptionStatus: subscription.status,
        shopifySubscriptionName: isBeingCancelled ? null : subscription.name,
        billingLastSyncedAt: new Date(), // Update sync timestamp
      },
    });

    console.log(`[Billing Webhook] Updated ${updateResult.count} store(s) for ${shop}`);
    console.log(`[Billing Webhook] New plan: ${isBeingCancelled ? "FREE" : planTier}, status: ${planStatus}`);

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[Billing Webhook] Error updating store:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
};

