/**
 * Campaign Domain Types
 *
 * Core type definitions for the Campaign domain with template-driven content validation
 */

import { z } from "zod";
import type { LeadCaptureConfig } from "~/shared/types/lead-capture-config";

// =============================================================================
// LEAD CAPTURE CONFIG - Zod Schema matching the shared interface
// =============================================================================

/**
 * Zod schema for LeadCaptureConfig.
 * This MUST stay in sync with the LeadCaptureConfig interface.
 * TypeScript will error if the interface and schema diverge.
 */
export const LeadCaptureConfigSchema = z.object({
  // Email
  emailRequired: z.boolean().default(true),
  emailLabel: z.string().optional(),
  emailPlaceholder: z.string().default("Enter your email"),
  emailErrorMessage: z.string().optional(),
  // Name
  nameFieldEnabled: z.boolean().default(false),
  nameFieldRequired: z.boolean().default(false),
  nameFieldLabel: z.string().optional(),
  nameFieldPlaceholder: z.string().optional(),
  // Consent
  consentFieldEnabled: z.boolean().default(false),
  consentFieldRequired: z.boolean().default(false),
  consentFieldText: z.string().optional(),
  privacyPolicyUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * Type derived from Zod schema - use this for runtime-validated data.
 * The interface LeadCaptureConfig is for documentation and IDE support.
 */
export type LeadCaptureConfigParsed = z.infer<typeof LeadCaptureConfigSchema>;

// Type-check: Ensure the schema output is compatible with the interface
// This will error at compile time if we add a field to the interface but not the schema
type _AssertSchemaHasAllFields =
  Required<LeadCaptureConfig> extends LeadCaptureConfigParsed
    ? true
    : "Schema is missing fields from LeadCaptureConfig interface";
const _schemaCheck: _AssertSchemaHasAllFields = true;

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const CampaignGoalSchema = z.enum(["NEWSLETTER_SIGNUP", "INCREASE_REVENUE", "ENGAGEMENT"]);

export const CampaignStatusSchema = z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]);

export const TemplateTypeSchema = z.enum([
  "NEWSLETTER",
  "SPIN_TO_WIN",
  "FLASH_SALE",
  "FREE_SHIPPING",
  "EXIT_INTENT",
  "CART_ABANDONMENT",
  "PRODUCT_UPSELL",
  "SOCIAL_PROOF",
  "COUNTDOWN_TIMER",
  "SCRATCH_CARD",
  "ANNOUNCEMENT",
  // New upsell popup template types
  "CLASSIC_UPSELL",
  "MINIMAL_SLIDE_UP",
  "PREMIUM_FULLSCREEN",
  "COUNTDOWN_URGENCY",
]);

/**
 * Discount Type Enums
 * Centralized discount-related enums for type safety
 */

// Main discount configuration enums (used in DiscountConfig)
export const DiscountTypeSchema = z.enum(["shared", "single_use"]);

export const DiscountValueTypeSchema = z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]);

/**
 * Discount Behavior - Simplified mutually exclusive options
 *
 * SHOW_CODE_AND_AUTO_APPLY: Display code + auto-apply to cart
 * SHOW_CODE_ONLY: Display code only (manual entry required)
 * SHOW_CODE_AND_ASSIGN_TO_EMAIL: Display code + restrict to captured email
 */
export const DiscountBehaviorSchema = z.enum([
  "SHOW_CODE_AND_AUTO_APPLY",
  "SHOW_CODE_ONLY",
  "SHOW_CODE_AND_ASSIGN_TO_EMAIL",
]);

export const DiscountStrategySchema = z.enum([
  "simple",
  "bundle",
  "tiered",
  "bogo",
  "free_gift",
]);

// Content-level discount type enum (used in template content configs like SpinToWin, FlashSale)
// Lowercase for UI display purposes
export const ContentDiscountTypeSchema = z.enum(["percentage", "fixed_amount", "free_shipping"]);

export type CampaignGoal = z.infer<typeof CampaignGoalSchema>;
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;
export type TemplateType = z.infer<typeof TemplateTypeSchema>;
export const TemplateTypeEnum = TemplateTypeSchema.enum;

export type DiscountType = z.infer<typeof DiscountTypeSchema>;
export type DiscountValueType = z.infer<typeof DiscountValueTypeSchema>;
export type DiscountBehavior = z.infer<typeof DiscountBehaviorSchema>;
export type DiscountStrategy = z.infer<typeof DiscountStrategySchema>;
export type ContentDiscountType = z.infer<typeof ContentDiscountTypeSchema>;

// ============================================================================
// DISCOUNT CONFIGURATION
// ============================================================================

/**
 * Discount Configuration Schema
 * Centralized discount configuration with proper enum types
 * Enhanced with applicability scoping, tiers, BOGO, free gifts, and simplified behavior
 */
export const DiscountConfigSchema = z.object({
  enabled: z.boolean().default(false),
  showInPreview: z.boolean().default(true),
  strategy: DiscountStrategySchema.default("simple"),

  // Discount type and value
  type: DiscountTypeSchema.optional(),
  valueType: DiscountValueTypeSchema.optional(),
  value: z.number().min(0).optional(),
  code: z.string().optional(),

  /**
   * Discount behavior - how the code is shown and applied (mutually exclusive)
   * - SHOW_CODE_AND_AUTO_APPLY: Display code + auto-apply to cart
   * - SHOW_CODE_ONLY: Display code only (customer must manually enter)
   * - SHOW_CODE_AND_ASSIGN_TO_EMAIL: Display code + restrict to captured email
   */
  behavior: DiscountBehaviorSchema.default("SHOW_CODE_AND_AUTO_APPLY"),

  // Email authorization fields (used at runtime for SHOW_CODE_AND_ASSIGN_TO_EMAIL behavior)
  authorizedEmail: z.string().email().optional(),
  requireEmailMatch: z.boolean().optional(),

  // Constraints
  minimumAmount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  expiryDays: z.number().min(1).optional(),

  // Metadata
  prefix: z.string().optional(),
  description: z.string().optional(),

  // === ENHANCED FEATURES ===

  // Applicability: Scope discount to specific products/collections
  // - "all": Entire store (any products) - good for newsletter/welcome discounts
  // - "cart": Entire cart (current cart items) - good for cart abandonment
  // - "products": Specific products only
  // - "collections": Specific collections only
  applicability: z
    .object({
      scope: z.enum(["all", "cart", "products", "collections"]).default("all"),
      productIds: z.array(z.string()).optional(), // Shopify product GIDs
      collectionIds: z.array(z.string()).optional(), // Shopify collection GIDs
    })
    .optional(),

  // Tiered spend discounts: "Spend $50 get 15%, $100 get 25%"
  tiers: z
    .array(
      z.object({
        thresholdCents: z.number().int().min(0), // Subtotal threshold in cents
        discount: z.object({
          kind: z.enum(["percentage", "fixed", "free_shipping"]),
          value: z.number().min(0).max(100), // Percentage (0-100) or fixed amount
        }),
      })
    )
    .optional(),

  // BOGO (Buy X Get Y): "Buy 2 get 1 free"
  bogo: z
    .object({
      buy: z.object({
        scope: z.enum(["any", "products", "collections"]).default("any"),
        ids: z.array(z.string()).optional(), // Product/collection GIDs
        quantity: z.number().int().min(1),
        minSubtotalCents: z.number().int().min(0).optional(),
      }),
      get: z.object({
        scope: z.enum(["products", "collections"]),
        ids: z.array(z.string()), // Product/collection GIDs (required)
        // Variant IDs for add-to-cart functionality (parallel array to ids)
        variantIds: z.array(z.string()).optional(),
        // Product handles for navigation (parallel array to ids)
        productHandles: z.array(z.string()).optional(),
        quantity: z.number().int().min(1),
        discount: z.object({
          kind: z.enum(["percentage", "fixed", "free_product"]),
          value: z.number().min(0).max(100), // Percentage or amount (100 = free)
        }),
        appliesOncePerOrder: z.boolean().default(true),
      }),
    })
    .optional(),

  // Free gift with purchase
  freeGift: z
    .object({
      productId: z.string(), // Shopify product GID
      variantId: z.string(), // Shopify variant GID
      productTitle: z.string().optional(), // Product title for storefront display
      productImageUrl: z.string().url().optional(), // Product image URL for storefront display
      quantity: z.number().int().min(1).default(1),
      minSubtotalCents: z.number().int().min(0).optional(),
    })
    .optional(),

  // Customer eligibility
  customerEligibility: z.enum(["everyone", "logged_in", "segment"]).optional(),

  // Discount combining/stacking rules
  combineWith: z
    .object({
      orderDiscounts: z.boolean().optional(),
      productDiscounts: z.boolean().optional(),
      shippingDiscounts: z.boolean().optional(),
    })
    .optional(),

  // Internal metadata (Shopify discount IDs, tier code mappings)
  _meta: z
    .object({
      createdDiscountIds: z.array(z.string()).optional(), // Shopify discount node IDs
      tierCodeMappings: z.record(z.string(), z.string()).optional(), // { "5000": "CAMPAIGN-123-T50", ... }
      lastSync: z.string().optional(), // ISO timestamp
    })
    .optional(),
});

