/**
 * Experiment Detail Page
 *
 * View and manage A/B testing experiments with variants
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Page, Card, Text, Badge, InlineStack, BlockStack, DataTable, Banner } from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { ExperimentService } from "~/domains/campaigns";
import type { ExperimentWithVariants } from "~/domains/campaigns";

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

  const statusBadge = {
    tone: experiment.status === "RUNNING" ? "success" as const : 
          experiment.status === "COMPLETED" ? "info" as const : 
          "attention" as const,
    children: experiment.status,
  };

  // Prepare variants table data
  const variantRows = experiment.variants.map((variant) => [
    variant.variantKey,
    variant.name,
    variant.isControl ? "Yes" : "No",
    `${variant.trafficPercentage}%`,
  ]);

  const handleEdit = () => {
    navigate(`/app/experiments/${experiment.id}/edit`);
  };

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
    >
      <BlockStack gap="400">
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
                columnContentTypes={["text", "text", "text", "text"]}
                headings={["Variant", "Name", "Control", "Traffic"]}
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
    </Page>
  );
}

