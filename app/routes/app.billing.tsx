import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData, useSubmit, useNavigation, redirect, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useState } from "react";
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
  Collapsible,
  Tooltip,
} from "@shopify/polaris";
import { CheckIcon, XIcon, StarFilledIcon, ChevronDownIcon, ChevronUpIcon, LockIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  PLAN_DEFINITIONS,
  ENABLED_PLAN_ORDER,
  DISPLAY_PLAN_ORDER,
  FEATURE_METADATA,
  getFeaturesByCategory,
  type PlanTier,
  type PlanFeatures,
} from "../domains/billing/types/plan";
import { BillingService } from "../domains/billing/services/billing.server";
import { PlanGuardService } from "../domains/billing/services/plan-guard.server";
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

  // Fetch real usage data using the existing service
  const usageSummary = await PlanGuardService.getUsageSummary(store.id);

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
      currentPeriodEnd: store.currentPeriodEnd?.toISOString() || null,
      shopifyHasPayment: false,
      appSubscriptions: [],
      plans: DISPLAY_PLAN_ORDER.map((tier) => ({
        tier,
        ...PLAN_DEFINITIONS[tier],
      })),
      billingBypassed: true,
      usage: usageSummary.usage,
    };
  }

  // Sync subscription status from Shopify
  const billingContext = await BillingService.syncSubscriptionToDatabase(admin, session.shop);

  // Check current billing status using Shopify's billing API
  const { hasActivePayment } = await billing.check();

  return {
    currentPlan: billingContext.planTier,
    hasActiveSubscription: billingContext.hasActiveSubscription,
    subscription: billingContext.subscription,
    isTrialing: billingContext.isTrialing,
    trialEndsAt: billingContext.trialEndsAt?.toISOString() || null,
    currentPeriodEnd: billingContext.subscription?.currentPeriodEnd || null,
    shopifyHasPayment: hasActivePayment,
    plans: DISPLAY_PLAN_ORDER.map((tier) => ({
      tier,
      ...PLAN_DEFINITIONS[tier],
    })),
    billingBypassed: false,
    usage: usageSummary.usage,
  };
};

