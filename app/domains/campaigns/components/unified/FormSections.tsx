/**
 * FormSections Component
 *
 * Renders the collapsible form sections for the unified campaign creator.
 * Each section contains the appropriate step content component.
 */

import { BlockStack, Text, InlineGrid, Box, Button, Card, InlineStack } from "@shopify/polaris";
import { useNavigate } from "react-router";
import { CollapsibleSection } from "./CollapsibleSection";
import { RecipeCard } from "../recipes/RecipeCard";
import { PreviewProvider } from "../recipes/PreviewContext";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import type { ContentConfig, DesignConfig, AudienceTargetingConfig, GeoTargetingConfig, CampaignGoal } from "../../types/campaign";
import type { TemplateType } from "~/shared/hooks/useWizardState";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import type { FrequencyCappingConfig } from "~/domains/targeting/components";

// Import step content components
import { DesignConfigSection } from "../sections/DesignConfigSection";
import { ContentConfigSection } from "../sections/ContentConfigSection";
import { AdvancedTriggersEditor } from "~/domains/targeting/components/AdvancedTriggersEditor";
import { AudienceTargetingPanel } from "~/domains/targeting/components/AudienceTargetingPanel";
import { GeoTargetingPanel } from "~/domains/targeting/components/GeoTargetingPanel";
import { FrequencyCappingPanel } from "~/domains/targeting/components/FrequencyCappingPanel";
import { ScheduleSettingsStep } from "../ScheduleSettingsStep";
import { DiscountSection as DiscountConfigPanel } from "~/domains/popups/components/design/DiscountSection";
import type { DiscountConfig } from "../../types/campaign";

type SectionId = "recipe" | "design" | "discount" | "targeting" | "frequency" | "schedule";

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
}

export function FormSections({
  sections,
  expandedSections,
  completedSections,
  onToggle,
  recipes,
  selectedRecipe,
  onRecipeSelect,
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
  shopDomain,
  advancedTargetingEnabled,
  templateType,
  campaignGoal,
  restrictRecipesToGoal,
  variantLabel,
  returnToPath,
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
          {section.id === "design" && templateType && (
            <DesignSection
              templateType={templateType}
              contentConfig={contentConfig}
              designConfig={designConfig}
              onContentChange={onContentChange}
              onDesignChange={onDesignChange}
              onComplete={() => onMarkComplete("design", "discount")}
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
            <TargetingSection
              storeId={storeId}
              targetingConfig={targetingConfig}
              onChange={onTargetingChange}
              onComplete={() => onMarkComplete("targeting", "frequency")}
              advancedTargetingEnabled={advancedTargetingEnabled}
            />
          )}
          {section.id === "frequency" && (
            <FrequencySection
              frequencyConfig={frequencyConfig}
              onChange={onFrequencyChange}
              onComplete={() => onMarkComplete("frequency", "schedule")}
            />
          )}
          {section.id === "schedule" && (
            <ScheduleSection
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

function RecipeSection({
  recipes,
  selectedRecipe,
  onSelect,
  restrictToGoal,
  variantLabel,
  returnToPath,
}: RecipeSectionProps) {
  const navigate = useNavigate();

  // Filter recipes by goal if restricted
  const availableRecipes = restrictToGoal
    ? recipes.filter((r) => r.goal === restrictToGoal)
    : recipes;

  // Show first 6 recipes in a grid
  const displayRecipes = availableRecipes.slice(0, 6);

  // Build URL for full-screen recipe picker
  const buildRecipePickerUrl = () => {
    const params = new URLSearchParams();
    if (returnToPath) {
      params.set("returnTo", returnToPath);
    }
    if (restrictToGoal) {
      params.set("restrictToGoal", restrictToGoal);
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
      {/* Goal restriction info */}
      {restrictToGoal && (
        <Box padding="300" background="bg-surface-info" borderRadius="200">
          <InlineStack gap="200" blockAlign="center">
            <Text as="span">ℹ️</Text>
            <Text as="span" variant="bodySm">
              {variantLabel
                ? `Showing ${availableRecipes.length} recipes matching the Control variant's goal for A/B consistency.`
                : `Showing ${availableRecipes.length} recipes with the same goal.`}
            </Text>
          </InlineStack>
        </Box>
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
          {`Browse all ${availableRecipes.length} recipes`}
        </Button>
      </InlineStack>
    </BlockStack>
  );
}

interface DesignSectionProps {
  templateType: TemplateType;
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  onContentChange: (config: Partial<ContentConfig>) => void;
  onDesignChange: (config: Partial<DesignConfig>) => void;
  onComplete: () => void;
}

function DesignSection({
  templateType,
  contentConfig,
  designConfig,
  onContentChange,
  onDesignChange,
  onComplete,
}: DesignSectionProps) {
  return (
    <BlockStack gap="400">
      {/* Content Configuration */}
      <ContentConfigSection
        templateType={templateType}
        content={contentConfig}
        onChange={onContentChange}
      />

      {/* Design Configuration */}
      <DesignConfigSection
        design={designConfig}
        onChange={onDesignChange}
        templateType={templateType}
      />

      <Button variant="primary" onClick={onComplete}>
        Save & Continue
      </Button>
    </BlockStack>
  );
}

interface TargetingSectionProps {
  storeId: string;
  targetingConfig: TargetingConfig;
  onChange: (config: TargetingConfig) => void;
  onComplete: () => void;
  advancedTargetingEnabled?: boolean;
}

function TargetingSection({
  storeId,
  targetingConfig,
  onChange,
  onComplete,
  advancedTargetingEnabled,
}: TargetingSectionProps) {
  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            When to Show (Triggers)
          </Text>
          <AdvancedTriggersEditor
            config={targetingConfig.enhancedTriggers || {}}
            onChange={(triggers) => onChange({ ...targetingConfig, enhancedTriggers: triggers })}
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Who to Show To (Audience)
          </Text>
          <AudienceTargetingPanel
            storeId={storeId}
            config={targetingConfig.audienceTargeting || {}}
            onConfigChange={(audience) => onChange({ ...targetingConfig, audienceTargeting: audience })}
            disabled={!advancedTargetingEnabled}
          />
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Where to Show (Geographic)
          </Text>
          <GeoTargetingPanel
            config={targetingConfig.geoTargeting || {}}
            onConfigChange={(geo) => onChange({ ...targetingConfig, geoTargeting: geo })}
          />
        </BlockStack>
      </Card>

      <Button variant="primary" onClick={onComplete}>
        Save & Continue
      </Button>
    </BlockStack>
  );
}

interface FrequencySectionProps {
  frequencyConfig: FrequencyCappingConfig;
  onChange: (config: FrequencyCappingConfig) => void;
  onComplete: () => void;
}

function FrequencySection({
  frequencyConfig,
  onChange,
  onComplete,
}: FrequencySectionProps) {
  return (
    <BlockStack gap="400">
      <FrequencyCappingPanel
        config={frequencyConfig}
        onConfigChange={onChange}
      />
      <Button variant="primary" onClick={onComplete}>
        Save & Continue
      </Button>
    </BlockStack>
  );
}

interface ScheduleSectionProps {
  scheduleConfig: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
  onComplete: () => void;
}

function ScheduleSection({
  scheduleConfig,
  onChange,
  onComplete,
}: ScheduleSectionProps) {
  return (
    <BlockStack gap="400">
      <ScheduleSettingsStep
        config={scheduleConfig}
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
