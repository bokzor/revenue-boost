/**
 * Experiment Edit Page
 *
 * Edit A/B testing experiment with all variants.
 * Uses the unified ExperimentFlow component.
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Frame, Toast } from "@shopify/polaris";
import { useState, useEffect, useCallback } from "react";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { ExperimentService, CampaignService } from "~/domains/campaigns";
import {
  ExperimentFlow,
  CampaignErrorBoundary,
  type Experiment,
  type Variant,
  type SuccessMetric,
} from "~/domains/campaigns/components/unified";
import type { CampaignData } from "~/domains/campaigns/components/unified/SingleCampaignFlow";
import type { ExperimentWithVariants } from "~/domains/campaigns";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { StyledRecipe } from "~/domains/campaigns/recipes/styled-recipe-types";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import prisma from "~/db.server";
import { StoreSettingsSchema } from "~/domains/store/types/settings";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  experiment: ExperimentWithVariants | null;
  variants: CampaignWithConfigs[];
  storeId: string;
  shopDomain: string;
  recipes: StyledRecipe[];
  globalCustomCSS?: string;
  customThemePresets?: Array<{
    id: string;
    name: string;
    brandColor: string;
    backgroundColor: string;
    textColor: string;
    surfaceColor?: string;
    successColor?: string;
    fontFamily?: string;
  }>;
  advancedTargetingEnabled: boolean;
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
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true },
    });
    const parsedSettings = StoreSettingsSchema.partial().safeParse(store?.settings || {});

    // Get experiment details
    const experiment = await ExperimentService.getExperimentById(experimentId, storeId);

    if (!experiment) {
      throw new Error("Experiment not found");
    }

    // Get all variant campaigns with full details
    const variantIds = experiment.variants.map((v) => v.id);
    const variants = await Promise.all(
      variantIds.map((id) => CampaignService.getCampaignById(id, storeId))
    );

    // Filter out any null results and sort by variantKey to ensure consistent order (A, B, C, etc.)
    const validVariants = variants
      .filter((v): v is CampaignWithConfigs => v !== null)
      .sort((a, b) => {
        const keyA = a.variantKey || "";
        const keyB = b.variantKey || "";
        return keyA.localeCompare(keyB);
      });

    console.log("[Experiment Edit Loader] experimentId:", experimentId);
    console.log(
      "[Experiment Edit Loader] validVariants:",
      validVariants.map((v) => ({ id: v.id, variantKey: v.variantKey }))
    );

    // Get plan context for feature flags
    const { PlanGuardService } = await import("~/domains/billing/services/plan-guard.server");
    const planContext = await PlanGuardService.getPlanContext(storeId);

    return data<LoaderData>({
      experiment,
      variants: validVariants,
      storeId,
      shopDomain: session.shop,
      recipes: STYLED_RECIPES,
      globalCustomCSS: parsedSettings.success ? parsedSettings.data.globalCustomCSS : undefined,
      customThemePresets: parsedSettings.success ? parsedSettings.data.customThemePresets : undefined,
      advancedTargetingEnabled: planContext.definition.features.advancedTargeting,
    });
  } catch (error) {
    console.error("Failed to load experiment for editing:", error);

    return data<LoaderData>(
      {
        experiment: null,
        variants: [],
        storeId: "",
        shopDomain: "",
        recipes: STYLED_RECIPES,
        globalCustomCSS: undefined,
        customThemePresets: undefined,
        advancedTargetingEnabled: false,
      },
      { status: 404 }
    );
  }
}

// ============================================================================
// HELPERS - Convert database types to ExperimentFlow types
// ============================================================================

/**
 * Map database success metric to ExperimentFlow's SuccessMetric
 */
function mapSuccessMetric(dbMetric: string | undefined): SuccessMetric {
  const metricMap: Record<string, SuccessMetric> = {
    email_signups: "email_signups",
    conversion_rate: "email_signups", // fallback
    discount_redemptions: "discount_redemptions",
    click_through_rate: "ctr",
    revenue_per_visitor: "revenue",
  };
  return metricMap[dbMetric || ""] || "email_signups";
}

/**
 * Convert CampaignWithConfigs to CampaignData for a variant
 */