export type DiscountConfig = z.infer<typeof DiscountConfigSchema>;

/**
 * Helper function to validate discount behavior requirements
 * Returns error message if validation fails, undefined if valid
 */
export function validateDiscountBehavior(
  behavior: DiscountBehavior | undefined,
  hasEmailCapture: boolean,
  discountSupportsEmailRestriction: boolean = true
): string | undefined {
  if (behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL") {
    if (!hasEmailCapture) {
      return "Email assignment requires email capture to be enabled in the campaign";
    }
    if (!discountSupportsEmailRestriction) {
      return "This discount type does not support email-specific assignment";
    }
  }
  return undefined;
}

/**
 * Helper function to determine if auto-apply should be triggered
 */
export function shouldAutoApply(behavior: DiscountBehavior | undefined): boolean {
  return behavior === "SHOW_CODE_AND_AUTO_APPLY";
}

/**
 * Helper function to determine if discount requires email restriction
 */
export function requiresEmailRestriction(behavior: DiscountBehavior | undefined): boolean {
  return behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL";
}

// ============================================================================
// BASE CONTENT CONFIGURATION
// ============================================================================

/**
 * Base Content Configuration
 * Fields that all templates share
 */
export const BaseContentConfigSchema = z.object({
  headline: z.string().min(1, "Headline is required"),
  subheadline: z.string().optional(),
  // buttonText is now optional - new templates use cta.label instead
  // Legacy support: if cta is not defined, buttonText is used
  buttonText: z.string().optional(),
  dismissLabel: z.string().optional(),
  // Made optional with default - many templates don't show this field in the UI
  // but still need it for validation. Templates that use it (Newsletter, Flash Sale)
  // can override this in their forms.
  successMessage: z.string().default("Thank you!"),
  failureMessage: z.string().optional(),
  ctaText: z.string().optional(), // Call-to-action text (alternative to buttonText)
});

export type BaseContentConfig = z.infer<typeof BaseContentConfigSchema>;

// ============================================================================
// TEMPLATE-SPECIFIC CONTENT SCHEMAS
// ============================================================================

/**
 * Badge/Tag icon options for promotional badges
 */
export const BadgeIconSchema = z.enum([
  "sparkle",
  "leaf",
  "star",
  "gift",
  "heart",
  "percent",
  "fire",
  "none",
]);
export type BadgeIcon = z.infer<typeof BadgeIconSchema>;

/**
 * Newsletter-specific content fields
 *
 * Extends BaseContentConfigSchema with:
 * - LeadCaptureConfigSchema (email, name, consent fields)
 * - Newsletter-specific fields (submitButtonText)
 */
export const NewsletterContentSchema = BaseContentConfigSchema.merge(
  LeadCaptureConfigSchema
).extend({
  // Newsletter-specific - defaults to "Subscribe" if not provided
  submitButtonText: z.string().default("Subscribe"),
  // Label shown above the discount code on success (e.g., "Your discount code:")
  discountCodeLabel: z.string().default("Your discount code:"),

  // Badge/Tag above headline (e.g., "Exclusive offers inside")
  tagText: z.string().optional(),
  tagIcon: BadgeIconSchema.optional(),

  // Image floating badge (social proof)
  imageBadgeEnabled: z.boolean().optional().default(false),
  imageBadgeIcon: BadgeIconSchema.optional(),
  imageBadgeTitle: z.string().optional(), // e.g., "Join"
  imageBadgeValue: z.string().optional(), // e.g., "10,000+ members"

  // Footer disclaimer text
  footerText: z.string().optional(), // e.g., "Unsubscribe anytime. We respect your privacy."

  // Success state enhancements
  successBadgeText: z.string().optional(), // e.g., "10% off your first retreat"
  successBadgeIcon: BadgeIconSchema.optional(),
});

/**
 * Default wheel segments for Spin-to-Win
 * Using full discount configurations for maximum flexibility
 */
const DEFAULT_SPIN_TO_WIN_SEGMENTS = [
  {
    id: "segment-5-off",
    label: "5% OFF",
    probability: 0.35,
    color: "#10B981",
    discountConfig: {
      enabled: true,
      showInPreview: true,
      valueType: "PERCENTAGE" as const,
      value: 5,
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
      expiryDays: 30,
      type: "single_use" as const,
    },
  },
  {
    id: "segment-10-off",
    label: "10% OFF",
    probability: 0.25,
    color: "#3B82F6",
    discountConfig: {
      enabled: true,
      showInPreview: true,
      valueType: "PERCENTAGE" as const,
      value: 10,
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
      expiryDays: 30,
      type: "single_use" as const,
    },
  },
  {
    id: "segment-15-off",
    label: "15% OFF",
    probability: 0.15,
    color: "#F59E0B",
    discountConfig: {
      enabled: true,
      showInPreview: true,
      valueType: "PERCENTAGE" as const,
      value: 15,
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
      expiryDays: 30,
      type: "single_use" as const,
    },
  },
  {
    id: "segment-20-off",
    label: "20% OFF",
    probability: 0.1,
    color: "#EF4444",
    discountConfig: {
      enabled: true,
      showInPreview: true,
      valueType: "PERCENTAGE" as const,
      value: 20,
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
      expiryDays: 30,
      type: "single_use" as const,
    },
  },
  {
    id: "segment-free-shipping",
    label: "FREE SHIPPING",
    probability: 0.1,
    color: "#8B5CF6",
    discountConfig: {
      enabled: true,
      showInPreview: true,
      valueType: "FREE_SHIPPING" as const,
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
      expiryDays: 30,
      type: "single_use" as const,
    },
  },
  {
    id: "segment-try-again",
    label: "Try Again",
    probability: 0.05,
    color: "#6B7280",
    // No discount config for "try again" segment
  },
];

