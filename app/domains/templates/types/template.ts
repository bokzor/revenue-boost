/**
 * Template Domain Types
 *
 * Template definitions and field configurations
 */

import { z } from "zod";
import {
  CampaignGoalSchema,
  TemplateTypeSchema,
  DesignConfigSchema,
  TargetRulesConfigSchema,
  DiscountConfigSchema,
  // Content schemas for template-specific typing
  BaseContentConfigSchema,
  NewsletterContentSchema,
  SpinToWinContentSchema,
  FlashSaleContentSchema,
  FreeShippingContentSchema,
  getContentSchemaForTemplate,
  // Types
  type DesignConfig,
  type TargetRulesConfig,
  type DiscountConfig,
  type ContentConfig,
  type BaseContentConfig,
  type TemplateType
} from "../../campaigns/types/campaign.js";

// ============================================================================
// TEMPLATE FIELD DEFINITIONS
// ============================================================================

/**
 * Template Field Definition Schema
 * Defines customizable fields for templates
 */
export const TemplateFieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    "text",
    "textarea",
    "color",
    "image",
    "layout",
    "animation",
    "typography",
    "boolean",
    "number",
    "product",
    "select",
    "email",
    "discount",
    "prize-list",
    "color-list",
    "product-picker",
    "collection-picker"
  ]),
  label: z.string(),
  description: z.string().optional(),
  defaultValue: z.unknown(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).optional(),
  validation: z.object({
    required: z.boolean().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
  category: z.enum(["content", "design", "behavior"]),
  section: z.enum([
    "content",
    "design",
    "theme",
    "layout",
    "positioning",
    "behavior",
    "products",
    "advanced"
  ]).optional(),
});

export type TemplateField = z.infer<typeof TemplateFieldSchema>;

// ============================================================================
// TEMPLATE CONTENT CONFIGURATION UTILITIES
// ============================================================================

/**
 * Get the appropriate content schema for a template based on its templateType
 * This ensures contentConfig is properly typed for each template type
 */
export function getTemplateContentSchema(templateType?: TemplateType) {
  return getContentSchemaForTemplate(templateType);
}

/**
 * Parse template contentConfig with proper typing based on templateType
 */
export function parseTemplateContentConfig(
  jsonValue: unknown,
  templateType?: TemplateType
): ContentConfig | BaseContentConfig {
  const schema = getTemplateContentSchema(templateType);
  try {
    // Handle null/undefined
    if (jsonValue === null || jsonValue === undefined) {
      return {} as BaseContentConfig;
    }

    // Handle string JSON
    let parsed: unknown;
    if (typeof jsonValue === 'string') {
      parsed = JSON.parse(jsonValue);
    } else {
      parsed = jsonValue;
    }

    // Validate with schema
    const result = schema.safeParse(parsed);
    return result.success ? result.data : {} as BaseContentConfig;
  } catch (error) {
    console.warn('Failed to parse template contentConfig:', error);
    return {} as BaseContentConfig;
  }
}

// ============================================================================
// TEMPLATE SCHEMAS
// ============================================================================

/**
 * Base Template Schema
 */
