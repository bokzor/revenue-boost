/**
 * Recipe-based Campaign Creation Route
 *
 * Simplified flow for creating campaigns using styled recipes.
 * Route: /app/campaigns/recipe
 *
 * Flow:
 * 1. Pick a recipe (RecipePicker - full width with categories)
 * 2. Redirect to campaign editor with recipe defaults pre-filled
 * 3. Quick inputs and complex config are handled inline in the editor
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
import { Page, BlockStack, Text, Card, Banner } from "@shopify/polaris";

import { authenticate } from "~/shopify.server";
import { RecipePicker } from "~/domains/campaigns/components/recipes";
import { GoalFilter } from "~/domains/campaigns/components/goals/GoalFilter";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";
import {
  getThemeModeForRecipeType,
  getPresetIdForRecipe,
  type StyledRecipe,
} from "~/domains/campaigns/recipes/styled-recipe-types";
import type { CampaignGoal } from "~/domains/campaigns/types/campaign";
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

  // Build from scratch - redirect to legacy flow
  const handleBuildFromScratch = useCallback(() => {
    navigate("/app/campaigns/new");
  }, [navigate]);

  /**
   * Build initial data for the campaign form from recipe defaults.
   * Quick inputs and complex discount configs are handled in the editor's
   * QuickConfig and Content sections, not upfront in a modal.
   */
  const buildInitialData = useCallback((recipe: StyledRecipe) => {
    const theme = (recipe.theme as NewsletterThemeKey) || "modern";
    const themeColors = NEWSLETTER_THEMES[theme] || NEWSLETTER_THEMES.modern;

    // Use recipe's content config defaults directly
    const contentConfig = { ...recipe.defaults.contentConfig };

    // Build design config
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

    // Determine theme mode based on recipe type
    const recipeThemeMode = getThemeModeForRecipeType(recipe.recipeType);
    const recipePresetId = recipeThemeMode === "preset" ? getPresetIdForRecipe(recipe.id) : undefined;

    // Build design config - only apply hardcoded colors for "preset" mode recipes
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
      // Only apply preset colors when using "preset" mode (inspiration/seasonal recipes)
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

    // Use recipe's default discount config
    const discountConfig = recipe.defaults.discountConfig || {};

    // Use recipe's default target rules
    const targetRules = { ...recipe.defaults.targetRules };

    return {
      name: recipe.name,
      goal: recipe.goal,
      templateType: recipe.templateType,
      contentConfig,
      designConfig,
      targetRules,
      discountConfig,
      // Pass the recipe so the editor can show QuickConfig section
      recipe,
    };
  }, []);

  /**
   * Recipe selected - immediately navigate to editor with recipe defaults.
   * No modal - quick inputs are handled in the editor's QuickConfig section.
   */
  const handleRecipeSelect = useCallback((recipe: StyledRecipe) => {
    const initialData = buildInitialData(recipe);

    if (returnTo) {
      // Embedded mode: return to caller with selected recipe data
      navigate(returnTo, {
        state: {
          selectedRecipe: recipe,
          recipeInitialData: initialData,
        },
      });
    } else {
      // Standalone mode: navigate to the campaign form
      navigate("/app/campaigns/new?fromRecipe=true", {
        state: { recipeInitialData: initialData },
      });
    }
  }, [buildInitialData, navigate, returnTo]);

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
          onSelect={handleRecipeSelect}
          onBuildFromScratch={returnTo ? undefined : handleBuildFromScratch}
          showPreviews={true}
          hoverPreviewEnabled={false}
          defaultThemeTokens={defaultThemeTokens}
          selectedGoal={effectiveGoal}
        />
      </BlockStack>
    </Page>
  );
}

