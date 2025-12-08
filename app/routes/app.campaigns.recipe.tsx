/**
 * Recipe-based Campaign Creation Route
 *
 * Simplified flow for creating campaigns using styled recipes.
 * Route: /app/campaigns/recipe
 *
 * Flow:
 * 1. Pick a recipe (RecipePicker - full width with categories)
 * 2. Configure quick inputs (Modal)
 * 3. Redirect to full campaign form with pre-filled data
 *
 * Query Parameters:
 * - returnTo: URL to redirect after selection (for embedding in flows)
 * - restrictToGoal: Filter recipes by goal (for A/B experiments)
 * - variantLabel: Label for the variant being configured (e.g., "Variant B")
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

import React, { useState, useCallback, useMemo } from "react";
import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { Page, Modal, BlockStack, Text, Card, TextField, RangeSlider, Select, Banner, Divider, Box } from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { RecipePicker } from "~/domains/campaigns/components/recipes";
import { GoalFilter } from "~/domains/campaigns/components/goals/GoalFilter";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";
import { GenericDiscountComponent } from "~/domains/campaigns/components/form/GenericDiscountComponent";
import { ProductPicker } from "~/domains/campaigns/components/form/ProductPicker";
import {
  getThemeModeForRecipeType,
  getPresetIdForRecipe,
  type StyledRecipe,
  type RecipeContext,
  type QuickInput,
} from "~/domains/campaigns/recipes/styled-recipe-types";
import type { CampaignGoal, DiscountConfig } from "~/domains/campaigns/types/campaign";
import type { DesignTokens } from "~/domains/campaigns/types/design-tokens";
import { getDefaultPreset, presetToDesignTokens, type ThemePresetInput } from "~/domains/store/types/theme-preset";
import { StoreSettingsSchema } from "~/domains/store/types/settings";
import db from "~/db.server";

interface LoaderData {
  recipes: StyledRecipe[];
  defaultThemeTokens?: DesignTokens;
}

// =============================================================================
// LOADER
// =============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  // Fetch store settings to get default theme tokens
  let defaultThemeTokens: DesignTokens | undefined;

  try {
    const store = await db.store.findFirst({
      where: { shopifyDomain: session.shop },
    });

    if (store?.settings) {
      const parsedSettings = StoreSettingsSchema.safeParse(store.settings);
      if (parsedSettings.success) {
        const presets = parsedSettings.data.customThemePresets as ThemePresetInput[] | undefined;
        const defaultPreset = presets ? getDefaultPreset(presets) : undefined;
        if (defaultPreset) {
          defaultThemeTokens = presetToDesignTokens(defaultPreset) as DesignTokens;
        }
      }
    }
  } catch (error) {
    console.error("Error fetching default theme tokens:", error);
  }

  return data<LoaderData>({
    recipes: STYLED_RECIPES,
    defaultThemeTokens,
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RecipeCampaignCreation() {
  const { recipes, defaultThemeTokens } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Query parameters for embedded mode (A/B experiments)
  const returnTo = searchParams.get("returnTo");
  const restrictToGoal = searchParams.get("restrictToGoal") as CampaignGoal | null;
  const variantLabel = searchParams.get("variantLabel");

  // Goal filter state (user-selected goal for filtering, null = all)
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | null>(null);

  // Calculate recipe counts per goal (for GoalFilter badges)
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

  // Effective goal filter: restrictToGoal (from A/B experiment) takes precedence over user selection
  const effectiveGoal = restrictToGoal || selectedGoal;

  // Filter recipes by goal (for A/B experiments or user selection)
  const filteredRecipes = useMemo(() => {
    if (!effectiveGoal) return recipes;
    return recipes.filter((r) => r.goal === effectiveGoal);
  }, [recipes, effectiveGoal]);

  // Modal state
  const [selectedRecipe, setSelectedRecipe] = useState<StyledRecipe | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [contextData, setContextData] = useState<RecipeContext>({});
  const [discountConfig, setDiscountConfig] = useState<DiscountConfig | null>(null);

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
    // Initialize discount config from recipe defaults if requiredConfig includes discount
    if (recipe.requiredConfig?.includes("discount") && recipe.defaults.discountConfig) {
      setDiscountConfig(recipe.defaults.discountConfig as DiscountConfig);
    } else {
      setDiscountConfig(null);
    }
    setModalOpen(true);
  }, []);

  // Build from scratch - redirect to legacy flow
  const handleBuildFromScratch = useCallback(() => {
    navigate("/app/campaigns/new");
  }, [navigate]);

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

  // Build initial data for the campaign form from recipe + context
  const buildInitialData = useCallback(() => {
    if (!selectedRecipe) return {};

    const theme = (selectedRecipe.theme as NewsletterThemeKey) || "modern";
    const themeColors = NEWSLETTER_THEMES[theme] || NEWSLETTER_THEMES.modern;

    // Build content config from recipe defaults and apply context values
    // Cast to Record to allow dynamic property access since contentConfig is a union type
    const contentConfig = { ...selectedRecipe.defaults.contentConfig } as Record<string, unknown>;

    // Apply discount value to content if present
    if (contextData.discountValue !== undefined) {
      // Update subheadline with discount value
      if (typeof contentConfig.subheadline === "string") {
        contentConfig.subheadline = contentConfig.subheadline.replace(
          /\d+%/,
          `${contextData.discountValue}%`
        );
      }
    }

    // Pre-configure CTA with BOGO product selection
    // When user selects products in the BOGO discount config, use the first "get" product for the CTA
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
    // When user selects products for inventory tracking, set them in contentConfig.inventory
    if (contextData.inventoryProducts) {
      const inventorySelection = contextData.inventoryProducts as Array<{ id: string; title?: string }>;
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

    // First check for direct imageUrl on recipe (for split/hero layouts)
    if (selectedRecipe.imageUrl) {
      imageUrl = selectedRecipe.imageUrl;
      backgroundImageMode = "file";
    }
    // Then check for background preset (for full background mode)
    else if (selectedRecipe.backgroundPresetId) {
      const preset = getBackgroundById(selectedRecipe.backgroundPresetId);
      if (preset) {
        imageUrl = getBackgroundUrl(preset);
        backgroundImageMode = "preset";
        backgroundImagePresetKey = preset.id;
      }
    }

    // Determine imagePosition based on layout
    const imagePosition = selectedRecipe.defaults.designConfig?.imagePosition ||
      (selectedRecipe.layout === "hero" ? "top" :
       selectedRecipe.layout === "fullscreen" ? "full" :
       selectedRecipe.layout === "split-right" ? "right" : "left");

    // Determine theme mode based on recipe type
    const recipeThemeMode = getThemeModeForRecipeType(selectedRecipe.recipeType);
    const recipePresetId = recipeThemeMode === "preset" ? getPresetIdForRecipe(selectedRecipe.id) : undefined;

    // Build design config - only apply hardcoded colors for "preset" mode recipes
    // For "default" mode, let the preview and storefront use the store's default theme
    const designConfig = {
      theme,
      layout: selectedRecipe.layout,
      position: selectedRecipe.defaults.designConfig?.position || "center",
      size: selectedRecipe.defaults.designConfig?.size || "medium",
      backgroundImageMode,
      backgroundImagePresetKey,
      imageUrl,
      imagePosition,
      backgroundOverlayOpacity: 0.6,
      ...selectedRecipe.defaults.designConfig,
      // Only apply preset colors when using "preset" mode (inspiration/seasonal recipes)
      // For "default" mode, colors will be derived from the store's default theme
      ...(recipeThemeMode === "preset" ? {
        backgroundColor: themeColors.background,
        textColor: themeColors.text,
        primaryColor: themeColors.primary,
        accentColor: themeColors.primary,
        buttonColor: themeColors.ctaBg || themeColors.primary,
        buttonTextColor: themeColors.ctaText || "#FFFFFF",
      } : {}),
      // Theme mode for the new design token system
      themeMode: recipeThemeMode,
      presetId: recipePresetId,
    };

    // Build discount config - prioritize:
    // 1. User-configured discountConfig from requiredConfig modal
    // 2. User-provided discountValue from quick inputs
    // 3. Recipe's default discountConfig
    const discountValue = contextData.discountValue as number | undefined;
    let finalDiscountConfig: DiscountConfig | Record<string, unknown>;

    if (discountConfig) {
      // User configured discount in modal (BOGO, Tiered, etc.)
      finalDiscountConfig = discountConfig;
    } else if (discountValue) {
      // User provided simple discount percentage via quick input
      finalDiscountConfig = {
        enabled: true,
        type: "shared" as const,
        valueType: "PERCENTAGE" as const,
        value: discountValue,
        behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
      };
    } else {
      // Use recipe's default discount config
      finalDiscountConfig = selectedRecipe.defaults.discountConfig || {};
    }

    // Add freeGift product info if a gift product was selected
    // Uses a basic 100% discount with quantityLimit to limit to 1 free item per order
    if (freeGiftProduct) {
      const threshold = contextData.threshold as number | undefined;
      const minSubtotalCents = threshold ? threshold * 100 : 5000;

      finalDiscountConfig = {
        ...finalDiscountConfig,
        enabled: true,
        freeGift: {
          productId: freeGiftProduct.id,
          variantId: freeGiftProduct.variantId || "",
          productTitle: freeGiftProduct.title,
          ...(freeGiftProduct.imageUrl && { productImageUrl: freeGiftProduct.imageUrl }),
          quantity: 1, // Limits to 1 free item per order
          minSubtotalCents,
        },
      };
    }

    // Build target rules - start with recipe defaults, then apply user inputs
    const targetRules = { ...selectedRecipe.defaults.targetRules } as Record<string, unknown>;

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

      // Also update subheadline if it contains the default threshold
      if (typeof contentConfig.subheadline === "string") {
        contentConfig.subheadline = contentConfig.subheadline.replace(
          /\$\d+\+?/,
          `$${threshold}+`
        );
      }
    }

    return {
      name: selectedRecipe.name,
      goal: selectedRecipe.goal,
      templateType: selectedRecipe.templateType,
      contentConfig,
      designConfig,
      targetRules,
      discountConfig: finalDiscountConfig,
    };
  }, [selectedRecipe, contextData, discountConfig]);

  // Create campaign - navigate to full form with initial data or return to caller
  const handleCreateCampaign = useCallback(() => {
    const initialData = buildInitialData();

    if (returnTo) {
      // Embedded mode: return to caller with selected recipe data
      navigate(returnTo, {
        state: {
          selectedRecipe,
          recipeInitialData: initialData,
        },
      });
    } else {
      // Standalone mode: navigate to the campaign form
      navigate("/app/campaigns/new?fromRecipe=true", {
        state: { recipeInitialData: initialData },
      });
    }
  }, [buildInitialData, navigate, returnTo, selectedRecipe]);

  // Render input field based on type
  const renderInput = (input: QuickInput) => {
    const value = contextData[input.key];
    const defaultValue = "defaultValue" in input ? input.defaultValue : undefined;

    switch (input.type) {
      case "discount_percentage":
        return (
          <RangeSlider
            key={input.key}
            label={input.label}
            value={typeof value === "number" ? value : (defaultValue as number) || 10}
            min={5}
            max={50}
            step={5}
            onChange={(val) => handleInputChange(input.key, val)}
            output
            suffix={<Text as="span" variant="bodyMd">{typeof value === "number" ? value : defaultValue}%</Text>}
          />
        );

      case "currency_amount":
        return (
          <TextField
            key={input.key}
            label={input.label}
            type="number"
            value={String(value ?? defaultValue ?? "")}
            onChange={(val) => handleInputChange(input.key, Number(val))}
            autoComplete="off"
            prefix="$"
          />
        );

      case "text":
        return (
          <TextField
            key={input.key}
            label={input.label}
            value={String(value ?? defaultValue ?? "")}
            onChange={(val) => handleInputChange(input.key, val)}
            autoComplete="off"
          />
        );

      case "select":
        const options = "options" in input ? input.options : [];
        return (
          <Select
            key={input.key}
            label={input.label}
            options={options}
            value={String(value ?? defaultValue ?? "")}
            onChange={(val) => handleInputChange(input.key, val)}
          />
        );

      case "product_picker": {
        const selections = contextData[input.key] as Array<{ id: string; title?: string }> | undefined;
        const hasSelection = Array.isArray(selections) && selections.length > 0;
        const isGiftProduct = input.key === "giftProduct";

        return (
          <BlockStack key={input.key} gap="300">
            <ProductPicker
              mode="product"
              selectionType={"multiSelect" in input && input.multiSelect ? "multiple" : "single"}
              onSelect={(newSelections) => handleInputChange(input.key, newSelections)}
              buttonLabel={input.label}
              showSelected={true}
            />
            {isGiftProduct && (
              <Text as="p" variant="bodySm" tone="subdued">
                This product will be automatically added to the customer's cart when they click the popup button.
              </Text>
            )}
            {hasSelection && isGiftProduct && (
              <Banner tone="success">
                <Text as="p" variant="bodySm">
                  ✓ When customers click "{(selectedRecipe?.defaults.contentConfig as { cta?: { label?: string } })?.cta?.label || "the button"}", <strong>{selections[0].title}</strong> will be added to their cart.
                </Text>
              </Banner>
            )}
          </BlockStack>
        );
      }

      default:
        return null;
    }
  };

  // Determine page title and back action
  const pageTitle = variantLabel
    ? `Choose Recipe for ${variantLabel}`
    : "Create Campaign";

  const backAction = returnTo
    ? { content: "Back", url: returnTo }
    : { content: "Campaigns", url: "/app/campaigns" };

  return (
    <Page
      title={pageTitle}
      fullWidth={true}
      backAction={backAction}
    >
      <BlockStack gap="600">
        {/* A/B Experiment mode banner */}
        {restrictToGoal && (
          <Banner tone="info">
            <Text as="p">
              {variantLabel
                ? `Selecting a recipe for ${variantLabel}. `
                : ""}
              Only showing recipes that match the Control variant's goal ({restrictToGoal.replace("_", " ").toLowerCase()}) for A/B test consistency.
            </Text>
          </Banner>
        )}

        {/* Goal Filter - only show when not in A/B experiment mode */}
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

        <RecipePicker
          recipes={filteredRecipes}
          selectedRecipeId={selectedRecipe?.id}
          onSelect={handleRecipeSelect}
          onBuildFromScratch={returnTo ? undefined : handleBuildFromScratch}
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
          title={`Setup: ${selectedRecipe.name}`}
          primaryAction={{
            content: returnTo ? "Select Recipe" : "Create Campaign",
            onAction: handleCreateCampaign,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: handleModalClose,
            },
          ]}
          size={selectedRecipe.requiredConfig?.includes("discount") ? "large" : "small"}
        >
          <Modal.Section>
            <BlockStack gap="400">
              {/* Recipe description */}
              <Text as="p" tone="subdued">
                {selectedRecipe.description}
              </Text>

              {/* Quick inputs */}
              {selectedRecipe.inputs.length > 0 && (
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingSm">
                      Quick Settings
                    </Text>
                    {selectedRecipe.inputs.map((input) => renderInput(input))}
                  </BlockStack>
                </Card>
              )}

              {/* Required discount configuration */}
              {selectedRecipe.requiredConfig?.includes("discount") && discountConfig && (
                <>
                  <Divider />
                  <Card>
                    <BlockStack gap="400">
                      <Text as="h3" variant="headingSm">
                        Discount Configuration
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Configure your {selectedRecipe.name} discount settings
                      </Text>
                      <GenericDiscountComponent
                        goal={selectedRecipe.goal}
                        discountConfig={discountConfig}
                        onConfigChange={(newConfig) => setDiscountConfig(newConfig)}
                        allowedStrategies={
                          discountConfig.bogo ? ["bogo"] :
                          discountConfig.tiers ? ["tiered"] :
                          discountConfig.freeGift ? ["free_gift"] :
                          ["basic", "bogo", "tiered", "free_gift"]
                        }
                        hasEmailCapture={false}
                      />
                    </BlockStack>
                  </Card>
                </>
              )}

              {/* No inputs and no required config */}
              {selectedRecipe.inputs.length === 0 && !selectedRecipe.requiredConfig?.length && (
                <Text as="p" variant="bodySm" tone="subdued">
                  This recipe is ready to go! Click "{returnTo ? "Select Recipe" : "Create Campaign"}" to continue.
                </Text>
              )}
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}
    </Page>
  );
}

