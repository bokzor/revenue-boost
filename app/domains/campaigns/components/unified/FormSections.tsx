/**
 * FormSections Component
 *
 * Renders the collapsible form sections for the unified campaign creator.
 * Each section contains the appropriate step content component.
 *
 * Uses the same step components as the wizard form for feature parity:
 * - DesignContentStep: Template-specific content + universal design + Custom CSS
 * - TargetingStepContent: Triggers + Audience + Geo targeting
 * - FrequencyStepContent: Frequency capping with global settings
 * - ScheduleStepContent: Status, priority, dates, tags
 */

import { useState, useMemo } from "react";
import { BlockStack, Text, InlineGrid, Box, Button, Card, InlineStack, TextField } from "@shopify/polaris";
import { useNavigate } from "react-router";
import { CollapsibleSection } from "./CollapsibleSection";
import { RecipeCard } from "../recipes/RecipeCard";
import { PreviewProvider } from "../recipes/PreviewContext";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import type { ContentConfig, DesignConfig, AudienceTargetingConfig, GeoTargetingConfig, CampaignGoal } from "../../types/campaign";
import type { TemplateType } from "~/shared/hooks/useWizardState";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import type { FrequencyCappingConfig } from "~/domains/targeting/components";
import type { BackgroundPreset } from "~/config/background-presets";
import type { GlobalFrequencyCappingSettings } from "~/domains/store/types/settings";

// Import reusable step content components (same as wizard form)
import { DesignContentStep, type ThemePreset } from "../steps/DesignContentStep";
import { TargetingStepContent } from "../steps/TargetingStepContent";
import { FrequencyStepContent } from "../steps/FrequencyStepContent";
import { ScheduleStepContent } from "../steps/ScheduleStepContent";
import { DiscountSection as DiscountConfigPanel } from "~/domains/popups/components/design/DiscountSection";
import type { DiscountConfig } from "../../types/campaign";

type SectionId = "recipe" | "basics" | "design" | "discount" | "targeting" | "frequency" | "schedule";

interface SectionDef {
  id: SectionId;
  icon: string;
  title: string;
  subtitle: string;
}

// Targeting configuration structure
export interface TargetingConfig {
  enhancedTriggers: EnhancedTriggerConfig;
  audienceTargeting: AudienceTargetingConfig;
  geoTargeting: GeoTargetingConfig;
}

