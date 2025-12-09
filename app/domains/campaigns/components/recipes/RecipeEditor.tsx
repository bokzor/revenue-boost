/**
 * RecipeEditor Component
 *
 * Step 3 of the Recipe Flow - full editor for customizing the recipe.
 * Shows editable fields grouped by type with live preview.
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

import { useState, useCallback, useMemo } from "react";
import {
  Text,
  InlineStack,
  BlockStack,
  TextField,
  Button,
  Card,
  Select,
  Divider,
  Banner,
  Layout,
} from "@shopify/polaris";
import { ChevronLeftIcon, SaveIcon } from "@shopify/polaris-icons";
import type {
  StyledRecipe,
  EditableField,
  RecipeContext,
  RecipeOutput,
} from "../../recipes/styled-recipe-types";
import {
  getThemeModeForRecipeType,
  getPresetIdForRecipe,
} from "../../recipes/styled-recipe-types";
import { LivePreviewPanel } from "~/domains/popups/components/preview/LivePreviewPanel";
import { ThemePresetSelector } from "../shared/ThemePresetSelector";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";

// =============================================================================
// TYPES
// =============================================================================

export interface RecipeEditorProps {
  /** The selected recipe */
  recipe: StyledRecipe;

  /** Context from quick setup (step 2) */
  context: RecipeContext;

  /** Called when user goes back to quick setup */
  onBack: () => void;

  /** Called when user saves/creates the campaign */
  onSave: (output: RecipeOutput) => void;

  /** Is saving in progress */
  isSaving?: boolean;

  /** Error message to display */
  error?: string;
}

// =============================================================================
// FIELD RENDERERS
// =============================================================================

interface FieldRendererProps {
  field: EditableField;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}

// Helper to safely get default value from field
function getFieldDefaultValue(field: EditableField): unknown {
  if ("defaultValue" in field) {
    return field.defaultValue;
  }
  return undefined;
}

function TextFieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const defaultVal = getFieldDefaultValue(field);
  const strValue = typeof value === "string" ? value : (typeof defaultVal === "string" ? defaultVal : "");

  return (
    <TextField
      label={field.label}
      value={strValue}
      placeholder={field.placeholder}
      helpText={field.helpText}
      maxLength={field.validation?.maxLength}
      onChange={(val) => onChange(field.key, val)}
      autoComplete="off"
      requiredIndicator={field.validation?.required}
    />
  );
}

function TextareaRenderer({ field, value, onChange }: FieldRendererProps) {
  const defaultVal = getFieldDefaultValue(field);
  const strValue = typeof value === "string" ? value : (typeof defaultVal === "string" ? defaultVal : "");

  return (
    <TextField
      label={field.label}
      value={strValue}
      placeholder={field.placeholder}
      helpText={field.helpText}
      maxLength={field.validation?.maxLength}
      onChange={(val) => onChange(field.key, val)}
      autoComplete="off"
      multiline={3}
      requiredIndicator={field.validation?.required}
    />
  );
}

function SelectFieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const defaultVal = getFieldDefaultValue(field);
  const strValue = typeof value === "string" ? value : (typeof defaultVal === "string" ? defaultVal : "");

  // Options are only available on SelectEditableField
  const options = field.type === "select" && "options" in field
    ? field.options.map((opt: { value: string; label: string }) => ({
        label: opt.label,
        value: opt.value,
      }))
    : [];

  return (
    <Select
      label={field.label}
      options={options}
      value={strValue}
      helpText={field.helpText}
      onChange={(val) => onChange(field.key, val)}
    />
  );
}

function ColorFieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const defaultVal = getFieldDefaultValue(field);
  const strValue = typeof value === "string" ? value : (typeof defaultVal === "string" ? defaultVal : "#000000");

  return (
    <InlineStack gap="200" blockAlign="center">
      <input
        type="color"
        value={strValue}
        onChange={(e) => onChange(field.key, e.target.value)}
        style={{ width: 40, height: 40, border: "none", cursor: "pointer" }}
      />
      <TextField
        label={field.label}
        value={strValue}
        onChange={(val) => onChange(field.key, val)}
        autoComplete="off"
        labelHidden
      />
    </InlineStack>
  );
}