/**
 * Spin-to-Win specific content fields
 */
const SpinToWinBaseContentSchema = BaseContentConfigSchema.omit({
  successMessage: true,
});

export const SpinToWinContentSchema = SpinToWinBaseContentSchema.merge(
  LeadCaptureConfigSchema
).extend({
  spinButtonText: z.string(),

  // Wheel configuration
  wheelSegments: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        probability: z.number().min(0).max(1),
        color: z.string().optional(),
        // Full discount configuration per segment (replaces old discountType/Value/Code)
        discountConfig: DiscountConfigSchema.optional(),
      })
    )
    .min(2, "At least 2 wheel segments required")
    .default(DEFAULT_SPIN_TO_WIN_SEGMENTS),
  maxAttemptsPerUser: z.number().int().min(1).default(1),

  // Advanced wheel configuration
  wheelSize: z.number().int().min(200).max(800).default(400),
  wheelBorderWidth: z.number().int().min(0).max(20).default(2),
  wheelBorderColor: z.string().optional(),
  spinDuration: z.number().int().min(1000).max(10000).default(4000),
  minSpins: z.number().int().min(1).max(20).default(5),
  loadingText: z.string().optional(),

  // Enhanced wheel styling (for premium themes like Lucky Fortune)
  wheelGlowEnabled: z.boolean().default(false),
  wheelGlowColor: z.string().optional(), // Defaults to accentColor if not specified
  wheelCenterStyle: z.enum(["simple", "gradient", "metallic"]).default("simple"),

  // Promotional badge (shown above headline)
  badgeEnabled: z.boolean().default(false),
  badgeText: z.string().optional(), // e.g., "Limited Time Offer"
  badgeIcon: z.enum(["sparkles", "star", "gift", "fire", "clock"]).optional(),

  // Result state customization
  showResultIcon: z.boolean().default(false),
  resultIconType: z.enum(["trophy", "gift", "star", "confetti"]).default("trophy"),
});

/**
 * Flash Sale specific content fields
 * Enhanced with advanced timer modes, real-time inventory, and reservation features
 *
 * Note: discountPercentage is optional because:
 * - BOGO campaigns use discountConfig.bogo instead
 * - Tiered campaigns use discountConfig.tiers instead
 * - Free Gift campaigns use discountConfig.freeGift instead
 * Only basic percentage discounts need discountPercentage in contentConfig
 */
export const FlashSaleContentSchema = BaseContentConfigSchema.extend({
  urgencyMessage: z.string().min(1, "Urgency message is required"),
  discountPercentage: z.number().min(0).max(100).optional(), // Optional for BOGO/Tiered/FreeGift
  originalPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  showCountdown: z.boolean().default(true),
  endTime: z.string().optional(), // ISO date string
  countdownDuration: z.number().int().min(60).default(3600), // seconds
  hideOnExpiry: z.boolean().default(true),
  autoHideOnExpire: z.boolean().default(false),
  showStockCounter: z.boolean().default(false),
  stockMessage: z.string().optional(),
  ctaUrl: z.string().optional(),

  // Note: Background image configuration is now in DesignConfigSchema
  // (imageUrl, imagePosition, backgroundImageMode, backgroundOverlayOpacity)

  // === ENHANCED FEATURES ===

  // Advanced timer configuration
  timer: z
    .object({
      mode: z.enum(["fixed_end", "duration", "personal", "stock_limited"]).default("duration"),
      endTimeISO: z.string().optional(), // For fixed_end mode
      durationSeconds: z.number().int().min(60).optional(), // For duration mode
      personalWindowSeconds: z.number().int().min(60).optional(), // For personal mode (e.g., 30 min from first view)
      timezone: z.enum(["shop", "visitor"]).default("shop"),
      onExpire: z.enum(["auto_hide", "collapse", "swap_message"]).default("auto_hide"),
      expiredMessage: z.string().optional(),
    })
    .optional(),

  // Real-time inventory tracking
  inventory: z
    .object({
      mode: z.enum(["real", "pseudo"]).default("pseudo"),
      productIds: z.array(z.string()).optional(), // Shopify product GIDs
      variantIds: z.array(z.string()).optional(), // Shopify variant GIDs
      collectionIds: z.array(z.string()).optional(), // Shopify collection GIDs
      pseudoMax: z.number().int().min(1).optional(), // For pseudo mode: fake max inventory
      showOnlyXLeft: z.boolean().default(true),
      showThreshold: z.number().int().min(1).default(10), // Show "Only X left" when ≤ this value
      soldOutBehavior: z.enum(["hide", "missed_it"]).default("hide"),
      soldOutMessage: z.string().optional(),
    })
    .optional(),

  // Soft reservation timer ("X minutes to claim this offer")
  reserve: z
    .object({
      enabled: z.boolean().default(false),
      minutes: z.number().int().min(1).default(10),
      label: z.string().optional(), // e.g., "Offer reserved for:"
      disclaimer: z.string().optional(), // e.g., "Inventory not guaranteed"
    })
    .optional(),

  // CTA (Call-to-Action) configuration - uses unified CTA system
  // See app/domains/campaigns/types/cta.ts for full schema
  cta: z
    .object({
      // Display
      label: z.string().min(1).default("Shop Now"),
      variant: z.enum(["primary", "secondary", "link"]).default("primary"),

      // Action type
      action: z
        .enum([
          "navigate_url",
          "navigate_product",
          "navigate_collection",
          "add_to_cart",
          "add_to_cart_checkout",
        ])
        .default("navigate_collection"),

      // Navigation config
      url: z.string().optional(),
      productId: z.string().optional(),
      productHandle: z.string().optional(),
      collectionId: z.string().optional(),
      collectionHandle: z.string().optional(),
      openInNewTab: z.boolean().default(false),

      // Cart config
      variantId: z.string().optional(),
      quantity: z.number().int().min(1).default(1),

      // Discount integration
      /** @deprecated Use successBehavior instead */
      applyDiscountFirst: z.boolean().optional(), // Defaults to true in handler

      // Success behavior (new single-click flow)
      // Note: successMessage is in contentConfig, not here (to avoid duplication)
      successBehavior: z.object({
        showDiscountCode: z.boolean().optional(),
        autoCloseDelay: z.number().int().min(0).optional(), // Defaults to 5 in handler
        secondaryAction: z.object({
          label: z.string(),
          url: z.string(),
        }).optional(),
      }).optional(),
    })
    .optional(),

  // Secondary CTA (dismiss/alternative action)
  secondaryCta: z
    .object({
      label: z.string().default("No thanks"),
      action: z.enum(["dismiss", "navigate_url"]).default("dismiss"),
      url: z.string().optional(),
    })
    .optional(),

  // Presentation settings
  presentation: z
    .object({
      placement: z.enum(["center", "bottom_right", "bottom_left"]).default("center"),
      badgeStyle: z.enum(["pill", "tag"]).default("pill"),
      showTimer: z.boolean().default(true),
      showInventory: z.boolean().default(true),
    })
    .optional(),
});

