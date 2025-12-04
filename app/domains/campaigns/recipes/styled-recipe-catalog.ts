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
  EditableField,
  QuickInput,
  RecipeTag,
} from "./styled-recipe-types";
import { NEWSLETTER_DESIGN_RECIPES } from "./newsletter-design-recipes";
import { SCRATCH_CARD_DESIGN_RECIPES } from "./scratch-card-design-recipes";

// =============================================================================
// HELPER: Build function factory
// =============================================================================

function createBuildFunction(
  recipe: Omit<StyledRecipe, "build">
): (context: RecipeContext) => RecipeOutput {
  return (context: RecipeContext): RecipeOutput => {
    const defaults = recipe.defaults;
    const theme = context.selectedTheme || recipe.theme;

    // Merge context values into content config
    const contentConfig = {
      ...defaults.contentConfig,
    };

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
    const designConfig = {
      theme,
      layout: recipe.layout,
      position: defaults.designConfig?.position || "center",
      size: defaults.designConfig?.size || "medium",
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
    };
  };
}

// =============================================================================
// COMMON EDITABLE FIELDS
// =============================================================================

const HEADLINE_FIELD: EditableField = {
  key: "headline",
  type: "text",
  label: "Headline",
  placeholder: "Enter your headline...",
  group: "content",
  validation: { required: true, maxLength: 100 },
};

const SUBHEADLINE_FIELD: EditableField = {
  key: "subheadline",
  type: "text",
  label: "Subheadline",
  placeholder: "Enter subheadline...",
  group: "content",
  validation: { maxLength: 200 },
};

const BUTTON_TEXT_FIELD: EditableField = {
  key: "buttonText",
  type: "text",
  label: "Button Text",
  placeholder: "e.g., Shop Now",
  group: "content",
  validation: { required: true, maxLength: 30 },
};

const EMAIL_PLACEHOLDER_FIELD: EditableField = {
  key: "emailPlaceholder",
  type: "text",
  label: "Email Placeholder",
  placeholder: "e.g., Enter your email",
  group: "content",
};

// =============================================================================
// COMMON QUICK INPUTS
// =============================================================================

const DISCOUNT_PERCENTAGE_INPUT: QuickInput = {
  type: "discount_percentage",
  key: "discountValue",
  label: "Discount Percentage",
  defaultValue: 10,
};

const DURATION_HOURS_INPUT: QuickInput = {
  type: "duration_hours",
  key: "durationHours",
  label: "Sale Duration",
  defaultValue: 24,
};

const THRESHOLD_INPUT: QuickInput = {
  type: "currency_amount",
  key: "threshold",
  label: "Free Shipping Threshold",
  defaultValue: 50,
};

// =============================================================================
// 📧 EMAIL & LEADS RECIPES
// =============================================================================

const welcomeDiscount: StyledRecipe = {
  id: "welcome-discount",
  name: "Welcome Discount",
  tagline: "Get 10% off your first order",
  description: "Classic email capture with a first-order discount. Best for new visitor conversion.",
  icon: "🎁",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  component: "NewsletterSplit",
  theme: "modern",
  layout: "split-left",
  backgroundPresetId: "bg-modern",
  featured: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 10 }],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD, EMAIL_PLACEHOLDER_FIELD],
  defaults: {
    contentConfig: {
      headline: "Get 10% Off Your First Order",
      subheadline: "Subscribe to our newsletter for exclusive offers and updates.",
      buttonText: "Claim My Discount",
      emailPlaceholder: "Enter your email",
      successMessage: "Check your email for your discount code!",
    },
    designConfig: { position: "center", size: "medium" },
    targetRules: {
      enhancedTriggers: { time_delay: { enabled: true, delay: 5000 } },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

const exitOffer: StyledRecipe = {
  id: "exit-offer",
  name: "Exit Offer",
  tagline: "Wait! Here's 15% off before you go",
  description: "Capture leaving visitors with an exit-intent discount offer.",
  icon: "🚪",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  component: "NewsletterCentered",
  theme: "dark",
  layout: "centered",
  backgroundPresetId: "bg-dark",
  featured: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 15 }],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "Wait! Don't Leave Empty-Handed",
      subheadline: "Get 15% off your first order",
      buttonText: "Claim My Discount",
      emailPlaceholder: "Enter your email",
    },
    designConfig: { position: "center", size: "medium" },
    targetRules: {
      enhancedTriggers: { exit_intent: { enabled: true, sensitivity: "medium" } },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 15,
    },
  },
};

