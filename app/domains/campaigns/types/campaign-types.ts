/**
 * Campaign Types - Backward Compatibility Export
 *
 * Re-exports campaign types from the main campaign.ts file.
 * This file exists to maintain backward compatibility with existing imports.
 */

// Re-export all campaign types
export type {
  CampaignGoal,
  CampaignStatus,
  TemplateType,
  ContentConfig,
  BaseContentConfig,
  DesignConfig,
  EnhancedTriggersConfig,
  AudienceTargetingConfig,
  PageTargetingConfig,
  TargetRulesConfig,
  DiscountConfig,
  DiscountType,
  DiscountValueType,
  DiscountBehavior,
  ContentDiscountType,
  BaseCampaign,
  CampaignWithConfigs,
  CampaignCreateData,
  CampaignUpdateData,
} from "./campaign";

// Inferred content types from schemas
import type { z } from "zod";
import type {
  NewsletterContentSchema,
  SpinToWinContentSchema,
  FlashSaleContentSchema,
  CartAbandonmentContentSchema,
  ProductUpsellContentSchema,
  SocialProofContentSchema,
} from "./campaign";

export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;
export type SpinToWinContent = z.infer<typeof SpinToWinContentSchema>;
export type FlashSaleContent = z.infer<typeof FlashSaleContentSchema>;
export type CartAbandonmentContent = z.infer<typeof CartAbandonmentContentSchema>;
export type ProductUpsellContent = z.infer<typeof ProductUpsellContentSchema>;
export type SocialProofContent = z.infer<typeof SocialProofContentSchema>;

// Re-export schemas
export {
  CampaignGoalSchema,
  CampaignStatusSchema,
  TemplateTypeSchema,
  DiscountTypeSchema,
  DiscountValueTypeSchema,
  DiscountBehaviorSchema,
  ContentDiscountTypeSchema,
  NewsletterContentSchema,
  SpinToWinContentSchema,
  FlashSaleContentSchema,
  CartAbandonmentContentSchema,
  ProductUpsellContentSchema,
  SocialProofContentSchema,
  DesignConfigSchema,
  EnhancedTriggersConfigSchema,
  AudienceTargetingConfigSchema,
  PageTargetingConfigSchema,
  TargetRulesConfigSchema,
  DiscountConfigSchema,
  BaseCampaignSchema,
  CampaignWithConfigsSchema,
  CampaignCreateDataSchema,
  CampaignUpdateDataSchema,
} from "./campaign";

// Alias for PopupContentConfig (commonly used name)
export type PopupContentConfig = import("./campaign").ContentConfig;
