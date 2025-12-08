/**
 * RecipeSelectionStep Component
 *
 * A reusable recipe selection flow with:
 * - GoalFilter at the top
 * - RecipePicker grid below
 * - Configuration modal for quick inputs
 *
 * Used in:
 * - SingleCampaignFlow (when creating a new campaign)
 * - VariantCampaignEditor (when configuring A/B test variants)
 */

import React, { useState, useCallback, useMemo } from "react";
import { Modal, BlockStack, Text, Card, TextField, RangeSlider, Select, Divider, Banner } from "@shopify/polaris";

import { GoalFilter } from "../goals/GoalFilter";
import { RecipePicker } from "../recipes/RecipePicker";
import { GenericDiscountComponent } from "../form/GenericDiscountComponent";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";
import {
  getThemeModeForRecipeType,
  getPresetIdForRecipe,
  type StyledRecipe,
  type RecipeContext,
  type QuickInput,
} from "../../recipes/styled-recipe-types";
import type { CampaignGoal, DiscountConfig } from "../../types/campaign";
import type { DesignTokens } from "../../types/design-tokens";

export interface RecipeSelectionResult {
  recipe: StyledRecipe;
  initialData: {
    name: string;
    goal: string;
    templateType: string;
    contentConfig: Record<string, unknown>;
    designConfig: Record<string, unknown>;
    targetRules: Record<string, unknown>;
    discountConfig: DiscountConfig | Record<string, unknown>;
  };
}

export interface RecipeSelectionStepProps {
  /** Available recipes to choose from */
  recipes: StyledRecipe[];
  /** Called when user selects a recipe and completes configuration */
  onRecipeSelected: (result: RecipeSelectionResult) => void;
  /** Called when user wants to build from scratch (optional) */
  onBuildFromScratch?: () => void;
  /** Store ID for product picker */
  storeId: string;
  /** Default theme tokens for preview */
  defaultThemeTokens?: DesignTokens;
  /** For A/B experiments: restrict recipes to control variant's goal */
  restrictToGoal?: CampaignGoal;
  /** Banner message for A/B experiment mode */
  variantLabel?: string;
}