// Schedule configuration structure
export interface ScheduleConfig {
  status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  priority?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export interface FormSectionsProps {
  sections: SectionDef[];
  expandedSections: SectionId[];
  completedSections: SectionId[];
  onToggle: (id: SectionId) => void;
  recipes: StyledRecipe[];
  selectedRecipe?: StyledRecipe;
  onRecipeSelect: (recipe: StyledRecipe) => void;
  // Campaign basics (name & description)
  campaignName?: string;
  campaignDescription?: string;
  onNameChange?: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
  // Content & Design
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
  onMarkComplete: (id: SectionId, nextSection?: SectionId) => void;
  storeId: string;
  shopDomain?: string;
  advancedTargetingEnabled?: boolean;
  templateType?: TemplateType;
  /** Campaign goal for discount recommendations */
  campaignGoal?: string;
  /** For A/B experiments: restrict recipe selection to this goal */
  restrictRecipesToGoal?: CampaignGoal;
  /** Label for the variant being configured (e.g., "Variant B") */
  variantLabel?: string;
  /** Current URL path to return to after recipe selection */
  returnToPath?: string;
  // === New props for feature parity ===
  /** Custom theme presets from store settings */
  customThemePresets?: ThemePreset[];
  /** Map of layout -> background presets */
  backgroundsByLayout?: Record<string, BackgroundPreset[]>;
  /** Global custom CSS from store settings */
  globalCustomCSS?: string;
  /** Global frequency capping settings from store */
  globalFrequencyCapping?: GlobalFrequencyCappingSettings;
  /** Callback when mobile layout is changed (to switch preview device) */
  onMobileLayoutChange?: () => void;
}

export function FormSections({
  sections,
  expandedSections,
  completedSections,
  onToggle,
  recipes,
  selectedRecipe,
  onRecipeSelect,
  // Campaign basics
  campaignName,
  campaignDescription,
  onNameChange,
  onDescriptionChange,
  // Content & Design
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
  onMarkComplete,
  storeId,
  advancedTargetingEnabled,
  templateType,
  campaignGoal,
  restrictRecipesToGoal,
  variantLabel,
  returnToPath,
  // New props for feature parity
  customThemePresets,
  backgroundsByLayout,
  globalCustomCSS,
  globalFrequencyCapping,
  onMobileLayoutChange,
}: FormSectionsProps) {
  return (
    <BlockStack gap="400">
      {sections.map((section, index) => (
        <CollapsibleSection
          key={section.id}
          id={section.id}
          icon={section.icon}
          title={section.title}
          subtitle={section.subtitle}
          stepNumber={index + 1}
          isExpanded={expandedSections.includes(section.id)}
          isCompleted={completedSections.includes(section.id)}
          onToggle={() => onToggle(section.id)}
        >
          {section.id === "recipe" && (
            <RecipeSection
              recipes={recipes}
              selectedRecipe={selectedRecipe}
              onSelect={onRecipeSelect}
              restrictToGoal={restrictRecipesToGoal}
              variantLabel={variantLabel}
              returnToPath={returnToPath}
            />
          )}
          {section.id === "basics" && onNameChange && (
            <BasicsSectionWrapper
              campaignName={campaignName || ""}
              campaignDescription={campaignDescription || ""}
              onNameChange={onNameChange}
              onDescriptionChange={onDescriptionChange}
              onComplete={() => onMarkComplete("basics", "design")}
            />
          )}
          {section.id === "design" && templateType && (
            <DesignSectionWrapper
              templateType={templateType}
              contentConfig={contentConfig}
              designConfig={designConfig}
              discountConfig={discountConfig}
              onContentChange={onContentChange}
              onDesignChange={onDesignChange}
              onDiscountChange={onDiscountChange}
              onComplete={() => onMarkComplete("design", "discount")}
              customThemePresets={customThemePresets}
              backgroundsByLayout={backgroundsByLayout}
              globalCustomCSS={globalCustomCSS}
              onMobileLayoutChange={onMobileLayoutChange}
            />
          )}
          {section.id === "discount" && onDiscountChange && (
            <DiscountSectionWrapper
              discountConfig={discountConfig}
              onChange={onDiscountChange}
              onComplete={() => onMarkComplete("discount", "targeting")}
              goal={campaignGoal}
              hasEmailCapture={Boolean((contentConfig as Record<string, unknown>)?.emailRequired)}
            />
          )}
          {section.id === "targeting" && (
            <TargetingSectionWrapper
              storeId={storeId}
              targetingConfig={targetingConfig}
              onChange={onTargetingChange}
              onComplete={() => onMarkComplete("targeting", "frequency")}
              advancedTargetingEnabled={advancedTargetingEnabled}
            />
          )}
          {section.id === "frequency" && (
            <FrequencySectionWrapper
              frequencyConfig={frequencyConfig}
              templateType={templateType}
              globalSettings={globalFrequencyCapping}
              onChange={onFrequencyChange}
              onComplete={() => onMarkComplete("frequency", "schedule")}
            />
          )}
          {section.id === "schedule" && (
            <ScheduleSectionWrapper
              scheduleConfig={scheduleConfig}
              onChange={onScheduleChange}
              onComplete={() => onMarkComplete("schedule")}
            />
          )}
        </CollapsibleSection>
      ))}
    </BlockStack>
  );
}

// =============================================================================
// SECTION CONTENT COMPONENTS
// =============================================================================

interface RecipeSectionProps {
  recipes: StyledRecipe[];
  selectedRecipe?: StyledRecipe;
  onSelect: (recipe: StyledRecipe) => void;
  /** For A/B experiments: only show recipes matching this goal */
  restrictToGoal?: CampaignGoal;
  /** Label for the variant being configured (e.g., "Variant B") */
  variantLabel?: string;
  /** Current URL path to return to after recipe selection */
  returnToPath?: string;
}

// Goal filter options for the recipe section
const GOAL_FILTER_OPTIONS: { value: CampaignGoal | "ALL"; label: string; icon: string }[] = [
  { value: "ALL", label: "All Recipes", icon: "📦" },
  { value: "NEWSLETTER_SIGNUP", label: "Email & Leads", icon: "📧" },
  { value: "INCREASE_REVENUE", label: "Sales & Revenue", icon: "💰" },
  { value: "ENGAGEMENT", label: "Engagement", icon: "❤️" },
];

function RecipeSection({
  recipes,
  selectedRecipe,
  onSelect,
  restrictToGoal,
  variantLabel,
  returnToPath,
}: RecipeSectionProps) {
  const navigate = useNavigate();
  const [goalFilter, setGoalFilter] = useState<CampaignGoal | "ALL">(restrictToGoal || "ALL");

  // Filter recipes by goal
  const filteredRecipes = useMemo(() => {
    // If restricted to a goal (A/B testing), always use that
    if (restrictToGoal) {
      return recipes.filter((r) => r.goal === restrictToGoal);
    }
    // Otherwise use the user-selected filter
    if (goalFilter === "ALL") {
      return recipes;
    }
    return recipes.filter((r) => r.goal === goalFilter);
  }, [recipes, restrictToGoal, goalFilter]);

  // Show first 6 recipes in a grid
  const displayRecipes = filteredRecipes.slice(0, 6);

  // Build URL for full-screen recipe picker
  const buildRecipePickerUrl = () => {
    const params = new URLSearchParams();
    if (returnToPath) {
      params.set("returnTo", returnToPath);
    }
    if (restrictToGoal) {
      params.set("restrictToGoal", restrictToGoal);
    } else if (goalFilter !== "ALL") {
      params.set("restrictToGoal", goalFilter);
    }
    if (variantLabel) {
      params.set("variantLabel", variantLabel);
    }
    const queryString = params.toString();
    return `/app/campaigns/recipe${queryString ? `?${queryString}` : ""}`;
  };

  const handleBrowseAll = () => {
    navigate(buildRecipePickerUrl());
  };

  return (
    <BlockStack gap="400">
      {/* Goal restriction info (for A/B testing) */}
      {restrictToGoal && (
        <Box padding="300" background="bg-surface-info" borderRadius="200">
          <InlineStack gap="200" blockAlign="center">
            <Text as="span">ℹ️</Text>
            <Text as="span" variant="bodySm">
              {variantLabel
                ? `Showing ${filteredRecipes.length} recipes matching the Control variant's goal for A/B consistency.`
                : `Showing ${filteredRecipes.length} recipes with the same goal.`}
            </Text>
          </InlineStack>
        </Box>
      )}

      {/* Goal filter tabs (only when not restricted) */}
      {!restrictToGoal && (
        <InlineStack gap="200" wrap={false}>
          {GOAL_FILTER_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={goalFilter === option.value ? "primary" : "secondary"}
              onClick={() => setGoalFilter(option.value)}
              size="slim"
            >
              {`${option.icon} ${option.label}`}
            </Button>
          ))}
        </InlineStack>
      )}

