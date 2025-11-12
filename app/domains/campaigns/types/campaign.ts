/**
 * Campaign Domain Types
 *
 * Core type definitions for the Campaign domain with template-driven content validation
 */

import { z } from "zod";

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const CampaignGoalSchema = z.enum([
  "NEWSLETTER_SIGNUP",
  "INCREASE_REVENUE",
  "ENGAGEMENT"
]);

export const CampaignStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED"
]);

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
  "ANNOUNCEMENT"
]);

export type CampaignGoal = z.infer<typeof CampaignGoalSchema>;
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;
export type TemplateType = z.infer<typeof TemplateTypeSchema>;
export const TemplateTypeEnum = TemplateTypeSchema.enum;

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
  buttonText: z.string().min(1, "Button text is required"),
  successMessage: z.string().min(1, "Success message is required"),
  failureMessage: z.string().optional(),
  ctaText: z.string().optional(), // Call-to-action text (alternative to buttonText)
});

export type BaseContentConfig = z.infer<typeof BaseContentConfigSchema>;

// ============================================================================
// TEMPLATE-SPECIFIC CONTENT SCHEMAS
// ============================================================================

/**
 * Newsletter-specific content fields
 */
export const NewsletterContentSchema = BaseContentConfigSchema.extend({
  emailPlaceholder: z.string().default("Enter your email"),
  emailLabel: z.string().optional(),
  emailRequired: z.boolean().default(true),
  emailErrorMessage: z.string().optional(),
  submitButtonText: z.string().default("Subscribe"),
  nameFieldEnabled: z.boolean().default(false),
  nameFieldRequired: z.boolean().default(false),
  nameFieldPlaceholder: z.string().optional(),
  consentFieldEnabled: z.boolean().default(false),
  // Optional labels/placeholders for name fields and error handling used by UI
  firstNameLabel: z.string().optional(),
  lastNameLabel: z.string().optional(),
  firstNamePlaceholder: z.string().optional(),
  lastNamePlaceholder: z.string().optional(),
  errorMessage: z.string().optional(),

  consentFieldRequired: z.boolean().default(false),
  consentFieldText: z.string().optional(),
});

/**
 * Default wheel segments for Spin-to-Win
 * Designed to be profitable with expected discount of ~9.75%
 */
const DEFAULT_SPIN_TO_WIN_SEGMENTS = [
  { id: "segment-5-off", label: "5% OFF", probability: 0.35, color: "#10B981", discountType: "percentage" as const, discountValue: 5, discountCode: "SPIN5" },
  { id: "segment-10-off", label: "10% OFF", probability: 0.25, color: "#3B82F6", discountType: "percentage" as const, discountValue: 10, discountCode: "SPIN10" },
  { id: "segment-15-off", label: "15% OFF", probability: 0.15, color: "#F59E0B", discountType: "percentage" as const, discountValue: 15, discountCode: "SPIN15" },
  { id: "segment-20-off", label: "20% OFF", probability: 0.10, color: "#EF4444", discountType: "percentage" as const, discountValue: 20, discountCode: "SPIN20" },
  { id: "segment-free-shipping", label: "FREE SHIPPING", probability: 0.10, color: "#8B5CF6", discountType: "free_shipping" as const, discountCode: "FREESHIP" },
  { id: "segment-try-again", label: "Try Again", probability: 0.05, color: "#6B7280" },
];

/**
 * Spin-to-Win specific content fields
 */
export const SpinToWinContentSchema = BaseContentConfigSchema.extend({
  spinButtonText: z.string().default("Spin to Win!"),
  emailRequired: z.boolean().default(true),
  emailPlaceholder: z.string().default("Enter your email to spin"),
  emailLabel: z.string().optional(),
  wheelSegments: z.array(z.object({
    id: z.string(),
    label: z.string(),
    probability: z.number().min(0).max(1),
    color: z.string().optional(),
    discountType: z.enum(["percentage", "fixed_amount", "free_shipping"]).optional(),
    discountValue: z.number().min(0).optional(),
    discountCode: z.string().optional(),
  })).min(2, "At least 2 wheel segments required").default(DEFAULT_SPIN_TO_WIN_SEGMENTS),
  maxAttemptsPerUser: z.number().int().min(1).default(1),
  // Advanced wheel configuration
  wheelSize: z.number().int().min(200).max(800).default(400),
  wheelBorderWidth: z.number().int().min(0).max(20).default(2),
  wheelBorderColor: z.string().optional(),
  spinDuration: z.number().int().min(1000).max(10000).default(4000),
  minSpins: z.number().int().min(1).max(20).default(5),
  loadingText: z.string().optional(),
});

/**
 * Flash Sale specific content fields
 */
