import { logger } from "~/lib/logger.server";
import prisma from "~/db.server";
import { logger } from "~/lib/logger.server";
import { BILLING_PLANS } from "~/shopify.server";
import { PLAN_DEFINITIONS, type PlanTier } from "../types/plan";
import {
  type ShopifySubscription,
  getPlanTierFromName,
  BILLING_SYNC_TTL_MS,
} from "../constants";
import { isBillingBypassed } from "~/lib/env.server";

// =============================================================================
// TYPES
// =============================================================================

// Admin GraphQL client type (from authenticate.admin())
interface AdminGraphQL {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
}

export interface SubscriptionInfo {
  id: string;
  name: string;
  status: string;
  currentPeriodEnd?: string;
  trialDays?: number;
  test: boolean;
}

export interface BillingContext {
  planTier: PlanTier;
  hasActiveSubscription: boolean;
  subscription: SubscriptionInfo | null;
  isTrialing: boolean;
  trialEndsAt: Date | null;
}

/**
 * GraphQL response structure for subscription query
 */
interface SubscriptionQueryResponse {
  data?: {
    currentAppInstallation?: {
      activeSubscriptions?: ShopifySubscription[];
    };
  };
  errors?: Array<{ message: string }>;
}

/**
 * Error thrown when Shopify API fails - prevents accidental downgrades
 */
export class BillingApiError extends Error {
  constructor(message: string, public readonly isTransient: boolean = true) {
    super(message);
    this.name = "BillingApiError";
  }
}

// =============================================================================
// BILLING SERVICE
// =============================================================================