/**
 * Cart Abandonment specific content fields
 */
export const CartAbandonmentContentSchema = BaseContentConfigSchema.extend({
  showCartItems: z.boolean().default(true),
  maxItemsToShow: z.number().int().min(1).max(10).default(3),
  showCartTotal: z.boolean().default(true),
  showUrgency: z.boolean().default(true),
  urgencyTimer: z.number().int().min(60).max(3600).default(300), // seconds
  urgencyMessage: z.string().optional(),
  showStockWarnings: z.boolean().default(false),
  stockWarningMessage: z.string().optional(),
  ctaUrl: z.string().optional(),
  saveForLaterText: z.string().optional(),
  currency: z.string().default("USD"),

  // Optional email recovery flow (email capture + redirect to checkout)
  enableEmailRecovery: z.boolean().default(false),
  emailPlaceholder: z.string().optional(),
  emailSuccessMessage: z.string().optional(),
  emailErrorMessage: z.string().optional(),
  emailButtonText: z.string().optional(),
  requireEmailBeforeCheckout: z.boolean().default(false),
});

/**
 * Product Upsell specific content fields
 */
export const ProductUpsellContentSchema = BaseContentConfigSchema.extend({
  productSelectionMethod: z.enum(["ai", "manual", "collection"]).default("ai"),
  selectedProducts: z.array(z.string()).optional(),
  selectedCollection: z.string().optional(),
  maxProducts: z.number().int().min(1).max(12).default(3),
  /**
   * Layout options:
   * - grid: Traditional grid layout (default)
   * - card: Horizontal list items
   * - carousel: One product at a time with peek of next/prev - great for mobile
   * - featured: Hero product prominently displayed + smaller grid of others
   * - stack: Overlapping cards like a deck - interactive and fun
   * - classic: Traditional centered modal with image, pricing, and clear CTAs (single product)
   * - minimal-slide-up: Compact bottom sheet ideal for mobile-first experiences (single product)
   * - premium-fullscreen: Immersive full-page takeover for high-value products (single product)
   * - bundle-deal: Multi-product bundle offer with combined savings
   * - countdown-urgency: Time-limited offer with live countdown timer (single product)
   */
  layout: z
    .enum([
      "grid",
      "card",
      "carousel",
      "featured",
      "stack",
      "classic",
      "minimal-slide-up",
      "premium-fullscreen",
      "bundle-deal",
      "countdown-urgency",
    ])
    .default("grid"),
  columns: z.number().int().min(1).max(4).default(2),
  showPrices: z.boolean().default(true),
  showCompareAtPrice: z.boolean().default(true),
  showImages: z.boolean().default(true),
  showRatings: z.boolean().default(false),
  showReviewCount: z.boolean().default(false),
  bundleDiscount: z.number().min(0).max(100).default(15),
  bundleDiscountText: z.string().optional(),
  multiSelect: z.boolean().default(true),
  secondaryCtaLabel: z.string().optional(),
  currency: z.string().default("USD"),

  // Premium Fullscreen layout specific fields
  /** Features list displayed in premium-fullscreen layout */
  features: z.array(z.string()).optional(),
  /** Urgency message displayed at the top (e.g., "Limited time offer") */
  urgencyMessage: z.string().optional(),

  // Countdown Urgency layout specific fields
  /** Countdown duration in seconds (default: 300 = 5 minutes) */
  expiresInSeconds: z.number().int().min(30).max(3600).default(300),
  /** Social proof message (e.g., "127 people added this in the last hour") */
  socialProofMessage: z.string().optional(),

  // Bundle Deal layout specific fields
  /** Header text for bundle deal (e.g., "Bundle & Save 15%") */
  bundleHeaderText: z.string().optional(),
  /** Subheader text for bundle deal */
  bundleSubheaderText: z.string().optional(),
});

/**
 * Social Proof specific content fields
 */
export const SocialProofContentSchema = BaseContentConfigSchema.extend({
  enablePurchaseNotifications: z.boolean().default(true),
  enableVisitorNotifications: z.boolean().default(false),
  enableReviewNotifications: z.boolean().default(false),
  purchaseMessageTemplate: z.string().optional(),
  visitorMessageTemplate: z.string().optional(),
  reviewMessageTemplate: z.string().optional(),
  cornerPosition: z
    .enum(["bottom-left", "bottom-right", "top-left", "top-right"])
    .default("bottom-left"),
  displayDuration: z.number().int().min(1).max(30).default(6), // seconds
  rotationInterval: z.number().int().min(1).max(60).default(8), // seconds
  maxNotificationsPerSession: z.number().int().min(1).max(20).default(5),
  minVisitorCount: z.number().int().min(1).optional(),
  minReviewRating: z.number().min(1).max(5).optional(),
  messageTemplates: z
    .object({
      purchase: z.string().optional(),
      visitor: z.string().optional(),
      review: z.string().optional(),
    })
    .optional(),
  showProductImage: z.boolean().default(true),
  showTimer: z.boolean().default(true),
});

/**
 * Default prizes for Scratch Card
 * Designed to be profitable with expected discount of ~10.5%
 */
const DEFAULT_SCRATCH_CARD_PRIZES = [
  {
    id: "prize-5-off",
    label: "5% OFF",
    probability: 0.4,
    discountConfig: {
      enabled: true,
      showInPreview: true,
      valueType: "PERCENTAGE" as const,
      value: 5,
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
      expiryDays: 30,
      type: "single_use" as const,
    },
  },
  {
    id: "prize-10-off",
    label: "10% OFF",
    probability: 0.3,
    discountConfig: {
      enabled: true,
      showInPreview: true,
      valueType: "PERCENTAGE" as const,
      value: 10,
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
      expiryDays: 30,
      type: "single_use" as const,
    },
  },
  {
    id: "prize-15-off",
    label: "15% OFF",
    probability: 0.2,
    discountConfig: {
      enabled: true,
      showInPreview: true,
      valueType: "PERCENTAGE" as const,
      value: 15,
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
      expiryDays: 30,
      type: "single_use" as const,
    },
  },
  {
    id: "prize-20-off",
    label: "20% OFF",
    probability: 0.1,
    discountConfig: {
      enabled: true,
      showInPreview: true,
      valueType: "PERCENTAGE" as const,
      value: 20,
      behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
      expiryDays: 30,
      type: "single_use" as const,
    },
  },
];

/**
 * Scratch Card specific content fields
 * Note: We omit successMessage since the discount code display serves as success feedback
 * (similar to Spin-to-Win)
 */
const ScratchCardBaseContentSchema = BaseContentConfigSchema.omit({
  successMessage: true,
});

