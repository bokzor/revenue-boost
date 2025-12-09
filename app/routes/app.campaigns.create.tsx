/**
 * Unified Campaign Creation Route (V2)
 *
 * New streamlined flow for creating campaigns and experiments.
 * Route: /app/campaigns/create
 *
 * Flow:
 * 1. Mode selection (Single Campaign vs A/B Experiment)
 * 2. Recipe-first approach with 2-column layout
 * 3. Collapsible sections for progressive disclosure
 */

import { useState, useCallback, useEffect } from "react";
import { data, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, useNavigate, useSubmit, useActionData } from "react-router";
import { Frame, Toast } from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { PlanGuardService } from "~/domains/billing/services/plan-guard.server";
import { PlanLimitError } from "~/domains/billing/errors";
import { ServiceError } from "~/lib/errors.server";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import {
  ModeSelector,
  SingleCampaignFlow,
  ExperimentFlow,
  CampaignErrorBoundary,
  type CreationMode,
  type CampaignData,
  type Experiment,
} from "~/domains/campaigns/components/unified";
import {
  CampaignService,
  ExperimentService,
} from "~/domains/campaigns/index.server";
import prisma from "~/db.server";
import { StoreSettingsSchema } from "~/domains/store/types/settings";
import { presetToDesignTokens, type ThemePresetInput } from "~/domains/store/types/theme-preset";
import type { DesignTokens } from "~/domains/campaigns/types/design-tokens";

// =============================================================================
// LOADER
// =============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const storeId = await getStoreId(request);
    const planContext = await PlanGuardService.getPlanContext(storeId);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true },
    });

    const parsedSettings = StoreSettingsSchema.partial().safeParse(store?.settings || {});

    // Get default theme tokens from store's default preset
    let defaultThemeTokens: DesignTokens | undefined;
    if (parsedSettings.success) {
      const presets = parsedSettings.data.customThemePresets as ThemePresetInput[] | undefined;
      const defaultPreset = presets?.find((p) => p.isDefault);
      if (defaultPreset) {
        defaultThemeTokens = presetToDesignTokens(defaultPreset);
      }
    }

    return data({
      storeId,
      shopDomain: session.shop,
      recipes: STYLED_RECIPES,
      advancedTargetingEnabled: planContext.definition.features.advancedTargeting,
      experimentsEnabled: planContext.definition.features.experiments,
      globalCustomCSS: parsedSettings.success ? parsedSettings.data.globalCustomCSS : undefined,
      customThemePresets: parsedSettings.success ? parsedSettings.data.customThemePresets : undefined,
      defaultThemeTokens,
      success: true,
    });
  } catch (error) {
    console.error("Error loading campaign create page:", error);
    return data({
      storeId: "",
      shopDomain: "",
      recipes: STYLED_RECIPES,
      advancedTargetingEnabled: false,
      experimentsEnabled: false,
      globalCustomCSS: undefined,
      customThemePresets: undefined,
      defaultThemeTokens: undefined,
      success: false,
    });
  }
}

