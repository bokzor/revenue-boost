/**
 * Step Renderers - Extracted rendering logic for campaign wizard steps
 *
 * SOLID Compliance:
 * - Single Responsibility: Each function renders one specific step
 * - Functions are <50 lines each
 * - Separated from main component for better testability
 */

import type { CampaignFormData, TemplateType } from "~/shared/hooks/useWizardState";
import type { CampaignGoal } from "@prisma/client";
import type { UnifiedTemplate } from "../hooks/useTemplates";
import type { GlobalFrequencyCappingSettings } from "~/domains/store/types/settings";
import type { BackgroundPreset } from "~/config/background-presets";
import {
  GoalStepContent,
  DesignStepContent,
  TargetingStepContent,
  FrequencyStepContent,
  ScheduleStepContent,
} from "../components/steps";
import { DiscountSettingsStep } from "../components/DiscountSettingsStep";

// ============================================================================
// TYPES
// ============================================================================

export interface StepRendererProps {
  wizardState: CampaignFormData;
  updateData: (updates: Partial<CampaignFormData>) => void;
  applyGoalDefaults: (goal: CampaignGoal) => void;
  setTemplateType: (
    templateType: TemplateType,
    templateObject?: {
      contentDefaults?: Record<string, unknown>;
      targetRules?: Record<string, unknown>;
      design?: Record<string, unknown>;
    }
  ) => void;
  storeId: string;
  shopDomain?: string;
  campaignId?: string;
  selectedVariant?: string;
  abTestingEnabled?: boolean;
  initialTemplates?: UnifiedTemplate[];
  globalCustomCSS?: string;
  /** Custom theme presets from store settings */
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
  /** Whether advanced targeting (Shopify segments, session rules) is enabled for the current plan */
  advancedTargetingEnabled?: boolean;
  /** Global frequency capping settings from store - displayed in Cross-Campaign Coordination card */
  globalFrequencyCapping?: GlobalFrequencyCappingSettings;
  /**
   * Map of layout -> proven background presets.
   * Loaded once from recipe service, filtered by current layout in components.
   */
  backgroundsByLayout?: Record<string, BackgroundPreset[]>;
}
// ============================================================================
// STEP RENDERERS
// ============================================================================

export function renderGoalStep(props: StepRendererProps) {
  const { wizardState, updateData, applyGoalDefaults, selectedVariant, abTestingEnabled } = props;

  return (
    <GoalStepContent
      storeId={props.storeId}
      goal={wizardState.goal}
      name={wizardState.name}
      description={wizardState.description}
      abTestingEnabled={abTestingEnabled || false}
      selectedVariant={selectedVariant || "A"}
      isControl={wizardState.isControl || false}
      variantName={wizardState.variantName}
      variantDescription={wizardState.variantDescription}
      onGoalChange={(goal) => {
        updateData({ goal });
        applyGoalDefaults(goal);
      }}
      onNameChange={(name) => updateData({ name })}
      onDescriptionChange={(description) => updateData({ description })}
      onVariantNameChange={(variantName) => updateData({ variantName })}
      onVariantDescriptionChange={(variantDescription) => updateData({ variantDescription })}
    />
  );
}

