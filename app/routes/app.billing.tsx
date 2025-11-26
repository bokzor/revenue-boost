import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData, useSubmit, useNavigation, redirect, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  Page,
  Card,
  BlockStack,
  Text,
  Badge,
  Button,
  InlineGrid,
  Box,
  InlineStack,
  Divider,
  Icon,
  Banner,
  ProgressBar,
} from "@shopify/polaris";
import { CheckIcon, XIcon, StarFilledIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { PLAN_DEFINITIONS, ENABLED_PLAN_ORDER, type PlanTier, type PlanFeatures } from "../domains/billing/types/plan";
import { BillingService } from "../domains/billing/services/billing.server";
import { isBillingBypassed } from "../lib/env.server";

// =============================================================================
// LOADER
// =============================================================================

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const billingBypassed = isBillingBypassed();

  const store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
  });

  if (!store) {
    throw new Response("Store not found", { status: 404 });
  }

  // When billing is bypassed (staging), use database values directly
  if (billingBypassed) {
    return {
      currentPlan: store.planTier,
      hasActiveSubscription: store.planStatus === "ACTIVE",
      subscription: store.shopifySubscriptionId
        ? { id: store.shopifySubscriptionId }
        : null,
      isTrialing: store.planStatus === "TRIALING",
      trialEndsAt: store.trialEndsAt?.toISOString() || null,
      shopifyHasPayment: false,
      appSubscriptions: [],
      plans: ENABLED_PLAN_ORDER.map((tier) => ({
        tier,
        ...PLAN_DEFINITIONS[tier],
      })),
      billingBypassed: true,
    };
  }

  // Sync subscription status from Shopify
  const billingContext = await BillingService.syncSubscriptionToDatabase(admin, session.shop);

  // Check current billing status using Shopify's billing API
  const { hasActivePayment, appSubscriptions } = await billing.check();

  return {
    currentPlan: billingContext.planTier,
    hasActiveSubscription: billingContext.hasActiveSubscription,
    subscription: billingContext.subscription,
    isTrialing: billingContext.isTrialing,
    trialEndsAt: billingContext.trialEndsAt?.toISOString() || null,
    shopifyHasPayment: hasActivePayment,
    appSubscriptions,
    plans: ENABLED_PLAN_ORDER.map((tier) => ({
      tier,
      ...PLAN_DEFINITIONS[tier],
    })),
    billingBypassed: false,
  };
};

// =============================================================================
// ACTION
// =============================================================================

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const billingBypassed = isBillingBypassed();

  console.log(`[Billing Action] intent: ${intent}, billingBypassed: ${billingBypassed}, shop: ${session.shop}`);

  // When billing is bypassed (staging), update database directly
  if (billingBypassed) {
    if (intent === "subscribe") {
      const planTier = formData.get("planTier") as PlanTier;
      console.log(`[Billing Action] Subscribing to plan: ${planTier}`);

      if (!ENABLED_PLAN_ORDER.includes(planTier)) {
        return { error: "Invalid plan selected" };
      }

      const result = await prisma.store.update({
        where: { shopifyDomain: session.shop },
        data: {
          planTier,
          planStatus: "ACTIVE",
          trialEndsAt: null,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          shopifySubscriptionId: `staging-${planTier}-${Date.now()}`,
          shopifySubscriptionStatus: "ACTIVE",
          shopifySubscriptionName: PLAN_DEFINITIONS[planTier].name,
          billingLastSyncedAt: new Date(),
        },
      });
      console.log(`[Billing Action] Update result - planTier: ${result.planTier}, planStatus: ${result.planStatus}`);

      return redirect("/app/billing");
    }

    if (intent === "cancel") {
      await prisma.store.update({
        where: { shopifyDomain: session.shop },
        data: {
          planTier: "FREE",
          planStatus: "ACTIVE",
          trialEndsAt: null,
          currentPeriodEnd: null,
          shopifySubscriptionId: null,
          shopifySubscriptionStatus: null,
          shopifySubscriptionName: null,
          billingLastSyncedAt: new Date(),
        },
      });

      return redirect("/app/billing");
    }

    return null;
  }

  // Normal billing flow via Shopify Billing API
  if (intent === "subscribe") {
    const planTier = formData.get("planTier") as PlanTier;
    const planKey = BillingService.getBillingPlanKey(planTier);

    if (!planKey) {
      return { error: "Invalid plan selected" };
    }

    // Build the return URL - redirect back to billing page after approval/decline
    const appUrl = process.env.SHOPIFY_APP_URL || `https://${request.headers.get("host")}`;
    const returnUrl = `${appUrl}/app/billing?shop=${session.shop}`;

    // Request billing - this returns a redirect response to Shopify's confirmation page
    return billing.request({
      plan: planKey as "Starter" | "Growth" | "Pro" | "Enterprise",
      isTest: process.env.NODE_ENV !== "production",
      returnUrl,
    });
  }

  if (intent === "cancel") {
    const subscriptionId = formData.get("subscriptionId") as string;

    if (subscriptionId) {
      await billing.cancel({
        subscriptionId,
        prorate: false,
        isTest: process.env.NODE_ENV !== "production",
      });
    }

    return redirect("/app/billing");
  }

  return null;
};

