/**
 * Upsell & Cross-Sell Recipes
 *
 * Type-safe recipes for product upsell and cross-sell campaigns.
 * Each recipe uses ProductUpsellRecipe type for full type safety.
 *
 * Recipes:
 * 1. Complete the Look - Trigger: add_to_cart
 * 2. You Might Also Like - Trigger: product_view (time-based)
 * 3. Spend More, Save More - Trigger: cart_value threshold
 * 4. Last Chance Upsell - Trigger: exit_intent
 * 5. Frequently Bought Together - Trigger: page_load on product pages
 * 6. Post-Purchase Recommendations - Trigger: page_load on thank-you page
 * 7. Scroll-Triggered Recommendations - Trigger: scroll_depth on product pages
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
  BundleDealRecipe,
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
  {
    key: "bundleDiscountText",
    type: "text",
    label: "Bundle Discount Text",
    group: "content",
    validation: { maxLength: 50 },
  },
];

// =============================================================================
// SHARED QUICK INPUTS FOR UPSELL RECIPES
// =============================================================================

const BUNDLE_DISCOUNT_INPUT: QuickInput = {
  type: "discount_percentage",
  key: "bundleDiscount",
  label: "Bundle Discount",
  defaultValue: 15,
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
  theme: "luxury",
  layout: "centered",
  featured: true,
  recipeType: "use_case",
  inputs: [BUNDLE_DISCOUNT_INPUT, PRODUCT_SELECTION_INPUT],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Complete the Look",
      subheadline: "These items pair perfectly with your selection",
      buttonText: "Add & Continue Shopping",
      productSelectionMethod: "ai",
      layout: "carousel",
      columns: 1,
      maxProducts: 6,
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: true,
      bundleDiscount: 10,
      bundleDiscountText: "Bundle & save 10%",
      multiSelect: true,
    },
    designConfig: {
      theme: "luxury",
      position: "center",
      size: "medium",
      animation: "fade",
      mobileFullScreen: true, // Full-screen on mobile for better product browsing
    },
    targetRules: {
      enhancedTriggers: {
        add_to_cart: { enabled: true },
      },
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
  theme: "minimal",
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
      columns: 1,
      maxProducts: 3,
      showPrices: true,
      showCompareAtPrice: false,
      showImages: true,
      showRatings: false,
      bundleDiscount: 0,
      multiSelect: false,
    },
    designConfig: {
      theme: "minimal",
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
      },
      pageTargeting: {
        enabled: true,
        pages: [],
        customPatterns: ["/products/*"],
        excludePages: [],
        productTags: [],
        collections: [],
      },
    },
  },
};

// =============================================================================
// 3. SPEND MORE, SAVE MORE
// Trigger: When cart value reaches threshold
// =============================================================================

export const spendMoreSaveMore: ProductUpsellRecipe = {
  id: "upsell-spend-more-save-more",
  name: "Spend More, Save More",
  tagline: "Tiered discounts to increase AOV",
  description:
    "Show upsell products when cart reaches a value threshold. Encourage customers to add more to unlock bigger discounts.",
  icon: "💰",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "PRODUCT_UPSELL",
  tags: ["bold", "high-converting", "discount"],
  component: "ProductUpsell",
  theme: "gradient",
  layout: "centered",
  featured: true,
  recipeType: "use_case",
  inputs: [
    {
      type: "currency_amount",
      key: "cartValueThreshold",
      label: "Cart Value Threshold ($)",
      defaultValue: 50,
    },
    BUNDLE_DISCOUNT_INPUT,
    PRODUCT_SELECTION_INPUT,
  ],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "You're Almost There!",
      subheadline: "Add a bit more to unlock 20% off your entire order",
      buttonText: "Add & Save",
      productSelectionMethod: "ai",
      layout: "featured",
      columns: 2,
      maxProducts: 4,
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: false,
      bundleDiscount: 20,
      bundleDiscountText: "Unlock 20% off!",
      multiSelect: true,
    },
    designConfig: {
      theme: "gradient",
      position: "center",
      size: "large",
      animation: "bounce",
    },
    targetRules: {
      enhancedTriggers: {
        cart_value: {
          enabled: true,
          min_value: 50,
          max_value: 100,
        },
      },
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      showInPreview: true,
      behavior: "SHOW_CODE_AND_AUTO_APPLY",
      // Tiered structure - Spend more, save more
      tiers: [
        { thresholdCents: 5000, discount: { kind: "percentage", value: 10 } }, // $50 → 10%
        { thresholdCents: 10000, discount: { kind: "percentage", value: 20 } }, // $100 → 20%
        { thresholdCents: 15000, discount: { kind: "percentage", value: 30 } }, // $150 → 30%
      ],
    },
  },
};

// =============================================================================
// 4. LAST CHANCE UPSELL
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
  theme: "gradient",
  layout: "centered",
  recipeType: "use_case",
  inputs: [
    {
      ...BUNDLE_DISCOUNT_INPUT,
      defaultValue: 25,
    },
    PRODUCT_SELECTION_INPUT,
  ],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Before You Go...",
      subheadline: "Complete your order now and save 25% on these items",
      buttonText: "Add & Checkout",
      productSelectionMethod: "ai",
      layout: "grid",
      columns: 2,
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
      theme: "gradient",
      position: "center",
      size: "medium",
      animation: "bounce",
    },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true },
      },
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
  theme: "modern",
  layout: "banner-bottom",
  recipeType: "use_case",
  inputs: [BUNDLE_DISCOUNT_INPUT, MAX_PRODUCTS_INPUT],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Frequently Bought Together",
      subheadline: "Save when you bundle",
      buttonText: "Add All to Cart",
      productSelectionMethod: "ai",
      layout: "grid",
      columns: 3,
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
      theme: "modern",
      position: "bottom",
      size: "medium",
      animation: "slide",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: {
          enabled: true,
          delay: 2000,
        },
      },
      pageTargeting: {
        enabled: true,
        pages: [],
        customPatterns: ["/products/*"],
        excludePages: [],
        productTags: [],
        collections: [],
      },
    },
  },
};

// =============================================================================
// 6. POST-PURCHASE CROSS-SELL
// Trigger: Page load on thank-you/order confirmation page
// =============================================================================

export const postPurchaseCrossSell: ProductUpsellRecipe = {
  id: "upsell-post-purchase",
  name: "Post-Purchase Recommendations",
  tagline: "Cross-sell on the thank-you page",
  description:
    "Show complementary products on the order confirmation page. Customers are in a buying mood - capitalize on it!",
  icon: "🎁",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "PRODUCT_UPSELL",
  tags: ["subtle", "high-converting"],
  component: "ProductUpsell",
  theme: "modern",
  layout: "centered",
  featured: true,
  new: true,
  recipeType: "use_case",
  inputs: [BUNDLE_DISCOUNT_INPUT, PRODUCT_SELECTION_INPUT, MAX_PRODUCTS_INPUT],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Thanks for Your Order!",
      subheadline: "Customers who bought this also loved these items",
      buttonText: "Add to Order",
      productSelectionMethod: "ai",
      layout: "grid",
      columns: 3,
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
      theme: "modern",
      position: "center",
      size: "medium",
      animation: "fade",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: {
          enabled: true,
          delay: 1000,
        },
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
  theme: "minimal",
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
      columns: 1,
      maxProducts: 3,
      showPrices: true,
      showCompareAtPrice: false,
      showImages: true,
      showRatings: false,
      bundleDiscount: 0,
      multiSelect: false,
    },
    designConfig: {
      theme: "minimal",
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
      },
      pageTargeting: {
        enabled: true,
        pages: [],
        customPatterns: ["/products/*"],
        excludePages: [],
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
  theme: "modern",
  layout: "centered",
  featured: true,
  new: true,
  recipeType: "use_case",
  inputs: [BUNDLE_DISCOUNT_INPUT, PRODUCT_SELECTION_INPUT],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Special Offer Just For You",
      subheadline: "Don't miss out on this exclusive deal",
      buttonText: "Add to Cart",
      secondaryCtaLabel: "No thanks",
      productSelectionMethod: "manual",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      showRatings: true,
      discountPercent: 15,
      currency: "USD",
    },
    designConfig: {
      theme: "modern",
      position: "center",
      size: "medium",
      animation: "fade",
    },
    targetRules: {
      enhancedTriggers: {
        add_to_cart: { enabled: true },
      },
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
  theme: "minimal",
  layout: "bottom-sheet",
  new: true,
  recipeType: "use_case",
  inputs: [PRODUCT_SELECTION_INPUT],
  editableFields: UPSELL_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Complete Your Order",
      subheadline: "Add this for just",
      buttonText: "Quick Add",
      secondaryCtaLabel: "Continue shopping",
      productSelectionMethod: "ai",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      currency: "USD",
    },
    designConfig: {
      theme: "minimal",
      position: "bottom",
      size: "small",
      animation: "slide",
    },
    targetRules: {
      enhancedTriggers: {
        add_to_cart: { enabled: true },
      },
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
  theme: "luxury",
  layout: "fullscreen",
  featured: true,
  new: true,
  recipeType: "use_case",
  inputs: [BUNDLE_DISCOUNT_INPUT, PRODUCT_SELECTION_INPUT],
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
      discountPercent: 20,
      currency: "USD",
      features: [
        "Premium quality materials",
        "Free express shipping",
        "30-day money-back guarantee",
      ],
      urgencyMessage: "🔥 Limited time offer - Only 3 left in stock!",
    },
    designConfig: {
      theme: "luxury",
      position: "center",
      size: "large",
      animation: "fade",
      mobileFullScreen: true, // Full-screen on mobile for immersive experience
    },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true },
      },
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
  theme: "gradient",
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
    BUNDLE_DISCOUNT_INPUT,
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
      headline: "Flash Deal!",
      subheadline: "This exclusive offer expires soon",
      buttonText: "Claim This Deal Now",
      secondaryCtaLabel: "No thanks",
      productSelectionMethod: "manual",
      showPrices: true,
      showCompareAtPrice: true,
      showImages: true,
      discountPercent: 25,
      currency: "USD",
      expiresInSeconds: 300,
      socialProofMessage: "🔥 47 people are viewing this right now",
    },
    designConfig: {
      theme: "gradient",
      position: "center",
      size: "medium",
      animation: "fade",
    },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true },
      },
    },
  },
};

// =============================================================================
// EXPORT ALL UPSELL RECIPES
// =============================================================================

export const UPSELL_RECIPES: AnyStyledRecipe[] = [
  // Original recipes (PRODUCT_UPSELL template type)
  completeTheLook,
  productPageCrossSell,
  spendMoreSaveMore,
  lastChanceUpsell,
  frequentlyBoughtTogether,
  postPurchaseCrossSell,
  scrollBasedRecommendations,
  // New template-specific recipes
  classicUpsellModal,
  minimalSlideUp,
  premiumFullscreen,
  countdownUrgency,
];
