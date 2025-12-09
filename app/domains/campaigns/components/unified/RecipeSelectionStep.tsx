/**
 * RecipeSelectionStep Component
 *
 * A reusable recipe selection flow with:
 * - GoalFilter at the top
 * - RecipePicker grid below
 * - NO MODAL: Clicking a recipe immediately proceeds to editor
 *
 * Quick inputs are now rendered inline in the editor step (QuickConfig section).
 *
 * Used in:
 * - SingleCampaignFlow (when creating a new campaign)
 * - VariantCampaignEditor (when configuring A/B test variants)
 */

import React, { useState, useCallback, useMemo } from "react";
import { BlockStack, Text, Card, Banner } from "@shopify/polaris";

import { GoalFilter } from "../goals/GoalFilter";
import { RecipePicker } from "../recipes/RecipePicker";
import type { NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";
import {
  getThemeModeForRecipeType,
  getPresetIdForRecipe,
  type StyledRecipe,
  type RecipeContext,
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
  /**
   * Context data containing quick input values.
   * Used by the QuickConfig section in the editor to allow editing.
   */
  contextData?: RecipeContext;
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

  /**
   * Recipe selected - build initial data and proceed directly to editor.
   * Quick inputs are now rendered inline in the editor (QuickConfig section).
   */
  const handleRecipeSelect = useCallback((recipe: StyledRecipe) => {
    // Initialize default values for inputs
    const defaults: RecipeContext = {};
    recipe.inputs.forEach((input) => {
      if ("defaultValue" in input && input.defaultValue !== undefined) {
        defaults[input.key] = input.defaultValue;
      }
    });

    // Initialize discount config from recipe defaults
    const discountConfig = recipe.defaults.discountConfig
      ? (recipe.defaults.discountConfig as DiscountConfig)
      : null;

    // Build initial data using defaults (user can modify in QuickConfig section)
    const initialData = buildRecipeInitialData(recipe, defaults, discountConfig);

    // Proceed directly to editor with recipe + initial data + context for QuickConfig
    onRecipeSelected({
      recipe,
      initialData,
      // Pass context defaults so QuickConfig section can edit them
      contextData: defaults,
    });
  }, [onRecipeSelected]);

  return (
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
        selectedRecipeId={undefined}
        onSelect={handleRecipeSelect}
        onBuildFromScratch={onBuildFromScratch}
        showPreviews={true}
        hoverPreviewEnabled={false}
        defaultThemeTokens={defaultThemeTokens}
        selectedGoal={effectiveGoal}
      />
    </BlockStack>
  );
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
  // When user selects a gift product via quick input, use it for the CTA
  // Note: discountConfig.freeGift is populated later in finalDiscountConfig building
  let freeGiftProduct: {
    id: string;
    title?: string;
    handle?: string;
    variantId?: string;
    imageUrl?: string;
  } | null = null;

  if (contextData.giftProduct && ctaConfig) {
    const giftSelection = contextData.giftProduct as Array<{
      id: string;
      title?: string;
      handle?: string;
      images?: Array<{ originalSrc: string }>;
      variants?: Array<{ id: string; title: string }>;
    }>;
    if (Array.isArray(giftSelection) && giftSelection.length > 0) {
      const product = giftSelection[0];
      const firstVariantId = product.variants?.[0]?.id;
      const firstImageUrl = product.images?.[0]?.originalSrc;

      freeGiftProduct = {
        id: product.id,
        title: product.title,
        handle: product.handle,
        variantId: firstVariantId,
        imageUrl: firstImageUrl,
      };

      // Update CTA with product info for add-to-cart action
      contentConfig.cta = {
        ...ctaConfig,
        productId: product.id,
        productHandle: product.handle,
        ...(firstVariantId && { variantId: firstVariantId }),
      };
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

  // For "preset" mode (inspiration/seasonal recipes), the recipe's defaults.designConfig
  // already contains the correct colors (e.g., Bold Energy has backgroundColor: "#0F0F0F").
  // We should NOT overwrite these with themeColors lookup which may fail for custom theme names.
  // For "default" mode (use_case recipes), colors come from the store's theme tokens at runtime.
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
    // Spread recipe's designConfig which includes colors for preset mode recipes
    ...recipe.defaults.designConfig,
    themeMode: recipeThemeMode,
    presetId: recipePresetId,
  };

  // Build discount config
  // Start with recipe defaults, then override with modal state or input values
  const discountValue = contextData.discountValue as number | undefined;
  const recipeDiscountDefaults = recipe.defaults.discountConfig || {};
  let finalDiscountConfig: DiscountConfig | Record<string, unknown>;

  if (discountConfig) {
    // Modal state has full discount config (from requiredConfig: ["discount"])
    finalDiscountConfig = discountConfig;
  } else if (discountValue !== undefined) {
    // Merge recipe defaults with the discount value from input
    // This preserves applicability, behavior, etc. from recipe while allowing value override
    finalDiscountConfig = {
      ...recipeDiscountDefaults,
      enabled: true,
      type: recipeDiscountDefaults.type || ("shared" as const),
      valueType: recipeDiscountDefaults.valueType || ("PERCENTAGE" as const),
      value: discountValue,
      behavior: recipeDiscountDefaults.behavior || ("SHOW_CODE_AND_AUTO_APPLY" as const),
    };
  } else {
    finalDiscountConfig = recipeDiscountDefaults;
  }

  // Add freeGift product info if a gift product was selected
  if (freeGiftProduct) {
    const threshold = contextData.threshold as number | undefined;
    finalDiscountConfig = {
      ...finalDiscountConfig,
      enabled: true,
      freeGift: {
        productId: freeGiftProduct.id,
        variantId: freeGiftProduct.variantId || "",
        productTitle: freeGiftProduct.title,
        ...(freeGiftProduct.imageUrl && { productImageUrl: freeGiftProduct.imageUrl }),
        quantity: 1,
        minSubtotalCents: threshold ? threshold * 100 : 5000,
      },
    };
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

  // ==========================================================================
  // SPIN-TO-WIN / SCRATCH CARD: Apply topPrize to first segment/prize
  // ==========================================================================
  if (contextData.topPrize !== undefined) {
    const topPrizeValue = contextData.topPrize as number;

    // For Spin-to-Win: update first wheelSegment's discount value
    if (Array.isArray(contentConfig.wheelSegments)) {
      const segments = [...(contentConfig.wheelSegments as Array<Record<string, unknown>>)];
      if (segments.length > 0 && segments[0].discountConfig) {
        segments[0] = {
          ...segments[0],
          label: `${topPrizeValue}% OFF`,
          discountConfig: {
            ...(segments[0].discountConfig as Record<string, unknown>),
            value: topPrizeValue,
          },
        };
        contentConfig.wheelSegments = segments;
      }
    }

    // For Scratch Card: update first prize's discount value
    if (Array.isArray(contentConfig.prizes)) {
      const prizes = [...(contentConfig.prizes as Array<Record<string, unknown>>)];
      if (prizes.length > 0 && prizes[0].discountConfig) {
        prizes[0] = {
          ...prizes[0],
          label: `${topPrizeValue}% OFF`,
          discountConfig: {
            ...(prizes[0].discountConfig as Record<string, unknown>),
            value: topPrizeValue,
          },
        };
        contentConfig.prizes = prizes;
      }
    }
  }

  // ==========================================================================
  // SCRATCH CARD: Apply emailTiming to emailBeforeScratching
  // ==========================================================================
  if (contextData.emailTiming !== undefined) {
    contentConfig.emailBeforeScratching = contextData.emailTiming === "before";
  }

  // ==========================================================================
  // SOCIAL PROOF: Apply notification type, frequency, and position
  // ==========================================================================
  if (contextData.notificationType !== undefined) {
    const notificationType = contextData.notificationType as string;
    contentConfig.enablePurchaseNotifications = notificationType === "purchases" || notificationType === "all";
    contentConfig.enableVisitorNotifications = notificationType === "visitors" || notificationType === "all";
    contentConfig.enableReviewNotifications = notificationType === "reviews" || notificationType === "all";
  }

  if (contextData.displayFrequency !== undefined) {
    contentConfig.rotationInterval = parseInt(contextData.displayFrequency as string, 10);
  }

  if (contextData.cornerPosition !== undefined) {
    contentConfig.cornerPosition = contextData.cornerPosition as string;
  }

  // ==========================================================================
  // ANNOUNCEMENT: Apply ctaUrl, bannerPosition, and freeShippingThreshold
  // ==========================================================================
  if (contextData.ctaUrl !== undefined) {
    contentConfig.ctaUrl = contextData.ctaUrl as string;
  }

  if (contextData.bannerPosition !== undefined) {
    // Banner position affects the design config position
    designConfig.position = contextData.bannerPosition === "top" ? "top" : "bottom";
  }

  if (contextData.freeShippingThreshold !== undefined) {
    const threshold = contextData.freeShippingThreshold as number;
    // Update subheadline with threshold value
    if (typeof contentConfig.subheadline === "string") {
      contentConfig.subheadline = contentConfig.subheadline.replace(/\$\d+/, `$${threshold}`);
    }
    if (typeof contentConfig.headline === "string") {
      contentConfig.headline = contentConfig.headline.replace(/\$\d+/, `$${threshold}`);
    }
  }

  // ==========================================================================
  // TRIGGER TYPE: Apply trigger type to enhanced triggers
  // ==========================================================================
  if (contextData.triggerType !== undefined) {
    const triggerType = contextData.triggerType as string;
    const enhancedTriggers = (targetRules.enhancedTriggers || {}) as Record<string, unknown>;

    // Disable all triggers first, then enable the selected one
    const updatedTriggers: Record<string, unknown> = {
      ...enhancedTriggers,
      page_load: { ...(enhancedTriggers.page_load as Record<string, unknown> || {}), enabled: false },
      exit_intent: { ...(enhancedTriggers.exit_intent as Record<string, unknown> || {}), enabled: false },
      scroll_depth: { ...(enhancedTriggers.scroll_depth as Record<string, unknown> || {}), enabled: false },
      time_delay: { ...(enhancedTriggers.time_delay as Record<string, unknown> || {}), enabled: false },
    };

    // Enable the selected trigger
    if (triggerType === "page_load") {
      updatedTriggers.page_load = { enabled: true };
    } else if (triggerType === "exit_intent") {
      updatedTriggers.exit_intent = { enabled: true, sensitivity: "medium" };
    } else if (triggerType === "scroll_depth") {
      updatedTriggers.scroll_depth = { enabled: true, threshold: 50 };
    } else if (triggerType === "time_delay") {
      updatedTriggers.time_delay = { enabled: true, delay: 5 };
    }

    targetRules.enhancedTriggers = updatedTriggers;
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

