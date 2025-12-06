/**
 * SingleCampaignFlow Component
 *
 * Full-width 2-column layout for creating a single campaign.
 * Left: Live preview (sticky)
 * Right: Collapsible sections for recipe, design, targeting, frequency, schedule
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
  TextField,
  Box,
  Banner,
} from "@shopify/polaris";
import { ArrowLeftIcon, SaveIcon } from "@shopify/polaris-icons";
import { FormSections, type TargetingConfig, type ScheduleConfig } from "./FormSections";
import { LivePreviewPanel, type PreviewDevice } from "~/domains/popups/components/preview/LivePreviewPanel";
import { Affix } from "~/shared/components/ui/Affix";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import type { ContentConfig, DesignConfig, DiscountConfig, CampaignGoal } from "../../types/campaign";
import type { TemplateType } from "~/shared/hooks/useWizardState";
import type { FrequencyCappingConfig } from "~/domains/targeting/components/FrequencyCappingPanel";
import type { BackgroundPreset } from "~/config/background-presets";
import type { GlobalFrequencyCappingSettings } from "~/domains/store/types/settings";
import type { ThemePreset } from "../steps/DesignContentStep";
import { validateCampaignCreateData, validateContentConfig } from "../../validation/campaign-validation";

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

// Section definitions
type SectionId = "recipe" | "design" | "discount" | "targeting" | "frequency" | "schedule";

const SECTIONS: { id: SectionId; icon: string; title: string; subtitle: string }[] = [
  { id: "recipe", icon: "📦", title: "Choose a Recipe", subtitle: "Select a pre-designed popup template" },
  { id: "design", icon: "🎨", title: "Customize Design", subtitle: "Adjust colors, content, and styling" },
  { id: "discount", icon: "🎁", title: "Discount & Incentives", subtitle: "Configure discount codes and rewards" },
  { id: "targeting", icon: "🎯", title: "Targeting & Triggers", subtitle: "Define who sees your popup and when" },
  { id: "frequency", icon: "🔄", title: "Frequency", subtitle: "Control how often the popup appears" },
  { id: "schedule", icon: "📅", title: "Schedule & Settings", subtitle: "Set start/end dates and priority" },
];

export interface SingleCampaignFlowProps {
  onBack: () => void;
  onSave: (data: CampaignData) => Promise<void>;
  onSaveDraft: (data: CampaignData) => Promise<void>;
  recipes: StyledRecipe[];
  storeId: string;
  shopDomain?: string;
  advancedTargetingEnabled?: boolean;
  initialData?: Partial<CampaignData>;
  // === New props for feature parity ===
  /** Custom theme presets from store settings */
  customThemePresets?: ThemePreset[];
  /** Map of layout -> background presets */
  backgroundsByLayout?: Record<string, BackgroundPreset[]>;
  /** Global custom CSS from store settings */
  globalCustomCSS?: string;
  /** Global frequency capping settings from store */
  globalFrequencyCapping?: GlobalFrequencyCappingSettings;
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
  // New props for feature parity
  customThemePresets,
  backgroundsByLayout,
  globalCustomCSS,
  globalFrequencyCapping,
}: SingleCampaignFlowProps) {
  // Campaign state
  const [campaignName, setCampaignName] = useState(initialData?.name || "");
  const [campaignDescription, setCampaignDescription] = useState(initialData?.description || "");
  const [selectedRecipe, setSelectedRecipe] = useState<StyledRecipe | undefined>(initialData?.recipe);
  const [contentConfig, setContentConfig] = useState<Partial<ContentConfig>>(initialData?.contentConfig || {});
  const [designConfig, setDesignConfig] = useState<Partial<DesignConfig>>(initialData?.designConfig || {});
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

  // Section state
  const [expandedSections, setExpandedSections] = useState<SectionId[]>(["recipe"]);
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

  const handleRecipeSelect = useCallback((recipe: StyledRecipe) => {
    setSelectedRecipe(recipe);
    setContentConfig(recipe.defaults.contentConfig || {});
    setDesignConfig(recipe.defaults.designConfig || {});
    markComplete("recipe", "design");
    // Clear validation errors when recipe changes
    setValidationErrors([]);
    setValidationWarnings([]);
  }, [markComplete]);

  const getCampaignData = useCallback((): CampaignData => ({
    name: campaignName,
    description: campaignDescription,
    recipe: selectedRecipe,
    templateType: selectedRecipe?.templateType as TemplateType | undefined,
    contentConfig,
    designConfig,
    discountConfig,
    targetingConfig,
    frequencyConfig,
    scheduleConfig,
  }), [campaignName, campaignDescription, selectedRecipe, contentConfig, designConfig, discountConfig, targetingConfig, frequencyConfig, scheduleConfig]);

  // Validate campaign data before saving
  const validateCampaign = useCallback((forPublish: boolean): { valid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!campaignName.trim()) {
      errors.push("Campaign name is required");
    }

    if (!selectedRecipe) {
      errors.push("Please select a recipe/template");
    }

    const templateType = selectedRecipe?.templateType as TemplateType | undefined;

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
        goal: selectedRecipe?.goal as CampaignGoal || "NEWSLETTER_SIGNUP",
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
        const newErrors = result.errors.filter(e => !errors.includes(e));
        errors.push(...newErrors);
      }
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }, [campaignName, campaignDescription, selectedRecipe, contentConfig, designConfig, targetingConfig, discountConfig]);

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

  const templateType = selectedRecipe?.templateType as TemplateType | undefined;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--p-color-bg-surface)" }}>
      {/* Sticky Header */}
      <StickyHeader
        campaignName={campaignName}
        campaignDescription={campaignDescription}
        onNameChange={setCampaignName}
        onDescriptionChange={setCampaignDescription}
        onBack={onBack}
        onSaveDraft={handleSaveDraft}
        onPublish={handleSave}
        isSaving={isSaving}
        canPublish={!!selectedRecipe && !!campaignName}
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
              <Banner
                title="Warnings"
                tone="warning"
                onDismiss={() => setValidationWarnings([])}
              >
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
              targetingConfig={targetingConfig}
              shopDomain={shopDomain}
              globalCustomCSS={globalCustomCSS}
              previewDevice={previewDevice}
              onDeviceChange={setPreviewDevice}
            />
          </Layout.Section>

          {/* Right Column - Form Sections */}
          <Layout.Section variant="oneHalf">
            <FormSections
              sections={SECTIONS}
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
  campaignDescription?: string;
  onNameChange: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isSaving: boolean;
  canPublish: boolean;
}

