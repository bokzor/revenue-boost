/**
 * Upsell & Cross-Sell Recipes
 *
 * Type-safe recipes for product upsell and cross-sell campaigns.
 * Each recipe uses ProductUpsellRecipe type for full type safety.
 *
 * Recipes:
 * 1. Complete the Look - Trigger: add_to_cart
 * 2. You Might Also Like - Trigger: product_view (time-based)
 * 3. Last Chance Upsell - Trigger: exit_intent
 * 4. Frequently Bought Together - Trigger: page_load on product pages
 * 5. Post-Purchase Recommendations - Trigger: page_load on thank-you page
 * 6. Scroll-Triggered Recommendations - Trigger: scroll_depth on product pages
 *
 * Note: cart_drawer_open trigger is not reliably supported across Shopify themes,
 * so we use add_to_cart instead (cart drawer typically opens after add-to-cart).
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

import type {
  ProductUpsellRecipe,
  ClassicUpsellRecipe,
  MinimalSlideUpRecipe,
  PremiumFullscreenRecipe,
  CountdownUrgencyRecipe,
  EditableField,
  QuickInput,
  AnyStyledRecipe,
} from "./styled-recipe-types";

// =============================================================================
// SHARED EDITABLE FIELDS FOR UPSELL RECIPES
// =============================================================================

export const UPSELL_EDITABLE_FIELDS: EditableField[] = [
  {
    key: "headline",
    type: "text",
    label: "Headline",
    group: "content",
    validation: { required: true, maxLength: 100 },
  },
  {
    key: "subheadline",
    type: "text",
    label: "Description",
    group: "content",
    validation: { maxLength: 200 },
  },
  {
    key: "buttonText",
    type: "text",
    label: "Add to Cart Button",
    group: "content",
    validation: { required: true, maxLength: 30 },
  },
];

// Classic Upsell uses product name & description, so no headline/subheadline fields needed
export const CLASSIC_UPSELL_EDITABLE_FIELDS: EditableField[] = [
  {
    key: "buttonText",
    type: "text",
    label: "Add to Cart Button",
    group: "content",
    validation: { required: true, maxLength: 30 },
  },
  {
    key: "secondaryCtaLabel",
    type: "text",
    label: "Decline Button Text",
    group: "content",
    validation: { maxLength: 50 },
  },
];

// =============================================================================
// SHARED QUICK INPUTS FOR UPSELL RECIPES
// =============================================================================

// =============================================================================
// COMMON TARGETING CONFIGURATION FOR UPSELLS
// =============================================================================

// Frequency capping for upsells - allow more triggers but with limits
const UPSELL_FREQUENCY_CAPPING = {
  max_triggers_per_session: 2,
  max_triggers_per_day: 5,
  cooldown_between_triggers: 300, // 5 minutes in seconds
};

// Page targeting - exclude checkout pages to avoid disruption
const UPSELL_PAGE_TARGETING = {
  enabled: true,
  pages: [] as string[],
  customPatterns: [] as string[],
  excludePages: ["/checkout", "/checkout/*", "/*/checkouts/*"],
  productTags: [] as string[],
  collections: [] as string[],
};

const PRODUCT_SELECTION_INPUT: QuickInput = {
  type: "select",
  key: "productSelectionMethod",
  label: "Product Selection",
  defaultValue: "ai",
  options: [
    { value: "ai", label: "AI-powered recommendations" },
    { value: "manual", label: "Manually selected products" },
    { value: "collection", label: "From a collection" },
  ],
};

// Product selection input with manual as default (for single-product templates like Classic Upsell)
const PRODUCT_SELECTION_INPUT_MANUAL_DEFAULT: QuickInput = {
  type: "select",
  key: "productSelectionMethod",
  label: "Product Selection",
  defaultValue: "manual",
  options: [
    { value: "ai", label: "AI-powered recommendations" },
    { value: "manual", label: "Manually selected products" },
    { value: "collection", label: "From a collection" },
  ],
};

const MAX_PRODUCTS_INPUT: QuickInput = {
  type: "select",
  key: "maxProducts",
  label: "Max Products to Show",
  defaultValue: "4",
  options: [
    { value: "2", label: "2 products" },
    { value: "3", label: "3 products" },
    { value: "4", label: "4 products" },
    { value: "6", label: "6 products" },
  ],
};

// =============================================================================
// 1. COMPLETE THE LOOK
// Trigger: Immediately after adding item to cart
// =============================================================================

export const completeTheLook: ProductUpsellRecipe = {
  id: "upsell-complete-the-look",
  name: "Complete the Look",
  tagline: "Cross-sell right after add-to-cart",
  description:
    "Show matching products immediately after a customer adds an item to cart. Perfect for fashion, home decor, and lifestyle brands.",
  icon: "👗",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "PRODUCT_UPSELL",
  tags: ["fashion", "elegant", "high-converting"],
  component: "ProductUpsell",
  layout: "centered",
  featured: true,
  recipeType: "use_case",
  inputs: [PRODUCT_SELECTION_INPUT],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Complete the Look",
      subheadline: "These items pair perfectly with your selection",
      buttonText: "Add & Continue Shopping",
      productSelectionMethod: "ai",
      layout: "carousel",
      maxProducts: 6,
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: true,
      bundleDiscount: 15,
      bundleDiscountText: "Bundle & save 15%",
      multiSelect: true,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
      mobileFullScreen: true, // Full-screen on mobile for better product browsing
    },
    targetRules: {
      enhancedTriggers: {
        add_to_cart: { enabled: true },
        frequency_capping: UPSELL_FREQUENCY_CAPPING,
      },
      pageTargeting: UPSELL_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 2. PRODUCT PAGE CROSS-SELL
// Trigger: After viewing product for X seconds
// =============================================================================

export const productPageCrossSell: ProductUpsellRecipe = {
  id: "upsell-product-page",
  name: "You Might Also Like",
  tagline: "Cross-sell on product pages",
  description:
    "Show related products after a customer has been viewing a product page. Non-intrusive slide-in from the side.",
  icon: "💡",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "PRODUCT_UPSELL",
  tags: ["minimal", "subtle"],
  component: "ProductUpsell",
  layout: "sidebar-right",
  recipeType: "use_case",
  inputs: [
    {
      type: "select",
      key: "viewDuration",
      label: "Show after (seconds)",
      defaultValue: "15",
      options: [
        { value: "5", label: "5 seconds" },
        { value: "10", label: "10 seconds" },
        { value: "15", label: "15 seconds" },
        { value: "30", label: "30 seconds" },
      ],
    },
    PRODUCT_SELECTION_INPUT,
  ],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "You Might Also Like",
      subheadline: "Customers also viewed these",
      buttonText: "Quick Add",
      productSelectionMethod: "ai",
      layout: "card",
      maxProducts: 3,
      showPrices: true,
      showCompareAtPrice: false,
      showImages: true,
      showRatings: false,
      bundleDiscount: 0,
      multiSelect: false,
    },
    designConfig: {
      position: "right",
      size: "small",
      animation: "slide",
    },
    targetRules: {
      enhancedTriggers: {
        product_view: {
          enabled: true,
          time_on_page: 15,
        },
        frequency_capping: UPSELL_FREQUENCY_CAPPING,
      },
      pageTargeting: {
        enabled: true,
        pages: [],
        customPatterns: ["/products/*"],
        excludePages: ["/checkout", "/checkout/*", "/*/checkouts/*"],
        productTags: [],
        collections: [],
      },
    },
  },
};

// =============================================================================
// 3. LAST CHANCE UPSELL
// Trigger: Exit intent
// =============================================================================

export const lastChanceUpsell: ProductUpsellRecipe = {
  id: "upsell-last-chance",
  name: "Last Chance Upsell",
  tagline: "Capture leaving visitors with a deal",
  description:
    "Show a compelling upsell offer when visitors are about to leave. Create urgency with limited-time bundle discounts.",
  icon: "⏰",
  category: "cart_recovery",
  goal: "INCREASE_REVENUE",
  templateType: "PRODUCT_UPSELL",
  tags: ["urgent", "exit-intent", "high-converting"],
  component: "ProductUpsell",
  layout: "centered",
  recipeType: "use_case",
  inputs: [PRODUCT_SELECTION_INPUT],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Before You Go...",
      subheadline: "Complete your order now and save on these items",
      buttonText: "Add & Checkout",
      productSelectionMethod: "ai",
      layout: "grid",
      maxProducts: 3,
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: false,
      bundleDiscount: 25,
      bundleDiscountText: "Limited time: 25% off bundle",
      multiSelect: true,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "bounce",
    },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true },
        frequency_capping: UPSELL_FREQUENCY_CAPPING,
      },
      pageTargeting: UPSELL_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 5. FREQUENTLY BOUGHT TOGETHER
// Trigger: Page load on product pages
// =============================================================================

export const frequentlyBoughtTogether: ProductUpsellRecipe = {
  id: "upsell-frequently-bought-together",
  name: "Frequently Bought Together",
  tagline: "Amazon-style product bundles",
  description:
    "Show products frequently purchased together. Classic cross-sell strategy that works for any store.",
  icon: "🔗",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "PRODUCT_UPSELL",
  tags: ["minimal", "subtle", "high-converting"],
  component: "ProductUpsell",
  layout: "banner-bottom",
  recipeType: "use_case",
  inputs: [MAX_PRODUCTS_INPUT],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Frequently Bought Together",
      subheadline: "Save when you bundle",
      buttonText: "Add All to Cart",
      productSelectionMethod: "ai",
      layout: "grid",
      maxProducts: 3,
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: true,
      showReviewCount: true,
      bundleDiscount: 10,
      bundleDiscountText: "Bundle price:",
      multiSelect: true,
    },
    designConfig: {
      position: "bottom",
      size: "medium",
      animation: "slide",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: {
          enabled: true,
          delay: 3,
        },
        frequency_capping: UPSELL_FREQUENCY_CAPPING,
      },
      pageTargeting: {
        enabled: true,
        pages: [],
        customPatterns: ["/products/*"],
        excludePages: ["/checkout", "/checkout/*", "/*/checkouts/*"],
        productTags: [],
        collections: [],
      },
    },
  },
};

// =============================================================================
// 6. THANK-YOU PAGE CROSS-SELL (Popup-based)
// Trigger: Page load on thank-you/order confirmation page
//
// NOTE: This is a POPUP-based implementation that displays on the thank-you page.
// When customers select products and click "Add to Cart", they are redirected to
// a NEW cart with the selected items - this creates a SECOND ORDER, not modifying
// the original order.
//
// TODO: Implement Shopify's native Post-Purchase Checkout Extension for true
// one-click upsells that modify the existing order. Key differences:
// - Appears BETWEEN checkout completion and thank-you page
// - Uses vaulted payment method for one-click purchase
// - Modifies the EXISTING order (no second checkout needed)
// - Limitations: Credit card only, beta access required, single app per store
// - See: https://shopify.dev/docs/apps/build/checkout/product-offers#post-purchase-product-offers
// - CLI: shopify app generate extension --template post_purchase_ui
// =============================================================================

export const postPurchaseCrossSell: ProductUpsellRecipe = {
  id: "upsell-post-purchase",
  name: "Thank-You Page Recommendations",
  tagline: "Cross-sell popup on the order confirmation page",
  description:
    "Show a popup with complementary products on the thank-you page. Customers can add items to a new cart for a follow-up purchase. Works with ALL payment methods (unlike native post-purchase extensions).",
  icon: "🎁",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "PRODUCT_UPSELL",
  tags: ["subtle", "high-converting"],
  component: "ProductUpsell",
  layout: "centered",
  featured: true,
  new: false,
  recipeType: "use_case",
  inputs: [PRODUCT_SELECTION_INPUT, MAX_PRODUCTS_INPUT],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Thanks for Your Order!",
      subheadline: "Customers who bought this also loved these items",
      buttonText: "Add to Cart",
      productSelectionMethod: "ai",
      layout: "grid",
      maxProducts: 3,
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: true,
      bundleDiscount: 10,
      bundleDiscountText: "Add now and save 10%",
      multiSelect: true,
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: {
          enabled: true,
          delay: 2,
        },
        frequency_capping: UPSELL_FREQUENCY_CAPPING,
      },
      pageTargeting: {
        enabled: true,
        pages: [],
        customPatterns: ["/*/orders/*", "/checkouts/*/thank_you"],
        excludePages: [],
        productTags: [],
        collections: [],
      },
    },
  },
};

