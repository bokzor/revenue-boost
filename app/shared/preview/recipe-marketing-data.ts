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
  // === SPIN TO WIN (Gamification - visually engaging) ===
  "spin-to-win-neon-nights",       // Neon cyberpunk style
  "spin-to-win-lucky-fortune",     // Luxury gold/black
  "spin-to-win-retro-arcade",      // Fun retro gaming style
  "spin-to-win-pastel-dream",      // Soft beauty/cosmetics
  "spin-to-win-ocean-breeze",      // Fresh surf/beach
  "spin-to-win-earthy-organic",    // Natural organic style
  "spin-to-win-minimal-mono",      // Clean minimal

  // === SCRATCH CARDS (Gamification - unique interactions) ===
  "scratch-card-golden-reveal",    // Luxury gold
  "scratch-card-holographic-hype", // Gen-Z vibrant
  "scratch-card-neon-arcade",      // Gaming neon
  "scratch-card-rose-gold-dream",  // Beauty/cosmetics
  "scratch-card-holiday-magic",    // Festive seasonal

  // === NEWSLETTERS (With background images - high visual impact) ===
  "newsletter-elegant-luxe",       // High-end fashion
  "newsletter-street-style",       // Urban streetwear
  "newsletter-fresh-organic",      // Fresh food/organic
  "newsletter-cafe-warm",          // Coffee/bakery
  "newsletter-soft-glow",          // Beauty/skincare
  "newsletter-spa-serenity",       // Wellness/spa
  "newsletter-scandinavian",       // Home/furniture
  "newsletter-cozy-comfort",       // Bedding/home
  "newsletter-bold-energy",        // Fitness/sports
  "newsletter-active-life",        // Outdoor/adventure
  "newsletter-dark-mode",          // Tech/SaaS
  "newsletter-minimal-tech",       // Clean tech

  // === FLASH SALES (Seasonal - unique backgrounds) ===
  "black-friday-sale",             // Black Friday
  "new-year-sale",                 // New Year
  "valentine-sale",                // Valentine's Day
  "halloween-sale",                // Halloween
  "winter-sale",                   // Winter
  "summer-sale",                   // Summer
  "flash-sale",                    // Classic flash sale
  "mystery-discount",              // Gamified mystery reveal
  "first-purchase",                // Welcome discount
  "free-gift-with-purchase",       // Free gift offer

  // === UPSELLS (Different layouts - good variety) ===
  "upsell-complete-the-look",      // Post add-to-cart
  "upsell-frequently-bought-together", // Amazon-style bundle
  "upsell-premium-fullscreen",     // Luxury fullscreen
  "upsell-countdown-urgency",      // Flash deal with timer

  // === CART RECOVERY (Different approaches) ===
  "cart-discount-incentive",       // Discount to complete order
  "cart-urgency-scarcity",         // FOMO/urgency
  "free-shipping-classic",         // Free shipping bar

  // === ANNOUNCEMENTS (Keep only 2 distinctive ones) ===
  "announcement-black-friday",     // Black Friday banner
  "announcement-flash-deal",       // Flash deal with timer

  // === SOCIAL PROOF (Keep only 2 distinctive ones) ===
  "social-proof-recent-purchases", // Classic purchase notifications
  "social-proof-luxury",           // Luxury brand style
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