export const FlashSaleContentSchema = BaseContentConfigSchema.extend({
  urgencyMessage: z.string().min(1, "Urgency message is required"),
  discountPercentage: z.number().min(0).max(100),
  discountValue: z.number().min(0).optional(),
  discountType: z.enum(["percentage", "fixed_amount"]).default("percentage"),
  originalPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  showCountdown: z.boolean().default(true),
  endTime: z.string().optional(), // ISO date string

  countdownDuration: z.number().int().min(60).default(3600), // seconds
  hideOnExpiry: z.boolean().default(true),
  showStockCounter: z.boolean().default(false),
  stockCount: z.number().int().min(0).optional(),
  ctaUrl: z.string().optional(),
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
});

/**
 * Product Upsell specific content fields
 */
export const ProductUpsellContentSchema = BaseContentConfigSchema.extend({
  productSelectionMethod: z.enum(["ai", "manual", "collection"]).default("ai"),
  selectedProducts: z.array(z.string()).optional(),
  selectedCollection: z.string().optional(),
  maxProducts: z.number().int().min(1).max(12).default(3),
  layout: z.enum(["grid", "carousel", "card"]).default("grid"),
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
  cornerPosition: z.enum(["bottom-left", "bottom-right", "top-left", "top-right"]).default("bottom-left"),
  displayDuration: z.number().int().min(1).max(30).default(6), // seconds
  rotationInterval: z.number().int().min(1).max(60).default(8), // seconds
  maxNotificationsPerSession: z.number().int().min(1).max(20).default(5),
  minVisitorCount: z.number().int().min(1).optional(),
  minReviewRating: z.number().min(1).max(5).optional(),
  messageTemplates: z.object({
    purchase: z.string().optional(),
    visitor: z.string().optional(),
    review: z.string().optional(),
  }).optional(),
  showProductImage: z.boolean().default(true),
  showTimer: z.boolean().default(true),
});

/**
 * Default prizes for Scratch Card
 * Designed to be profitable with expected discount of ~10.5%
 */
const DEFAULT_SCRATCH_CARD_PRIZES = [
  { id: "prize-5-off", label: "5% OFF", probability: 0.40, discountCode: "SCRATCH5", discountPercentage: 5 },
  { id: "prize-10-off", label: "10% OFF", probability: 0.30, discountCode: "SCRATCH10", discountPercentage: 10 },
  { id: "prize-15-off", label: "15% OFF", probability: 0.20, discountCode: "SCRATCH15", discountPercentage: 15 },
  { id: "prize-20-off", label: "20% OFF", probability: 0.10, discountCode: "SCRATCH20", discountPercentage: 20 },
];

/**
 * Scratch Card specific content fields
 */
export const ScratchCardContentSchema = BaseContentConfigSchema.extend({
  scratchInstruction: z.string().default("Scratch to reveal your prize!"),
  emailRequired: z.boolean().default(true),
  emailPlaceholder: z.string().default("Enter your email"),
  emailLabel: z.string().optional(),
  emailBeforeScratching: z.boolean().default(false),
  scratchThreshold: z.number().min(0).max(100).default(50),
  scratchRadius: z.number().min(5).max(100).default(20),
  prizes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    probability: z.number().min(0).max(1),
    discountCode: z.string().optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
  })).min(1, "At least one prize required").default(DEFAULT_SCRATCH_CARD_PRIZES),
});

/**
 * Free Shipping specific content fields
 * Simple banner with progress bar showing distance to free shipping threshold
 */
