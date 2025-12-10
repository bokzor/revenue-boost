/**
 * CampaignEditorForm Component
 *
 * Shared component that renders the 2-column layout with:
 * - Left: Live Preview Panel (sticky)
 * - Right: Form Sections (collapsible accordion)
 *
 * Used by both SingleCampaignFlow and VariantCampaignEditor.
 * The only differences between flows are:
 * - Which sections are visible (controlled via `sections` prop)
 * - Save behavior (manual vs auto-save, handled by parent)
 */

import { Layout, Card, Box, BlockStack, Text } from "@shopify/polaris";
import { FormSections, type TargetingConfig, type ScheduleConfig } from "./FormSections";
import {
  LivePreviewPanel,
  type PreviewDevice,
} from "~/domains/popups/components/preview/LivePreviewPanel";
import { Affix } from "~/shared/components/ui/Affix";
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
import { toTargetRulesRecord, EDITOR_SECTIONS, type SectionId } from "./defaults";
import type { DesignTokens } from "../../types/design-tokens";

export interface CampaignEditorFormProps {
  // === Section Management ===
  sections: typeof EDITOR_SECTIONS;
  expandedSections: SectionId[];
  completedSections: SectionId[];
  onToggle: (id: SectionId) => void;
  onMarkComplete: (id: SectionId, nextSection?: SectionId) => void;

  // === Recipe ===
  recipes: StyledRecipe[];
  selectedRecipe: StyledRecipe | undefined;
  onRecipeSelect: (recipe: StyledRecipe) => void;

  // === Campaign Basics ===
  campaignName?: string;
  campaignDescription?: string;
  onNameChange?: (name: string) => void;
  onDescriptionChange?: (desc: string) => void;

  // === Quick Config ===
  contextData?: RecipeContext;
  onContextDataChange?: (key: string, value: unknown) => void;

  // === Configs ===
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  discountConfig?: DiscountConfig;
  targetingConfig: TargetingConfig;
  frequencyConfig: FrequencyCappingConfig;
  scheduleConfig: ScheduleConfig;
  onContentChange: (config: Partial<ContentConfig>) => void;
  onDesignChange: (config: Partial<DesignConfig>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
  onTargetingChange: (config: TargetingConfig) => void;
  onFrequencyChange: (config: FrequencyCappingConfig) => void;
  onScheduleChange: (config: ScheduleConfig) => void;

  // === Store/Shop Info ===
  storeId: string;
  shopDomain?: string;
  advancedTargetingEnabled?: boolean;

  // === Template Info ===
  templateType?: TemplateType;
  campaignGoal?: CampaignGoal | string;

  // === Feature Props ===
  customThemePresets?: ThemePreset[];
  backgroundsByLayout?: Record<string, BackgroundPreset[]>;
  globalCustomCSS?: string;
  globalFrequencyCapping?: GlobalFrequencyCappingSettings;
  defaultThemeTokens?: DesignTokens;

  // === Preview ===
  previewDevice: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;

  // === Variant-specific (optional) ===
  restrictRecipesToGoal?: CampaignGoal;
  variantLabel?: string;

  // === SingleCampaignFlow-specific (optional) ===
  onSaveDraft?: () => void;
  onPublish?: () => void;
  isSaving?: boolean;
  canPublish?: boolean;
  isEditMode?: boolean;

  // === Footer content (optional) ===
  footerContent?: React.ReactNode;
}

export function CampaignEditorForm({
  // Section management
  sections,
  expandedSections,
  completedSections,
  onToggle,
  onMarkComplete,
  // Recipe
  recipes,
  selectedRecipe,
  onRecipeSelect,
  // Campaign basics
  campaignName,
  campaignDescription,
  onNameChange,
  onDescriptionChange,
  // Quick config
  contextData,
  onContextDataChange,
  // Configs
  contentConfig,
  designConfig,
  discountConfig,
  targetingConfig,
  frequencyConfig,
  scheduleConfig,
  onContentChange,
  onDesignChange,
  onDiscountChange,
  onTargetingChange,
  onFrequencyChange,
  onScheduleChange,
  // Store/Shop
  storeId,
  shopDomain,
  advancedTargetingEnabled,
  // Template
  templateType,
  campaignGoal,
  // Features
  customThemePresets,
  backgroundsByLayout,
  globalCustomCSS,
  globalFrequencyCapping,
  defaultThemeTokens,
  // Preview
  previewDevice,
  onDeviceChange,
  // Variant-specific
  restrictRecipesToGoal,
  variantLabel,
  // SingleCampaignFlow-specific
  onSaveDraft,
  onPublish,
  isSaving,
  canPublish,
  isEditMode,
  // Footer
  footerContent,
}: CampaignEditorFormProps) {
  return (
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
                  discountConfig,
                }}
                designConfig={designConfig}
                targetRules={toTargetRulesRecord(targetingConfig)}
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
      </Layout.Section>

      {/* Right Column - Form Sections */}
      <Layout.Section variant="oneHalf">
        <FormSections
          sections={sections}
          expandedSections={expandedSections}
          completedSections={completedSections}
          onToggle={onToggle}
          recipes={recipes}
          selectedRecipe={selectedRecipe}
          onRecipeSelect={onRecipeSelect}
          // Campaign basics
          campaignName={campaignName}
          campaignDescription={campaignDescription}
          onNameChange={onNameChange}
          onDescriptionChange={onDescriptionChange}
          // Quick config
          contextData={contextData}
          onContextDataChange={onContextDataChange}
          // Configs
          contentConfig={contentConfig}
          designConfig={designConfig}
          discountConfig={discountConfig}
          targetingConfig={targetingConfig}
          frequencyConfig={frequencyConfig}
          scheduleConfig={scheduleConfig}
          onContentChange={onContentChange}
          onDesignChange={onDesignChange}
          onDiscountChange={onDiscountChange}
          onTargetingChange={onTargetingChange}
          onFrequencyChange={onFrequencyChange}
          onScheduleChange={onScheduleChange}
          onMarkComplete={onMarkComplete}
          storeId={storeId}
          advancedTargetingEnabled={advancedTargetingEnabled}
          templateType={templateType}
          campaignGoal={campaignGoal}
          // Feature props
          customThemePresets={customThemePresets}
          backgroundsByLayout={backgroundsByLayout}
          globalCustomCSS={globalCustomCSS}
          globalFrequencyCapping={globalFrequencyCapping}
          onMobileLayoutChange={() => onDeviceChange("mobile")}
          // Variant-specific
          restrictRecipesToGoal={restrictRecipesToGoal}
          variantLabel={variantLabel}
          // SingleCampaignFlow-specific
          onSaveDraft={onSaveDraft}
          onPublish={onPublish}
          isSaving={isSaving}
          canPublish={canPublish}
          isEditMode={isEditMode}
        />

        {/* Optional footer content (e.g., "Back to Variants" button) */}
        {footerContent}
      </Layout.Section>
    </Layout>
  );
}

