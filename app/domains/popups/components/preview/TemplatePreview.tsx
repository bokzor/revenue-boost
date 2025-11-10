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
import { NewsletterPopup } from "~/domains/storefront/popups/NewsletterPopup";
import { CountdownTimerBanner } from "~/domains/campaigns/components/sales/CountdownTimerBanner";
import { FlashSaleModal } from "~/domains/campaigns/components/sales/FlashSaleModal";
import { SocialProofPopup } from "~/domains/storefront/notifications/social-proof/SocialProofPopup";
import { MultiStepNewsletterForm } from "~/domains/campaigns/components/newsletter/MultiStepNewsletterForm";
import { TemplateTypeEnum } from "~/lib/template-types.enum";
import { ProductUpsellPopup } from "~/domains/storefront/popups/ProductUpsellPopup";
import { SpinToWinPopup } from "~/domains/storefront/popups/SpinToWinPopup";
import { ScratchCardPopup } from "~/domains/storefront/popups/ScratchCardPopup";
import { FreeShippingPopup } from "~/domains/storefront/popups/FreeShippingPopup";

import type { NewsletterConfig } from "~/domains/storefront/popups/NewsletterPopup";
import type { ProductUpsellConfig } from "~/domains/storefront/popups/ProductUpsellPopup";
import type { SpinToWinConfig } from "~/domains/storefront/popups/SpinToWinPopup";
import type { ScratchCardConfig } from "~/domains/storefront/popups/ScratchCardPopup";
import type { FreeShippingConfig } from "~/domains/storefront/popups/FreeShippingPopup";
import type { CountdownTimerConfig } from "~/domains/campaigns/components/sales/CountdownTimerBanner";

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

  // Memoize upsell config with more stable approach using entire config hash
  const upsellConfig: ProductUpsellConfig = useMemo(() => {
    const config = {
      ...mergedConfig,
      id: "preview-upsell",
      title: mergedConfig.headline || "You Might Also Like",
      description:
        mergedConfig.subheadline || "Complete your look with these items",
      buttonText:
        mergedConfig.addToCartText || mergedConfig.buttonText || "Add to Cart",
      backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
      textColor: mergedConfig.textColor || "#1A1A1A",
      buttonColor: mergedConfig.buttonColor || "#007BFF",
      buttonTextColor: mergedConfig.buttonTextColor || "#FFFFFF",
      products: mockProducts,
      maxProducts: mergedConfig.maxProducts || 3,
      // Use specific field names from template configuration
      showPrices: mergedConfig.showProductPrice !== false,
      showCompareAtPrice:
        mergedConfig.showCompareAtPrice !== false &&
        mergedConfig.showProductPrice !== false,
      showImages: mergedConfig.showProductImage !== false,
      // Use displayTemplate field name from configuration
      layout: mergedConfig.displayTemplate || mergedConfig.layout || "grid",
      columns: mergedConfig.columns || 2,
    };

    // Debug logging to identify re-render causes - throttled
    if (
      (templateType?.includes("upsell") ||
        templateType?.includes("cart") ||
        templateType === "product-recommendation") &&
      renderCount.current % 5 === 1
    ) {
      console.log(
        "🛒 [UpsellConfig] Re-creating config for templateType:",
        templateType,
        "render:",
        renderCount.current,
      );
      console.log("🛒 [UpsellConfig] Stable config fields:", {
        hasHeadline: !!mergedConfig.headline,
        hasSubheadline: !!mergedConfig.subheadline,
        hasColors: !!(mergedConfig.backgroundColor || mergedConfig.textColor),
        layout: mergedConfig.displayTemplate || mergedConfig.layout,
        maxProducts: mergedConfig.maxProducts || 3,
      });
    }

    return config;
  }, [templateType, mergedConfig, mockProducts]);

  // Preview container wrapper - creates positioning context for popups
  const PreviewContainer: React.FC<{ children: React.ReactNode }> = useCallback(
    ({ children }) => (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* Simulated overlay for preview - fills entire container */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {children}
        </div>
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
                ...mergedConfig,
                id: "preview-newsletter",
                title: mergedConfig.headline || "Join our newsletter",
                description: mergedConfig.subheadline || "",
                buttonText: mergedConfig.submitButtonText || "Subscribe",
                backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
                textColor: mergedConfig.textColor || "#1A1A1A",
                previewMode: true,
              } as NewsletterConfig}
              isVisible={true}
              onClose={handleClose}
              campaignId="preview"
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
          <MultiStepNewsletterForm
            config={mergedConfig}
            onClose={handleClose}
            previewMode={true}
          />
        </div>
      );

    // Flash Sale Modal
    case TemplateTypeEnum.FLASH_SALE:
      return (
        <div
          ref={setPreviewElementRef}
          data-popup-preview
          style={{ display: "contents" }}
        >
          <FlashSaleModal
            config={{
              headline:
                mergedConfig.headline || "🔥 Flash Sale - Limited Time!",
              subheadline:
                mergedConfig.subheadline ||
                "Get up to 50% off on selected items",
              urgencyMessage: mergedConfig.urgencyMessage,
              ctaText: mergedConfig.ctaText || "Shop Now",
              ctaUrl: mergedConfig.ctaUrl || "/collections/sale",
              discountPercentage: mergedConfig.discountPercentage,
              showCountdown: mergedConfig.showCountdown !== false,
              countdownDuration: mergedConfig.countdownDuration || 24,
              showStockCounter: mergedConfig.showStockCounter || false,
              stockCount: mergedConfig.stockCount,
            }}
            onClose={handleClose}
            previewMode={true}
          />
        </div>
      );

    // Countdown Timer Banner
    case TemplateTypeEnum.COUNTDOWN_TIMER:
      return (
        <div
          ref={setPreviewElementRef}
          data-popup-preview
          style={{ display: "contents" }}
        >
          <CountdownTimerBanner
            config={{
              ...mergedConfig,
              endTime: (mergedConfig as any).endTime || "23:59",
            } as CountdownTimerConfig}
            onClose={handleClose}
            previewMode={true}
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
            campaignId="preview"
            config={mergedConfig}
            notifications={[
              {
                id: "1",
                type: "purchase",
                customerName: "Sarah M.",
                location: "New York, NY",
                productName: "Classic T-Shirt",
                timeAgo: "2 minutes ago",
                verified: true,
                timestamp: Date.now(),
              },
            ]}
          />
        </div>
      );

    // Spin-to-Win
    case TemplateTypeEnum.SPIN_TO_WIN: {
      // Normalize like storefront runtime
      const lotteryConfig: Record<string, unknown> = {
        ...mergedConfig,
        templateType: "lottery",
        previewMode: true,
      };

      // prizes provided as JSON string in admin → parse into array
      if (typeof lotteryConfig.prizes === "string") {
        try {
          const parsed = JSON.parse(lotteryConfig.prizes);
          if (Array.isArray(parsed)) lotteryConfig.prizes = parsed;
        } catch (_) {
          // keep as-is; component will fallback safely
        }
      }

      // wheelColors may be comma-separated → turn into array
      if (typeof lotteryConfig.wheelColors === "string") {
        lotteryConfig.wheelColors = lotteryConfig.wheelColors
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      // numeric coercion for consistency
      if (lotteryConfig.spinDuration != null) {
        const n = Number(lotteryConfig.spinDuration);
        if (!Number.isNaN(n)) lotteryConfig.spinDuration = n;
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
                title: mergedConfig.headline || "Spin & Win",
                description: mergedConfig.subheadline || "",
                buttonText: mergedConfig.submitButtonText || "Spin",
                backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
                textColor: mergedConfig.textColor || "#1A1A1A",
                ...lotteryConfig,
              } as SpinToWinConfig}
              isVisible={true}
              onClose={handleClose}
              renderInline={true}
              onSpinComplete={async () => {
                /* no-op in preview */
              }}
            />
          </div>
        </PreviewContainer>
      );
    }

    // Page Load triggers are now handled by the normalizer

    // Scratch Card
    case TemplateTypeEnum.SCRATCH_CARD:
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
                title: mergedConfig.headline || "Scratch & Win",
                description: mergedConfig.subheadline || "",
                buttonText: mergedConfig.submitButtonText || "Reveal",
                backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
                textColor: mergedConfig.textColor || "#1A1A1A",
                ...mergedConfig,
                templateType: "scratch_card",
                previewMode: true,
              } as ScratchCardConfig}
              isVisible={true}
              onClose={handleClose}
              campaignId="preview"
              onScratchComplete={async () => {
                /* no-op in preview */
              }}
            />
          </div>
        </PreviewContainer>
      );

    // Upsell Template
    case "upsell-template":
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "400px",
            backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
            color: mergedConfig.textColor || "#1A1A1A",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              {mergedConfig.headline || "Complete Your Look"}
            </div>
            <div style={{ fontSize: "14px", marginBottom: "20px" }}>
              {mergedConfig.subheadline ||
                "Customers who bought this also loved:"}
            </div>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "100px",
                    height: "100px",
                    backgroundColor: "#F6F6F7",
                    borderRadius: "8px",
                  }}
                />
              ))}
            </div>
            <button
              style={{
                backgroundColor: mergedConfig.buttonColor || "#007BFF",
                color: mergedConfig.buttonTextColor || "#FFFFFF",
                padding: "12px 24px",
                borderRadius: "6px",
                border: "none",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                marginTop: "20px",
              }}
            >
              {mergedConfig.ctaText || "Add to Cart"}
            </button>
          </div>
        </div>
      );

    // Announcement Slide
    case TemplateTypeEnum.ANNOUNCEMENT:
      return (
        <div
          style={{
            backgroundColor: mergedConfig.backgroundColor || "#007BFF",
            color: mergedConfig.textColor || "#FFFFFF",
            padding: "16px 20px",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {mergedConfig.message || "New products just arrived! Shop now →"}
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
                title: mergedConfig.headline || "Free Shipping Progress",
                description: mergedConfig.subheadline || "",
                buttonText: mergedConfig.ctaText || "Shop more",
                backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
                textColor: mergedConfig.textColor || "#1A1A1A",
                freeShippingThreshold: (mergedConfig as any).freeShippingThreshold || 75,
                currentCartTotal: 30,
                currency: "USD",
                products: mockProducts.slice(0, (mergedConfig as any).productCount || 3),
                showProgress: (mergedConfig as any).showProgress ?? true,
                showProducts: (mergedConfig as any).showProducts ?? true,
                progressColor:
                  (mergedConfig as any).progressColor ||
                  (mergedConfig as any).buttonColor ||
                  "#28A745",
                displayStyle:
                  (mergedConfig as any).displayStyle ||
                  ((mergedConfig as any).position === "top"
                    ? "banner"
                    : (mergedConfig as any).position === "bottom"
                      ? "sticky"
                      : "modal"),
                autoHide: (mergedConfig as any).autoHide || false,
                hideDelay: (mergedConfig as any).hideDelay || 3,
              } as FreeShippingConfig}
              isVisible={true}
              onClose={handleClose}
              onButtonClick={handleButtonClick}
              onAddToCart={handleAddToCart}
              onShopMore={handleButtonClick}
            />
          </div>
        </PreviewContainer>
      );

    // Product Upsell Templates
    case TemplateTypeEnum.PRODUCT_UPSELL:
      return (
        <PreviewContainer>
          <div
            ref={setPreviewElementRef}
            data-popup-preview
            style={{ display: "contents" }}
          >
            <ProductUpsellPopup
              config={upsellConfig}
              isVisible={true}
              onClose={handleClose}
              onButtonClick={handleButtonClick}
              onAddToCart={handleAddToCart}
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
                ...mergedConfig,
                id: "preview-fallback",
                title: mergedConfig.headline || "Preview Mode",
                description: mergedConfig.subheadline || `Template: ${templateType}`,
                buttonText: mergedConfig.submitButtonText || "Subscribe",
                backgroundColor: mergedConfig.backgroundColor || "#FFFFFF",
                textColor: mergedConfig.textColor || "#1A1A1A",
                previewMode: true,
              } as NewsletterConfig}
              isVisible={true}
              onClose={handleClose}
              campaignId="preview"
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
