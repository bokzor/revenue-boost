/**
 * SingleCampaignFlow Component
 *
 * Two-step flow for creating a single campaign:
 * 1. Recipe Selection: Goal-first recipe picker with configuration
 * 2. Campaign Editor: 2-column layout with preview and form sections
 */

import { useState, useCallback, useMemo } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Box,
  Banner,
} from "@shopify/polaris";
import { ArrowLeftIcon, SaveIcon } from "@shopify/polaris-icons";
import { FormSections, type TargetingConfig, type ScheduleConfig } from "./FormSections";
import { RecipeSelectionStep, type RecipeSelectionResult } from "./RecipeSelectionStep";
import {
  LivePreviewPanel,
  type PreviewDevice,
} from "~/domains/popups/components/preview/LivePreviewPanel";
import { Affix } from "~/shared/components/ui/Affix";
import type { StyledRecipe, RecipeContext } from "../../recipes/styled-recipe-types";
import { getThemeModeForRecipeType, getPresetIdForRecipe } from "../../recipes/styled-recipe-types";
import type {
  ContentConfig,
  DesignConfig,
  DiscountConfig,
  CampaignGoal,
} from "../../types/campaign";
import type { TemplateType } from "~/shared/hooks/useWizardState";
import type { FrequencyCappingConfig } from "~/domains/targeting/components/FrequencyCappingPanel";
import type { BackgroundPreset } from "~/config/background-presets";
import type { GlobalFrequencyCappingSettings } from "~/domains/store/types/settings";
import type { ThemePreset } from "../steps/DesignContentStep";
import {
  validateCampaignCreateData,
  validateContentConfig,
} from "../../validation/campaign-validation";

// Default targeting configuration
const DEFAULT_TARGETING_CONFIG: TargetingConfig = {
  enhancedTriggers: {
    enabled: true,
    page_load: { enabled: true, delay: 3000 },
  },
  audienceTargeting: {
    enabled: false,
    shopifySegmentIds: [],
  },
  geoTargeting: {
    enabled: false,
    mode: "include",
    countries: [],
  },
};

// Default frequency capping configuration
const DEFAULT_FREQUENCY_CONFIG: FrequencyCappingConfig = {
  enabled: true,
  max_triggers_per_session: 1,
  max_triggers_per_day: 3,
  cooldown_between_triggers: 300,
  respectGlobalCap: true,
};

// Default schedule configuration
const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  status: "DRAFT",
  priority: 50,
};

// Default discount configuration
const DEFAULT_DISCOUNT_CONFIG: DiscountConfig = {
  enabled: false,
  showInPreview: true,
  type: "shared",
  valueType: "PERCENTAGE",
  value: 10,
  expiryDays: 30,
  prefix: "WELCOME",
  behavior: "SHOW_CODE_AND_AUTO_APPLY",
};

// Section definitions (recipe is now a separate step, not a section)
type SectionId =
  | "recipe"
  | "basics"
  | "quickConfig"
  | "content"
  | "design"
  | "discount"
  | "targeting"
  | "frequency"
  | "schedule";

interface SectionDef {
  id: SectionId;
  icon: string;
  title: string;
  subtitle: string;
  /** If true, section is conditionally visible (e.g., quickConfig only shows if recipe has inputs) */
  conditional?: boolean;
}

const EDITOR_SECTIONS: SectionDef[] = [
  {
    id: "basics",
    icon: "📝",
    title: "Campaign Name & Description",
    subtitle: "Give your campaign a name and optional description",
  },
  {
    id: "quickConfig",
    icon: "⚙️",
    title: "Quick Configuration",
    subtitle: "Configure your offer details",
    conditional: true,
  },
  {
    id: "content",
    icon: "✏️",
    title: "Content & Design",
    subtitle: "Configure headlines, buttons, colors, and styling",
  },
  {
    id: "targeting",
    icon: "🎯",
    title: "Targeting & Triggers",
    subtitle: "Define who sees your popup and when",
  },
  {
    id: "frequency",
    icon: "🔄",
    title: "Frequency",
    subtitle: "Control how often the popup appears",
  },
  {
    id: "schedule",
    icon: "📅",
    title: "Schedule & Settings",
    subtitle: "Set start/end dates and priority",
  },
];

/** Design tokens from the store's default theme preset (matches DesignTokens shape) */
export type DefaultThemeTokens = import("~/domains/campaigns/types/design-tokens").DesignTokens;