// =============================================================================
// 7. SCROLL-BASED RECOMMENDATIONS
// Trigger: After scrolling 60% on product pages
// =============================================================================

export const scrollBasedRecommendations: ProductUpsellRecipe = {
  id: "upsell-scroll-based",
  name: "Scroll-Triggered Recommendations",
  tagline: "Show products when users are engaged",
  description:
    "Display product recommendations after customers scroll 60% of the page. Less intrusive than time-based triggers - only shows to engaged visitors.",
  icon: "📜",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "PRODUCT_UPSELL",
  tags: ["minimal", "subtle"],
  component: "ProductUpsell",
  layout: "sidebar-right",
  recipeType: "use_case",
  inputs: [
    {
      type: "select",
      key: "scrollDepth",
      label: "Trigger at scroll depth",
      defaultValue: "60",
      options: [
        { value: "30", label: "30% - Early scroll" },
        { value: "50", label: "50% - Halfway" },
        { value: "60", label: "60% - Engaged (recommended)" },
        { value: "75", label: "75% - Near bottom" },
      ],
    },
    PRODUCT_SELECTION_INPUT,
    MAX_PRODUCTS_INPUT,
  ],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "More to Explore",
      subheadline: "Based on what you're browsing",
      buttonText: "Quick Add",
      productSelectionMethod: "ai",
      layout: "card",
      maxProducts: 3,
      showPrices: true,
      showCompareAtPrice: false,
      showImages: true,
      showRatings: false,
      bundleDiscount: 0,
      multiSelect: false,
    },
    designConfig: {
      position: "right",
      size: "small",
      animation: "slide",
    },
    targetRules: {
      enhancedTriggers: {
        scroll_depth: {
          enabled: true,
          depth_percentage: 60,
          direction: "down",
        },
        frequency_capping: UPSELL_FREQUENCY_CAPPING,
      },
      pageTargeting: {
        enabled: true,
        pages: [],
        customPatterns: ["/products/*"],
        excludePages: ["/checkout", "/checkout/*", "/*/checkouts/*"],
        productTags: [],
        collections: [],
      },
    },
  },
};

