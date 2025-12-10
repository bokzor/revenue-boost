/**
 * Template Preview Component Registry
 *
 * Maps template types to their preview components and config builders
 * Eliminates the large switch statement in TemplatePreview.tsx
 */

import type { ComponentType } from "react";
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
  ClassicUpsellPopup,
  MinimalSlideUpPopup,
  PremiumFullscreenPopup,
  CountdownUrgencyPopup,
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
  ClassicUpsellConfig,
  MinimalSlideUpConfig,
  PremiumFullscreenConfig,
  CountdownUrgencyConfig,
  PopupDesignConfig,
  DiscountConfig as StorefrontDiscountConfig,
} from "~/domains/storefront/popups-new";

import type { DiscountConfig as AdminDiscountConfig } from "~/domains/campaigns/types/campaign";

import { TemplateTypeEnum } from "~/domains/campaigns/types/campaign";

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
    type: isPercentage ? "percentage" : isFixedAmount ? "fixed_amount" : "free_shipping",
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

/**
 * Dummy free gift product for preview when no product is selected
 */
const DUMMY_FREE_GIFT_PRODUCT = {
  productId: "preview-free-gift-product",
  variantId: "preview-free-gift-variant",
  productTitle: "Premium Gift Box",
  productImageUrl:
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80",
  quantity: 1,
  minSubtotalCents: 5000, // $50 minimum
};