export interface SingleCampaignFlowProps {
  onBack: () => void;
  onSave: (data: CampaignData) => Promise<void>;
  onSaveDraft: (data: CampaignData) => Promise<void>;
  recipes: StyledRecipe[];
  storeId: string;
  shopDomain?: string;
  advancedTargetingEnabled?: boolean;
  initialData?: Partial<CampaignData>;
  /** Edit mode skips recipe selection and changes UI labels */
  isEditMode?: boolean;
  /** Campaign ID for edit mode */
  campaignId?: string;
  // === New props for feature parity ===
  /** Custom theme presets from store settings */
  customThemePresets?: ThemePreset[];
  /** Map of layout -> background presets */
  backgroundsByLayout?: Record<string, BackgroundPreset[]>;
  /** Global custom CSS from store settings */
  globalCustomCSS?: string;
  /** Global frequency capping settings from store */
  globalFrequencyCapping?: GlobalFrequencyCappingSettings;
  /** Default theme tokens from store's default preset (for preview) */
  defaultThemeTokens?: DefaultThemeTokens;
}

export interface CampaignData {
  name: string;
  description?: string;
  recipe?: StyledRecipe;
  templateType?: TemplateType;
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  discountConfig?: DiscountConfig;
  targetingConfig: TargetingConfig;
  frequencyConfig: FrequencyCappingConfig;
  scheduleConfig: ScheduleConfig;
}

