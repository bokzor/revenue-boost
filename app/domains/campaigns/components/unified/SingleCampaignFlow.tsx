/**
 * SingleCampaignFlow Component
 *
 * Two-step flow for creating a single campaign:
 * 1. Recipe Selection: Goal-first recipe picker with configuration
 * 2. Campaign Editor: Uses shared CampaignEditorForm component
 *
 * The only SingleCampaignFlow-specific logic is:
 * - Sticky header with manual save/publish buttons
 * - Validation before save
 * - Validation error/warning banners
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  Page,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Box,
  Banner,
  Popover,
  ActionList,
} from "@shopify/polaris";
import { ArrowLeftIcon, SaveIcon, ViewIcon } from "@shopify/polaris-icons";
import { type TargetingConfig, type ScheduleConfig } from "./FormSections";
import { RecipeSelectionStep, type RecipeSelectionResult } from "./RecipeSelectionStep";
import { CampaignEditorForm } from "./CampaignEditorForm";
import type { PreviewDevice } from "~/domains/popups/components/preview/LivePreviewPanel";
import type { StyledRecipe, RecipeContext } from "../../recipes/styled-recipe-types";
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
import {
  DEFAULT_TARGETING_CONFIG,
  DEFAULT_FREQUENCY_CONFIG,
  DEFAULT_SCHEDULE_CONFIG,
  DEFAULT_DISCOUNT_CONFIG,
  EDITOR_SECTIONS,
  toTargetRulesRecord,
  type SectionId,
} from "./defaults";
import {
  applyQuickConfigToState,
  extractIds,
  valuesAreEqual,
  type QuickConfigApplyResult,
} from "../../utils/quick-config-transformer";

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
  campaignId: _campaignId,
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

  // Refs to hold current config values for the Quick Config sync effect
  // This prevents the effect from re-running when configs change from direct edits
  const contentConfigRef = useRef(contentConfig);
  const designConfigRef = useRef(designConfig);
  const targetingConfigRef = useRef(targetingConfig);
  const discountConfigRef = useRef(discountConfig);

  // Keep refs in sync with state
  useEffect(() => { contentConfigRef.current = contentConfig; }, [contentConfig]);
  useEffect(() => { designConfigRef.current = designConfig; }, [designConfig]);
  useEffect(() => { targetingConfigRef.current = targetingConfig; }, [targetingConfig]);
  useEffect(() => { discountConfigRef.current = discountConfig; }, [discountConfig]);

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
      // Scroll to the newly expanded section after the Collapsible animation completes (200ms)
      setTimeout(() => {
        const sectionElement = document.querySelector(`[data-section-id="${nextSection}"]`);
        if (sectionElement) {
          const rect = sectionElement.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetY = scrollTop + rect.top - 100; // 100px offset for header
          window.scrollTo({ top: targetY, behavior: "smooth" });
        }
      }, 250);
    }
  }, []);

  // Check if recipe has quick inputs
  const hasQuickInputs = useMemo(() => {
    return selectedRecipe?.inputs && selectedRecipe.inputs.length > 0;
  }, [selectedRecipe]);

  // Keep core configs in sync with Quick Configuration inputs
  // IMPORTANT: Only trigger on contextData or selectedRecipe changes (from Quick Config interactions)
  // Use refs to access current config values without triggering re-runs on direct field edits
  useEffect(() => {
    if (!selectedRecipe) return;

    const applied = applyQuickConfigToState({
      recipe: selectedRecipe,
      contextData,
      contentConfig: contentConfigRef.current,
      designConfig: designConfigRef.current,
      targetingConfig: targetingConfigRef.current,
      discountConfig: discountConfigRef.current,
    });

    if (applied.changed.content) {
      setContentConfig(applied.contentConfig);
    }
    if (applied.changed.design) {
      setDesignConfig(applied.designConfig);
    }
    if (applied.changed.targeting) {
      setTargetingConfig(applied.targetingConfig);
    }
    if (applied.changed.discount) {
      setDiscountConfig(applied.discountConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextData, selectedRecipe]);

  // Filter visible sections (hide quickConfig if no inputs, hide design if user doesn't want to customize)
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
  }, []);

  // Wrapper for discount config changes that syncs bundleDiscount to contextData
  // This prevents the Quick Config sync effect from overwriting direct edits
  const handleDiscountChange = useCallback((config: DiscountConfig) => {
    setDiscountConfig(config);
    // If value changed and recipe has bundleDiscount input, sync to contextData
    if (config.value !== undefined && selectedRecipe?.inputs.some(i => i.key === "bundleDiscount")) {
      setContextData((prev) => {
        if (prev.bundleDiscount !== config.value) {
          return { ...prev, bundleDiscount: config.value };
        }
        return prev;
      });
    }
  }, [selectedRecipe]);

  // Wrapper for content config changes that syncs bundleDiscount to contextData
  // This prevents the Quick Config sync effect from overwriting direct edits
  const handleContentChange = useCallback((config: Partial<ContentConfig>) => {
    setContentConfig(config);
    // If bundleDiscount changed and recipe has bundleDiscount input, sync to contextData
    const bundleDiscount = (config as Record<string, unknown>).bundleDiscount;
    if (bundleDiscount !== undefined && selectedRecipe?.inputs.some(i => i.key === "bundleDiscount")) {
      setContextData((prev) => {
        if (prev.bundleDiscount !== bundleDiscount) {
          return { ...prev, bundleDiscount };
        }
        return prev;
      });
    }
  }, [selectedRecipe]);

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
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: "smooth" });
    // If recipe has quick inputs, expand quickConfig first; otherwise basics
    const hasQuickInputs = recipe.inputs && recipe.inputs.length > 0;
    setExpandedSections([hasQuickInputs ? "quickConfig" : "basics"]);
  }, []);

  // Legacy handler for FormSections (when changing recipe in editor)
  // Theme handling: recipe's designConfig already contains colors if it has a theme
  const handleRecipeSelect = useCallback(
    (recipe: StyledRecipe) => {
      setSelectedRecipe(recipe);
      setContentConfig(recipe.defaults.contentConfig || {});

      // Use recipe's designConfig directly - it already contains theme colors if applicable
      setDesignConfig({
        ...recipe.defaults.designConfig,
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
      isEditMode,
      initialData?.templateType,
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
        // Preview on Store props
        shopDomain={shopDomain}
        templateType={templateType}
        contentConfig={contentConfig as Record<string, unknown>}
        designConfig={designConfig as Record<string, unknown>}
        targetRules={toTargetRulesRecord(targetingConfig)}
        discountConfig={discountConfig as Record<string, unknown>}
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

      {/* Main Content - Shared 2-Column Layout */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
        <CampaignEditorForm
          // Section management
          sections={visibleSections}
          expandedSections={expandedSections}
          completedSections={completedSections}
          onToggle={toggleSection}
          onMarkComplete={markComplete}
          // Recipe
          recipes={recipes}
          selectedRecipe={selectedRecipe}
          onRecipeSelect={handleRecipeSelect}
          // Campaign basics
          campaignName={campaignName}
          campaignDescription={campaignDescription}
          onNameChange={setCampaignName}
          onDescriptionChange={setCampaignDescription}
          // Quick config
          contextData={contextData}
          onContextDataChange={handleContextDataChange}
          // Configs
          contentConfig={contentConfig}
          designConfig={designConfig}
          discountConfig={discountConfig}
          targetingConfig={targetingConfig}
          frequencyConfig={frequencyConfig}
          scheduleConfig={scheduleConfig}
          onContentChange={handleContentChange}
          onDesignChange={setDesignConfig}
          onDiscountChange={handleDiscountChange}
          onTargetingChange={setTargetingConfig}
          onFrequencyChange={setFrequencyConfig}
          onScheduleChange={setScheduleConfig}
          // Store/Shop
          storeId={storeId}
          shopDomain={shopDomain}
          advancedTargetingEnabled={advancedTargetingEnabled}
          // Template
          templateType={templateType}
          campaignGoal={selectedRecipe?.goal}
          // Features
          customThemePresets={customThemePresets}
          backgroundsByLayout={backgroundsByLayout}
          globalCustomCSS={globalCustomCSS}
          globalFrequencyCapping={globalFrequencyCapping}
          defaultThemeTokens={defaultThemeTokens}
          // Preview
          previewDevice={previewDevice}
          onDeviceChange={setPreviewDevice}
          // SingleCampaignFlow-specific: save/publish actions
          onSaveDraft={handleSaveDraft}
          onPublish={handleSave}
          isSaving={isSaving}
          canPublish={(!!selectedRecipe || isEditMode) && !!campaignName}
          isEditMode={isEditMode}
        />
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
  // Preview on Store props
  shopDomain?: string;
  templateType?: string;
  contentConfig?: Record<string, unknown>;
  designConfig?: Record<string, unknown>;
  targetRules?: Record<string, unknown>;
  discountConfig?: Record<string, unknown>;
}

