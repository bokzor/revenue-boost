/**
 * Campaign Edit Page
 *
 * Edit existing campaign with the unified SingleCampaignFlow component
 */

import { useState, useCallback, useEffect } from "react";
import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Frame, Toast, Modal, Text, Banner, Box, Link } from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignService } from "~/domains/campaigns";
import { SingleCampaignFlow, CampaignErrorBoundary, type CampaignData } from "~/domains/campaigns/components/unified";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { FrequencyCappingConfig } from "~/domains/targeting/components";
import prisma from "~/db.server";
import { StoreSettingsSchema, GLOBAL_FREQUENCY_BEST_PRACTICES } from "~/domains/store/types/settings";
import { PlanGuardService } from "~/domains/billing/services/plan-guard.server";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import type { DesignTokens } from "~/domains/campaigns/types/design-tokens";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  campaign: CampaignWithConfigs | null;
  storeId: string;
  shopDomain: string;
  recipes: typeof STYLED_RECIPES;
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
  defaultThemeTokens?: DesignTokens;
  /** True if campaign uses a template type the user's plan doesn't support (grandfathered) */
  isTemplateLocked?: boolean;
  /** Required plan name if template is locked */
  requiredPlanName?: string;
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

    // Check if campaign uses a template type the user's plan doesn't support (grandfathered)
    let isTemplateLocked = false;
    let requiredPlanName: string | undefined;
    if (campaign) {
      const canUseTemplate = await PlanGuardService.canUseTemplateType(storeId, campaign.templateType);
      if (!canUseTemplate) {
        isTemplateLocked = true;
        // Determine required plan name
        const { GAMIFICATION_TEMPLATE_TYPES, SOCIAL_PROOF_TEMPLATE_TYPES, PLAN_DEFINITIONS } = await import(
          "~/domains/billing/types/plan"
        );
        if ((GAMIFICATION_TEMPLATE_TYPES as readonly string[]).includes(campaign.templateType)) {
          requiredPlanName = PLAN_DEFINITIONS.GROWTH.name;
        } else if ((SOCIAL_PROOF_TEMPLATE_TYPES as readonly string[]).includes(campaign.templateType)) {
          requiredPlanName = PLAN_DEFINITIONS.STARTER.name;
        }
      }
    }

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
      recipes: STYLED_RECIPES,
      globalCustomCSS: parsedSettings.success ? parsedSettings.data.globalCustomCSS : undefined,
      customThemePresets: parsedSettings.success ? parsedSettings.data.customThemePresets : undefined,
      globalFrequencyCapping,
      advancedTargetingEnabled,
      experimentsEnabled,
      backgroundsByLayout,
      defaultThemeTokens,
      isTemplateLocked,
      requiredPlanName,
    });
  } catch (error) {
    console.error("[Campaign Edit Loader] Failed to load campaign for editing:", error);

    return data<LoaderData>(
      {
        campaign: null,
        storeId: "",
        shopDomain: "",
        recipes: STYLED_RECIPES,
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
// HELPERS
// ============================================================================

/**
 * Convert CampaignWithConfigs to CampaignData format for SingleCampaignFlow
 */
function campaignToCampaignData(
  campaign: CampaignWithConfigs,
  advancedTargetingEnabled: boolean
): Partial<CampaignData> {
  // Default disabled audience targeting config for Free plan users
  const defaultDisabledAudienceTargeting = {
    enabled: false,
    shopifySegmentIds: [] as string[],
    sessionRules: {
      enabled: false,
      conditions: [] as Array<{
        field: string;
        operator: "in" | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "nin";
        value: string | number | boolean | string[];
      }>,
      logicOperator: "AND" as const,
    },
  };

  // For Free plan users, always show disabled audience targeting
  const audienceTargeting = advancedTargetingEnabled
    ? campaign.targetRules?.audienceTargeting ?? defaultDisabledAudienceTargeting
    : defaultDisabledAudienceTargeting;

  // Build frequency config from campaign data
  const frequencyConfig: FrequencyCappingConfig = {
    enabled: !!campaign.targetRules?.enhancedTriggers?.frequency_capping,
    max_triggers_per_session:
      campaign.targetRules?.enhancedTriggers?.frequency_capping?.max_triggers_per_session,
    max_triggers_per_day:
      campaign.targetRules?.enhancedTriggers?.frequency_capping?.max_triggers_per_day,
    cooldown_between_triggers:
      campaign.targetRules?.enhancedTriggers?.frequency_capping?.cooldown_between_triggers,
    respectGlobalCap: true,
  };

  return {
    name: campaign.name,
    description: campaign.description || "",
    templateType: campaign.templateType,
    contentConfig: campaign.contentConfig || {},
    designConfig: campaign.designConfig || {},
    discountConfig: campaign.discountConfig,
    targetingConfig: {
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
    },
    frequencyConfig,
    scheduleConfig: {
      startDate: campaign.startDate ? campaign.startDate.toISOString() : undefined,
      endDate: campaign.endDate ? campaign.endDate.toISOString() : undefined,
    },
  };
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
    const body = (await response.json()) as {
      errorCode?: string;
      error?: string;
      errorDetails?: PlanLimitErrorDetails;
    };
    if (body?.errorCode !== "PLAN_LIMIT_EXCEEDED") return null;
    return { message: body.error ?? "Plan limit reached", details: body.errorDetails ?? {} };
  } catch {
    return null;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CampaignEditPage() {
  const {
    campaign,
    storeId,
    shopDomain,
    recipes,
    globalCustomCSS,
    customThemePresets,
    globalFrequencyCapping,
    advancedTargetingEnabled,
    backgroundsByLayout,
    defaultThemeTokens,
    isTemplateLocked,
    requiredPlanName,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // State for toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  // Post-save activation modal state
  const [activatePromptOpen, setActivatePromptOpen] = useState(false);
  const [activating, setActivating] = useState(false);

  // Redirect to experiment edit page if campaign is part of an A/B test
  useEffect(() => {
    if (campaign?.experimentId) {
      navigate(`/app/experiments/${campaign.experimentId}/edit`);
    }
  }, [campaign, navigate]);

  // If no campaign found, redirect back
  useEffect(() => {
    if (!campaign) {
      navigate("/app");
    }
  }, [campaign, navigate]);

  // Helper function to show toast
  const showToast = useCallback((message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate("/app");
  }, [navigate]);

  // Handle save (publish) - update campaign via API with ACTIVE status
  const handleSave = useCallback(
    async (campaignData: CampaignData) => {
      if (!campaign) {
        showToast("Campaign not found", true);
        return;
      }

      try {
        // Build frequency_capping for server format
        const { enabled, max_triggers_per_session, max_triggers_per_day, cooldown_between_triggers } =
          campaignData.frequencyConfig || {};

        const frequency_capping = enabled
          ? { max_triggers_per_session, max_triggers_per_day, cooldown_between_triggers }
          : undefined;

        const updateData = {
          name: campaignData.name,
          description: campaignData.description,
          goal: campaign.goal, // Preserve original goal
          status: "ACTIVE", // Publish sets to ACTIVE
          templateType: campaignData.templateType,
          contentConfig: campaignData.contentConfig,
          designConfig: campaignData.designConfig,
          targetRules: {
            enhancedTriggers: {
              ...campaignData.targetingConfig?.enhancedTriggers,
              frequency_capping,
            },
            audienceTargeting: campaignData.targetingConfig?.audienceTargeting,
            geoTargeting: campaignData.targetingConfig?.geoTargeting,
            pageTargeting: campaignData.targetingConfig?.pageTargeting,
          },
          discountConfig: campaignData.discountConfig,
          startDate: campaignData.scheduleConfig?.startDate,
          endDate: campaignData.scheduleConfig?.endDate,
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

        showToast("Campaign updated and published");
        navigate("/app");
      } catch (error) {
        console.error("Failed to update campaign:", error);
        showToast("Failed to update campaign", true);
      }
    },
    [campaign, navigate, showToast]
  );

  // Handle save draft - update campaign via API keeping DRAFT status
  const handleSaveDraft = useCallback(
    async (campaignData: CampaignData) => {
      if (!campaign) {
        showToast("Campaign not found", true);
        return;
      }

      try {
        // Build frequency_capping for server format
        const { enabled, max_triggers_per_session, max_triggers_per_day, cooldown_between_triggers } =
          campaignData.frequencyConfig || {};

        const frequency_capping = enabled
          ? { max_triggers_per_session, max_triggers_per_day, cooldown_between_triggers }
          : undefined;

        const updateData = {
          name: campaignData.name,
          description: campaignData.description,
          goal: campaign.goal, // Preserve original goal
          status: campaign.status, // Preserve original status
          templateType: campaignData.templateType,
          contentConfig: campaignData.contentConfig,
          designConfig: campaignData.designConfig,
          targetRules: {
            enhancedTriggers: {
              ...campaignData.targetingConfig?.enhancedTriggers,
              frequency_capping,
            },
            audienceTargeting: campaignData.targetingConfig?.audienceTargeting,
            geoTargeting: campaignData.targetingConfig?.geoTargeting,
            pageTargeting: campaignData.targetingConfig?.pageTargeting,
          },
          discountConfig: campaignData.discountConfig,
          startDate: campaignData.scheduleConfig?.startDate,
          endDate: campaignData.scheduleConfig?.endDate,
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

        // If campaign was a draft, offer to activate
        if (campaign.status === "DRAFT") {
          setActivatePromptOpen(true);
          showToast("Campaign saved");
          return;
        }

        showToast("Campaign saved");
        navigate("/app");
      } catch (error) {
        console.error("Failed to save campaign:", error);
        showToast("Failed to save campaign", true);
      }
    },
    [campaign, navigate, showToast]
  );

  // Handle activation from modal
  const handleActivate = useCallback(async () => {
    if (!campaign) return;
    try {
      setActivating(true);
      await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      showToast("Campaign activated");
      navigate("/app");
    } catch {
      showToast("Failed to activate campaign", true);
    } finally {
      setActivating(false);
      setActivatePromptOpen(false);
    }
  }, [campaign, navigate, showToast]);

  // Toast component
  const toastMarkup = toastMessage ? (
    <Toast content={toastMessage} error={toastError} onDismiss={() => setToastMessage(null)} />
  ) : null;

  if (!campaign) {
    return null;
  }

  const initialData = campaignToCampaignData(campaign, advancedTargetingEnabled);

  return (
    <Frame>
      {/* Grandfathered campaign warning banner */}
      {isTemplateLocked && requiredPlanName && (
        <Box padding="400" paddingBlockEnd="0">
          <Banner tone="warning">
            <Text as="p" variant="bodyMd">
              This campaign uses a template that requires the {requiredPlanName} plan.
              It will continue running, but you cannot create new campaigns with this template.{" "}
              <Link url="/app/billing">Upgrade to {requiredPlanName}</Link> to unlock full editing and
              create new campaigns with this template type.
            </Text>
          </Banner>
        </Box>
      )}

      <CampaignErrorBoundary context="CampaignEdit">
        <SingleCampaignFlow
          onBack={handleBack}
          onSave={handleSave}
          onSaveDraft={handleSaveDraft}
          recipes={recipes}
          storeId={storeId}
          shopDomain={shopDomain}
          advancedTargetingEnabled={advancedTargetingEnabled}
          initialData={initialData}
          isEditMode={true}
          campaignId={campaign.id}
          customThemePresets={customThemePresets}
          backgroundsByLayout={backgroundsByLayout}
          globalCustomCSS={globalCustomCSS}
          globalFrequencyCapping={globalFrequencyCapping}
          defaultThemeTokens={defaultThemeTokens}
        />
      </CampaignErrorBoundary>

      <Modal
        open={activatePromptOpen}
        onClose={() => {
          setActivatePromptOpen(false);
          navigate("/app");
        }}
        title="Activate Campaign"
        primaryAction={{
          content: "Activate now",
          loading: activating,
          onAction: handleActivate,
        }}
        secondaryActions={[
          {
            content: "Not now",
            onAction: () => {
              setActivatePromptOpen(false);
              navigate("/app");
            },
          },
        ]}
      >
        <div style={{ padding: 16 }}>
          <Text as="p" variant="bodyMd">
            This campaign is still a draft. Activate it now to start showing it to customers.
          </Text>
        </div>
      </Modal>

      {toastMarkup}
    </Frame>
  );
}
