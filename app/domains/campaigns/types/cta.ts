/**
 * CTA (Call-to-Action) Configuration Types
 *
 * Unified CTA system for popup buttons with support for:
 * - Navigation (product, collection, URL)
 * - Cart actions (add to cart, add + checkout)
 * - Discount application
 *
 * @see docs/CTA_SYSTEM.md for architecture details
 */

import { z } from "zod";

// =============================================================================
// CTA ACTION TYPES
// =============================================================================

/**
 * Available CTA actions:
 * - navigate_url: Go to any URL
 * - navigate_product: Go to a specific product page
 * - navigate_collection: Go to a collection page
 * - add_to_cart: Add product to cart (stays on page)
 * - add_to_cart_checkout: Add product to cart + go to checkout
 */
export const CTAActionSchema = z.enum([
  "navigate_url",
  "navigate_product",
  "navigate_collection",
  "add_to_cart",
  "add_to_cart_checkout",
]);

export type CTAAction = z.infer<typeof CTAActionSchema>;

// =============================================================================
// CTA CONFIGURATION SCHEMA
// =============================================================================

/**
 * Primary CTA Configuration
 *
 * Used for the main action button in popups.
 */
export const CTAConfigSchema = z.object({
  // Display
  label: z.string().min(1, "Button label is required"),
  variant: z.enum(["primary", "secondary", "link"]).default("primary"),

  // Action type
  action: CTAActionSchema,

  // Navigation config (for navigate_* actions)
  url: z.string().optional(), // For navigate_url
  productId: z.string().optional(), // Shopify product GID for navigate_product
  productHandle: z.string().optional(), // Product handle for URL generation
  collectionId: z.string().optional(), // Shopify collection GID
  collectionHandle: z.string().optional(), // Collection handle for URL generation
  openInNewTab: z.boolean().default(false),

  // Cart config (for add_to_cart* actions)
  variantId: z.string().optional(), // Shopify variant GID to add
  quantity: z.number().int().min(1).default(1),

  // Discount integration
  applyDiscountFirst: z.boolean().default(true), // Apply discount before action
});

export type CTAConfig = z.infer<typeof CTAConfigSchema>;

// =============================================================================
// SECONDARY CTA (Dismiss button)
// =============================================================================

export const SecondaryCTAConfigSchema = z.object({
  label: z.string().default("No thanks"),
  action: z.enum(["dismiss", "navigate_url"]).default("dismiss"),
  url: z.string().optional(),
});

export type SecondaryCTAConfig = z.infer<typeof SecondaryCTAConfigSchema>;

// =============================================================================
// ACTION LABELS & OPTIONS (for Admin UI)
// =============================================================================

export const CTA_ACTION_OPTIONS: Array<{
  value: CTAAction;
  label: string;
  description: string;
  requiresProduct?: boolean;
  requiresCollection?: boolean;
  requiresUrl?: boolean;
  requiresVariant?: boolean;
}> = [
  {
    value: "navigate_collection",
    label: "Go to Collection",
    description: "Navigate to a collection page",
    requiresCollection: true,
  },
  {
    value: "navigate_product",
    label: "Go to Product",
    description: "Navigate to a product page",
    requiresProduct: true,
  },
  {
    value: "navigate_url",
    label: "Go to URL",
    description: "Navigate to any URL",
    requiresUrl: true,
  },
  {
    value: "add_to_cart",
    label: "Add to Cart",
    description: "Add a product to cart (stay on page)",
    requiresVariant: true,
  },
  {
    value: "add_to_cart_checkout",
    label: "Add to Cart + Checkout",
    description: "Add a product to cart and go to checkout",
    requiresVariant: true,
  },
];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get the action option config by action type
 */
export function getCTAActionOption(action: CTAAction) {
  return CTA_ACTION_OPTIONS.find((opt) => opt.value === action);
}

/**
 * Validate CTA config has required fields for its action type
 */
export function validateCTAConfig(config: CTAConfig): string[] {
  const errors: string[] = [];
  const actionOption = getCTAActionOption(config.action);

  if (!actionOption) {
    errors.push(`Unknown action type: ${config.action}`);
    return errors;
  }

  if (actionOption.requiresProduct && !config.productId && !config.productHandle) {
    errors.push("Product is required for this action");
  }

  if (actionOption.requiresCollection && !config.collectionId && !config.collectionHandle) {
    errors.push("Collection is required for this action");
  }

  if (actionOption.requiresUrl && !config.url) {
    errors.push("URL is required for this action");
  }

  if (actionOption.requiresVariant && !config.variantId) {
    errors.push("Product variant is required for this action");
  }

  return errors;
}

/**
 * Build the destination URL for navigation actions
 */
export function buildCTADestinationUrl(config: CTAConfig): string | null {
  switch (config.action) {
    case "navigate_url":
      return config.url || null;

    case "navigate_product":
      if (config.productHandle) {
        return `/products/${config.productHandle}`;
      }
      return null;

    case "navigate_collection":
      if (config.collectionHandle) {
        return `/collections/${config.collectionHandle}`;
      }
      return null;

    case "add_to_cart_checkout":
      return "/checkout";

    case "add_to_cart":
      return null; // Stay on page

    default:
      return null;
  }
}

// =============================================================================
// DEFAULT CTA CONFIGS (for recipes)
// =============================================================================

export const DEFAULT_CTA_CONFIGS = {
  /** BOGO: Add the free product to cart */
  bogo: {
    label: "Get My BOGO Deal",
    action: "add_to_cart" as const,
    variant: "primary" as const,
    applyDiscountFirst: true,
    quantity: 1,
  },

  /** Flash Sale: Go to sale collection */
  flashSale: {
    label: "Shop the Sale",
    action: "navigate_collection" as const,
    variant: "primary" as const,
    collectionHandle: "sale",
    applyDiscountFirst: true,
  },

  /** Free Gift: Add gift to cart + checkout */
  freeGift: {
    label: "Claim My Free Gift",
    action: "add_to_cart_checkout" as const,
    variant: "primary" as const,
    applyDiscountFirst: true,
    quantity: 1,
  },

  /** Generic: Navigate to all products */
  default: {
    label: "Shop Now",
    action: "navigate_collection" as const,
    variant: "primary" as const,
    collectionHandle: "all",
    applyDiscountFirst: true,
  },
} satisfies Record<string, Partial<CTAConfig>>;