export function SingleCampaignFlow({
  onBack,
  onSave,
  onSaveDraft,
  recipes,
  storeId,
  shopDomain,
  advancedTargetingEnabled,
  initialData,
  isEditMode = false,
  campaignId,
  // New props for feature parity
  customThemePresets,
  backgroundsByLayout,
  globalCustomCSS,
  globalFrequencyCapping,
  defaultThemeTokens,
}: SingleCampaignFlowProps) {
  // Flow step: "recipe" (selection) or "editor" (configuration)
  // If initialData has a recipe, templateType (edit mode), or isEditMode, skip to editor
  const shouldSkipRecipeSelection = !!(initialData?.recipe || initialData?.templateType || isEditMode);
  const [step, setStep] = useState<"recipe" | "editor">(shouldSkipRecipeSelection ? "editor" : "recipe");

  // Campaign state
  const [campaignName, setCampaignName] = useState(initialData?.name || "");
  const [campaignDescription, setCampaignDescription] = useState(initialData?.description || "");
  const [selectedRecipe, setSelectedRecipe] = useState<StyledRecipe | undefined>(
    initialData?.recipe
  );
  const [contentConfig, setContentConfig] = useState<Partial<ContentConfig>>(
    initialData?.contentConfig || {}
  );
  const [designConfig, setDesignConfig] = useState<Partial<DesignConfig>>(
    initialData?.designConfig || {}
  );
  const [discountConfig, setDiscountConfig] = useState<DiscountConfig>(
    initialData?.discountConfig || DEFAULT_DISCOUNT_CONFIG
  );
  const [targetingConfig, setTargetingConfig] = useState<TargetingConfig>(
    initialData?.targetingConfig || DEFAULT_TARGETING_CONFIG
  );
  const [frequencyConfig, setFrequencyConfig] = useState<FrequencyCappingConfig>(
    initialData?.frequencyConfig || DEFAULT_FREQUENCY_CONFIG
  );
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(
    initialData?.scheduleConfig || DEFAULT_SCHEDULE_CONFIG
  );

  // Recipe context data for quick configuration inputs
  const [contextData, setContextData] = useState<RecipeContext>({});

  // Section state (starts with basics expanded since recipe selection is done)
  const [expandedSections, setExpandedSections] = useState<SectionId[]>(["basics"]);
  const [completedSections, setCompletedSections] = useState<SectionId[]>([]);

  // Preview state
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("tablet");

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const toggleSection = useCallback((id: SectionId) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const markComplete = useCallback((id: SectionId, nextSection?: SectionId) => {
    setCompletedSections((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (nextSection) {
      setExpandedSections([nextSection]);
    }
  }, []);

  // Check if recipe has quick inputs
  const hasQuickInputs = useMemo(() => {
    return selectedRecipe?.inputs && selectedRecipe.inputs.length > 0;
  }, [selectedRecipe]);

  // Filter visible sections (hide quickConfig if no inputs)
  const visibleSections = useMemo(() => {
    return EDITOR_SECTIONS.filter((section) => {
      if (section.id === "quickConfig" && !hasQuickInputs) {
        return false;
      }
      return true;
    });
  }, [hasQuickInputs]);

  // Handler for context data changes from QuickConfig section
  const handleContextDataChange = useCallback((key: string, value: unknown) => {
    setContextData((prev) => ({ ...prev, [key]: value }));
    // TODO: Re-apply context data to contentConfig/discountConfig when values change
    // This will be handled in FormSections when QuickConfig section is implemented
  }, []);

  // Handler for RecipeSelectionStep (step 1 → step 2)
  const handleRecipeSelected = useCallback((result: RecipeSelectionResult) => {
    const { recipe, initialData: recipeData, contextData: recipeContextData } = result;
    setSelectedRecipe(recipe);
    setCampaignName(recipeData.name || "");
    setContentConfig(recipeData.contentConfig as Partial<ContentConfig>);
    setDesignConfig(recipeData.designConfig as Partial<DesignConfig>);
    if (recipeData.discountConfig && "enabled" in recipeData.discountConfig) {
      setDiscountConfig(recipeData.discountConfig as DiscountConfig);
    }
    if (recipeData.targetRules) {
      setTargetingConfig((prev) => ({
        ...prev,
        enhancedTriggers:
          (recipeData.targetRules.enhancedTriggers as TargetingConfig["enhancedTriggers"]) ||
          prev.enhancedTriggers,
      }));
    }
    // Store context data for QuickConfig section
    if (recipeContextData) {
      setContextData(recipeContextData);
    }
    // Clear validation errors
    setValidationErrors([]);
    setValidationWarnings([]);
    // Move to editor step
    setStep("editor");
    // If recipe has quick inputs, expand quickConfig first; otherwise basics
    const hasQuickInputs = recipe.inputs && recipe.inputs.length > 0;
    setExpandedSections([hasQuickInputs ? "quickConfig" : "basics"]);
  }, []);

  // Legacy handler for FormSections (when changing recipe in editor)
  const handleRecipeSelect = useCallback(
    (recipe: StyledRecipe) => {
      setSelectedRecipe(recipe);
      setContentConfig(recipe.defaults.contentConfig || {});

      // Determine theme mode based on recipe type
      const themeMode = getThemeModeForRecipeType(recipe.recipeType);
      const presetId = themeMode === "preset" ? getPresetIdForRecipe(recipe.id) : undefined;

      setDesignConfig({
        ...recipe.defaults.designConfig,
        themeMode,
        presetId,
      });
      markComplete("recipe", "design");
      setValidationErrors([]);
      setValidationWarnings([]);
    },
    [markComplete]
  );

  // Back handler that respects the step
  const handleBack = useCallback(() => {
    if (step === "editor" && !isEditMode) {
      // Go back to recipe selection (only in create mode)
      setStep("recipe");
    } else {
      // Go back to mode selector / previous page / campaign list
      onBack();
    }
  }, [step, isEditMode, onBack]);

  const getCampaignData = useCallback(
    (): CampaignData => ({
      name: campaignName,
      description: campaignDescription,
      recipe: selectedRecipe,
      // Use recipe's templateType, or fall back to initialData's templateType (for edit mode)
      templateType: (selectedRecipe?.templateType || initialData?.templateType) as TemplateType | undefined,
      contentConfig,
      designConfig,
      discountConfig,
      targetingConfig,
      frequencyConfig,
      scheduleConfig,
    }),
    [
      campaignName,
      campaignDescription,
      selectedRecipe,
      initialData?.templateType,
      contentConfig,
      designConfig,
      discountConfig,
      targetingConfig,
      frequencyConfig,
      scheduleConfig,
    ]
  );

  // Validate campaign data before saving
  const validateCampaign = useCallback(
    (forPublish: boolean): { valid: boolean; errors: string[]; warnings: string[] } => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      if (!campaignName.trim()) {
        errors.push("Campaign name is required");
      }

      // In edit mode, we may not have a recipe but still have a templateType
      if (!selectedRecipe && !isEditMode) {
        errors.push("Please select a recipe/template");
      }

      const templateType = (selectedRecipe?.templateType || initialData?.templateType) as TemplateType | undefined;

      // Content validation (template-specific)
      if (templateType && contentConfig) {
        const contentResult = validateContentConfig(templateType, contentConfig);
        if (!contentResult.success && contentResult.errors) {
          errors.push(...contentResult.errors);
        }
      }

      // For publish, validate the full campaign data
      if (forPublish && templateType) {
        const campaignData = {
          name: campaignName,
          description: campaignDescription,
          goal: (selectedRecipe?.goal as CampaignGoal) || "NEWSLETTER_SIGNUP",
          templateType,
          contentConfig,
          designConfig,
          targetRules: {
            enhancedTriggers: targetingConfig.enhancedTriggers,
            audienceTargeting: targetingConfig.audienceTargeting,
            geoTargeting: targetingConfig.geoTargeting,
          },
          discountConfig,
        };

        const result = validateCampaignCreateData(campaignData);
        if (!result.success && result.errors) {
          // Filter out duplicates
          const newErrors = result.errors.filter((e) => !errors.includes(e));
          errors.push(...newErrors);
        }
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    },
    [
      campaignName,
      campaignDescription,
      selectedRecipe,
      contentConfig,
      designConfig,
      targetingConfig,
      discountConfig,
    ]
  );

  const handleSave = useCallback(async () => {
    // Validate for publish
    const { valid, errors, warnings } = validateCampaign(true);
    setValidationErrors(errors);
    setValidationWarnings(warnings);

    if (!valid) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(getCampaignData());
    } finally {
      setIsSaving(false);
    }
  }, [onSave, getCampaignData, validateCampaign]);

  const handleSaveDraft = useCallback(async () => {
    // Lighter validation for drafts - just need a name
    const errors: string[] = [];
    if (!campaignName.trim()) {
      errors.push("Campaign name is required");
    }
    setValidationErrors(errors);
    setValidationWarnings([]);

    if (errors.length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      await onSaveDraft(getCampaignData());
    } finally {
      setIsSaving(false);
    }
  }, [onSaveDraft, getCampaignData, campaignName]);

  const templateType = (selectedRecipe?.templateType || initialData?.templateType) as TemplateType | undefined;

  // =============================================================================
  // STEP 1: RECIPE SELECTION
  // =============================================================================
  if (step === "recipe") {
    return (
      <Page
        title="Choose a Recipe"
        subtitle="Select a pre-designed popup template to get started"
        backAction={{ onAction: onBack, content: "Back" }}
        fullWidth
      >
        <RecipeSelectionStep
          recipes={recipes}
          onRecipeSelected={handleRecipeSelected}
          onBuildFromScratch={undefined} // Could add legacy flow option
          storeId={storeId}
          defaultThemeTokens={defaultThemeTokens}
        />
      </Page>
    );
  }

  // =============================================================================
  // STEP 2: CAMPAIGN EDITOR
  // =============================================================================
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Sticky Header */}
      <StickyHeader
        campaignName={campaignName}
        onBack={handleBack}
        onSaveDraft={handleSaveDraft}
        onPublish={handleSave}
        isSaving={isSaving}
        canPublish={(!!selectedRecipe || isEditMode) && !!campaignName}
        isEditMode={isEditMode}
      />

      {/* Validation Errors/Warnings */}
      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "16px 24px 0" }}>
          <BlockStack gap="200">
            {validationErrors.length > 0 && (
              <Banner
                title="Please fix the following errors"
                tone="critical"
                onDismiss={() => setValidationErrors([])}
              >
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {validationErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </Banner>
            )}
            {validationWarnings.length > 0 && (
              <Banner title="Warnings" tone="warning" onDismiss={() => setValidationWarnings([])}>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {validationWarnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </Banner>
            )}
          </BlockStack>
        </div>
      )}

      {/* Main Content - 2 Column Layout */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
        <Layout>
          {/* Left Column - Live Preview */}
          <Layout.Section variant="oneHalf">
            <PreviewColumn
              templateType={templateType}
              contentConfig={contentConfig}
              designConfig={designConfig}
              discountConfig={discountConfig}
              targetingConfig={targetingConfig}
              shopDomain={shopDomain}
              globalCustomCSS={globalCustomCSS}
              previewDevice={previewDevice}
              onDeviceChange={setPreviewDevice}
              defaultThemeTokens={defaultThemeTokens}
            />
          </Layout.Section>

          {/* Right Column - Form Sections (without recipe section) */}
          <Layout.Section variant="oneHalf">
            <FormSections
              sections={visibleSections}
              expandedSections={expandedSections}
              completedSections={completedSections}
              onToggle={toggleSection}
              recipes={recipes}
              selectedRecipe={selectedRecipe}
              onRecipeSelect={handleRecipeSelect}
              // Campaign basics
              campaignName={campaignName}
              campaignDescription={campaignDescription}
              onNameChange={setCampaignName}
              onDescriptionChange={setCampaignDescription}
              // Quick configuration (recipe inputs)
              contextData={contextData}
              onContextDataChange={handleContextDataChange}
              // Content & Design
              contentConfig={contentConfig}
              designConfig={designConfig}
              discountConfig={discountConfig}
              targetingConfig={targetingConfig}
              frequencyConfig={frequencyConfig}
              scheduleConfig={scheduleConfig}
              onContentChange={setContentConfig}
              onDesignChange={setDesignConfig}
              onDiscountChange={setDiscountConfig}
              onTargetingChange={setTargetingConfig}
              onFrequencyChange={setFrequencyConfig}
              onScheduleChange={setScheduleConfig}
              onMarkComplete={markComplete}
              storeId={storeId}
              advancedTargetingEnabled={advancedTargetingEnabled}
              templateType={templateType}
              campaignGoal={selectedRecipe?.goal}
              // New props for feature parity
              customThemePresets={customThemePresets}
              backgroundsByLayout={backgroundsByLayout}
              globalCustomCSS={globalCustomCSS}
              globalFrequencyCapping={globalFrequencyCapping}
              onMobileLayoutChange={() => setPreviewDevice("mobile")}
              // Save/Publish actions for last section
              onSaveDraft={handleSaveDraft}
              onPublish={handleSave}
              isSaving={isSaving}
              canPublish={(!!selectedRecipe || isEditMode) && !!campaignName}
              isEditMode={isEditMode}
            />
          </Layout.Section>
        </Layout>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface StickyHeaderProps {
  campaignName: string;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isSaving: boolean;
  canPublish: boolean;
  isEditMode?: boolean;
}

function StickyHeader({
  campaignName,
  onBack,
  onSaveDraft,
  onPublish,
  isSaving,
  canPublish,
  isEditMode = false,
}: StickyHeaderProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "var(--p-color-bg-surface)",
        borderBottom: "1px solid var(--p-color-border-secondary)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "16px 24px" }}>
        <InlineStack align="space-between" blockAlign="center">
          {/* Left: Back button and campaign name */}
          <InlineStack gap="400" blockAlign="center">
            <Button icon={ArrowLeftIcon} onClick={onBack} variant="tertiary" />
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="headingMd">
                📣
              </Text>
              <Text as="h1" variant="headingLg">
                {campaignName || (isEditMode ? "Edit Campaign" : "New Campaign")}
              </Text>
            </InlineStack>
          </InlineStack>

          {/* Right: Action buttons */}
          <InlineStack gap="300">
            <Button onClick={onSaveDraft} disabled={isSaving} icon={SaveIcon}>
              {isEditMode ? "Save" : "Save Draft"}
            </Button>
            <Button
              variant="primary"
              onClick={onPublish}
              disabled={isSaving || !canPublish}
              loading={isSaving}
            >
              {isEditMode ? "Update & Publish" : "Publish"}
            </Button>
          </InlineStack>
        </InlineStack>
      </div>
    </div>
  );
}