function StickyHeader({
  campaignName,
  campaignDescription,
  onNameChange,
  onDescriptionChange,
  onBack,
  onSaveDraft,
  onPublish,
  isSaving,
  canPublish,
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
        <BlockStack gap="200">
          <InlineStack align="space-between" blockAlign="center">
            {/* Left: Back button and campaign name */}
            <InlineStack gap="400" blockAlign="center">
              <Button icon={ArrowLeftIcon} onClick={onBack} variant="tertiary" />
              <TextField
                label=""
                labelHidden
                value={campaignName}
                onChange={onNameChange}
                placeholder="Campaign name..."
                autoComplete="off"
                connectedLeft={
                  <div style={{ padding: "0 8px", display: "flex", alignItems: "center" }}>
                    <Text as="span" variant="headingMd">📣</Text>
                  </div>
                }
              />
            </InlineStack>

            {/* Right: Action buttons */}
            <InlineStack gap="300">
              <Button onClick={onSaveDraft} disabled={isSaving} icon={SaveIcon}>
                Save Draft
              </Button>
              <Button
                variant="primary"
                onClick={onPublish}
                disabled={isSaving || !canPublish}
                loading={isSaving}
              >
                Publish
              </Button>
            </InlineStack>
          </InlineStack>

          {/* Description field (optional) */}
          {onDescriptionChange && (
            <div style={{ marginLeft: "52px" }}>
              <TextField
                label=""
                labelHidden
                value={campaignDescription || ""}
                onChange={onDescriptionChange}
                placeholder="Add a description (optional)..."
                autoComplete="off"
                multiline={1}
              />
            </div>
          )}
        </BlockStack>
      </div>
    </div>
  );
}


interface PreviewColumnProps {
  templateType?: TemplateType;
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  targetingConfig: TargetingConfig;
  shopDomain?: string;
  globalCustomCSS?: string;
  previewDevice: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
}

function PreviewColumn({
  templateType,
  contentConfig,
  designConfig,
  targetingConfig,
  shopDomain,
  globalCustomCSS,
  previewDevice,
  onDeviceChange,
}: PreviewColumnProps) {
  return (
    <div data-affix-boundary style={{ position: "relative", alignSelf: "flex-start" }}>
      <Affix disableBelowWidth={768}>
        {templateType ? (
          <LivePreviewPanel
            templateType={templateType}
            config={contentConfig}
            designConfig={designConfig}
            targetRules={targetingConfig as unknown as Record<string, unknown>}
            shopDomain={shopDomain}
            globalCustomCSS={globalCustomCSS}
            device={previewDevice}
            onDeviceChange={onDeviceChange}
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