      <PreviewProvider>
        <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
          {displayRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isSelected={selectedRecipe?.id === recipe.id}
              onSelect={() => onSelect(recipe)}
              showPreview
              size="small"
            />
          ))}
        </InlineGrid>
      </PreviewProvider>

      {/* Browse all button */}
      <InlineStack align="center">
        <Button onClick={handleBrowseAll}>
          {`Browse all ${filteredRecipes.length} recipes`}
        </Button>
      </InlineStack>
    </BlockStack>
  );
}

// =============================================================================
// BASICS SECTION WRAPPER - Campaign name and description
// =============================================================================

interface BasicsSectionWrapperProps {
  campaignName: string;
  campaignDescription: string;
  onNameChange: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
  onComplete: () => void;
}

function BasicsSectionWrapper({
  campaignName,
  campaignDescription,
  onNameChange,
  onDescriptionChange,
  onComplete,
}: BasicsSectionWrapperProps) {
  const isValid = campaignName.trim().length > 0;

  return (
    <BlockStack gap="400">
      <TextField
        label="Campaign Name"
        value={campaignName}
        onChange={onNameChange}
        placeholder="e.g., Summer Sale Newsletter Popup"
        autoComplete="off"
        requiredIndicator
        error={campaignName.trim().length === 0 ? "Campaign name is required" : undefined}
        helpText="Give your campaign a descriptive name to identify it later"
      />

      <TextField
        label="Description (optional)"
        value={campaignDescription}
        onChange={onDescriptionChange || (() => {})}
        placeholder="e.g., 10% off popup for summer collection launch"
        autoComplete="off"
        multiline={2}
        helpText="Add notes or context about this campaign"
      />

      <InlineStack align="end">
        <Button variant="primary" onClick={onComplete} disabled={!isValid}>
          Continue to Design
        </Button>
      </InlineStack>
    </BlockStack>
  );
}

