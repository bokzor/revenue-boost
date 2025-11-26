import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useSubmit, useNavigation, redirect } from "react-router";
import {
  Page,
  Layout,
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
} from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { authenticate, BILLING_PLANS } from "../shopify.server";
import prisma from "../db.server";
import { PLAN_DEFINITIONS, PLAN_ORDER, type PlanTier } from "../domains/billing/types/plan";
import { BillingService } from "../domains/billing/services/billing.server";

// =============================================================================
// LOADER
// =============================================================================

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin, billing } = await authenticate.admin(request);

  const store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
  });

  if (!store) {
    throw new Response("Store not found", { status: 404 });
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
    plans: PLAN_ORDER.map((tier) => ({
      tier,
      ...PLAN_DEFINITIONS[tier],
    })),
  };
};

// =============================================================================
// ACTION
// =============================================================================

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "subscribe") {
    const planTier = formData.get("planTier") as PlanTier;
    const planKey = BillingService.getBillingPlanKey(planTier);

    if (!planKey) {
      return { error: "Invalid plan selected" };
    }

    // Request billing - this will redirect to Shopify's confirmation page
    // Cast planKey as the billing plan type
    await billing.request({
      plan: planKey as "Starter" | "Growth" | "Pro" | "Enterprise",
      isTest: process.env.NODE_ENV !== "production",
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
// HELPERS
// =============================================================================

function formatFeatureName(feature: string): string {
  const names: Record<string, string> = {
    experiments: "A/B Testing",
    advancedTargeting: "Advanced Targeting",
    customTemplates: "Custom Templates",
    advancedAnalytics: "Advanced Analytics",
    prioritySupport: "Priority Support",
    removeBranding: "Remove Branding",
    customCss: "Custom CSS Styling",
  };
  return names[feature] || feature;
}

// =============================================================================
// COMPONENTS
// =============================================================================

interface PlanCardProps {
  tier: PlanTier;
  name: string;
  price: number;
  monthlyImpressionCap: number | null;
  features: Record<string, boolean>;
  limits: Record<string, number | null>;
  isCurrentPlan: boolean;
  isTrialing: boolean;
  onSelect: () => void;
  isLoading: boolean;
}

function PlanCard({
  tier, name, price, monthlyImpressionCap, features, limits,
  isCurrentPlan, isTrialing, onSelect, isLoading,
}: PlanCardProps) {
  const isPaid = price > 0;
  const isPopular = tier === "GROWTH";

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="100">
          <InlineStack gap="200" align="center" wrap={false}>
            <Text as="h3" variant="headingMd">{name}</Text>
            {isPopular && <Badge tone="info">Popular</Badge>}
            {isCurrentPlan && <Badge tone="success">{isTrialing ? "Trial" : "Current"}</Badge>}
          </InlineStack>
          <Text as="p" variant="headingLg">
            ${price}<Text as="span" tone="subdued">/mo</Text>
          </Text>
        </BlockStack>

        <Divider />

        <BlockStack gap="200">
          {Object.entries(features).map(([feature, enabled]) => (
            <InlineStack key={feature} gap="200" align="start">
              <Box><Icon source={enabled ? CheckIcon : XIcon} tone={enabled ? "success" : "subdued"} /></Box>
              <Text as="span" tone={enabled ? undefined : "subdued"}>{formatFeatureName(feature)}</Text>
            </InlineStack>
          ))}
        </BlockStack>

        <Box paddingBlockStart="200">
          {isCurrentPlan ? (
            <Button disabled fullWidth>Current Plan</Button>
          ) : isPaid ? (
            <Button variant={isPopular ? "primary" : undefined} onClick={onSelect} loading={isLoading} fullWidth>
              Upgrade to {name}
            </Button>
          ) : (
            <Button onClick={onSelect} loading={isLoading} fullWidth>Switch to Free</Button>
          )}
        </Box>
      </BlockStack>
    </Card>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function BillingPage() {
  const { currentPlan, subscription, isTrialing, trialEndsAt, plans } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state !== "idle";

  const handleSelectPlan = (tier: PlanTier) => {
    if (tier === "FREE" && subscription?.id) {
      submit({ intent: "cancel", subscriptionId: subscription.id }, { method: "post" });
    } else if (tier !== "FREE") {
      submit({ intent: "subscribe", planTier: tier }, { method: "post" });
    }
  };

  return (
    <Page title="Billing & Plans" subtitle="Choose the plan that works best for your store" backAction={{ content: "Settings", url: "/app/settings" }}>
      <Layout>
        {isTrialing && trialEndsAt && (
          <Layout.Section>
            <Banner tone="info">
              <p>You're on a free trial of {PLAN_DEFINITIONS[currentPlan as PlanTier].name}. Trial ends {new Date(trialEndsAt).toLocaleDateString()}.</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3, lg: 5 }} gap="400">
            {plans.map((plan) => (
              <PlanCard
                key={plan.tier}
                tier={plan.tier}
                name={plan.name}
                price={plan.price}
                monthlyImpressionCap={plan.monthlyImpressionCap}
                features={plan.features}
                limits={plan.limits}
                isCurrentPlan={currentPlan === plan.tier}
                isTrialing={isTrialing && currentPlan === plan.tier}
                onSelect={() => handleSelectPlan(plan.tier)}
                isLoading={isLoading}
              />
            ))}
          </InlineGrid>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Frequently Asked Questions</Text>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Can I change plans at any time?</Text>
                <Text as="p" tone="subdued">Yes! Upgrade or downgrade anytime. Upgrades are prorated.</Text>
              </BlockStack>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">What happens if I downgrade?</Text>
                <Text as="p" tone="subdued">Campaigns remain, but you can't activate more if over limit.</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