export const BaseTemplateSchema = z.object({
  id: z.string().cuid(),
  storeId: z.string().cuid().nullable(), // NULL for global templates
  templateType: TemplateTypeSchema, // Template type enum
  name: z.string().min(1, "Template name is required").max(255),
  description: z.string().max(1000),
  category: z.string(), // Category grouping (popup, embedded, slide_out, etc.)
  goals: z.array(CampaignGoalSchema), // Array of CampaignGoal values this template supports

  // Metadata
  isDefault: z.boolean().default(false), // System template vs custom
  isActive: z.boolean().default(true),
  priority: z.number().int().min(1).default(1),
  icon: z.string().nullable(), // Icon identifier
  preview: z.string().nullable(), // Preview image URL

  // Performance tracking
  conversionRate: z.number().min(0).max(1).nullable(),

  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

/**
 * Template with JSON Configs Schema (Generic)
 * This represents how templates are stored in the database with generic contentConfig
 */
export const TemplateWithConfigsSchema = BaseTemplateSchema.extend({
  // JSON configurations (matching Prisma schema field names exactly with proper typing)
  contentConfig: z.union([
    BaseContentConfigSchema,
    z.record(z.string(), z.unknown())
  ]).default({}), // Default content values for this template (can be typed or generic)
  fields: z.array(TemplateFieldSchema).default([]), // Array of TemplateField definitions
  targetRules: TargetRulesConfigSchema.default({}), // Default trigger/targeting configuration
  designConfig: DesignConfigSchema.default({
    theme: "modern",
    position: "center",
    size: "medium",
    borderRadius: 8,
    imagePosition: "left",
    overlayOpacity: 0.8,
    animation: "fade"
  }), // Default design configuration
  discountConfig: DiscountConfigSchema.default({
    enabled: false
  }), // Discount configuration
});

/**
 * Template-Type Specific Schemas
 * These provide proper typing for contentConfig based on templateType
 */

// Newsletter Template
export const NewsletterTemplateSchema = BaseTemplateSchema.extend({
  templateType: z.literal("NEWSLETTER"),
  contentConfig: NewsletterContentSchema,
  fields: z.array(TemplateFieldSchema).default([]),
  targetRules: TargetRulesConfigSchema.default({}),
  designConfig: DesignConfigSchema.default({
    theme: "modern",
    position: "center",
    size: "medium",
    borderRadius: 8,
    imagePosition: "left",
    overlayOpacity: 0.8,
    animation: "fade"
  }),
  discountConfig: DiscountConfigSchema.default({ enabled: false }),
});

// Flash Sale Template
export const FlashSaleTemplateSchema = BaseTemplateSchema.extend({
  templateType: z.literal("FLASH_SALE"),
  contentConfig: FlashSaleContentSchema,
  fields: z.array(TemplateFieldSchema).default([]),
  targetRules: TargetRulesConfigSchema.default({}),
  designConfig: DesignConfigSchema.default({
    theme: "bold",
    position: "center",
    size: "medium",
    borderRadius: 8,
    imagePosition: "left",
    overlayOpacity: 0.8,
    animation: "fade"
  }),
  discountConfig: DiscountConfigSchema.default({ enabled: false }),
});

// Spin to Win Template
export const SpinToWinTemplateSchema = BaseTemplateSchema.extend({
  templateType: z.literal("SPIN_TO_WIN"),
  contentConfig: SpinToWinContentSchema,
  fields: z.array(TemplateFieldSchema).default([]),
  targetRules: TargetRulesConfigSchema.default({}),
  designConfig: DesignConfigSchema.default({
    theme: "gradient",
    position: "center",
    size: "medium",
    borderRadius: 8,
    imagePosition: "left",
    overlayOpacity: 0.8,
    animation: "fade"
  }),
  discountConfig: DiscountConfigSchema.default({ enabled: false }),
});

// Free Shipping Template
export const FreeShippingTemplateSchema = BaseTemplateSchema.extend({
  templateType: z.literal("FREE_SHIPPING"),
  contentConfig: FreeShippingContentSchema,
  fields: z.array(TemplateFieldSchema).default([]),
  targetRules: TargetRulesConfigSchema.default({}),
  designConfig: DesignConfigSchema.default({
    theme: "minimal",
    position: "top",
    size: "small",
    borderRadius: 0,
    imagePosition: "left",
    overlayOpacity: 0,
    animation: "slide"
  }),
  discountConfig: DiscountConfigSchema.default({ enabled: false }),
});

/**
 * Get the appropriate template schema for a template type
 * This ensures proper typing for contentConfig based on templateType
 */
export function getTemplateSchemaForType(templateType: TemplateType) {
  switch (templateType) {
    case "NEWSLETTER":
    case "EXIT_INTENT": // Exit intent uses newsletter fields
      return NewsletterTemplateSchema;
    case "FLASH_SALE":
    case "COUNTDOWN_TIMER": // Countdown timer uses flash sale fields
      return FlashSaleTemplateSchema;
    case "SPIN_TO_WIN":
    case "SCRATCH_CARD": // Scratch card similar to spin-to-win
      return SpinToWinTemplateSchema;
    case "FREE_SHIPPING":
      return FreeShippingTemplateSchema;
    case "CART_ABANDONMENT":
      // Could add CartAbandonmentTemplateSchema if needed
      return TemplateWithConfigsSchema;
    case "PRODUCT_UPSELL":
      // Could add ProductUpsellTemplateSchema if needed
      return TemplateWithConfigsSchema;
    case "SOCIAL_PROOF":
      // Could add SocialProofTemplateSchema if needed
      return TemplateWithConfigsSchema;
    case "ANNOUNCEMENT":
    default:
      return TemplateWithConfigsSchema;
  }
}

/**
 * Template Create Data Schema
 */
export const TemplateCreateDataSchema = z.object({
  storeId: z.string().cuid().optional(),
  templateType: TemplateTypeSchema,
  name: z.string().min(1, "Template name is required").max(255),
  description: z.string().max(1000),
  category: z.string().min(1, "Category is required"),
  goals: z.array(CampaignGoalSchema).min(1, "At least one goal is required"),

  // JSON configurations (matching Prisma schema field names with proper typing)
  contentConfig: z.record(z.string(), z.unknown()).optional(), // Generic since it varies by template type
  fields: z.array(TemplateFieldSchema).optional(),
  targetRules: TargetRulesConfigSchema.optional(),
  designConfig: DesignConfigSchema.optional(),
  discountConfig: DiscountConfigSchema.optional(),

  // Metadata
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(1).optional(),
  icon: z.string().optional(),
  preview: z.string().optional(),
  conversionRate: z.number().min(0).max(1).optional(),
});

export const TemplateUpdateDataSchema = TemplateCreateDataSchema.partial().extend({
  id: z.string().cuid(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BaseTemplate = z.infer<typeof BaseTemplateSchema>;
export type TemplateWithConfigs = z.infer<typeof TemplateWithConfigsSchema>;
export type TemplateCreateData = z.infer<typeof TemplateCreateDataSchema>;
export type TemplateUpdateData = z.infer<typeof TemplateUpdateDataSchema>;

// Template-type specific types with properly typed contentConfig
export type NewsletterTemplate = z.infer<typeof NewsletterTemplateSchema>;
export type FlashSaleTemplate = z.infer<typeof FlashSaleTemplateSchema>;
export type SpinToWinTemplate = z.infer<typeof SpinToWinTemplateSchema>;

// Union type for all template types with proper contentConfig typing
export type TypedTemplate =
  | NewsletterTemplate
  | FlashSaleTemplate
  | SpinToWinTemplate
  | TemplateWithConfigs; // Fallback for other types

// Re-export config types for convenience
export type { DesignConfig, TargetRulesConfig, DiscountConfig, ContentConfig, BaseContentConfig, TemplateType };
