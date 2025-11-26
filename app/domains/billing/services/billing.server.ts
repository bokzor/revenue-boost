import prisma from "~/db.server";
import { BILLING_PLANS } from "~/shopify.server";
import { PLAN_DEFINITIONS, type PlanTier } from "../types/plan";

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

// Map Shopify subscription names to our PlanTier enum
const PLAN_NAME_TO_TIER: Record<string, PlanTier> = {
  [BILLING_PLANS.STARTER]: "STARTER",
  [BILLING_PLANS.GROWTH]: "GROWTH",
  [BILLING_PLANS.PRO]: "PRO",
  [BILLING_PLANS.ENTERPRISE]: "ENTERPRISE",
};

// =============================================================================
// BILLING SERVICE
// =============================================================================

export class BillingService {
  /**
   * Get the current subscription status from Shopify and sync to database
   */
  static async getCurrentSubscription(
    admin: AdminGraphQL,
    shopDomain: string
  ): Promise<BillingContext> {
    // Query Shopify for current app installation and active subscriptions
    const response = await admin.graphql(`
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

    const data = await response.json();
    const subscriptions = data.data?.currentAppInstallation?.activeSubscriptions || [];

    // Find active subscription (there should only be one)
    const activeSubscription = subscriptions.find(
      (sub: any) => sub.status === "ACTIVE" || sub.status === "PENDING"
    );

    if (!activeSubscription) {
      // No active subscription - user is on FREE plan
      return {
        planTier: "FREE",
        hasActiveSubscription: false,
        subscription: null,
        isTrialing: false,
        trialEndsAt: null,
      };
    }

    // Map subscription name to plan tier
    const planTier = PLAN_NAME_TO_TIER[activeSubscription.name] || "FREE";

    // Check if in trial period
    const isTrialing = activeSubscription.trialDays > 0;
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
   */
  static async syncSubscriptionToDatabase(
    admin: AdminGraphQL,
    shopDomain: string
  ): Promise<BillingContext> {
    const billingContext = await this.getCurrentSubscription(admin, shopDomain);

    // Update store record with subscription info
    await prisma.store.updateMany({
      where: { shopifyDomain: shopDomain },
      data: {
        planTier: billingContext.planTier,
        planStatus: billingContext.isTrialing ? "TRIALING" : 
                    billingContext.hasActiveSubscription ? "ACTIVE" : "CANCELLED",
        shopifySubscriptionId: billingContext.subscription?.id || null,
        shopifySubscriptionStatus: billingContext.subscription?.status || null,
        shopifySubscriptionName: billingContext.subscription?.name || null,
        trialEndsAt: billingContext.trialEndsAt,
        currentPeriodEnd: billingContext.subscription?.currentPeriodEnd
          ? new Date(billingContext.subscription.currentPeriodEnd)
          : null,
      },
    });

    return billingContext;
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
}

