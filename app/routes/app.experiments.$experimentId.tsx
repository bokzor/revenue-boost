/**
 * Experiment Detail Page
 *
 * View and manage A/B testing experiments with variants
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { Page, Card, Text, Badge, InlineStack, BlockStack, DataTable, Banner, Toast } from "@shopify/polaris";
import { useState } from "react";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { ExperimentService } from "~/domains/campaigns";
import type { ExperimentWithVariants } from "~/domains/campaigns";
import { apiClient, getErrorMessage } from "~/lib/api-client";
import { getVariantPerformance, type VariantComparison } from "~/domains/analytics/experiment-analytics.server";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  experiment: ExperimentWithVariants | null;
  storeId: string;
  analytics: VariantComparison | null;
}

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);

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
    if (experiment) {
      analytics = await getVariantPerformance(experimentId, storeId);
    }

    return data<LoaderData>({
      experiment,
      storeId,
      analytics,
    });

  } catch (error) {
    console.error("Failed to load experiment:", error);

    return data<LoaderData>({
      experiment: null,
      storeId: "",
      analytics: null,
    }, { status: 404 });
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ExperimentDetailPage() {
  const { experiment, analytics } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  if (!experiment) {
    return (
      <Page
        title="Experiment Not Found"
        backAction={{ onAction: () => navigate("/app/campaigns") }}
      >
        <Banner tone="critical">
          <p>The experiment you're looking for doesn't exist or has been deleted.</p>
        </Banner>
      </Page>
    );
  }

  // Helper to show toast messages
  const showToast = (message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
  };

  // Calculate derived status from campaign variants
  const campaignStatuses = experiment.variants.map(v => v.status);
  const hasActiveCampaign = campaignStatuses.some(status => status === "ACTIVE");
  const allDraft = campaignStatuses.every(status => status === "DRAFT");
  const allPaused = campaignStatuses.every(status => status === "PAUSED");

  const derivedStatus = hasActiveCampaign ? "ACTIVE" : allDraft ? "DRAFT" : allPaused ? "PAUSED" : "MIXED";
  const isExperimentActive = hasActiveCampaign;

  const statusBadge = {
    tone: derivedStatus === "ACTIVE" ? "success" as const :
      derivedStatus === "PAUSED" ? "warning" as const :
        derivedStatus === "MIXED" ? "attention" as const :
          "info" as const,
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
    if (!confirm(`Are you sure you want to declare ${winningVariantKey} as the winner? This will pause all other variants.`)) {
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

  // Toast component
  const toastMarkup = toastMessage ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastMessage(null)}
    />
  ) : null;

  return (
    <Page
      title={experiment.name}
      subtitle={experiment.description || "A/B Testing Experiment"}
      backAction={{ onAction: () => navigate("/app/campaigns") }}
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
        {/* Status Banner */}
        {!isExperimentActive && experiment.variants.length > 0 && (
          <Banner tone="info">
            <p>
              This experiment is not active. Click "Activate All Campaigns" to start running the experiment.
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
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Experiment Details</Text>

            {experiment.hypothesis && (
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">Hypothesis</Text>
                <Text as="p" variant="bodyMd" tone="subdued">{experiment.hypothesis}</Text>
              </BlockStack>
            )}

            <InlineStack gap="400">
              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="semibold">Start Date</Text>
                <Text as="p" variant="bodyMd">
                  {experiment.startDate ? new Date(experiment.startDate).toLocaleDateString() : "Not started"}
                </Text>
              </BlockStack>

              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="semibold">End Date</Text>
                <Text as="p" variant="bodyMd">
                  {experiment.endDate ? new Date(experiment.endDate).toLocaleDateString() : "Not set"}
                </Text>
              </BlockStack>

              {experiment.plannedDurationDays && (
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">Duration</Text>
                  <Text as="p" variant="bodyMd">{experiment.plannedDurationDays} days</Text>
                </BlockStack>
              )}
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Analytics Performance */}
        {analytics && analytics.variants.length > 0 && (
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">Variant Performance</Text>
                {analytics.isSignificant && analytics.winner && (
                  <Badge tone="success">{`Winner: ${analytics.winner}`}</Badge>
                )}
              </InlineStack>

              {analytics.isSignificant && (
                <Banner tone="success">
                  <p>Statistical significance detected (p &lt; 0.05). Results are reliable!</p>
                </Banner>
              )}

              {!analytics.isSignificant && analytics.variants.some(v => v.impressions > 0) && (
                <Banner tone="info">
                  <p>Not enough data yet for statistical significance. Keep the test running.</p>
                </Banner>
              )}

              <DataTable
                columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric", "numeric", "text"]}
                headings={["Variant", "Impressions", "Submissions", "Conv Rate", "Revenue", "AOV", "Actions"]}
                rows={analytics.variants.map((variant) => [
                  <InlineStack gap="200" key={variant.variantKey}>
                    <Text as="span" fontWeight={variant.isControl ? "semibold" : "regular"}>
                      {variant.variantKey}
                    </Text>
                    {variant.isControl && <Badge tone="info">Control</Badge>}
                    {analytics.winner === variant.variantKey && <Badge tone="success">Winner</Badge>}
                  </InlineStack>,
                  variant.impressions.toLocaleString(),
                  variant.submissions.toLocaleString(),
                  `${variant.conversionRate.toFixed(2)}%`,
                  `$${variant.revenue.toFixed(2)}`,
                  `$${variant.averageOrderValue.toFixed(2)}`,
                  !analytics.winner && analytics.isSignificant && isExperimentActive ? (
                    <button
                      key={variant.variantKey}
                      onClick={() => handleDeclareWinner(variant.variantKey)}
                      style={{ cursor: "pointer", textDecoration: "underline", color: "#005BD3", background: "none", border: "none" }}
                    >
                      Declare Winner
                    </button>
                  ) : (
                    "-"
                  ),
                ])}
              />
            </BlockStack>
          </Card>
        )}

        {/* Variants */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Variants ({experiment.variants.length})</Text>

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
        </Card>
      </BlockStack>
      {toastMarkup}
    </Page>
  );
}

