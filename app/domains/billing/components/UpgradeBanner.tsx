import { Banner, Text, InlineStack, Button } from "@shopify/polaris";
import { useBilling } from "~/routes/app";
import {
  PLAN_DEFINITIONS,
  FEATURE_METADATA,
  getMinimumPlanForFeature,
  type PlanFeatures,
} from "../types/plan";

interface UpgradeBannerProps {
  /** The feature that requires an upgrade */
  feature: keyof PlanFeatures;
  /** Optional custom message (default is generated from feature name) */
  message?: string;
  /** Whether to show inline (no full-width banner) */
  inline?: boolean;
}

/**
 * A banner component that prompts users to upgrade when they try to access
 * a feature not available on their current plan.
 */
export function UpgradeBanner({ feature, message, inline }: UpgradeBannerProps) {
  const billing = useBilling();
  const featureMeta = FEATURE_METADATA[feature];
  const minimumPlan = getMinimumPlanForFeature(feature);

  // Don't show if user can access the feature
  if (billing.canAccessFeature(feature)) {
    return null;
  }

  const defaultMessage = minimumPlan
    ? `${featureMeta.name} requires the ${PLAN_DEFINITIONS[minimumPlan].name} plan or higher.`
    : `${featureMeta.name} is not available on your current plan.`;

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
        <strong>{featureMeta.name}</strong>: {message || featureMeta.description}.{" "}
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
  const featureMeta = FEATURE_METADATA[feature];

  return {
    hasAccess,
    minimumPlan,
    minimumPlanName: minimumPlan ? PLAN_DEFINITIONS[minimumPlan].name : null,
    featureName: featureMeta.name,
    featureDescription: featureMeta.description,
    currentPlan: billing.planTier,
    currentPlanName: billing.planName,
  };
}