const spinToWin: StyledRecipe = {
  id: "spin-to-win",
  name: "Spin to Win",
  tagline: "Spin the wheel for a chance to win!",
  description: "Gamified email capture with a spinning wheel. Higher engagement than standard forms.",
  icon: "🎡",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "SPIN_TO_WIN",
  component: "SpinToWin",
  theme: "gradient",
  layout: "centered",
  backgroundPresetId: "bg-gradient",
  featured: true,
  inputs: [],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD],
  defaults: {
    contentConfig: {
      headline: "Spin to Win!",
      subheadline: "Enter your email for a chance to win a discount",
      spinButtonText: "Spin the Wheel",
      emailPlaceholder: "Enter your email to spin",
    },
    designConfig: { position: "center", size: "large" },
    targetRules: {
      enhancedTriggers: { scroll_depth: { enabled: true, depth_percentage: 50 } },
    },
  },
};

const vipEarlyAccess: StyledRecipe = {
  id: "vip-early-access",
  name: "VIP Early Access",
  tagline: "Join the VIP list for exclusive access",
  description: "Email capture without discount. For building anticipation for launches or sales.",
  icon: "👑",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  component: "NewsletterMinimal",
  theme: "luxury",
  layout: "centered",
  backgroundPresetId: "bg-luxury",
  inputs: [],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "Get VIP Early Access",
      subheadline: "Be the first to know about new arrivals and exclusive sales",
      buttonText: "Join VIP List",
      emailPlaceholder: "Enter your email",
      successMessage: "You're on the list! We'll notify you first.",
    },
    designConfig: { position: "center", size: "medium" },
  },
};

const holidayNewsletter: StyledRecipe = {
  id: "holiday-newsletter",
  name: "Holiday Newsletter",
  tagline: "Join for holiday deals & gift guides",
  description: "Festive email capture for the holiday season.",
  icon: "🎄",
  category: "email_leads",
  goal: "NEWSLETTER_SIGNUP",
  templateType: "NEWSLETTER",
  component: "NewsletterSplit",
  theme: "holiday",
  layout: "split-left",
  backgroundPresetId: "bg-holiday",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 15 }],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "🎄 Holiday Deals Inside",
      subheadline: "Subscribe for exclusive holiday offers and gift guides",
      buttonText: "Get Holiday Deals",
      emailPlaceholder: "Enter your email",
    },
    designConfig: { position: "center", size: "medium" },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 15,
    },
  },
};

// =============================================================================
// 🔥 SALES & PROMOS - EVERGREEN
// =============================================================================

const flashSale: StyledRecipe = {
  id: "flash-sale",
  name: "Flash Sale",
  tagline: "Limited time offer - don't miss out!",
  description: "Create urgency with a time-limited discount and countdown timer.",
  icon: "⚡",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  component: "FlashSaleCentered",
  theme: "bold",
  layout: "centered",
  backgroundPresetId: "bg-bold",
  featured: true,
  inputs: [
    { ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 30 },
    DURATION_HOURS_INPUT,
  ],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "Flash Sale!",
      subheadline: "30% off everything - limited time only",
      buttonText: "Shop Now",
      showCountdown: true,
      urgencyMessage: "Ends soon",
    },
    designConfig: { position: "center", size: "large" },
    targetRules: {
      enhancedTriggers: { page_load: { enabled: true, delay: 2000 } },
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 30,
    },
  },
};

// =============================================================================
// 🔥 SALES & PROMOS - SEASONAL
// =============================================================================

const blackFridaySale: StyledRecipe = {
  id: "black-friday-sale",
  name: "Black Friday Sale",
  tagline: "The biggest sale of the year",
  description: "High-urgency flash sale with dark theme and bold messaging.",
  icon: "🖤",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  component: "FlashSaleCentered",
  theme: "black-friday",
  layout: "centered",
  backgroundPresetId: "bg-black-friday",
  seasonal: true,
  featured: true,
  inputs: [
    { ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 50 },
    DURATION_HOURS_INPUT,
  ],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "BLACK FRIDAY",
      subheadline: "UP TO 50% OFF EVERYTHING",
      buttonText: "SHOP NOW",
      showCountdown: true,
      urgencyMessage: "LIMITED TIME",
    },
    designConfig: { position: "center", size: "large" },
    targetRules: {
      enhancedTriggers: { page_load: { enabled: true, delay: 1000 } },
    },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 50,
    },
  },
};