export function renderDesignStep(props: StepRendererProps) {
  const {
    wizardState,
    updateData,
    storeId,
    shopDomain,
    campaignId,
    setTemplateType,
    initialTemplates,
    customThemePresets,
    backgroundsByLayout,
  } = props;
  const { globalCustomCSS } = props;

  // Convert wizard state designConfig to DesignConfig format
  const designConfig: Partial<import("~/domains/campaigns/types/campaign").DesignConfig> = {
    theme: "modern",
    position: "center",
    size: "medium",
    borderRadius: 8,
    overlayOpacity: 0.5,
    animation: "fade",
    // Add any existing design config values
    ...(wizardState.designConfig as Partial<
      import("~/domains/campaigns/types/campaign").DesignConfig
    >),
  };

  // Build targetRules from wizard state for preview
  const targetRules = {
    enhancedTriggers: wizardState.enhancedTriggers || {},
    audienceTargeting: wizardState.audienceTargeting || {},
    geoTargeting: wizardState.geoTargeting || {},
    pageTargeting: wizardState.pageTargeting || {},
  };

  // Check if content is prefilled from a recipe (has headline or other meaningful content)
  // If so, skip auto-selection to preserve the recipe data
  const hasPrefilledContent = !!(
    wizardState.contentConfig?.headline ||
    wizardState.contentConfig?.subheadline ||
    wizardState.contentConfig?.buttonText
  );

  return (
    <DesignStepContent
      goal={wizardState.goal}
      templateType={wizardState.templateType}
      templateId={wizardState.templateId}
      storeId={storeId}
      shopDomain={shopDomain}
      campaignId={campaignId}
      contentConfig={wizardState.contentConfig || {}}
      designConfig={designConfig}
      discountConfig={wizardState.discountConfig}
      targetRules={targetRules}
      globalCustomCSS={globalCustomCSS}
      customThemePresets={customThemePresets}
      backgroundsByLayout={backgroundsByLayout}
      onContentChange={(content) => updateData({ contentConfig: content })}
      onDesignChange={(design) => updateData({ designConfig: design })}
      onDiscountChange={(config) => updateData({ discountConfig: config })}
      initialTemplates={initialTemplates}
      preselectedTemplateType={wizardState.templateType}
      skipAutoSelect={hasPrefilledContent}
      onTemplateSelect={(template) => {
        console.log("[step-renderers] Template selected:", {
          id: template.id,
          templateType: template.templateType,
          hasDesignConfig: !!template.designConfig,
          designConfigKeys: template.designConfig ? Object.keys(template.designConfig) : [],
          imageUrl: (template.designConfig as Record<string, unknown> | undefined)?.imageUrl,
        });

        // Ensure required base content fields exist even if the user doesn't edit them
        // The UI shows placeholders, but the server schema requires real values
        const baseDefaults: Record<string, unknown> = {
          headline: "Welcome!",
          buttonText: "Continue",
          successMessage: "Thanks!",
        };

        const contentWithDefaults = {
          ...baseDefaults,
          ...(template.contentConfig || {}),
        };

        // Extract enhanced triggers from the selected template (if provided)
        // Templates store triggers under targetRules.enhancedTriggers in the DB
        const enhancedFromTemplate = (template.targetRules as Record<string, unknown> | undefined)?.enhancedTriggers;

        const nextUpdate: Partial<CampaignFormData> = {
          templateId: template.id,
          templateType: template.templateType,
          // Use the template's seeded content (already merged with recipe if applicable)
          contentConfig: contentWithDefaults,
          // Use the template's seeded design config as-is (already merged with recipe if applicable)
          designConfig: template.designConfig || {},
          // Apply template triggers so the Targeting step reflects the selection (e.g., Exit Intent)
          ...(enhancedFromTemplate ? { enhancedTriggers: enhancedFromTemplate } : {}),
          // Apply template discount configuration if provided (e.g., Free Shipping defaults)
          ...(template.discountConfig ? { discountConfig: template.discountConfig } : {}),
        };

        updateData(nextUpdate);

        // Also pass hydrated defaults, targetRules, and design so setTemplateType
        // can merge them into wizard state (including seeded design from DB)
        setTemplateType(template.templateType, {
          contentDefaults: contentWithDefaults,
          targetRules: template.targetRules as Record<string, unknown> | undefined,
          design: template.designConfig as Record<string, unknown> | undefined,
        });
      }}
    />
  );
}

export function renderTargetingStep(props: StepRendererProps) {
  const { wizardState, updateData, storeId, advancedTargetingEnabled } = props;

  // Ensure geoTargeting has a default value if not present
  const geoTargeting = wizardState.geoTargeting || {
    enabled: false,
    mode: "include" as const,
    countries: [],
  };

  return (
    <TargetingStepContent
      storeId={storeId}
      enhancedTriggers={wizardState.enhancedTriggers || {}}
      audienceTargeting={wizardState.audienceTargeting}
      geoTargeting={geoTargeting}
      onTriggersChange={(config) => updateData({ enhancedTriggers: config })}
      onAudienceChange={(config) => updateData({ audienceTargeting: config })}
      onGeoChange={(config) => updateData({ geoTargeting: config })}
      advancedTargetingEnabled={advancedTargetingEnabled ?? false}
    />
  );
}

export function renderFrequencyStep(props: StepRendererProps) {
  const { wizardState, updateData, globalFrequencyCapping } = props;

  return (
    <FrequencyStepContent
      config={wizardState.frequencyCapping}
      onConfigChange={(config) => updateData({ frequencyCapping: config })}
      templateType={wizardState.templateType}
      globalSettings={globalFrequencyCapping}
    />
  );
}

export function renderDiscountStep(props: StepRendererProps) {
  const { wizardState, updateData } = props;

  // Detect if email capture is enabled from contentConfig
  const contentConfig = wizardState.contentConfig as Record<string, unknown> | undefined;
  const hasEmailCapture =
    contentConfig?.emailRequired === true ||
    contentConfig?.emailPlaceholder !== undefined ||
    contentConfig?.enableEmailRecovery === true;

  return (
    <DiscountSettingsStep
      goal={wizardState.goal}
      discountConfig={wizardState.discountConfig}
      onConfigChange={(config) => updateData({ discountConfig: config })}
      hasEmailCapture={hasEmailCapture}
      contentConfig={contentConfig}
    />
  );
}

export function renderScheduleStep(props: StepRendererProps) {
  const { wizardState, updateData } = props;

  return (
    <ScheduleStepContent
      status={wizardState.status}
      priority={wizardState.priority}
      startDate={wizardState.startDate}
      endDate={wizardState.endDate}
      tags={wizardState.tags}
      onConfigChange={(config) =>
        updateData({
          status: config.status,
          priority: config.priority,
          startDate: config.startDate,
          endDate: config.endDate,
          tags: config.tags,
        })
      }
    />
  );
}
