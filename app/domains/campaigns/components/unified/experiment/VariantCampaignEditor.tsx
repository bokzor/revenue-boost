/**
 * VariantCampaignEditor Component
 *
 * Two-step flow for configuring a single A/B test variant:
 * 1. Recipe Selection: Goal-first recipe picker with configuration
 * 2. Campaign Editor: Uses shared CampaignEditorForm component
 *
 * The only variant-specific logic is:
 * - Auto-save with debounce
 * - "Back to Variants" footer button
 * - Different sections for control vs non-control variants
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Card, BlockStack, Text, Box, Banner, Page, InlineStack, Button } from "@shopify/polaris";
import { type TargetingConfig, type ScheduleConfig } from "../FormSections";
import { RecipeSelectionStep, type RecipeSelectionResult } from "../RecipeSelectionStep";
import { CampaignEditorForm } from "../CampaignEditorForm";
import type { PreviewDevice } from "~/domains/popups/components/preview/LivePreviewPanel";
import type { StyledRecipe, RecipeContext } from "../../../recipes/styled-recipe-types";
import type { ContentConfig, DesignConfig, DiscountConfig, CampaignGoal } from "../../../types/campaign";
import type { TemplateType } from "~/shared/hooks/useWizardState";
import type { FrequencyCappingConfig } from "~/domains/targeting/components/FrequencyCappingPanel";
import type { Variant } from "../types";
import type { CampaignData, DefaultThemeTokens } from "../SingleCampaignFlow";
import type { BackgroundPreset } from "~/config/background-presets";
import type { GlobalFrequencyCappingSettings } from "~/domains/store/types/settings";
import type { ThemePreset } from "../../steps/DesignContentStep";
import {
  DEFAULT_TARGETING_CONFIG,
  DEFAULT_FREQUENCY_CONFIG,
  DEFAULT_SCHEDULE_CONFIG,
  DEFAULT_DISCOUNT_CONFIG,
  EDITOR_SECTIONS,
  VARIANT_SECTIONS,
  type SectionId,
} from "../defaults";

export interface VariantCampaignEditorProps {
  variant: Variant;
  recipes: StyledRecipe[];
  storeId: string;
  shopDomain?: string;
  advancedTargetingEnabled?: boolean;
  onSave: (data: CampaignData) => Promise<void>;
  isControlVariant: boolean;
  /** For non-control variants: restrict recipes to this goal (from control variant) */
  controlGoal?: string;
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
  /** Callback when user wants to go back from recipe selection */
  onBack?: () => void;
  /** Callback to navigate back to variant list (shown at end of form) */
  onBackToVariants?: () => void;
}