export function RecipeSelectionStep({
  recipes,
  onRecipeSelected,
  onBuildFromScratch,
  storeId,
  defaultThemeTokens,
  restrictToGoal,
  variantLabel,
}: RecipeSelectionStepProps) {
  // Goal filter state (null = show all)
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | null>(null);

  // Modal state
  const [selectedRecipe, setSelectedRecipe] = useState<StyledRecipe | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [contextData, setContextData] = useState<RecipeContext>({});
  const [discountConfig, setDiscountConfig] = useState<DiscountConfig | null>(null);

  // Calculate recipe counts per goal
  const recipeCounts = useMemo(() => {
    const counts: Record<CampaignGoal, number> = {
      NEWSLETTER_SIGNUP: 0,
      INCREASE_REVENUE: 0,
      ENGAGEMENT: 0,
    };
    recipes.forEach((r) => {
      if (counts[r.goal as CampaignGoal] !== undefined) {
        counts[r.goal as CampaignGoal]++;
      }
    });
    return counts;
  }, [recipes]);

  // Effective goal filter: restrictToGoal takes precedence
  const effectiveGoal = restrictToGoal || selectedGoal;

  // Filter recipes by goal
  const filteredRecipes = useMemo(() => {
    if (!effectiveGoal) return recipes;
    return recipes.filter((r) => r.goal === effectiveGoal);
  }, [recipes, effectiveGoal]);

  // Recipe selected - open configuration modal
  const handleRecipeSelect = useCallback((recipe: StyledRecipe) => {
    setSelectedRecipe(recipe);
    // Initialize default values for inputs
    const defaults: RecipeContext = {};
    recipe.inputs.forEach((input) => {
      if ("defaultValue" in input && input.defaultValue !== undefined) {
        defaults[input.key] = input.defaultValue;
      }
    });
    setContextData(defaults);
    // Initialize discount config from recipe defaults
    if (recipe.requiredConfig?.includes("discount") && recipe.defaults.discountConfig) {
      setDiscountConfig(recipe.defaults.discountConfig as DiscountConfig);
    } else {
      setDiscountConfig(null);
    }
    setModalOpen(true);
  }, []);

  // Close modal
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedRecipe(null);
    setContextData({});
    setDiscountConfig(null);
  }, []);

  // Input change handler
  const handleInputChange = useCallback((key: string, value: unknown) => {
    setContextData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Build initial data from recipe + context (extracted to separate function for clarity)
  const buildInitialData = useCallback(() => {
    if (!selectedRecipe) return null;
    return buildRecipeInitialData(selectedRecipe, contextData, discountConfig);
  }, [selectedRecipe, contextData, discountConfig]);

  // Create campaign with selected recipe
  const handleCreateCampaign = useCallback(() => {
    const initialData = buildInitialData();
    if (!selectedRecipe || !initialData) return;

    onRecipeSelected({
      recipe: selectedRecipe,
      initialData,
    });
    handleModalClose();
  }, [buildInitialData, selectedRecipe, onRecipeSelected, handleModalClose]);

  // Check if recipe has required configuration
  const hasRequiredConfig = selectedRecipe?.requiredConfig?.length ?? 0 > 0;
  const hasQuickInputs = selectedRecipe?.inputs?.length ?? 0 > 0;
  const needsModal = hasRequiredConfig || hasQuickInputs;

  return (
    <>
      <BlockStack gap="600">
        {/* A/B Experiment mode banner */}
        {restrictToGoal && (
          <Banner tone="info">
            <Text as="p">
              {variantLabel ? `Configuring ${variantLabel}. ` : ""}
              Only showing recipes that match the Control variant's goal for A/B test consistency.
            </Text>
          </Banner>
        )}

        {/* Goal Filter - only show when not restricted */}
        {!restrictToGoal && (
          <Card>
            <GoalFilter
              value={selectedGoal}
              onChange={setSelectedGoal}
              recipeCounts={recipeCounts}
              totalRecipes={recipes.length}
            />
          </Card>
        )}

        {/* Recipe Picker */}
        <RecipePicker
          recipes={filteredRecipes}
          selectedRecipeId={selectedRecipe?.id}
          onSelect={handleRecipeSelect}
          onBuildFromScratch={onBuildFromScratch}
          showPreviews={true}
          hoverPreviewEnabled={false}
          defaultThemeTokens={defaultThemeTokens}
          selectedGoal={effectiveGoal}
        />
      </BlockStack>

      {/* Recipe Configuration Modal */}
      {selectedRecipe && (
        <Modal
          open={modalOpen}
          onClose={handleModalClose}
          title={`Configure: ${selectedRecipe.name}`}
          primaryAction={{
            content: needsModal ? "Continue to Editor" : "Use This Recipe",
            onAction: handleCreateCampaign,
          }}
          secondaryActions={[
            { content: "Cancel", onAction: handleModalClose },
          ]}
          size="large"
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text as="p" tone="subdued">
                {selectedRecipe.description}
              </Text>

              {/* Quick Inputs */}
              {hasQuickInputs && (
                <>
                  <Divider />
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingSm">
                      Quick Setup
                    </Text>
                    {selectedRecipe.inputs.map((input) => (
                      <QuickInputField
                        key={input.key}
                        input={input}
                        value={contextData[input.key]}
                        onChange={(value) => handleInputChange(input.key, value)}
                      />
                    ))}
                  </BlockStack>
                </>
              )}

              {/* Required Config (Discount) */}
              {selectedRecipe.requiredConfig?.includes("discount") && (
                <>
                  <Divider />
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingSm">
                      Discount Configuration
                    </Text>
                    <GenericDiscountComponent
                      discountConfig={discountConfig || undefined}
                      onConfigChange={setDiscountConfig}
                    />
                  </BlockStack>
                </>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </>
  );
}

// =============================================================================
// HELPER: Quick Input Field Renderer
// =============================================================================

interface QuickInputFieldProps {
  input: QuickInput;
  value: unknown;
  onChange: (value: unknown) => void;
}

function QuickInputField({ input, value, onChange }: QuickInputFieldProps) {
  const defaultValue = "defaultValue" in input ? input.defaultValue : undefined;

  switch (input.type) {
    case "discount_percentage":
      return (
        <RangeSlider
          label={input.label}
          value={typeof value === "number" ? value : (defaultValue as number) || 10}
          min={5}
          max={50}
          step={5}
          suffix={<Text as="span">{typeof value === "number" ? value : defaultValue}%</Text>}
          output
          onChange={(v) => onChange(v)}
        />
      );

    case "currency_amount":
    case "discount_amount":
      return (
        <TextField
          label={input.label}
          type="number"
          value={String(value ?? defaultValue ?? 50)}
          onChange={(v) => onChange(Number(v))}
          prefix="$"
          autoComplete="off"
        />
      );

    case "duration_hours":
      return (
        <TextField
          label={input.label}
          type="number"
          value={String(value ?? defaultValue ?? 24)}
          onChange={(v) => onChange(Number(v))}
          suffix="hours"
          autoComplete="off"
        />
      );

    case "text":
      return (
        <TextField
          label={input.label}
          value={String(value ?? defaultValue ?? "")}
          onChange={(v) => onChange(v)}
          autoComplete="off"
        />
      );

    case "select":
      if ("options" in input) {
        return (
          <Select
            label={input.label}
            options={input.options.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
            value={String(value ?? defaultValue ?? input.options[0]?.value)}
            onChange={(v) => onChange(v)}
          />
        );
      }
      return null;

    case "product_picker":
    case "collection_picker":
      // Product/collection pickers require App Bridge context
      // For now, show a placeholder - full implementation would use ProductPicker component
      return (
        <TextField
          label={input.label}
          value=""
          onChange={() => {}}
          placeholder="Product selection available in full editor"
          disabled
          autoComplete="off"
        />
      );

    case "datetime":
      return (
        <TextField
          label={input.label}
          type="datetime-local"
          value={String(value ?? "")}
          onChange={(v) => onChange(v)}
          autoComplete="off"
        />
      );

    default:
      return null;
  }
}

// =============================================================================
// HELPER: Build Initial Data from Recipe + Context
// =============================================================================

function buildRecipeInitialData(
  recipe: StyledRecipe,
  contextData: RecipeContext,
  discountConfig: DiscountConfig | null
) {
  const theme = (recipe.theme as NewsletterThemeKey) || "modern";
  const themeColors = NEWSLETTER_THEMES[theme] || NEWSLETTER_THEMES.modern;

  // Build content config from recipe defaults and apply context values
  const contentConfig = { ...recipe.defaults.contentConfig } as Record<string, unknown>;

  // Apply discount value to content if present
  if (contextData.discountValue !== undefined) {
    if (typeof contentConfig.subheadline === "string") {
      contentConfig.subheadline = contentConfig.subheadline.replace(
        /\d+%/,
        `${contextData.discountValue}%`
      );
    }
  }

  // Pre-configure CTA with BOGO product selection
  const ctaConfig = contentConfig.cta as Record<string, unknown> | undefined;
  if (discountConfig?.bogo?.get?.ids?.length && ctaConfig) {
    const firstBogoProductId = discountConfig.bogo.get.ids[0];
    const firstBogoVariantId = discountConfig.bogo.get.variantIds?.[0];
    const firstBogoProductHandle = discountConfig.bogo.get.productHandles?.[0];
    contentConfig.cta = {
      ...ctaConfig,
      productId: firstBogoProductId,
      // Include variantId for add-to-cart functionality
      ...(firstBogoVariantId && { variantId: firstBogoVariantId }),
      // Include productHandle for navigation
      ...(firstBogoProductHandle && { productHandle: firstBogoProductHandle }),
    };
  }

  // Pre-configure CTA with Free Gift product selection
  if (contextData.giftProduct && ctaConfig) {
    const giftSelection = contextData.giftProduct as Array<{ id: string }>;
    if (Array.isArray(giftSelection) && giftSelection.length > 0) {
      contentConfig.cta = { ...ctaConfig, productId: giftSelection[0].id };
    }
  }

  // Pre-configure inventory tracking with selected products
  if (contextData.inventoryProducts) {
    const inventorySelection = contextData.inventoryProducts as Array<{ id: string }>;
    const existingInventory = contentConfig.inventory as Record<string, unknown> | undefined;
    if (Array.isArray(inventorySelection) && inventorySelection.length > 0) {
      contentConfig.inventory = {
        ...(existingInventory || {}),
        mode: "real" as const,
        productIds: inventorySelection.map((p) => p.id),
      };
    }
  }

  // Build design config
  let imageUrl: string | undefined;
  let backgroundImageMode: "none" | "preset" | "file" = "none";
  let backgroundImagePresetKey: string | undefined;

  if (recipe.imageUrl) {
    imageUrl = recipe.imageUrl;
    backgroundImageMode = "file";
  } else if (recipe.backgroundPresetId) {
    const preset = getBackgroundById(recipe.backgroundPresetId);
    if (preset) {
      imageUrl = getBackgroundUrl(preset);
      backgroundImageMode = "preset";
      backgroundImagePresetKey = preset.id;
    }
  }

  const imagePosition = recipe.defaults.designConfig?.imagePosition ||
    (recipe.layout === "hero" ? "top" :
     recipe.layout === "fullscreen" ? "full" :
     recipe.layout === "split-right" ? "right" : "left");

  const recipeThemeMode = getThemeModeForRecipeType(recipe.recipeType);
  const recipePresetId = recipeThemeMode === "preset" ? getPresetIdForRecipe(recipe.id) : undefined;

  const designConfig = {
    theme,
    layout: recipe.layout,
    position: recipe.defaults.designConfig?.position || "center",
    size: recipe.defaults.designConfig?.size || "medium",
    backgroundImageMode,
    backgroundImagePresetKey,
    imageUrl,
    imagePosition,
    backgroundOverlayOpacity: 0.6,
    ...recipe.defaults.designConfig,
    ...(recipeThemeMode === "preset" ? {
      backgroundColor: themeColors.background,
      textColor: themeColors.text,
      primaryColor: themeColors.primary,
      accentColor: themeColors.primary,
      buttonColor: themeColors.ctaBg || themeColors.primary,
      buttonTextColor: themeColors.ctaText || "#FFFFFF",
    } : {}),
    themeMode: recipeThemeMode,
    presetId: recipePresetId,
  };

  // Build discount config
  const discountValue = contextData.discountValue as number | undefined;
  let finalDiscountConfig: DiscountConfig | Record<string, unknown>;

  if (discountConfig) {
    finalDiscountConfig = discountConfig;
  } else if (discountValue) {
    finalDiscountConfig = {
      enabled: true,
      type: "shared" as const,
      valueType: "PERCENTAGE" as const,
      value: discountValue,
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
    };
  } else {
    finalDiscountConfig = recipe.defaults.discountConfig || {};
  }

  // Build target rules
  const targetRules = { ...recipe.defaults.targetRules } as Record<string, unknown>;

  // Update cart value threshold from Free Gift threshold input
  if (contextData.threshold !== undefined) {
    const threshold = contextData.threshold as number;
    const enhancedTriggers = (targetRules.enhancedTriggers || {}) as Record<string, unknown>;
    targetRules.enhancedTriggers = {
      ...enhancedTriggers,
      cart_value: {
        ...(enhancedTriggers.cart_value as Record<string, unknown> || {}),
        enabled: true,
        min_value: threshold,
      },
    };
    if (typeof contentConfig.subheadline === "string") {
      contentConfig.subheadline = contentConfig.subheadline.replace(/\$\d+\+?/, `$${threshold}+`);
    }
  }

  return {
    name: recipe.name,
    goal: recipe.goal,
    templateType: recipe.templateType,
    contentConfig,
    designConfig,
    targetRules,
    discountConfig: finalDiscountConfig,
  };
}

