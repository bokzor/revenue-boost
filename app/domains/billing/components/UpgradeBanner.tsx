import { Banner, Text, InlineStack, Button } from "@shopify/polaris";
import { useBilling } from "~/routes/app";
import { PLAN_DEFINITIONS, type PlanTier, type PlanFeatures } from "../types/plan";

interface UpgradeBannerProps {
  /** The feature that requires an upgrade */
  feature: keyof PlanFeatures;
  /** Optional custom message (default is generated from feature name) */
  message?: string;
  /** Whether to show inline (no full-width banner) */
  inline?: boolean;
}

// Map features to user-friendly names and descriptions
const FEATURE_INFO: Record<keyof PlanFeatures, { name: string; description: string }> = {
  experiments: {
    name: "A/B Testing",
    description: "Create experiments to test different campaign variations",
  },
  advancedTargeting: {
    name: "Advanced Targeting",
    description: "Target specific customer segments and behaviors",
  },
  customTemplates: {
    name: "Custom Templates",
    description: "Create and save custom campaign templates",
  },
  advancedAnalytics: {
    name: "Advanced Analytics",
    description: "Access detailed conversion and revenue analytics",
  },
  prioritySupport: {
    name: "Priority Support",
    description: "Get faster responses from our support team",
  },
  removeBranding: {
    name: "Remove Branding",
    description: "Remove 'Powered by Revenue Boost' from your popups",
  },
  customCss: {
    name: "Custom CSS",
    description: "Add custom CSS styling to your popups",
  },
  gamificationTemplates: {
    name: "Gamification Templates",
    description: "Use Spin-to-Win, Scratch Cards, and other interactive templates",
  },
  socialProofTemplates: {
    name: "Social Proof Templates",
    description: "Show recent sales, live visitors, and FOMO notifications",
  },
  scheduledCampaigns: {
    name: "Scheduled Campaigns",
    description: "Schedule campaigns to run at specific times",
  },
  apiAccess: {
    name: "API Access",
    description: "Access the Revenue Boost API for custom integrations",
  },
};

/**
 * Get the minimum plan tier required for a feature
 */
function getMinimumPlanForFeature(feature: keyof PlanFeatures): PlanTier | null {
  const tiers: PlanTier[] = ["FREE", "STARTER", "GROWTH", "PRO", "ENTERPRISE"];
  for (const tier of tiers) {
    if (PLAN_DEFINITIONS[tier].features[feature]) {
      return tier;
    }
  }
  return null;
}

/**
 * A banner component that prompts users to upgrade when they try to access
 * a feature not available on their current plan.
 */
export function UpgradeBanner({ feature, message, inline }: UpgradeBannerProps) {
  const billing = useBilling();
  const featureInfo = FEATURE_INFO[feature];
  const minimumPlan = getMinimumPlanForFeature(feature);

  // Don't show if user can access the feature
  if (billing.canAccessFeature(feature)) {
    return null;
  }

  const defaultMessage = minimumPlan
    ? `${featureInfo.name} requires the ${PLAN_DEFINITIONS[minimumPlan].name} plan or higher.`
    : `${featureInfo.name} is not available on your current plan.`;

  if (inline) {
    return (
      <InlineStack gap="200" align="center">
        <Text as="span" tone="subdued">{message || defaultMessage}</Text>
        <Button url="/app/billing" size="slim">Upgrade</Button>
      </InlineStack>
    );
  }

  return (
    <Banner
      tone="warning"
      action={{ content: "View Plans", url: "/app/billing" }}
    >
      <p>
        <strong>{featureInfo.name}</strong>: {message || featureInfo.description}.{" "}
        {minimumPlan && (
          <>Upgrade to {PLAN_DEFINITIONS[minimumPlan].name} to unlock this feature.</>
        )}
      </p>
    </Banner>
  );
}

/**
 * A hook to check if a feature is available and get upgrade info
 */
export function useFeatureAccess(feature: keyof PlanFeatures) {
  const billing = useBilling();
  const hasAccess = billing.canAccessFeature(feature);
  const minimumPlan = getMinimumPlanForFeature(feature);
  const featureInfo = FEATURE_INFO[feature];

  return {
    hasAccess,
    minimumPlan,
    minimumPlanName: minimumPlan ? PLAN_DEFINITIONS[minimumPlan].name : null,
    featureName: featureInfo.name,
    featureDescription: featureInfo.description,
    currentPlan: billing.planTier,
    currentPlanName: billing.planName,
  };
}