// =============================================================================
// ACTION
// =============================================================================

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const storeId = await getStoreId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create_campaign") {
    const campaignDataJson = formData.get("campaignData") as string;
    const rawData = JSON.parse(campaignDataJson);

    try {
      // Valid theme values for the schema
      const VALID_THEMES = [
        "modern", "minimal", "dark", "gradient", "luxury", "neon", "ocean",
        "summer", "black-friday", "cyber-monday", "holiday", "valentine", "spring"
      ];

      // Transform designConfig - remove invalid theme values from recipes
      // Recipes have custom theme names like "elegant-luxe" which aren't valid schema values
      // They use themeMode: "preset" with presetId instead
      const designConfig = rawData.designConfig ? { ...rawData.designConfig } : {};
      if (designConfig.theme && !VALID_THEMES.includes(designConfig.theme)) {
        // Recipe theme name - remove it, use themeMode/presetId instead
        delete designConfig.theme;
      }

      // Transform CampaignData from UI into CampaignCreateData for service
      // The UI sends: name, description, recipe, templateType, contentConfig, designConfig,
      //               discountConfig, targetingConfig, frequencyConfig, scheduleConfig
      const createData = {
        name: rawData.name,
        description: rawData.description,
        // Goal comes from the recipe, fall back to NEWSLETTER_SIGNUP
        goal: rawData.recipe?.goal || rawData.goal || "NEWSLETTER_SIGNUP",
        // Status from schedule config or default to DRAFT
        status: rawData.scheduleConfig?.status || rawData.status || "DRAFT",
        priority: rawData.scheduleConfig?.priority,
        // Template type from recipe or explicit templateType
        templateType: rawData.recipe?.templateType || rawData.templateType,
        // templateId is not used for styled recipes - all config is embedded in the campaign
        templateId: undefined,
        // Configs (use sanitized designConfig)
        contentConfig: rawData.contentConfig,
        designConfig,
        discountConfig: rawData.discountConfig,
        // Target rules from targeting config (rename for API)
        targetRules: rawData.targetingConfig,
        // Dates from schedule config
        startDate: rawData.scheduleConfig?.startDate,
        endDate: rawData.scheduleConfig?.endDate,
        // A/B Testing fields (not used for single campaigns)
        experimentId: undefined,
        variantKey: undefined,
        isControl: undefined,
      };

      console.log("[create campaign] Transformed data:", JSON.stringify(createData, null, 2));

      // Create campaign using service directly
      const campaign = await CampaignService.createCampaign(
        storeId,
        createData,
        admin
      );
      return redirect(`/app/campaigns/${campaign.id}`);
    } catch (error) {
      console.error("[create campaign] Error:", error);

      // Handle plan limit errors with specific details
      if (error instanceof PlanLimitError) {
        return data({
          success: false,
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details,
        }, { status: error.httpStatus });
      }

      // Handle validation errors with details
      if (error instanceof ServiceError && error.code === "VALIDATION_FAILED") {
        const validationErrors = Array.isArray(error.details) ? error.details : [error.message];
        return data({
          success: false,
          error: "Campaign validation failed",
          errorCode: "VALIDATION_FAILED",
          validationErrors,
        }, { status: 400 });
      }

      const message = error instanceof Error ? error.message : "Failed to create campaign";
      return data({ success: false, error: message }, { status: 400 });
    }
  }

  if (intent === "create_experiment") {
    const experimentDataJson = formData.get("experimentData") as string;
    const rawData = JSON.parse(experimentDataJson);

    try {
      // Validate that we have configured variants
      const configuredVariants = (rawData.variants || []).filter(
        (v: { status: string; campaignData?: unknown }) => v.status === "configured" && v.campaignData
      );

      if (configuredVariants.length === 0) {
        return data({
          success: false,
          error: "At least one variant must be configured before saving"
        }, { status: 400 });
      }

      // Transform UI Experiment format to ExperimentCreateData schema
      // UI sends: { name, hypothesis, successMetric (string), trafficAllocation (array), variants, status }
      // Schema expects: { name, hypothesis, successMetrics (object), trafficAllocation (object), ... }

      // Transform trafficAllocation from array to object
      // [ { variantId: "A", percentage: 50 }, { variantId: "B", percentage: 50 } ]
      // => { A: 50, B: 50 }
      const trafficAllocation: { A: number; B: number; C?: number; D?: number } = { A: 50, B: 50 };
      if (Array.isArray(rawData.trafficAllocation)) {
        for (const alloc of rawData.trafficAllocation) {
          const key = alloc.variantId as "A" | "B" | "C" | "D";
          trafficAllocation[key] = alloc.percentage;
        }
      }

      // Transform successMetric string to successMetrics object
      const metricMap: Record<string, "conversion_rate" | "revenue_per_visitor" | "email_signups" | "click_through_rate" | "engagement_rate"> = {
        email_signups: "email_signups",
        discount_redemptions: "conversion_rate",
        ctr: "click_through_rate",
        revenue: "revenue_per_visitor",
      };
      const primaryMetric = metricMap[rawData.successMetric] || "conversion_rate";

      const experimentCreateData = {
        name: rawData.name,
        description: rawData.hypothesis,
        hypothesis: rawData.hypothesis,
        trafficAllocation,
        successMetrics: {
          primaryMetric,
        },
      };

      console.log("[create experiment] Experiment data:", JSON.stringify(experimentCreateData, null, 2));

      // 1. Create the experiment first
      const experiment = await ExperimentService.createExperiment(storeId, experimentCreateData);

      // 2. Create variant campaigns linked to the experiment
      const variantKeys = ["A", "B", "C", "D"] as const;
      for (let i = 0; i < configuredVariants.length; i++) {
        const variant = configuredVariants[i];
        const variantKey = variantKeys[i];
        const campaignData = variant.campaignData;

        if (!campaignData) continue;

        // Valid theme values for the schema
        const VALID_THEMES = [
          "modern", "minimal", "dark", "gradient", "luxury", "neon", "ocean",
          "summer", "black-friday", "cyber-monday", "holiday", "valentine", "spring"
        ];

        // Sanitize designConfig
        const designConfig = campaignData.designConfig ? { ...campaignData.designConfig } : {};
        if (designConfig.theme && !VALID_THEMES.includes(designConfig.theme)) {
          delete designConfig.theme;
        }

        const variantCampaignData = {
          name: `${rawData.name} - Variant ${variantKey}`,
          description: campaignData.description,
          goal: campaignData.recipe?.goal || "NEWSLETTER_SIGNUP",
          status: (rawData.status === "running" ? "ACTIVE" : "DRAFT") as "DRAFT" | "ACTIVE",
          templateType: campaignData.recipe?.templateType || campaignData.templateType,
          templateId: undefined,
          contentConfig: campaignData.contentConfig,
          designConfig,
          discountConfig: campaignData.discountConfig,
          targetRules: campaignData.targetingConfig,
          startDate: campaignData.scheduleConfig?.startDate,
          endDate: campaignData.scheduleConfig?.endDate,
          // Link to experiment
          experimentId: experiment.id,
          variantKey,
          isControl: variant.isControl || i === 0,
        };

        console.log(`[create experiment] Creating variant ${variantKey}:`, JSON.stringify(variantCampaignData, null, 2));

        await CampaignService.createCampaign(storeId, variantCampaignData, admin);
      }

      return redirect(`/app/experiments/${experiment.id}`);
    } catch (error) {
      console.error("[create experiment] Error:", error);

      // Handle plan limit errors with specific details
      if (error instanceof PlanLimitError) {
        return data({
          success: false,
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details,
        }, { status: error.httpStatus });
      }

      // Handle validation errors with details
      if (error instanceof ServiceError && error.code === "VALIDATION_FAILED") {
        const validationErrors = Array.isArray(error.details) ? error.details : [error.message];
        return data({
          success: false,
          error: "Experiment validation failed",
          errorCode: "VALIDATION_FAILED",
          validationErrors,
        }, { status: 400 });
      }

      const message = error instanceof Error ? error.message : "Failed to create experiment";
      return data({ success: false, error: message }, { status: 400 });
    }
  }

  return data({ success: false, error: "Unknown intent" }, { status: 400 });
}