export const ScratchCardContentSchema = ScratchCardBaseContentSchema.merge(
  LeadCaptureConfigSchema
).extend({
  scratchInstruction: z.string(),
  emailBeforeScratching: z.boolean().default(false),
  scratchThreshold: z.number().min(0).max(100).default(50),
  scratchRadius: z.number().min(5).max(100).default(20),
  prizes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        probability: z.number().min(0).max(1),
        discountConfig: DiscountConfigSchema.optional(),
      })
    )
    .min(1, "At least one prize required")
    .default(DEFAULT_SCRATCH_CARD_PRIZES),
});

/**
 * Free Shipping specific content fields
 * Progress bar showing distance to free shipping threshold with 4 states:
 * - empty: Cart is empty
 * - progress: Making progress toward threshold
 * - near-miss: Very close to threshold (creates urgency)
 * - unlocked: Threshold reached
 */
export const FreeShippingContentSchema = z.object({
  // Threshold Configuration
  threshold: z.number().min(0).default(75), // Renamed from freeShippingThreshold for consistency with mockup
  currency: z.string().default("$"),
  nearMissThreshold: z.number().min(0).default(10), // Amount remaining to trigger "near-miss" state

  // State Messages
  emptyMessage: z.string().default("Add items to unlock free shipping"),
  progressMessage: z.string().default("You're {remaining} away from free shipping"),
  nearMissMessage: z.string().default("Only {remaining} to go!"),
  unlockedMessage: z.string().default("You've unlocked free shipping! 🎉"),

  // Display Options
  barPosition: z.enum(["top", "bottom"]).default("top"), // Renamed from 'position' to avoid conflict with PopupDesignConfig
  dismissible: z.boolean().default(true),
  dismissLabel: z.string().optional(),
  showIcon: z.boolean().default(true),
  celebrateOnUnlock: z.boolean().default(true),
  animationDuration: z.number().int().min(100).max(2000).default(500), // milliseconds

  // Preview-only (admin): cart total to simulate progress in Live Preview
  previewCartTotal: z.number().min(0).default(0),

  // Optional email gate for claiming the discount once threshold is reached
  requireEmailToClaim: z.boolean().default(false),
  claimButtonLabel: z.string().default("Claim discount"),
  claimEmailPlaceholder: z.string().default("Enter your email"),
  claimSuccessMessage: z.string().default("Discount claimed! Your savings are ready."),
  claimErrorMessage: z.string().default("Something went wrong. Please try again."),
});

/**
 * Countdown Timer specific content fields
 */
export const CountdownTimerContentSchema = BaseContentConfigSchema.extend({
  endTime: z.string().optional(), // ISO date string
  countdownDuration: z.number().int().min(60).default(3600), // seconds
  hideOnExpiry: z.boolean().default(true),
  showStockCounter: z.boolean().default(false),
  stockCount: z.number().int().min(0).optional(),
  sticky: z.boolean().default(true),
  ctaUrl: z.string().optional(),
  colorScheme: z.enum(["urgent", "success", "info", "custom"]).default("custom"),
});

/**
 * Announcement specific content fields
 */
export const AnnouncementContentSchema = BaseContentConfigSchema.extend({
  sticky: z.boolean().default(true),
  icon: z.string().optional(),
  ctaUrl: z.string().optional(),
  ctaOpenInNewTab: z.boolean().default(false),
  colorScheme: z.enum(["urgent", "success", "info", "custom"]).default("custom"),
});

// ============================================================================
// NEW UPSELL POPUP TEMPLATE CONTENT SCHEMAS
// ============================================================================

/**
 * Classic Upsell - Traditional centered modal with image, pricing, and clear CTAs
 */
export const ClassicUpsellContentSchema = BaseContentConfigSchema.extend({
  productSelectionMethod: z.enum(["ai", "manual", "collection"]).default("manual"),
  selectedProducts: z.array(z.string()).optional(),
  selectedCollection: z.string().optional(),
  showPrices: z.boolean().default(true),
  showCompareAtPrice: z.boolean().default(true),
  showImages: z.boolean().default(true),
  showRatings: z.boolean().default(true),
  // Use bundleDiscount to align with ProductUpsell and enable discount code issuance
  bundleDiscount: z.number().min(0).max(100).default(15),
  bundleDiscountText: z.string().optional(),
  secondaryCtaLabel: z.string().default("No thanks"),
  currency: z.string().default("USD"),
});

/**
 * Minimal Slide-Up - Compact bottom sheet for mobile-first experiences
 */
export const MinimalSlideUpContentSchema = BaseContentConfigSchema.extend({
  productSelectionMethod: z.enum(["ai", "manual", "collection"]).default("ai"),
  selectedProducts: z.array(z.string()).optional(),
  selectedCollection: z.string().optional(),
  showPrices: z.boolean().default(true),
  showCompareAtPrice: z.boolean().default(true),
  showImages: z.boolean().default(true),
  secondaryCtaLabel: z.string().default("Continue shopping"),
  currency: z.string().default("USD"),
});

/**
 * Premium Fullscreen - Immersive full-page takeover for high-value products
 */
export const PremiumFullscreenContentSchema = BaseContentConfigSchema.extend({
  productSelectionMethod: z.enum(["ai", "manual", "collection"]).default("manual"),
  selectedProducts: z.array(z.string()).optional(),
  selectedCollection: z.string().optional(),
  showPrices: z.boolean().default(true),
  showCompareAtPrice: z.boolean().default(true),
  showImages: z.boolean().default(true),
  showRatings: z.boolean().default(true),
  showReviewCount: z.boolean().default(true),
  // Use bundleDiscount to align with other upsell templates and enable discount code issuance
  bundleDiscount: z.number().min(0).max(100).default(20),
  bundleDiscountText: z.string().optional(),
  secondaryCtaLabel: z.string().default("Maybe later"),
  currency: z.string().default("USD"),
  /** Features list displayed in premium layout */
  features: z
    .array(z.string())
    .default(["Premium quality materials", "Free express shipping", "30-day money-back guarantee"]),
  /** Urgency message displayed at the top */
  urgencyMessage: z.string().optional(),
});

/**
 * Bundle Deal - Multi-product bundle offer with combined savings
 */
export const BundleDealContentSchema = BaseContentConfigSchema.extend({
  productSelectionMethod: z.enum(["ai", "manual", "collection"]).default("ai"),
  selectedProducts: z.array(z.string()).optional(),
  selectedCollection: z.string().optional(),
  maxProducts: z.number().int().min(2).max(6).default(4),
  showPrices: z.boolean().default(true),
  showCompareAtPrice: z.boolean().default(true),
  showImages: z.boolean().default(true),
  bundleDiscount: z.number().min(0).max(100).default(20),
  secondaryCtaLabel: z.string().default("Just the original item"),
  currency: z.string().default("USD"),
  /** Header text for bundle deal */
  bundleHeaderText: z.string().default("Bundle & Save 20%"),
  /** Subheader text for bundle deal */
  bundleSubheaderText: z.string().default("Complete your purchase with these items"),
});

/**
 * Countdown Urgency - Time-limited offer with live countdown timer
 */
