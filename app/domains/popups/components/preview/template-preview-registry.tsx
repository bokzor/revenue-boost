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
  PopupDesignConfig,
  DiscountConfig as StorefrontDiscountConfig,
} from "~/domains/storefront/popups-new";

import type { DiscountConfig as AdminDiscountConfig } from "~/domains/campaigns/types/campaign";

import { TemplateTypeEnum } from "~/lib/template-types.enum";

// =============================================================================
// DISCOUNT CONFIG TRANSFORMATION
// =============================================================================

/**
 * Transforms admin form DiscountConfig to storefront popup DiscountConfig
 *
 * Admin form uses:   { enabled, valueType, value, prefix, behavior, ... }
 * Storefront uses:   { enabled, percentage, value, type, code, behavior }
 *
 * @param adminConfig - The discount config from the admin form (campaign.discountConfig)
 * @param defaultCode - Default code prefix if none is configured
 * @returns StorefrontDiscountConfig or undefined if no config provided
 */
export function transformDiscountConfig(
  adminConfig: Partial<AdminDiscountConfig> | undefined,
  defaultCode: string = "DISCOUNT"
): StorefrontDiscountConfig | undefined {
  if (!adminConfig) return undefined;

  const isPercentage = adminConfig.valueType === "PERCENTAGE";
  const isFixedAmount = adminConfig.valueType === "FIXED_AMOUNT";
  const value = typeof adminConfig.value === "number" ? adminConfig.value : undefined;

  return {
    enabled: adminConfig.enabled !== false,
    percentage: isPercentage && value !== undefined ? value : undefined,
    value: value,
    type: isPercentage
      ? "percentage"
      : isFixedAmount
        ? "fixed_amount"
        : "free_shipping",
    code: adminConfig.prefix || defaultCode,
    behavior: adminConfig.behavior || "SHOW_CODE_AND_AUTO_APPLY",
  };
}

/**
 * Default preview prizes for scratch card
 * These are used when no prizes are configured yet
 */
const SCRATCH_CARD_PREVIEW_PRIZES = [
  {
    id: "preview-prize-5-off",
    label: "5% OFF",
    probability: 0.4,
    discountCode: "PREVIEW5",
  },
  {
    id: "preview-prize-10-off",
    label: "10% OFF",
    probability: 0.3,
    discountCode: "PREVIEW10",
  },
  {
    id: "preview-prize-15-off",
    label: "15% OFF",
    probability: 0.2,
    discountCode: "PREVIEW15",
  },
  {
    id: "preview-prize-20-off",
    label: "20% OFF",
    probability: 0.1,
    discountCode: "PREVIEW20",
  },
];

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
export type ConfigBuilder<T = unknown> = (
  mergedConfig: Partial<T>,
  designConfig: Partial<PopupDesignConfig>
) => T;

/**
 * Template preview component entry
 * Component type uses 'any' for additional props since preview components
 * have varying extra props (onSubmit, issueDiscount, etc.)
 */
export interface TemplatePreviewEntry<TConfig = unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Components have varying additional props
  component: React.ComponentType<{ config: TConfig; isVisible: boolean; onClose: () => void } & Record<string, any>>;
  buildConfig: ConfigBuilder<TConfig>;
}

/**
 * Build common config properties shared across all templates
 */
function buildCommonConfig(
  mergedConfig: Partial<PopupDesignConfig>,
  designConfig: Partial<PopupDesignConfig>
) {
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

    // Background image (for templates that support full background mode)
    imageUrl: mergedConfig.imageUrl || designConfig.imageUrl,
    imagePosition: mergedConfig.imagePosition || designConfig.imagePosition,
    backgroundImageMode: mergedConfig.backgroundImageMode || designConfig.backgroundImageMode || "none",
    backgroundOverlayOpacity: mergedConfig.backgroundOverlayOpacity ?? designConfig.backgroundOverlayOpacity ?? 0.6,

    // Scratch Card specific design properties
    scratchCardBackgroundColor: mergedConfig.scratchCardBackgroundColor || designConfig.scratchCardBackgroundColor,
    scratchCardTextColor: mergedConfig.scratchCardTextColor || designConfig.scratchCardTextColor,
    scratchOverlayColor: mergedConfig.scratchOverlayColor || designConfig.scratchOverlayColor,
    scratchOverlayImage: mergedConfig.scratchOverlayImage || designConfig.scratchOverlayImage,

    // Lead Capture Layout (Newsletter, Spin-to-Win, Scratch Card)
    leadCaptureLayout: mergedConfig.leadCaptureLayout || designConfig.leadCaptureLayout,

    // Preview mode
    previewMode: true,
    // Show close button respects user preference (default to true for preview)
    showCloseButton: mergedConfig.showCloseButton ?? designConfig.showCloseButton ?? true,
    // Display mode for popup/banner templates
    displayMode: (mergedConfig.displayMode || designConfig.displayMode || "popup") as "popup" | "banner",
  };
}

