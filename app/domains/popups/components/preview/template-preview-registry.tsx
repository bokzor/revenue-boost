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

const PRODUCT_UPSELL_PREVIEW_PRODUCTS = [
  {
    id: "preview-hoodie",
    title: "Premium Fleece Hoodie",
    price: "79.00",
    compareAtPrice: "99.00",
    imageUrl:
      "https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&w=600",
    variantId: "preview-hoodie-variant",
    handle: "premium-fleece-hoodie",
    description: "Cozy, heavyweight hoodie perfect for cooler days.",
    rating: 4.8,
    reviewCount: 128,
    savingsPercent: 20,
  },
  {
    id: "preview-joggers",
    title: "Essential Jogger Pants",
    price: "59.00",
    compareAtPrice: "79.00",
    imageUrl:
      "https://images.pexels.com/photos/7671176/pexels-photo-7671176.jpeg?auto=compress&cs=tinysrgb&w=600",
    variantId: "preview-joggers-variant",
    handle: "essential-jogger-pants",
    description: "Tapered fit joggers with soft brushed interior.",
    rating: 4.7,
    reviewCount: 96,
    savingsPercent: 25,
  },
  {
    id: "preview-sneakers",
    title: "Everyday Comfort Sneakers",
    price: "89.00",
    compareAtPrice: "119.00",
    imageUrl:
      "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600",
    variantId: "preview-sneakers-variant",
    handle: "everyday-comfort-sneakers",
    description: "Lightweight sneakers built for all-day wear.",
    rating: 4.9,
    reviewCount: 212,
    savingsPercent: 25,
  },
];


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
    // Main colors
    backgroundColor: mergedConfig.backgroundColor || designConfig.backgroundColor || "#FFFFFF",
    textColor: mergedConfig.textColor || designConfig.textColor || "#1A1A1A",
    descriptionColor: mergedConfig.descriptionColor || designConfig.descriptionColor,
    accentColor: mergedConfig.accentColor || designConfig.accentColor || "#007BFF",

    // Button colors
    buttonColor: mergedConfig.buttonColor || designConfig.buttonColor || "#007BFF",
    buttonTextColor: mergedConfig.buttonTextColor || designConfig.buttonTextColor || "#FFFFFF",

    // Input colors
    inputBackgroundColor: mergedConfig.inputBackgroundColor || designConfig.inputBackgroundColor,
    inputTextColor: mergedConfig.inputTextColor || designConfig.inputTextColor,
    inputBorderColor: mergedConfig.inputBorderColor || designConfig.inputBorderColor,

    // Image colors
    imageBgColor: mergedConfig.imageBgColor || designConfig.imageBgColor,

    // State colors
    successColor: mergedConfig.successColor || designConfig.successColor,

    // Overlay
    overlayColor: mergedConfig.overlayColor || designConfig.overlayColor || "rgba(0, 0, 0, 1)",
    overlayOpacity: mergedConfig.overlayOpacity ?? designConfig.overlayOpacity ?? 0.6,

    // Layout
    position: mergedConfig.position || designConfig.position || "center",
    size: mergedConfig.size || designConfig.size || "medium",
    borderRadius: mergedConfig.borderRadius ?? designConfig.borderRadius ?? 8,
    animation: mergedConfig.animation || designConfig.animation || "fade",

    // Typography
    fontFamily: mergedConfig.fontFamily || designConfig.fontFamily,
    fontSize: mergedConfig.fontSize || designConfig.fontSize,
    fontWeight: mergedConfig.fontWeight || designConfig.fontWeight,
    titleFontSize: mergedConfig.titleFontSize || designConfig.titleFontSize,
    titleFontWeight: mergedConfig.titleFontWeight || designConfig.titleFontWeight,
    titleTextShadow: mergedConfig.titleTextShadow || designConfig.titleTextShadow,
    descriptionFontSize: mergedConfig.descriptionFontSize || designConfig.descriptionFontSize,
    descriptionFontWeight: mergedConfig.descriptionFontWeight || designConfig.descriptionFontWeight,

    // Input styling
    inputBackdropFilter: mergedConfig.inputBackdropFilter || designConfig.inputBackdropFilter,
    inputBoxShadow: mergedConfig.inputBoxShadow || designConfig.inputBoxShadow,

    // Preview mode
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

      // Content
      headline: mergedConfig.headline || "Join Our Newsletter",
      subheadline: mergedConfig.subheadline || "Get exclusive offers and updates",
      submitButtonText: mergedConfig.submitButtonText || mergedConfig.buttonText || "Subscribe",
      buttonText: mergedConfig.buttonText || "Subscribe",
      successMessage: mergedConfig.successMessage || "Thank you for subscribing!",

      // Email field
      emailLabel: mergedConfig.emailLabel,
      emailPlaceholder: mergedConfig.emailPlaceholder || "Enter your email",
      emailRequired: mergedConfig.emailRequired ?? true,
      emailErrorMessage: mergedConfig.emailErrorMessage,

      // Name field
      nameFieldEnabled: mergedConfig.nameFieldEnabled ?? false,
      nameFieldRequired: mergedConfig.nameFieldRequired ?? false,
      nameFieldPlaceholder: mergedConfig.nameFieldPlaceholder || "Your name",

      // Consent field
      consentFieldEnabled: mergedConfig.consentFieldEnabled ?? false,
      consentFieldRequired: mergedConfig.consentFieldRequired ?? false,
      consentFieldText: mergedConfig.consentFieldText || "I agree to receive marketing emails",

      // Image
      imageUrl: mergedConfig.imageUrl || designConfig.imageUrl,
      imagePosition: mergedConfig.imagePosition || designConfig.imagePosition || "top",

      // Discount (campaign stores as discountConfig, component expects discount)
      discount: mergedConfig.discountConfig || mergedConfig.discount,

      // All common config (colors, typography, layout)
      ...buildCommonConfig(mergedConfig, designConfig),
    } as NewsletterConfig),
  },

  [TemplateTypeEnum.FLASH_SALE]: {
    component: FlashSalePopup,
    buildConfig: (mergedConfig, designConfig): FlashSaleConfig => ({
      id: "preview-flash-sale",

      // Base content fields (only those used by FlashSale)
      headline: mergedConfig.headline || "Flash Sale!",
      subheadline: mergedConfig.subheadline || "Limited time offer - Don't miss out!",
      buttonText: mergedConfig.buttonText || "Shop Now",
      successMessage: mergedConfig.successMessage || "Success!", // Required by BaseContentConfigSchema but not used
      failureMessage: mergedConfig.failureMessage, // Required by BaseContentConfigSchema but not used
      ctaText: mergedConfig.ctaText, // Required by BaseContentConfigSchema but not used

      // FlashSale-specific content fields
      urgencyMessage: mergedConfig.urgencyMessage || "Hurry! Sale ends soon!",
      discountPercentage: mergedConfig.discountPercentage ?? 50,
      originalPrice: mergedConfig.originalPrice,
      salePrice: mergedConfig.salePrice,
      showCountdown: mergedConfig.showCountdown ?? true,
      endTime: mergedConfig.endTime,
      countdownDuration: mergedConfig.countdownDuration ?? 3600,
      hideOnExpiry: mergedConfig.hideOnExpiry ?? true,
      autoHideOnExpire: mergedConfig.autoHideOnExpire ?? false,
      showStockCounter: mergedConfig.showStockCounter ?? false,
      stockMessage: mergedConfig.stockMessage,
      ctaUrl: mergedConfig.ctaUrl,

      // Storefront-specific
      ctaOpenInNewTab: mergedConfig.ctaOpenInNewTab ?? false,

      // Design-specific (FlashSale)
      popupSize: mergedConfig.popupSize || designConfig.popupSize || "wide",

      // All common config (colors, typography, layout)
      ...buildCommonConfig(mergedConfig, designConfig),
    }),
  },

  [TemplateTypeEnum.COUNTDOWN_TIMER]: {
    component: CountdownTimerPopup,
    buildConfig: (mergedConfig, designConfig): CountdownTimerConfig => ({
      id: "preview-countdown",

      // Base content fields
      headline: mergedConfig.headline || "Limited Time Offer",
      subheadline: mergedConfig.subheadline || "Hurry! Sale ends soon",
      buttonText: mergedConfig.buttonText || "Shop Now",
      successMessage: mergedConfig.successMessage || "Success!",
      failureMessage: mergedConfig.failureMessage,
      ctaText: mergedConfig.ctaText || mergedConfig.buttonText || "Shop Now",

      // CountdownTimer-specific fields
      endTime: mergedConfig.endTime || new Date(Date.now() + 3600000).toISOString(),
      countdownDuration: mergedConfig.countdownDuration ?? 3600,
      hideOnExpiry: mergedConfig.hideOnExpiry ?? true,
      showStockCounter: mergedConfig.showStockCounter ?? false,
      stockCount: mergedConfig.stockCount,
      sticky: mergedConfig.sticky ?? true,
      ctaUrl: mergedConfig.ctaUrl,
      colorScheme: mergedConfig.colorScheme || "custom",

      // Storefront-specific
      ctaOpenInNewTab: mergedConfig.ctaOpenInNewTab ?? false,

      // All common config (colors, typography, layout)
      ...buildCommonConfig(mergedConfig, designConfig),
    }) as unknown as CountdownTimerConfig,
  },

  [TemplateTypeEnum.SOCIAL_PROOF]: {
    component: SocialProofPopup,
    buildConfig: (mergedConfig, designConfig): SocialProofConfig => ({
      id: "preview-social-proof",

      // Base content fields
      headline: mergedConfig.headline || "Join Thousands of Happy Customers",
      subheadline: mergedConfig.subheadline,
      buttonText: mergedConfig.buttonText || "Shop Now",
      successMessage: mergedConfig.successMessage || "Success!",
      failureMessage: mergedConfig.failureMessage,
      ctaText: mergedConfig.ctaText,

      // SocialProof-specific fields
      enablePurchaseNotifications: mergedConfig.enablePurchaseNotifications ?? true,
      enableVisitorNotifications: mergedConfig.enableVisitorNotifications ?? false,
      enableReviewNotifications: mergedConfig.enableReviewNotifications ?? false,
      purchaseMessageTemplate: mergedConfig.purchaseMessageTemplate,
      visitorMessageTemplate: mergedConfig.visitorMessageTemplate,
      reviewMessageTemplate: mergedConfig.reviewMessageTemplate,
      cornerPosition: mergedConfig.cornerPosition || "bottom-left",
      displayDuration: mergedConfig.displayDuration ?? 6,
      rotationInterval: mergedConfig.rotationInterval ?? 8,
      maxNotificationsPerSession: mergedConfig.maxNotificationsPerSession ?? 5,
      minVisitorCount: mergedConfig.minVisitorCount,
      minReviewRating: mergedConfig.minReviewRating,
      messageTemplates: mergedConfig.messageTemplates,
      showProductImage: mergedConfig.showProductImage ?? true,
      showTimer: mergedConfig.showTimer ?? true,

      // All common config (colors, typography, layout)
      ...buildCommonConfig(mergedConfig, designConfig),
    }) as unknown as SocialProofConfig,
  },

  [TemplateTypeEnum.SPIN_TO_WIN]: {
    component: SpinToWinPopup,
    buildConfig: (mergedConfig, designConfig): SpinToWinConfig => ({
      id: "preview-spin-to-win",

      // Base content fields
      headline: mergedConfig.headline || "Spin to Win!",
      subheadline: mergedConfig.subheadline || "Try your luck for a discount",
      buttonText: mergedConfig.buttonText || "Spin Now",
      successMessage: mergedConfig.successMessage || "Congratulations!",
      failureMessage: mergedConfig.failureMessage,
      ctaText: mergedConfig.ctaText,

      // SpinToWin-specific fields
      spinButtonText: mergedConfig.spinButtonText || "Spin to Win!",
      emailRequired: mergedConfig.emailRequired ?? true,
      emailPlaceholder: mergedConfig.emailPlaceholder || "Enter your email",
      emailLabel: mergedConfig.emailLabel,
      wheelSegments: mergedConfig.wheelSegments || [],
      maxAttemptsPerUser: mergedConfig.maxAttemptsPerUser ?? 1,
      wheelSize: mergedConfig.wheelSize ?? 400,
      wheelBorderWidth: mergedConfig.wheelBorderWidth ?? 2,
      wheelBorderColor: mergedConfig.wheelBorderColor,
      spinDuration: mergedConfig.spinDuration ?? 4000,
      minSpins: mergedConfig.minSpins ?? 5,
      loadingText: mergedConfig.loadingText,

      // Image / layout
      imageUrl: mergedConfig.imageUrl || designConfig.imageUrl,
      imagePosition: mergedConfig.imagePosition || designConfig.imagePosition || "left",

      // All common config (colors, typography, layout)
      ...buildCommonConfig(mergedConfig, designConfig),
    }) as unknown as SpinToWinConfig,
  },

  [TemplateTypeEnum.SCRATCH_CARD]: {
    component: ScratchCardPopup,
    buildConfig: (mergedConfig, designConfig): ScratchCardConfig => ({
      id: "preview-scratch-card",

      // Base content fields
      headline: mergedConfig.headline || "Scratch to Reveal Your Discount",
      subheadline: mergedConfig.subheadline || "Everyone wins!",
      buttonText: mergedConfig.buttonText || "Claim Discount",
      successMessage: mergedConfig.successMessage || "Congratulations!",
      failureMessage: mergedConfig.failureMessage,
      ctaText: mergedConfig.ctaText,

      // ScratchCard-specific fields
      scratchInstruction: mergedConfig.scratchInstruction || "Scratch to reveal your prize!",
      emailRequired: mergedConfig.emailRequired ?? true,
      emailPlaceholder: mergedConfig.emailPlaceholder || "Enter your email",
      emailLabel: mergedConfig.emailLabel,
      emailBeforeScratching: mergedConfig.emailBeforeScratching ?? false,
      scratchThreshold: mergedConfig.scratchThreshold ?? 50,
      scratchRadius: mergedConfig.scratchRadius ?? 20,
      prizes: mergedConfig.prizes || [],

      // Image / layout
      imageUrl: mergedConfig.imageUrl || designConfig.imageUrl,
      imagePosition: mergedConfig.imagePosition || designConfig.imagePosition || "left",

      // All common config (colors, typography, layout)
      ...buildCommonConfig(mergedConfig, designConfig),
    }) as unknown as ScratchCardConfig,
  },
};

