/**
 * Styled Recipe Catalog
 *
 * Complete catalog of styled recipes organized by category.
 * Each recipe defines: component, theme, background, editable fields, and defaults.
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

import type {
  StyledRecipe,
  StyledRecipeWithBuild,
  RecipeCategory,
  RecipeContext,
  RecipeOutput,
  RecipeTag,
} from "./styled-recipe-types";
import { getThemeModeForRecipeType, getPresetIdForRecipe } from "./styled-recipe-types";
import { ANNOUNCEMENT_DESIGN_RECIPES } from "./announcement-design-recipes";
import { CART_ABANDONMENT_DESIGN_RECIPES } from "./cart-abandonment-design-recipes";
import { FLASH_SALE_DESIGN_RECIPES } from "./flash-sale-design-recipes";
import { FREE_SHIPPING_DESIGN_RECIPES } from "./free-shipping-design-recipes";
import { NEWSLETTER_DESIGN_RECIPES } from "./newsletter-design-recipes";
import { SCRATCH_CARD_DESIGN_RECIPES } from "./scratch-card-design-recipes";
import { SOCIAL_PROOF_DESIGN_RECIPES } from "./social-proof-design-recipes";
import { SPIN_TO_WIN_DESIGN_RECIPES } from "./spin-to-win-design-recipes";
import { UPSELL_RECIPES } from "./upsell-recipes";

// =============================================================================
// HELPER: Build function factory
// =============================================================================

function createBuildFunction(
  recipe: Omit<StyledRecipe, "build">
): (context: RecipeContext) => RecipeOutput {
  return (context: RecipeContext): RecipeOutput => {
    const defaults = recipe.defaults;

    // Determine theme mode based on recipe type
    const themeMode = getThemeModeForRecipeType(recipe.recipeType);
    const presetId = themeMode === "preset" ? getPresetIdForRecipe(recipe.id) : undefined;

    // Merge context values into content config
    // Cast to Record to allow dynamic property access since contentConfig is a union type
    const contentConfig = {
      ...defaults.contentConfig,
    } as Record<string, unknown>;

    // Apply context overrides
    if (context.headline !== undefined) contentConfig.headline = context.headline;
    if (context.subheadline !== undefined) contentConfig.subheadline = context.subheadline;
    if (context.buttonText !== undefined) contentConfig.buttonText = context.buttonText;
    if (context.discountValue !== undefined) {
      contentConfig.discountPercentage = context.discountValue;
      // Also update text that references discount
      if (typeof contentConfig.subheadline === "string") {
        contentConfig.subheadline = contentConfig.subheadline.replace(
          /\{discountValue\}/g,
          String(context.discountValue)
        );
      }
    }

    // Build design config
    // Note: We intentionally do NOT include recipe.theme here because it's a recipe identifier
    // (like "elegant-luxe"), not a valid schema theme value. Instead, recipes use
    // themeMode: "preset" with presetId to apply their styling.
    const designConfig = {
      layout: recipe.layout,
      position: defaults.designConfig?.position || "center",
      size: defaults.designConfig?.size || "medium",
      themeMode,
      presetId,
      ...defaults.designConfig,
    };

    // Build discount config if discount value provided
    let discountConfig = defaults.discountConfig;
    if (context.discountValue && discountConfig) {
      discountConfig = {
        ...discountConfig,
        value: context.discountValue,
      };
    }

    return {
      name: recipe.name,
      contentConfig,
      designConfig,
      discountConfig,
      targetRules: defaults.targetRules,
      themeMode,
      presetId,
    };
  };
}

// =============================================================================
// CATALOG EXPORT
// =============================================================================

/** All styled recipes (existing + newsletter design recipes) */
export const STYLED_RECIPES: StyledRecipe[] = [
  // Announcement Design Recipes (store-wide banners)
  ...ANNOUNCEMENT_DESIGN_RECIPES,
  // Cart Abandonment Design Recipes (cart recovery)
  ...CART_ABANDONMENT_DESIGN_RECIPES,
  // Flash Sale Design Recipes (sales & promos)
  ...FLASH_SALE_DESIGN_RECIPES,
  // Free Shipping Design Recipes (cart recovery / AOV increase)
  ...FREE_SHIPPING_DESIGN_RECIPES,
  // Newsletter Design Recipes (new industry-specific designs)
  ...NEWSLETTER_DESIGN_RECIPES,
  // Scratch Card Design Recipes (gamified engagement)
  ...SCRATCH_CARD_DESIGN_RECIPES,
  // Social Proof Design Recipes (trust & urgency)
  ...SOCIAL_PROOF_DESIGN_RECIPES,
  // Spin To Win Design Recipes (wheel of fortune engagement)
  ...SPIN_TO_WIN_DESIGN_RECIPES,
  // Upsell & Cross-Sell Recipes
  ...UPSELL_RECIPES,
];

/** Get all recipes with build functions attached */
export function getStyledRecipesWithBuild(): StyledRecipeWithBuild[] {
  return STYLED_RECIPES.map((recipe) => ({
    ...recipe,
    build: createBuildFunction(recipe),
  }));
}

/** Get recipe by ID */
export function getStyledRecipeById(id: string): StyledRecipe | undefined {
  return STYLED_RECIPES.find((r) => r.id === id);
}

/** Get recipes by category */
export function getStyledRecipesByCategory(category: RecipeCategory): StyledRecipe[] {
  return STYLED_RECIPES.filter((r) => r.category === category);
}

/** Get featured recipes */
export function getFeaturedStyledRecipes(): StyledRecipe[] {
  return STYLED_RECIPES.filter((r) => r.featured);
}

/** Get seasonal recipes */
export function getSeasonalStyledRecipes(): StyledRecipe[] {
  return STYLED_RECIPES.filter((r) => r.seasonal);
}

/** Get recipe count by category */
export function getRecipeCountByCategory(): Record<RecipeCategory, number> {
  return {
    email_leads: getStyledRecipesByCategory("email_leads").length,
    sales_promos: getStyledRecipesByCategory("sales_promos").length,
    cart_recovery: getStyledRecipesByCategory("cart_recovery").length,
    announcements: getStyledRecipesByCategory("announcements").length,
  };
}

/** Get recipes by tag */
export function getStyledRecipesByTag(tag: RecipeTag): StyledRecipe[] {
  return STYLED_RECIPES.filter((r) => r.tags?.includes(tag));
}

/** Get recipes by multiple tags (AND logic) */
export function getStyledRecipesByTags(tags: RecipeTag[]): StyledRecipe[] {
  return STYLED_RECIPES.filter((r) => tags.every((tag) => r.tags?.includes(tag)));
}

/** Get recipes by any of the tags (OR logic) */
export function getStyledRecipesByAnyTag(tags: RecipeTag[]): StyledRecipe[] {
  return STYLED_RECIPES.filter((r) => tags.some((tag) => r.tags?.includes(tag)));
}

/** Get all unique tags from recipes */
export function getAllRecipeTags(): RecipeTag[] {
  const tagSet = new Set<RecipeTag>();
  STYLED_RECIPES.forEach((r) => {
    r.tags?.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet);
}