export const FreeShippingContentSchema = BaseContentConfigSchema.extend({
  freeShippingThreshold: z.number().min(0).default(75),
  currency: z.string().default("USD"),
  initialMessage: z.string().optional(),
  progressMessage: z.string().optional(),
  successTitle: z.string().optional(),
  successSubhead: z.string().optional(),
  showProgress: z.boolean().default(true),
  progressColor: z.string().optional(),
  displayStyle: z.enum(["banner", "modal", "sticky"]).default("banner"),
  autoHide: z.boolean().default(false),
  hideDelay: z.number().int().min(1).max(30).default(3), // seconds
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
  | z.infer<typeof AnnouncementContentSchema>;

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

// ============================================================================
// TEMPLATE-TYPE TO SCHEMA MAPPING
// ============================================================================

/**
 * Get the appropriate content schema for a template type
 */
export function getContentSchemaForTemplate(templateType?: TemplateType) {
  if (!templateType) {
    return BaseContentConfigSchema;
  }

  switch (templateType) {
    case "NEWSLETTER":
      return NewsletterContentSchema;
    case "SPIN_TO_WIN":
      return SpinToWinContentSchema;
    case "FLASH_SALE":
      return FlashSaleContentSchema;
    case "EXIT_INTENT":
      return NewsletterContentSchema; // Exit intent uses newsletter fields
    case "CART_ABANDONMENT":
      return CartAbandonmentContentSchema;
    case "PRODUCT_UPSELL":
      return ProductUpsellContentSchema;
    case "SOCIAL_PROOF":
      return SocialProofContentSchema;
    case "COUNTDOWN_TIMER":
      return CountdownTimerContentSchema;
    case "SCRATCH_CARD":
      return ScratchCardContentSchema;
    case "ANNOUNCEMENT":
      return AnnouncementContentSchema;
    case "FREE_SHIPPING":
      return FreeShippingContentSchema;
    default:
      return BaseContentConfigSchema;
  }
}

// ============================================================================
// OTHER CONFIGURATION SCHEMAS
// ============================================================================

/**
 * Design Configuration Schema
 */
export const DesignConfigSchema = z.object({
  // Layout
  theme: z.enum([
    "modern", "minimal", "elegant", "bold", "glass", "dark", "gradient", "luxury", "neon", "ocean"
  ]).default("modern"),
  position: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  borderRadius: z.number().min(0).max(50).default(8),
  animation: z.enum(["fade", "slide", "bounce", "none"]).default("fade"),

  // Image settings
  imageUrl: z.string().optional(),
  imagePosition: z.enum(["left", "right", "top", "bottom", "none"]).default("left"),

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

  // Image colors
  imageBgColor: z.string().optional(), // Background color for image placeholder

  // State colors
  successColor: z.string().optional(), // Success state color

  // Overlay colors
  overlayColor: z.string().optional(), // Supports rgba
  overlayOpacity: z.number().min(0).max(1).default(0.5),

  // Advanced
  customCSS: z.string().optional(),
});

/**
 * Enhanced Triggers Configuration Schema (matching original structure)
 */
export const EnhancedTriggersConfigSchema = z.object({
  enabled: z.boolean().optional(),

  // Core trigger types
  page_load: z.object({
    enabled: z.boolean(),
    delay: z.number().min(0).optional(),
    require_dom_ready: z.boolean().optional(),
    require_images_loaded: z.boolean().optional(),
  }).optional(),

  exit_intent: z.object({
    enabled: z.boolean(),
    sensitivity: z.enum(["low", "medium", "high"]).optional(),
    delay: z.number().min(0).optional(),
    mobile_enabled: z.boolean().optional(),
    exclude_pages: z.array(z.string()).optional(),
  }).optional(),

  scroll_depth: z.object({
    enabled: z.boolean(),
    depth_percentage: z.number().min(0).max(100).optional(),
    direction: z.enum(["down", "up", "both"]).optional(),
    debounce_time: z.number().min(0).optional(),
    require_engagement: z.boolean().optional(),
  }).optional(),

  idle_timer: z.object({
    enabled: z.boolean(),
    idle_duration: z.number().min(1).optional(),
    mouse_movement_threshold: z.number().min(0).optional(),
    keyboard_activity: z.boolean().optional(),
    page_visibility: z.boolean().optional(),
  }).optional(),

  time_delay: z.object({
    enabled: z.boolean(),
    delay: z.number().min(0).optional(),
    immediate: z.boolean().optional(),
  }).optional(),

  // E-commerce specific triggers
  add_to_cart: z.object({
    enabled: z.boolean(),
    delay: z.number().min(0).optional(),
    immediate: z.boolean().optional(),
  }).optional(),

  cart_drawer_open: z.object({
    enabled: z.boolean(),
    delay: z.number().min(0).optional(),
    max_triggers_per_session: z.number().int().min(1).optional(),
  }).optional(),

  cart_value: z.object({
    enabled: z.boolean(),
    threshold: z.number().min(0).optional(),
    minValue: z.number().min(0).optional(),
    min_value: z.number().min(0).optional(),
    max_value: z.number().min(0).optional(),
    check_interval: z.number().min(0).optional(),
  }).optional(),

  product_view: z.object({
    enabled: z.boolean(),
    product_ids: z.array(z.string()).optional(),
    time_on_page: z.number().min(0).optional(),
    require_scroll: z.boolean().optional(),
  }).optional(),

  // Advanced targeting
  device_targeting: z.object({
    enabled: z.boolean(),
    device_types: z.array(z.enum(["desktop", "tablet", "mobile"])).optional(),
    operating_systems: z.array(z.string()).optional(),
    browsers: z.array(z.string()).optional(),
    connection_type: z.array(z.string()).optional(),
  }).optional(),

  page_targeting: z.object({
    enabled: z.boolean(),
    pages: z.array(z.string()).optional(),
    exclude_pages: z.array(z.string()).optional(),
    custom_patterns: z.array(z.string()).optional(),
  }).optional(),

  // Frequency capping
  frequency_capping: z.object({
    max_triggers_per_session: z.number().min(1).optional(),
    max_triggers_per_day: z.number().min(1).optional(),
    cooldown_between_triggers: z.number().min(0).optional(),
  }).optional(),

  // Logic and combination
  trigger_combination: z.object({
    operator: z.enum(["AND", "OR"]).default("OR"),
  }).optional(),

  // Custom events
  custom_event: z.object({
    enabled: z.boolean(),
    event_name: z.string().optional(),
    event_names: z.array(z.string()).optional(),
    debounce_time: z.number().min(0).optional(),
  }).optional(),
});

/**
 * Audience Targeting Configuration Schema
 */
export const AudienceTargetingConfigSchema = z.object({
  enabled: z.boolean(),
  segments: z.array(z.string()).optional(),
  customRulesEnabled: z.boolean().optional(),
  customRules: z.object({
    enabled: z.boolean(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(["equals", "not_equals", "contains", "greater_than", "less_than", "in", "not_in"]),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    })),
    logicOperator: z.enum(["AND", "OR"]),
  }).optional(),
});

