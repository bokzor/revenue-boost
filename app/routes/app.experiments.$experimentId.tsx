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

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  experiment: ExperimentWithVariants | null;
  storeId: string;
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

    return data<LoaderData>({
      experiment,
      storeId,
    });

  } catch (error) {
    console.error("Failed to load experiment:", error);

    return data<LoaderData>({
      experiment: null,
      storeId: "",
    }, { status: 404 });
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ExperimentDetailPage() {
  const { experiment } = useLoaderData<typeof loader>();
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

