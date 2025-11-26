/**
 * Shared billing constants
 *
 * Single source of truth for plan name and status mappings
 * used across billing service and webhooks.
 */

import type { PlanTier, PlanStatus } from "./types/plan";
import { BILLING_PLANS } from "~/shopify.server";

// =============================================================================
// SHOPIFY SUBSCRIPTION TYPES
// =============================================================================

/**
 * Shopify subscription object from GraphQL API
 */
export interface ShopifySubscription {
  id: string;
  name: string;
  status: string;
  currentPeriodEnd?: string;
  trialDays?: number;
  test: boolean;
}

/**
 * Valid Shopify subscription statuses
 * @see https://shopify.dev/docs/api/admin-graphql/latest/enums/AppSubscriptionStatus
 */
export type ShopifySubscriptionStatus =
  | "ACTIVE"
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "FROZEN"
  | "CANCELLED";

// =============================================================================
// PLAN MAPPINGS
// =============================================================================

/**
 * Map Shopify subscription plan names to our internal PlanTier enum
 */
export const PLAN_NAME_TO_TIER: Record<string, PlanTier> = {
  [BILLING_PLANS.STARTER]: "STARTER",
  [BILLING_PLANS.GROWTH]: "GROWTH",
  [BILLING_PLANS.PRO]: "PRO",
  [BILLING_PLANS.ENTERPRISE]: "ENTERPRISE",
};

/**
 * Map Shopify subscription status to our internal PlanStatus enum
 */
export const SHOPIFY_STATUS_TO_PLAN_STATUS: Record<ShopifySubscriptionStatus, PlanStatus> = {
  ACTIVE: "ACTIVE",
  PENDING: "TRIALING",
  ACCEPTED: "ACTIVE",
  DECLINED: "CANCELLED",
  EXPIRED: "CANCELLED",
  FROZEN: "PAST_DUE",
  CANCELLED: "CANCELLED",
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get PlanTier from Shopify subscription name with logging for unknown names
 */
export function getPlanTierFromName(subscriptionName: string): PlanTier {
  const tier = PLAN_NAME_TO_TIER[subscriptionName];
  if (!tier) {
    console.warn(
      `[Billing] Unknown subscription name: "${subscriptionName}". ` +
        `Known names: ${Object.keys(PLAN_NAME_TO_TIER).join(", ")}. Defaulting to FREE.`
    );
    return "FREE";
  }
  return tier;
}

/**
 * Get PlanStatus from Shopify subscription status with logging for unknown statuses
 */
export function getPlanStatusFromShopifyStatus(shopifyStatus: string): PlanStatus {
  const status = SHOPIFY_STATUS_TO_PLAN_STATUS[shopifyStatus as ShopifySubscriptionStatus];
  if (!status) {
    console.warn(
      `[Billing] Unknown Shopify subscription status: "${shopifyStatus}". ` +
        `Known statuses: ${Object.keys(SHOPIFY_STATUS_TO_PLAN_STATUS).join(", ")}. Defaulting to CANCELLED.`
    );
    return "CANCELLED";
  }
  return status;
}

/**
 * Check if a Shopify status indicates the subscription is being cancelled
 */
export function isSubscriptionBeingCancelled(shopifyStatus: string): boolean {
  return (
    shopifyStatus === "CANCELLED" ||
    shopifyStatus === "EXPIRED" ||
    shopifyStatus === "DECLINED"
  );
}

// =============================================================================
// SYNC CONFIGURATION
// =============================================================================

/**
 * How often to sync billing status from Shopify (in milliseconds)
 * Default: 5 minutes
 */
export const BILLING_SYNC_TTL_MS = 5 * 60 * 1000;

