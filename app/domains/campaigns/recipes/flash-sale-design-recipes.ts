/**
 * Flash Sale Design Recipes
 *
 * Use-case focused recipes for sales and promotional campaigns.
 *
 * Structure:
 * 1. USE CASE RECIPES (Primary) - Business strategies like BOGO, Tiered, etc.
 * 2. SEASONAL QUICK-STARTS (Secondary) - Pre-themed seasonal variants
 *
 * Each use-case recipe focuses on a specific business goal, while seasonal
 * recipes are quick-start templates that apply a theme + copy to Flash Sale.
 */

import type { FlashSaleRecipe } from "./styled-recipe-types";

// =============================================================================
// HELPER: Common editable fields for flash sale recipes
// =============================================================================

const HEADLINE_FIELD = {
  key: "headline",
  type: "text" as const,
  label: "Headline",
  group: "content",
  validation: { required: true, maxLength: 100 },
};

const SUBHEADLINE_FIELD = {
  key: "subheadline",
  type: "text" as const,
  label: "Subheadline",
  group: "content",
  validation: { maxLength: 200 },
};

const BUTTON_TEXT_FIELD = {
  key: "buttonText",
  type: "text" as const,
  label: "Button Text",
  group: "content",
  validation: { required: true, maxLength: 30 },
};

const DISCOUNT_PERCENTAGE_INPUT = {
  type: "discount_percentage" as const,
  key: "discountValue",
  label: "Discount Percentage",
  defaultValue: 20,
};

const DURATION_HOURS_INPUT = {
  type: "duration_hours" as const,
  key: "durationHours",
  label: "Sale Duration (hours)",
  defaultValue: 24,
};

const FLASH_SALE_EDITABLE_FIELDS = [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD];

// =============================================================================
// COMMON TARGETING CONFIGURATION FOR FLASH SALES
// =============================================================================

// Frequency capping for flash sales - once per session, max twice per day
const FLASH_SALE_FREQUENCY_CAPPING = {
  max_triggers_per_session: 1,
  max_triggers_per_day: 2,
  cooldown_between_triggers: 43200, // 12 hours in seconds
};

// Page targeting - exclude checkout and cart pages to avoid checkout disruption
const FLASH_SALE_PAGE_TARGETING = {
  enabled: true,
  pages: [] as string[],
  customPatterns: [] as string[],
  excludePages: ["/checkout", "/checkout/*", "/cart", "/*/checkouts/*"],
  productTags: [] as string[],
  collections: [] as string[],
};

// =============================================================================
// 🎯 USE CASE RECIPES (Primary - Business Strategies)
// =============================================================================
// These are the main recipes focused on specific business goals.
// Merchants should browse these first to find the right strategy.
// =============================================================================

/**
 * 1. FLASH SALE - Time-Limited Urgency
 * Use case: Create urgency with countdown timer for quick sales boost
 * Best for: Clearing inventory, driving immediate action, weekend sales
 */
const flashSale: FlashSaleRecipe = {
  id: "flash-sale",
  name: "Flash Sale",
  tagline: "Limited time offer - don't miss out!",
  description:
    "Create urgency with a time-limited discount and countdown timer. Perfect for driving immediate action.",
  icon: "⚡",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "use_case",
  component: "FlashSaleCentered",
  layout: "centered",
  featured: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 30 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Flash Sale!",
      subheadline: "30% off everything - limited time only",
      showCountdown: true,
      urgencyMessage: "Ends soon",
      // Unified CTA configuration
      cta: {
        label: "Shop Now",
        variant: "primary" as const,
        action: "navigate_collection" as const,
        collectionHandle: "all",
        openInNewTab: false,
        quantity: 1,
        successBehavior: {
          showDiscountCode: true,
          autoCloseDelay: 5,
        },
      },
      secondaryCta: {
        label: "No thanks",
        action: "dismiss" as const,
      },
    },
    designConfig: { position: "center", size: "large" },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 30,
    },
  },
};

/**
 * 2. BOGO - Buy One Get One (Shop Now variant)
 * Use case: Move inventory, increase units per order
 * Best for: Overstocked items, product launches, weekend promotions
 *
 * Flow: Customer clicks → Discount code issued → Navigate to collection → Discount auto-applies at checkout
 */