const cyberMondaySale: StyledRecipe = {
  id: "cyber-monday-sale",
  name: "Cyber Monday Deal",
  tagline: "Online exclusive savings",
  description: "Tech-themed flash sale with neon aesthetic.",
  icon: "💻",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  component: "FlashSaleCentered",
  theme: "cyber-monday",
  layout: "centered",
  backgroundPresetId: "bg-cyber-monday",
  seasonal: true,
  inputs: [
    { ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 40 },
    DURATION_HOURS_INPUT,
  ],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "CYBER MONDAY",
      subheadline: "40% OFF - Online Only",
      buttonText: "Shop Online Deals",
      showCountdown: true,
    },
    designConfig: { position: "center", size: "large" },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 40,
    },
  },
};

const summerSale: StyledRecipe = {
  id: "summer-sale",
  name: "Summer Sale",
  tagline: "Hot summer deals are here!",
  description: "Warm, playful flash sale perfect for summer promotions.",
  icon: "☀️",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  component: "FlashSaleSplit",
  theme: "summer",
  layout: "split-left",
  backgroundPresetId: "bg-summer",
  seasonal: true,
  featured: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 30 }],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "Summer Sale ☀️",
      subheadline: "30% off summer essentials",
      buttonText: "Shop Summer",
      showCountdown: true,
    },
    designConfig: { position: "center", size: "large" },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 30,
    },
  },
};

const holidaySale: StyledRecipe = {
  id: "holiday-sale",
  name: "Holiday Sale",
  tagline: "Festive savings for everyone",
  description: "Festive flash sale for the holiday shopping season.",
  icon: "🎄",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  component: "FlashSaleCentered",
  theme: "holiday",
  layout: "centered",
  backgroundPresetId: "bg-holiday",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 25 }],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "Holiday Sale 🎄",
      subheadline: "25% off holiday favorites",
      buttonText: "Shop Holiday Deals",
      showCountdown: true,
    },
    designConfig: { position: "center", size: "large" },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 25,
    },
  },
};

const valentineSale: StyledRecipe = {
  id: "valentine-sale",
  name: "Valentine's Sale",
  tagline: "Show them you care ❤️",
  description: "Romantic-themed sale for Valentine's Day.",
  icon: "💝",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  component: "FlashSaleSplit",
  theme: "valentine",
  layout: "split-left",
  backgroundPresetId: "bg-valentine",
  seasonal: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 20 }],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "Valentine's Sale ❤️",
      subheadline: "20% off gifts for your loved ones",
      buttonText: "Shop Gifts",
    },
    designConfig: { position: "center", size: "medium" },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 20,
    },
  },
};

// =============================================================================
// 🔥 SALES & PROMOS - OTHER TYPES
// =============================================================================

const bogoWeekend: StyledRecipe = {
  id: "bogo-weekend",
  name: "BOGO Weekend",
  tagline: "Buy one, get one free!",
  description: "Buy one get one free promotion for weekend sales.",
  icon: "🛍️",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  component: "FlashSaleCentered",
  theme: "gradient",
  layout: "centered",
  backgroundPresetId: "bg-gradient",
  inputs: [],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "BOGO Weekend!",
      subheadline: "Buy one, get one FREE",
      buttonText: "Shop BOGO",
      showCountdown: true,
    },
    designConfig: { position: "center", size: "large" },
    discountConfig: {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 50, // BOGO equivalent: 50% off second item
    },
  },
};

const spendMoreSaveMore: StyledRecipe = {
  id: "spend-more-save-more",
  name: "Spend More, Save More",
  tagline: "The more you spend, the more you save",
  description: "Tiered discount that encourages larger orders.",
  icon: "📈",
  category: "sales_promos",
  goal: "INCREASE_REVENUE",
  templateType: "FLASH_SALE",
  component: "FlashSaleCentered",
  theme: "elegant",
  layout: "centered",
  backgroundPresetId: "bg-elegant",
  inputs: [],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "Spend More, Save More",
      subheadline: "$50→10% | $100→20% | $150→30%",
      buttonText: "Start Shopping",
    },
    designConfig: { position: "center", size: "medium" },
  },
};

// =============================================================================
// 🛒 CART & RECOVERY RECIPES
// =============================================================================

