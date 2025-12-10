/**
 * Recipe Marketing Data
 *
 * Exports simplified recipe data for the marketing website.
 * This file provides a clean interface for the Next.js website to access
 * recipe information without Polaris dependencies.
 */

import type { StyledRecipe, RecipeCategory } from "~/domains/campaigns/recipes/styled-recipe-types";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";

// =============================================================================
// MARKETING CATEGORY MAPPING
// =============================================================================

/**
 * Marketing-friendly categories for the website.
 * Maps internal categories to user-facing goals.
 */
export type MarketingCategory =
  | "grow-email"      // Newsletter, Spin-to-Win, Scratch Card
  | "boost-sales"     // Flash Sale, Upsell
  | "recover-carts"   // Cart Abandonment, Free Shipping
  | "announce";       // Announcements, Social Proof

export interface MarketingCategoryInfo {
  id: MarketingCategory;
  label: string;
  description: string;
  icon: string;
}

export const MARKETING_CATEGORIES: Record<MarketingCategory, MarketingCategoryInfo> = {
  "grow-email": {
    id: "grow-email",
    label: "Grow Your Email List",
    description: "Capture emails with engaging popups and gamification",
    icon: "📧",
  },
  "boost-sales": {
    id: "boost-sales",
    label: "Boost Sales",
    description: "Drive revenue with flash sales, discounts, and upsells",
    icon: "💰",
  },
  "recover-carts": {
    id: "recover-carts",
    label: "Recover Abandoned Carts",
    description: "Bring back shoppers who left without buying",
    icon: "🛒",
  },
  "announce": {
    id: "announce",
    label: "Announce & Engage",
    description: "Share updates and build trust with social proof",
    icon: "📢",
  },
};

// Map internal categories to marketing categories
const CATEGORY_MAP: Record<RecipeCategory, MarketingCategory> = {
  email_leads: "grow-email",
  sales_promos: "boost-sales",
  cart_recovery: "recover-carts",
  announcements: "announce",
};

// =============================================================================
// SIMPLIFIED RECIPE TYPE FOR MARKETING
// =============================================================================

/**
 * Simplified recipe data for marketing purposes.
 * Contains only the fields needed for display on the website.
 */
export interface MarketingRecipe {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  category: MarketingCategory;
  templateType: string;
  featured?: boolean;
  seasonal?: boolean;
  new?: boolean;
  tags?: string[];
}

/**
 * Convert a StyledRecipe to a MarketingRecipe
 */
function toMarketingRecipe(recipe: StyledRecipe): MarketingRecipe {
  return {
    id: recipe.id,
    name: recipe.name,
    tagline: recipe.tagline,
    description: recipe.description,
    icon: recipe.icon,
    category: CATEGORY_MAP[recipe.category],
    templateType: recipe.templateType,
    featured: recipe.featured,
    seasonal: recipe.seasonal,
    new: recipe.new,
    tags: recipe.tags,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

/** All recipes formatted for marketing */
export const MARKETING_RECIPES: MarketingRecipe[] = STYLED_RECIPES.map(toMarketingRecipe);

/** Get recipes by marketing category */
export function getRecipesByMarketingCategory(category: MarketingCategory): MarketingRecipe[] {
  return MARKETING_RECIPES.filter((r) => r.category === category);
}

/** Get featured recipes */
export function getFeaturedMarketingRecipes(): MarketingRecipe[] {
  return MARKETING_RECIPES.filter((r) => r.featured);
}

/** Get recipe counts by marketing category */
export function getMarketingRecipeCounts(): Record<MarketingCategory, number> {
  return {
    "grow-email": getRecipesByMarketingCategory("grow-email").length,
    "boost-sales": getRecipesByMarketingCategory("boost-sales").length,
    "recover-carts": getRecipesByMarketingCategory("recover-carts").length,
    "announce": getRecipesByMarketingCategory("announce").length,
  };
}

/** Get total recipe count */
export function getTotalRecipeCount(): number {
  return MARKETING_RECIPES.length;
}

/** Get the original StyledRecipe by ID (for rendering previews) */
export function getStyledRecipeForMarketing(id: string): StyledRecipe | undefined {
  return STYLED_RECIPES.find((r) => r.id === id);
}

/** Export the full recipes for preview rendering */
export { STYLED_RECIPES };

