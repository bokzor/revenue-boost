/**
 * Campaign Edit Page
 *
 * Edit existing campaign with pre-populated form data
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Frame, Toast, Modal, Text } from "@shopify/polaris";
import { useState, useEffect } from "react";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignService } from "~/domains/campaigns";
import { CampaignFormWithABTesting } from "~/domains/campaigns/components/CampaignFormWithABTesting";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import type { FrequencyCappingConfig } from "~/domains/targeting/components";
import prisma from "~/db.server";
import { StoreSettingsSchema, GLOBAL_FREQUENCY_BEST_PRACTICES } from "~/domains/store/types/settings";
import { PlanGuardService } from "~/domains/billing/services/plan-guard.server";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  campaign: CampaignWithConfigs | null;
  storeId: string;
  shopDomain: string;
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
  globalFrequencyCapping?: {
    enabled: boolean;
    max_per_session?: number;
    max_per_day?: number;
    cooldown_between_popups?: number;
  };
  advancedTargetingEnabled: boolean;
  experimentsEnabled: boolean;
  backgroundsByLayout?: Record<string, import("~/config/background-presets").BackgroundPreset[]>;
  defaultThemeTokens?: import("~/domains/campaigns/types/design-tokens").DesignTokens;
}

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  console.log("[Campaign Edit Loader] Starting loader for campaignId:", params.campaignId);
  console.log("[Campaign Edit Loader] Request URL:", request.url);

  try {
    const { session } = await authenticate.admin(request);
    console.log("[Campaign Edit Loader] Session authenticated:", !!session);

    if (!session?.shop) {
      console.error("[Campaign Edit Loader] No shop session found");
      throw new Error("No shop session found");
    }

    const campaignId = params.campaignId;
    if (!campaignId) {
      console.error("[Campaign Edit Loader] Campaign ID is missing");
      throw new Error("Campaign ID is required");
    }

    const storeId = await getStoreId(request);
    console.log("[Campaign Edit Loader] StoreId:", storeId);

    // Fetch plan context to determine feature availability
    const planContext = await PlanGuardService.getPlanContext(storeId);
    const advancedTargetingEnabled = planContext.definition.features.advancedTargeting;
    const experimentsEnabled = planContext.definition.features.experiments;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true },
    });
    const parsedSettings = StoreSettingsSchema.partial().safeParse(store?.settings || {});

    // Use best practice defaults if store hasn't configured frequency capping yet
    // Global capping is disabled by default to maximize impressions
    const storeFrequencyCapping = parsedSettings.success ? parsedSettings.data.frequencyCapping : undefined;
    const globalFrequencyCapping = storeFrequencyCapping ?? {
      enabled: false,
      ...GLOBAL_FREQUENCY_BEST_PRACTICES,
    };

    // Get campaign details
    console.log("[Campaign Edit Loader] Fetching campaign by ID:", campaignId);
    const campaign = await CampaignService.getCampaignById(campaignId, storeId);
    console.log("[Campaign Edit Loader] Campaign fetched:", campaign ? campaign.id : "null");

    // Lazy-load background presets by layout from recipe service
    const { getBackgroundsByLayoutMap } = await import(
      "~/domains/campaigns/recipes/recipe-service.server"
    );
    const backgroundsByLayout = await getBackgroundsByLayoutMap();

    // Get default theme tokens for preview
    // Priority: 1) Store's default theme preset, 2) Fallback to Shopify theme settings
    const { getDefaultPreset, presetToDesignTokens } = await import(
      "~/domains/store/types/theme-preset"
    );
    let defaultThemeTokens: import("~/domains/campaigns/types/design-tokens").DesignTokens | undefined;

    // Try to get from store's default preset first
    const customPresets = parsedSettings.success ? parsedSettings.data.customThemePresets : undefined;
    if (customPresets && customPresets.length > 0) {
      const defaultPreset = getDefaultPreset(customPresets);
      if (defaultPreset) {
        defaultThemeTokens = presetToDesignTokens(defaultPreset) as import("~/domains/campaigns/types/design-tokens").DesignTokens;
      }
    }

    // Fallback: fetch from Shopify theme if no default preset
    if (!defaultThemeTokens && session.shop && session.accessToken) {
      const { fetchThemeSettings, themeSettingsToDesignTokens } = await import(
        "~/lib/shopify/theme-settings.server"
      );
      const themeResult = await fetchThemeSettings(session.shop, session.accessToken);
      if (themeResult.success && themeResult.settings) {
        defaultThemeTokens = themeSettingsToDesignTokens(themeResult.settings);
      }
    }

    return data<LoaderData>({
      campaign,
      storeId,
      shopDomain: session.shop,
      globalCustomCSS: parsedSettings.success ? parsedSettings.data.globalCustomCSS : undefined,
      customThemePresets: parsedSettings.success ? parsedSettings.data.customThemePresets : undefined,
      globalFrequencyCapping,
      advancedTargetingEnabled,
      experimentsEnabled,
      backgroundsByLayout,
      defaultThemeTokens,
    });
  } catch (error) {
    console.error("[Campaign Edit Loader] Failed to load campaign for editing:", error);

    return data<LoaderData>(
      {
        campaign: null,
        storeId: "",
        shopDomain: "",
        globalCustomCSS: undefined,
        customThemePresets: undefined,
        globalFrequencyCapping: undefined,
        advancedTargetingEnabled: false,
        experimentsEnabled: false,
      },
      { status: 404 }
    );
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CampaignEditPage() {
  console.log("[Campaign Edit Page] Component rendering");
  const { campaign, storeId, shopDomain, globalCustomCSS, customThemePresets, globalFrequencyCapping, advancedTargetingEnabled, experimentsEnabled, backgroundsByLayout, defaultThemeTokens } =
    useLoaderData<typeof loader>();
  console.log("[Campaign Edit Page] Loaded data - campaign:", campaign?.id, "storeId:", storeId);
  const navigate = useNavigate();

  // State for toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  // Post-save activation modal state
  const [activatePromptOpen, setActivatePromptOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [postSaveNavigateTo, setPostSaveNavigateTo] = useState<string | null>(null);

  // Redirect to experiment edit page if campaign is part of an A/B test
  useEffect(() => {
    if (campaign?.experimentId) {
      console.log(
        `[Campaign Edit] Campaign ${campaign.id} is part of experiment ${campaign.experimentId}, redirecting...`
      );
      navigate(`/app/experiments/${campaign.experimentId}/edit`);
    }
  }, [campaign, navigate]);

  // Helper function to show toast
  const showToast = (message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
  };

  // Default disabled audience targeting config for Free plan users
  const defaultDisabledAudienceTargeting: {
    enabled: boolean;
    shopifySegmentIds: string[];
    sessionRules: {
      enabled: boolean;
      conditions: Array<{
        field: string;
        operator: "in" | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "nin";
        value: string | number | boolean | string[];
      }>;
      logicOperator: "AND" | "OR";
    };
  } = {
    enabled: false,
    shopifySegmentIds: [],
    sessionRules: {
      enabled: false,
      conditions: [],
      logicOperator: "AND",
    },
  };

  // Convert campaign to form data format
  const getInitialFormData = (): Partial<CampaignFormData> | null => {
    if (!campaign) return null;

    // For Free plan users (advancedTargetingEnabled = false), always show disabled audience targeting
    // This ensures they see a clean UI even if the campaign has stale advanced targeting config from before downgrade
    const audienceTargeting = advancedTargetingEnabled
      ? campaign.targetRules?.audienceTargeting ?? defaultDisabledAudienceTargeting
      : defaultDisabledAudienceTargeting;

    return {
      name: campaign.name,
      description: campaign.description || "",
      goal: campaign.goal,
      status: campaign.status,
      priority: campaign.priority || 0,
      templateId: campaign.templateId || "",
      templateType: campaign.templateType,
      contentConfig: campaign.contentConfig,
      designConfig: campaign.designConfig,
      enhancedTriggers: campaign.targetRules?.enhancedTriggers || {},
      audienceTargeting,
      pageTargeting: campaign.targetRules?.pageTargeting || {
        enabled: false,
        pages: [],
        customPatterns: [],
        excludePages: [],
        productTags: [],
        collections: [],
      },
      geoTargeting: campaign.targetRules?.geoTargeting || {
        enabled: false,
        mode: "include" as const,
        countries: [],
      },
      // Load frequency capping from server format (already matches UI format)
      frequencyCapping: {
        enabled: !!campaign.targetRules?.enhancedTriggers?.frequency_capping,
        max_triggers_per_session:
          campaign.targetRules?.enhancedTriggers?.frequency_capping?.max_triggers_per_session,
        max_triggers_per_day:
          campaign.targetRules?.enhancedTriggers?.frequency_capping?.max_triggers_per_day,
        cooldown_between_triggers:
          campaign.targetRules?.enhancedTriggers?.frequency_capping?.cooldown_between_triggers,
        respectGlobalCap: true, // Default to true
      } as FrequencyCappingConfig,
      discountConfig: campaign.discountConfig,
      startDate: campaign.startDate ? campaign.startDate.toISOString() : "",
      endDate: campaign.endDate ? campaign.endDate.toISOString() : "",
      tags: [],
      isSaving: false,
      triggerType: "page_load",
    };
  };

  // Handle save - update campaign via API
  const handleSave = async (campaignData: CampaignFormData | CampaignFormData[]) => {
    if (!campaign) {
      showToast("Campaign not found", true);
      return;
    }

    try {
      // For editing, we only handle single campaigns (not A/B tests)
      if (Array.isArray(campaignData)) {
        showToast("A/B testing updates not supported in edit mode", true);
        return;
      }

      // Extract frequency capping fields (already in server format)
      const {
        enabled,
        max_triggers_per_session,
        max_triggers_per_day,
        cooldown_between_triggers,
      } = campaignData.frequencyCapping;

      // Only include frequency_capping if enabled
      const frequency_capping = enabled
        ? {
            max_triggers_per_session,
            max_triggers_per_day,
            cooldown_between_triggers,
          }
        : undefined;

      const updateData = {
        name: campaignData.name,
        description: campaignData.description,
        goal: campaignData.goal,
        status: campaignData.status,
        priority: campaignData.priority,
        templateType: campaignData.templateType,
        contentConfig: campaignData.contentConfig,
        designConfig: campaignData.designConfig,
        targetRules: {
          enhancedTriggers: {
            ...campaignData.enhancedTriggers,
            frequency_capping,
          },
          audienceTargeting: campaignData.audienceTargeting,
          geoTargeting: campaignData.geoTargeting,
          pageTargeting: campaignData.pageTargeting,
        },
        discountConfig: campaignData.discountConfig,
        startDate: campaignData.startDate,
        endDate: campaignData.endDate,
        tags: campaignData.tags,
      };

      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const planLimit = await tryParsePlanLimitError(response);
        if (planLimit) {
          showToast(planLimit.message, true);
          return;
        }
        throw new Error("Failed to update campaign");
      }

      const needsActivationPrompt = campaign.status === "DRAFT" && campaignData.status === "DRAFT";

      if (needsActivationPrompt) {
        setPostSaveNavigateTo("/app");
        setActivatePromptOpen(true);
        showToast("Campaign updated successfully");
        return;
      }

      showToast("Campaign updated successfully");
      navigate("/app");
    } catch (error) {
      console.error("Failed to update campaign:", error);
      showToast("Failed to update campaign", true);
    }
  };

  const handleCancel = () => {
    navigate("/app");
  };

  // Toast component
  const toastMarkup = toastMessage ? (
    <Toast content={toastMessage} error={toastError} onDismiss={() => setToastMessage(null)} />
  ) : null;

  // If no campaign found, redirect back
  useEffect(() => {
    if (!campaign) {
      console.log("[Campaign Edit Page] No campaign found, redirecting to dashboard");
      navigate("/app");
    }
  }, [campaign, navigate]);

  if (!campaign) {
    return null;
  }

  const initialData = getInitialFormData();
  if (!initialData) {
    console.log("[Campaign Edit Page] No initial data, returning null");
    return null;
  }

  console.log("[Campaign Edit Page] Rendering form with campaign:", campaign.id);
  return (
    <Frame>
      <CampaignFormWithABTesting
        storeId={storeId}
        shopDomain={shopDomain}
        initialData={initialData}
        campaignId={campaign?.id}
        globalCustomCSS={globalCustomCSS}
        customThemePresets={customThemePresets}
        globalFrequencyCapping={globalFrequencyCapping}
        advancedTargetingEnabled={advancedTargetingEnabled}
        experimentsEnabled={experimentsEnabled}
        backgroundsByLayout={backgroundsByLayout}
        defaultThemeTokens={defaultThemeTokens}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      <Modal
        open={activatePromptOpen}
        onClose={() => {
          setActivatePromptOpen(false);
          if (postSaveNavigateTo) navigate(postSaveNavigateTo);
        }}
        title="Activate Campaign"
        primaryAction={{
          content: "Activate now",
          loading: activating,
          onAction: async () => {
            if (!campaign) return;
            try {
              setActivating(true);
              await fetch(`/api/campaigns/${campaign.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ACTIVE" }),
              });
              showToast("Campaign activated");
            } catch (e) {
              showToast("Failed to activate campaign", true);
            } finally {
              setActivating(false);
              setActivatePromptOpen(false);
              if (postSaveNavigateTo) navigate(postSaveNavigateTo);
            }
          },
        }}
        secondaryActions={[
          {
            content: "Not now",
            onAction: () => {
              setActivatePromptOpen(false);
              if (postSaveNavigateTo) navigate(postSaveNavigateTo);
            },
          },
        ]}
      >
        <div style={{ padding: 16 }}>
          <Text as="p" variant="bodyMd">
            This campaign is still a draft. Activate it now
          </Text>
        </div>
      </Modal>

      {toastMarkup}
    </Frame>
  );
}

interface PlanLimitErrorDetails {
  limit?: number;
  current?: number;
  tier?: string;
}

async function tryParsePlanLimitError(
  response: Response
): Promise<{ message: string; details: PlanLimitErrorDetails } | null> {
  try {
    if (response.status !== 403) return null;
    const body = await response.json() as { errorCode?: string; error?: string; errorDetails?: PlanLimitErrorDetails };
    if (body?.errorCode !== "PLAN_LIMIT_EXCEEDED") return null;
    return { message: body.error ?? "Plan limit reached", details: body.errorDetails ?? {} };
  } catch {
    return null;
  }
}
