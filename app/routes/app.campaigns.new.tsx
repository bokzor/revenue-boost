/**
 * Campaign Creation Route (Refactored)
 *
 * Uses the refactored CampaignFormWithABTesting component with:
 * - Complete visual parity with original
 * - Improved architecture and type safety
 * - Better separation of concerns
 * - All original features preserved
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, useLoaderData, useNavigate, useLocation } from "react-router";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignFormWithABTesting } from "~/domains/campaigns/components/CampaignFormWithABTesting";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import type { TemplateType, CampaignGoal } from "~/domains/campaigns/types/campaign";
import { useState } from "react";
import { Modal, Toast, Frame, Text } from "@shopify/polaris";
import type { UnifiedTemplate } from "~/domains/popups/services/templates/unified-template-service.server";
import prisma from "~/db.server";
import { StoreSettingsSchema, GLOBAL_FREQUENCY_BEST_PRACTICES } from "~/domains/store/types/settings";
import { PlanGuardService } from "~/domains/billing/services/plan-guard.server";

// ============================================================================
// LOADER - Fetch necessary data for form
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const storeId = await getStoreId(request);

    // Fetch plan context to determine feature availability
    const planContext = await PlanGuardService.getPlanContext(storeId);
    const advancedTargetingEnabled = planContext.definition.features.advancedTargeting;
    const experimentsEnabled = planContext.definition.features.experiments;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true },
    });

    // Read template query parameter for preselection
    const url = new URL(request.url);
    const templateParam = url.searchParams.get("template");

    // If template is provided, look up its associated goal
    let preselectedGoal: string | undefined;
    if (templateParam) {
      // Import template data to find the goal
      const templateDataModule = await import("../../prisma/template-data.js");
      const template = templateDataModule.GLOBAL_SYSTEM_TEMPLATES.find(
        (t) => t.templateType === templateParam
      );

      // If template has goals, preselect the first one
      if (template && template.goals) {
        const goals = Array.isArray(template.goals) ? template.goals : [];
        if (goals.length > 0) {
          preselectedGoal = goals[0];
        }
      }
    }

    const parsedSettings = StoreSettingsSchema.partial().safeParse(store?.settings || {});

    // Use best practice defaults if store hasn't configured frequency capping yet
    // Global capping is disabled by default to maximize impressions
    const storeFrequencyCapping = parsedSettings.success ? parsedSettings.data.frequencyCapping : undefined;
    const globalFrequencyCapping = storeFrequencyCapping ?? {
      enabled: false,
      ...GLOBAL_FREQUENCY_BEST_PRACTICES,
    };

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

    return data({
      storeId,
      shopDomain: session.shop,
      templateType: templateParam || undefined,
      preselectedGoal,
      globalCustomCSS: parsedSettings.success ? parsedSettings.data.globalCustomCSS : undefined,
      customThemePresets: parsedSettings.success ? parsedSettings.data.customThemePresets : undefined,
      globalFrequencyCapping,
      advancedTargetingEnabled,
      experimentsEnabled,
      backgroundsByLayout,
      defaultThemeTokens,
      success: true,
    });
  } catch (error) {
    return data({
      storeId: "",
      shopDomain: "",
      success: false,
      error: error instanceof Error ? error.message : "Failed to load data",
      globalCustomCSS: undefined,
      globalFrequencyCapping: undefined,
      advancedTargetingEnabled: false,
      experimentsEnabled: false,
    });
  }
}

// ============================================================================
// ACTION - Not used (form handles submission directly)
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);

  return data(
    {
      success: false,
      error: "This route does not handle POST requests. Use the form's onSave handler.",
    },
    { status: 400 }
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function NewCampaign() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get recipe initial data from navigation state (passed from recipe flow)
  const recipeInitialData = (location.state as { recipeInitialData?: Record<string, unknown> } | null)?.recipeInitialData;

  // Post-create activation modal state (single campaign)
  const [activatePromptOpen, setActivatePromptOpen] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  // Post-create activation modal state (experiment/A/B test)
  const [experimentActivatePromptOpen, setExperimentActivatePromptOpen] = useState(false);
  const [createdExperimentId, setCreatedExperimentId] = useState<string | null>(null);
  const [activatingExperiment, setActivatingExperiment] = useState(false);

  const {
    storeId,
    shopDomain,
    templates,
    templateType,
    preselectedGoal,
    globalCustomCSS,
    customThemePresets,
    globalFrequencyCapping,
    advancedTargetingEnabled,
    experimentsEnabled,
    backgroundsByLayout,
    defaultThemeTokens,
  } = loaderData as {
    storeId: string;
    shopDomain: string;
    templates: UnifiedTemplate[];
    templateType?: string;
    preselectedGoal?: string;
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
    advancedTargetingEnabled?: boolean;
    experimentsEnabled?: boolean;
    backgroundsByLayout?: Record<string, import("~/config/background-presets").BackgroundPreset[]>;
    defaultThemeTokens?: import("~/domains/campaigns/types/design-tokens").DesignTokens;
    success: boolean;
  };

  // Handle save - create campaign(s) via API
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  const handleSave = async (campaignData: CampaignFormData | CampaignFormData[]) => {
    console.log("[CampaignNew] handleSave called", {
      isArray: Array.isArray(campaignData),
      hasFrequencyCapping: Array.isArray(campaignData)
        ? !!campaignData[0]?.frequencyCapping
        : !!campaignData.frequencyCapping,
    });

    try {
      // Use fetch to call our API routes instead of importing server services
      if (Array.isArray(campaignData)) {
        // A/B Testing: Create experiment with multiple variants
        const firstVariant = campaignData[0];

        // Extract experiment metadata from first variant
        const experimentData = {
          name: (firstVariant as { experimentName?: string }).experimentName,
          description: (firstVariant as { experimentDescription?: string }).experimentDescription,
          hypothesis: (firstVariant as { experimentHypothesis?: string }).experimentHypothesis,
          trafficAllocation: campaignData.reduce(
            (acc, variant, index) => {
              const key = ["A", "B", "C", "D"][index];
              acc[key] =
                (variant as { trafficAllocation?: number }).trafficAllocation ||
                Math.floor(100 / campaignData.length);
              return acc;
            },
            {} as Record<string, number>
          ),
          statisticalConfig: {
            confidenceLevel: 0.95,
            minimumSampleSize: 100,
            minimumDetectableEffect: 0.05,
            maxDurationDays: 30,
          },
          successMetrics: {
            primaryMetric:
              (firstVariant as { successMetric?: string }).successMetric || "conversion_rate",
            secondaryMetrics: ["click_through_rate"],
          },
        };

        // Create experiment via API
        const expResponse = await fetch("/api/experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(experimentData),
        });

        if (!expResponse.ok) {
          const planLimit = await tryParsePlanLimitError(expResponse);
          if (planLimit) {
            setToastMessage(planLimit.message);
            setToastError(true);
            return;
          }
          throw new Error("Failed to create experiment");
        }

        const expBody = await expResponse.json();
        const experiment = expBody?.data?.experiment ?? expBody?.data;

        // Schedule & Settings are only configured on Control variant (A)
        // Propagate these settings to all other variants for consistency
        const controlVariant = campaignData[0];
        const scheduleSettings = {
          status: controlVariant.status,
          priority: controlVariant.priority,
          startDate: controlVariant.startDate,
          endDate: controlVariant.endDate,
          tags: controlVariant.tags,
        };

        // Create campaigns for each variant via API
        const campaignPromises = campaignData.map(async (variant, index) => {
          // For non-Control variants, use schedule settings from Control
          const effectiveSchedule = index === 0 ? variant : { ...variant, ...scheduleSettings };
          // Extract frequency capping fields (already in server format)
          const {
            enabled,
            max_triggers_per_session,
            max_triggers_per_day,
            cooldown_between_triggers,
          } = variant.frequencyCapping;

          // Only include frequency_capping if enabled
          const frequency_capping = enabled
            ? {
                max_triggers_per_session,
                max_triggers_per_day,
                cooldown_between_triggers,
              }
            : undefined;

          const campaignCreateData = {
            name: variant.name || `${experimentData.name} - Variant ${["A", "B", "C", "D"][index]}`,
            description: variant.description,
            goal: variant.goal,
            // Use effectiveSchedule for schedule-related fields (inherited from Control for non-Control variants)
            status: effectiveSchedule.status || "DRAFT",
            priority: effectiveSchedule.priority || 0,
            templateId: variant.templateId,
            templateType: variant.templateType,
            contentConfig: variant.contentConfig,
            designConfig: variant.designConfig,
            targetRules: {
              enhancedTriggers: {
                ...variant.enhancedTriggers,
                frequency_capping,
              },
              audienceTargeting: variant.audienceTargeting,
              pageTargeting: variant.pageTargeting,
            },
            discountConfig: variant.discountConfig,
            experimentId: experiment.id,
            variantKey: ["A", "B", "C", "D"][index] as "A" | "B" | "C" | "D",
            isControl: index === 0,
            startDate: effectiveSchedule.startDate,
            endDate: effectiveSchedule.endDate,
            tags: effectiveSchedule.tags,
          };

          const response = await fetch("/api/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(campaignCreateData),
          });

          if (!response.ok) {
            const planLimit = await tryParsePlanLimitError(response);
            if (planLimit) {
              setToastMessage(planLimit.message);
              setToastError(true);
              return;
            }
            throw new Error("Failed to create campaign variant");
          }

          return response.json();
        });

        await Promise.all(campaignPromises);

        // Show activation prompt modal for experiment
        setCreatedExperimentId(experiment.id);
        setExperimentActivatePromptOpen(true);
        return;
      } else {
        // Single campaign
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

        const campaignCreateData = {
          name: campaignData.name,
          description: campaignData.description,
          goal: campaignData.goal,
          status: campaignData.status || "DRAFT",
          priority: campaignData.priority || 0,
          templateId: campaignData.templateId,
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

        console.log("[CampaignNew] POSTing /api/campaigns", campaignCreateData);

        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campaignCreateData),
        });

        console.log("[CampaignNew] /api/campaigns response", response.status);

        if (!response.ok) {
          const planLimit = await tryParsePlanLimitError(response);
          if (planLimit) {
            setToastMessage(planLimit.message);
            setToastError(true);
            return;
          }
          console.error("[CampaignNew] /api/campaigns failed", response.status);
          throw new Error("Failed to create campaign");
        }

        const body = await response.json();
        const campaign = body?.data?.campaign ?? body?.data;

        console.log("[CampaignNew] created campaign", campaign?.id);

        // Post-create: if still DRAFT, prompt to activate via Polaris modal
        if (campaign?.status === "DRAFT") {
          setCreatedCampaignId(campaign.id);
          setActivatePromptOpen(true);
          return;
        }
        // Otherwise navigate to detail
        navigate(`/app/campaigns/${campaign.id}`);
      }
    } catch (error) {
      console.error("Failed to save campaign:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate("/app/campaigns");
  };

  const toastMarkup = toastMessage ? (
    <Toast content={toastMessage} error={toastError} onDismiss={() => setToastMessage(null)} />
  ) : null;

  return (
    <Frame>
      <CampaignFormWithABTesting
        storeId={storeId}
        shopDomain={shopDomain}
        onSave={handleSave}
        onCancel={handleCancel}
        initialTemplates={templates}
        globalCustomCSS={globalCustomCSS}
        customThemePresets={customThemePresets}
        globalFrequencyCapping={globalFrequencyCapping}
        advancedTargetingEnabled={advancedTargetingEnabled ?? false}
        experimentsEnabled={experimentsEnabled ?? false}
        backgroundsByLayout={backgroundsByLayout}
        defaultThemeTokens={defaultThemeTokens}
        initialData={
          recipeInitialData
            ? (recipeInitialData as Parameters<typeof CampaignFormWithABTesting>[0]["initialData"])
            : templateType || preselectedGoal
              ? {
                  templateType: templateType as TemplateType | undefined,
                  goal: preselectedGoal as CampaignGoal | undefined,
                }
              : undefined
        }
      />

      <Modal
        open={activatePromptOpen}
        onClose={() => {
          setActivatePromptOpen(false);
          if (createdCampaignId) navigate(`/app/campaigns/${createdCampaignId}`);
        }}
        title="Activate Campaign"
        primaryAction={{
          content: "Activate now",
          loading: activating,
          onAction: async () => {
            if (!createdCampaignId) return;
            try {
              setActivating(true);
              await fetch(`/api/campaigns/${createdCampaignId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ACTIVE" }),
              });
            } catch (e) {
              // no-op, navigate regardless
            } finally {
              setActivating(false);
              setActivatePromptOpen(false);
              navigate(`/app/campaigns/${createdCampaignId}`);
            }
          },
        }}
        secondaryActions={[
          {
            content: "Not now",
            onAction: () => {
              setActivatePromptOpen(false);
              if (createdCampaignId) navigate(`/app/campaigns/${createdCampaignId}`);
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

      <Modal
        open={experimentActivatePromptOpen}
        onClose={() => {
          setExperimentActivatePromptOpen(false);
          if (createdExperimentId) navigate(`/app/experiments/${createdExperimentId}`);
        }}
        title="Activate Experiment"
        primaryAction={{
          content: "Activate now",
          loading: activatingExperiment,
          onAction: async () => {
            if (!createdExperimentId) return;
            try {
              setActivatingExperiment(true);
              await fetch(`/api/experiments/${createdExperimentId}/activate-all`, {
                method: "POST",
              });
            } catch (e) {
              // no-op, navigate regardless
            } finally {
              setActivatingExperiment(false);
              setExperimentActivatePromptOpen(false);
              navigate(`/app/experiments/${createdExperimentId}`);
            }
          },
        }}
        secondaryActions={[
          {
            content: "Not now",
            onAction: () => {
              setExperimentActivatePromptOpen(false);
              if (createdExperimentId) navigate(`/app/experiments/${createdExperimentId}`);
            },
          },
        ]}
      >
        <div style={{ padding: 16 }}>
          <Text as="p" variant="bodyMd">
            All experiment variants are still drafts. Activate them now to start the A/B test?
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