const bogo: FlashSaleRecipe = {
  id: "bogo",
  name: "Buy One Get One",
  tagline: "Buy one, get one free!",
  description:
    "Classic BOGO promotion to move inventory and increase units per order. Customer is directed to shop eligible products with discount auto-applied.",
  icon: "🛍️",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "use_case",
  component: "FlashSaleCentered",
  layout: "centered",
  featured: true,
  requiredConfig: ["discount"], // @deprecated - no longer used, kept for reference
  inputs: [], // Discount config is edited inline in Content & Design section
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Buy 1 Get 1 FREE!",
      subheadline: "Limited time offer - double your order",
      showCountdown: true,
      urgencyMessage: "While supplies last",
      successMessage: "Discount applied!",
      // Unified CTA configuration - Navigate to collection flow
      cta: {
        label: "Shop BOGO Deals",
        variant: "primary" as const,
        action: "navigate_collection" as const,
        collectionHandle: "all", // Merchant should update to eligible collection
        openInNewTab: false,
        quantity: 1,
        successBehavior: {
          showDiscountCode: true,
          autoCloseDelay: 3, // Shorter delay since we're navigating
        },
      },
      secondaryCta: {
        label: "Maybe later",
        action: "dismiss" as const,
      },
    },
    designConfig: { position: "center", size: "large" },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      showInPreview: true,
      behavior: "SHOW_CODE_AND_AUTO_APPLY",
      // BOGO structure - Buy 1 Get 1 Free
      bogo: {
        buy: {
          scope: "any",
          quantity: 1,
        },
        get: {
          scope: "products",
          ids: [], // User will configure which products
          quantity: 1,
          discount: { kind: "free_product", value: 100 }, // 100% off = free
          appliesOncePerOrder: true,
        },
      },
    },
  },
};

/**
 * 3. TIERED DISCOUNT - Spend More Save More
 * Use case: Increase average order value (AOV)
 * Best for: Encouraging larger orders, clearing inventory at scale
 */
const tieredDiscount: FlashSaleRecipe = {
  id: "tiered-discount",
  name: "Spend More, Save More",
  tagline: "The more you spend, the more you save",
  description:
    "Tiered discount structure that encourages customers to add more to cart. Proven AOV booster.",
  icon: "📈",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "use_case",
  component: "FlashSaleCentered",
  layout: "centered",
  featured: true,
  requiredConfig: ["discount"], // @deprecated - no longer used, kept for reference
  inputs: [], // Tiered discount config is edited inline in Content & Design section
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Spend More, Save More",
      subheadline: "Unlock bigger savings with every dollar you spend",
      showCountdown: false,
      // Unified CTA configuration
      cta: {
        label: "Start Shopping",
        variant: "primary" as const,
        action: "navigate_collection" as const,
        collectionHandle: "all",
        openInNewTab: false,
        quantity: 1,
        successBehavior: {
          showDiscountCode: true,
          autoCloseDelay: 5,
        },
      },
      secondaryCta: {
        label: "Maybe later",
        action: "dismiss" as const,
      },
    },
    designConfig: {
      position: "center",
      size: "medium",
      leadCaptureLayout: { desktop: "content-only", mobile: "content-only" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 4 },
        exit_intent: { enabled: true, sensitivity: "medium" },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
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

/**
 * 4. FIRST PURCHASE WELCOME
 * Use case: Convert first-time visitors into customers
 * Best for: New visitor welcome, email capture
 */
const firstPurchase: FlashSaleRecipe = {
  id: "first-purchase",
  name: "First Purchase Discount",
  tagline: "Welcome! Here's your exclusive offer",
  description:
    "Convert first-time visitors with an exclusive welcome discount. Great for building your customer base.",
  icon: "👋",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "use_case",
  component: "FlashSaleCentered",
  layout: "centered",
  featured: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 15 }],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Welcome! 👋",
      subheadline: "Get 15% off your first order",
      buttonText: "Claim My Discount",
      showCountdown: false,
    },
    designConfig: {
      position: "center",
      size: "medium",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 5000 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 15,
    },
  },
};

/**
 * 5. LAST CHANCE / LOW STOCK
 * Use case: Create FOMO with scarcity messaging
 * Best for: Popular items, limited editions, closing sales
 */
