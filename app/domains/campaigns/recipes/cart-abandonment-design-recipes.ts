/**
 * Cart Abandonment Design Recipes
 *
 * Recipes for recovering abandoned carts with various strategies.
 * All recipes use the default theme (no custom colors).
 *
 * Each recipe is designed to re-engage customers who are about to leave
 * with items in their cart, using different psychological triggers.
 */

import type { CartAbandonmentRecipe, RecipeTag, EditableField } from "./styled-recipe-types";

// =============================================================================
// HELPER: Common editable fields for cart abandonment recipes
// =============================================================================

const HEADLINE_FIELD: EditableField = {
  key: "headline",
  type: "text",
  label: "Headline",
  group: "content",
  validation: { required: true, maxLength: 100 },
};

const SUBHEADLINE_FIELD: EditableField = {
  key: "subheadline",
  type: "text",
  label: "Subheadline",
  group: "content",
  validation: { maxLength: 200 },
};

const BUTTON_TEXT_FIELD: EditableField = {
  key: "buttonText",
  type: "text",
  label: "Button Text",
  group: "content",
  validation: { required: true, maxLength: 30 },
};

const URGENCY_MESSAGE_FIELD: EditableField = {
  key: "urgencyMessage",
  type: "text",
  label: "Urgency Message",
  group: "content",
  placeholder: "e.g., Items selling fast!",
  validation: { maxLength: 100 },
};

const DISCOUNT_PERCENTAGE_INPUT = {
  type: "discount_percentage" as const,
  key: "discountValue",
  label: "Discount Percentage",
  defaultValue: 10,
};

const TRIGGER_INPUT = {
  type: "select" as const,
  key: "triggerType",
  label: "Show popup when",
  defaultValue: "exit_intent",
  options: [
    { value: "exit_intent", label: "Customer tries to leave (exit intent)" },
    { value: "idle", label: "Customer is inactive for 30 seconds" },
    { value: "scroll_up", label: "Customer scrolls up (leaving signals)" },
  ],
};

const CART_ABANDONMENT_EDITABLE_FIELDS: EditableField[] = [
  HEADLINE_FIELD,
  SUBHEADLINE_FIELD,
  BUTTON_TEXT_FIELD,
  URGENCY_MESSAGE_FIELD,
];

// =============================================================================
// COMMON TARGETING CONFIGURATION FOR CART ABANDONMENT
// =============================================================================

// Frequency capping for cart recovery - once per session (don't nag)
const CART_ABANDONMENT_FREQUENCY_CAPPING = {
  max_triggers_per_session: 1,
  max_triggers_per_day: 2,
  cooldown_between_triggers: 3600, // 1 hour in seconds
};

// Page targeting - only show on pages with cart, exclude checkout
const CART_ABANDONMENT_PAGE_TARGETING = {
  enabled: true,
  pages: [] as string[],
  customPatterns: [] as string[],
  excludePages: ["/checkout", "/checkout/*", "/*/checkouts/*"],
  productTags: [] as string[],
  collections: [] as string[],
};

// =============================================================================
// 🎯 USE CASE RECIPES (Primary - Cart Recovery Strategies)
// =============================================================================

/**
 * 1. GENTLE REMINDER - Soft approach
 * Use case: Non-intrusive reminder about items left in cart
 * Best for: Premium brands, first-time popup, polite approach
 */
const gentleReminder: CartAbandonmentRecipe = {
  id: "cart-gentle-reminder",
  name: "Gentle Reminder",
  tagline: "Don't forget your items!",
  description:
    "A soft, non-pushy reminder about items left in cart. Perfect for premium brands that want to stay classy.",
  icon: "💭",
  category: "cart_recovery",
  goal: "INCREASE_REVENUE",
  templateType: "CART_ABANDONMENT",
  recipeType: "use_case",
  component: "CartRecovery",
  layout: "centered",
  featured: true,
  tags: ["elegant", "minimal", "exit-intent", "cart-recovery"] as RecipeTag[],
  inputs: [TRIGGER_INPUT],
  editableFields: CART_ABANDONMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Wait! You left something behind",
      subheadline: "Your cart is waiting for you. Complete your order before these items sell out!",
      buttonText: "Return to Cart",
      showCartItems: true,
      maxItemsToShow: 3,
      showCartTotal: true,
      showUrgency: false,
      ctaUrl: "/cart",
    },
    designConfig: {
      position: "center",
      size: "medium",
    },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true, sensitivity: "medium" },
        cart_value: { enabled: true, min_value: 10 },
        frequency_capping: CART_ABANDONMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: CART_ABANDONMENT_PAGE_TARGETING,
    },
  },
};

/**
 * 2. DISCOUNT INCENTIVE - Classic cart saver
 * Use case: Offer a discount to complete the purchase
 * Best for: Most stores, proven conversion strategy
 */
