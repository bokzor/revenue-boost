import { type LoaderFunctionArgs, type ActionFunctionArgs, data } from "react-router";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { useState, useEffect } from "react";

import type { PlanTier } from "../domains/billing/types/plan";

interface DowngradeDetails {
  campaigns: { current: number; limit: number } | null;
  experiments: { current: number; limit: number } | null;
  targetPlan: PlanTier;
}

interface SettingsActionData {
  error?: string;
  details?: DowngradeDetails;
  success?: boolean;
}
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Badge,
  Button,
  DataTable,
  Box,
  InlineGrid,
  Divider,
  ProgressBar,
  Icon,
  Modal,
  Banner,
} from "@shopify/polaris";
import { CheckIcon, XIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { PLAN_DEFINITIONS, PLAN_ORDER } from "../domains/billing/types/plan";
import { PlanGuardService } from "../domains/billing/services/plan-guard.server";
import { BillingService } from "../domains/billing/services/billing.server";
import { GlobalCappingSettings } from "../domains/store/components/GlobalCappingSettings";
import { GlobalCSSSettings } from "../domains/store/components/GlobalCSSSettings";
import { StoreSettingsSchema, type StoreSettings } from "../domains/store/types/settings";
import { SetupStatus } from "../domains/setup/components/SetupStatus";
import { getSetupStatus } from "../lib/setup-status.server";
import { isBillingBypassed } from "../lib/env.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
  });

  if (!store) {
    throw new Response("Store not found", { status: 404 });
  }

  const planContext = await PlanGuardService.getPlanContext(store.id);

  // Get billing context - use cached DB values when bypassed, otherwise sync from Shopify
  const billingContext = await BillingService.getOrSyncBillingContext(admin, session.shop);

  // Check setup status using shared utility
  const { status: setupStatus, setupComplete } = await getSetupStatus(
    session.shop,
    session.accessToken || "",
    admin
  );
  const themeEditorUrl = `https://${session.shop}/admin/themes/current/editor`;

  // Calculate usage
  const activeCampaignsCount = await prisma.campaign.count({
    where: {
      storeId: store.id,
      status: "ACTIVE",
    },
  });

  const experimentsCount = await prisma.experiment.count({
    where: {
      storeId: store.id,
      status: { in: ["RUNNING", "DRAFT"] },
    },
  });

  // Calculate monthly impressions
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthlyImpressionsCount = await prisma.popupEvent.count({
    where: {
      storeId: store.id,
      eventType: "VIEW",
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  return {
    planContext,
    billingContext: {
      hasActiveSubscription: billingContext.hasActiveSubscription,
      isTrialing: billingContext.isTrialing,
      trialEndsAt: billingContext.trialEndsAt?.toISOString() || null,
      subscription: billingContext.subscription,
    },
    usage: {
      activeCampaigns: activeCampaignsCount,
      experiments: experimentsCount,
      monthlyImpressions: monthlyImpressionsCount,
    },
    storeSettings: (store.settings as StoreSettings) || {},
    PLAN_DEFINITIONS,
    PLAN_ORDER,
    setupStatus,
    setupComplete,
    themeEditorUrl,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  // Handle settings update
  if (actionType === "updateSettings") {
    const settingsStr = formData.get("settings");
    if (settingsStr && typeof settingsStr === "string") {
      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(settingsStr);
      } catch (error) {
        console.error("[Settings] Failed to parse settings JSON", error);
        return data({ success: false, error: "Invalid settings payload" }, { status: 400 });
      }

      const validatedSettingsResult = StoreSettingsSchema.partial()
        .passthrough()
        .safeParse(parsedJson);
      if (!validatedSettingsResult.success) {
        console.warn(
          "[Settings] Validation failed for store settings update",
          validatedSettingsResult.error.flatten()
        );
        return data({ success: false, error: "Invalid settings payload" }, { status: 400 });
      }

      const newSettings = validatedSettingsResult.data;

      if (
        typeof newSettings.globalCustomCSS === "string" &&
        newSettings.globalCustomCSS.trim().length === 0
      ) {
        delete (newSettings as Record<string, unknown>).globalCustomCSS;
      }

      // Merge with existing settings
      const currentStore = await prisma.store.findUnique({
        where: { shopifyDomain: session.shop },
        select: { settings: true },
      });

      const currentSettings = (currentStore?.settings as StoreSettings) || {};
      const mergedSettings = {
        ...currentSettings,
        ...newSettings,
      };

      await prisma.store.update({
        where: { shopifyDomain: session.shop },
        data: {
          settings: mergedSettings,
        },
      });

      return { success: true };
    }
    return data({ success: false, error: "Invalid settings payload" }, { status: 400 });
  }

  const targetPlan = formData.get("targetPlan") as PlanTier;

  if (!targetPlan || !PLAN_DEFINITIONS[targetPlan]) {
    return data({ error: "Invalid plan selected" }, { status: 400 });
  }

  const store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
  });

  if (!store) {
    throw new Response("Store not found", { status: 404 });
  }

  const forceDowngrade = formData.get("forceDowngrade") === "true";
  const targetDefinition = PLAN_DEFINITIONS[targetPlan];

  // Check limits
  let activeCampaignsCount = 0;
  let experimentsCount = 0;

  if (targetDefinition.limits.maxActiveCampaigns !== null) {
    activeCampaignsCount = await prisma.campaign.count({
      where: { storeId: store.id, status: "ACTIVE" },
    });
  }

  if (targetDefinition.limits.maxExperiments !== null) {
    experimentsCount = await prisma.experiment.count({
      where: { storeId: store.id, status: { in: ["RUNNING", "DRAFT"] } },
    });
  }

  const campaignLimitExceeded =
    targetDefinition.limits.maxActiveCampaigns !== null &&
    activeCampaignsCount > targetDefinition.limits.maxActiveCampaigns;
  const experimentLimitExceeded =
    targetDefinition.limits.maxExperiments !== null &&
    experimentsCount > targetDefinition.limits.maxExperiments;

  if ((campaignLimitExceeded || experimentLimitExceeded) && !forceDowngrade) {
    return data(
      {
        error: "LIMIT_EXCEEDED",
        details: {
          campaigns: campaignLimitExceeded
            ? { current: activeCampaignsCount, limit: targetDefinition.limits.maxActiveCampaigns }
            : null,
          experiments: experimentLimitExceeded
            ? { current: experimentsCount, limit: targetDefinition.limits.maxExperiments }
            : null,
          targetPlan,
        },
      },
      { status: 400 }
    );
  }

  // Handle forced downgrade (auto-deactivate)
  if (forceDowngrade) {
    if (campaignLimitExceeded && targetDefinition.limits.maxActiveCampaigns !== null) {
      // Fetch all active campaigns sorted by updatedAt desc (keep newest)
      const activeCampaigns = await prisma.campaign.findMany({
        where: { storeId: store.id, status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });

      // Identify campaigns to deactivate (skip the first N allowed)
      const campaignsToDeactivate = activeCampaigns.slice(
        targetDefinition.limits.maxActiveCampaigns
      );
      const idsToDeactivate = campaignsToDeactivate.map((c) => c.id);

      if (idsToDeactivate.length > 0) {
        await prisma.campaign.updateMany({
          where: { id: { in: idsToDeactivate } },
          data: { status: "PAUSED" },
        });
      }
    }

    if (experimentLimitExceeded && targetDefinition.limits.maxExperiments !== null) {
      // Fetch all active experiments sorted by updatedAt desc
      const activeExperiments = await prisma.experiment.findMany({
        where: { storeId: store.id, status: { in: ["RUNNING", "DRAFT"] } },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });

      const experimentsToArchive = activeExperiments.slice(targetDefinition.limits.maxExperiments);
      const idsToArchive = experimentsToArchive.map((e) => e.id);

      if (idsToArchive.length > 0) {
        await prisma.experiment.updateMany({
          where: { id: { in: idsToArchive } },
          data: { status: "ARCHIVED" },
        });
      }
    }
  }

  // When billing is bypassed (staging), update database directly
  if (isBillingBypassed()) {
    await prisma.store.update({
      where: { id: store.id },
      data: {
        planTier: targetPlan,
        planStatus: "ACTIVE",
        trialEndsAt: null,
        currentPeriodEnd:
          targetPlan === "FREE" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        shopifySubscriptionId:
          targetPlan === "FREE" ? null : `staging-${targetPlan}-${Date.now()}`,
        shopifySubscriptionStatus: targetPlan === "FREE" ? null : "ACTIVE",
        shopifySubscriptionName:
          targetPlan === "FREE" ? null : PLAN_DEFINITIONS[targetPlan].name,
        billingLastSyncedAt: new Date(),
      },
    });

    return { success: true };
  }

  // Use Shopify billing API for paid plans
  const planKey = BillingService.getBillingPlanKey(targetPlan);

  if (planKey) {
    // Paid plan - redirect to Shopify billing
    const appUrl = process.env.SHOPIFY_APP_URL || `https://${request.headers.get("host")}`;
    const returnUrl = `${appUrl}/app/settings?shop=${session.shop}`;

    return billing.request({
      plan: planKey as "Starter" | "Growth" | "Pro" | "Enterprise",
      isTest: process.env.NODE_ENV !== "production",
      returnUrl,
    });
  }

  // For FREE plan (downgrade), update database directly
  await prisma.store.update({
    where: { id: store.id },
    data: {
      planTier: targetPlan,
      planStatus: "ACTIVE",
    },
  });

  return { success: true };
};

export default function SettingsPage() {
  const {
    planContext,
    billingContext,
    usage,
    storeSettings,
    PLAN_DEFINITIONS,
    PLAN_ORDER,
    setupStatus,
    setupComplete,
    themeEditorUrl,
  } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const currentPlan = planContext.planTier;
  const currentDefinition = PLAN_DEFINITIONS[currentPlan];

  const handleUpgrade = (targetPlan: PlanTier) => {
    const formData = new FormData();
    formData.append("targetPlan", targetPlan);
    submit(formData, { method: "post" });
  };

  const handleSettingsChange = (newSettings: Partial<StoreSettings>) => {
    const formData = new FormData();
    formData.append("actionType", "updateSettings");
    formData.append("settings", JSON.stringify(newSettings));
    submit(formData, { method: "post" });
  };

  const actionData = useActionData<typeof action>() as SettingsActionData | undefined;
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false);
  const [downgradeDetails, setDowngradeDetails] = useState<DowngradeDetails | null>(null);

  useEffect(() => {
    if (!actionData) return;

    if (actionData.error === "LIMIT_EXCEEDED" && actionData.details) {
      setDowngradeDetails(actionData.details);
      setIsDowngradeModalOpen(true);
    } else if (actionData.error) {
      shopify.toast.show(actionData.error, { isError: true });
    } else if (actionData.success) {
      shopify.toast.show("Plan updated successfully");
    }
  }, [actionData]);

  const handleConfirmDowngrade = () => {
    if (!downgradeDetails) return;
    const formData = new FormData();
    formData.append("targetPlan", downgradeDetails.targetPlan);
    formData.append("forceDowngrade", "true");
    submit(formData, { method: "post" });
    setIsDowngradeModalOpen(false);
  };

  const rows = PLAN_ORDER.map((tier) => {
    const def = PLAN_DEFINITIONS[tier];
    const isCurrent = tier === currentPlan;

    return [
      <Text key={`name-${tier}`} variant="bodyMd" fontWeight="bold" as="span">
        {def.name}
      </Text>,
      <Text key={`price-${tier}`} variant="bodyMd" as="span">
        ${def.price}/mo
      </Text>,
      <Text key={`impressions-${tier}`} variant="bodyMd" as="span">
        {def.monthlyImpressionCap
          ? `${(def.monthlyImpressionCap / 1000).toFixed(0)}k`
          : "Unlimited"}
      </Text>,
      <Text key={`campaigns-${tier}`} variant="bodyMd" as="span">
        {def.limits.maxActiveCampaigns === null ? "Unlimited" : def.limits.maxActiveCampaigns}
      </Text>,
      <Text key={`experiments-${tier}`} variant="bodyMd" as="span">
        {def.limits.maxExperiments === null ? "Unlimited" : def.limits.maxExperiments}
      </Text>,
      <Box key={`experiments-flag-${tier}`}>
        {def.features.experiments ? (
          <Icon source={CheckIcon} tone="success" />
        ) : (
          <Icon source={XIcon} tone="critical" />
        )}
      </Box>,
      isCurrent ? (
        <Badge key={`status-${tier}`} tone="success">
          Current
        </Badge>
      ) : (
        <Button
          key={`action-${tier}`}
          onClick={() => handleUpgrade(tier)}
          loading={isLoading}
          disabled={isLoading}
          variant={def.price > currentDefinition.price ? "primary" : "secondary"}
        >
          {def.price > currentDefinition.price ? "Upgrade" : "Downgrade"}
        </Button>
      ),
    ];
  });

  return (
    <Page title="Settings" subtitle="Manage your subscription and plan limits">
      <Modal
        open={isDowngradeModalOpen}
        onClose={() => setIsDowngradeModalOpen(false)}
        title="Downgrade Plan"
        primaryAction={{
          content: "Downgrade & Deactivate",
          onAction: handleConfirmDowngrade,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsDowngradeModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p">
              You are about to downgrade to the{" "}
              <strong>
                {downgradeDetails?.targetPlan && PLAN_DEFINITIONS[downgradeDetails.targetPlan].name}
              </strong>{" "}
              plan.
            </Text>
            {downgradeDetails?.campaigns && (
              <Banner tone="warning">
                <p>
                  You have <strong>{downgradeDetails.campaigns.current}</strong> active campaigns,
                  but the new plan only allows <strong>{downgradeDetails.campaigns.limit}</strong>.
                  Proceeding will automatically deactivate the{" "}
                  <strong>
                    {downgradeDetails.campaigns.current - downgradeDetails.campaigns.limit}
                  </strong>{" "}
                  oldest active campaigns.
                </p>
              </Banner>
            )}
            {downgradeDetails?.experiments && (
              <Banner tone="warning">
                <p>
                  You have <strong>{downgradeDetails.experiments.current}</strong> active
                  experiments, but the new plan only allows{" "}
                  <strong>{downgradeDetails.experiments.limit}</strong>. Proceeding will
                  automatically archive the{" "}
                  <strong>
                    {downgradeDetails.experiments.current - downgradeDetails.experiments.limit}
                  </strong>{" "}
                  oldest experiments.
                </p>
              </Banner>
            )}
            <Text as="p">Are you sure you want to proceed?</Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
      <BlockStack gap="500">
        <Layout>
          {/* Setup Status - Always Visible */}
          <Layout.Section>
            <SetupStatus
              status={setupStatus}
              setupComplete={setupComplete}
              themeEditorUrl={themeEditorUrl}
            />
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineGrid columns="1fr auto" alignItems="center">
                  <Text variant="headingMd" as="h2">
                    Current Subscription
                  </Text>
                  <Badge tone={billingContext.isTrialing ? "info" : planContext.planStatus === "ACTIVE" ? "success" : "attention"}>
                    {billingContext.isTrialing ? "Trial" : planContext.planStatus}
                  </Badge>
                </InlineGrid>

                {billingContext.isTrialing && billingContext.trialEndsAt && (
                  <Banner tone="info">
                    <p>
                      Your free trial ends on{" "}
                      <strong>{new Date(billingContext.trialEndsAt).toLocaleDateString()}</strong>.
                      After the trial, you&apos;ll be charged ${currentDefinition.price}/month.
                    </p>
                  </Banner>
                )}

                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                  <BlockStack gap="200">
                    <InlineGrid columns="1fr auto" alignItems="center">
                      <Text variant="headingLg" as="p">
                        {currentDefinition.name} Plan
                      </Text>
                      <Button url="/app/billing" variant="plain">
                        Manage Plan
                      </Button>
                    </InlineGrid>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      ${currentDefinition.price}/month • Up to{" "}
                      {currentDefinition.monthlyImpressionCap
                        ? `${(currentDefinition.monthlyImpressionCap / 1000).toFixed(0)}k`
                        : "Unlimited"}{" "}
                      impressions
                    </Text>
                  </BlockStack>
                </Box>

                <Divider />

                <Text variant="headingSm" as="h3">
                  Usage Limits
                </Text>
                <BlockStack gap="400">
                  <Box>
                    <InlineGrid columns="1fr auto">
                      <Text variant="bodyMd" as="span">
                        Monthly Impressions
                      </Text>
                      <Text variant="bodyMd" tone="subdued" as="span">
                        {usage.monthlyImpressions.toLocaleString()} /{" "}
                        {currentDefinition.monthlyImpressionCap
                          ? `${(currentDefinition.monthlyImpressionCap / 1000).toFixed(0)}k`
                          : "∞"}
                      </Text>
                    </InlineGrid>
                    <ProgressBar
                      progress={
                        currentDefinition.monthlyImpressionCap
                          ? (usage.monthlyImpressions / currentDefinition.monthlyImpressionCap) *
                            100
                          : 0
                      }
                      tone={
                        currentDefinition.monthlyImpressionCap &&
                        usage.monthlyImpressions >= currentDefinition.monthlyImpressionCap
                          ? "critical"
                          : "primary"
                      }
                      size="small"
                    />
                    {currentDefinition.monthlyImpressionCap &&
                      usage.monthlyImpressions >= currentDefinition.monthlyImpressionCap && (
                        <Box paddingBlockStart="200">
                          <Banner tone="critical">
                            <Text as="p" variant="bodySm">
                              You have reached your monthly impression limit for the{" "}
                              <strong>{currentDefinition.name}</strong> plan. New visitors will not
                              see popups until your next billing cycle.
                            </Text>
                          </Banner>
                        </Box>
                      )}
                  </Box>

                  <Box>
                    <InlineGrid columns="1fr auto">
                      <Text variant="bodyMd" as="span">
                        Active Campaigns
                      </Text>
                      <Text variant="bodyMd" tone="subdued" as="span">
                        {usage.activeCampaigns} /{" "}
                        {currentDefinition.limits.maxActiveCampaigns === null
                          ? "∞"
                          : currentDefinition.limits.maxActiveCampaigns}
                      </Text>
                    </InlineGrid>
                    <ProgressBar
                      progress={
                        currentDefinition.limits.maxActiveCampaigns
                          ? (usage.activeCampaigns / currentDefinition.limits.maxActiveCampaigns) *
                            100
                          : 0
                      }
                      tone="primary"
                      size="small"
                    />
                  </Box>

                  <Box>
                    <InlineGrid columns="1fr auto">
                      <Text variant="bodyMd" as="span">
                        Experiments
                      </Text>
                      <Text variant="bodyMd" tone="subdued" as="span">
                        {usage.experiments} /{" "}
                        {currentDefinition.limits.maxExperiments === null
                          ? "∞"
                          : currentDefinition.limits.maxExperiments}
                      </Text>
                    </InlineGrid>
                    <ProgressBar
                      progress={
                        currentDefinition.limits.maxExperiments
                          ? (usage.experiments / currentDefinition.limits.maxExperiments) * 100
                          : 0
                      }
                      tone="primary"
                      size="small"
                    />
                  </Box>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <GlobalCappingSettings settings={storeSettings} onChange={handleSettingsChange} />
          </Layout.Section>

          <Layout.Section>
            <GlobalCSSSettings settings={storeSettings} onChange={handleSettingsChange} />
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Compare Plans
                </Text>
                <DataTable
                  columnContentTypes={["text", "numeric", "text", "text", "text", "text", "text"]}
                  headings={[
                    "Plan",
                    "Price",
                    "Impressions",
                    "Campaigns",
                    "Experiments",
                    "A/B Testing",
                    "Action",
                  ]}
                  rows={rows}
                  hoverable
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
