/**
 * Template Registry
 *
 * Centralized registry for all template types
 * Eliminates switch statements and provides type-safe template metadata
 */

import { z } from "zod";
import type { TemplateType } from "~/domains/campaigns/types/campaign";
import {
  NewsletterContentSchema,
  SpinToWinContentSchema,
  FlashSaleContentSchema,
  CartAbandonmentContentSchema,
  ProductUpsellContentSchema,
  SocialProofContentSchema,
  CountdownTimerContentSchema,
  ScratchCardContentSchema,
  FreeShippingContentSchema,
  AnnouncementContentSchema,
  BaseContentConfigSchema,
  // New upsell popup content schemas
  ClassicUpsellContentSchema,
  MinimalSlideUpContentSchema,
  PremiumFullscreenContentSchema,
  CountdownUrgencyContentSchema,
} from "~/domains/campaigns/types/campaign";

/**
 * Template metadata interface
 */
export interface TemplateMetadata {
  type: TemplateType;
  label: string;
  description: string;
  category: string;
  icon?: string;
  contentSchema: z.ZodType<unknown>;
  defaultFields?: Record<string, unknown>;
  defaultDesignFields?: Record<string, unknown>;
  requiresDiscount?: boolean;
  requiresProduct?: boolean;
}

/**
 * Template Registry
 * Single source of truth for all template types
 */
export const TEMPLATE_REGISTRY: Record<TemplateType, TemplateMetadata> = {
  NEWSLETTER: {
    type: "NEWSLETTER",
    label: "Newsletter",
    description: "Collect email subscribers with a simple signup form",
    category: "Lead Generation",
    contentSchema: NewsletterContentSchema,
    defaultFields: {
      headline: "Join Our Newsletter",
      description: "Get exclusive offers and updates",
      ctaLabel: "Subscribe",
      successMessage: "Thanks for subscribing!",
    },
  },

  SPIN_TO_WIN: {
    type: "SPIN_TO_WIN",
    label: "Spin to Win",
    description: "Gamified discount wheel to engage visitors",
    category: "Gamification",
    contentSchema: SpinToWinContentSchema,
    requiresDiscount: true,
    defaultFields: {
      headline: "Spin to Win!",
      description: "Try your luck for a discount",
      ctaLabel: "Spin Now",
    },
  },

  FLASH_SALE: {
    type: "FLASH_SALE",
    label: "Flash Sale",
    description: "Time-limited offers to create urgency",
    category: "Promotions",
    contentSchema: FlashSaleContentSchema,
    requiresDiscount: true,
    defaultFields: {
      headline: "Flash Sale!",
      description: "Limited time offer",
      ctaLabel: "Shop Now",
    },
  },

  FREE_SHIPPING: {
    type: "FREE_SHIPPING",
    label: "Free Shipping",
    description: "Promote free shipping threshold",
    category: "Promotions",
    contentSchema: FreeShippingContentSchema,
    defaultFields: {
      headline: "Free Shipping",
      description: "On orders over $50",
      ctaLabel: "Shop Now",
    },
  },

  EXIT_INTENT: {
    type: "EXIT_INTENT",
    label: "Exit Intent",
    description: "Capture visitors before they leave",
    category: "Lead Generation",
    contentSchema: NewsletterContentSchema, // Uses newsletter fields
    defaultFields: {
      headline: "Wait! Don't Go",
      description: "Get 10% off your first order",
      ctaLabel: "Get Discount",
    },
  },

  CART_ABANDONMENT: {
    type: "CART_ABANDONMENT",
    label: "Cart Abandonment",
    description: "Recover abandoned carts with incentives",
    category: "Recovery",
    contentSchema: CartAbandonmentContentSchema,
    requiresDiscount: true,
    defaultFields: {
      headline: "Complete Your Purchase",
      description: "Your items are waiting",
      ctaLabel: "Return to Cart",
    },
  },

  PRODUCT_UPSELL: {
    type: "PRODUCT_UPSELL",
    label: "Product Upsell",
    description: "Recommend related products",
    category: "Revenue",
    contentSchema: ProductUpsellContentSchema,
    requiresProduct: true,
    defaultFields: {
      headline: "You Might Also Like",
      description: "Complete your look",
      ctaLabel: "Add to Cart",
    },
    defaultDesignFields: {
      size: "large",
    },
  },

  SOCIAL_PROOF: {
    type: "SOCIAL_PROOF",
    label: "Social Proof",
    description: "Show recent purchases and activity",
    category: "Trust",
    contentSchema: SocialProofContentSchema,
    defaultFields: {
      headline: "Join Thousands of Happy Customers",
      showRecentPurchases: true,
      showVisitorCount: true,
    },
  },

  COUNTDOWN_TIMER: {
    type: "COUNTDOWN_TIMER",
    label: "Countdown Timer",
    description: "Create urgency with countdown",
    category: "Promotions",
    contentSchema: CountdownTimerContentSchema,
    defaultFields: {
      headline: "Limited Time Offer",
      description: "Hurry! Sale ends soon",
      ctaLabel: "Shop Now",
    },
  },

  SCRATCH_CARD: {
    type: "SCRATCH_CARD",
    label: "Scratch Card",
    description: "Interactive scratch-off game",
    category: "Gamification",
    contentSchema: ScratchCardContentSchema,
    requiresDiscount: true,
    defaultFields: {
      headline: "Scratch to Reveal Your Discount",
      description: "Everyone wins!",
      ctaLabel: "Claim Discount",
    },
  },

  ANNOUNCEMENT: {
    type: "ANNOUNCEMENT",
    label: "Announcement",
    description: "Important announcements and updates",
    category: "Communication",
    contentSchema: AnnouncementContentSchema,
    defaultFields: {
      headline: "Important Announcement",
      description: "Check out our latest updates",
      ctaLabel: "Learn More",
    },
  },

  // New Upsell Popup Template Types
  CLASSIC_UPSELL: {
    type: "CLASSIC_UPSELL",
    label: "Classic Upsell",
    description: "Traditional centered modal with image, pricing, and clear CTAs",
    category: "Revenue",
    icon: "🎯",
    contentSchema: ClassicUpsellContentSchema,
    requiresProduct: true,
    defaultFields: {
      headline: "Special Offer Just For You",
      subheadline: "Don't miss out on this exclusive deal",
      buttonText: "Add to Cart",
      secondaryCtaLabel: "No thanks",
    },
  },

  MINIMAL_SLIDE_UP: {
    type: "MINIMAL_SLIDE_UP",
    label: "Minimal Slide-Up",
    description: "Compact bottom sheet for mobile-first experiences",
    category: "Revenue",
    icon: "📱",
    contentSchema: MinimalSlideUpContentSchema,
    requiresProduct: true,
    defaultFields: {
      headline: "Complete Your Order",
      subheadline: "Add this for just",
      buttonText: "Quick Add",
      secondaryCtaLabel: "Continue shopping",
    },
    defaultDesignFields: {
      position: "bottom",
      size: "small",
      animation: "slide",
    },
  },

  PREMIUM_FULLSCREEN: {
    type: "PREMIUM_FULLSCREEN",
    label: "Premium Fullscreen",
    description: "Immersive full-page takeover for high-value products",
    category: "Revenue",
    icon: "💎",
    contentSchema: PremiumFullscreenContentSchema,
    requiresProduct: true,
    defaultFields: {
      headline: "Exclusive Offer",
      subheadline: "Upgrade your experience with our premium selection",
      buttonText: "Claim This Deal",
      secondaryCtaLabel: "Maybe later",
    },
    defaultDesignFields: {
      size: "fullscreen",
    },
  },

  COUNTDOWN_URGENCY: {
    type: "COUNTDOWN_URGENCY",
    label: "Countdown Urgency",
    description: "Time-limited offer with live countdown timer",
    category: "Revenue",
    icon: "⏱️",
    contentSchema: CountdownUrgencyContentSchema,
    requiresProduct: true,
    requiresDiscount: true,
    defaultFields: {
      headline: "Flash Deal!",
      subheadline: "This exclusive offer expires soon",
      buttonText: "Claim This Deal Now",
      secondaryCtaLabel: "No thanks",
    },
  },
};

