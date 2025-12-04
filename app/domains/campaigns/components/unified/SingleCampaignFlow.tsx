/**
 * SingleCampaignFlow Component
 *
 * Full-width 2-column layout for creating a single campaign.
 * Left: Live preview (sticky)
 * Right: Collapsible sections for recipe, design, targeting, frequency, schedule
 */

import { useState, useCallback } from "react";
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
} from "@shopify/polaris";
import { ArrowLeftIcon, SaveIcon } from "@shopify/polaris-icons";
import { FormSections, type TargetingConfig, type ScheduleConfig } from "./FormSections";
import { LivePreviewPanel, type PreviewDevice } from "~/domains/popups/components/preview/LivePreviewPanel";
import { Affix } from "~/shared/components/ui/Affix";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import type { ContentConfig, DesignConfig, DiscountConfig } from "../../types/campaign";
import type { TemplateType } from "~/shared/hooks/useWizardState";
import type { FrequencyCappingConfig } from "~/domains/targeting/components/FrequencyCappingPanel";

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
  globalCustomCSS?: string;
  advancedTargetingEnabled?: boolean;
  initialData?: Partial<CampaignData>;
}

export interface CampaignData {
  name: string;
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
  globalCustomCSS,
  advancedTargetingEnabled,
  initialData,
}: SingleCampaignFlowProps) {
  // Campaign state
  const [campaignName, setCampaignName] = useState(initialData?.name || "");
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
  }, [markComplete]);

  const getCampaignData = useCallback((): CampaignData => ({
    name: campaignName,
    recipe: selectedRecipe,
    templateType: selectedRecipe?.templateType as TemplateType | undefined,
    contentConfig,
    designConfig,
    discountConfig,
    targetingConfig,
    frequencyConfig,
    scheduleConfig,
  }), [campaignName, selectedRecipe, contentConfig, designConfig, discountConfig, targetingConfig, frequencyConfig, scheduleConfig]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(getCampaignData());
    } finally {
      setIsSaving(false);
    }
  }, [onSave, getCampaignData]);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSaveDraft(getCampaignData());
    } finally {
      setIsSaving(false);
    }
  }, [onSaveDraft, getCampaignData]);

  const templateType = selectedRecipe?.templateType as TemplateType | undefined;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--p-color-bg-surface)" }}>
      {/* Sticky Header */}
      <StickyHeader
        campaignName={campaignName}
        onNameChange={setCampaignName}
        onBack={onBack}
        onSaveDraft={handleSaveDraft}
        onPublish={handleSave}
        isSaving={isSaving}
        canPublish={!!selectedRecipe && !!campaignName}
      />

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
              shopDomain={shopDomain}
              advancedTargetingEnabled={advancedTargetingEnabled}
              templateType={templateType}
              campaignGoal={selectedRecipe?.goal}
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
  onNameChange: (name: string) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isSaving: boolean;
  canPublish: boolean;
}

function StickyHeader({
  campaignName,
  onNameChange,
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