// =============================================================================
// 8. CLASSIC UPSELL MODAL
// Template: CLASSIC_UPSELL - Traditional centered modal with image, pricing, and clear CTAs
// =============================================================================

export const classicUpsellModal: ClassicUpsellRecipe = {
  id: "upsell-classic-modal",
  name: "Classic Upsell Modal",
  tagline: "Traditional centered popup for single product offers",
  description:
    "Clean, focused modal that highlights a single product with clear pricing and call-to-action. Perfect for hero product promotions and seasonal specials.",
  icon: "🎯",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "CLASSIC_UPSELL",
  tags: ["centered", "high-converting"],
  component: "ClassicUpsellPopup",
  layout: "centered",
  featured: true,
  new: true,
  recipeType: "use_case",
  inputs: [PRODUCT_SELECTION_INPUT_MANUAL_DEFAULT],
  editableFields: CLASSIC_UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      // headline/subheadline not used - Classic Upsell displays product.title & product.description
      buttonText: "Add to Cart",
      secondaryCtaLabel: "No thanks",
      productSelectionMethod: "manual",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: true,
      bundleDiscount: 15,
      currency: "USD",
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
    },
    targetRules: {
      enhancedTriggers: {
        add_to_cart: { enabled: true },
        frequency_capping: UPSELL_FREQUENCY_CAPPING,
      },
      pageTargeting: UPSELL_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 9. MINIMAL SLIDE-UP
// Template: MINIMAL_SLIDE_UP - Compact bottom sheet for mobile-first experiences
// =============================================================================

export const minimalSlideUp: MinimalSlideUpRecipe = {
  id: "upsell-minimal-slide-up",
  name: "Minimal Slide-Up",
  tagline: "Non-intrusive bottom sheet for mobile shoppers",
  description:
    "Compact, mobile-optimized slide-up panel that doesn't interrupt the shopping experience. Ideal for subtle cross-sells and quick add-to-cart flows.",
  icon: "📱",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "MINIMAL_SLIDE_UP",
  tags: ["minimal", "subtle"],
  component: "MinimalSlideUpPopup",
  layout: "bottom-sheet",
  new: true,
  recipeType: "use_case",
  inputs: [PRODUCT_SELECTION_INPUT],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      // headline/subheadline not used - Minimal Slide-Up displays product.title & product.description
      buttonText: "Quick Add",
      secondaryCtaLabel: "Continue shopping",
      productSelectionMethod: "ai",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      currency: "USD",
    },
    designConfig: {
      position: "bottom",
      size: "medium",
      animation: "slide",
    },
    targetRules: {
      enhancedTriggers: {
        add_to_cart: { enabled: true },
        frequency_capping: UPSELL_FREQUENCY_CAPPING,
      },
      pageTargeting: UPSELL_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 10. PREMIUM FULLSCREEN EXPERIENCE
// Template: PREMIUM_FULLSCREEN - Immersive full-page takeover for high-value products
// =============================================================================

export const premiumFullscreen: PremiumFullscreenRecipe = {
  id: "upsell-premium-fullscreen",
  name: "Premium Fullscreen Experience",
  tagline: "Immersive full-page offer for luxury products",
  description:
    "Stunning fullscreen takeover that showcases premium products with rich imagery, feature lists, and ratings. Best for high-ticket items where visual impact drives conversions.",
  icon: "💎",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "PREMIUM_FULLSCREEN",
  tags: ["fullscreen", "elegant", "high-converting"],
  component: "PremiumFullscreenPopup",
  layout: "fullscreen",
  featured: true,
  new: true,
  recipeType: "use_case",
  inputs: [PRODUCT_SELECTION_INPUT],
  editableFields: [
    ...UPSELL_EDITABLE_FIELDS,
    {
      key: "features",
      type: "text",
      label: "Product Features (comma-separated)",
      group: "content",
      validation: { maxLength: 500 },
    },
    {
      key: "urgencyMessage",
      type: "text",
      label: "Urgency Message",
      group: "content",
      validation: { maxLength: 100 },
    },
  ],
  defaults: {
    contentConfig: {
      headline: "Exclusive Offer",
      subheadline: "Upgrade your experience with our premium selection",
      buttonText: "Claim This Deal",
      secondaryCtaLabel: "Maybe later",
      productSelectionMethod: "manual",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: true,
      showReviewCount: true,
      bundleDiscount: 20,
      currency: "USD",
      features: [
        "Premium quality materials",
        "Free express shipping",
        "30-day money-back guarantee",
      ],
      urgencyMessage: "🔥 Limited time offer - Only 3 left in stock!",
    },
    designConfig: {
      position: "center",
      size: "large",
      animation: "fade",
      mobileFullScreen: true, // Full-screen on mobile for immersive experience
    },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true },
        frequency_capping: UPSELL_FREQUENCY_CAPPING,
      },
      pageTargeting: UPSELL_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// 12. COUNTDOWN URGENCY
// Template: COUNTDOWN_URGENCY - Time-limited offer with live countdown timer
// =============================================================================

export const countdownUrgency: CountdownUrgencyRecipe = {
  id: "upsell-countdown-urgency",
  name: "Flash Deal Countdown",
  tagline: "Create urgency with a live countdown timer",
  description:
    "Time-limited offers that create genuine urgency. The countdown timer drives immediate action and auto-closes when expired. Perfect for flash sales and limited inventory.",
  icon: "⏱️",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "COUNTDOWN_URGENCY",
  tags: ["urgent", "high-converting"],
  component: "CountdownUrgencyPopup",
  layout: "centered",
  featured: true,
  new: true,
  recipeType: "use_case",
  inputs: [
    {
      type: "select",
      key: "expiresInSeconds",
      label: "Countdown Duration",
      defaultValue: "300",
      options: [
        { value: "60", label: "1 minute" },
        { value: "180", label: "3 minutes" },
        { value: "300", label: "5 minutes (recommended)" },
        { value: "600", label: "10 minutes" },
        { value: "900", label: "15 minutes" },
      ],
    },
    PRODUCT_SELECTION_INPUT,
  ],
  editableFields: [
    ...UPSELL_EDITABLE_FIELDS,
    {
      key: "socialProofMessage",
      type: "text",
      label: "Social Proof Message",
      group: "content",
      validation: { maxLength: 150 },
    },
  ],
  defaults: {
    contentConfig: {
      // headline/subheadline not used - Countdown Urgency displays product.title & product.description
      buttonText: "Claim This Deal Now",
      secondaryCtaLabel: "No thanks",
      productSelectionMethod: "manual",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      bundleDiscount: 25,
      currency: "USD",
      expiresInSeconds: 300,
      socialProofMessage: "🔥 47 people are viewing this right now",
    },
    designConfig: {
      position: "center",
      size: "medium",
      animation: "fade",
    },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true },
        frequency_capping: UPSELL_FREQUENCY_CAPPING,
      },
      pageTargeting: UPSELL_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// NORMALIZE DISCOUNT CONFIG FOR ALL UPSELL RECIPES
// =============================================================================

function ensureUpsellDiscountConfig(recipe: AnyStyledRecipe): AnyStyledRecipe {
  if (!("defaults" in recipe) || !recipe.defaults) return recipe;

  const defaults = recipe.defaults as {
    contentConfig?: { bundleDiscount?: number; bundleDiscountText?: string };
    discountConfig?: Partial<{
      enabled: boolean;
      showInPreview?: boolean;
      strategy?: "bundle" | "tiered" | "bogo" | "free_gift" | "simple";
      valueType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
      value?: number;
      behavior?: "SHOW_CODE_AND_AUTO_APPLY" | "SHOW_CODE_ONLY" | "SHOW_CODE_AND_ASSIGN_TO_EMAIL";
      applicability?: {
        scope: "all" | "cart" | "products" | "collections";
        productIds?: string[];
        collectionIds?: string[];
      };
      tiers?: unknown[];
      bogo?: unknown;
      freeGift?: unknown;
    }>;
  };

  // Read legacy bundleDiscount from contentConfig (for backward compatibility during migration)
  const bundleValue = defaults.contentConfig?.bundleDiscount;
  const existing = defaults.discountConfig;

  const nextDiscountConfig =
    existing !== undefined
      ? {
          ...existing,
          enabled: existing.enabled ?? true,
          showInPreview: existing.showInPreview ?? true,
          strategy:
            existing.strategy ||
            (existing.tiers && (existing.tiers as unknown[]).length > 0
              ? "tiered"
              : existing.bogo
                ? "bogo"
                : existing.freeGift
                  ? "free_gift"
                  : bundleValue
                    ? "bundle"
                    : "simple"),
          // Bundle strategy only supports PERCENTAGE
          valueType: "PERCENTAGE" as const,
          value: existing.value ?? bundleValue ?? 15,
          behavior: (existing.behavior || "SHOW_CODE_AND_AUTO_APPLY") as "SHOW_CODE_AND_AUTO_APPLY" | "SHOW_CODE_ONLY" | "SHOW_CODE_AND_ASSIGN_TO_EMAIL",
          applicability:
            existing.applicability || (bundleValue ? { scope: "products" as const } : undefined),
        }
      : {
          enabled: true,
          showInPreview: true,
          strategy: "bundle",
          valueType: "PERCENTAGE" as const,
          value: bundleValue ?? 15,
          behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
          applicability: { scope: "products" as const },
        };

  // Remove deprecated bundleDiscount and bundleDiscountText from contentConfig
  // discountConfig is now the single source of truth
  const { bundleDiscount: _bd, bundleDiscountText: _bdt, ...cleanedContentConfig } =
    (defaults.contentConfig || {}) as Record<string, unknown>;

  return {
    ...recipe,
    defaults: {
      ...defaults,
      contentConfig: cleanedContentConfig,
      // Type assertion needed because we're constructing a partial config that will be merged with defaults
      discountConfig: nextDiscountConfig as AnyStyledRecipe["defaults"] extends { discountConfig?: infer D } ? D : never,
    },
  };
}

// =============================================================================
// EXPORT ALL UPSELL RECIPES
// =============================================================================

export const UPSELL_RECIPES: AnyStyledRecipe[] = [
  // Original recipes (PRODUCT_UPSELL template type)
  completeTheLook,
  productPageCrossSell,
  lastChanceUpsell,
  frequentlyBoughtTogether,
  postPurchaseCrossSell,
  scrollBasedRecommendations,
  // New template-specific recipes
  classicUpsellModal,
  minimalSlideUp,
  premiumFullscreen,
  countdownUrgency,
].map(ensureUpsellDiscountConfig);