const discountIncentive: CartAbandonmentRecipe = {
  id: "cart-discount-incentive",
  name: "Discount Incentive",
  tagline: "Get 10% off to complete your order!",
  description:
    "The classic cart recovery strategy - offer a discount to seal the deal. Proven to increase conversions.",
  icon: "🎁",
  category: "cart_recovery",
  goal: "INCREASE_REVENUE",
  templateType: "CART_ABANDONMENT",
  recipeType: "use_case",
  component: "CartRecovery",
  layout: "centered",
  featured: true,
  tags: ["discount", "exit-intent", "high-converting", "cart-recovery"] as RecipeTag[],
  inputs: [{ ...DISCOUNT_PERCENTAGE_INPUT, defaultValue: 10 }, TRIGGER_INPUT],
  editableFields: CART_ABANDONMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "Wait! Here's 10% off 🎁",
      subheadline: "Complete your order now and save. This offer expires when you leave!",
      buttonText: "Apply Discount & Checkout",
      showCartItems: true,
      maxItemsToShow: 2,
      showCartTotal: true,
      showUrgency: true,
      urgencyMessage: "Offer expires when you leave",
      ctaUrl: "/checkout",
    },
    designConfig: {
      position: "center",
      size: "medium",
    },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true, sensitivity: "high" },
        cart_value: { enabled: true, min_value: 25 },
        trigger_combination: { operator: "AND" },
        frequency_capping: CART_ABANDONMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: CART_ABANDONMENT_PAGE_TARGETING,
    },
    discountConfig: {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 10,
      behavior: "SHOW_CODE_AND_AUTO_APPLY",
      applicability: {
        scope: "cart",
      },
    },
  },
};

/**
 * 3. URGENCY & SCARCITY - Fear of missing out
 * Use case: Create urgency with stock warnings and timers
 * Best for: Limited inventory, popular items, fast-moving products
 */
const urgencyScarcity: CartAbandonmentRecipe = {
  id: "cart-urgency-scarcity",
  name: "Urgency & Scarcity",
  tagline: "Items selling fast - complete your order!",
  description:
    "Leverage FOMO with stock warnings and countdown timers. Perfect for popular items with limited stock.",
  icon: "⏰",
  category: "cart_recovery",
  goal: "INCREASE_REVENUE",
  templateType: "CART_ABANDONMENT",
  recipeType: "use_case",
  component: "CartRecoveryUrgent",
  layout: "centered",
  featured: true,
  tags: ["urgent", "bold", "exit-intent", "high-converting", "cart-recovery"] as RecipeTag[],
  inputs: [TRIGGER_INPUT],
  editableFields: CART_ABANDONMENT_EDITABLE_FIELDS,
  defaults: {
    contentConfig: {
      headline: "⚠️ Your items are selling fast!",
      subheadline:
        "Other shoppers are viewing these items. Complete your order before they're gone!",
      buttonText: "Secure My Order",
      showCartItems: true,
      maxItemsToShow: 3,
      showCartTotal: true,
      showUrgency: true,
      urgencyTimer: 300, // 5 minutes
      urgencyMessage: "Reserved for 5 minutes",
      showStockWarnings: true,
      stockWarningMessage: "Low stock - only a few left!",
      ctaUrl: "/checkout",
    },
    designConfig: {
      position: "center",
      size: "medium",
    },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true, sensitivity: "high" },
        cart_value: { enabled: true, min_value: 25 },
        frequency_capping: CART_ABANDONMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: CART_ABANDONMENT_PAGE_TARGETING,
    },
  },
};

/**
 * 5. EMAIL SAVE - Capture email for recovery
 * Use case: Capture email to send cart recovery email later
 * Best for: Stores with email marketing, building list
 */
const emailSave: CartAbandonmentRecipe = {
  id: "cart-email-save",
  name: "Save Cart for Later",
  tagline: "Email yourself your cart",
  description:
    "Capture email to send a cart recovery email. Great for building your email list while recovering carts.",
  icon: "📧",
  category: "cart_recovery",
  goal: "INCREASE_REVENUE",
  templateType: "CART_ABANDONMENT",
  recipeType: "use_case",
  component: "CartRecovery",
  layout: "centered",
  tags: ["email_leads", "exit-intent", "cart-recovery"] as RecipeTag[],
  inputs: [TRIGGER_INPUT],
  editableFields: [
    ...CART_ABANDONMENT_EDITABLE_FIELDS,
    {
      key: "emailPlaceholder",
      type: "text" as const,
      label: "Email Placeholder",
      group: "content",
    },
  ],
  defaults: {
    contentConfig: {
      headline: "Don't lose your cart! 📧",
      subheadline: "Enter your email and we'll save your cart for later.",
      // No buttonText - the email form submit button is the primary CTA
      showCartItems: true,
      maxItemsToShow: 2,
      showCartTotal: true,
      showUrgency: false,
      enableEmailRecovery: true,
      emailPlaceholder: "Enter your email",
      emailSuccessMessage: "Cart saved! Check your inbox.",
      emailButtonText: "Save My Cart",
      // Gate the checkout button behind email submission
      requireEmailBeforeCheckout: true,
    },
    designConfig: {
      position: "center",
      size: "medium",
    },
    targetRules: {
      enhancedTriggers: {
        exit_intent: { enabled: true, sensitivity: "medium" },
        cart_value: { enabled: true, min_value: 25 },
        frequency_capping: CART_ABANDONMENT_FREQUENCY_CAPPING,
      },
      pageTargeting: CART_ABANDONMENT_PAGE_TARGETING,
    },
  },
};

// =============================================================================
// EXPORT
// =============================================================================

// Cart abandonment recipes - ordered by popularity/utility
export const CART_ABANDONMENT_DESIGN_RECIPES: CartAbandonmentRecipe[] = [
  gentleReminder,
  discountIncentive,
  urgencyScarcity,
  emailSave,
];