/**
 * Template Preview Component Registry
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry supports multiple config types
export const TEMPLATE_PREVIEW_REGISTRY: Record<string, TemplatePreviewEntry<any>> = {
  [TemplateTypeEnum.NEWSLETTER]: {
    component: NewsletterPopup,
    buildConfig: (
      mergedConfig: Partial<NewsletterConfig> & { discountConfig?: Partial<AdminDiscountConfig> },
      designConfig: Partial<PopupDesignConfig>
    ): NewsletterConfig => ({
        id: "preview-newsletter",

        // Content
        headline: mergedConfig.headline || "Join Our Newsletter",
        subheadline: mergedConfig.subheadline || "Get exclusive offers and updates",
        submitButtonText: mergedConfig.submitButtonText || mergedConfig.buttonText || "Subscribe",
        buttonText: mergedConfig.buttonText || "Subscribe",
        dismissLabel: mergedConfig.dismissLabel,
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

        // Discount: transform admin config to storefront format
        discount: transformDiscountConfig(mergedConfig.discountConfig, "WELCOME") || mergedConfig.discount,

        // Mobile presentation mode (fullscreen, bottom-sheet, modal)
        mobilePresentationMode: mergedConfig.mobilePresentationMode,

        // All common config (colors, typography, layout, image settings)
        ...buildCommonConfig(mergedConfig, designConfig),
      }),
  },

  [TemplateTypeEnum.FLASH_SALE]: {
    component: FlashSalePopup,
    buildConfig: (
      mergedConfig: Partial<FlashSaleConfig> & { discountConfig?: Partial<AdminDiscountConfig> },
      designConfig: Partial<PopupDesignConfig>
    ): FlashSaleConfig => {
      const dc = mergedConfig.discountConfig;
      const storefrontDiscount = transformDiscountConfig(dc, "FLASH");

      // Derive discount percentage for FlashSale-specific display
      const discountPercentage =
        storefrontDiscount?.percentage ??
        mergedConfig.discountPercentage ??
        50;

      return {
        id: "preview-flash-sale",

        // Base content fields (only those used by FlashSale)
        headline: mergedConfig.headline || "Flash Sale!",
        subheadline: mergedConfig.subheadline || "Limited time offer - Don't miss out!",
        buttonText: mergedConfig.buttonText || "Shop Now",
        dismissLabel: mergedConfig.dismissLabel,
        successMessage: mergedConfig.successMessage || "Success!",
        failureMessage: mergedConfig.failureMessage,
        ctaText: mergedConfig.ctaText,

        // FlashSale-specific content fields
        urgencyMessage: mergedConfig.urgencyMessage || "Hurry! Sale ends soon!",
        discountPercentage,
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

        // Enhanced features from content config
        timer: mergedConfig.timer,
        inventory: {
          mode: "pseudo",
          pseudoMax: 50,
          showOnlyXLeft: true,
          showThreshold: 10,
          soldOutBehavior: "hide",
          ...(mergedConfig.inventory || {}),
        },
        reserve: mergedConfig.reserve,
        presentation: mergedConfig.presentation,

        // Storefront-specific
        ctaOpenInNewTab: mergedConfig.ctaOpenInNewTab ?? false,

        // Discount: keep original for legacy compatibility, add transformed version
        discountConfig: dc as FlashSaleConfig["discountConfig"],
        discount: storefrontDiscount,

        // Design-specific (FlashSale)
        popupSize: mergedConfig.popupSize || designConfig.popupSize || "wide",

        // All common config (colors, typography, layout) - includes displayMode
        ...buildCommonConfig(mergedConfig, designConfig),
      };
    },
  },

  [TemplateTypeEnum.COUNTDOWN_TIMER]: {
    component: CountdownTimerPopup,
    buildConfig: (
      mergedConfig: Partial<CountdownTimerConfig> & {
        inventory?: { showOnlyXLeft?: boolean; pseudoMax?: number };
        presentation?: { showInventory?: boolean };
      },
      designConfig: Partial<PopupDesignConfig>
    ): CountdownTimerConfig => {
      // Map from FlashSaleContentSection fields to CountdownTimerPopup fields:
      // - Form uses "presentation.showInventory" and "inventory"
      // - CountdownTimerPopup uses "showStockCounter" and "stockCount"
      const showStockCounter =
        mergedConfig.showStockCounter ??
        (mergedConfig.presentation?.showInventory && mergedConfig.inventory?.showOnlyXLeft) ??
        false;

      const stockCount =
        mergedConfig.stockCount ??
        mergedConfig.inventory?.pseudoMax ??
        undefined;

      return {
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
        showStockCounter,
        stockCount,
        sticky: mergedConfig.sticky ?? true,
        ctaUrl: mergedConfig.ctaUrl,
        colorScheme: mergedConfig.colorScheme || "custom",

        // Storefront-specific
        ctaOpenInNewTab: mergedConfig.ctaOpenInNewTab ?? false,

        // All common config (colors, typography, layout)
        ...buildCommonConfig(mergedConfig, designConfig),
      };
    },
  },

  [TemplateTypeEnum.SOCIAL_PROOF]: {
    component: SocialProofPopup,
    buildConfig: (
      mergedConfig: Partial<SocialProofConfig>,
      designConfig: Partial<PopupDesignConfig>
    ): SocialProofConfig =>
      ({
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
      }),
  },

  [TemplateTypeEnum.SPIN_TO_WIN]: {
    component: SpinToWinPopup,
    buildConfig: (
      mergedConfig: Partial<SpinToWinConfig>,
      designConfig: Partial<PopupDesignConfig>
    ): SpinToWinConfig =>
      ({
        id: "preview-spin-to-win",

        // Base content fields
        headline: mergedConfig.headline || "Spin to Win!",
        subheadline: mergedConfig.subheadline || "Try your luck for a discount",
        buttonText: mergedConfig.buttonText || "Spin Now",
        dismissLabel: mergedConfig.dismissLabel,
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

        // Name & consent config (matching LeadCaptureConfig)
        nameFieldEnabled: mergedConfig.nameFieldEnabled ?? false,
        nameFieldRequired: mergedConfig.nameFieldRequired ?? false,
        nameFieldLabel: mergedConfig.nameFieldLabel,
        nameFieldPlaceholder: mergedConfig.nameFieldPlaceholder,

        consentFieldEnabled: mergedConfig.consentFieldEnabled ?? false,
        consentFieldRequired: mergedConfig.consentFieldRequired ?? false,
        consentFieldText: mergedConfig.consentFieldText,

        // All common config (colors, typography, layout, image settings)
        ...buildCommonConfig(mergedConfig, designConfig),
        // Preview-only layout tweak: keep popup anchored to top so the wheel
        // doesn't visually jump when the prize box appears.
        position: "top",
      }),
  },

  [TemplateTypeEnum.SCRATCH_CARD]: {
    component: ScratchCardPopup,
    buildConfig: (
      mergedConfig: Partial<ScratchCardConfig>,
      designConfig: Partial<PopupDesignConfig>
    ): ScratchCardConfig =>
      ({
        id: "preview-scratch-card",

        // Base content fields
        headline: mergedConfig.headline || "Scratch to Reveal Your Discount",
        subheadline: mergedConfig.subheadline || "Everyone wins!",
        buttonText: mergedConfig.buttonText || "Claim Discount",
        dismissLabel: mergedConfig.dismissLabel,
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
        // Preview prizes: use configured prizes or default preview prizes
        prizes:
          mergedConfig.prizes && mergedConfig.prizes.length > 0
            ? mergedConfig.prizes
            : SCRATCH_CARD_PREVIEW_PRIZES,

        // Name field config
        nameFieldEnabled: mergedConfig.nameFieldEnabled ?? false,
        nameFieldRequired: mergedConfig.nameFieldRequired ?? false,
        nameFieldLabel: mergedConfig.nameFieldLabel,
        nameFieldPlaceholder: mergedConfig.nameFieldPlaceholder,

        // Consent (GDPR-style checkbox)
        consentFieldEnabled: mergedConfig.consentFieldEnabled ?? false,
        consentFieldRequired: mergedConfig.consentFieldRequired ?? false,
        consentFieldText: mergedConfig.consentFieldText,

        // All common config (colors, typography, layout, image settings)
        ...buildCommonConfig(mergedConfig, designConfig),
      }),
  },
};

// Add remaining templates
TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.PRODUCT_UPSELL] = {
  component: ProductUpsellPopup,
  buildConfig: (
    mergedConfig: Partial<ProductUpsellConfig>,
    designConfig: Partial<PopupDesignConfig>
  ): ProductUpsellConfig =>
    ({
      id: "preview-product-upsell",

      // Base content fields
      headline: mergedConfig.headline || "You Might Also Like",
      subheadline: mergedConfig.subheadline,
      buttonText: mergedConfig.buttonText || "Add to Cart",
      dismissLabel: mergedConfig.dismissLabel,
      successMessage: mergedConfig.successMessage || "Added to cart!",
      failureMessage: mergedConfig.failureMessage,
      ctaText: mergedConfig.ctaText,

      // ProductUpsell-specific fields
      productSelectionMethod: mergedConfig.productSelectionMethod || "manual",
      selectedProducts: mergedConfig.selectedProducts || [],
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
    }),
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.ANNOUNCEMENT] = {
  component: AnnouncementPopup,
  buildConfig: (
    mergedConfig: Partial<AnnouncementConfig>,
    designConfig: Partial<PopupDesignConfig>
  ): AnnouncementConfig =>
    ({
      id: "preview-announcement",

      // Base content fields
      headline: mergedConfig.headline || "Important Announcement",
      subheadline: mergedConfig.subheadline || "Check out our latest updates",
      buttonText: mergedConfig.buttonText || "Learn More",
      dismissLabel: mergedConfig.dismissLabel,
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

      // Override position: announcements are banners, default to "top" not "center"
      position: mergedConfig.position || designConfig.position || "top",
    }),
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.FREE_SHIPPING] = {
  component: FreeShippingPopup,
  buildConfig: (
    mergedConfig: Partial<FreeShippingConfig> & { discountConfig?: Partial<AdminDiscountConfig> },
    designConfig: Partial<PopupDesignConfig>
  ): FreeShippingConfig =>
    ({
      id: "preview-free-shipping",

      // FreeShipping-specific content fields
      threshold: mergedConfig.threshold ?? 75,
      currency: mergedConfig.currency || "$",
      nearMissThreshold: mergedConfig.nearMissThreshold ?? 10,
      emptyMessage: mergedConfig.emptyMessage || "Add items to unlock free shipping",
      progressMessage: mergedConfig.progressMessage || "You're {remaining} away from free shipping",
      nearMissMessage: mergedConfig.nearMissMessage || "Only {remaining} to go!",
      unlockedMessage: mergedConfig.unlockedMessage || "You've unlocked free shipping! 🎉",
      barPosition: mergedConfig.barPosition || "top",
      dismissible: mergedConfig.dismissible ?? true,
      dismissLabel: mergedConfig.dismissLabel,
      showIcon: mergedConfig.showIcon ?? true,
      celebrateOnUnlock: mergedConfig.celebrateOnUnlock ?? true,
      animationDuration: mergedConfig.animationDuration ?? 500,
      previewCartTotal: mergedConfig.previewCartTotal ?? 0,

      // Claim behavior (email gate)
      requireEmailToClaim: mergedConfig.requireEmailToClaim ?? false,
      claimButtonLabel: mergedConfig.claimButtonLabel || "Claim discount",
      claimEmailPlaceholder: mergedConfig.claimEmailPlaceholder || "Enter your email",
      claimSuccessMessage: mergedConfig.claimSuccessMessage || "Discount claimed!",
      claimErrorMessage: mergedConfig.claimErrorMessage || "Failed to claim discount",

      // Preview cart total mapping into component config
      currentCartTotal: mergedConfig.previewCartTotal,

      // Discount: transform admin config to storefront format
      discount: transformDiscountConfig(mergedConfig.discountConfig, "FREESHIP") || mergedConfig.discount,

      // All common config (colors, typography, layout)
      ...buildCommonConfig(mergedConfig, designConfig),
    }),
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.CART_ABANDONMENT] = {
  component: CartAbandonmentPopup,
  buildConfig: (
    mergedConfig: Partial<CartAbandonmentConfig> & { discountConfig?: Partial<AdminDiscountConfig> },
    designConfig: Partial<PopupDesignConfig>
  ): CartAbandonmentConfig =>
    ({
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
      dismissLabel: mergedConfig.dismissLabel,
      currency: mergedConfig.currency || "USD",

      // Email recovery preview fields
      enableEmailRecovery: mergedConfig.enableEmailRecovery ?? false,
      emailPlaceholder: mergedConfig.emailPlaceholder,
      emailSuccessMessage: mergedConfig.emailSuccessMessage,
      emailErrorMessage: mergedConfig.emailErrorMessage,
      emailButtonText: mergedConfig.emailButtonText,
      requireEmailBeforeCheckout: mergedConfig.requireEmailBeforeCheckout ?? false,

      // Discount: transform admin config to storefront format
      discount: transformDiscountConfig(mergedConfig.discountConfig, "SAVE"),

      // All common config (colors, typography, layout)
      ...buildCommonConfig(mergedConfig, designConfig),
    }),
};

/**
 * Get preview component and config builder for template type
 */
export function getTemplatePreviewEntry(templateType: string): TemplatePreviewEntry | null {
  return TEMPLATE_PREVIEW_REGISTRY[templateType] || null;
}
