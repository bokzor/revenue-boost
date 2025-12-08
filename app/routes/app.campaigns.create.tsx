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

import { useState, useCallback } from "react";
import { data, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router";
import { useLoaderData, useNavigate, useSubmit } from "react-router";
import { Frame, Toast } from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { PlanGuardService } from "~/domains/billing/services/plan-guard.server";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import {
  ModeSelector,
  SingleCampaignFlow,
  ExperimentFlow,
  type CreationMode,
  type CampaignData,
  type Experiment,
} from "~/domains/campaigns/components/unified";
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
      defaultThemeTokens: undefined,
      success: false,
    });
  }
}

// =============================================================================
// ACTION
// =============================================================================

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const storeId = await getStoreId(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "create_campaign") {
    const campaignDataJson = formData.get("campaignData") as string;
    const campaignData = JSON.parse(campaignDataJson);

    // Create campaign via API
    const response = await fetch(`${process.env.SHOPIFY_APP_URL}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...campaignData, storeId }),
    });

    if (!response.ok) {
      return data({ success: false, error: "Failed to create campaign" }, { status: 400 });
    }

    const result = await response.json();
    return redirect(`/app/campaigns/${result.id}`);
  }

  if (intent === "create_experiment") {
    const experimentDataJson = formData.get("experimentData") as string;
    const experimentData = JSON.parse(experimentDataJson);

    // Create experiment via API
    const response = await fetch(`${process.env.SHOPIFY_APP_URL}/api/experiments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...experimentData, storeId }),
    });

    if (!response.ok) {
      return data({ success: false, error: "Failed to create experiment" }, { status: 400 });
    }

    const result = await response.json();
    return redirect(`/app/experiments/${result.id}`);
  }

  return data({ success: false, error: "Unknown intent" }, { status: 400 });
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function UnifiedCampaignCreate() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const [mode, setMode] = useState<CreationMode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Mode selection screen
  if (!mode) {
    return (
      <Frame>
        <ModeSelector
          onModeSelect={setMode}
          experimentsEnabled={loaderData.experimentsEnabled}
        />
        {toastMessage && (
          <Toast content={toastMessage} onDismiss={() => setToastMessage(null)} />
        )}
      </Frame>
    );
  }

  // Single campaign flow
  if (mode === "single") {
    return (
      <Frame>
        <SingleCampaignFlow
          onBack={handleBack}
          onSave={handleSaveCampaign}
          onSaveDraft={handleSaveDraft}
          recipes={loaderData.recipes}
          storeId={loaderData.storeId}
          shopDomain={loaderData.shopDomain}
          globalCustomCSS={loaderData.globalCustomCSS}
          advancedTargetingEnabled={loaderData.advancedTargetingEnabled}
          defaultThemeTokens={loaderData.defaultThemeTokens}
        />
        {toastMessage && (
          <Toast content={toastMessage} onDismiss={() => setToastMessage(null)} />
        )}
      </Frame>
    );
  }

  // Experiment flow
  return (
    <Frame>
      <ExperimentFlow
        onBack={handleBack}
        onSave={handleSaveExperiment}
        recipes={loaderData.recipes}
        storeId={loaderData.storeId}
        shopDomain={loaderData.shopDomain}
        advancedTargetingEnabled={loaderData.advancedTargetingEnabled}
      />
      {toastMessage && (
        <Toast content={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}
    </Frame>
  );
}