/**
 * Page Targeting Configuration Schema
 */
export const PageTargetingConfigSchema = z.object({
  enabled: z.boolean().default(false),
  pages: z.array(z.string()).default([]),
  customPatterns: z.array(z.string()).default([]),
  excludePages: z.array(z.string()).default([]),
});

/**
 * Target Rules Configuration Schema (matching original structure)
 */
export const TargetRulesConfigSchema = z.object({
  enhancedTriggers: EnhancedTriggersConfigSchema.optional(),
  audienceTargeting: AudienceTargetingConfigSchema.optional(),
  pageTargeting: PageTargetingConfigSchema.optional(),
});

/**
 * Discount Configuration Schema
 */
export const DiscountConfigSchema = z.object({
  enabled: z.boolean().default(false),
  type: z.enum(["percentage", "fixed_amount", "free_shipping", "shared"]).optional(),
  value: z.number().min(0).optional(),
  code: z.string().optional(),
  deliveryMode: z.enum(["auto_apply_only", "show_code_fallback", "show_code_always"]).optional(),
  expiryDays: z.number().min(1).optional(),
  minPurchaseAmount: z.number().min(0).optional(),
  description: z.string().optional(),
  // Additional properties used in the codebase
  valueType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]).optional(),
  minimumAmount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  prefix: z.string().optional(),
  requireLogin: z.boolean().optional(),
  storeInMetafield: z.boolean().optional(),
  authorizedEmail: z.string().email().optional(),
  requireEmailMatch: z.boolean().optional(),
  singleUse: z.boolean().optional(),
});

export type DesignConfig = z.infer<typeof DesignConfigSchema>;
export type EnhancedTriggersConfig = z.infer<typeof EnhancedTriggersConfigSchema>;
export type AudienceTargetingConfig = z.infer<typeof AudienceTargetingConfigSchema>;
export type PageTargetingConfig = z.infer<typeof PageTargetingConfigSchema>;
export type TargetRulesConfig = z.infer<typeof TargetRulesConfigSchema>;
export type DiscountConfig = z.infer<typeof DiscountConfigSchema>;

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
export const CampaignCreateDataSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(255),
  description: z.string().max(1000).optional(),
  goal: CampaignGoalSchema,
  status: CampaignStatusSchema.optional(),
  priority: z.number().int().min(0).optional(),

  // Template reference (optional - can be CUID or system template identifier like SYSTEM_xxx)
  templateId: z.union([
    z.cuid(),
    z.string().startsWith("SYSTEM_"),
    z.literal(""),
    z.undefined()
  ]).optional().transform(val => val === "" ? undefined : val),
  templateType: TemplateTypeSchema, // Required for validation

  // JSON configurations
  contentConfig: z.record(z.string(), z.unknown()).optional(), // Generic object, validated separately by templateType
  designConfig: DesignConfigSchema.optional(),
  targetRules: TargetRulesConfigSchema.optional(),
  discountConfig: DiscountConfigSchema.optional(),

  // A/B Testing
  experimentId: z.union([
    z.cuid(),
    z.literal(""),
    z.undefined()
  ]).optional().transform(val => val === "" ? undefined : val),
  variantKey: z.enum(["A", "B", "C", "D"]).optional(),
  isControl: z.boolean().optional(),

  // Schedule
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const CampaignUpdateDataSchema = CampaignCreateDataSchema.partial();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BaseCampaign = z.infer<typeof BaseCampaignSchema>;
export type CampaignWithConfigs = z.infer<typeof CampaignWithConfigsSchema>;
export type CampaignCreateData = z.infer<typeof CampaignCreateDataSchema>;
export type CampaignUpdateData = z.infer<typeof CampaignUpdateDataSchema>;