// =============================================================================
// PLAN DESCRIPTIONS & METADATA
// =============================================================================

const PLAN_DESCRIPTIONS: Record<PlanTier, { tagline: string; idealFor: string }> = {
  FREE: {
    tagline: "Get started with basic popups",
    idealFor: "Testing the waters",
  },
  STARTER: {
    tagline: "Professional popups for growing stores",
    idealFor: "Small businesses",
  },
  GROWTH: {
    tagline: "Full-featured conversion toolkit",
    idealFor: "Scaling stores",
  },
  PRO: {
    tagline: "Advanced tools for high-volume stores",
    idealFor: "High-traffic stores",
  },
  ENTERPRISE: {
    tagline: "Custom solutions for large operations",
    idealFor: "Enterprise teams",
  },
};

// Features organized by category for better display
const FEATURE_CATEGORIES: { name: string; features: (keyof PlanFeatures)[] }[] = [
  {
    name: "Core Features",
    features: ["advancedTargeting", "advancedAnalytics", "scheduledCampaigns"],
  },
  {
    name: "Templates",
    features: ["customTemplates", "gamificationTemplates", "socialProofTemplates"],
  },
  {
    name: "Customization",
    features: ["removeBranding", "customCss"],
  },
  {
    name: "Advanced",
    features: ["experiments", "prioritySupport"],
  },
];

const FEATURE_DISPLAY_NAMES: Record<keyof PlanFeatures, string> = {
  experiments: "A/B Testing",
  advancedTargeting: "Advanced Targeting",
  customTemplates: "Custom Templates",
  advancedAnalytics: "Advanced Analytics",
  prioritySupport: "Priority Support",
  removeBranding: "Remove Branding",
  customCss: "Custom CSS",
  gamificationTemplates: "Gamification",
  socialProofTemplates: "Social Proof & FOMO",
  scheduledCampaigns: "Scheduled Campaigns",
};

// =============================================================================
// HELPERS
// =============================================================================

