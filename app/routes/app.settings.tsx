import { type LoaderFunctionArgs, type ActionFunctionArgs, data } from "react-router";
import { useLoaderData, useSubmit, useActionData } from "react-router";
import { useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  Button,
  Box,
  InlineGrid,
  ProgressBar,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { PLAN_DEFINITIONS } from "../domains/billing/types/plan";
import { PlanGuardService } from "../domains/billing/services/plan-guard.server";
import { GlobalCappingSettings } from "../domains/store/components/GlobalCappingSettings";
import { GlobalCSSSettings } from "../domains/store/components/GlobalCSSSettings";
import { StoreSettingsSchema, type StoreSettings } from "../domains/store/types/settings";
import { SetupStatus } from "../domains/setup/components/SetupStatus";
import { getSetupStatus } from "../lib/setup-status.server";
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
  });

  if (!store) {
    throw new Response("Store not found", { status: 404 });
  }

  const planContext = await PlanGuardService.getPlanContext(store.id);

  // Check setup status using shared utility
  const { status: setupStatus, setupComplete } = await getSetupStatus(
    session.shop,
    session.accessToken || "",
    admin
  );
  const themeEditorUrl = `https://${session.shop}/admin/themes/current/editor?context=apps`;

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
    usage: {
      activeCampaigns: activeCampaignsCount,
      experiments: experimentsCount,
      monthlyImpressions: monthlyImpressionsCount,
    },
    storeSettings: (store.settings as StoreSettings) || {},
    PLAN_DEFINITIONS,
    setupStatus,
    setupComplete,
    themeEditorUrl,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
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

  return data({ error: "Invalid action" }, { status: 400 });
};

export default function SettingsPage() {
  const {
    planContext,
    usage,
    storeSettings,
    PLAN_DEFINITIONS,
    setupStatus,
    setupComplete,
    themeEditorUrl,
  } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();

  const currentPlan = planContext.planTier;
  const currentDefinition = PLAN_DEFINITIONS[currentPlan];

  const handleSettingsChange = (newSettings: Partial<StoreSettings>) => {
    const formData = new FormData();
    formData.append("actionType", "updateSettings");
    formData.append("settings", JSON.stringify(newSettings));
    submit(formData, { method: "post" });
  };

  useEffect(() => {
    if (!actionData) return;

    if ("error" in actionData) {
      shopify.toast.show(actionData.error, { isError: true });
    } else if ("success" in actionData) {
      shopify.toast.show("Settings updated successfully");
    }
  }, [actionData]);

  return (
    <Page title="Settings">
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
                    Usage
                  </Text>
                  <Button url="/app/billing" variant="plain">
                    Manage Plan
                  </Button>
                </InlineGrid>
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
        </Layout>
      </BlockStack>
    </Page>
  );
}
