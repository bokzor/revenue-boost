/**
 * Template Preview Component Registry
 *
 * Maps template types to their preview components and config builders
 * Eliminates the large switch statement in TemplatePreview.tsx
 */

import React from "react";
import {
  NewsletterPopup,
  SpinToWinPopup,
  ScratchCardPopup,
  FlashSalePopup,
  CountdownTimerPopup,
  CartAbandonmentPopup,
  ProductUpsellPopup,
  FreeShippingPopup,
  SocialProofPopup,
  AnnouncementPopup,
} from "~/domains/storefront/popups-new";

import type {
  NewsletterConfig,
  SpinToWinConfig,
  ScratchCardConfig,
  FlashSaleConfig,
  CountdownTimerConfig,
  CartAbandonmentConfig,
  ProductUpsellConfig,
  FreeShippingConfig,
  SocialProofConfig,
  AnnouncementConfig,
} from "~/domains/storefront/popups-new";

import { TemplateTypeEnum } from "~/lib/template-types.enum";

/**
 * Config builder function type
 * Takes merged config and design config, returns component-specific config
 */
export type ConfigBuilder<T = any> = (
  mergedConfig: Record<string, any>,
  designConfig: Record<string, any>
) => T;

/**
 * Template preview component entry
 */
export interface TemplatePreviewEntry {
  component: React.ComponentType<any>;
  buildConfig: ConfigBuilder;
}

/**
 * Build common config properties shared across all templates
 */
function buildCommonConfig(mergedConfig: Record<string, any>, designConfig: Record<string, any>) {
  return {
    backgroundColor: mergedConfig.backgroundColor || designConfig.backgroundColor || "#FFFFFF",
    textColor: mergedConfig.textColor || designConfig.textColor || "#1A1A1A",
    buttonColor: mergedConfig.buttonColor || designConfig.buttonColor || "#007BFF",
    buttonTextColor: mergedConfig.buttonTextColor || designConfig.buttonTextColor || "#FFFFFF",
    accentColor: mergedConfig.accentColor || designConfig.accentColor || "#007BFF",
    overlayColor: mergedConfig.overlayColor || designConfig.overlayColor || "rgba(0, 0, 0, 1)",
    overlayOpacity: mergedConfig.overlayOpacity ?? designConfig.overlayOpacity ?? 0.6,
    position: mergedConfig.position || designConfig.position || "center",
    size: mergedConfig.size || designConfig.size || "medium",
    borderRadius: mergedConfig.borderRadius ?? designConfig.borderRadius ?? 8,
    animation: mergedConfig.animation || designConfig.animation || "fade",
    previewMode: true,
    showCloseButton: true,
  };
}

/**
 * Template Preview Component Registry
 */