const lastChance: FlashSaleRecipe = {
  id: "last-chance",
  name: "Last Chance Alert",
  tagline: "Almost sold out!",
  description:
    "Create urgency with scarcity messaging. Perfect for popular items or limited editions.",
  icon: "⏰",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "use_case",
  component: "FlashSaleCentered",
  layout: "centered",
  inputs: [
    {
      type: "product_picker" as const,
      key: "inventoryProducts",
      label: "Select products to track inventory",
      multiSelect: true,
    },
  ],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Last Chance! ⏰",
      subheadline: "Only a few left in stock - don't miss out",
      buttonText: "Shop Now",
      showCountdown: false,
      urgencyMessage: "Almost sold out!",
      // Real-time inventory tracking for scarcity messaging
      inventory: {
        mode: "real" as const,
        productIds: [], // User will select products via modal
        showOnlyXLeft: true,
        showThreshold: 10, // Show "Only X left" when inventory ≤ 10
        soldOutBehavior: "hide" as const,
      },
    },
    designConfig: {
      position: "center",
      size: "medium",
    },
    targetRules: {
      enhancedTriggers: {
        scroll_depth: { enabled: true, depth_percentage: 30 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
  },
};

/**
 * 6. CLEARANCE / END OF SEASON
 * Use case: Move old inventory at deep discounts
 * Best for: Season transitions, discontinued items, warehouse clearing
 */
const clearance: FlashSaleRecipe = {
  id: "clearance",
  name: "Clearance Sale",
  tagline: "Everything must go!",
  description:
    "Deep discounts for end-of-season or clearance items. Perfect for moving old inventory.",
  icon: "🏷️",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "use_case",
  component: "FlashSaleCentered",
  layout: "centered",
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 50 }],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Clearance Event",
      subheadline: "Up to 70% off - final markdowns!",
      buttonText: "Shop Clearance",
      showCountdown: true,
      urgencyMessage: "While supplies last",
    },
    designConfig: {
      position: "center",
      size: "large",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 50,
    },
  },
};

/**
 * 7. NEW ARRIVAL LAUNCH
 * Use case: Promote new products with early access discount
 * Best for: Product launches, new collections, exclusive previews
 */
const newArrival: FlashSaleRecipe = {
  id: "new-arrival",
  name: "New Arrival Promo",
  tagline: "Be first to shop the new collection",
  description: "Generate excitement for new products with exclusive early access discounts.",
  icon: "🆕",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "use_case",
  component: "FlashSaleCentered",
  layout: "centered",
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 20 }],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Just Dropped 🆕",
      subheadline: "Shop new arrivals - 20% off for early access",
      buttonText: "Shop New Arrivals",
      showCountdown: true,
    },
    designConfig: {
      position: "center",
      size: "large",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 20,
    },
  },
};

/**
 * 8. MYSTERY DISCOUNT
 * Use case: Gamify the shopping experience, email capture
 * Best for: Engagement, building email list, fun shopping experience
 */
const mysteryDiscount: FlashSaleRecipe = {
  id: "mystery-discount",
  name: "Mystery Discount",
  tagline: "Reveal your secret discount!",
  description:
    "Add an element of surprise with mystery discounts. Great for engagement and email capture.",
  icon: "🎁",
  category: "sales_promos",
  goal: "ENGAGEMENT",
  templateType: "FLASH_SALE",
  recipeType: "use_case",
  component: "FlashSaleCentered",
  layout: "centered",
  inputs: [],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Mystery Discount 🎁",
      subheadline: "Click to reveal your secret savings!",
      buttonText: "Reveal My Discount",
      showCountdown: false,
    },
    designConfig: {
      position: "center",
      size: "medium",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 6000 },
        exit_intent: { enabled: true, sensitivity: "medium" },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 15,
    },
  },
};

// =============================================================================
// 📅 SEASONAL QUICK-STARTS (Secondary - Pre-themed Templates)
// =============================================================================
// These are quick-start templates for seasonal events.
// They apply a theme + seasonal copy to the Flash Sale use case.
// Merchants can also apply any theme to the use-case recipes above.
// =============================================================================