function StickyHeader({
  campaignName,
  onBack,
  onSaveDraft,
  onPublish,
  isSaving,
  canPublish,
  isEditMode = false,
  shopDomain,
  templateType,
  contentConfig,
  designConfig,
  targetRules,
  discountConfig,
}: StickyHeaderProps) {
  const [isCreatingPreview, setIsCreatingPreview] = useState(false);
  const [previewPopoverActive, setPreviewPopoverActive] = useState(false);

  const togglePreviewPopover = useCallback(
    () => setPreviewPopoverActive((active) => !active),
    []
  );

  const handlePreviewOnStore = async (behavior: "instant" | "realistic" = "instant") => {
    setPreviewPopoverActive(false);
    if (!shopDomain || !templateType) {
      console.error("Shop domain and template type are required for preview");
      return;
    }

    setIsCreatingPreview(true);

    try {
      const previewData = {
        name: (contentConfig as { name?: string })?.name || "Preview Campaign",
        templateType,
        contentConfig: contentConfig || {},
        designConfig: designConfig || {},
        targetRules: targetRules || {},
        priority: 0,
        discountConfig: discountConfig || {},
      };

      const response = await fetch("/api/preview/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewData),
      });

      if (!response.ok) {
        throw new Error("Failed to create preview session");
      }

      const result = await response.json();

      if (!result.success || !result.token) {
        throw new Error("Invalid preview session response");
      }

      const storeUrl = `https://${shopDomain}?split_pop_preview_token=${result.token}&preview_behavior=${behavior}`;
      window.open(storeUrl, "_blank");
    } catch (error) {
      console.error("Failed to create preview:", error);
      alert("Failed to create preview. Please try again.");
    } finally {
      setIsCreatingPreview(false);
    }
  };

  const canPreview = !!shopDomain && !!templateType;

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
            {/* Preview on Store button */}
            {canPreview && (
              <Popover
                active={previewPopoverActive}
                activator={
                  <Button
                    icon={ViewIcon}
                    disclosure="down"
                    onClick={togglePreviewPopover}
                    loading={isCreatingPreview}
                    disabled={isCreatingPreview}
                  >
                    Preview on Store
                  </Button>
                }
                autofocusTarget="first-node"
                onClose={togglePreviewPopover}
              >
                <ActionList
                  actionRole="menuitem"
                  items={[
                    {
                      content: "Quick Preview",
                      helpText: "Shows popup immediately, bypassing triggers",
                      onAction: () => handlePreviewOnStore("instant"),
                    },
                    {
                      content: "Test with Triggers",
                      helpText: "Evaluates triggers as configured (delays, scroll, etc.)",
                      onAction: () => handlePreviewOnStore("realistic"),
                    },
                  ]}
                />
              </Popover>
            )}
            <Button onClick={onSaveDraft} disabled={isSaving} loading={isSaving} icon={SaveIcon}>
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