export const TEMPLATE_PREVIEW_REGISTRY: Record<string, TemplatePreviewEntry> = {
  [TemplateTypeEnum.NEWSLETTER]: {
    component: NewsletterPopup,
    buildConfig: (mergedConfig, designConfig): NewsletterConfig => ({
      id: "preview-newsletter",
      headline: mergedConfig.headline || "Join Our Newsletter",
      subheadline: mergedConfig.subheadline || "Get exclusive offers and updates",
      buttonText: mergedConfig.buttonText || "Subscribe",
      successMessage: mergedConfig.successMessage || "Thank you for subscribing!",
      ...buildCommonConfig(mergedConfig, designConfig),
      inputBackgroundColor: mergedConfig.inputBackgroundColor || "#FFFFFF",
      inputTextColor: mergedConfig.inputTextColor || "#1A1A1A",
      inputBorderColor: mergedConfig.inputBorderColor || "#D1D5DB",
      imageUrl: mergedConfig.imageUrl,
      imagePosition: mergedConfig.imagePosition || "top",
    } as NewsletterConfig),
  },

  [TemplateTypeEnum.FLASH_SALE]: {
    component: FlashSalePopup,
    buildConfig: (mergedConfig, designConfig) => ({
      id: "preview-flash-sale",
      headline: mergedConfig.headline || "Flash Sale!",
      subheadline: mergedConfig.subheadline || "Limited time offer",
      buttonText: mergedConfig.buttonText || "Shop Now",
      ...buildCommonConfig(mergedConfig, designConfig),
    } as FlashSaleConfig),
  },

  [TemplateTypeEnum.COUNTDOWN_TIMER]: {
    component: CountdownTimerPopup,
    buildConfig: (mergedConfig, designConfig) => ({
      id: "preview-countdown",
      headline: mergedConfig.headline || "Limited Time Offer",
      subheadline: mergedConfig.subheadline || "Hurry! Sale ends soon",
      buttonText: mergedConfig.buttonText || "Shop Now",
      endTime: new Date(Date.now() + 3600000).toISOString(),
      ...buildCommonConfig(mergedConfig, designConfig),
    } as CountdownTimerConfig),
  },

  [TemplateTypeEnum.SOCIAL_PROOF]: {
    component: SocialProofPopup,
    buildConfig: (mergedConfig, designConfig) => ({
      id: "preview-social-proof",
      headline: mergedConfig.headline || "Join Thousands of Happy Customers",
      ...buildCommonConfig(mergedConfig, designConfig),
    } as SocialProofConfig),
  },

  [TemplateTypeEnum.SPIN_TO_WIN]: {
    component: SpinToWinPopup,
    buildConfig: (mergedConfig, designConfig) => ({
      id: "preview-spin-to-win",
      headline: mergedConfig.headline || "Spin to Win!",
      subheadline: mergedConfig.subheadline || "Try your luck for a discount",
      buttonText: mergedConfig.buttonText || "Spin Now",
      ...buildCommonConfig(mergedConfig, designConfig),
    } as SpinToWinConfig),
  },

  [TemplateTypeEnum.SCRATCH_CARD]: {
    component: ScratchCardPopup,
    buildConfig: (mergedConfig, designConfig) => ({
      id: "preview-scratch-card",
      headline: mergedConfig.headline || "Scratch to Reveal Your Discount",
      subheadline: mergedConfig.subheadline || "Everyone wins!",
      buttonText: mergedConfig.buttonText || "Claim Discount",
      ...buildCommonConfig(mergedConfig, designConfig),
    } as ScratchCardConfig),
  },
};

// Add remaining templates
TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.PRODUCT_UPSELL] = {
  component: ProductUpsellPopup,
  buildConfig: (mergedConfig, designConfig) => ({
    id: "preview-product-upsell",
    headline: mergedConfig.headline || "You Might Also Like",
    products: mergedConfig.products || [],
    ...buildCommonConfig(mergedConfig, designConfig),
  } as ProductUpsellConfig),
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.ANNOUNCEMENT] = {
  component: AnnouncementPopup,
  buildConfig: (mergedConfig, designConfig) => ({
    id: "preview-announcement",
    headline: mergedConfig.headline || "Important Announcement",
    subheadline: mergedConfig.subheadline || "Check out our latest updates",
    buttonText: mergedConfig.buttonText || "Learn More",
    ...buildCommonConfig(mergedConfig, designConfig),
  } as AnnouncementConfig),
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.FREE_SHIPPING] = {
  component: FreeShippingPopup,
  buildConfig: (mergedConfig, designConfig) => ({
    id: "preview-free-shipping",
    headline: mergedConfig.headline || "Free Shipping",
    subheadline: mergedConfig.subheadline || "On orders over $50",
    buttonText: mergedConfig.buttonText || "Shop Now",
    ...buildCommonConfig(mergedConfig, designConfig),
  } as FreeShippingConfig),
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.CART_ABANDONMENT] = {
  component: CartAbandonmentPopup,
  buildConfig: (mergedConfig, designConfig) => ({
    id: "preview-cart-abandonment",
    headline: mergedConfig.headline || "Complete Your Purchase",
    subheadline: mergedConfig.subheadline || "Your items are waiting",
    buttonText: mergedConfig.buttonText || "Return to Cart",
    discountCode: mergedConfig.discountCode,
    ...buildCommonConfig(mergedConfig, designConfig),
  } as unknown as CartAbandonmentConfig),
};

/**
 * Get preview component and config builder for template type
 */
export function getTemplatePreviewEntry(templateType: string): TemplatePreviewEntry | null {
  return TEMPLATE_PREVIEW_REGISTRY[templateType] || null;
}

