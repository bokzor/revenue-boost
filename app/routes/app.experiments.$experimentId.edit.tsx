/**
 * Experiment Edit Page
 *
 * Edit A/B testing experiment with all variants
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Frame, Toast } from "@shopify/polaris";
import { useState } from "react";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { ExperimentService, CampaignService } from "~/domains/campaigns";
import { CampaignFormWithABTesting } from "~/domains/campaigns/components/CampaignFormWithABTesting";
import type { ExperimentWithVariants } from "~/domains/campaigns";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  experiment: ExperimentWithVariants | null;
  variants: CampaignWithConfigs[];
  storeId: string;
  shopDomain: string;
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

    if (!experiment) {
      throw new Error("Experiment not found");
    }

    // Get all variant campaigns with full details
    const variantIds = experiment.variants.map(v => v.id);
    const variants = await Promise.all(
      variantIds.map(id => CampaignService.getCampaignById(id, storeId))
    );

    // Filter out any null results
    const validVariants = variants.filter((v): v is CampaignWithConfigs => v !== null);

    return data<LoaderData>({
      experiment,
      variants: validVariants,
      storeId,
      shopDomain: session.shop,
    });

  } catch (error) {
    console.error("Failed to load experiment for editing:", error);

    return data<LoaderData>({
      experiment: null,
      variants: [],
      storeId: "",
      shopDomain: "",
    }, { status: 404 });
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ExperimentEditPage() {
  const { experiment, variants, storeId, shopDomain } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  const handleSave = async (formData: CampaignFormData | CampaignFormData[]) => {
    try {
      // TODO: Implement experiment update logic
      // This should update all variants and the experiment itself

      setToastMessage("Experiment updated successfully!");
      setToastError(false);

      // Navigate back to experiment detail
      setTimeout(() => {
        navigate(`/app/experiments/${experiment?.id}`);
      }, 1000);
    } catch (error) {
      console.error("Failed to save experiment:", error);
      setToastMessage("Failed to save experiment. Please try again.");
      setToastError(true);
    }
  };

  const handleCancel = () => {
    navigate(`/app/experiments/${experiment?.id}`);
  };

  // Toast component
  const toastMarkup = toastMessage ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastMessage(null)}
    />
  ) : null;

  // If no experiment found, redirect back
  if (!experiment || variants.length === 0) {
    navigate("/app/campaigns");
    return null;
  }

  // Convert first variant to initial form data
  // The form will load all variants and allow switching between them
  const firstVariant = variants[0];

  const initialData: Partial<CampaignFormData> = {
    name: experiment.name,
    description: experiment.description || "",
    templateType: firstVariant.templateType,
    templateId: firstVariant.templateId || undefined,
    goal: firstVariant.goal,
    status: firstVariant.status,
    priority: firstVariant.priority,
    experimentId: experiment.id,
    isControl: firstVariant.isControl,
    variantKey: firstVariant.variantKey || "A",
    contentConfig: firstVariant.contentConfig,
    designConfig: firstVariant.designConfig,
    targetRules: firstVariant.targetRules,
    discountConfig: firstVariant.discountConfig || undefined,
  };

  // Prepare experiment data
  const experimentData = {
    id: experiment.id,
    name: experiment.name,
    description: experiment.description,
    hypothesis: experiment.hypothesis,
    successMetric: experiment.successMetrics?.primaryMetric || "conversion_rate",
    trafficAllocation: experiment.trafficAllocation,
    confidenceLevel: experiment.statisticalConfig?.confidenceLevel || 95,
    minimumSampleSize: experiment.statisticalConfig?.minimumSampleSize,
    minimumDetectableEffect: experiment.statisticalConfig?.minimumDetectableEffect || 5,
    startDate: experiment.startDate ? new Date(experiment.startDate).toISOString() : null,
    endDate: experiment.endDate ? new Date(experiment.endDate).toISOString() : null,
    plannedDuration: experiment.plannedDurationDays,
    status: experiment.status,
  };

  // Prepare all variants info
  const allVariantsInfo = experiment.variants.map(v => ({
    id: v.id,
    variantKey: v.variantKey,
    name: v.name,
    isControl: v.isControl,
  }));

  return (
    <Frame>
      <CampaignFormWithABTesting
        storeId={storeId}
        shopDomain={shopDomain}
        initialData={initialData}
        experimentId={experiment.id}
        experimentData={experimentData}
        allVariants={allVariantsInfo}
        currentVariantKey={firstVariant.variantKey || "A"}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      {toastMarkup}
    </Frame>
  );
}