export const CountdownUrgencyContentSchema = BaseContentConfigSchema.extend({
  productSelectionMethod: z.enum(["ai", "manual", "collection"]).default("manual"),
  selectedProducts: z.array(z.string()).optional(),
  selectedCollection: z.string().optional(),
  showPrices: z.boolean().default(true),
  showCompareAtPrice: z.boolean().default(true),
  showImages: z.boolean().default(true),
  // Use bundleDiscount to align with other upsell templates and enable discount code issuance
  bundleDiscount: z.number().min(0).max(100).default(25),
  bundleDiscountText: z.string().optional(),
  secondaryCtaLabel: z.string().default("No thanks"),
  currency: z.string().default("USD"),
  /** Countdown duration in seconds (default: 300 = 5 minutes) */
  expiresInSeconds: z.number().int().min(30).max(3600).default(300),
  /** Social proof message */
  socialProofMessage: z.string().optional(),
});

/**
 * Generic ContentConfig type (union of all possible content types)
 */
export type ContentConfig =
  | z.infer<typeof NewsletterContentSchema>
  | z.infer<typeof SpinToWinContentSchema>
  | z.infer<typeof FlashSaleContentSchema>
  | z.infer<typeof CartAbandonmentContentSchema>
  | z.infer<typeof ProductUpsellContentSchema>
  | z.infer<typeof SocialProofContentSchema>
  | z.infer<typeof ScratchCardContentSchema>
  | z.infer<typeof FreeShippingContentSchema>
  | z.infer<typeof CountdownTimerContentSchema>
  | z.infer<typeof AnnouncementContentSchema>
  | z.infer<typeof ClassicUpsellContentSchema>
  | z.infer<typeof MinimalSlideUpContentSchema>
  | z.infer<typeof PremiumFullscreenContentSchema>
  | z.infer<typeof BundleDealContentSchema>
  | z.infer<typeof CountdownUrgencyContentSchema>;

// Export individual content types
export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;
export type SpinToWinContent = z.infer<typeof SpinToWinContentSchema>;
export type FlashSaleContent = z.infer<typeof FlashSaleContentSchema>;
export type CartAbandonmentContent = z.infer<typeof CartAbandonmentContentSchema>;
export type ProductUpsellContent = z.infer<typeof ProductUpsellContentSchema>;
export type SocialProofContent = z.infer<typeof SocialProofContentSchema>;
export type ScratchCardContent = z.infer<typeof ScratchCardContentSchema>;
export type FreeShippingContent = z.infer<typeof FreeShippingContentSchema>;
export type CountdownTimerContent = z.infer<typeof CountdownTimerContentSchema>;
export type AnnouncementContent = z.infer<typeof AnnouncementContentSchema>;
export type ClassicUpsellContent = z.infer<typeof ClassicUpsellContentSchema>;
export type MinimalSlideUpContent = z.infer<typeof MinimalSlideUpContentSchema>;
export type PremiumFullscreenContent = z.infer<typeof PremiumFullscreenContentSchema>;
export type BundleDealContent = z.infer<typeof BundleDealContentSchema>;
export type CountdownUrgencyContent = z.infer<typeof CountdownUrgencyContentSchema>;

// ============================================================================
// OTHER CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Design Configuration Schema
 *
 * Theme System (Simplified):
 * - `theme`: Optional reference to which theme was used to populate colors (for UI display only)
 *   - When set (e.g., "modern"): Shows that theme as selected in the UI
 *   - When undefined: Shows "Custom" or "Store Default" in the UI
 * - Individual color fields (backgroundColor, textColor, etc.): ALWAYS stored, used for rendering
 * - When user selects a theme: Copy all theme colors into fields + set `theme`
 * - When user edits any color: Clear `theme` to indicate custom colors
 */
export const DesignConfigSchema = z.object({
  // Theme reference (for UI display only)
  // When set: indicates which theme colors were copied from
  // When undefined: indicates custom colors or store default was used
  // Note: themeMode is DEPRECATED - use theme instead
  theme: z
    .enum([
      // Generic themes
      "modern",
      "minimal",
      "dark",
      "gradient",
      "luxury",
      "neon",
      "ocean",
      // Seasonal themes (for styled recipes)
      "summer",
      "black-friday",
      "cyber-monday",
      "holiday",
      "valentine",
      "spring",
    ])
    .optional(),
  customThemePresetId: z.string().optional(), // ID of the applied custom theme preset

  // DEPRECATED: themeMode is no longer used - kept for backward compatibility
  // New campaigns should NOT set this field. Use `theme` field instead.
  themeMode: z.enum(["default", "shopify", "preset", "custom"]).optional(),
  presetId: z.string().optional(), // DEPRECATED: was used with themeMode: "preset"
  position: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
  size: z.enum(["small", "medium", "large", "fullscreen"]).default("medium"),
  popupSize: z.enum(["compact", "standard", "wide", "full"]).default("wide").optional(), // For FlashSale
  borderRadius: z.number().min(0).max(50).default(8),
  animation: z.enum(["fade", "slide", "bounce", "none"]).default("fade"),
  displayMode: z.enum(["popup", "banner", "slide-in", "inline"]).optional(),
  showCloseButton: z.boolean().default(true).optional(),

  // Layout variant (used to pick component variant, e.g., FlashSaleCentered vs FlashSaleSplit)
  // This enables recipes to specify different component layouts without database schema changes
  // Optional for backward compatibility - defaults to "centered" when not specified
  layout: z
    .enum([
      "centered", // Default modal in center
      "split-left", // Image on left, content on right
      "split-right", // Content on left, image on right
      "fullscreen", // Full viewport
      "banner-top", // Top sticky bar
      "banner-bottom", // Bottom sticky bar
      "sidebar-left", // Slide-in from left
      "sidebar-right", // Slide-in from right
    ])
    .default("centered")
    .optional(),

  // Image settings
  imageUrl: z.string().optional(),
  backgroundImageMode: z.enum(["none", "preset", "file"]).default("none"),
  backgroundImagePresetKey: z.string().optional(),
  backgroundImageFileId: z.string().optional(),
  backgroundOverlayOpacity: z.number().min(0).max(1).default(0.6).optional(), // Overlay opacity for full background images

  // Lead Capture Layout (Newsletter, Spin-to-Win, Scratch Card)
  leadCaptureLayout: z
    .object({
      desktop: z.enum(["split-left", "split-right", "stacked", "overlay", "content-only"]),
      mobile: z.enum(["stacked", "overlay", "fullscreen", "content-only"]),
      visualSizeDesktop: z.string().optional(),
      visualSizeMobile: z.string().optional(),
      contentOverlap: z.string().optional(),
      visualGradient: z.boolean().optional(),
    })
    .optional(),

  // Main colors
  backgroundColor: z.string().optional(), // Supports gradients and rgba
  textColor: z.string().optional(), // Supports rgba
  descriptionColor: z.string().optional(), // Specific color for description/subheadline text
  accentColor: z.string().optional(), // Supports rgba

  // Button colors
  buttonColor: z.string().optional(), // Supports rgba
  buttonTextColor: z.string().optional(), // Supports rgba

  // Input field colors
  inputBackgroundColor: z.string().optional(), // Supports rgba
  inputTextColor: z.string().optional(), // Supports rgba
  inputBorderColor: z.string().optional(), // Supports rgba
  inputPlaceholderColor: z.string().optional(), // Explicit placeholder text color

  // Image colors
  imageBgColor: z.string().optional(), // Background color for image placeholder

  // State colors
  successColor: z.string().optional(), // Success state color

  // Overlay colors
  overlayColor: z.string().optional(), // Supports rgba
  overlayOpacity: z.number().min(0).max(1).default(0.5),

  // Typography
  fontFamily: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.string().optional(),
  headlineFontFamily: z.string().optional(), // e.g., "Georgia, serif" for Spa Serenity
  titleFontSize: z.string().optional(),
  titleFontWeight: z.string().optional(),
  titleTextShadow: z.string().optional(),
  descriptionFontSize: z.string().optional(),
  descriptionFontWeight: z.string().optional(),

  // Input styling
  inputBackdropFilter: z.string().optional(),
  inputBoxShadow: z.string().optional(),
  inputBorderRadius: z.union([z.string(), z.number()]).optional(),
  inputBorderWidth: z.number().optional(), // 1 or 2
  inputStyle: z.enum(["outlined", "filled", "underline"]).optional(),
  inputFocusRingColor: z.string().optional(), // e.g., "rgba(22, 101, 52, 0.1)"
  inputFocusRingWidth: z.number().optional(), // e.g., 4

  // Button styling
  buttonBorderRadius: z.union([z.string(), z.number()]).optional(),
  buttonStyle: z.enum(["filled", "outline", "ghost"]).optional(),
  buttonBoxShadow: z.string().optional(),
  secondaryButtonColor: z.string().optional(),
  secondaryButtonTextColor: z.string().optional(),

  // Badge/Tag styling (for promotional badges like "Exclusive offers inside")
  badgeBackgroundColor: z.string().optional(),
  badgeTextColor: z.string().optional(),
  badgeBorderRadius: z.number().optional(),

  // Checkbox styling
  checkboxBorderRadius: z.number().optional(), // 4 for rounded, 999 for pill
  checkboxSize: z.number().optional(), // Size in pixels (default 20)

  // Text alignment and spacing
  textAlign: z.enum(["left", "center", "right"]).optional(),
  contentSpacing: z.enum(["compact", "comfortable", "spacious"]).optional(),

  // Image effects
  imageFilter: z.string().optional(),
  imageBorderRadius: z.union([z.string(), z.number()]).optional(),
  imagePosition: z.enum(["left", "right", "top", "bottom", "full", "none"]).optional(),

  // Scratch Card specific design properties
  scratchCardBackgroundColor: z.string().optional(),
  scratchCardTextColor: z.string().optional(),
  scratchOverlayColor: z.string().optional(),
  scratchOverlayImage: z.string().optional(),

  // Mobile-specific settings
  // When true, popup takes full viewport height on mobile (useful for Product Upsell, etc.)
  mobileFullScreen: z.boolean().optional(),

  // Advanced
  boxShadow: z.string().optional(),
  customCSS: z.string().optional(),
});