const blackFridaySale: FlashSaleRecipe = {
  id: "black-friday-sale",
  name: "Black Friday Flash Sale",
  tagline: "The biggest sale of the year",
  description:
    "High-urgency flash sale with Black Friday theme. Dark background with gold accents.",
  icon: "🖤",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "black-friday",
  layout: "centered",
  backgroundPresetId: "fs-bg-black-friday",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 50 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "BLACK FRIDAY",
      subheadline: "UP TO 50% OFF EVERYTHING",
      buttonText: "SHOP NOW",
      showCountdown: true,
      urgencyMessage: "LIMITED TIME",
    },
    designConfig: {
      position: "center",
      size: "large",
      leadCaptureLayout: { desktop: "overlay", mobile: "overlay" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 50,
    },
  },
};

const cyberMondaySale: FlashSaleRecipe = {
  id: "cyber-monday-sale",
  name: "Cyber Monday Flash Sale",
  tagline: "Online exclusive savings",
  description: "Tech-themed flash sale with neon Cyber Monday aesthetic.",
  icon: "💻",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "cyber-monday",
  layout: "centered",
  backgroundPresetId: "bg-cyber-monday",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 40 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "CYBER MONDAY",
      subheadline: "40% OFF - Online Only",
      buttonText: "Shop Online Deals",
      showCountdown: true,
    },
    designConfig: {
      position: "center",
      size: "large",
      leadCaptureLayout: { desktop: "content-only", mobile: "content-only" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 40,
    },
  },
};

const summerSale: FlashSaleRecipe = {
  id: "summer-sale",
  name: "Summer Flash Sale",
  tagline: "Hot summer deals are here!",
  description: "Warm, playful flash sale with summer theme. Coral and turquoise colors.",
  icon: "☀️",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "summer",
  layout: "centered",
  backgroundPresetId: "fs-bg-summer",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 30 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Summer Sale ☀️",
      subheadline: "30% off summer essentials",
      buttonText: "Shop Summer",
      showCountdown: true,
    },
    designConfig: {
      position: "center",
      backgroundOverlayOpacity: 0,
      size: "large",
      leadCaptureLayout: { desktop: "overlay", mobile: "overlay" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 30,
    },
  },
};

const holidaySale: FlashSaleRecipe = {
  id: "holiday-sale",
  name: "Holiday Flash Sale",
  tagline: "Festive savings for everyone",
  description: "Festive flash sale with holiday theme. Green and red with gold accents.",
  icon: "🎄",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "holiday",
  layout: "centered",
  imageUrl: "/recipes/flash-sale/christman-center-negative.jpg",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 25 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Holiday Sale 🎄",
      subheadline: "25% off holiday favorites",
      buttonText: "Shop Holiday Deals",
      showCountdown: true,
    },
    designConfig: {
      position: "center",
      size: "large",
      backgroundOverlayOpacity: 0,
      leadCaptureLayout: { desktop: "overlay", mobile: "overlay" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 25,
    },
  },
};

const valentineSale: FlashSaleRecipe = {
  id: "valentine-sale",
  name: "Valentine's Flash Sale",
  tagline: "Show them you care ❤️",
  description: "Romantic flash sale with Valentine theme. Pink and red colors.",
  icon: "💝",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "valentine",
  layout: "centered",
  backgroundPresetId: "fs-bg-valentine",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 20 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Valentine's Sale ❤️",
      subheadline: "20% off gifts for your loved ones",
      buttonText: "Shop Gifts",
      showCountdown: true,
    },
    designConfig: {
      position: "center",
      size: "large",
      backgroundOverlayOpacity: 0,
      leadCaptureLayout: { desktop: "overlay", mobile: "overlay" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 20,
    },
  },
};

const easterSale: FlashSaleRecipe = {
  id: "easter-sale",
  name: "Easter Flash Sale",
  tagline: "Spring into savings!",
  description: "Fresh spring flash sale with Easter theme. Pastel greens and pinks.",
  icon: "🐰",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "spring",
  layout: "centered",
  backgroundPresetId: "fs-bg-easter",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 20 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Easter Sale 🐰",
      subheadline: "20% off spring favorites",
      buttonText: "Shop Easter Deals",
      showCountdown: true,
    },
    designConfig: {
      position: "center",
      size: "large",
      leadCaptureLayout: { desktop: "overlay", mobile: "overlay" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 20,
    },
  },
};