interface PreviewColumnProps {
  templateType?: TemplateType;
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  discountConfig?: DiscountConfig;
  targetingConfig: TargetingConfig;
  shopDomain?: string;
  globalCustomCSS?: string;
  previewDevice: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  defaultThemeTokens?: DefaultThemeTokens;
}

function PreviewColumn({
  templateType,
  contentConfig,
  designConfig,
  discountConfig,
  targetingConfig,
  shopDomain,
  globalCustomCSS,
  previewDevice,
  onDeviceChange,
  defaultThemeTokens,
}: PreviewColumnProps) {
  return (
    <div data-affix-boundary style={{ position: "relative", alignSelf: "flex-start" }}>
      <Affix disableBelowWidth={768}>
        {templateType ? (
          <LivePreviewPanel
            templateType={templateType}
            config={{
              ...contentConfig,
              // Pass discount config so preview can render discount badges/text correctly
              discountConfig,
            }}
            designConfig={designConfig}
            targetRules={targetingConfig as unknown as Record<string, unknown>}
            shopDomain={shopDomain}
            globalCustomCSS={globalCustomCSS}
            device={previewDevice}
            onDeviceChange={onDeviceChange}
            defaultThemeTokens={defaultThemeTokens}
          />
        ) : (
          <Card>
            <Box padding="800">
              <BlockStack gap="400" align="center">
                <div style={{ fontSize: "48px" }}>📱</div>
                <Text as="h3" variant="headingMd" alignment="center">
                  Live Preview
                </Text>
                <Text as="p" tone="subdued" alignment="center">
                  Select a recipe to see a live preview of your popup
                </Text>
              </BlockStack>
            </Box>
          </Card>
        )}
      </Affix>
    </div>
  );
}