export function VariantCampaignEditor({
  variant,
  recipes,
  storeId,
  shopDomain,
  advancedTargetingEnabled,
  onSave,
  isControlVariant,
  controlGoal,
  // New props for feature parity
  customThemePresets,
  backgroundsByLayout,
  globalCustomCSS,
  globalFrequencyCapping,
  defaultThemeTokens,
  onBack,
  onBackToVariants,
}: VariantCampaignEditorProps) {
  const initialData = variant.campaignData;
  const hasExistingRecipe = !!(initialData?.recipe || variant.recipe);

  // Flow step: "recipe" (selection) or "editor" (configuration)
  const [step, setStep] = useState<"recipe" | "editor">(hasExistingRecipe ? "editor" : "recipe");

  const [selectedRecipe, setSelectedRecipe] = useState<StyledRecipe | undefined>(
    initialData?.recipe || variant.recipe
  );
  // Campaign basics - for variants, default name is the variant name
  const [campaignName, setCampaignName] = useState<string>(
    initialData?.name || variant.name || ""
  );
  const [campaignDescription, setCampaignDescription] = useState<string>(
    initialData?.description || ""
  );
  // Quick configuration context data (populated from recipe inputs)
  const [contextData, setContextData] = useState<RecipeContext>({});

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

  // Section state (starts with basics expanded)
  const [expandedSections, setExpandedSections] = useState<SectionId[]>(["basics"]);
  const [completedSections, setCompletedSections] = useState<SectionId[]>([]);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("tablet");

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

  // Use ref to always have latest state for debounced saves (avoids stale closures)
  const latestStateRef = useRef({
    campaignName,
    campaignDescription,
    selectedRecipe,
    contentConfig,
    designConfig,
    discountConfig,
    targetingConfig,
    frequencyConfig,
    scheduleConfig,
  });

  // Keep ref in sync with state
  useEffect(() => {
    latestStateRef.current = {
      campaignName,
      campaignDescription,
      selectedRecipe,
      contentConfig,
      designConfig,
      discountConfig,
      targetingConfig,
      frequencyConfig,
      scheduleConfig,
    };
  }, [campaignName, campaignDescription, selectedRecipe, contentConfig, designConfig, discountConfig, targetingConfig, frequencyConfig, scheduleConfig]);

  // Build campaign data (uses ref for debounced saves to avoid stale closures)
  const buildCampaignData = useCallback((): CampaignData => {
    const state = latestStateRef.current;
    return {
      name: state.campaignName,
      description: state.campaignDescription,
      recipe: state.selectedRecipe,
      templateType: state.selectedRecipe?.templateType as TemplateType,
      contentConfig: state.contentConfig,
      designConfig: state.designConfig,
      discountConfig: state.discountConfig,
      targetingConfig: state.targetingConfig,
      frequencyConfig: state.frequencyConfig,
      scheduleConfig: state.scheduleConfig,
    };
  }, []);

  // Handler for RecipeSelectionStep (step 1 → step 2)
  const handleRecipeSelected = useCallback((result: RecipeSelectionResult) => {
    const { recipe, initialData: recipeData } = result;
    setSelectedRecipe(recipe);
    setContentConfig(recipeData.contentConfig as Partial<ContentConfig>);
    setDesignConfig(recipeData.designConfig as Partial<DesignConfig>);
    if (recipeData.discountConfig && "enabled" in recipeData.discountConfig) {
      setDiscountConfig(recipeData.discountConfig as DiscountConfig);
    }
    if (recipeData.targetRules) {
      setTargetingConfig((prev) => ({
        ...prev,
        enhancedTriggers: (recipeData.targetRules.enhancedTriggers as TargetingConfig["enhancedTriggers"]) || prev.enhancedTriggers,
      }));
    }
    // Move to editor step
    setStep("editor");
    setExpandedSections(["design"]);
    // Auto-save on recipe select
    onSave({
      name: variant.name,
      recipe,
      templateType: recipe.templateType as TemplateType,
      contentConfig: recipeData.contentConfig as Partial<ContentConfig>,
      designConfig: recipeData.designConfig as Partial<DesignConfig>,
      discountConfig: recipeData.discountConfig && "enabled" in recipeData.discountConfig
        ? recipeData.discountConfig as DiscountConfig
        : discountConfig,
      targetingConfig,
      frequencyConfig,
      scheduleConfig,
    });
  }, [onSave, variant.name, discountConfig, targetingConfig, frequencyConfig, scheduleConfig]);

  // Legacy handler for FormSections (when changing recipe in editor)
  const handleRecipeSelect = useCallback((recipe: StyledRecipe) => {
    setSelectedRecipe(recipe);
    setContentConfig(recipe.defaults.contentConfig || {});
    setDesignConfig(recipe.defaults.designConfig || {});
    markComplete("recipe", "design");
    onSave({
      name: variant.name,
      recipe,
      templateType: recipe.templateType as TemplateType,
      contentConfig: recipe.defaults.contentConfig || {},
      designConfig: recipe.defaults.designConfig || {},
      discountConfig,
      targetingConfig,
      frequencyConfig,
      scheduleConfig,
    });
  }, [markComplete, onSave, variant.name, discountConfig, targetingConfig, frequencyConfig, scheduleConfig]);

  // Debounced save to prevent excessive saves on rapid form changes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY_MS = 500;

  const saveCurrentState = useCallback(() => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule a debounced save
    saveTimeoutRef.current = setTimeout(() => {
      if (selectedRecipe) {
        onSave(buildCampaignData());
      }
    }, DEBOUNCE_DELAY_MS);
  }, [selectedRecipe, buildCampaignData, onSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const templateType = selectedRecipe?.templateType as TemplateType | undefined;
  const sectionsToShow = isControlVariant ? EDITOR_SECTIONS : VARIANT_SECTIONS;

  // Check if recipe has quick config inputs
  const hasQuickInputs = selectedRecipe?.inputs && selectedRecipe.inputs.length > 0;

  // Filter sections: remove quickConfig if no inputs
  const visibleSections = hasQuickInputs
    ? sectionsToShow
    : sectionsToShow.filter((s) => s.id !== "quickConfig");

  // Wrap change handlers to trigger auto-save
  // NOTE: These hooks MUST be defined before any early returns to satisfy React's rules of hooks
  const handleNameChange = useCallback((name: string) => {
    setCampaignName(name);
    saveCurrentState();
  }, [saveCurrentState]);

  const handleDescriptionChange = useCallback((desc: string) => {
    setCampaignDescription(desc);
    saveCurrentState();
  }, [saveCurrentState]);

  const handleContextDataChange = useCallback((key: string, value: unknown) => {
    setContextData((prev) => ({ ...prev, [key]: value }));
    saveCurrentState();
  }, [saveCurrentState]);

  const handleContentChange = useCallback((cfg: Partial<ContentConfig>) => {
    setContentConfig(cfg);
    saveCurrentState();
  }, [saveCurrentState]);

  const handleDesignChange = useCallback((cfg: Partial<DesignConfig>) => {
    setDesignConfig(cfg);
    saveCurrentState();
  }, [saveCurrentState]);

  const handleDiscountChange = useCallback((cfg: DiscountConfig) => {
    setDiscountConfig(cfg);
    saveCurrentState();
  }, [saveCurrentState]);

  const handleTargetingChange = useCallback((cfg: TargetingConfig) => {
    setTargetingConfig(cfg);
    saveCurrentState();
  }, [saveCurrentState]);

  const handleFrequencyChange = useCallback((cfg: FrequencyCappingConfig) => {
    setFrequencyConfig(cfg);
    saveCurrentState();
  }, [saveCurrentState]);

  const handleScheduleChange = useCallback((cfg: ScheduleConfig) => {
    setScheduleConfig(cfg);
    saveCurrentState();
  }, [saveCurrentState]);

  // =============================================================================
  // STEP 1: RECIPE SELECTION
  // =============================================================================
  if (step === "recipe") {
    const variantLabel = isControlVariant ? "Control (A)" : `Variant ${variant.name}`;
    return (
      <Page
        title={`Choose a Recipe for ${variantLabel}`}
        subtitle="Select a pre-designed popup template for this variant"
        backAction={onBack ? { onAction: onBack, content: "Back" } : undefined}
        fullWidth
      >
        <RecipeSelectionStep
          recipes={recipes}
          onRecipeSelected={handleRecipeSelected}
          onBuildFromScratch={undefined}
          storeId={storeId}
          defaultThemeTokens={defaultThemeTokens}
          restrictToGoal={!isControlVariant && controlGoal ? controlGoal as CampaignGoal : undefined}
          variantLabel={variantLabel}
        />
      </Page>
    );
  }

  // =============================================================================
  // STEP 2: CAMPAIGN EDITOR (using shared component)
  // =============================================================================

  // Footer content: "Back to Variants" button
  const footerContent = onBackToVariants ? (
    <Box paddingBlockStart="600">
      <Card>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd" tone="subdued">
            Done configuring this variant? Go back to see all variants or configure another one.
          </Text>
          <InlineStack align="end">
            <Button onClick={onBackToVariants} variant="primary">
              ← Back to Variants
            </Button>
          </InlineStack>
        </BlockStack>
      </Card>
    </Box>
  ) : undefined;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
      {/* Info banner for non-control variants */}
      {!isControlVariant && (
        <Box paddingBlockEnd="400">
          <Banner tone="info">
            Schedule settings are inherited from the Control variant (A). Only recipe, design, and
            targeting differ between variants.
          </Banner>
        </Box>
      )}

      <CampaignEditorForm
        // Section management
        sections={visibleSections}
        expandedSections={expandedSections}
        completedSections={completedSections}
        onToggle={toggleSection}
        onMarkComplete={markComplete}
        // Campaign basics (name & description)
        campaignName={campaignName}
        campaignDescription={campaignDescription}
        onNameChange={handleNameChange}
        onDescriptionChange={handleDescriptionChange}
        // Quick configuration (recipe inputs)
        contextData={contextData}
        onContextDataChange={handleContextDataChange}
        // Recipe
        recipes={recipes}
        selectedRecipe={selectedRecipe}
        onRecipeSelect={handleRecipeSelect}
        // Configs (with auto-save wrappers)
        contentConfig={contentConfig}
        designConfig={designConfig}
        discountConfig={discountConfig}
        targetingConfig={targetingConfig}
        frequencyConfig={frequencyConfig}
        scheduleConfig={scheduleConfig}
        onContentChange={handleContentChange}
        onDesignChange={handleDesignChange}
        onDiscountChange={handleDiscountChange}
        onTargetingChange={handleTargetingChange}
        onFrequencyChange={handleFrequencyChange}
        onScheduleChange={handleScheduleChange}
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
        // Variant-specific
        restrictRecipesToGoal={!isControlVariant && controlGoal ? controlGoal as CampaignGoal : undefined}
        variantLabel={!isControlVariant ? `Variant ${variant.name}` : undefined}
        // Footer
        footerContent={footerContent}
      />
    </div>
  );
}

