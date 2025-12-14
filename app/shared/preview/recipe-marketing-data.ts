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
// CURATED RECIPE LIST FOR MARKETING WEBSITE
// =============================================================================

/**
 * Curated list of recipe IDs for the marketing website.
 * - Ordered by visual impact (most interesting/unique first)
 * - Removes duplicate/similar designs
 * - Reduces banners and social proof (less visually distinct)
 * - Prioritizes gamification (spin-to-win, scratch cards) and newsletters (with images)
 */
const CURATED_RECIPE_IDS: string[] = [
  // === MIXED ORDER FOR VISUAL VARIETY ===
  // Alternating between different template types for a more engaging showcase

  // Row 1: Gamification + Newsletter + Flash Sale
  "spin-to-win-neon-nights",       // Spin - Neon cyberpunk
  "newsletter-elegant-luxe",       // Newsletter - High-end fashion
  "black-friday-sale",             // Flash Sale - Black Friday

  // Row 2: Scratch + Newsletter + Upsell
  "scratch-card-golden-reveal",    // Scratch - Luxury gold
  "newsletter-street-style",       // Newsletter - Urban streetwear
  "upsell-premium-fullscreen",     // Upsell - Luxury fullscreen

  // Row 3: Spin + Newsletter + Flash Sale
  "spin-to-win-lucky-fortune",     // Spin - Luxury gold/black
  "newsletter-fresh-organic",      // Newsletter - Fresh food/organic
  "valentine-sale",                // Flash Sale - Valentine's Day

  // Row 4: Scratch + Newsletter + Upsell
  "scratch-card-holographic-hype", // Scratch - Gen-Z vibrant
  "newsletter-cafe-warm",          // Newsletter - Coffee/bakery
  "upsell-complete-the-look",      // Upsell - Post add-to-cart

  // Row 5: Spin + Newsletter + Flash Sale
  "spin-to-win-retro-arcade",      // Spin - Fun retro gaming
  "newsletter-soft-glow",          // Newsletter - Beauty/skincare
  "halloween-sale",                // Flash Sale - Halloween

  // Row 6: Scratch + Newsletter + Cart
  "scratch-card-neon-arcade",      // Scratch - Gaming neon
  "newsletter-spa-serenity",       // Newsletter - Wellness/spa
  "cart-discount-incentive",       // Cart - Discount to complete

  // Row 7: Spin + Newsletter + Flash Sale
  "spin-to-win-pastel-dream",      // Spin - Soft beauty/cosmetics
  "newsletter-scandinavian",       // Newsletter - Home/furniture
  "new-year-sale",                 // Flash Sale - New Year

  // Row 8: Scratch + Newsletter + Upsell
  "scratch-card-rose-gold-dream",  // Scratch - Beauty/cosmetics
  "newsletter-cozy-comfort",       // Newsletter - Bedding/home
  "upsell-frequently-bought-together", // Upsell - Bundle

  // Row 9: Spin + Newsletter + Flash Sale
  "spin-to-win-ocean-breeze",      // Spin - Fresh surf/beach
  "newsletter-bold-energy",        // Newsletter - Fitness/sports
  "winter-sale",                   // Flash Sale - Winter

  // Row 10: Remaining items mixed
  "scratch-card-holiday-magic",    // Scratch - Festive seasonal
  "newsletter-active-life",        // Newsletter - Outdoor/adventure
  "summer-sale",                   // Flash Sale - Summer

  // Row 11: More variety
  "spin-to-win-earthy-organic",    // Spin - Natural organic
  "newsletter-dark-mode",          // Newsletter - Tech/SaaS
  "flash-sale",                    // Flash Sale - Classic

  // Row 12: Final mix
  "spin-to-win-minimal-mono",      // Spin - Clean minimal
  "newsletter-minimal-tech",       // Newsletter - Clean tech
  "mystery-discount",              // Flash Sale - Mystery reveal

  // Remaining items
  "first-purchase",                // Welcome discount
  "free-gift-with-purchase",       // Free gift offer
  "upsell-countdown-urgency",      // Upsell - Flash deal with timer
  "cart-urgency-scarcity",         // Cart - FOMO/urgency
  "free-shipping-classic",         // Free shipping bar
  "announcement-black-friday",     // Announcement - Black Friday
  "announcement-flash-deal",       // Announcement - Flash deal
  "social-proof-recent-purchases", // Social Proof - Purchase notifications
  "social-proof-luxury",           // Social Proof - Luxury brand
];

// =============================================================================
// EXPORTS
// =============================================================================

/** All recipes formatted for marketing (curated and ordered) */
export const MARKETING_RECIPES: MarketingRecipe[] = CURATED_RECIPE_IDS
  .map(id => STYLED_RECIPES.find(r => r.id === id))
  .filter((r): r is StyledRecipe => r !== undefined)
  .map(toMarketingRecipe);

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

