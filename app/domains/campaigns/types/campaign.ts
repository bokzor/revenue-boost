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
  consentFieldRequired: z.boolean().default(false),
  consentFieldText: z.string().optional(),
});

/**
 * Spin-to-Win specific content fields
 */
export const SpinToWinContentSchema = BaseContentConfigSchema.extend({
  spinButtonText: z.string().default("Spin to Win!"),
  emailRequired: z.boolean().default(true),
  emailPlaceholder: z.string().default("Enter your email to spin"),
  wheelSegments: z.array(z.object({
    id: z.string(),
    label: z.string(),
    probability: z.number().min(0).max(1),
    color: z.string().optional(),
    discountType: z.enum(["percentage", "fixed_amount", "free_shipping"]).optional(),
    discountValue: z.number().min(0).optional(),
    discountCode: z.string().optional(),
  })).min(2, "At least 2 wheel segments required"),
  maxAttemptsPerUser: z.number().int().min(1).default(1),
});

/**
 * Flash Sale specific content fields
 */
export const FlashSaleContentSchema = BaseContentConfigSchema.extend({
  urgencyMessage: z.string().min(1, "Urgency message is required"),
  discountPercentage: z.number().min(0).max(100),
  originalPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  showCountdown: z.boolean().default(true),
  countdownDuration: z.number().int().min(60).default(3600), // seconds
  showStockCounter: z.boolean().default(false),
  stockCount: z.number().int().min(0).optional(),
});

/**
 * Cart Abandonment specific content fields
 */
export const CartAbandonmentContentSchema = BaseContentConfigSchema.extend({
  cartRecoveryMessage: z.string().optional(),
  discountOffered: z.boolean().default(false),
  reminderText: z.string().optional(),
  urgencyText: z.string().optional(),
});

/**
 * Product Upsell specific content fields
 */
export const ProductUpsellContentSchema = BaseContentConfigSchema.extend({
  productIds: z.array(z.string()).min(1, "At least one product required"),
  upsellType: z.enum(["related", "complementary", "bundle"]).default("related"),
  upsellMessage: z.string().optional(),
  bundleDiscount: z.number().min(0).max(100).optional(),
});

/**
 * Social Proof specific content fields
 */
export const SocialProofContentSchema = BaseContentConfigSchema.extend({
  notificationInterval: z.number().int().min(1000).default(5000), // milliseconds
  maxNotifications: z.number().int().min(1).default(5),
  socialProofText: z.string().optional(),
  showCustomerNames: z.boolean().default(true),
  showLocation: z.boolean().default(true),
});

/**
 * Scratch Card specific content fields
 */
export const ScratchCardContentSchema = BaseContentConfigSchema.extend({
  scratchInstruction: z.string().default("Scratch to reveal your prize!"),
  emailRequired: z.boolean().default(true),
  emailPlaceholder: z.string().default("Enter your email"),
  emailBeforeScratching: z.boolean().default(false),
  scratchThreshold: z.number().min(0).max(100).default(50),
  scratchRadius: z.number().min(5).max(100).default(20),
  prizes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    probability: z.number().min(0).max(1),
    discountCode: z.string().optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
  })).min(1, "At least one prize required"),
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
  | z.infer<typeof ScratchCardContentSchema>;

// Export individual content types
export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;
export type SpinToWinContent = z.infer<typeof SpinToWinContentSchema>;
export type FlashSaleContent = z.infer<typeof FlashSaleContentSchema>;
export type CartAbandonmentContent = z.infer<typeof CartAbandonmentContentSchema>;
export type ProductUpsellContent = z.infer<typeof ProductUpsellContentSchema>;
export type SocialProofContent = z.infer<typeof SocialProofContentSchema>;
export type ScratchCardContent = z.infer<typeof ScratchCardContentSchema>;

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
      return FlashSaleContentSchema; // Countdown timer uses flash sale fields
    case "SCRATCH_CARD":
      return ScratchCardContentSchema; // Scratch card has its own schema
    case "ANNOUNCEMENT":
      return BaseContentConfigSchema; // Simple announcement
    case "FREE_SHIPPING":
      return BaseContentConfigSchema; // Free shipping uses base fields
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
  theme: z.enum(["professional-blue", "vibrant-orange", "elegant-purple", "minimal-gray"]).default("professional-blue"),
  position: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  borderRadius: z.number().min(0).max(50).default(8),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  textColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  buttonColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  overlayOpacity: z.number().min(0).max(1).default(0.8),
  animation: z.enum(["fade", "slide", "bounce", "none"]).default("fade"),
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

  // Template reference (required)
  templateId: z.cuid().optional(),
  templateType: TemplateTypeSchema, // Required for validation

  // JSON configurations
  contentConfig: z.record(z.string(), z.unknown()).optional(), // Generic object, validated separately by templateType
  designConfig: DesignConfigSchema.optional(),
  targetRules: TargetRulesConfigSchema.optional(),
  discountConfig: DiscountConfigSchema.optional(),

  // A/B Testing
  experimentId: z.cuid().optional(),
  variantKey: z.enum(["A", "B", "C", "D"]).optional(),
  isControl: z.boolean().optional(),

  // Schedule
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const CampaignUpdateDataSchema = CampaignCreateDataSchema.partial().extend({
  id: z.cuid(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BaseCampaign = z.infer<typeof BaseCampaignSchema>;
export type CampaignWithConfigs = z.infer<typeof CampaignWithConfigsSchema>;
export type CampaignCreateData = z.infer<typeof CampaignCreateDataSchema>;
export type CampaignUpdateData = z.infer<typeof CampaignUpdateDataSchema>;
