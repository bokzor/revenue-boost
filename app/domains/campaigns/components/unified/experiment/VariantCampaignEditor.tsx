/**
 * VariantCampaignEditor Component
 *
 * Two-step flow for configuring a single A/B test variant:
 * 1. Recipe Selection: Goal-first recipe picker with configuration
 * 2. Campaign Editor: 2-column layout with preview and form sections
 */

import { useState, useCallback } from "react";
import { Layout, Card, BlockStack, Text, Box, Banner, Page, InlineStack, Button } from "@shopify/polaris";
import { FormSections, type TargetingConfig, type ScheduleConfig } from "../FormSections";
import { RecipeSelectionStep, type RecipeSelectionResult } from "../RecipeSelectionStep";
import { LivePreviewPanel, type PreviewDevice } from "~/domains/popups/components/preview/LivePreviewPanel";
import { Affix } from "~/shared/components/ui/Affix";
import type { StyledRecipe } from "../../../recipes/styled-recipe-types";
import type { ContentConfig, DesignConfig, DiscountConfig, CampaignGoal } from "../../../types/campaign";
import type { TemplateType } from "~/shared/hooks/useWizardState";
import type { FrequencyCappingConfig } from "~/domains/targeting/components/FrequencyCappingPanel";
import type { Variant } from "../types";
import type { CampaignData, DefaultThemeTokens } from "../SingleCampaignFlow";
import type { BackgroundPreset } from "~/config/background-presets";
import type { GlobalFrequencyCappingSettings } from "~/domains/store/types/settings";
import type { ThemePreset } from "../../steps/DesignContentStep";

// Default configs
const DEFAULT_TARGETING_CONFIG: TargetingConfig = {
  enhancedTriggers: { enabled: true, page_load: { enabled: true, delay: 3000 } },
  audienceTargeting: { enabled: false, shopifySegmentIds: [] },
  geoTargeting: { enabled: false, mode: "include", countries: [] },
};

const DEFAULT_FREQUENCY_CONFIG: FrequencyCappingConfig = {
  enabled: true,
  max_triggers_per_session: 1,
  max_triggers_per_day: 3,
  cooldown_between_triggers: 300,
  respectGlobalCap: true,
};

const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  status: "DRAFT",
  priority: 50,
};

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

type SectionId = "recipe" | "basics" | "quickConfig" | "content" | "design" | "discount" | "targeting" | "frequency" | "schedule";

// Editor sections (recipe is now a separate step)
// Note: "basics" is available for variants that need name editing, but variants typically use preset names
// Note: For variants, we use "content" section (same as SingleCampaignFlow) which includes both content and design
const EDITOR_SECTIONS: { id: SectionId; icon: string; title: string; subtitle: string }[] = [
  { id: "content", icon: "✏️", title: "Content & Design", subtitle: "Configure headlines, buttons, colors, and styling" },
  { id: "targeting", icon: "🎯", title: "Targeting & Triggers", subtitle: "Define who sees your popup and when" },
  { id: "frequency", icon: "🔄", title: "Frequency", subtitle: "Control how often the popup appears" },
  { id: "schedule", icon: "📅", title: "Schedule & Settings", subtitle: "Set start/end dates and priority" },
];

// Non-control variants don't see schedule (inherits from control)
const VARIANT_SECTIONS = EDITOR_SECTIONS.filter((s) => s.id !== "schedule");

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

  // Section state (starts with content expanded since recipe selection is done)
  const [expandedSections, setExpandedSections] = useState<SectionId[]>(["content"]);
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
    }
  }, []);

  // Build campaign data
  const buildCampaignData = useCallback((): CampaignData => ({
    name: variant.name,
    recipe: selectedRecipe,
    templateType: selectedRecipe?.templateType as TemplateType,
    contentConfig,
    designConfig,
    discountConfig,
    targetingConfig,
    frequencyConfig,
    scheduleConfig,
  }), [variant.name, selectedRecipe, contentConfig, designConfig, discountConfig, targetingConfig, frequencyConfig, scheduleConfig]);

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

  // Back handler that respects the step
  const handleBack = useCallback(() => {
    if (step === "editor") {
      // Go back to recipe selection
      setStep("recipe");
    } else if (onBack) {
      // Go back to variant list
      onBack();
    }
  }, [step, onBack]);

  const saveCurrentState = useCallback(() => {
    if (selectedRecipe) {
      onSave(buildCampaignData());
    }
  }, [selectedRecipe, buildCampaignData, onSave]);

  const templateType = selectedRecipe?.templateType as TemplateType | undefined;
  const sectionsToShow = isControlVariant ? EDITOR_SECTIONS : VARIANT_SECTIONS;

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
  // STEP 2: CAMPAIGN EDITOR
  // =============================================================================
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

      <Layout>
        {/* Left Column - Live Preview */}
        <Layout.Section variant="oneHalf">
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
                  device={previewDevice}
                  onDeviceChange={setPreviewDevice}
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
                        Select a recipe to see a live preview
                      </Text>
                    </BlockStack>
                  </Box>
                </Card>
              )}
            </Affix>
          </div>
        </Layout.Section>

        {/* Right Column - Form Sections */}
        <Layout.Section variant="oneHalf">
          <FormSections
            sections={sectionsToShow}
            expandedSections={expandedSections}
            completedSections={completedSections}
            onToggle={toggleSection}
            recipes={recipes}
            selectedRecipe={selectedRecipe}
            onRecipeSelect={handleRecipeSelect}
            contentConfig={contentConfig}
            designConfig={designConfig}
            discountConfig={discountConfig}
            targetingConfig={targetingConfig}
            frequencyConfig={frequencyConfig}
            scheduleConfig={scheduleConfig}
            onContentChange={(cfg) => {
              setContentConfig(cfg);
              saveCurrentState();
            }}
            onDesignChange={(cfg) => {
              setDesignConfig(cfg);
              saveCurrentState();
            }}
            onDiscountChange={(cfg) => {
              setDiscountConfig(cfg);
              saveCurrentState();
            }}
            onTargetingChange={(cfg) => {
              setTargetingConfig(cfg);
              saveCurrentState();
            }}
            onFrequencyChange={(cfg) => {
              setFrequencyConfig(cfg);
              saveCurrentState();
            }}
            onScheduleChange={(cfg) => {
              setScheduleConfig(cfg);
              saveCurrentState();
            }}
            onMarkComplete={markComplete}
            storeId={storeId}
            advancedTargetingEnabled={advancedTargetingEnabled}
            templateType={templateType}
            campaignGoal={selectedRecipe?.goal}
            restrictRecipesToGoal={!isControlVariant && controlGoal ? controlGoal as CampaignGoal : undefined}
            variantLabel={!isControlVariant ? `Variant ${variant.name}` : undefined}
            // New props for feature parity
            customThemePresets={customThemePresets}
            backgroundsByLayout={backgroundsByLayout}
            globalCustomCSS={globalCustomCSS}
            globalFrequencyCapping={globalFrequencyCapping}
            onMobileLayoutChange={() => setPreviewDevice("mobile")}
          />

          {/* Back to Variants button at the bottom */}
          {onBackToVariants && (
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
          )}
        </Layout.Section>
      </Layout>
    </div>
  );
}