const halloweenSale: FlashSaleRecipe = {
  id: "halloween-sale",
  name: "Halloween Flash Sale",
  tagline: "Spooky savings are here!",
  description: "Spooky flash sale with dark Halloween theme.",
  icon: "🎃",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "dark",
  layout: "centered",
  backgroundPresetId: "fs-bg-halloween",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 25 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Halloween Sale 🎃",
      subheadline: "25% off - frighteningly good deals!",
      buttonText: "Shop Spooky Deals",
      showCountdown: true,
      urgencyMessage: "Ends at midnight!",
    },
    designConfig: {
      position: "center",
      size: "large",
      backgroundOverlayOpacity: 0,
      leadCaptureLayout: { desktop: "overlay", mobile: "overlay" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 25,
    },
  },
};

const thanksgivingSale: FlashSaleRecipe = {
  id: "thanksgiving-sale",
  name: "Thanksgiving Flash Sale",
  tagline: "Thankful for savings! 🦃",
  description: "Warm autumn flash sale with elegant Thanksgiving theme.",
  icon: "🦃",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "luxury",
  layout: "centered",
  backgroundPresetId: "fs-bg-thanksgiving",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 30 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Thanksgiving Sale",
      subheadline: "30% off - we're thankful for you!",
      buttonText: "Shop Thanksgiving Deals",
      showCountdown: true,
    },
    designConfig: {
      position: "center",
      size: "large",
      backgroundOverlayOpacity: 0,
      leadCaptureLayout: { desktop: "overlay", mobile: "overlay" },
      textColor: "#FFFFFF", // White text for orange background
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 30,
    },
  },
};

const newYearSale: FlashSaleRecipe = {
  id: "new-year-sale",
  name: "New Year Flash Sale",
  tagline: "Start the year with savings! 🎆",
  description: "Celebratory flash sale with luxury New Year theme.",
  icon: "🎆",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "luxury",
  layout: "centered",
  backgroundPresetId: "fs-bg-new-year",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 25 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "New Year Sale 🎆",
      subheadline: "25% off - new year, new deals!",
      buttonText: "Shop New Year Deals",
      showCountdown: true,
      urgencyMessage: "Limited time!",
    },
    designConfig: {
      position: "center",
      size: "large",
      leadCaptureLayout: { desktop: "overlay", mobile: "overlay" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 25,
    },
  },
};

const winterSale: FlashSaleRecipe = {
  id: "winter-sale",
  name: "Winter Flash Sale",
  tagline: "Cool deals for the cold season! ❄️",
  description: "Winter clearance flash sale with cool blue ocean theme.",
  icon: "❄️",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "ocean",
  layout: "centered",
  backgroundPresetId: "fs-bg-winter",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 40 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Winter Clearance ❄️",
      subheadline: "Up to 40% off winter essentials",
      buttonText: "Shop Winter Deals",
      showCountdown: true,
    },
    designConfig: {
      position: "center",
      size: "large",
      leadCaptureLayout: { desktop: "overlay", mobile: "overlay" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 40,
    },
  },
};

const backToSchoolSale: FlashSaleRecipe = {
  id: "back-to-school-sale",
  name: "Back to School Flash Sale",
  tagline: "Get ready for the new school year! 📚",
  description: "Academic season flash sale with modern theme.",
  icon: "📚",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  recipeType: "seasonal",
  component: "FlashSaleCentered",
  theme: "modern",
  layout: "centered",
  backgroundPresetId: "fs-bg-back-to-school",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 20 }, DURATION_HOURS_INPUT],
  editableFields: FLASH_SALE_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Back to School 📚",
      subheadline: "20% off school essentials",
      buttonText: "Shop School Deals",
      showCountdown: true,
    },
    designConfig: {
      position: "center",
      size: "large",
      leadCaptureLayout: { desktop: "overlay", mobile: "overlay" },
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: true, delay: 3 },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 20,
    },
  },
};

// =============================================================================
// 🎁 FREE GIFT WITH PURCHASE
// =============================================================================
// Use case: Increase AOV by offering a free gift when cart reaches threshold
// Best for: Upselling, encouraging larger orders, clearing sample inventory
// =============================================================================