export class BillingService {
  /**
   * Get the current subscription status from Shopify
   *
   * @throws {BillingApiError} If the Shopify API call fails (to prevent accidental downgrades)
   */
  static async getCurrentSubscription(
    admin: AdminGraphQL,
    shopDomain: string
  ): Promise<BillingContext> {
    // Query Shopify for current app installation and active subscriptions
    let response: Response;
    try {
      response = await admin.graphql(`
        query GetCurrentSubscription {
          currentAppInstallation {
            activeSubscriptions {
              id
              name
              status
              currentPeriodEnd
              trialDays
              test
            }
          }
        }
      `);
    } catch (error) {
      logger.error({ error }, "[BillingService] GraphQL request failed for ${shopDomain}:");
      throw new BillingApiError(
        `Failed to query Shopify subscription API for ${shopDomain}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Check for HTTP errors
    if (!response.ok) {
      logger.error("[BillingService] Shopify API returned ${response.status}");
      throw new BillingApiError(
        `Shopify API returned status ${response.status}`,
        response.status >= 500 // 5xx errors are transient
      );
    }

    const data = (await response.json()) as SubscriptionQueryResponse;

    // Check for GraphQL errors
    if (data.errors && data.errors.length > 0) {
      const errorMessages = data.errors.map((e) => e.message).join(", ");
      logger.error({ errors: data.errors }, "[BillingService] GraphQL errors");
      throw new BillingApiError(`GraphQL errors: ${errorMessages}`);
    }

    // Validate response structure
    if (!data.data?.currentAppInstallation) {
      logger.error({ response: data }, "[BillingService] Unexpected response structure");
      throw new BillingApiError("Unexpected GraphQL response structure");
    }

    const subscriptions = data.data.currentAppInstallation.activeSubscriptions || [];

    // Find active subscription (there should only be one)
    const activeSubscription = subscriptions.find(
      (sub: ShopifySubscription) => sub.status === "ACTIVE" || sub.status === "PENDING"
    );

    if (!activeSubscription) {
      // No active subscription - user is on FREE plan
      // This is a legitimate state, not an error
      return {
        planTier: "FREE",
        hasActiveSubscription: false,
        subscription: null,
        isTrialing: false,
        trialEndsAt: null,
      };
    }

    // Map subscription name to plan tier (with logging for unknown names)
    const planTier = getPlanTierFromName(activeSubscription.name);

    // Check if in trial period
    const isTrialing = (activeSubscription.trialDays ?? 0) > 0;
    const trialEndsAt = activeSubscription.currentPeriodEnd
      ? new Date(activeSubscription.currentPeriodEnd)
      : null;

    return {
      planTier,
      hasActiveSubscription: true,
      subscription: {
        id: activeSubscription.id,
        name: activeSubscription.name,
        status: activeSubscription.status,
        currentPeriodEnd: activeSubscription.currentPeriodEnd,
        trialDays: activeSubscription.trialDays,
        test: activeSubscription.test,
      },
      isTrialing,
      trialEndsAt,
    };
  }

  /**
   * Sync subscription status from Shopify to database
   *
   * If the Shopify API call fails, this method returns the cached database
   * state to prevent accidental downgrades of paying customers.
   */
  static async syncSubscriptionToDatabase(
    admin: AdminGraphQL,
    shopDomain: string
  ): Promise<BillingContext> {
    let billingContext: BillingContext;

    try {
      billingContext = await this.getCurrentSubscription(admin, shopDomain);
    } catch (error) {
      // On API error, fall back to database state to prevent accidental downgrades
      if (error instanceof BillingApiError) {
        logger.warn({ shopDomain, errorMessage: error.message }, "[BillingService] API error, falling back to cached state");

        // Try to get cached billing context from database
        const cachedContext = await this.getBillingContextFromDbByDomain(shopDomain);
        if (cachedContext) {
          logger.debug("[BillingService] Using cached billing context for ${shopDomain}");
          return cachedContext;
        }

        // If no cached context exists, this is likely a new store - return FREE
        logger.warn("[BillingService] No cached context for ${shopDomain}, defaulting to FREE");
        return {
          planTier: "FREE",
          hasActiveSubscription: false,
          subscription: null,
          isTrialing: false,
          trialEndsAt: null,
        };
      }
      throw error;
    }

    // Update store record with subscription info
    try {
      await prisma.store.updateMany({
        where: { shopifyDomain: shopDomain },
        data: {
          planTier: billingContext.planTier,
          planStatus: billingContext.isTrialing
            ? "TRIALING"
            : billingContext.hasActiveSubscription
              ? "ACTIVE"
              : "CANCELLED",
          shopifySubscriptionId: billingContext.subscription?.id || null,
          shopifySubscriptionStatus: billingContext.subscription?.status || null,
          shopifySubscriptionName: billingContext.subscription?.name || null,
          trialEndsAt: billingContext.trialEndsAt,
          currentPeriodEnd: billingContext.subscription?.currentPeriodEnd
            ? new Date(billingContext.subscription.currentPeriodEnd)
            : null,
          billingLastSyncedAt: new Date(),
        },
      });
    } catch (dbError) {
      logger.error({ error: dbError }, "[BillingService] Failed to sync subscription to database");
      // Return the billing context anyway - the sync failure shouldn't block the user
    }

    return billingContext;
  }

  /**
   * Get billing context from database by shop domain
   */
  static async getBillingContextFromDbByDomain(shopDomain: string): Promise<BillingContext | null> {
    const store = await prisma.store.findFirst({
      where: { shopifyDomain: shopDomain },
      select: {
        id: true,
        planTier: true,
        planStatus: true,
        shopifySubscriptionId: true,
        shopifySubscriptionStatus: true,
        shopifySubscriptionName: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
      },
    });

    if (!store) return null;

    const planTier = store.planTier as PlanTier;
    const hasActiveSubscription = store.planStatus === "ACTIVE" || store.planStatus === "TRIALING";

    return {
      planTier,
      hasActiveSubscription,
      subscription: store.shopifySubscriptionId
        ? {
            id: store.shopifySubscriptionId,
            name: store.shopifySubscriptionName || "",
            status: store.shopifySubscriptionStatus || "",
            currentPeriodEnd: store.currentPeriodEnd?.toISOString(),
            test: false,
          }
        : null,
      isTrialing: store.planStatus === "TRIALING",
      trialEndsAt: store.trialEndsAt,
    };
  }

  /**
   * Get billing context from database (faster, for non-critical checks)
   */
  static async getBillingContextFromDb(storeId: string): Promise<BillingContext | null> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        planTier: true,
        planStatus: true,
        shopifySubscriptionId: true,
        shopifySubscriptionStatus: true,
        shopifySubscriptionName: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
      },
    });

    if (!store) return null;

    const planTier = store.planTier as PlanTier;
    const hasActiveSubscription = store.planStatus === "ACTIVE" || store.planStatus === "TRIALING";

    return {
      planTier,
      hasActiveSubscription,
      subscription: store.shopifySubscriptionId
        ? {
            id: store.shopifySubscriptionId,
            name: store.shopifySubscriptionName || "",
            status: store.shopifySubscriptionStatus || "",
            currentPeriodEnd: store.currentPeriodEnd?.toISOString(),
            test: false,
          }
        : null,
      isTrialing: store.planStatus === "TRIALING",
      trialEndsAt: store.trialEndsAt,
    };
  }

  /**
   * Get the plan definition for a given tier
   */
  static getPlanDefinition(tier: PlanTier) {
    return PLAN_DEFINITIONS[tier];
  }

  /**
   * Check if a store can access a specific feature
   */
  static async canAccessFeature(
    storeId: string,
    feature: keyof typeof PLAN_DEFINITIONS.FREE.features
  ): Promise<boolean> {
    const context = await this.getBillingContextFromDb(storeId);
    if (!context) return false;

    const planDef = PLAN_DEFINITIONS[context.planTier];
    return planDef.features[feature];
  }

  /**
   * Get the billing plan key for Shopify billing.request()
   */
  static getBillingPlanKey(tier: PlanTier): string | null {
    switch (tier) {
      case "STARTER":
        return BILLING_PLANS.STARTER;
      case "GROWTH":
        return BILLING_PLANS.GROWTH;
      case "PRO":
        return BILLING_PLANS.PRO;
      case "ENTERPRISE":
        return BILLING_PLANS.ENTERPRISE;
      default:
        return null; // FREE has no billing
    }
  }

  /**
   * Get upgrade path for a store
   */
  static getUpgradePath(currentTier: PlanTier): PlanTier[] {
    const tiers: PlanTier[] = ["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"];
    const currentIndex = tiers.indexOf(currentTier);
    return tiers.slice(currentIndex + 1);
  }

  /**
   * Smart sync with caching - only calls Shopify API if cache is stale
   *
   * This is the recommended method for page loaders as it prevents
   * unnecessary API calls on every page load.
   *
   * When BILLING_BYPASS is enabled, this function always returns cached database
   * values without syncing from Shopify.
   */
  static async getOrSyncBillingContext(
    admin: AdminGraphQL,
    shopDomain: string
  ): Promise<BillingContext> {
    const billingBypassed = isBillingBypassed();
    logger.debug("[BillingService] getOrSyncBillingContext - billingBypassed: ${billingBypassed}, shop: ${shopDomain}");

    // First, check if we have a recent cached value
    const store = await prisma.store.findFirst({
      where: { shopifyDomain: shopDomain },
      select: {
        id: true,
        planTier: true,
        planStatus: true,
        shopifySubscriptionId: true,
        shopifySubscriptionStatus: true,
        shopifySubscriptionName: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        billingLastSyncedAt: true,
      },
    });

    logger.debug("[BillingService] Store found: ${!!store}, planTier: ${store?.planTier}, planStatus: ${store?.planStatus}");

    // When billing is bypassed, always use database values (don't sync from Shopify)
    if (billingBypassed && store) {
      logger.debug("[BillingService] Billing bypassed - returning cached DB values for plan: ${store.planTier}");
      const planTier = store.planTier as PlanTier;
      const hasActiveSubscription =
        store.planStatus === "ACTIVE" || store.planStatus === "TRIALING";

      return {
        planTier,
        hasActiveSubscription,
        subscription: store.shopifySubscriptionId
          ? {
              id: store.shopifySubscriptionId,
              name: store.shopifySubscriptionName || "",
              status: store.shopifySubscriptionStatus || "",
              currentPeriodEnd: store.currentPeriodEnd?.toISOString(),
              test: false,
            }
          : null,
        isTrialing: store.planStatus === "TRIALING",
        trialEndsAt: store.trialEndsAt,
      };
    }

    // If we have a store with recent sync, use cached data
    if (store?.billingLastSyncedAt) {
      const timeSinceSync = Date.now() - store.billingLastSyncedAt.getTime();

      if (timeSinceSync < BILLING_SYNC_TTL_MS) {
        // Cache is fresh, return cached context
        const planTier = store.planTier as PlanTier;
        const hasActiveSubscription =
          store.planStatus === "ACTIVE" || store.planStatus === "TRIALING";

        return {
          planTier,
          hasActiveSubscription,
          subscription: store.shopifySubscriptionId
            ? {
                id: store.shopifySubscriptionId,
                name: store.shopifySubscriptionName || "",
                status: store.shopifySubscriptionStatus || "",
                currentPeriodEnd: store.currentPeriodEnd?.toISOString(),
                test: false,
              }
            : null,
          isTrialing: store.planStatus === "TRIALING",
          trialEndsAt: store.trialEndsAt,
        };
      }
    }

    // Cache is stale or doesn't exist - sync from Shopify
    return this.syncSubscriptionToDatabase(admin, shopDomain);
  }
}

