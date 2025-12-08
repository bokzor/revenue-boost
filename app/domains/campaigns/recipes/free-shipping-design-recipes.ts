/**
 * Free Shipping Design Recipes
 *
 * Use-case focused recipes for free shipping bar campaigns.
 * These are banner-style notifications that show progress toward free shipping.
 */

import type { FreeShippingRecipe, RecipeTag } from "./styled-recipe-types";

// =============================================================================
// HELPER: Common editable fields for free shipping recipes
// =============================================================================

const THRESHOLD_FIELD = {
  key: "threshold",
  type: "number" as const,
  label: "Free Shipping Threshold ($)",
  group: "content",
  validation: { required: true, min: 0 },
};

const PROGRESS_MESSAGE_FIELD = {
  key: "progressMessage",
  type: "text" as const,
  label: "Progress Message",
  group: "content",
  validation: { required: true, maxLength: 100 },
};

const UNLOCKED_MESSAGE_FIELD = {
  key: "unlockedMessage",
  type: "text" as const,
  label: "Unlocked Message",
  group: "content",
  validation: { required: true, maxLength: 100 },
};

const THRESHOLD_INPUT = {
  type: "currency_amount" as const,
  key: "threshold",
  label: "Free Shipping Threshold",
  defaultValue: 50,
};

const FREE_SHIPPING_EDITABLE_FIELDS = [
  THRESHOLD_FIELD,
  PROGRESS_MESSAGE_FIELD,
  UNLOCKED_MESSAGE_FIELD,
];

// =============================================================================
// COMMON TARGETING CONFIGURATION FOR FREE SHIPPING
// =============================================================================

// Frequency capping - persistent bar that shows on every page until dismissed
// This is NOT a popup - it's a helpful progress bar that motivates higher AOV
const FREE_SHIPPING_FREQUENCY_CAPPING = {
  max_triggers_per_session: 999, // Essentially unlimited - show on every page
  max_triggers_per_day: 999,
  cooldown_between_triggers: 0, // No cooldown - show immediately on each page
  dismiss_for_session: true, // Once user closes, stay closed for the session
};

// Page targeting - show on all shopping pages, exclude checkout
const FREE_SHIPPING_PAGE_TARGETING = {
  enabled: true,
  pages: [] as string[],
  customPatterns: [] as string[],
  excludePages: ["/checkout", "/checkout/*", "/*/checkouts/*"],
  productTags: [] as string[],
  collections: [] as string[],
};

// =============================================================================
// 🎯 FREE SHIPPING RECIPES
// =============================================================================

/**
 * 1. CLASSIC FREE SHIPPING BAR
 * Use case: Standard free shipping progress bar at $50 threshold
 * Best for: Most e-commerce stores with free shipping offers
 */
const classicFreeShipping: FreeShippingRecipe = {
  id: "free-shipping-classic",
  name: "Free Shipping Bar",
  tagline: "Show customers how close they are to free shipping",
  description:
    "A progress bar that encourages customers to add more items to unlock free shipping. Proven to increase average order value.",
  icon: "🚚",
  category: "cart_recovery",
  goal: "INCREASE_REVENUE",
  templateType: "FREE_SHIPPING",
  recipeType: "use_case",
  component: "FreeShippingBar",
  theme: "minimal",
  layout: "centered",
  featured: true,
  tags: ["free-shipping", "cart-recovery", "high-converting", "minimal"] as RecipeTag[],
  inputs: [THRESHOLD_INPUT],
  editableFields: FREE_SHIPPING_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      threshold: 50,
      currency: "$",
      nearMissThreshold: 10,
      barPosition: "top",
      emptyMessage: "Free shipping on orders over $50!",
      progressMessage: "You're {remaining} away from FREE shipping!",
      nearMissMessage: "Almost there! Just {remaining} more for FREE shipping!",
      unlockedMessage: "🎉 You've unlocked FREE shipping!",
      dismissible: true,
      showIcon: true,
      celebrateOnUnlock: true,
      requireEmailToClaim: false,
    },
    designConfig: {
      position: "top",
      size: "small",
      borderRadius: 0,
      animation: "slide",
      themeMode: "default",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true },
        cart_value: {
          enabled: true,
          min_value: 0,
          max_value: 50,
          check_interval: 2000,
        },
        frequency_capping: FREE_SHIPPING_FREQUENCY_CAPPING,
      },
      pageTargeting: FREE_SHIPPING_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      valueType: "FREE_SHIPPING",
      behavior: "SHOW_CODE_AND_AUTO_APPLY",
      expiryDays: 30,
      minimumAmount: 50,
    },
  },
};

// =============================================================================
// EXPORT
// =============================================================================

export const FREE_SHIPPING_DESIGN_RECIPES: FreeShippingRecipe[] = [classicFreeShipping];