/**
 * Enhanced Triggers Configuration Schema (matching original structure)
 */
export const EnhancedTriggersConfigSchema = z.object({
  enabled: z.boolean().optional(),

  // Core trigger types
  page_load: z
    .object({
      enabled: z.boolean(),
      delay: z.number().min(0).optional(),
      require_dom_ready: z.boolean().optional(),
      require_images_loaded: z.boolean().optional(),
    })
    .optional(),

  exit_intent: z
    .object({
      enabled: z.boolean(),
      sensitivity: z.enum(["low", "medium", "high"]).optional(),
      delay: z.number().min(0).optional(),
      mobile_enabled: z.boolean().optional(),
      exclude_pages: z.array(z.string()).optional(),
    })
    .optional(),

  scroll_depth: z
    .object({
      enabled: z.boolean(),
      depth_percentage: z.number().min(0).max(100).optional(),
      direction: z.enum(["down", "up", "both"]).optional(),
      debounce_time: z.number().min(0).optional(),
      require_engagement: z.boolean().optional(),
    })
    .optional(),

  idle_timer: z
    .object({
      enabled: z.boolean(),
      idle_duration: z.number().min(1).optional(),
      mouse_movement_threshold: z.number().min(0).optional(),
      keyboard_activity: z.boolean().optional(),
      page_visibility: z.boolean().optional(),
    })
    .optional(),

  time_delay: z
    .object({
      enabled: z.boolean(),
      delay: z.number().min(0).optional(),
      immediate: z.boolean().optional(),
    })
    .optional(),

  // E-commerce specific triggers
  add_to_cart: z
    .object({
      enabled: z.boolean(),
      delay: z.number().min(0).optional(),
      immediate: z.boolean().optional(),
      productIds: z.array(z.string()).optional(),
      collectionIds: z.array(z.string()).optional(),
    })
    .optional(),

  cart_drawer_open: z
    .object({
      enabled: z.boolean(),
      delay: z.number().min(0).optional(),
      max_triggers_per_session: z.number().int().min(1).optional(),
    })
    .optional(),

  cart_value: z
    .object({
      enabled: z.boolean(),
      threshold: z.number().min(0).optional(),
      minValue: z.number().min(0).optional(),
      min_value: z.number().min(0).optional(),
      max_value: z.number().min(0).optional(),
      check_interval: z.number().min(0).optional(),
    })
    .optional(),

  product_view: z
    .object({
      enabled: z.boolean(),
      product_ids: z.array(z.string()).optional(),
      time_on_page: z.number().min(0).optional(),
      require_scroll: z.boolean().optional(),
    })
    .optional(),

  // Advanced targeting
  device_targeting: z
    .object({
      enabled: z.boolean(),
      device_types: z.array(z.enum(["desktop", "tablet", "mobile"])).optional(),
      operating_systems: z.array(z.string()).optional(),
      browsers: z.array(z.string()).optional(),
      connection_type: z.array(z.string()).optional(),
    })
    .optional(),

  page_targeting: z
    .object({
      enabled: z.boolean(),
      pages: z.array(z.string()).optional(),
      customPatterns: z.array(z.string()).optional(),
      excludePages: z.array(z.string()).optional(),
    })
    .optional(),

  // Frequency capping
  frequency_capping: z
    .object({
      max_triggers_per_session: z.number().min(1).optional(),
      max_triggers_per_day: z.number().min(1).optional(),
      cooldown_between_triggers: z.number().min(0).optional(),
    })
    .optional(),

  // Logic and combination
  trigger_combination: z
    .object({
      operator: z.enum(["AND", "OR"]).default("OR"),
    })
    .optional(),

  // Custom events
  custom_event: z
    .object({
      enabled: z.boolean(),
      event_name: z.string().optional(),
      event_names: z.array(z.string()).optional(),
      debounce_time: z.number().min(0).optional(),
    })
    .optional(),
});

/**
 * Audience Targeting Configuration Schema
 *
 * Shopify-first: customer-level audiences are defined via Shopify customer segments.
 * Cart-based targeting is now handled by the cart_value trigger in Enhanced Triggers.
 */
