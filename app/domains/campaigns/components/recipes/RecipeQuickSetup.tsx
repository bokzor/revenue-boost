/**
 * RecipeQuickSetup Component
 *
 * Step 2 of the Recipe Flow - quick setup with 1-3 essential inputs.
 * Shows a live preview that updates as the user enters values.
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Text,
  InlineStack,
  BlockStack,
  TextField,
  RangeSlider,
  Button,
  Card,
  Layout,
  Select,
} from "@shopify/polaris";
import { ChevronLeftIcon, ChevronRightIcon } from "@shopify/polaris-icons";
import type { StyledRecipe, QuickInput, RecipeContext } from "../../recipes/styled-recipe-types";
import { LivePreviewPanel } from "~/domains/popups/components/preview/LivePreviewPanel";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";

// =============================================================================
// TYPES
// =============================================================================

export interface RecipeQuickSetupProps {
  /** The selected recipe */
  recipe: StyledRecipe;

  /** Initial context values */
  initialContext?: Partial<RecipeContext>;

  /** Called when user goes back */
  onBack: () => void;

  /** Called when user proceeds with the context */
  onContinue: (context: RecipeContext) => void;

  /** Called when user skips to use defaults */
  onSkip?: () => void;
}

// =============================================================================
// INPUT RENDERERS
// =============================================================================

interface InputRendererProps {
  input: QuickInput;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}

// Helper to safely get default value from input
function getDefaultValue(input: QuickInput): unknown {
  if ("defaultValue" in input) {
    return input.defaultValue;
  }
  return undefined;
}

function DiscountPercentageInput({ input, value, onChange }: InputRendererProps) {
  const defaultVal = getDefaultValue(input);
  const numValue = typeof value === "number" ? value : (typeof defaultVal === "number" ? defaultVal : 10);

  return (
    <BlockStack gap="200">
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        {input.label}
      </Text>
      <RangeSlider
        label=""
        labelHidden
        value={numValue}
        min={5}
        max={75}
        step={5}
        output
        suffix={<Text as="span">{numValue}%</Text>}
        onChange={(val) => onChange(input.key, val)}
      />
    </BlockStack>
  );
}