/**
 * Get template metadata by type
 */
export function getTemplateMetadata(templateType: TemplateType): TemplateMetadata {
  return TEMPLATE_REGISTRY[templateType];
}

/**
 * Get content schema for template type
 */
export function getContentSchemaForTemplate(templateType?: TemplateType) {
  if (!templateType) {
    return BaseContentConfigSchema;
  }
  return TEMPLATE_REGISTRY[templateType]?.contentSchema || BaseContentConfigSchema;
}

/**
 * Get template label
 */
export function getTemplateLabel(templateType: TemplateType): string {
  return TEMPLATE_REGISTRY[templateType]?.label || templateType;
}

/**
 * Get all template types
 */
export function getAllTemplateTypes(): TemplateType[] {
  return Object.keys(TEMPLATE_REGISTRY) as TemplateType[];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): TemplateMetadata[] {
  return Object.values(TEMPLATE_REGISTRY).filter((t) => t.category === category);
}

/**
 * Get all template options for dropdowns
 */
export function getTemplateOptions(): Array<{
  label: string;
  value: TemplateType;
}> {
  return Object.values(TEMPLATE_REGISTRY).map((t) => ({
    label: t.label,
    value: t.type,
  }));
}

/**
 * Check if template requires discount
 */
export function templateRequiresDiscount(templateType: TemplateType): boolean {
  return TEMPLATE_REGISTRY[templateType]?.requiresDiscount || false;
}

/**
 * Check if template requires product
 */
export function templateRequiresProduct(templateType: TemplateType): boolean {
  return TEMPLATE_REGISTRY[templateType]?.requiresProduct || false;
}

/**
 * Get default button text for template type
 */
export function getDefaultButtonText(templateType: TemplateType): string {
  const defaults: Record<TemplateType, string> = {
    NEWSLETTER: "Subscribe",
    EXIT_INTENT: "Get Discount",
    SPIN_TO_WIN: "Spin Now",
    SCRATCH_CARD: "Scratch Now",
    FLASH_SALE: "Shop Now",
    COUNTDOWN_TIMER: "Shop Now",
    FREE_SHIPPING: "Shop Now",
    CART_ABANDONMENT: "Return to Cart",
    PRODUCT_UPSELL: "Add to Cart",
    SOCIAL_PROOF: "Learn More",
    ANNOUNCEMENT: "Learn More",
    // New upsell popup template types
    CLASSIC_UPSELL: "Add to Cart",
    MINIMAL_SLIDE_UP: "Quick Add",
    PREMIUM_FULLSCREEN: "Claim This Deal",
    COUNTDOWN_URGENCY: "Claim This Deal Now",
  };
  return defaults[templateType] || "Select";
}
