import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { BILLING_PLANS } from "../shopify.server";
import type { PlanTier } from "../domains/billing/types/plan";

// Map Shopify subscription names to our PlanTier enum
const PLAN_NAME_TO_TIER: Record<string, PlanTier> = {
  [BILLING_PLANS.STARTER]: "STARTER",
  [BILLING_PLANS.GROWTH]: "GROWTH",
  [BILLING_PLANS.PRO]: "PRO",
  [BILLING_PLANS.ENTERPRISE]: "ENTERPRISE",
};

// Map Shopify subscription status to our PlanStatus
const STATUS_MAP: Record<string, "ACTIVE" | "TRIALING" | "CANCELLED" | "PAST_DUE"> = {
  ACTIVE: "ACTIVE",
  PENDING: "TRIALING",
  ACCEPTED: "ACTIVE",
  DECLINED: "CANCELLED",
  EXPIRED: "CANCELLED",
  FROZEN: "PAST_DUE",
  CANCELLED: "CANCELLED",
};

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

  // Determine the plan tier from subscription name
  const planTier: PlanTier = PLAN_NAME_TO_TIER[subscription.name] || "FREE";
  const planStatus = STATUS_MAP[subscription.status] || "CANCELLED";

  // Check if subscription is being cancelled (downgrade to free)
  const isBeingCancelled = subscription.status === "CANCELLED" || 
                            subscription.status === "EXPIRED" ||
                            subscription.status === "DECLINED";

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