const PRODUCT_UPSELL_PREVIEW_PRODUCTS = [
  {
    id: "preview-hoodie",
    title: "Premium Fleece Hoodie",
    price: "79.00",
    compareAtPrice: "99.00",
    imageUrl:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
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
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
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
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
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
  component: ComponentType<
    { config: TConfig; isVisible: boolean; onClose: () => void } & Record<string, unknown>
  >;
  buildConfig: ConfigBuilder<TConfig>;
}

/**
 * Build common config properties shared across all templates
 */
function buildCommonConfig(
  mergedConfig: Partial<PopupDesignConfig>,
  designConfig: Partial<PopupDesignConfig>
) {
  const result = {
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
    backgroundImageMode:
      mergedConfig.backgroundImageMode || designConfig.backgroundImageMode || "none",
    backgroundOverlayOpacity:
      mergedConfig.backgroundOverlayOpacity ?? designConfig.backgroundOverlayOpacity ?? 0.6,

    // Scratch Card specific design properties
    scratchCardBackgroundColor:
      mergedConfig.scratchCardBackgroundColor || designConfig.scratchCardBackgroundColor,
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
    displayMode: (mergedConfig.displayMode || designConfig.displayMode || "popup") as
      | "popup"
      | "banner",

    // Mobile-specific settings
    mobileFullScreen: mergedConfig.mobileFullScreen ?? designConfig.mobileFullScreen,
  };

  return result;
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
    ): NewsletterConfig => {
      // DEBUG: Log leadCaptureLayout sources
      console.log(
        "[NEWSLETTER buildConfig] mergedConfig.leadCaptureLayout:",
        mergedConfig.leadCaptureLayout
      );
      console.log(
        "[NEWSLETTER buildConfig] designConfig.leadCaptureLayout:",
        designConfig.leadCaptureLayout
      );
      return {
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

        // Spa Serenity features (Phase C)
        tagText: mergedConfig.tagText,
        tagIcon: mergedConfig.tagIcon,
        imageBadgeEnabled: mergedConfig.imageBadgeEnabled ?? false,
        imageBadgeIcon: mergedConfig.imageBadgeIcon,
        imageBadgeTitle: mergedConfig.imageBadgeTitle,
        imageBadgeValue: mergedConfig.imageBadgeValue,
        footerText: mergedConfig.footerText,
        successBadgeText: mergedConfig.successBadgeText,
        successBadgeIcon: mergedConfig.successBadgeIcon,

        // Discount: transform admin config to storefront format
        discount:
          transformDiscountConfig(mergedConfig.discountConfig, "WELCOME") || mergedConfig.discount,
        discountCodeLabel: mergedConfig.discountCodeLabel || "Your discount code:",

        // All common config (colors, typography, layout, image settings)
        ...buildCommonConfig(mergedConfig, designConfig),

        // Explicitly pass leadCaptureLayout to ensure it's not lost in the spread
        // This is needed because buildCommonConfig may not receive it correctly from mergedConfig
        leadCaptureLayout: mergedConfig.leadCaptureLayout || designConfig.leadCaptureLayout,
      };
    },
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
      // For tiered discounts, BOGO, or free gift - don't use the 50% fallback
      // Let PromotionDisplay handle the advanced discount visualization
      const hasTiers = dc?.tiers && dc.tiers.length > 0;
      const hasBogo = !!dc?.bogo;
      const hasFreeGift = !!dc?.freeGift;
      const hasAdvancedDiscount = hasTiers || hasBogo || hasFreeGift;
      const discountPercentage = hasAdvancedDiscount
        ? undefined // Don't set a percentage for advanced discount types
        : storefrontDiscount?.percentage ?? mergedConfig.discountPercentage ?? 50;

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

        // CTA configuration (new unified system)
        cta: mergedConfig.cta,
        secondaryCta: mergedConfig.secondaryCta,

        // Storefront-specific
        ctaOpenInNewTab: mergedConfig.ctaOpenInNewTab ?? false,

        // Discount: keep original for legacy compatibility, add transformed version
        // Inject dummy product for free gift preview when no product is selected
        discountConfig: dc?.freeGift
          ? {
              ...dc,
              freeGift: {
                ...DUMMY_FREE_GIFT_PRODUCT,
                ...dc.freeGift,
                // Ensure we have product display data for preview
                productTitle: dc.freeGift.productTitle || DUMMY_FREE_GIFT_PRODUCT.productTitle,
                productImageUrl: dc.freeGift.productImageUrl || DUMMY_FREE_GIFT_PRODUCT.productImageUrl,
              },
            }
          : (dc as FlashSaleConfig["discountConfig"]),
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

      const stockCount = mergedConfig.stockCount ?? mergedConfig.inventory?.pseudoMax ?? undefined;

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
    ): SocialProofConfig => ({
      id: "preview-social-proof",

      // Base content fields
      headline: mergedConfig.headline || "Join Thousands of Happy Customers",
      subheadline: mergedConfig.subheadline,
      buttonText: mergedConfig.buttonText || "Shop Now",
      successMessage: mergedConfig.successMessage || "Success!",
      failureMessage: mergedConfig.failureMessage,
      ctaText: mergedConfig.ctaText,

      // SocialProof-specific fields - Core (Tier 1)
      enablePurchaseNotifications: mergedConfig.enablePurchaseNotifications ?? true,
      enableVisitorNotifications: mergedConfig.enableVisitorNotifications ?? false,
      enableReviewNotifications: mergedConfig.enableReviewNotifications ?? false,

      // SocialProof-specific fields - Additional (Tier 2)
      enableSalesCountNotifications: mergedConfig.enableSalesCountNotifications ?? false,
      enableLowStockAlerts: mergedConfig.enableLowStockAlerts ?? false,
      enableTrendingNotifications: mergedConfig.enableTrendingNotifications ?? false,
      enableCartActivityNotifications: mergedConfig.enableCartActivityNotifications ?? false,
      enableRecentlyViewedNotifications: mergedConfig.enableRecentlyViewedNotifications ?? false,

      // Message templates
      purchaseMessageTemplate: mergedConfig.purchaseMessageTemplate,
      visitorMessageTemplate: mergedConfig.visitorMessageTemplate,
      reviewMessageTemplate: mergedConfig.reviewMessageTemplate,
      cornerPosition: mergedConfig.cornerPosition || "bottom-left",
      displayDuration: mergedConfig.displayDuration ?? 6,
      rotationInterval: mergedConfig.rotationInterval ?? 8,
      maxNotificationsPerSession: mergedConfig.maxNotificationsPerSession ?? 5,
      minVisitorCount: mergedConfig.minVisitorCount,
      minReviewRating: mergedConfig.minReviewRating,
      lowStockThreshold: mergedConfig.lowStockThreshold ?? 10,
      purchaseLookbackHours: mergedConfig.purchaseLookbackHours ?? 48,
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
    ): SpinToWinConfig => ({
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

      // Enhanced wheel styling (premium themes)
      wheelGlowEnabled: mergedConfig.wheelGlowEnabled ?? false,
      wheelGlowColor: mergedConfig.wheelGlowColor,
      wheelCenterStyle: mergedConfig.wheelCenterStyle ?? "simple",

      // Promotional badge
      badgeEnabled: mergedConfig.badgeEnabled ?? false,
      badgeText: mergedConfig.badgeText,
      badgeIcon: mergedConfig.badgeIcon,

      // Result state customization
      showResultIcon: mergedConfig.showResultIcon ?? false,
      resultIconType: mergedConfig.resultIconType ?? "trophy",

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
    ): ScratchCardConfig => ({
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
    mergedConfig: Partial<ProductUpsellConfig> & { discountConfig?: Partial<AdminDiscountConfig> },
    designConfig: Partial<PopupDesignConfig>
  ): ProductUpsellConfig => {
    // Extract tiered discount config if present
    const dc = mergedConfig.discountConfig;
    const bundleValue =
      dc?.strategy === "bundle" && typeof dc?.value === "number" ? dc.value : 15;
    const discountConfig: AdminDiscountConfig | undefined = dc
      ? {
          enabled: dc.enabled !== false,
          strategy:
            dc.strategy ||
            (dc.tiers?.length
              ? "tiered"
              : dc.bogo
                ? "bogo"
                : dc.freeGift
                  ? "free_gift"
                  : "bundle"),
          valueType: dc.valueType || "PERCENTAGE",
          value:
            typeof dc.value === "number"
              ? dc.value
              : dc.valueType === "FREE_SHIPPING"
                ? undefined
                : bundleValue,
          behavior: dc.behavior || "SHOW_CODE_AND_AUTO_APPLY",
          applicability:
            dc.applicability ||
            (dc.strategy === "bundle" ? { scope: "products" } : undefined),
          tiers: dc.tiers,
          bogo: dc.bogo,
          freeGift: dc.freeGift,
        }
      : {
          enabled: true,
          strategy: "bundle",
          valueType: "PERCENTAGE",
          value: bundleValue,
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
          applicability: { scope: "products" },
        };

    return {
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
      showPrices: mergedConfig.showPrices ?? true,
      showCompareAtPrice: mergedConfig.showCompareAtPrice ?? true,
      showImages: mergedConfig.showImages ?? true,
      showRatings: mergedConfig.showRatings ?? false,
      showReviewCount: mergedConfig.showReviewCount ?? false,
      bundleDiscount: bundleValue,
      bundleDiscountText: mergedConfig.bundleDiscountText ?? dc?.description,
      multiSelect: mergedConfig.multiSelect ?? true,
      secondaryCtaLabel: mergedConfig.secondaryCtaLabel,
      currency: mergedConfig.currency || "USD",

      // Premium Fullscreen layout specific fields
      features: mergedConfig.features,
      urgencyMessage: mergedConfig.urgencyMessage,

      // Countdown Urgency layout specific fields
      expiresInSeconds: mergedConfig.expiresInSeconds ?? 300,
      socialProofMessage: mergedConfig.socialProofMessage,

      // Bundle Deal layout specific fields
      bundleHeaderText: mergedConfig.bundleHeaderText,
      bundleSubheaderText: mergedConfig.bundleSubheaderText,

      // Tiered discount configuration (for spend more, save more)
      discountConfig: discountConfig as ProductUpsellConfig["discountConfig"],

      // All common config (colors, typography, layout)
      ...buildCommonConfig(mergedConfig, designConfig),
    };
  },
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.ANNOUNCEMENT] = {
  component: AnnouncementPopup,
  buildConfig: (
    mergedConfig: Partial<AnnouncementConfig>,
    designConfig: Partial<PopupDesignConfig>
  ): AnnouncementConfig => ({
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
  ): FreeShippingConfig => ({
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
    discount:
      transformDiscountConfig(mergedConfig.discountConfig, "FREESHIP") || mergedConfig.discount,

    // All common config (colors, typography, layout)
    ...buildCommonConfig(mergedConfig, designConfig),
  }),
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.CART_ABANDONMENT] = {
  component: CartAbandonmentPopup,
  buildConfig: (
    mergedConfig: Partial<CartAbandonmentConfig> & {
      discountConfig?: Partial<AdminDiscountConfig>;
    },
    designConfig: Partial<PopupDesignConfig>
  ): CartAbandonmentConfig => ({
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

// =============================================================================
// NEW UPSELL POPUP VARIANTS
// =============================================================================

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.CLASSIC_UPSELL] = {
  component: ClassicUpsellPopup,
  buildConfig: (
    mergedConfig: Record<string, unknown>,
    designConfig: Partial<PopupDesignConfig>
  ): ClassicUpsellConfig => ({
    id: "preview-classic-upsell",
    productSelectionMethod:
      (mergedConfig.productSelectionMethod as "ai" | "manual" | "collection") || "manual",
    headline: (mergedConfig.headline as string) || "You might also like",
    subheadline: (mergedConfig.subheadline as string) || "Customers who bought this also loved",
    buttonText: (mergedConfig.buttonText as string) || "Add to Cart",
    secondaryCtaLabel: (mergedConfig.secondaryCtaLabel as string) || "No thanks",
    successMessage: (mergedConfig.successMessage as string) || "Added to cart!",
    showPrices: (mergedConfig.showPrices as boolean) ?? true,
    showCompareAtPrice: (mergedConfig.showCompareAtPrice as boolean) ?? true,
    showImages: (mergedConfig.showImages as boolean) ?? true,
    showRatings: (mergedConfig.showRatings as boolean) ?? true,
    bundleDiscount: (mergedConfig.bundleDiscount as number) ?? 15,
    bundleDiscountText: (mergedConfig.bundleDiscountText as string) || undefined,
    currency: (mergedConfig.currency as string) || "USD",
    products:
      (mergedConfig.products as typeof PRODUCT_UPSELL_PREVIEW_PRODUCTS) ||
      PRODUCT_UPSELL_PREVIEW_PRODUCTS.slice(0, 1),
    ...buildCommonConfig(mergedConfig, designConfig),
    // Neutral color overrides for upsell templates
    buttonColor: (mergedConfig.buttonColor as string) || designConfig.buttonColor || "#1A1A1A",
    accentColor: (mergedConfig.accentColor as string) || designConfig.accentColor || "#1A1A1A",
  }),
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.MINIMAL_SLIDE_UP] = {
  component: MinimalSlideUpPopup,
  buildConfig: (
    mergedConfig: Record<string, unknown>,
    designConfig: Partial<PopupDesignConfig>
  ): MinimalSlideUpConfig => ({
    id: "preview-minimal-slide-up",
    productSelectionMethod:
      (mergedConfig.productSelectionMethod as "ai" | "manual" | "collection") || "ai",
    headline: (mergedConfig.headline as string) || "Add this to your order?",
    subheadline: (mergedConfig.subheadline as string) || "Special offer for you",
    buttonText: (mergedConfig.buttonText as string) || "Add",
    secondaryCtaLabel: (mergedConfig.secondaryCtaLabel as string) || "Continue shopping",
    successMessage: (mergedConfig.successMessage as string) || "Added!",
    showPrices: (mergedConfig.showPrices as boolean) ?? true,
    showCompareAtPrice: (mergedConfig.showCompareAtPrice as boolean) ?? true,
    showImages: (mergedConfig.showImages as boolean) ?? true,
    currency: (mergedConfig.currency as string) || "USD",
    products:
      (mergedConfig.products as typeof PRODUCT_UPSELL_PREVIEW_PRODUCTS) ||
      PRODUCT_UPSELL_PREVIEW_PRODUCTS.slice(0, 1),
    ...buildCommonConfig(mergedConfig, designConfig),
    // Neutral color overrides for upsell templates
    buttonColor: (mergedConfig.buttonColor as string) || designConfig.buttonColor || "#1A1A1A",
    accentColor: (mergedConfig.accentColor as string) || designConfig.accentColor || "#1A1A1A",
  }),
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.PREMIUM_FULLSCREEN] = {
  component: PremiumFullscreenPopup,
  buildConfig: (
    mergedConfig: Record<string, unknown>,
    designConfig: Partial<PopupDesignConfig>
  ): PremiumFullscreenConfig => ({
    id: "preview-premium-fullscreen",
    productSelectionMethod:
      (mergedConfig.productSelectionMethod as "ai" | "manual" | "collection") || "manual",
    headline: (mergedConfig.headline as string) || "Exclusive Offer",
    subheadline: (mergedConfig.subheadline as string) || "For our valued customers",
    buttonText: (mergedConfig.buttonText as string) || "Claim This Offer",
    secondaryCtaLabel: (mergedConfig.secondaryCtaLabel as string) || "Maybe later",
    successMessage: (mergedConfig.successMessage as string) || "Added to cart!",
    showPrices: (mergedConfig.showPrices as boolean) ?? true,
    showCompareAtPrice: (mergedConfig.showCompareAtPrice as boolean) ?? true,
    showImages: (mergedConfig.showImages as boolean) ?? true,
    showRatings: (mergedConfig.showRatings as boolean) ?? true,
    showReviewCount: (mergedConfig.showReviewCount as boolean) ?? true,
    bundleDiscount: (mergedConfig.bundleDiscount as number) ?? 20,
    currency: (mergedConfig.currency as string) || "USD",
    features: (mergedConfig.features as string[]) || [
      "Premium Quality",
      "Fast Shipping",
      "30-Day Returns",
    ],
    urgencyMessage: (mergedConfig.urgencyMessage as string) || "Limited time offer",
    products:
      (mergedConfig.products as typeof PRODUCT_UPSELL_PREVIEW_PRODUCTS) ||
      PRODUCT_UPSELL_PREVIEW_PRODUCTS.slice(0, 1),
    ...buildCommonConfig(mergedConfig, designConfig),
    // Neutral color overrides for upsell templates
    buttonColor: (mergedConfig.buttonColor as string) || designConfig.buttonColor || "#1A1A1A",
    accentColor: (mergedConfig.accentColor as string) || designConfig.accentColor || "#1A1A1A",
  }),
};

TEMPLATE_PREVIEW_REGISTRY[TemplateTypeEnum.COUNTDOWN_URGENCY] = {
  component: CountdownUrgencyPopup,
  buildConfig: (
    mergedConfig: Record<string, unknown>,
    designConfig: Partial<PopupDesignConfig>
  ): CountdownUrgencyConfig => ({
    id: "preview-countdown-urgency",
    productSelectionMethod:
      (mergedConfig.productSelectionMethod as "ai" | "manual" | "collection") || "manual",
    headline: (mergedConfig.headline as string) || "Flash Deal!",
    subheadline: (mergedConfig.subheadline as string) || "Offer expires soon",
    buttonText: (mergedConfig.buttonText as string) || "Claim Now",
    secondaryCtaLabel: (mergedConfig.secondaryCtaLabel as string) || "No thanks",
    successMessage: (mergedConfig.successMessage as string) || "Deal claimed!",
    showPrices: (mergedConfig.showPrices as boolean) ?? true,
    showCompareAtPrice: (mergedConfig.showCompareAtPrice as boolean) ?? true,
    showImages: (mergedConfig.showImages as boolean) ?? true,
    bundleDiscount: (mergedConfig.bundleDiscount as number) ?? 25,
    bundleDiscountText: (mergedConfig.bundleDiscountText as string) || undefined,
    currency: (mergedConfig.currency as string) || "USD",
    expiresInSeconds: (mergedConfig.expiresInSeconds as number) ?? 300,
    socialProofMessage:
      (mergedConfig.socialProofMessage as string) || "12 people viewing this deal",
    products:
      (mergedConfig.products as typeof PRODUCT_UPSELL_PREVIEW_PRODUCTS) ||
      PRODUCT_UPSELL_PREVIEW_PRODUCTS.slice(0, 1),
    ...buildCommonConfig(mergedConfig, designConfig),
    // Neutral color overrides for upsell templates
    buttonColor: (mergedConfig.buttonColor as string) || designConfig.buttonColor || "#1A1A1A",
    accentColor: (mergedConfig.accentColor as string) || designConfig.accentColor || "#1A1A1A",
  }),
};

/**
 * Get preview component and config builder for template type
 */
export function getTemplatePreviewEntry(templateType: string): TemplatePreviewEntry | null {
  return TEMPLATE_PREVIEW_REGISTRY[templateType] || null;
}