function campaignToCampaignData(campaign: CampaignWithConfigs): CampaignData {
  return {
    name: campaign.name,
    description: campaign.description || "",
    templateType: campaign.templateType,
    contentConfig: campaign.contentConfig || {},
    designConfig: campaign.designConfig || {},
    discountConfig: campaign.discountConfig,
    targetingConfig: {
      enhancedTriggers: campaign.targetRules?.enhancedTriggers || {},
      audienceTargeting: campaign.targetRules?.audienceTargeting || {
        enabled: false,
        shopifySegmentIds: [],
      },
      geoTargeting: campaign.targetRules?.geoTargeting || {
        enabled: false,
        mode: "include" as const,
        countries: [],
      },
      pageTargeting: campaign.targetRules?.pageTargeting,
    },
    frequencyConfig: {
      enabled: !!campaign.targetRules?.enhancedTriggers?.frequency_capping,
      max_triggers_per_session:
        campaign.targetRules?.enhancedTriggers?.frequency_capping?.max_triggers_per_session || 1,
      max_triggers_per_day:
        campaign.targetRules?.enhancedTriggers?.frequency_capping?.max_triggers_per_day || 3,
      cooldown_between_triggers:
        campaign.targetRules?.enhancedTriggers?.frequency_capping?.cooldown_between_triggers || 300,
      respectGlobalCap: true,
    },
    scheduleConfig: {
      status: campaign.status,
      priority: campaign.priority,
      startDate: campaign.startDate?.toISOString(),
      endDate: campaign.endDate?.toISOString(),
    },
  };
}

/**
 * Convert database experiment + variants to ExperimentFlow's Experiment type
 */
function convertToExperimentFlowData(
  dbExperiment: ExperimentWithVariants,
  dbVariants: CampaignWithConfigs[],
  recipes: StyledRecipe[]
): Experiment {
  // Map traffic allocation from { A: 50, B: 50 } to [{ variantId: "...", percentage: 50 }, ...]
  const trafficAllocation = dbExperiment.variants.map((v) => ({
    variantId: v.id,
    percentage: (dbExperiment.trafficAllocation as Record<string, number>)?.[v.variantKey] || 50,
  }));

  // Map variants
  const variants: Variant[] = dbExperiment.variants.map((expVariant) => {
    const campaign = dbVariants.find((c) => c.id === expVariant.id);

    // Try to find a matching recipe
    const matchingRecipe = recipes.find(
      (r) => campaign && r.templateType === campaign.templateType
    );

    return {
      id: expVariant.id,
      name: expVariant.variantKey,
      status: campaign ? "configured" : "empty",
      isControl: expVariant.isControl,
      recipe: matchingRecipe,
      campaignData: campaign ? campaignToCampaignData(campaign) : undefined,
    };
  });

  // Map experiment status
  const statusMap: Record<string, "draft" | "running" | "completed"> = {
    DRAFT: "draft",
    RUNNING: "running",
    PAUSED: "running",
    COMPLETED: "completed",
    ARCHIVED: "completed",
  };

  return {
    id: dbExperiment.id,
    name: dbExperiment.name,
    hypothesis: dbExperiment.hypothesis || "",
    successMetric: mapSuccessMetric(dbExperiment.successMetrics?.primaryMetric),
    variants,
    trafficAllocation,
    status: statusMap[dbExperiment.status] || "draft",
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ExperimentEditPage() {
  const {
    experiment,
    variants,
    storeId,
    shopDomain,
    recipes,
    globalCustomCSS: _globalCustomCSS,
    customThemePresets,
    advancedTargetingEnabled,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  // Show toast helper
  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(`/app/experiments/${experiment?.id || ""}`);
  }, [experiment?.id, navigate]);

  // Handle save experiment
  const handleSave = useCallback(
    async (experimentData: Experiment) => {
      if (!experiment) return;

      try {
        // Update the experiment via API
        const response = await fetch(`/api/experiments/${experiment.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(experimentData),
        });

        if (!response.ok) {
          throw new Error("Failed to update experiment");
        }

        showToast("Experiment updated successfully!");

        // Navigate back to experiment detail
        setTimeout(() => {
          navigate(`/app/experiments/${experiment.id}`);
        }, 1000);
      } catch (error) {
        console.error("Failed to save experiment:", error);
        showToast("Failed to save experiment. Please try again.", true);
      }
    },
    [experiment, navigate, showToast]
  );

  // If no experiment found, redirect back
  useEffect(() => {
    if (!experiment || variants.length === 0) {
      navigate("/app");
    }
  }, [experiment, variants, navigate]);

  if (!experiment || variants.length === 0) {
    return null;
  }

  // Convert database experiment to ExperimentFlow format
  const initialExperiment = convertToExperimentFlowData(experiment, variants, recipes);

  // Toast markup
  const toastMarkup = toastMessage ? (
    <Toast content={toastMessage} error={toastError} onDismiss={() => setToastMessage(null)} />
  ) : null;

  return (
    <Frame>
      <CampaignErrorBoundary context="ExperimentEdit">
        <ExperimentFlow
          onBack={handleBack}
          onSave={handleSave}
          recipes={recipes}
          storeId={storeId}
          shopDomain={shopDomain}
          advancedTargetingEnabled={advancedTargetingEnabled}
          customThemePresets={customThemePresets}
          isEditMode
          initialExperiment={initialExperiment}
          experimentId={experiment.id}
        />
      </CampaignErrorBoundary>
      {toastMarkup}
    </Frame>
  );
}