function DurationHoursInput({ input, value, onChange }: InputRendererProps) {
  const defaultVal = getDefaultValue(input);
  const numValue = typeof value === "number" ? value : (typeof defaultVal === "number" ? defaultVal : 24);

  const options = [
    { label: "6 hours", value: 6 },
    { label: "12 hours", value: 12 },
    { label: "24 hours", value: 24 },
    { label: "48 hours", value: 48 },
    { label: "72 hours", value: 72 },
  ];

  return (
    <BlockStack gap="200">
      <Text as="span" variant="bodyMd" fontWeight="semibold">
        {input.label}
      </Text>
      <InlineStack gap="200">
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant={numValue === opt.value ? "primary" : "secondary"}
            onClick={() => onChange(input.key, opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </InlineStack>
    </BlockStack>
  );
}

function CurrencyAmountInput({ input, value, onChange }: InputRendererProps) {
  const defaultVal = getDefaultValue(input);
  const numValue = typeof value === "number" ? value : (typeof defaultVal === "number" ? defaultVal : 50);

  return (
    <TextField
      label={input.label}
      type="number"
      value={String(numValue)}
      prefix="$"
      min={0}
      onChange={(val) => onChange(input.key, Number(val))}
      autoComplete="off"
    />
  );
}

function TextInputRenderer({ input, value, onChange }: InputRendererProps) {
  const defaultVal = getDefaultValue(input);
  const strValue = typeof value === "string" ? value : (typeof defaultVal === "string" ? defaultVal : "");
  const placeholder = "placeholder" in input ? input.placeholder : undefined;

  return (
    <TextField
      label={input.label}
      value={strValue}
      placeholder={placeholder}
      onChange={(val) => onChange(input.key, val)}
      autoComplete="off"
    />
  );
}

function SelectInputRenderer({ input, value, onChange }: InputRendererProps) {
  const defaultVal = getDefaultValue(input);
  const strValue = typeof value === "string" ? value : (typeof defaultVal === "string" ? defaultVal : "");
  const options = "options" in input ? input.options : [];

  return (
    <Select
      label={input.label}
      options={options}
      value={strValue}
      onChange={(val) => onChange(input.key, val)}
    />
  );
}

function renderQuickInput(
  input: QuickInput,
  value: unknown,
  onChange: (key: string, value: unknown) => void
) {
  const props = { input, value, onChange };

  switch (input.type) {
    case "discount_percentage":
      return <DiscountPercentageInput {...props} />;
    case "duration_hours":
      return <DurationHoursInput {...props} />;
    case "currency_amount":
      return <CurrencyAmountInput {...props} />;
    case "text":
      return <TextInputRenderer {...props} />;
    case "select":
      return <SelectInputRenderer {...props} />;
    default:
      return <TextInputRenderer {...props} />;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RecipeQuickSetup({
  recipe,
  initialContext,
  onBack,
  onContinue,
  onSkip,
}: RecipeQuickSetupProps) {
  // Initialize context with defaults from recipe inputs
  const [context, setContext] = useState<RecipeContext>(() => {
    const initial: RecipeContext = { ...initialContext };

    // Set defaults from recipe inputs
    recipe.inputs.forEach((input) => {
      const defaultVal = "defaultValue" in input ? input.defaultValue : undefined;
      if (initial[input.key] === undefined && defaultVal !== undefined) {
        (initial as Record<string, unknown>)[input.key] = defaultVal;
      }
    });

    return initial;
  });

  // Handle input changes
  const handleInputChange = useCallback((key: string, value: unknown) => {
    setContext((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Build content config with context values applied
  const contentConfig = useMemo(() => {
    // Cast to Record to allow dynamic property access since contentConfig is a union type
    const content = { ...recipe.defaults.contentConfig } as Record<string, unknown>;

    // Apply context values to content
    if (context.discountValue !== undefined) {
      // Update subheadline with discount value
      if (typeof content.subheadline === "string") {
        content.subheadline = content.subheadline.replace(
          /\d+%/,
          `${context.discountValue}%`
        );
      }
    }

    return content;
  }, [recipe, context]);

  // Build design config for preview
  const designConfig = useMemo(() => {
    const theme = (recipe.theme as NewsletterThemeKey) || "modern";
    const themeColors = NEWSLETTER_THEMES[theme] || NEWSLETTER_THEMES.modern;

    // Get background image if recipe has one
    let imageUrl: string | undefined;
    let backgroundImageMode: "none" | "preset" | "file" = "none";
    let backgroundImagePresetKey: string | undefined;

    // First check for direct imageUrl on recipe (for split/hero layouts)
    if (recipe.imageUrl) {
      imageUrl = recipe.imageUrl;
      backgroundImageMode = "file";
    }
    // Then check for background preset (for full background mode)
    else if (recipe.backgroundPresetId) {
      const preset = getBackgroundById(recipe.backgroundPresetId);
      if (preset) {
        imageUrl = getBackgroundUrl(preset);
        backgroundImageMode = "preset";
        backgroundImagePresetKey = preset.id;
      }
    }

    // Determine imagePosition based on layout
    const imagePosition = recipe.defaults.designConfig?.imagePosition ||
      (recipe.layout === "hero" ? "top" :
       recipe.layout === "fullscreen" ? "full" :
       recipe.layout === "split-right" ? "right" : "left");

    return {
      theme,
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
      imagePosition,
      backgroundOverlayOpacity: 0.6,
      ...recipe.defaults.designConfig,
    };
  }, [recipe]);

  const hasInputs = recipe.inputs.length > 0;

  return (
    <BlockStack gap="600">
      {/* Header with back button */}
      <InlineStack align="space-between" blockAlign="center">
        <Button variant="plain" icon={ChevronLeftIcon} onClick={onBack}>
          Back to recipes
        </Button>
      </InlineStack>

      {/* Recipe title and description */}
      <BlockStack gap="200">
        <InlineStack gap="200" blockAlign="center">
          <Text as="span" variant="headingXl">
            {recipe.icon}
          </Text>
          <Text as="h2" variant="headingLg">
            {recipe.name}
          </Text>
        </InlineStack>
        <Text as="p" tone="subdued">
          {recipe.description}
        </Text>
      </BlockStack>

      {/* Two column layout: Inputs + Preview */}
      <Layout>
        {/* Left: Quick inputs */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                {hasInputs ? "Quick Setup" : "Ready to Go"}
              </Text>

              {hasInputs ? (
                <>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Configure the key settings for your campaign
                  </Text>
                  {recipe.inputs.map((input) => (
                    <div key={input.key}>
                      {renderQuickInput(input, context[input.key], handleInputChange)}
                    </div>
                  ))}
                </>
              ) : (
                <Text as="p" variant="bodySm" tone="subdued">
                  This recipe comes pre-configured. You can customize it in the next step.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Right: Live preview - same as full flow */}
        <Layout.Section variant="oneHalf">
          <div style={{ position: "sticky", top: "20px" }}>
            <LivePreviewPanel
              templateType={recipe.templateType}
              config={contentConfig}
              designConfig={designConfig}
            />
          </div>
        </Layout.Section>
      </Layout>

      {/* Action buttons */}
      <InlineStack gap="300" align="end">
        {onSkip && (
          <Button onClick={onSkip} variant="plain">
            Use defaults
          </Button>
        )}
        <Button onClick={() => onContinue(context)} variant="primary" icon={ChevronRightIcon}>
          Continue to customize
        </Button>
      </InlineStack>
    </BlockStack>
  );
}