/**
 * FREE GIFT WITH PURCHASE
 *
 * Two-step flow:
 * 1. Show offer when cart is close to or above threshold
 * 2. Click CTA → Add free gift to cart automatically
 *
 * Targeting: Cart value trigger (e.g., cart >= $50)
 */
const freeGiftWithPurchase: FlashSaleRecipe = {
  id: "free-gift-with-purchase",
  name: "Free Gift with Purchase",
  tagline: "Spend more, get a FREE gift!",
  description:
    "Increase average order value by offering a free gift when customers reach a spending threshold. Perfect for moving sample inventory.",
  icon: "🎁",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  component: "FlashSaleCentered",
  layout: "centered",
  featured: true,
  recipeType: "use_case",
  inputs: [
    {
      type: "currency_amount" as const,
      key: "threshold",
      label: "Minimum Spend ($)",
      defaultValue: 50,
    },
    {
      type: "product_picker" as const,
      key: "giftProduct",
      label: "Free Gift Product",
    },
  ],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "🎁 FREE Gift With Your Order!",
      subheadline: "Spend $50+ and get a FREE sample pack",
      showCountdown: false,
      urgencyMessage: "While supplies last",
      // CTA adds the free gift to cart - variantId populated via product picker
      cta: {
        label: "Add My Free Gift",
        variant: "primary" as const,
        action: "add_to_cart" as const,
        openInNewTab: false,
        quantity: 1,
        // variantId will be set via product picker input (key: giftProduct)
        successBehavior: {
          showDiscountCode: false, // No discount code display needed - item is simply free
          autoCloseDelay: 5,
          secondaryAction: {
            label: "View Cart",
            url: "/cart",
          },
        },
      },
      secondaryCta: {
        label: "No thanks",
        action: "dismiss" as const,
      },
    },
    designConfig: {
      position: "center",
      size: "medium",
    },
    targetRules: {
      enhancedTriggers: {
        page_load: { enabled: false },
        cart_value: {
          enabled: true,
          min_value: 50, // Threshold
          check_interval: 2000,
        },
        frequency_capping: FLASH_SALE_FREQUENCY_CAPPING,
      },
      pageTargeting: FLASH_SALE_PAGE_TARGETING,
    },
    // Free gift discount: Creates a 100% off discount for the selected product
    // Uses quantityLimit to limit to 1 free item per order
    // The product picker (giftProduct) will populate:
    // - discountConfig.freeGift (productId, variantId, productTitle, productImageUrl)
    // - contentConfig.cta.variantId (for add-to-cart action)
    discountConfig: {
      enabled: true,
      showInPreview: true,
      minimumAmount: 50, // $50 minimum spend threshold
      // Free gift with quantity limit of 1 (via discountOnQuantity in Shopify)
      freeGift: {
        productId: "preview-free-gift-product", // Placeholder for preview
        variantId: "preview-free-gift-variant", // Placeholder for preview
        productTitle: "Premium Gift Box",
        productImageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80",
        quantity: 1, // Limits discount to 1 item per order
        minSubtotalCents: 5000, // $50 minimum cart value
      },
    },
  },
};

// =============================================================================
// EXPORT
// =============================================================================

// Use Case recipes (primary) - ordered by popularity/utility
export const USE_CASE_RECIPES: FlashSaleRecipe[] = [
  flashSale,
  bogo,
  freeGiftWithPurchase,
  tieredDiscount,
  firstPurchase,
  lastChance,
  clearance,
  newArrival,
  mysteryDiscount,
];

// Seasonal quick-starts (secondary) - ordered by calendar
export const SEASONAL_RECIPES: FlashSaleRecipe[] = [
  blackFridaySale,
  cyberMondaySale,
  holidaySale,
  newYearSale,
  winterSale,
  valentineSale,
  easterSale,
  summerSale,
  backToSchoolSale,
  halloweenSale,
  thanksgivingSale,
];

// Combined export - use cases first, then seasonal
export const FLASH_SALE_DESIGN_RECIPES: FlashSaleRecipe[] = [
  ...USE_CASE_RECIPES,
  ...SEASONAL_RECIPES,
];