// =============================================================================
// ACTION
// =============================================================================

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const billingBypassed = isBillingBypassed();

  logger.info({ intent, billingBypassed, shop: session.shop }, "[Billing Action] Processing request");

  // When billing is bypassed (staging), update database directly
  if (billingBypassed) {
    if (intent === "subscribe") {
      const planTier = formData.get("planTier") as PlanTier;
      logger.info({ planTier }, "[Billing Action] Subscribing to plan");

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
      logger.info({ planTier: result.planTier, planStatus: result.planStatus }, "[Billing Action] Update result");

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

    // Check if this is a development store - dev stores require isTest: true
    // This is necessary for Shopify app review which uses development stores
    const isDevStore = await ShopService.isDevelopmentStore(admin);

    // Request billing - let the library handle returnUrl construction
    // When omitted, it defaults to the current request URL
    return billing.request({
      plan: planKey as "Starter" | "Growth" | "Pro",
      isTest: isDevStore,
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

// Feature categories derived from single source of truth
const FEATURE_CATEGORIES = getFeaturesByCategory();

// =============================================================================
// HELPERS
// =============================================================================

function formatNumber(num: number | null): string {
  if (num === null) return "Unlimited";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

function getProgressTone(percentage: number | null): "primary" | "critical" {
  if (percentage === null) return "primary";
  if (percentage >= 80) return "critical";
  return "primary";
}

// =============================================================================
// TRUST BADGE COMPONENT
// =============================================================================

function TrustBadges() {
  return (
    <Box paddingBlockStart="400">
      <InlineStack gap="400" align="center" wrap>
        <InlineStack gap="200" blockAlign="center">
          <Icon source={LockIcon} tone="subdued" />
          <Text as="span" variant="bodySm" tone="subdued">
            Billed securely through Shopify
          </Text>
        </InlineStack>
        <Text as="span" variant="bodySm" tone="subdued">•</Text>
        <Text as="span" variant="bodySm" tone="subdued">
          14-day money-back guarantee
        </Text>
        <Text as="span" variant="bodySm" tone="subdued">•</Text>
        <Text as="span" variant="bodySm" tone="subdued">
          Cancel anytime
        </Text>
      </InlineStack>
    </Box>
  );
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

        {/* Key features with tooltips */}
        <BlockStack gap="200">
          <Text as="h4" variant="headingSm">
            Key Features
          </Text>
          {keyFeatures.map((feature) => (
            <Tooltip key={feature} content={FEATURE_METADATA[feature].description} preferredPosition="above">
              <InlineStack gap="200" blockAlign="center">
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
                  {FEATURE_METADATA[feature].name}
                </Text>
              </InlineStack>
            </Tooltip>
          ))}
        </BlockStack>

        {/* CTA Button */}
        <Box paddingBlockStart="200">
          <BlockStack gap="200">
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
            {isPopular && !isCurrentPlan && (
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                Most stores choose this plan
              </Text>
            )}
          </BlockStack>
        </Box>
      </BlockStack>
    </Card>
  );
}

// Current subscription summary component
interface UsageData {
  impressions: { current: number; max: number | null; percentage: number | null };
  leads: { current: number; max: number | null; percentage: number | null };
  activeCampaigns: { current: number; max: number | null };
  experiments: { current: number; max: number | null };
}

interface CurrentPlanSummaryProps {
  currentPlan: PlanTier;
  isTrialing: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  usage: UsageData;
}

function CurrentPlanSummary({
  currentPlan,
  isTrialing,
  trialEndsAt,
  currentPeriodEnd,
  usage,
}: CurrentPlanSummaryProps) {
  const planDef = PLAN_DEFINITIONS[currentPlan];

  // Calculate progress percentages
  const impressionPercent = usage.impressions.percentage ?? 0;
  const leadsPercent = usage.leads.percentage ?? 0;
  const campaignsPercent = usage.activeCampaigns.max
    ? Math.round((usage.activeCampaigns.current / usage.activeCampaigns.max) * 100)
    : 0;

  // Format renewal date
  const renewalDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="start" wrap={false}>
          <BlockStack gap="100">
            <InlineStack gap="200" blockAlign="center">
              <Text as="h2" variant="headingMd">
                Your Current Plan
              </Text>
              <Badge tone={isTrialing ? "attention" : "success"}>
                {`${planDef.name}${isTrialing ? " (Trial)" : ""}`}
              </Badge>
            </InlineStack>
            {isTrialing && trialEndsAt ? (
              <Text as="p" tone="subdued" variant="bodySm">
                Trial ends {new Date(trialEndsAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            ) : renewalDate ? (
              <Text as="p" tone="subdued" variant="bodySm">
                Renews {renewalDate}
              </Text>
            ) : null}
          </BlockStack>
          <BlockStack gap="050" inlineAlign="end">
            <Text as="span" variant="headingLg" fontWeight="bold">
              ${planDef.price}/mo
            </Text>
            {planDef.price > 0 && (
              <Text as="span" variant="bodySm" tone="subdued">
                Billed via Shopify
              </Text>
            )}
          </BlockStack>
        </InlineStack>

        <Divider />

        {/* Usage metrics grid */}
        <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
          {/* Impressions usage */}
          <BlockStack gap="200">
            <InlineStack align="space-between">
              <Text as="span" variant="bodySm" fontWeight="semibold">
                Monthly Impressions
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                {usage.impressions.current.toLocaleString()} / {formatNumber(usage.impressions.max)}
              </Text>
            </InlineStack>
            <ProgressBar
              progress={Math.min(impressionPercent, 100)}
              tone={getProgressTone(impressionPercent)}
              size="small"
            />
            {impressionPercent >= 90 && usage.impressions.max !== null && (
              <Text as="span" variant="bodySm" tone="critical">
                {impressionPercent >= 100 ? "Limit reached!" : "Almost at limit"}
              </Text>
            )}
          </BlockStack>

          {/* Leads usage */}
          <BlockStack gap="200">
            <InlineStack align="space-between">
              <Text as="span" variant="bodySm" fontWeight="semibold">
                Leads This Month
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                {usage.leads.current.toLocaleString()} / {formatNumber(usage.leads.max)}
              </Text>
            </InlineStack>
            <ProgressBar
              progress={Math.min(leadsPercent, 100)}
              tone={getProgressTone(leadsPercent)}
              size="small"
            />
          </BlockStack>

          {/* Active campaigns */}
          <BlockStack gap="200">
            <InlineStack align="space-between">
              <Text as="span" variant="bodySm" fontWeight="semibold">
                Active Campaigns
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                {usage.activeCampaigns.current} / {formatNumber(usage.activeCampaigns.max)}
              </Text>
            </InlineStack>
            <ProgressBar
              progress={Math.min(campaignsPercent, 100)}
              tone={getProgressTone(campaignsPercent)}
              size="small"
            />
          </BlockStack>

          {/* Experiments */}
          {planDef.features.experiments && (
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  Experiments
                </Text>
                <Text as="span" variant="bodySm" tone="subdued">
                  {usage.experiments.current} / {formatNumber(usage.experiments.max)}
                </Text>
              </InlineStack>
              <ProgressBar
                progress={
                  usage.experiments.max
                    ? Math.min((usage.experiments.current / usage.experiments.max) * 100, 100)
                    : 0
                }
                tone="primary"
                size="small"
              />
            </BlockStack>
          )}
        </InlineGrid>

        {/* Warning banner if near/at limits */}
        {impressionPercent >= 100 && usage.impressions.max !== null && (
          <Banner tone="critical">
            <p>
              You&apos;ve reached your monthly impression limit. Popups will stop showing to visitors.{" "}
              <strong>Upgrade your plan</strong> to continue capturing leads.
            </p>
          </Banner>
        )}
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
    currentPeriodEnd,
    plans,
    billingBypassed,
    usage,
  } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";
  const currentPlanDef = PLAN_DEFINITIONS[currentPlan as PlanTier];

  // State for collapsible feature sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (categoryName: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

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
              {new Date(trialEndsAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}. Choose a plan to continue using all features.
            </p>
          </Banner>
        )}

        {/* Current plan summary with real usage data */}
        <CurrentPlanSummary
          currentPlan={currentPlan as PlanTier}
          isTrialing={isTrialing}
          trialEndsAt={trialEndsAt}
          currentPeriodEnd={currentPeriodEnd}
          usage={usage}
        />

        {/* Plan cards - optimized for 3 enabled plans */}
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h2" variant="headingLg">
              Available Plans
            </Text>
            <Text as="p" tone="subdued">
              All plans include unlimited popups, email support, and regular updates
            </Text>
          </BlockStack>

          {/* Responsive grid: 1 col on mobile, 2 on tablet, 3 on desktop */}
          <InlineGrid columns={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="400">
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

          {/* Trust badges */}
          <TrustBadges />
        </BlockStack>

        {/* Collapsible Feature comparison section */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Detailed Feature Comparison
            </Text>
            <Text as="p" tone="subdued">
              Click each category to expand and see what&apos;s included
            </Text>

            <Divider />

            {FEATURE_CATEGORIES.map((category) => {
              const isOpen = openSections[category.name] ?? false;

              return (
                <BlockStack key={category.name} gap="200">
                  {/* Collapsible header */}
                  <Box
                    paddingBlock="200"
                    paddingInline="200"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(category.name)}
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h3" variant="headingSm" fontWeight="semibold">
                          {category.name}
                        </Text>
                        <Icon source={isOpen ? ChevronUpIcon : ChevronDownIcon} tone="subdued" />
                      </InlineStack>
                    </button>
                  </Box>

                  {/* Collapsible content */}
                  <Collapsible open={isOpen} id={`feature-${category.name}`}>
                    <Box paddingBlock="200">
                      <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
                        {DISPLAY_PLAN_ORDER.map((tier) => (
                          <Box key={tier} padding="200" background="bg-surface-secondary" borderRadius="200">
                            <BlockStack gap="200">
                              <Text as="span" variant="bodySm" fontWeight="bold">
                                {PLAN_DEFINITIONS[tier].name}
                              </Text>
                              {category.features.map((feature) => (
                                <Tooltip
                                  key={feature}
                                  content={FEATURE_METADATA[feature].description}
                                  preferredPosition="above"
                                >
                                  <InlineStack gap="200" blockAlign="center" wrap={false}>
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
                                      {FEATURE_METADATA[feature].name}
                                    </Text>
                                  </InlineStack>
                                </Tooltip>
                              ))}
                            </BlockStack>
                          </Box>
                        ))}
                      </InlineGrid>
                    </Box>
                  </Collapsible>
                </BlockStack>
              );
            })}
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

            {/* Bottom trust reminder */}
            <Divider />
            <TrustBadges />
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