export const AudienceTargetingConfigSchema = z.object({
  enabled: z.boolean().default(false),

  // Shopify customer segments (primary "who" for known customers)
  shopifySegmentIds: z.array(z.string()).default([]),
});

/**
 * Page Targeting Configuration Schema
 */
export const PageTargetingConfigSchema = z.object({
  enabled: z.boolean().default(false),
  pages: z.array(z.string()).default([]),
  customPatterns: z.array(z.string()).default([]),
  excludePages: z.array(z.string()).default([]),
  // Optional product-level targeting
  productTags: z.array(z.string()).default([]),
  collections: z.array(z.string()).default([]), // Shopify collection GIDs
});

/**
 * Frequency Capping Configuration Schema
 */
export const FrequencyCappingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  maxViews: z.number().int().min(1).default(3),
  timeWindow: z.number().int().min(0).default(24), // hours
  respectGlobalCap: z.boolean().default(true),
  cooldownHours: z.number().min(0).default(0),
});

/**
 * Geographic Targeting Configuration Schema
 *
 * Uses Shopify's X-Country-Code header (ISO 3166-1 alpha-2 country codes)
 * to filter campaigns based on visitor location.
 */
export const GeoTargetingConfigSchema = z.object({
  enabled: z.boolean().default(false),
  // "include" = show only to listed countries, "exclude" = show to all except listed countries
  mode: z.enum(["include", "exclude"]).default("include"),
  // ISO 3166-1 alpha-2 country codes (e.g., "US", "CA", "GB", "DE")
  countries: z.array(z.string().length(2).toUpperCase()).default([]),
});

/**
 * Target Rules Configuration Schema
 * Note: frequencyCapping is now stored in enhancedTriggers.frequency_capping (server format)
 */
export const TargetRulesConfigSchema = z.object({
  enhancedTriggers: EnhancedTriggersConfigSchema.optional(),
  audienceTargeting: AudienceTargetingConfigSchema.optional(),
  pageTargeting: PageTargetingConfigSchema.optional(),
  geoTargeting: GeoTargetingConfigSchema.optional(),
});

export type DesignConfig = z.infer<typeof DesignConfigSchema>;
export type EnhancedTriggersConfig = z.infer<typeof EnhancedTriggersConfigSchema>;
export type AudienceTargetingConfig = z.infer<typeof AudienceTargetingConfigSchema>;
export type PageTargetingConfig = z.infer<typeof PageTargetingConfigSchema>;
export type GeoTargetingConfig = z.infer<typeof GeoTargetingConfigSchema>;
export type TargetRulesConfig = z.infer<typeof TargetRulesConfigSchema>;

// ============================================================================
// TRIGGER TYPES (for backward compatibility)
// ============================================================================

export type TriggerType =
  | "page_load"
  | "exit_intent"
  | "scroll_depth"
  | "time_on_page"
  | "click"
  | "cart_abandonment"
  | "product_view"
  | "custom_event";

export interface TriggerRule {
  field: string;
  operator: string;
  value: unknown;
  required?: boolean;
}

export interface EnhancedTrigger {
  id: string;
  name: string;
  description?: string;
  rules: TriggerRule[];
  condition: "and" | "or";
  delay?: number;
  priority?: number;
}

// ============================================================================
// CAMPAIGN ENTITY SCHEMAS
// ============================================================================

/**
 * Base Campaign Schema
 */
export const BaseCampaignSchema = z.object({
  id: z.cuid(),
  storeId: z.cuid(),
  name: z.string().min(1, "Campaign name is required").max(255),
  description: z.string().max(1000).nullable(),
  goal: CampaignGoalSchema,
  status: CampaignStatusSchema.default("DRAFT"),
  priority: z.number().int().min(0).default(0),

  // Template reference
  templateId: z.cuid().nullable(),
  templateType: TemplateTypeSchema, // Required for content validation

  // A/B Testing fields
  experimentId: z.cuid().nullable(),
  variantKey: z.enum(["A", "B", "C", "D"]).nullable(),
  isControl: z.boolean().default(false),

  // Timestamps
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),

  // Marketing & attribution
  marketingEventId: z.string().nullable().optional(),
});

/**
 * Campaign with JSON Configs Schema
 */
export const CampaignWithConfigsSchema = BaseCampaignSchema.extend({
  // JSON configurations (parsed from database)
  contentConfig: z.union([BaseContentConfigSchema, z.record(z.string(), z.unknown())]), // BaseContentConfig or ContentConfig
  designConfig: DesignConfigSchema,
  targetRules: TargetRulesConfigSchema,
  discountConfig: DiscountConfigSchema,
});

/**
 * Campaign Create Data Schema
 */
export const CampaignCreateDataSchema = z
  .object({
    name: z.string().min(1, "Campaign name is required").max(255),
    description: z.string().max(1000).optional(),
    goal: CampaignGoalSchema,
    status: CampaignStatusSchema.optional(),
    priority: z.number().int().min(0).optional(),

    // Template reference (optional - can be CUID or system template identifier like SYSTEM_xxx)
    templateId: z
      .union([z.cuid(), z.string().startsWith("SYSTEM_"), z.literal(""), z.undefined()])
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    templateType: TemplateTypeSchema, // Required for validation

    // JSON configurations
    contentConfig: z.record(z.string(), z.unknown()).optional(), // Generic object, validated separately by templateType
    designConfig: DesignConfigSchema.optional(),
    targetRules: TargetRulesConfigSchema.optional(),
    discountConfig: DiscountConfigSchema.optional(),

    // A/B Testing
    experimentId: z
      .union([z.cuid(), z.literal(""), z.undefined()])
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    variantKey: z.enum(["A", "B", "C", "D"]).optional(),
    isControl: z.boolean().optional(),

    // Schedule (coerce strings to dates for form compatibility, handle empty strings)
    startDate: z
      .union([z.coerce.date(), z.literal(""), z.undefined()])
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    endDate: z
      .union([z.coerce.date(), z.literal(""), z.undefined()])
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
  })
  .superRefine((data, ctx) => {
    // Validate that endDate is after startDate if both are provided
    if (data.startDate && data.endDate) {
      const start = data.startDate instanceof Date ? data.startDate : new Date(data.startDate);
      const end = data.endDate instanceof Date ? data.endDate : new Date(data.endDate);

      if (end <= start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
          path: ["endDate"],
        });
      }
    }

    // Validate that startDate is not in the past (with 1 minute tolerance for form submission delay)
    if (data.startDate) {
      const start = data.startDate instanceof Date ? data.startDate : new Date(data.startDate);
      const now = new Date();
      now.setMinutes(now.getMinutes() - 1); // 1 minute tolerance

      if (start < now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date cannot be in the past",
          path: ["startDate"],
        });
      }
    }
  });

export const CampaignUpdateDataSchema = CampaignCreateDataSchema.partial();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BaseCampaign = z.infer<typeof BaseCampaignSchema>;
export type CampaignWithConfigs = z.infer<typeof CampaignWithConfigsSchema>;
export type CampaignCreateData = z.infer<typeof CampaignCreateDataSchema>;
export type CampaignUpdateData = z.infer<typeof CampaignUpdateDataSchema>;
export type FrequencyCappingConfig = z.infer<typeof FrequencyCappingConfigSchema>;