const cartRecovery: StyledRecipe = {
  id: "cart-recovery",
  name: "Cart Recovery",
  tagline: "Complete your order and save",
  description: "Recover abandoning visitors with a discount incentive.",
  icon: "🛒",
  category: "cart_recovery",
  goal: "INCREASE_REVENUE",
  templateType: "CART_ABANDONMENT",
  component: "CartRecovery",
  theme: "modern",
  layout: "centered",
  backgroundPresetId: "bg-modern",
  featured: true,
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 15 }],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "Don't Forget Your Items!",
      subheadline: "Complete your order and get 15% off",
      buttonText: "Complete Order",
      showCartItems: true,
    },
    designConfig: { position: "center", size: "medium" },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true, sensitivity: "medium" },
        cart_value: { enabled: true, minValue: 1 },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 15,
    },
  },
};

const urgentCartRecovery: StyledRecipe = {
  id: "urgent-cart-recovery",
  name: "Urgent Cart Recovery",
  tagline: "Your cart is about to expire!",
  description: "High-urgency cart recovery with countdown timer.",
  icon: "⚠️",
  category: "cart_recovery",
  goal: "INCREASE_REVENUE",
  templateType: "CART_ABANDONMENT",
  component: "CartRecoveryUrgent",
  theme: "bold",
  layout: "centered",
  backgroundPresetId: "bg-bold",
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 20 }],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "Wait! Your Cart Is About to Expire",
      subheadline: "Complete now and get 20% off",
      buttonText: "Save My Cart",
      showCartItems: true,
      showCountdown: true,
    },
    designConfig: { position: "center", size: "large" },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true, sensitivity: "high" },
      },
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 20,
    },
  },
};

const freeShippingProgress: StyledRecipe = {
  id: "free-shipping-progress",
  name: "Free Shipping Progress",
  tagline: "Spend $X more for FREE shipping!",
  description: "Progress bar motivating customers to reach free shipping threshold.",
  icon: "🚚",
  category: "cart_recovery",
  goal: "INCREASE_REVENUE",
  templateType: "FREE_SHIPPING",
  component: "FreeShippingBar",
  theme: "modern",
  layout: "banner-top",
  featured: true,
  inputs: [THRESHOLD_INPUT],
  editableFields: [
    { key: "emptyMessage", type: "text", label: "Empty Cart Message", group: "content" },
    { key: "progressMessage", type: "text", label: "Progress Message", group: "content" },
    { key: "unlockedMessage", type: "text", label: "Unlocked Message", group: "content" },
  ],
  defaults: {
    contentConfig: {
      threshold: 50,
      currency: "$",
      emptyMessage: "Add items to unlock free shipping",
      progressMessage: "You're {remaining} away from free shipping!",
      unlockedMessage: "🎉 You've unlocked FREE shipping!",
    },
    designConfig: { position: "top" },
    discountConfig: {
      enabled: true,
      valueType: "FREE_SHIPPING",
      minimumAmount: 50,
    },
  },
};

const completeYourLook: StyledRecipe = {
  id: "complete-your-look",
  name: "Complete Your Look",
  tagline: "Customers also love these",
  description: "Product upsell based on cart contents.",
  icon: "👗",
  category: "cart_recovery",
  goal: "INCREASE_REVENUE",
  templateType: "PRODUCT_UPSELL",
  component: "ProductUpsell",
  theme: "minimal",
  layout: "sidebar-right",
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 10 }],
  editableFields: [HEADLINE_FIELD, SUBHEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "Complete Your Look",
      subheadline: "Customers also love these",
      buttonText: "Add to Cart",
      bundleDiscount: 10,
    },
    designConfig: { position: "right", size: "medium" },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
    },
  },
};

// =============================================================================
// 📢 ANNOUNCEMENTS RECIPES
// =============================================================================

const saleAnnouncement: StyledRecipe = {
  id: "sale-announcement",
  name: "Sale Announcement",
  tagline: "Big sale now live!",
  description: "Announce an ongoing sale with a sticky banner.",
  icon: "📣",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  component: "AnnouncementBanner",
  theme: "bold",
  layout: "banner-top",
  featured: true,
  inputs: [],
  editableFields: [
    HEADLINE_FIELD,
    BUTTON_TEXT_FIELD,
    { key: "ctaUrl", type: "text", label: "Button Link", placeholder: "/collections/sale", group: "content" },
  ],
  defaults: {
    contentConfig: {
      headline: "🔥 Summer Sale Now Live - Up to 50% Off!",
      buttonText: "Shop the Sale",
      ctaUrl: "/collections/sale",
      sticky: true,
    },
    designConfig: { position: "top" },
  },
};