// =============================================================================
// COMPONENT
// =============================================================================

interface ActionData {
  success: boolean;
  error?: string;
  errorCode?: string;
  errorDetails?: {
    limitType?: string;
    current?: number;
    max?: number;
    planTier?: string;
  };
  validationErrors?: string[];
}

export default function UnifiedCampaignCreate() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const [mode, setMode] = useState<CreationMode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  // Show error toast when action returns an error
  useEffect(() => {
    if (actionData && !actionData.success && actionData.error) {
      // Build a user-friendly message based on error type
      let message = actionData.error;

      if (actionData.errorCode === "PLAN_LIMIT_EXCEEDED" && actionData.errorDetails) {
        const { limitType, max, planTier } = actionData.errorDetails;
        if (limitType === "maxExperiments") {
          message = `You've reached the limit of ${max} experiments on your ${planTier} plan. Please archive existing experiments or upgrade your plan.`;
        } else if (limitType === "maxCampaigns") {
          message = `You've reached the limit of ${max} active campaigns on your ${planTier} plan. Please pause or archive existing campaigns, or upgrade your plan.`;
        }
      } else if (actionData.errorCode === "VALIDATION_FAILED" && actionData.validationErrors?.length) {
        // Show first validation error in a user-friendly way
        const firstError = actionData.validationErrors[0];
        message = `Validation error: ${firstError}`;
      }

      setToastMessage(message);
      setToastError(true);
    }
  }, [actionData]);

  const handleBack = useCallback(() => {
    if (mode) {
      setMode(null);
    } else {
      navigate("/app");
    }
  }, [mode, navigate]);

  const handleSaveCampaign = useCallback(async (campaignData: CampaignData) => {
    const formData = new FormData();
    formData.append("intent", "create_campaign");
    formData.append("campaignData", JSON.stringify(campaignData));
    submit(formData, { method: "post" });
  }, [submit]);

  const handleSaveDraft = useCallback(async (campaignData: CampaignData) => {
    const formData = new FormData();
    formData.append("intent", "create_campaign");
    formData.append("campaignData", JSON.stringify({ ...campaignData, status: "DRAFT" }));
    submit(formData, { method: "post" });
  }, [submit]);

  const handleSaveExperiment = useCallback(async (experiment: Experiment) => {
    const formData = new FormData();
    formData.append("intent", "create_experiment");
    formData.append("experimentData", JSON.stringify(experiment));
    submit(formData, { method: "post" });
  }, [submit]);

  const handleToastDismiss = useCallback(() => {
    setToastMessage(null);
    setToastError(false);
  }, []);

  // Mode selection screen
  if (!mode) {
    return (
      <Frame>
        <ModeSelector
          onModeSelect={setMode}
          experimentsEnabled={loaderData.experimentsEnabled}
        />
        {toastMessage && (
          <Toast content={toastMessage} error={toastError} onDismiss={handleToastDismiss} />
        )}
      </Frame>
    );
  }

  // Single campaign flow
  if (mode === "single") {
    return (
      <Frame>
        <CampaignErrorBoundary context="SingleCampaignFlow">
          <SingleCampaignFlow
            onBack={handleBack}
            onSave={handleSaveCampaign}
            onSaveDraft={handleSaveDraft}
            recipes={loaderData.recipes}
            storeId={loaderData.storeId}
            shopDomain={loaderData.shopDomain}
            globalCustomCSS={loaderData.globalCustomCSS}
            customThemePresets={loaderData.customThemePresets}
            advancedTargetingEnabled={loaderData.advancedTargetingEnabled}
            defaultThemeTokens={loaderData.defaultThemeTokens}
          />
        </CampaignErrorBoundary>
        {toastMessage && (
          <Toast content={toastMessage} error={toastError} onDismiss={handleToastDismiss} />
        )}
      </Frame>
    );
  }

  // Experiment flow
  return (
    <Frame>
      <CampaignErrorBoundary context="ExperimentFlow">
        <ExperimentFlow
          onBack={handleBack}
          onSave={handleSaveExperiment}
          recipes={loaderData.recipes}
          storeId={loaderData.storeId}
          shopDomain={loaderData.shopDomain}
          advancedTargetingEnabled={loaderData.advancedTargetingEnabled}
          customThemePresets={loaderData.customThemePresets}
        />
      </CampaignErrorBoundary>
      {toastMessage && (
        <Toast content={toastMessage} error={toastError} onDismiss={handleToastDismiss} />
      )}
    </Frame>
  );
}