// Add remaining templates
TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.PRODUCT_UPSELL] = {
  component: ProductUpsellPopup,
  buildConfig: (mergedConfig, designConfig): ProductUpsellConfig => ({
    id: "preview-product-upsell",

    // Base content fields
    headline: mergedConfig.headline || "You Might Also Like",
    subheadline: mergedConfig.subheadline,
    buttonText: mergedConfig.buttonText || "Add to Cart",
    successMessage: mergedConfig.successMessage || "Added to cart!",
    failureMessage: mergedConfig.failureMessage,
    ctaText: mergedConfig.ctaText,

    // ProductUpsell-specific fields
    productSelectionMethod: mergedConfig.productSelectionMethod || "manual",
    selectedProducts: mergedConfig.selectedProducts || mergedConfig.products || [],
    products: mergedConfig.products || PRODUCT_UPSELL_PREVIEW_PRODUCTS,
    selectedCollection: mergedConfig.selectedCollection,
    maxProducts: mergedConfig.maxProducts ?? 3,
    layout: mergedConfig.layout || "grid",
    columns: mergedConfig.columns ?? 2,
    showPrices: mergedConfig.showPrices ?? true,
    showCompareAtPrice: mergedConfig.showCompareAtPrice ?? true,
    showImages: mergedConfig.showImages ?? true,
    showRatings: mergedConfig.showRatings ?? false,
    showReviewCount: mergedConfig.showReviewCount ?? false,
    bundleDiscount: mergedConfig.bundleDiscount ?? 15,
    bundleDiscountText: mergedConfig.bundleDiscountText,
    multiSelect: mergedConfig.multiSelect ?? true,
    secondaryCtaLabel: mergedConfig.secondaryCtaLabel,
    currency: mergedConfig.currency || "USD",

    // All common config (colors, typography, layout)
    ...buildCommonConfig(mergedConfig, designConfig),
  }) as unknown as ProductUpsellConfig,
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.ANNOUNCEMENT] = {
  component: AnnouncementPopup,
  buildConfig: (mergedConfig, designConfig): AnnouncementConfig => ({
    id: "preview-announcement",

    // Base content fields
    headline: mergedConfig.headline || "Important Announcement",
    subheadline: mergedConfig.subheadline || "Check out our latest updates",
    buttonText: mergedConfig.buttonText || "Learn More",
    successMessage: mergedConfig.successMessage || "Success!",
    failureMessage: mergedConfig.failureMessage,
    ctaText: mergedConfig.ctaText,

    // Announcement-specific fields
    sticky: mergedConfig.sticky ?? true,
    icon: mergedConfig.icon,
    ctaUrl: mergedConfig.ctaUrl,
    ctaOpenInNewTab: mergedConfig.ctaOpenInNewTab ?? false,
    colorScheme: mergedConfig.colorScheme || "custom",

    // All common config (colors, typography, layout)
    ...buildCommonConfig(mergedConfig, designConfig),
  }) as unknown as AnnouncementConfig,
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.FREE_SHIPPING] = {
  component: FreeShippingPopup,
  buildConfig: (mergedConfig, designConfig): FreeShippingConfig => ({
    id: "preview-free-shipping",

    // FreeShipping-specific content fields (from mockup)
    threshold: mergedConfig.threshold ?? 75,
    currency: mergedConfig.currency || "$",
    nearMissThreshold: mergedConfig.nearMissThreshold ?? 10,
    emptyMessage: mergedConfig.emptyMessage || "Add items to unlock free shipping",
    progressMessage: mergedConfig.progressMessage || "You're {remaining} away from free shipping",
    nearMissMessage: mergedConfig.nearMissMessage || "Only {remaining} to go!",
    unlockedMessage: mergedConfig.unlockedMessage || "You've unlocked free shipping! 🎉",
    barPosition: mergedConfig.barPosition || "top", // Use barPosition instead of position
    dismissible: mergedConfig.dismissible ?? true,
    showIcon: mergedConfig.showIcon ?? true,
    celebrateOnUnlock: mergedConfig.celebrateOnUnlock ?? true,
    animationDuration: mergedConfig.animationDuration ?? 500,
    previewCartTotal: mergedConfig.previewCartTotal ?? 0,

    // Claim behavior (email gate)
    requireEmailToClaim: mergedConfig.requireEmailToClaim ?? false,
    claimButtonLabel: mergedConfig.claimButtonLabel || "Claim discount",
    claimEmailPlaceholder: mergedConfig.claimEmailPlaceholder || "Enter your email",
    claimSuccessMessage: mergedConfig.claimSuccessMessage,
    claimErrorMessage: mergedConfig.claimErrorMessage,

    // Preview cart total mapping into component config
    currentCartTotal: mergedConfig.previewCartTotal,

    // All common config (colors, typography, layout)
    ...buildCommonConfig(mergedConfig, designConfig),
  }) as unknown as FreeShippingConfig,
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.CART_ABANDONMENT] = {
  component: CartAbandonmentPopup,
  buildConfig: (mergedConfig, designConfig): CartAbandonmentConfig => ({
    id: "preview-cart-abandonment",

    // Base content fields
    headline: mergedConfig.headline || "Complete Your Purchase",
    subheadline: mergedConfig.subheadline || "Your items are waiting",
    buttonText: mergedConfig.buttonText || "Return to Cart",
    successMessage: mergedConfig.successMessage || "Success!",
    failureMessage: mergedConfig.failureMessage,
    ctaText: mergedConfig.ctaText,

    // CartAbandonment-specific fields
    showCartItems: mergedConfig.showCartItems ?? true,
    maxItemsToShow: mergedConfig.maxItemsToShow ?? 3,
    showCartTotal: mergedConfig.showCartTotal ?? true,
    showUrgency: mergedConfig.showUrgency ?? true,
    urgencyTimer: mergedConfig.urgencyTimer ?? 300,
    urgencyMessage: mergedConfig.urgencyMessage,
    showStockWarnings: mergedConfig.showStockWarnings ?? false,
    stockWarningMessage: mergedConfig.stockWarningMessage,
    ctaUrl: mergedConfig.ctaUrl,
    saveForLaterText: mergedConfig.saveForLaterText,
    currency: mergedConfig.currency || "USD",

    // All common config (colors, typography, layout)
    ...buildCommonConfig(mergedConfig, designConfig),
  }) as unknown as CartAbandonmentConfig,
};

/**
 * Get preview component and config builder for template type
 */
export function getTemplatePreviewEntry(templateType: string): TemplatePreviewEntry | null {
  return TEMPLATE_PREVIEW_REGISTRY[templateType] || null;
}