const newArrival: StyledRecipe = {
  id: "new-arrival",
  name: "New Arrival",
  tagline: "Just dropped - check it out!",
  description: "Announce new products with a modal popup.",
  icon: "🆕",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  component: "AnnouncementModal",
  theme: "modern",
  layout: "centered",
  backgroundPresetId: "bg-modern",
  inputs: [],
  editableFields: [
    HEADLINE_FIELD,
    SUBHEADLINE_FIELD,
    BUTTON_TEXT_FIELD,
    { key: "ctaUrl", type: "text", label: "Button Link", placeholder: "/products/new-product", group: "content" },
  ],
  defaults: {
    contentConfig: {
      headline: "Just Dropped! 🆕",
      subheadline: "Check out our latest arrival",
      buttonText: "View Product",
      ctaUrl: "/collections/new",
    },
    designConfig: { position: "center", size: "medium" },
  },
};

const storeUpdate: StyledRecipe = {
  id: "store-update",
  name: "Store Update",
  tagline: "Important information",
  description: "Inform customers about store updates or policy changes.",
  icon: "ℹ️",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  component: "AnnouncementBanner",
  theme: "minimal",
  layout: "banner-top",
  inputs: [],
  editableFields: [
    HEADLINE_FIELD,
    { key: "ctaUrl", type: "text", label: "Learn More Link", placeholder: "/pages/shipping", group: "content" },
  ],
  defaults: {
    contentConfig: {
      headline: "📦 Free shipping on orders over $50",
      buttonText: "Learn More",
      ctaUrl: "/pages/shipping",
      sticky: true,
      dismissible: true,
    },
    designConfig: { position: "top" },
  },
};

const holidayAnnouncement: StyledRecipe = {
  id: "holiday-announcement",
  name: "Holiday Announcement",
  tagline: "Festive store updates",
  description: "Holiday-themed announcement for seasonal messaging.",
  icon: "🎄",
  category: "announcements",
  goal: "ENGAGEMENT",
  templateType: "ANNOUNCEMENT",
  component: "AnnouncementBanner",
  theme: "holiday",
  layout: "banner-top",
  backgroundPresetId: "bg-holiday",
  seasonal: true,
  inputs: [],
  editableFields: [HEADLINE_FIELD, BUTTON_TEXT_FIELD],
  defaults: {
    contentConfig: {
      headline: "🎄 Order by Dec 20 for Christmas delivery!",
      buttonText: "Shop Now",
      ctaUrl: "/collections/gifts",
      sticky: true,
    },
    designConfig: { position: "top" },
  },
};

// =============================================================================
// CATALOG EXPORT
// =============================================================================

/** All styled recipes (existing + newsletter design recipes) */
export const STYLED_RECIPES: StyledRecipe[] = [
  // Email & Leads
  welcomeDiscount,
  exitOffer,
  spinToWin,
  vipEarlyAccess,
  holidayNewsletter,
  // Sales & Promos - Evergreen
  flashSale,
  bogoWeekend,
  spendMoreSaveMore,
  // Sales & Promos - Seasonal
  blackFridaySale,
  cyberMondaySale,
  summerSale,
  holidaySale,
  valentineSale,
  // Cart & Recovery
  cartRecovery,
  urgentCartRecovery,
  freeShippingProgress,
  completeYourLook,
  // Announcements
  saleAnnouncement,
  newArrival,
  storeUpdate,
  holidayAnnouncement,
  // Newsletter Design Recipes (new industry-specific designs)
  ...NEWSLETTER_DESIGN_RECIPES,
  // Scratch Card Design Recipes (gamified engagement)
  ...SCRATCH_CARD_DESIGN_RECIPES,
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
  return STYLED_RECIPES.filter((r) =>
    tags.every((tag) => r.tags?.includes(tag))
  );
}

/** Get recipes by any of the tags (OR logic) */
export function getStyledRecipesByAnyTag(tags: RecipeTag[]): StyledRecipe[] {
  return STYLED_RECIPES.filter((r) =>
    tags.some((tag) => r.tags?.includes(tag))
  );
}

/** Get all unique tags from recipes */
export function getAllRecipeTags(): RecipeTag[] {
  const tagSet = new Set<RecipeTag>();
  STYLED_RECIPES.forEach((r) => {
    r.tags?.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet);
}