function formatNumber(num: number | null): string {
  if (num === null) return "Unlimited";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface PlanCardProps {
  tier: PlanTier;
  name: string;
  price: number;
  monthlyImpressionCap: number | null;
  features: PlanFeatures;
  limits: Record<string, number | null>;
  isCurrentPlan: boolean;
  isTrialing: boolean;
  onSelect: () => void;
  isLoading: boolean;
  currentPlanTier: PlanTier;
}

function PlanCard({
  tier,
  name,
  price,
  monthlyImpressionCap,
  features,
  limits,
  isCurrentPlan,
  isTrialing,
  onSelect,
  isLoading,
  currentPlanTier,
}: PlanCardProps) {
  const isPaid = price > 0;
  const isPopular = tier === "GROWTH";
  const planMeta = PLAN_DESCRIPTIONS[tier];
  const currentPlanIndex = ENABLED_PLAN_ORDER.indexOf(currentPlanTier);
  const thisPlanIndex = ENABLED_PLAN_ORDER.indexOf(tier);
  const isDowngrade = thisPlanIndex < currentPlanIndex;

  // Key features to highlight (most important ones)
  const keyFeatures: (keyof PlanFeatures)[] = [
    "advancedTargeting",
    "gamificationTemplates",
    "experiments",
    "removeBranding",
    "prioritySupport",
  ];

  return (
    <Card background={isPopular ? "bg-surface-info-active" : undefined}>
      <BlockStack gap="400">
        {/* Header with badges */}
        <BlockStack gap="200">
          <InlineStack gap="200" align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              {isPopular && <Icon source={StarFilledIcon} tone="info" />}
              <Text as="h3" variant="headingMd" fontWeight="bold">
                {name}
              </Text>
            </InlineStack>
            <InlineStack gap="100">
              {isPopular && <Badge tone="info">Most Popular</Badge>}
              {isCurrentPlan && (
                <Badge tone="success">{isTrialing ? "Trial" : "Current"}</Badge>
              )}
            </InlineStack>
          </InlineStack>
          <Text as="p" tone="subdued" variant="bodySm">
            {planMeta.tagline}
          </Text>
        </BlockStack>

        {/* Price */}
        <Box>
          <InlineStack gap="100" blockAlign="baseline">
            <Text as="span" variant="heading2xl" fontWeight="bold">
              ${price}
            </Text>
            <Text as="span" tone="subdued">
              /month
            </Text>
          </InlineStack>
          <Text as="p" tone="subdued" variant="bodySm">
            Ideal for {planMeta.idealFor.toLowerCase()}
          </Text>
        </Box>

        {/* Impressions limit */}
        <Box
          background="bg-surface-secondary"
          padding="300"
          borderRadius="200"
        >
          <BlockStack gap="100">
            <Text as="span" variant="bodySm" fontWeight="semibold">
              Monthly Impressions
            </Text>
            <Text as="span" variant="headingSm">
              {formatNumber(monthlyImpressionCap)}
            </Text>
          </BlockStack>
        </Box>

        {/* Key limits */}
        <BlockStack gap="200">
          <Box background="bg-surface-secondary" padding="200" borderRadius="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" variant="bodySm" tone="subdued">
                Campaigns
              </Text>
              <Text as="span" variant="bodySm" fontWeight="semibold">
                {formatNumber(limits.maxActiveCampaigns)}
              </Text>
            </InlineStack>
          </Box>
          <Box background="bg-surface-secondary" padding="200" borderRadius="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" variant="bodySm" tone="subdued">
                Leads / month
              </Text>
              <Text as="span" variant="bodySm" fontWeight="semibold">
                {formatNumber(limits.maxLeadsPerMonth)}
              </Text>
            </InlineStack>
          </Box>
        </BlockStack>

        <Divider />

        {/* Key features */}
        <BlockStack gap="200">
          <Text as="h4" variant="headingSm">
            Key Features
          </Text>
          {keyFeatures.map((feature) => (
            <InlineStack key={feature} gap="200" blockAlign="center">
              <Box>
                <Icon
                  source={features[feature] ? CheckIcon : XIcon}
                  tone={features[feature] ? "success" : "subdued"}
                />
              </Box>
              <Text
                as="span"
                tone={features[feature] ? undefined : "subdued"}
                variant="bodySm"
              >
                {FEATURE_DISPLAY_NAMES[feature]}
              </Text>
            </InlineStack>
          ))}
        </BlockStack>

        {/* CTA Button */}
        <Box paddingBlockStart="200">
          {isCurrentPlan ? (
            <Button disabled fullWidth>
              Current Plan
            </Button>
          ) : isPaid ? (
            <Button
              variant={isPopular ? "primary" : undefined}
              tone={isDowngrade ? "critical" : undefined}
              onClick={onSelect}
              loading={isLoading}
              fullWidth
            >
              {isDowngrade ? `Downgrade to ${name}` : `Upgrade to ${name}`}
            </Button>
          ) : (
            <Button tone="critical" onClick={onSelect} loading={isLoading} fullWidth>
              Downgrade to Free
            </Button>
          )}
        </Box>
      </BlockStack>
    </Card>
  );
}

// Current subscription summary component
interface CurrentPlanSummaryProps {
  currentPlan: PlanTier;
  isTrialing: boolean;
  trialEndsAt: string | null;
  monthlyImpressionCap: number | null;
}

function CurrentPlanSummary({
  currentPlan,
  isTrialing,
  trialEndsAt,
  monthlyImpressionCap,
}: CurrentPlanSummaryProps) {
  const planDef = PLAN_DEFINITIONS[currentPlan];
  const usedImpressions = 0; // TODO: Get actual usage from loader
  const usagePercent = monthlyImpressionCap
    ? Math.min((usedImpressions / monthlyImpressionCap) * 100, 100)
    : 0;

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <InlineStack gap="200" blockAlign="center">
              <Text as="h2" variant="headingMd">
                Your Current Plan
              </Text>
              <Badge tone={isTrialing ? "attention" : "success"}>
                {`${planDef.name}${isTrialing ? " (Trial)" : ""}`}
              </Badge>
            </InlineStack>
            {isTrialing && trialEndsAt && (
              <Text as="p" tone="subdued" variant="bodySm">
                Trial ends {new Date(trialEndsAt).toLocaleDateString()}
              </Text>
            )}
          </BlockStack>
          <Text as="span" variant="headingLg" fontWeight="bold">
            ${planDef.price}/mo
          </Text>
        </InlineStack>

        <Divider />

        <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
          {/* Impressions usage */}
          <BlockStack gap="200">
            <Text as="span" variant="bodySm" fontWeight="semibold">
              Monthly Impressions
            </Text>
            <ProgressBar
              progress={usagePercent}
              tone={usagePercent > 80 ? "critical" : "primary"}
              size="small"
            />
            <Text as="span" variant="bodySm" tone="subdued">
              {formatNumber(usedImpressions)} / {formatNumber(monthlyImpressionCap)} used
            </Text>
          </BlockStack>

          {/* Active campaigns */}
          <BlockStack gap="200">
            <Text as="span" variant="bodySm" fontWeight="semibold">
              Active Campaigns
            </Text>
            <Text as="span" variant="headingSm">
              0 / {formatNumber(planDef.limits.maxActiveCampaigns)}
            </Text>
          </BlockStack>

          {/* Leads this month */}
          <BlockStack gap="200">
            <Text as="span" variant="bodySm" fontWeight="semibold">
              Leads This Month
            </Text>
            <Text as="span" variant="headingSm">
              0 / {formatNumber(planDef.limits.maxLeadsPerMonth)}
            </Text>
          </BlockStack>
        </InlineGrid>
      </BlockStack>
    </Card>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function BillingPage() {
  const {
    currentPlan,
    subscription,
    isTrialing,
    trialEndsAt,
    plans,
    billingBypassed,
  } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";
  const currentPlanDef = PLAN_DEFINITIONS[currentPlan as PlanTier];

  const handleSelectPlan = (tier: PlanTier) => {
    // In bypass mode, we can switch to any plan including FREE
    if (billingBypassed) {
      if (tier === "FREE") {
        submit({ intent: "cancel" }, { method: "post" });
      } else {
        submit({ intent: "subscribe", planTier: tier }, { method: "post" });
      }
      return;
    }

    // Normal Shopify billing flow
    if (tier === "FREE" && subscription?.id) {
      submit(
        { intent: "cancel", subscriptionId: subscription.id },
        { method: "post" }
      );
    } else if (tier !== "FREE") {
      submit({ intent: "subscribe", planTier: tier }, { method: "post" });
    }
  };

  return (
    <Page
      title="Billing & Plans"
      subtitle="Choose the plan that works best for your store"
      backAction={{ content: "Settings", url: "/app/settings" }}
    >
      <BlockStack gap="600">
        {/* Staging/Bypass mode banner */}
        {billingBypassed && (
          <Banner tone="warning" title="Staging Mode - Billing Bypassed">
            <p>
              Shopify Billing API is bypassed. Plan changes are saved directly
              to the database without going through Shopify. This is for testing
              purposes only.
            </p>
          </Banner>
        )}

        {/* Trial banner */}
        {isTrialing && trialEndsAt && (
          <Banner tone="info" title="You're on a free trial">
            <p>
              Your trial of {currentPlanDef.name} ends on{" "}
              {new Date(trialEndsAt).toLocaleDateString()}. Choose a plan to
              continue using all features.
            </p>
          </Banner>
        )}

        {/* Current plan summary */}
        <CurrentPlanSummary
          currentPlan={currentPlan as PlanTier}
          isTrialing={isTrialing}
          trialEndsAt={trialEndsAt}
          monthlyImpressionCap={currentPlanDef.monthlyImpressionCap}
        />

        {/* Plan cards */}
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">
            Available Plans
          </Text>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3, lg: 5 }} gap="400">
            {plans.map((plan) => (
              <PlanCard
                key={plan.tier}
                tier={plan.tier}
                name={plan.name}
                price={plan.price}
                monthlyImpressionCap={plan.monthlyImpressionCap}
                features={plan.features as PlanFeatures}
                limits={plan.limits}
                isCurrentPlan={currentPlan === plan.tier}
                isTrialing={isTrialing && currentPlan === plan.tier}
                onSelect={() => handleSelectPlan(plan.tier)}
                isLoading={isLoading}
                currentPlanTier={currentPlan as PlanTier}
              />
            ))}
          </InlineGrid>
        </BlockStack>

        {/* Feature comparison section */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              All Features by Plan
            </Text>
            <Text as="p" tone="subdued">
              Compare what&apos;s included in each plan
            </Text>

            <Divider />

            {FEATURE_CATEGORIES.map((category) => (
              <BlockStack key={category.name} gap="300">
                <Text as="h3" variant="headingSm" fontWeight="semibold">
                  {category.name}
                </Text>
                <InlineGrid columns={{ xs: 1, md: 3 }} gap="200">
                  {ENABLED_PLAN_ORDER.map((tier) => (
                    <Box key={tier} padding="200">
                      <BlockStack gap="200">
                        <Text as="span" variant="bodySm" fontWeight="semibold">
                          {PLAN_DEFINITIONS[tier].name}
                        </Text>
                        {category.features.map((feature) => (
                          <InlineStack key={feature} gap="100" blockAlign="center" wrap={false}>
                            <Box minWidth="20px">
                              <Icon
                                source={
                                  PLAN_DEFINITIONS[tier].features[feature]
                                    ? CheckIcon
                                    : XIcon
                                }
                                tone={
                                  PLAN_DEFINITIONS[tier].features[feature]
                                    ? "success"
                                    : "subdued"
                                }
                              />
                            </Box>
                            <Text
                              as="span"
                              variant="bodySm"
                              tone={
                                PLAN_DEFINITIONS[tier].features[feature]
                                  ? undefined
                                  : "subdued"
                              }
                            >
                              {FEATURE_DISPLAY_NAMES[feature]}
                            </Text>
                          </InlineStack>
                        ))}
                      </BlockStack>
                    </Box>
                  ))}
                </InlineGrid>
                <Divider />
              </BlockStack>
            ))}
          </BlockStack>
        </Card>

        {/* FAQ Section */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Frequently Asked Questions
            </Text>

            <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Can I change plans at any time?
                </Text>
                <Text as="p" tone="subdued">
                  Yes! You can upgrade or downgrade your plan at any time.
                  Upgrades take effect immediately and are prorated. Downgrades
                  take effect at the end of your current billing cycle.
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  What happens if I exceed my limits?
                </Text>
                <Text as="p" tone="subdued">
                  Depending on your plan, you&apos;ll either see a warning, have a
                  grace period, or popups will stop showing until the next
                  billing cycle. We recommend upgrading before hitting limits.
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  What happens if I downgrade?
                </Text>
                <Text as="p" tone="subdued">
                  Your campaigns remain saved, but you won&apos;t be able to
                  activate more campaigns if you&apos;re over the new plan&apos;s limit.
                  Premium features will become unavailable.
                </Text>
              </BlockStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  Do you offer refunds?
                </Text>
                <Text as="p" tone="subdued">
                  We offer a 14-day money-back guarantee on all paid plans. If
                  you&apos;re not satisfied, contact support for a full refund.
                </Text>
              </BlockStack>
            </InlineGrid>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}


// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};