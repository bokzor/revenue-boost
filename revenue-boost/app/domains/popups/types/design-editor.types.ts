/**
 * Design Editor Type Definitions
 * 
 * Proper type definitions for the PopupDesignEditor component
 */

import type { PopupConfig } from "~/domains/popups/components/BasePopup";

/**
 * Animation settings for popup entrance, exit, hover, and attention effects
 */
export interface AnimationSettings {
  entrance?: {
    animation: string;
    duration: number;
    easing: string;
    delay?: number;
  };
  exit?: {
    animation: string;
    duration: number;
    easing: string;
    delay?: number;
  };
  hover?: {
    enabled: boolean;
    animation: string;
    duration: number;
    easing: string;
  };
  attention?: {
    enabled: boolean;
    animation: string;
    duration: number;
    easing: string;
    interval?: number;
  };
}

/**
 * Animation configuration for a single animation
 */
export interface AnimationConfig {
  name: string;
  duration: number;
  easing: string;
  delay?: number;
}

/**
 * Mobile optimization configuration
 */
export interface MobileOptimizationConfig {
  enabled?: boolean;
  responsiveBreakpoint?: number;
  mobilePosition?: "top" | "bottom" | "center";
  mobileSize?: "small" | "medium" | "large" | "full";
  hideOnMobile?: boolean;
  [key: string]: unknown;
}

/**
 * Template object from database
 */
export interface TemplateObject {
  id: string;
  name: string;
  templateType: string;
  category: string;
  description: string;
  preview?: string;
  contentConfig?: Record<string, unknown>;
  designConfig?: Record<string, unknown>;
  targetRules?: Record<string, unknown>;
  discountConfig?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Enhanced triggers configuration
 */
export interface EnhancedTriggersConfig {
  enabled?: boolean;
  page_load?: {
    enabled: boolean;
    delay?: number;
  };
  exit_intent?: {
    enabled: boolean;
    sensitivity?: "low" | "medium" | "high";
  };
  scroll_depth?: {
    enabled: boolean;
    percentage?: number;
  };
  [key: string]: unknown;
}

/**
 * Discount configuration
 * Note: Using "fixed_amount" to match campaign types
 */
export interface DiscountConfig {
  enabled: boolean;
  type?: "percentage" | "fixed_amount" | "free_shipping" | "shared";
  value?: number;
  code?: string;
  expiresInDays?: number;
  minimumPurchase?: number;
  deliveryMode?: "auto_apply_only" | "show_code_fallback" | "show_code_always";
  [key: string]: unknown;
}

/**
 * Campaign context for smart recommendations
 */
export interface CampaignContext {
  triggerType?: string;
  name?: string;
  description?: string;
  campaignGoal?: "sales" | "email_capture" | "engagement" | "retention";
}

/**
 * Pending template change state
 */
export interface PendingTemplateChange {
  templateId: string;
  templateType: string;
  template?: TemplateObject;
}

/**
 * Extended popup design configuration
 */
export interface PopupDesignConfig extends PopupConfig {
  animation?: string;
  slideDirection?: "left" | "right" | "bottom";
  width?: string;
  height?: string;
  sticky?: boolean;
  borderRadius?: string;
  boxShadow?: string;
  fontFamily?: string;
  fontSize?: string;
  customCSS?: string;
  fontWeight?: string;
  padding?: string;
  margin?: string;
  animations?: AnimationSettings;
  mobileOptimization?: MobileOptimizationConfig;
  content?: Record<string, unknown>;
}

