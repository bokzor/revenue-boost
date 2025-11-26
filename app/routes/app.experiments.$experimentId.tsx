/**
 * Experiment Detail Page
 *
 * View and manage A/B testing experiments with variants
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useLocation, useNavigate, useRevalidator } from "react-router";
import {
  Page,
  Card,
  Text,
  Badge,
  InlineStack,
  BlockStack,
  DataTable,
  Banner,
  Toast,
  Tabs,
  Box,
  Divider,
  DescriptionList,
  Button,
} from "@shopify/polaris";
import { useState, useCallback } from "react";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { ExperimentService } from "~/domains/campaigns";
import type { ExperimentWithVariants } from "~/domains/campaigns";
import { apiClient, getErrorMessage } from "~/lib/api-client";
import {
  getVariantPerformance,
  type VariantComparison,
} from "~/domains/analytics/experiment-analytics.server";
import { getStoreCurrency } from "~/lib/currency.server";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  experiment: ExperimentWithVariants | null;
  storeId: string;
  analytics: VariantComparison | null;
  currency: string;
}

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);

    if (!session?.shop) {
      throw new Error("No shop session found");
    }

    const experimentId = params.experimentId;
    if (!experimentId) {
      throw new Error("Experiment ID is required");
    }

    const storeId = await getStoreId(request);

    // Get experiment details
    const experiment = await ExperimentService.getExperimentById(experimentId, storeId);

    // Get analytics if experiment exists
    let analytics: VariantComparison | null = null;
    let currency = "USD";

    if (experiment) {
      [analytics, currency] = await Promise.all([
        getVariantPerformance(experimentId, storeId),
        getStoreCurrency(admin),
      ]);
    }

    return data<LoaderData>({
      experiment,
      storeId,
      analytics,
      currency,
    });
  } catch (error) {
    console.error("Failed to load experiment:", error);

    return data<LoaderData>(
      {
        experiment: null,
        storeId: "",
        analytics: null,
        currency: "USD",
      },
      { status: 404 }
    );
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ExperimentDetailPage() {
  const { experiment, analytics, currency } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const location = useLocation();
  const isAnalyticsRoute = location.pathname.endsWith("/analytics");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelectedTab(selectedTabIndex),
    []
  );

  if (isAnalyticsRoute) {
    return <Outlet />;
  }

  if (!experiment) {
    return (
      <Page
        title="Experiment Not Found"
        backAction={{ onAction: () => navigate("/app/campaigns") }}
      >
        <Banner tone="critical">
          <p>The experiment you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        </Banner>
      </Page>
    );
  }

  // Helper to show toast messages
  const showToast = (message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Calculate derived status from campaign variants
  const campaignStatuses = experiment.variants.map((v) => v.status);
  const hasActiveCampaign = campaignStatuses.some((status) => status === "ACTIVE");
  const allDraft = campaignStatuses.every((status) => status === "DRAFT");
  const allPaused = campaignStatuses.every((status) => status === "PAUSED");

  const derivedStatus = hasActiveCampaign
    ? "ACTIVE"
    : allDraft
      ? "DRAFT"
      : allPaused
        ? "PAUSED"
        : "MIXED";
  const isExperimentActive = hasActiveCampaign;

  const statusBadge = {
    tone:
      derivedStatus === "ACTIVE"
        ? ("success" as const)
        : derivedStatus === "PAUSED"
          ? ("warning" as const)
          : derivedStatus === "MIXED"
            ? ("attention" as const)
            : ("info" as const),
    children: derivedStatus,
  };

  // Helper to get status badge for individual campaigns
  const getCampaignStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return { tone: "success" as const, children: "Active" };
      case "PAUSED":
        return { tone: "warning" as const, children: "Paused" };
      case "DRAFT":
        return { tone: "info" as const, children: "Draft" };
      default:
        return { tone: "attention" as const, children: status };
    }
  };

  // Prepare variants table data with status
  const variantRows = experiment.variants.map((variant) => [
    variant.variantKey,
    variant.name,
    variant.isControl ? "Yes" : "No",
    `${variant.trafficPercentage}%`,
    <Badge key={variant.id} {...getCampaignStatusBadge(variant.status)} />,
  ]);

  const handleEdit = () => {
    navigate(`/app/experiments/${experiment.id}/edit`);
  };

  const handleActivateAll = async () => {
    try {
      await apiClient.post(`/api/experiments/${experiment.id}/activate-all`);
      showToast("All campaigns activated successfully");
      revalidator.revalidate();
    } catch (error) {
      console.error("Failed to activate campaigns:", error);
      showToast(getErrorMessage(error), true);
    }
  };

  const handleDeclareWinner = async (winningVariantKey: string) => {
    if (
      !confirm(
        `Are you sure you want to declare ${winningVariantKey} as the winner? This will pause all other variants.`
      )
    ) {
      return;
    }

    try {
      await apiClient.post(`/api/experiments/${experiment.id}/declare-winner`, {
        winningVariantKey,
      });
      showToast("Winner declared successfully");
      revalidator.revalidate();
    } catch (error) {
      console.error("Failed to declare winner:", error);
      showToast(getErrorMessage(error), true);
    }
  };

  // Tabs configuration
  const tabs = [
    {
      id: "overview",
      content: "Overview",
      panelID: "overview-panel",
    },
    {
      id: "metrics",
      content: "Metrics",
      panelID: "metrics-panel",
    },
    {
      id: "history",
      content: "History",
      panelID: "history-panel",
    },
  ];

  // Overview Tab Content
  const overviewContent = (
    <BlockStack gap="400">
      {/* Status Banner */}
      {!isExperimentActive && experiment.variants.length > 0 && (
        <Banner tone="info">
          <p>
            This experiment is not active. Click &ldquo;Activate All Campaigns&rdquo; to start
            running the experiment.
          </p>
        </Banner>
      )}

      {isExperimentActive && (
        <Banner tone="success">
          <p>This experiment is currently running with active campaigns.</p>
        </Banner>
      )}

      {/* Experiment Info */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Experiment Details
            </Text>
            <Divider />

            <DescriptionList
              items={[
                {
                  term: "Hypothesis",
                  description: experiment.hypothesis || "No hypothesis provided",
                },
                {
                  term: "Start Date",
                  description: experiment.startDate
                    ? new Date(experiment.startDate).toLocaleDateString()
                    : "Not started",
                },
                {
                  term: "End Date",
                  description: experiment.endDate
                    ? new Date(experiment.endDate).toLocaleDateString()
                    : "Not set",
                },
                {
                  term: "Duration",
                  description: experiment.plannedDurationDays
                    ? `${experiment.plannedDurationDays} days`
                    : "Not set",
                },
              ]}
            />
          </BlockStack>
        </Box>
      </Card>

      {/* Variants */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Variants ({experiment.variants.length})
            </Text>
            <Divider />

            {experiment.variants.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={["Variant", "Name", "Control", "Traffic", "Status"]}
                rows={variantRows}
              />
            ) : (
              <Banner tone="info">
                <p>No variants have been created for this experiment yet.</p>
              </Banner>
            )}
          </BlockStack>
        </Box>
      </Card>
    </BlockStack>
  );

  // Metrics Tab Content
  const metricsContent = (
    <BlockStack gap="400">
      {analytics && analytics.variants.length > 0 ? (
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Variant Performance
                </Text>
                <InlineStack gap="200">
                  {analytics.isSignificant && analytics.winner && (
                    <Badge tone="success">{`Winner: ${analytics.winner}`}</Badge>
                  )}
                  <Button onClick={() => navigate("analytics")}>View Full Analytics</Button>
                </InlineStack>
              </InlineStack>
              <Divider />

              {analytics.isSignificant && (
                <Banner tone="success">
                  <p>Statistical significance detected (p &lt; 0.05). Results are reliable!</p>
                </Banner>
              )}

              {!analytics.isSignificant && analytics.variants.some((v) => v.impressions > 0) && (
                <Banner tone="info">
                  <p>Not enough data yet for statistical significance. Keep the test running.</p>
                </Banner>
              )}

              <DataTable
                columnContentTypes={[
                  "text",
                  "numeric",
                  "numeric",
                  "numeric",
                  "numeric",
                  "numeric",
                  "text",
                ]}
                headings={[
                  "Variant",
                  "Impressions",
                  "Submissions",
                  "Conv Rate",
                  "Revenue",
                  "AOV",
                  "Actions",
                ]}
                rows={analytics.variants.map((variant) => [
                  <InlineStack gap="200" key={variant.variantKey}>
                    <Text as="span" fontWeight={variant.isControl ? "semibold" : "regular"}>
                      {variant.variantKey}
                    </Text>
                    {variant.isControl && <Badge tone="info">Control</Badge>}
                    {analytics.winner === variant.variantKey && (
                      <Badge tone="success">Winner</Badge>
                    )}
                  </InlineStack>,
                  variant.impressions.toLocaleString(),
                  variant.submissions.toLocaleString(),
                  `${variant.conversionRate.toFixed(2)}%`,
                  formatMoney(variant.revenue),
                  formatMoney(variant.averageOrderValue),
                  !analytics.winner && analytics.isSignificant && isExperimentActive ? (
                    <button
                      key={variant.variantKey}
                      onClick={() => handleDeclareWinner(variant.variantKey)}
                      style={{
                        cursor: "pointer",
                        textDecoration: "underline",
                        color: "#005BD3",
                        background: "none",
                        border: "none",
                      }}
                    >
                      Declare Winner
                    </button>
                  ) : (
                    "-"
                  ),
                ])}
              />
            </BlockStack>
          </Box>
        </Card>
      ) : (
        <Card>
          <Box padding="400">
            <Banner tone="info">
              <p>No performance data available yet. Start the experiment to see metrics.</p>
            </Banner>
          </Box>
        </Card>
      )}
    </BlockStack>
  );

  // History Tab Content
  const historyContent = (
    <BlockStack gap="400">
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">
              Experiment History
            </Text>
            <Divider />

            <DataTable
              columnContentTypes={["text", "text", "text", "text"]}
              headings={["Date", "Action", "User", "Details"]}
              rows={[
                [
                  new Date(experiment.updatedAt).toLocaleDateString(),
                  "Updated",
                  "Admin",
                  "Modified experiment settings",
                ],
                [
                  new Date(experiment.createdAt).toLocaleDateString(),
                  "Created",
                  "Admin",
                  "Experiment created",
                ],
              ]}
            />
          </BlockStack>
        </Box>
      </Card>
    </BlockStack>
  );

  // Toast component
  const toastMarkup = toastMessage ? (
    <Toast content={toastMessage} error={toastError} onDismiss={() => setToastMessage(null)} />
  ) : null;

  return (
    <Page
      title={experiment.name}
      subtitle={experiment.description || "A/B Testing Experiment"}
      backAction={{ onAction: () => navigate("/app") }}
      titleMetadata={<Badge {...statusBadge} />}
      primaryAction={{
        content: "Edit Experiment",
        onAction: handleEdit,
      }}
      secondaryActions={
        !isExperimentActive && experiment.variants.length > 0
          ? [
              {
                content: "Activate All Campaigns",
                onAction: handleActivateAll,
              },
            ]
          : undefined
      }
    >
      <BlockStack gap="400">
        <Card>
          <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
            <Box padding="400">
              {selectedTab === 0 && overviewContent}
              {selectedTab === 1 && metricsContent}
              {selectedTab === 2 && historyContent}
            </Box>
          </Tabs>
        </Card>
      </BlockStack>
      {toastMarkup}
    </Page>
  );
}