// =============================================================================
// DESIGN SECTION WRAPPER - Uses DesignContentStep for full feature parity
// =============================================================================

interface DesignSectionWrapperProps {
  templateType: TemplateType;
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  discountConfig?: DiscountConfig;
  onContentChange: (config: Partial<ContentConfig>) => void;
  onDesignChange: (config: Partial<DesignConfig>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
  onComplete: () => void;
  customThemePresets?: ThemePreset[];
  backgroundsByLayout?: Record<string, BackgroundPreset[]>;
  globalCustomCSS?: string;
  onMobileLayoutChange?: () => void;
}

function DesignSectionWrapper({
  templateType,
  contentConfig,
  designConfig,
  discountConfig,
  onContentChange,
  onDesignChange,
  onDiscountChange,
  onComplete,
  customThemePresets,
  backgroundsByLayout,
  globalCustomCSS,
  onMobileLayoutChange,
}: DesignSectionWrapperProps) {
  return (
    <BlockStack gap="400">
      <DesignContentStep
        templateType={templateType}
        contentConfig={contentConfig}
        designConfig={designConfig}
        discountConfig={discountConfig}
        onContentChange={onContentChange}
        onDesignChange={onDesignChange}
        onDiscountChange={onDiscountChange}
        customThemePresets={customThemePresets}
        backgroundsByLayout={backgroundsByLayout}
        globalCustomCSS={globalCustomCSS}
        onMobileLayoutChange={onMobileLayoutChange}
      />
      <Button variant="primary" onClick={onComplete}>
        Save & Continue
      </Button>
    </BlockStack>
  );
}

// =============================================================================
// TARGETING SECTION WRAPPER - Uses TargetingStepContent for full feature parity
// =============================================================================

interface TargetingSectionWrapperProps {
  storeId: string;
  targetingConfig: TargetingConfig;
  onChange: (config: TargetingConfig) => void;
  onComplete: () => void;
  advancedTargetingEnabled?: boolean;
}

function TargetingSectionWrapper({
  storeId,
  targetingConfig,
  onChange,
  onComplete,
  advancedTargetingEnabled,
}: TargetingSectionWrapperProps) {
  return (
    <BlockStack gap="400">
      <TargetingStepContent
        storeId={storeId}
        enhancedTriggers={targetingConfig.enhancedTriggers || {}}
        audienceTargeting={targetingConfig.audienceTargeting || { enabled: false, shopifySegmentIds: [] }}
        geoTargeting={targetingConfig.geoTargeting || { enabled: false, mode: "include", countries: [] }}
        onTriggersChange={(triggers) => onChange({ ...targetingConfig, enhancedTriggers: triggers })}
        onAudienceChange={(audience) => onChange({ ...targetingConfig, audienceTargeting: audience })}
        onGeoChange={(geo) => onChange({ ...targetingConfig, geoTargeting: geo })}
        advancedTargetingEnabled={advancedTargetingEnabled}
      />
      <Button variant="primary" onClick={onComplete}>
        Save & Continue
      </Button>
    </BlockStack>
  );
}

// =============================================================================
// FREQUENCY SECTION WRAPPER - Uses FrequencyStepContent with global settings
// =============================================================================

interface FrequencySectionWrapperProps {
  frequencyConfig: FrequencyCappingConfig;
  templateType?: TemplateType;
  globalSettings?: GlobalFrequencyCappingSettings;
  onChange: (config: FrequencyCappingConfig) => void;
  onComplete: () => void;
}

function FrequencySectionWrapper({
  frequencyConfig,
  templateType,
  globalSettings,
  onChange,
  onComplete,
}: FrequencySectionWrapperProps) {
  return (
    <BlockStack gap="400">
      <FrequencyStepContent
        config={frequencyConfig}
        onConfigChange={onChange}
        templateType={templateType}
        globalSettings={globalSettings}
      />
      <Button variant="primary" onClick={onComplete}>
        Save & Continue
      </Button>
    </BlockStack>
  );
}

// =============================================================================
// SCHEDULE SECTION WRAPPER - Uses ScheduleStepContent
// =============================================================================

interface ScheduleSectionWrapperProps {
  scheduleConfig: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
  onComplete: () => void;
}

function ScheduleSectionWrapper({
  scheduleConfig,
  onChange,
  onComplete,
}: ScheduleSectionWrapperProps) {
  return (
    <BlockStack gap="400">
      <ScheduleStepContent
        status={scheduleConfig.status || "DRAFT"}
        priority={scheduleConfig.priority || 50}
        startDate={scheduleConfig.startDate}
        endDate={scheduleConfig.endDate}
        tags={scheduleConfig.tags || []}
        onConfigChange={onChange}
      />
      <Button variant="primary" onClick={onComplete}>
        Done
      </Button>
    </BlockStack>
  );
}

// =============================================================================
// DISCOUNT SECTION
// =============================================================================

interface DiscountSectionWrapperProps {
  discountConfig?: DiscountConfig;
  onChange: (config: DiscountConfig) => void;
  onComplete: () => void;
  goal?: string;
  hasEmailCapture?: boolean;
}

function DiscountSectionWrapper({
  discountConfig,
  onChange,
  onComplete,
  goal,
  hasEmailCapture,
}: DiscountSectionWrapperProps) {
  // Default discount config
  const config: DiscountConfig = discountConfig || {
    enabled: false,
    showInPreview: true,
    type: "shared",
    valueType: "PERCENTAGE",
    value: 10,
    expiryDays: 30,
    prefix: "WELCOME",
    behavior: "SHOW_CODE_AND_AUTO_APPLY",
  };

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Discount Incentive
          </Text>
          <Text as="p" tone="subdued">
            Offer a discount to encourage conversions. Configure how customers receive and use their codes.
          </Text>
          <DiscountConfigPanel
            goal={goal}
            discountConfig={config}
            onConfigChange={onChange}
            hasEmailCapture={hasEmailCapture}
          />
        </BlockStack>
      </Card>
      <Button variant="primary" onClick={onComplete}>
        Save & Continue
      </Button>
    </BlockStack>
  );
}