function renderEditableField(
  field: EditableField,
  value: unknown,
  onChange: (key: string, value: unknown) => void
) {
  const props = { field, value, onChange };

  switch (field.type) {
    case "text":
      return <TextFieldRenderer {...props} />;
    case "textarea":
      return <TextareaRenderer {...props} />;
    case "select":
      return <SelectFieldRenderer {...props} />;
    case "color":
      return <ColorFieldRenderer {...props} />;
    default:
      return <TextFieldRenderer {...props} />;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RecipeEditor({
  recipe,
  context,
  onBack,
  onSave,
  isSaving = false,
  error,
}: RecipeEditorProps) {
  // Initialize content from recipe defaults and context
  const [content, setContent] = useState<Record<string, unknown>>(() => {
    // Cast to Record to allow dynamic property access since contentConfig is a union type
    const initial = { ...recipe.defaults.contentConfig } as Record<string, unknown>;

    // Apply context overrides
    if (context.headline) initial.headline = context.headline;
    if (context.subheadline) initial.subheadline = context.subheadline;
    if (context.buttonText) initial.buttonText = context.buttonText;

    return initial;
  });

  // Track selected theme (can be changed from recipe default)
  const [selectedTheme, setSelectedTheme] = useState<NewsletterThemeKey>(
    (recipe.theme as NewsletterThemeKey) || "modern"
  );

  // Campaign name
  const [campaignName, setCampaignName] = useState(recipe.name);

  // Handle content field changes
  const handleContentChange = useCallback((key: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Group editable fields by group
  const fieldsByGroup = useMemo(() => {
    const groups: Record<string, EditableField[]> = {
      content: [],
      design: [],
      other: [],
    };

    recipe.editableFields.forEach((field) => {
      const group = field.group || "other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
    });

    return groups;
  }, [recipe.editableFields]);

  // Build design config for preview
  const designConfig = useMemo(() => {
    const themeColors = NEWSLETTER_THEMES[selectedTheme] || NEWSLETTER_THEMES.modern;

    // Get background image if recipe has one
    let imageUrl: string | undefined;
    let backgroundImageMode: "none" | "preset" = "none";
    let backgroundImagePresetKey: string | undefined;

    if (recipe.backgroundPresetId) {
      const preset = getBackgroundById(recipe.backgroundPresetId);
      if (preset) {
        imageUrl = getBackgroundUrl(preset);
        backgroundImageMode = "preset";
        backgroundImagePresetKey = preset.id;
      }
    }

    return {
      theme: selectedTheme,
      layout: recipe.layout,
      position: recipe.defaults.designConfig?.position || "center",
      size: recipe.defaults.designConfig?.size || "medium",
      // Colors from theme
      backgroundColor: themeColors.background,
      textColor: themeColors.text,
      primaryColor: themeColors.primary,
      accentColor: themeColors.primary,
      buttonColor: themeColors.ctaBg || themeColors.primary,
      buttonTextColor: themeColors.ctaText || "#FFFFFF",
      // Background image settings (matching full flow format)
      backgroundImageMode,
      backgroundImagePresetKey,
      imageUrl,
      imagePosition: "full" as const,
      backgroundOverlayOpacity: 0.6,
      ...recipe.defaults.designConfig,
    };
  }, [selectedTheme, recipe]);

  // Handle save
  const handleSave = useCallback(() => {
    // Determine theme mode based on recipe type
    const themeMode = getThemeModeForRecipeType(recipe.recipeType);
    const presetId = themeMode === "preset" ? getPresetIdForRecipe(recipe.id) : undefined;

    const output: RecipeOutput = {
      name: campaignName,
      contentConfig: content,
      designConfig: {
        theme: selectedTheme,
        layout: recipe.layout,
        position: recipe.defaults.designConfig?.position || "center",
        size: recipe.defaults.designConfig?.size || "medium",
        ...recipe.defaults.designConfig,
        // Include themeMode in designConfig so preview and storefront use correct theme
        themeMode,
        presetId,
      },
      discountConfig: recipe.defaults.discountConfig,
      targetRules: recipe.defaults.targetRules,
      themeMode,
      presetId,
    };

    // Apply context values to discount
    if (context.discountValue && output.discountConfig) {
      output.discountConfig = {
        ...output.discountConfig,
        value: context.discountValue,
      };
    }

    onSave(output);
  }, [campaignName, content, selectedTheme, recipe, context, onSave]);

  return (
    <BlockStack gap="600">
      {/* Header with back button */}
      <InlineStack align="space-between" blockAlign="center">
        <Button variant="plain" icon={ChevronLeftIcon} onClick={onBack}>
          Back to quick setup
        </Button>
        <Button variant="primary" icon={SaveIcon} onClick={handleSave} loading={isSaving}>
          Create Campaign
        </Button>
      </InlineStack>

      {/* Error banner */}
      {error && (
        <Banner tone="critical" title="Error creating campaign">
          <p>{error}</p>
        </Banner>
      )}

      {/* Campaign name */}
      <TextField
        label="Campaign Name"
        value={campaignName}
        onChange={setCampaignName}
        autoComplete="off"
        helpText="This is only visible to you in the admin"
      />

      {/* Two column layout: Editor + Preview */}
      <Layout>
        {/* Left: Editor fields */}
        <Layout.Section>
          <BlockStack gap="400">
            {/* Content fields */}
            {fieldsByGroup.content.length > 0 && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Content
                  </Text>
                  {fieldsByGroup.content.map((field) => (
                    <div key={field.key}>
                      {renderEditableField(field, content[field.key], handleContentChange)}
                    </div>
                  ))}
                </BlockStack>
              </Card>
            )}

            {/* Theme selector */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Theme
                </Text>
                <ThemePresetSelector
                  selected={selectedTheme}
                  onSelect={setSelectedTheme}
                  maxWidth="100%"
                />
              </BlockStack>
            </Card>

            {/* Design fields (if any) */}
            {fieldsByGroup.design.length > 0 && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h3" variant="headingMd">
                    Design
                  </Text>
                  {fieldsByGroup.design.map((field) => (
                    <div key={field.key}>
                      {renderEditableField(field, content[field.key], handleContentChange)}
                    </div>
                  ))}
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>

        {/* Right: Live preview - same as full flow */}
        <Layout.Section variant="oneHalf">
          <div style={{ position: "sticky", top: "20px" }}>
            <LivePreviewPanel
              templateType={recipe.templateType}
              config={content}
              designConfig={designConfig}
            />
          </div>
        </Layout.Section>
      </Layout>

      {/* Bottom save button */}
      <Divider />
      <InlineStack align="end">
        <Button variant="primary" icon={SaveIcon} onClick={handleSave} loading={isSaving}>
          Create Campaign
        </Button>
      </InlineStack>
    </BlockStack>
  );
}
