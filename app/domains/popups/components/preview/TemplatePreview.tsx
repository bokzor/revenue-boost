/**
 * TemplatePreview Component
 *
 * Renders the appropriate template component based on templateType.
 * Uses actual template components for accurate WYSIWYG preview.
 */

import React, {
  useCallback,
  useMemo,
  memo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
// Import NEW popup components
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

// Import types
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
  Product,
} from "~/domains/storefront/popups-new";

import { TemplateTypeEnum } from "~/lib/template-types.enum";

export interface TemplatePreviewProps {
  templateType?: string;
  config: Record<string, any>;
  designConfig: Record<string, any>;
  onPreviewElementReady?: (element: HTMLElement | null) => void;
}

export interface TemplatePreviewRef {
  getPreviewElement: () => HTMLElement | null;
}

const TemplatePreviewComponent = forwardRef<
  TemplatePreviewRef,
  TemplatePreviewProps
>(({ templateType, config, designConfig, onPreviewElementReady }, ref) => {
  // Always call all hooks in the same order - no early returns before hooks!
  const previewElementRef = useRef<HTMLElement | null>(null);
  const renderCount = useRef(0);

  // Increment render count for debugging
  renderCount.current += 1;

  // Expose methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      getPreviewElement: () => previewElementRef.current,
    }),
    [],
  );

  // Callback to set the preview element ref
  const setPreviewElementRef = useCallback(
    (element: HTMLElement | null) => {
      previewElementRef.current = element;
      onPreviewElementReady?.(element);
    },
    [onPreviewElementReady],
  );

  // Memoize merged config to prevent re-renders with more stable dependencies
  const mergedConfig: Record<string, any> = useMemo(() => {
    if (!templateType) {
      return { ...config, ...designConfig };
    }

    // For newsletter templates, ensure discount config is properly merged
    const baseConfig = {
      ...config,
      ...designConfig,
      // Ensure popup is visible in preview
      isVisible: true,
      // Enable preview mode to prevent fixed positioning
      previewMode: true,
    };

    // If this is a newsletter template, merge discount configuration
    if (templateType.includes("newsletter")) {
      const result = {
        ...baseConfig,
        // Enable discount by default for newsletter templates
        discountEnabled:
          config.discountEnabled ?? designConfig.discountEnabled ?? true,
        // Provide discount code for template interpolation
        discountCode:
          config.discountCode || designConfig.discountCode || "WELCOME10",
        discountValue:
          config.discountValue ??
          designConfig.discountValue ??
          config.discountPercentage ??
          10,
        discountType:
          config.discountType || designConfig.discountType || "percentage",
      };
      return result;
    }

    return baseConfig;
  }, [config, designConfig, templateType]);

  // Memoize handlers to prevent re-renders
  const handleClose = useCallback(() => {
    // Preview mode - no actual close action needed
  }, []);

  const handleButtonClick = useCallback(() => {
    // Preview mode - no actual click action needed
  }, []);

  const handleAddToCart = useCallback(async () => {
    // Preview mode - no actual add to cart action needed
  }, []);

  // Create reliable inline SVG placeholder
  const createPlaceholderSVG = useCallback(
    (width = 150, height = 150, text = "Product") => {
      const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f8f9fa"/>
      <rect x="${width * 0.2}" y="${height * 0.15}" width="${width * 0.6}" height="${height * 0.5}" fill="#e9ecef" stroke="#dee2e6" stroke-width="1"/>
      <rect x="${width * 0.25}" y="${height * 0.2}" width="${width * 0.5}" height="${height * 0.4}" fill="#ffffff" stroke="#dee2e6" stroke-width="1"/>
      <circle cx="${width * 0.5}" cy="${height * 0.4}" r="${width * 0.08}" fill="#6c757d"/>
      <path d="M${width * 0.45} ${height * 0.42} L${width * 0.48} ${height * 0.45} L${width * 0.55} ${height * 0.38}" stroke="#ffffff" stroke-width="2" fill="none"/>
      <text x="${width * 0.5}" y="${height * 0.75}" text-anchor="middle" fill="#6c757d" font-family="Arial, sans-serif" font-size="${Math.max(10, width * 0.08)}">
        ${text}
      </text>
      <text x="${width * 0.5}" y="${height * 0.85}" text-anchor="middle" fill="#adb5bd" font-family="Arial, sans-serif" font-size="${Math.max(8, width * 0.06)}">
        Preview
      </text>
    </svg>`;

      return `data:image/svg+xml;base64,${btoa(svg)}`;
    },
    [],
  );

  // Memoize mock products to prevent re-renders with reliable image URLs
  const mockProducts = useMemo(
    () => [
      {
        id: "1",
        title: "Stylish T-Shirt",
        price: "29.99",
        compareAtPrice: "39.99",
        imageUrl: createPlaceholderSVG(150, 150, "T-Shirt"),
        variantId: "variant-1",
        handle: "product-1",
      },
      {
        id: "2",
        title: "Cozy Sweater",
        price: "34.99",
        compareAtPrice: "44.99",
        imageUrl: createPlaceholderSVG(150, 150, "Sweater"),
        variantId: "variant-2",
        handle: "product-2",
      },
      {
        id: "3",
        title: "Classic Jeans",
        price: "24.99",
        imageUrl: createPlaceholderSVG(150, 150, "Jeans"),
        variantId: "variant-3",
        handle: "product-3",
      },
    ],
    [createPlaceholderSVG],
  );

  // Note: upsellConfig removed - now created inline in each template case

  // Preview container wrapper - creates positioning context for popups
  // Uses relative positioning to stay within the content area (not covering device chrome)
  // No backdrop here - the BasePopup component handles its own backdrop
  const PreviewContainer: React.FC<{ children: React.ReactNode }> = useCallback(
    ({ children }) => (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: "100%",
        }}
      >
        {children}
      </div>
    ),
    [],
  );

  // Now handle the conditional rendering AFTER all hooks have been called
  if (!templateType) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "400px",
          backgroundColor: "#F6F6F7",
          color: "#5C5F62",
          fontSize: "14px",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <div style={{ fontWeight: 500, marginBottom: "8px" }}>
            No Template Selected
          </div>
          <div style={{ fontSize: "13px", color: "#8C9196" }}>
            Select a template to see a live preview
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate template based on templateType
  switch (templateType) {
    // Newsletter Templates
    case TemplateTypeEnum.NEWSLETTER:
      return (
        <PreviewContainer>
          <div
            ref={setPreviewElementRef}
            data-popup-preview
            style={{ display: "contents" }}
          >
            <NewsletterPopup
              config={{
                id: "preview-newsletter",
                headline: mergedConfig.headline || "Join Our Newsletter",
                subheadline: mergedConfig.subheadline || "Get exclusive offers and updates",
                buttonText: mergedConfig.buttonText || "Subscribe",
                successMessage: mergedConfig.successMessage || "Thank you for subscribing!",
                backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
                textColor: mergedConfig.textColor || "#1A1A1A",
                buttonColor: mergedConfig.buttonColor || "#007BFF",
                buttonTextColor: mergedConfig.buttonTextColor || "#FFFFFF",
                inputBackgroundColor: mergedConfig.inputBackgroundColor || "#FFFFFF",
                inputTextColor: mergedConfig.inputTextColor || "#1A1A1A",
                inputBorderColor: mergedConfig.inputBorderColor || "#D1D5DB",
                accentColor: mergedConfig.accentColor || "#007BFF",
                overlayColor: mergedConfig.overlayColor || "rgba(0, 0, 0, 1)",
                overlayOpacity: mergedConfig.overlayOpacity ?? 0.6,
                position: mergedConfig.position || "center",
                size: mergedConfig.size || "medium",
                borderRadius: mergedConfig.borderRadius || 8,
                animation: mergedConfig.animation || "fade",
                previewMode: true,
                showCloseButton: true,

                // Image settings
                imageUrl: mergedConfig.imageUrl,
                imagePosition: mergedConfig.imagePosition || "left",
                theme: mergedConfig.theme,

                // Email field
                emailPlaceholder: mergedConfig.emailPlaceholder || "Enter your email",
                emailLabel: mergedConfig.emailLabel,
                emailRequired: true,

                // Name fields
                nameFieldEnabled: mergedConfig.nameFieldEnabled || false,
                nameFieldRequired: mergedConfig.nameFieldRequired || false,
                firstNamePlaceholder: mergedConfig.firstNamePlaceholder || "First name",
                lastNamePlaceholder: mergedConfig.lastNamePlaceholder || "Last name",

                // Consent
                consentFieldEnabled: mergedConfig.consentFieldEnabled || false,
                consentFieldRequired: mergedConfig.consentFieldRequired || false,
                consentFieldText: mergedConfig.consentFieldText || "I agree to receive marketing emails",

                // Discount
                discount: mergedConfig.discountEnabled ? {
                  enabled: true,
                  code: mergedConfig.discountCode || "WELCOME10",
                  percentage: mergedConfig.discountValue || 10,
                  type: "percentage",
                } : undefined,

                // Messages
                submitButtonText: mergedConfig.submitButtonText || mergedConfig.buttonText || "Subscribe",
                successTitle: mergedConfig.successTitle || "Thank you for subscribing!",
                loadingText: mergedConfig.loadingText || "Subscribing...",
              } as NewsletterConfig}
              isVisible={true}
              onClose={handleClose}
            />
          </div>
        </PreviewContainer>
      );

    // Multi-Step Newsletter (using NEWSLETTER for now)
    case "MULTISTEP":
      return (
        <div
          ref={setPreviewElementRef}
          data-popup-preview
          style={{ display: "contents" }}
        >
          <NewsletterPopup
            config={{
              id: "preview-newsletter-multi",
              headline: mergedConfig.headline || "Join Our Newsletter",
              subheadline: mergedConfig.subheadline || "Get exclusive offers and updates",
              buttonText: mergedConfig.buttonText || "Subscribe",
              successMessage:
                mergedConfig.successMessage ||
                "Thanks for subscribing! Check your inbox for a confirmation email.",
              backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
              textColor: mergedConfig.textColor || "#111827",
              buttonColor: mergedConfig.buttonColor || "#3B82F6",
              buttonTextColor: mergedConfig.buttonTextColor || "#FFFFFF",
              accentColor: mergedConfig.accentColor || "#3B82F6",
              inputBackgroundColor: mergedConfig.inputBackgroundColor || "#F9FAFB",
              inputTextColor: mergedConfig.inputTextColor || "#111827",
              inputBorderColor: mergedConfig.inputBorderColor || "#D1D5DB",
              overlayColor: mergedConfig.overlayColor || "#000000",
              overlayOpacity: mergedConfig.overlayOpacity || 0.5,
              position: "center",
              size: "medium",
              imageUrl: mergedConfig.imageUrl,
              imagePosition: mergedConfig.imagePosition || "left",
              theme: mergedConfig.theme,
              emailPlaceholder: mergedConfig.emailPlaceholder || "Enter your email",
              emailRequired: true,
              nameFieldEnabled: false,
              nameFieldRequired: false,
              consentFieldEnabled: false,
              consentFieldRequired: false,
              submitButtonText: mergedConfig.submitButtonText || "Subscribe",
              successTitle: mergedConfig.successTitle || "Thank you for subscribing!",
            }}

            isVisible={true}
            onClose={handleClose}
          />
        </div>
      );

    // Flash Sale Modal
    case TemplateTypeEnum.FLASH_SALE:
      return (
        <PreviewContainer>
          <div
            ref={setPreviewElementRef}
            data-popup-preview
            style={{ display: "contents" }}
          >
            <FlashSalePopup
              config={{
                id: "preview-flash-sale",
                headline: mergedConfig.headline || "🔥 Flash Sale - 30% OFF!",
                subheadline: mergedConfig.subheadline || "Limited time offer - ends soon!",
                backgroundColor: mergedConfig.backgroundColor || "#FF6B6B",
                textColor: mergedConfig.textColor || "#FFFFFF",
                buttonColor: mergedConfig.buttonColor || "#FFFFFF",
                buttonTextColor: mergedConfig.buttonTextColor || "#FF6B6B",
                accentColor: mergedConfig.accentColor || "rgba(255, 255, 255, 0.1)",
                position: mergedConfig.position || "center",
                size: mergedConfig.size || "medium",
                borderRadius: mergedConfig.borderRadius || 8,
                animation: mergedConfig.animation || "fade",
                previewMode: true,

                // Discount
                discountPercentage: mergedConfig.discountPercentage || 30,
                discountValue: mergedConfig.discountValue,
                discountType: mergedConfig.discountType || "percentage",
                originalPrice: mergedConfig.originalPrice,
                salePrice: mergedConfig.salePrice,

                // Countdown timer
                showCountdown: mergedConfig.showCountdown !== false,
                countdownDuration: mergedConfig.countdownDuration || 7200, // 2 hours in seconds
                hideOnExpiry: mergedConfig.hideOnExpiry !== false,

                // Stock counter
                showStockCounter: mergedConfig.showStockCounter || false,
                stockCount: mergedConfig.stockCount || 47,

                // Urgency message
                urgencyMessage: mergedConfig.urgencyMessage || "Hurry! Sale ends in:",

                // CTA
                ctaUrl: mergedConfig.ctaUrl || "/collections/sale",
                buttonText: mergedConfig.buttonText || mergedConfig.ctaText || "Shop Now",
              } as FlashSaleConfig}
              isVisible={true}
              onClose={handleClose}
            />
          </div>
        </PreviewContainer>
      );

    // Countdown Timer Banner
    case TemplateTypeEnum.COUNTDOWN_TIMER:
      return (
        <div
          ref={setPreviewElementRef}
          data-popup-preview
          style={{ display: "contents" }}
        >
          <CountdownTimerPopup
            config={{
              id: "preview-countdown",
              headline: mergedConfig.headline || "⏰ Flash Sale Ends Soon!",
              backgroundColor: mergedConfig.backgroundColor || "#222222",
              textColor: mergedConfig.textColor || "#FFFFFF",
              buttonColor: mergedConfig.buttonColor || "#FFD700",
              buttonTextColor: mergedConfig.buttonTextColor || "#000000",
              position: mergedConfig.position || "top",
              size: mergedConfig.size || "small",
              borderRadius: mergedConfig.borderRadius || 6,
              previewMode: true,

              // Timer
              countdownDuration: mergedConfig.countdownDuration || 14400, // 4 hours in seconds
              hideOnExpiry: mergedConfig.hideOnExpiry !== false,

              // Stock counter
              showStockCounter: mergedConfig.showStockCounter || false,
              stockCount: mergedConfig.stockCount || 127,

              // Banner specific
              sticky: mergedConfig.sticky !== false,

              // CTA
              ctaUrl: mergedConfig.ctaUrl || "/collections/sale",
              buttonText: mergedConfig.buttonText || mergedConfig.ctaText || "Shop Sale",

              // Color scheme
              colorScheme: mergedConfig.colorScheme || "custom",
            } as CountdownTimerConfig}
            isVisible={true}
            onClose={handleClose}
          />
        </div>
      );

    // Social Proof
    case TemplateTypeEnum.SOCIAL_PROOF:
      return (
        <div
          ref={setPreviewElementRef}
          data-popup-preview
          style={{ display: "contents" }}
        >
          <SocialProofPopup
            config={{
              id: "preview-social-proof",
              headline: mergedConfig.headline || "Social Proof",
              backgroundColor: mergedConfig.backgroundColor || "#111827",
              textColor: mergedConfig.textColor || "#F3F4F6",
              buttonColor: mergedConfig.buttonColor || "#FFFFFF",
              buttonTextColor: mergedConfig.buttonTextColor || "#111827",
              position: mergedConfig.position || "bottom",
              size: mergedConfig.size || "small",
              borderRadius: mergedConfig.borderRadius || 8,
              previewMode: true,

              // Notification types
              enablePurchaseNotifications: mergedConfig.enablePurchaseNotifications !== false,
              enableVisitorNotifications: mergedConfig.enableVisitorNotifications || false,
              enableReviewNotifications: mergedConfig.enableReviewNotifications || false,

              // Position
              cornerPosition: mergedConfig.cornerPosition || "bottom-left",

              // Timing
              displayDuration: mergedConfig.displayDuration || 6,
              rotationInterval: mergedConfig.rotationInterval || 8,
              maxNotificationsPerSession: mergedConfig.maxNotificationsPerSession || 5,

              // Display options
              showProductImage: mergedConfig.showProductImage !== false,
              showTimer: mergedConfig.showTimer !== false,

              // Message templates
              messageTemplates: mergedConfig.messageTemplates || {
                purchase: "{{name}} from {{location}} just purchased {{product}}",
                visitor: "{{count}} people are viewing this right now",
                review: "{{name}} gave this {{rating}} stars",
              },
            } as SocialProofConfig}
            isVisible={true}
            onClose={handleClose}
            notifications={[
              {
                id: "1",
                type: "purchase",
                name: "Sarah M.",
                location: "New York, NY",
                product: "Classic T-Shirt",
                productImage: "https://via.placeholder.com/50",
                timestamp: new Date(Date.now() - 120000), // 2 minutes ago
              },
              {
                id: "2",
                type: "visitor",
                count: 47,
              },
            ]}
          />
        </div>
      );

    // Spin-to-Win
    case TemplateTypeEnum.SPIN_TO_WIN: {
      // Parse prizes if provided as JSON string
      let wheelSegments = mergedConfig.wheelSegments || mergedConfig.prizes || [];
      if (typeof wheelSegments === "string") {
        try {
          wheelSegments = JSON.parse(wheelSegments);
        } catch (_) {
          wheelSegments = [];
        }
      }

      // Ensure wheelSegments is an array with proper structure
      if (!Array.isArray(wheelSegments) || wheelSegments.length === 0) {
        // Provide default prizes for preview
        wheelSegments = [
          {
            id: "prize-10",
            label: "10% OFF",
            probability: 0.30,
            color: "#FF6B6B",
            discountType: "percentage",
            discountValue: 10,
            discountCode: "SPIN10",
          },
          {
            id: "prize-15",
            label: "15% OFF",
            probability: 0.20,
            color: "#4ECDC4",
            discountType: "percentage",
            discountValue: 15,
            discountCode: "SPIN15",
          },
          {
            id: "prize-20",
            label: "20% OFF",
            probability: 0.10,
            color: "#FFD93D",
            discountType: "percentage",
            discountValue: 20,
            discountCode: "SPIN20",
          },
          {
            id: "prize-shipping",
            label: "Free Shipping",
            probability: 0.25,
            color: "#6BCF7F",
            discountType: "free_shipping",
            discountCode: "FREESHIP",
          },
          {
            id: "prize-again",
            label: "Try Again",
            probability: 0.15,
            color: "#95A5A6",
          },
        ];
      }

      return (
        <PreviewContainer>
          <div
            ref={setPreviewElementRef}
            data-popup-preview
            style={{ display: "contents" }}
          >
            <SpinToWinPopup
              config={{
                id: "preview-spin",
                headline: mergedConfig.headline || "Spin to Win!",
                subheadline: mergedConfig.subheadline || "Try your luck for exclusive discounts",
                backgroundColor: mergedConfig.backgroundColor || "#4A90E2",
                textColor: mergedConfig.textColor || "#FFFFFF",
                buttonColor: mergedConfig.buttonColor || "#FFD700",
                buttonTextColor: mergedConfig.buttonTextColor || "#000000",
                accentColor: mergedConfig.accentColor || "#EF4444",
                position: mergedConfig.position || "center",
                size: mergedConfig.size || "large",
                borderRadius: mergedConfig.borderRadius || 8,
                animation: mergedConfig.animation || "fade",
                previewMode: true,

                // Wheel configuration
                wheelSegments,
                wheelSize: mergedConfig.wheelSize || 400,
                wheelBorderWidth: mergedConfig.wheelBorderWidth || 2,
                wheelBorderColor: mergedConfig.wheelBorderColor || "#FFFFFF",

                // Email capture
                emailRequired: mergedConfig.emailRequired !== false,
                emailPlaceholder: mergedConfig.emailPlaceholder || "Enter your email to spin",

                // Button text
                spinButtonText: mergedConfig.spinButtonText || mergedConfig.buttonText || "SPIN TO WIN!",

                // Behavior
                maxAttemptsPerUser: mergedConfig.maxAttemptsPerUser || 1,
                spinDuration: Number(mergedConfig.spinDuration) || 4000,
                minSpins: mergedConfig.minSpins || 5,

                // Messages
                successMessage: mergedConfig.successMessage || "🎉 You won {{prize}}!",
                failureMessage: mergedConfig.failureMessage || "Thanks for playing!",
                loadingText: mergedConfig.loadingText || "Spinning...",
              } as SpinToWinConfig}
              isVisible={true}
              onClose={handleClose}
              onSpin={async () => {
                // Preview mode - no actual submission
              }}
            />
          </div>
        </PreviewContainer>
      );
    }

    // Page Load triggers are now handled by the normalizer

    // Scratch Card
    case TemplateTypeEnum.SCRATCH_CARD: {
      // Parse prizes if provided as JSON string
      let prizes = mergedConfig.prizes || [];
      if (typeof prizes === "string") {
        try {
          prizes = JSON.parse(prizes);
        } catch (_) {
          prizes = [];
        }
      }

      // Provide default prizes for preview if none configured
      if (!Array.isArray(prizes) || prizes.length === 0) {
        prizes = [
          {
            id: "prize-10",
            label: "10% OFF",
            probability: 0.40,
            discountCode: "SCRATCH10",
            discountValue: 10,
            discountType: "percentage",
          },
          {
            id: "prize-15",
            label: "15% OFF",
            probability: 0.30,
            discountCode: "SCRATCH15",
            discountValue: 15,
            discountType: "percentage",
          },
          {
            id: "prize-20",
            label: "20% OFF",
            probability: 0.20,
            discountCode: "SCRATCH20",
            discountValue: 20,
            discountType: "percentage",
          },
          {
            id: "prize-shipping",
            label: "FREE SHIPPING",
            probability: 0.10,
            discountCode: "FREESHIP",
            discountType: "free_shipping",
          },
        ];
      }

      return (
        <PreviewContainer>
          <div
            ref={setPreviewElementRef}
            data-popup-preview
            style={{ display: "contents" }}
          >
            <ScratchCardPopup
              config={{
                id: "preview-scratch",
                headline: mergedConfig.headline || "Scratch & Win!",
                subheadline: mergedConfig.subheadline || "Scratch to reveal your exclusive discount",
                backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
                textColor: mergedConfig.textColor || "#1A1A1A",
                buttonColor: mergedConfig.buttonColor || "#22C55E",
                buttonTextColor: mergedConfig.buttonTextColor || "#FFFFFF",
                inputBackgroundColor: mergedConfig.inputBackgroundColor || "#FFFFFF",
                inputTextColor: mergedConfig.inputTextColor || "#1A1A1A",
                inputBorderColor: mergedConfig.inputBorderColor || "#D1D5DB",
                accentColor: mergedConfig.accentColor || "#22C55E",
                position: mergedConfig.position || "center",
                size: mergedConfig.size || "medium",
                borderRadius: mergedConfig.borderRadius || 8,
                animation: mergedConfig.animation || "fade",
                previewMode: true,

                // Prizes
                prizes,

                // Email capture
                emailRequired: mergedConfig.emailRequired !== false,
                emailBeforeScratching: mergedConfig.emailBeforeScratching !== false,
                emailPlaceholder: mergedConfig.emailPlaceholder || "Enter your email",

                // Scratch card appearance
                scratchCardWidth: mergedConfig.scratchCardWidth || 300,
                scratchCardHeight: mergedConfig.scratchCardHeight || 200,
                scratchCardBackgroundColor: mergedConfig.scratchCardBackgroundColor || "#FFFFFF",
                scratchCardTextColor: mergedConfig.scratchCardTextColor || "#22C55E",
                scratchOverlayColor: mergedConfig.scratchOverlayColor || "#C0C0C0",

                // Scratch behavior
                scratchThreshold: mergedConfig.scratchThreshold || 50,
                scratchRadius: mergedConfig.scratchRadius || 20,

                // Instructions
                scratchInstruction: mergedConfig.scratchInstruction || "Scratch to reveal!",

                // Messages
                successMessage: mergedConfig.successMessage || "Congratulations! Your discount code:",
                buttonText: mergedConfig.buttonText || "Continue",
              } as ScratchCardConfig}
              isVisible={true}
              onClose={handleClose}
              onSubmit={async () => {
                // Preview mode - no actual submission
              }}
            />
          </div>
        </PreviewContainer>
      );
    }

    // Product Upsell
    case TemplateTypeEnum.PRODUCT_UPSELL:
    case "upsell-template":
      return (
        <PreviewContainer>
          <div
            ref={setPreviewElementRef}
            data-popup-preview
            style={{ display: "contents" }}
          >
            <ProductUpsellPopup
              config={{
                id: "preview-upsell",
                headline: mergedConfig.headline || "Complete Your Order & Save 15%",
                subheadline: mergedConfig.subheadline || "These items pair perfectly together",
                backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
                textColor: mergedConfig.textColor || "#1A1A1A",
                buttonColor: mergedConfig.buttonColor || "#0EA5E9",
                buttonTextColor: mergedConfig.buttonTextColor || "#FFFFFF",
                inputBorderColor: mergedConfig.inputBorderColor || "#E5E7EB",
                accentColor: mergedConfig.accentColor || "#0EA5E9",
                position: mergedConfig.position || "center",
                size: mergedConfig.size || "medium",
                borderRadius: mergedConfig.borderRadius || 8,
                animation: mergedConfig.animation || "fade",
                previewMode: true,

                // Display options
                layout: mergedConfig.layout || "grid",
                columns: mergedConfig.columns || 2,
                showPrices: mergedConfig.showPrices !== false,
                showCompareAtPrice: mergedConfig.showCompareAtPrice !== false,
                showImages: mergedConfig.showImages !== false,
                showRatings: mergedConfig.showRatings || false,
                showReviewCount: mergedConfig.showReviewCount || false,

                // Bundle discount
                bundleDiscount: mergedConfig.bundleDiscount || 15,
                bundleDiscountText: mergedConfig.bundleDiscountText || "Save 15% when you buy together!",

                // Behavior
                multiSelect: mergedConfig.multiSelect !== false,

                // CTA
                buttonText: mergedConfig.buttonText || mergedConfig.ctaText || "Add to Cart",
                secondaryCtaLabel: mergedConfig.secondaryCtaLabel || "No thanks",

                // Currency
                currency: mergedConfig.currency || "USD",
              } as ProductUpsellConfig}
              isVisible={true}
              onClose={handleClose}
              products={mockProducts.slice(0, 3)}
              onAddToCart={async () => {
                // Preview mode - no actual submission
              }}
            />
          </div>
        </PreviewContainer>
      );

    // Announcement Banner
    case TemplateTypeEnum.ANNOUNCEMENT:
      return (
        <div
          ref={setPreviewElementRef}
          data-popup-preview
          style={{ display: "contents" }}
        >
          <AnnouncementPopup
            config={{
              id: "preview-announcement",
              headline: mergedConfig.headline || mergedConfig.message || "🎉 Flash Sale: 25% OFF Everything - Today Only!",
              subheadline: mergedConfig.subheadline,
              backgroundColor: mergedConfig.backgroundColor || "#DC2626",
              textColor: mergedConfig.textColor || "#FFFFFF",
              buttonColor: mergedConfig.buttonColor || "#FFFFFF",
              buttonTextColor: mergedConfig.buttonTextColor || "#DC2626",
              position: mergedConfig.position || "top",
              size: mergedConfig.size || "small",
              borderRadius: mergedConfig.borderRadius || 6,
              previewMode: true,

              // Banner specific
              sticky: mergedConfig.sticky !== false,

              // Icon
              icon: mergedConfig.icon,

              // CTA
              ctaUrl: mergedConfig.ctaUrl || "/collections/sale",
              buttonText: mergedConfig.buttonText || mergedConfig.ctaText || "Shop Now",
              ctaOpenInNewTab: mergedConfig.ctaOpenInNewTab || false,

              // Color scheme
              colorScheme: mergedConfig.colorScheme || "custom",
            } as AnnouncementConfig}
            isVisible={true}
            onClose={handleClose}
          />
        </div>
      );

    // Free Shipping Threshold
    case TemplateTypeEnum.FREE_SHIPPING:
      return (
        <PreviewContainer>
          <div
            ref={setPreviewElementRef}
            data-popup-preview
            style={{ display: "contents" }}
          >
            <FreeShippingPopup
              config={{
                id: "preview-free-shipping",
                headline: mergedConfig.headline || "Free Shipping Progress",
                subheadline: mergedConfig.subheadline,
                backgroundColor: mergedConfig.backgroundColor || "#DCFCE7",
                textColor: mergedConfig.textColor || "#14532D",
                buttonColor: mergedConfig.buttonColor || "#10B981",
                buttonTextColor: mergedConfig.buttonTextColor || "#FFFFFF",
                inputBorderColor: mergedConfig.inputBorderColor || "#E5E7EB",
                accentColor: mergedConfig.accentColor || "#10B981",
                position: mergedConfig.position || "top",
                size: mergedConfig.size || "small",
                borderRadius: mergedConfig.borderRadius || 8,
                previewMode: true,

                // Threshold
                freeShippingThreshold: mergedConfig.freeShippingThreshold || 75,
                currentCartTotal: 30,

                // Currency
                currency: mergedConfig.currency || "USD",

                // Messages
                initialMessage: mergedConfig.initialMessage || "Add {{remaining}} more for FREE SHIPPING! 🚚",
                progressMessage: mergedConfig.progressMessage || "You're {{percentage}}% there!",
                successTitle: mergedConfig.successTitle || "You unlocked FREE SHIPPING! 🎉",
                successSubhead: mergedConfig.successSubhead,

                // Progress bar
                showProgress: mergedConfig.showProgress !== false,
                progressColor: mergedConfig.progressColor || mergedConfig.accentColor || "#10B981",

                // Display
                displayStyle: mergedConfig.displayStyle || (
                  mergedConfig.position === "top" ? "banner" :
                  mergedConfig.position === "bottom" ? "sticky" :
                  "modal"
                ),
                autoHide: mergedConfig.autoHide || false,
                hideDelay: mergedConfig.hideDelay || 3,
              } as FreeShippingConfig}
              isVisible={true}
              onClose={handleClose}
              cartTotal={30}
            />
          </div>
        </PreviewContainer>
      );

    // Cart Abandonment
    case TemplateTypeEnum.CART_ABANDONMENT:
      return (
        <PreviewContainer>
          <div
            ref={setPreviewElementRef}
            data-popup-preview
            style={{ display: "contents" }}
          >
            <CartAbandonmentPopup
              config={{
                id: "preview-cart-abandonment",
                headline: mergedConfig.headline || "You left something behind",
                subheadline: mergedConfig.subheadline || "Complete your purchase before it's gone",
                backgroundColor: mergedConfig.backgroundColor || "#FFF7ED",
                textColor: mergedConfig.textColor || "#7C2D12",
                buttonColor: mergedConfig.buttonColor || "#EA580C",
                buttonTextColor: mergedConfig.buttonTextColor || "#FFFFFF",
                inputBorderColor: mergedConfig.inputBorderColor || "#E5E7EB",
                accentColor: mergedConfig.accentColor || "#FEF3C7",
                position: mergedConfig.position || "center",
                size: mergedConfig.size || "medium",
                borderRadius: mergedConfig.borderRadius || 8,
                animation: mergedConfig.animation || "fade",
                previewMode: true,

                // Cart display
                showCartItems: mergedConfig.showCartItems !== false,
                maxItemsToShow: mergedConfig.maxItemsToShow || 3,
                showCartTotal: mergedConfig.showCartTotal !== false,

                // Discount
                discount: mergedConfig.discountEnabled ? {
                  enabled: true,
                  code: mergedConfig.discountCode || "CART10",
                  percentage: mergedConfig.discountValue || 10,
                  type: "percentage",
                } : undefined,

                // Urgency
                showUrgency: mergedConfig.showUrgency !== false,
                urgencyTimer: mergedConfig.urgencyTimer || 300, // 5 minutes
                urgencyMessage: mergedConfig.urgencyMessage || "Complete your order in {{time}} to save 10%",

                // Stock warnings
                showStockWarnings: mergedConfig.showStockWarnings || false,
                stockWarningMessage: mergedConfig.stockWarningMessage || "⚠️ Items in your cart are selling fast!",

                // CTA
                ctaUrl: mergedConfig.ctaUrl || "/checkout",
                buttonText: mergedConfig.buttonText || mergedConfig.ctaText || "Resume Checkout",
                saveForLaterText: mergedConfig.saveForLaterText || "Save for Later",

                // Currency
                currency: mergedConfig.currency || "USD",
              } as CartAbandonmentConfig}
              isVisible={true}
              onClose={handleClose}
              cartItems={[
                {
                  id: "1",
                  title: "Classic T-Shirt",
                  price: "29.99",
                  quantity: 2,
                  imageUrl: "https://via.placeholder.com/60",
                  variantId: "variant-1",
                },
                {
                  id: "2",
                  title: "Denim Jeans",
                  price: "79.99",
                  quantity: 1,
                  imageUrl: "https://via.placeholder.com/60",
                  variantId: "variant-2",
                },
              ]}
              cartTotal="139.97"
              onResumeCheckout={() => {
                // Preview mode - no action
              }}
              onSaveForLater={() => {
                // Preview mode - no action
              }}
            />
          </div>
        </PreviewContainer>
      );

    // Default fallback
    default:
      console.warn(
        `Unknown template type "${templateType}" in preview. Using newsletter fallback.`,
      );

      return (
        <PreviewContainer>
          <div
            ref={setPreviewElementRef}
            data-popup-preview
            style={{ display: "contents" }}
          >
            <NewsletterPopup
              config={{
                id: "preview-fallback",
                headline: mergedConfig.headline || "Preview Mode",
                subheadline: mergedConfig.subheadline || `Template: ${templateType}`,
                backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
                textColor: mergedConfig.textColor || "#1A1A1A",
                buttonColor: mergedConfig.buttonColor || "#007BFF",
                buttonTextColor: mergedConfig.buttonTextColor || "#FFFFFF",
                overlayColor: mergedConfig.overlayColor || "rgba(0, 0, 0, 1)",
                overlayOpacity: mergedConfig.overlayOpacity ?? 0.6,
                position: "center",
                size: "medium",
                previewMode: true,
                imageUrl: mergedConfig.imageUrl,
                imagePosition: mergedConfig.imagePosition || "left",
                theme: mergedConfig.theme,
                emailPlaceholder: "Enter your email",
                submitButtonText: mergedConfig.submitButtonText || "Subscribe",
              } as NewsletterConfig}
              isVisible={true}
              onClose={handleClose}
            />
          </div>
        </PreviewContainer>
      );
  }
});

// Helper function for deep comparison with stability
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return obj1 === obj2;
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== "object") return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

// Add display name to the component
TemplatePreviewComponent.displayName = "TemplatePreviewComponent";

// Export memoized component to prevent unnecessary re-renders
export const TemplatePreview = memo(
  TemplatePreviewComponent,
  (prevProps, nextProps) => {
    // Only re-render if template type changes or if configs have actually changed content
    if (prevProps.templateType !== nextProps.templateType) {
      return false; // Re-render
    }

    // Use deep equality check which is more reliable than JSON.stringify
    const configEqual = deepEqual(prevProps.config, nextProps.config);
    const designConfigEqual = deepEqual(
      prevProps.designConfig,
      nextProps.designConfig,
    );

    // Return true if configs are the same (no re-render needed)
    const shouldSkipRender = configEqual && designConfigEqual;

    // Debug log for re-render decisions (throttled for upsell templates)
    if (
      !shouldSkipRender &&
      (nextProps.templateType?.includes("upsell") ||
        nextProps.templateType?.includes("cart") ||
        nextProps.templateType === "product-recommendation")
    ) {
      console.log(
        "🔄 [TemplatePreview] Re-render triggered for",
        nextProps.templateType,
        {
          configEqual,
          designConfigEqual,
          prevConfigKeys: Object.keys(prevProps.config || {}),
          nextConfigKeys: Object.keys(nextProps.config || {}),
          prevDesignKeys: Object.keys(prevProps.designConfig || {}),
          nextDesignKeys: Object.keys(nextProps.designConfig || {}),
        },
      );
    }

    return shouldSkipRender;
  },
);

TemplatePreview.displayName = "TemplatePreview";
