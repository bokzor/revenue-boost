/**
 * Experiment Edit Page
 *
 * Edit A/B testing experiment with all variants
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Frame, Toast } from "@shopify/polaris";
import { useState, useEffect } from "react";

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
  selectedVariant?: string | null;
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

    // Filter out any null results and sort by variantKey to ensure consistent order (A, B, C, etc.)
    const validVariants = variants
      .filter((v): v is CampaignWithConfigs => v !== null)
      .sort((a, b) => {
        const keyA = a.variantKey || '';
        const keyB = b.variantKey || '';
        return keyA.localeCompare(keyB);
      });

    // Get the variant query parameter if provided
    const url = new URL(request.url);
    const variantParam = url.searchParams.get('variant');

    console.log('[Experiment Edit Loader] experimentId:', experimentId);
    console.log('[Experiment Edit Loader] variantParam:', variantParam);
    console.log('[Experiment Edit Loader] validVariants:', validVariants.map(v => ({ id: v.id, variantKey: v.variantKey })));

    return data<LoaderData>({
      experiment,
      variants: validVariants,
      storeId,
      shopDomain: session.shop,
      selectedVariant: variantParam,
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
  const { experiment, variants, storeId, shopDomain, selectedVariant } = useLoaderData<typeof loader>();
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
  useEffect(() => {
    if (!experiment || variants.length === 0) {
      navigate("/app/campaigns");
    }
  }, [experiment, variants, navigate]);

  if (!experiment || variants.length === 0) {
    return null;
  }

  // Determine which variant to display initially
  // If a variant is specified in the query parameter, use that; otherwise use Variant A (or first variant if A doesn't exist)
  const targetVariant = selectedVariant
    ? variants.find(v => v.variantKey === selectedVariant) || variants[0]
    : variants.find(v => v.variantKey === 'A') || variants[0];

  console.log('[Experiment Edit Page] selectedVariant param:', selectedVariant);
  console.log('[Experiment Edit Page] targetVariant:', { id: targetVariant.id, variantKey: targetVariant.variantKey });
  console.log('[Experiment Edit Page] all variants:', variants.map(v => ({ id: v.id, variantKey: v.variantKey })));

  const initialData: Partial<CampaignFormData> = {
    name: experiment.name,
    description: experiment.description || "",
    templateType: targetVariant.templateType,
    templateId: targetVariant.templateId || undefined,
    goal: targetVariant.goal,
    status: targetVariant.status,
    priority: targetVariant.priority,
    experimentId: experiment.id,
    isControl: targetVariant.isControl,
    variantKey: targetVariant.variantKey || "A",
    contentConfig: targetVariant.contentConfig,
    designConfig: targetVariant.designConfig,
    targetRules: targetVariant.targetRules,
    discountConfig: targetVariant.discountConfig || undefined,
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
        currentVariantKey={targetVariant.variantKey || "A"}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      {toastMarkup}
    </Frame>
  );
}

