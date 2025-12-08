/**
 * TemplatePreview Component
 *
 * Renders the appropriate template component based on templateType.
 * Uses actual template components for accurate WYSIWYG preview.
 */

import { useCallback, useMemo, memo, forwardRef, useImperativeHandle, useRef } from "react";

import { TemplateTypeEnum } from "~/lib/template-types.enum";
import { getTemplatePreviewEntry } from "./template-preview-registry";
import type {
  FlashSaleConfig,
  FreeShippingConfig,
  NewsletterConfig,
  NewsletterFormData,
  ProductUpsellConfig,
  SocialProofNotification as PreviewSocialProofNotification,
  SocialProofConfig,
  ClassicUpsellConfig,
  MinimalSlideUpConfig,
  PremiumFullscreenConfig,
  BundleDealConfig,
  CountdownUrgencyConfig,
} from "~/domains/storefront/popups-new";
import type { ReactNode } from "react";

const PREVIEW_SCOPE_ATTR = "data-popup-preview-root";

function scopeCss(css: string, scopeSelector: string) {
  if (!css || typeof css !== "string") return "";

  const trimmed = css.trim();
  if (!trimmed) return "";

  return trimmed
    .split("}")
    .map((block) => {
      const parts = block.split("{");
      if (parts.length < 2) {
        return block;
      }

      const selectors = parts[0]?.trim();
      const body = parts.slice(1).join("{");

      if (!selectors || !body) return "";

      if (selectors.startsWith("@")) {
        return `${selectors}{${body}}`;
      }

      const scopedSelectors = selectors
        .split(",")
        .map((sel) => `${scopeSelector} ${sel.trim()}`)
        .join(", ");

      return `${scopedSelectors}{${body}}`;
    })
    .filter(Boolean)
    .join("}");
}

function buildScopedStyles(globalCss?: string, campaignCss?: string) {
  const scopedGlobal = scopeCss(globalCss || "", `[${PREVIEW_SCOPE_ATTR}]`);
  const scopedCampaign = scopeCss(campaignCss || "", `[${PREVIEW_SCOPE_ATTR}]`);

  return [scopedGlobal, scopedCampaign].filter(Boolean).join("\n\n");
}

const PreviewContainer = ({
  children,
  scopedStylesNode,
}: {
  children: ReactNode;
  scopedStylesNode: ReactNode | null;
}) => (
  <div {...{ [PREVIEW_SCOPE_ATTR]: "true" }}>
    {scopedStylesNode}
    {children}
  </div>
);

export interface TemplatePreviewProps {
  templateType?: string;
  config: Record<string, unknown>;
  designConfig: Record<string, unknown>;
  onPreviewElementReady?: (element: HTMLElement | null) => void;
  globalCustomCSS?: string;
  campaignCustomCSS?: string;
  /** Default theme tokens for preview (from store's default preset or Shopify theme) */
  defaultThemeTokens?: import("~/domains/campaigns/types/design-tokens").DesignTokens;
  /** Optional callback when popup is closed (for demo/marketing respawn behavior) */
  onClose?: () => void;
  /** Controls popup visibility - when false, triggers exit animation */
  isVisible?: boolean;
}

export interface TemplatePreviewRef {
  getPreviewElement: () => HTMLElement | null;
}

const TemplatePreviewComponent = forwardRef<TemplatePreviewRef, TemplatePreviewProps>(
  (
    {
      templateType,
      config,
      designConfig,
      onPreviewElementReady,
      globalCustomCSS,
      campaignCustomCSS,
      defaultThemeTokens,
      onClose: externalOnClose,
      isVisible: externalIsVisible = true,
    },
    ref
  ) => {
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
      []
    );

    // Callback to set the preview element ref
    const setPreviewElementRef = useCallback(
      (element: HTMLElement | null) => {
        previewElementRef.current = element;
        onPreviewElementReady?.(element);
      },
      [onPreviewElementReady]
    );

    // Close handler - calls external callback if provided
    const handleClose = useCallback(() => {
      externalOnClose?.();
    }, [externalOnClose]);

    // Memoize merged config to prevent re-renders with more stable dependencies
    const mergedConfig: Record<string, unknown> = useMemo(() => {
      if (!templateType) {
        return { ...config, ...designConfig, globalCustomCSS };
      }

      // Apply default theme tokens when themeMode is "default" or "shopify"
      // This ensures the preview uses the store's default theme colors
      const themeMode = designConfig.themeMode as string | undefined;
      const shouldApplyDefaultTokens =
        (themeMode === "default" || themeMode === "shopify" || !themeMode) && defaultThemeTokens;

      // Map design tokens to popup config properties
      const defaultTokenColors = shouldApplyDefaultTokens
        ? {
            backgroundColor: defaultThemeTokens.background,
            textColor: defaultThemeTokens.foreground,
            descriptionColor: defaultThemeTokens.muted,
            buttonColor: defaultThemeTokens.primary,
            buttonTextColor: defaultThemeTokens.primaryForeground,
            accentColor: defaultThemeTokens.primary,
            successColor: defaultThemeTokens.success,
            fontFamily: defaultThemeTokens.fontFamily,
            borderRadius: defaultThemeTokens.borderRadius,
            inputBackgroundColor: defaultThemeTokens.surface,
            inputBorderColor: defaultThemeTokens.border,
          }
        : {};

      // For newsletter templates, ensure discount config is properly merged
      const baseConfig: Record<string, unknown> = {
        // Apply default theme tokens first (lowest priority)
        ...defaultTokenColors,
        // Then content config
        ...config,
        // Then design config (can override default tokens if explicitly set)
        ...designConfig,
        // Ensure popup is visible in preview
        isVisible: true,
        // Enable preview mode to prevent fixed positioning
        previewMode: true,
        // Pass global custom CSS through so scoped injection works for all templates (including banners/social proof)
        globalCustomCSS,
      };

      // IMPORTANT: For ProductUpsell, preserve the content's `layout` field (grid/card/carousel/etc.)
      // which gets overwritten by designConfig.layout (centered/split-left/etc.) - different meanings!
      if (templateType === TemplateTypeEnum.PRODUCT_UPSELL && config.layout) {
        baseConfig.layout = config.layout;
      }

      // If this is a newsletter template, merge discount configuration
      if (templateType.includes("newsletter")) {
        const result = {
          ...baseConfig,
          // Enable discount by default for newsletter templates
          discountEnabled: config.discountEnabled ?? designConfig.discountEnabled ?? true,
          // Provide discount code for template interpolation
          discountCode: config.discountCode || designConfig.discountCode || "WELCOME10",
          discountValue:
            config.discountValue ?? designConfig.discountValue ?? config.discountPercentage ?? 10,
          discountType: config.discountType || designConfig.discountType || "percentage",
        };
        return result;
      }

      return baseConfig;
    }, [config, designConfig, templateType, globalCustomCSS, defaultThemeTokens]);

    const scopedCss = useMemo(
      () => buildScopedStyles(globalCustomCSS, campaignCustomCSS),
      [campaignCustomCSS, globalCustomCSS]
    );

    const scopedStylesNode = scopedCss ? (
      <style
        // Scoped to preview container to avoid bleeding into admin shell
        dangerouslySetInnerHTML={{ __html: scopedCss }}
      />
    ) : null;

    // Create reliable inline SVG placeholder

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
            <div style={{ fontWeight: 500, marginBottom: "8px" }}>No Template Selected</div>
            <div style={{ fontSize: "13px", color: "#8C9196" }}>
              Select a template to see a live preview
            </div>
          </div>
        </div>
      );
    }

    // Use template preview registry for rendering
    const previewEntry = getTemplatePreviewEntry(templateType);

    if (!previewEntry) {
      console.warn(
        `Unknown template type "${templateType}" in preview. Using newsletter fallback.`
      );
      // Fallback to newsletter
      const fallbackEntry = getTemplatePreviewEntry(TemplateTypeEnum.NEWSLETTER);
      if (fallbackEntry) {
        const PreviewComponent = fallbackEntry.component;
        const componentConfig = fallbackEntry.buildConfig(mergedConfig, designConfig);

        return (
          <PreviewContainer scopedStylesNode={scopedStylesNode}>
            <div ref={setPreviewElementRef} data-popup-preview style={{ display: "contents" }}>
              <PreviewComponent
                config={componentConfig}
                isVisible={externalIsVisible}
                onClose={handleClose}
              />
            </div>
          </PreviewContainer>
        );
      }
      return null;
    }

    // Render the appropriate component with its config
    const PreviewComponent = previewEntry.component;
    const componentConfig = previewEntry.buildConfig(mergedConfig, designConfig);

    // Special handling for Newsletter: provide a mocked submit callback that returns a preview discount code
    if (templateType === TemplateTypeEnum.NEWSLETTER) {
      const newsletterConfig = componentConfig as NewsletterConfig;

      const previewOnSubmit = async (_data: NewsletterFormData): Promise<string | undefined> => {
        const discountEnabled = newsletterConfig.discount?.enabled === true;

        // Simulate network delay so merchants see loading states
        await new Promise((resolve) => setTimeout(resolve, 400));

        if (!discountEnabled) {
          // No discount incentive configured for this campaign; behave like a plain
          // newsletter signup with no code.
          return undefined;
        }

        const pct =
          typeof newsletterConfig.discount?.percentage === "number"
            ? newsletterConfig.discount.percentage
            : typeof newsletterConfig.discount?.value === "number"
              ? newsletterConfig.discount.value
              : 10;

        const baseCode = newsletterConfig.discount?.code || "WELCOME10";
        const suffix = Number.isFinite(pct) ? `-${Math.round(pct)}` : "";
        const code = `${baseCode}${suffix}`;

        return code;
      };

      return (
        <PreviewContainer scopedStylesNode={scopedStylesNode}>
          <div ref={setPreviewElementRef} data-popup-preview style={{ display: "contents" }}>
            <PreviewComponent
              config={newsletterConfig}
              isVisible={externalIsVisible}
              onClose={handleClose}
              onSubmit={previewOnSubmit}
            />
          </div>
        </PreviewContainer>
      );
    }

    // Special handling for Flash Sale: provide a mocked discount issuing callback
    if (templateType === TemplateTypeEnum.FLASH_SALE) {
      const flashConfig = componentConfig as FlashSaleConfig;

      const previewIssueDiscount = async (_options?: {
        cartSubtotalCents?: number;
      }): Promise<{ code?: string; behavior?: string } | null> => {
        const pct =
          typeof flashConfig.discountPercentage === "number" ? flashConfig.discountPercentage : 20;
        const baseCode = flashConfig.discount?.code || "FLASH-PREVIEW";
        const suffix = Number.isFinite(pct) ? `-${Math.round(pct)}` : "";
        const code = `${baseCode}${suffix}`;

        // Simulate network delay so merchants see loading states
        await new Promise((resolve) => setTimeout(resolve, 400));
        return { code, behavior: "SHOW_CODE_AND_AUTO_APPLY" };
      };

      return (
        <PreviewContainer scopedStylesNode={scopedStylesNode}>
          <div ref={setPreviewElementRef} data-popup-preview style={{ display: "contents" }}>
            <PreviewComponent
              config={flashConfig}
              isVisible={externalIsVisible}
              onClose={handleClose}
              issueDiscount={previewIssueDiscount}
            />
          </div>
        </PreviewContainer>
      );
    }

    // Special handling for Free Shipping: provide mocked cart totals and discount issuance
    if (templateType === TemplateTypeEnum.FREE_SHIPPING) {
      const freeShippingConfig = componentConfig as FreeShippingConfig;

      const threshold =
        typeof freeShippingConfig.threshold === "number" && freeShippingConfig.threshold > 0
          ? freeShippingConfig.threshold
          : 75;

      const nearMiss =
        typeof freeShippingConfig.nearMissThreshold === "number" &&
        freeShippingConfig.nearMissThreshold > 0
          ? freeShippingConfig.nearMissThreshold
          : 10;

      // Show progress state by default (60% of threshold) so users can see
      // the "in progress" bar instead of "goal already reached".
      const previewCartTotal =
        typeof freeShippingConfig.currentCartTotal === "number"
          ? freeShippingConfig.currentCartTotal
          : Math.round(threshold * 0.6);

      const baseCode = freeShippingConfig.discount?.code || "FREESHIP";
      const amount = Math.round(threshold);
      const previewCode = `${baseCode}-${amount}`;

      const previewIssueDiscount = async (_options?: {
        cartSubtotalCents?: number;
      }): Promise<{ code?: string; behavior?: string } | null> => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return { code: previewCode, behavior: "SHOW_CODE_AND_AUTO_APPLY" };
      };

      const previewOnSubmit = async (_data: { email: string }): Promise<string | undefined> => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return previewCode;
      };

      const configWithCart: FreeShippingConfig = {
        ...freeShippingConfig,
        currentCartTotal: previewCartTotal,
      };

      return (
        <PreviewContainer scopedStylesNode={scopedStylesNode}>
          <div ref={setPreviewElementRef} data-popup-preview style={{ display: "contents" }}>
            <PreviewComponent
              config={configWithCart}
              isVisible={externalIsVisible}
              onClose={handleClose}
              cartTotal={previewCartTotal}
              issueDiscount={previewIssueDiscount}
              onSubmit={previewOnSubmit}
            />
          </div>
        </PreviewContainer>
      );
    }

    // Special handling for Cart Abandonment: preview with mock cart items
    // and a fake discount/email recovery flow so both flows can be exercised.
    if (templateType === TemplateTypeEnum.CART_ABANDONMENT) {
      const cartConfig =
        componentConfig as import("~/domains/storefront/popups-new").CartAbandonmentConfig;

      const mockCartItems = [
        {
          id: "preview-item-1",
          title: "Premium Hoodie",
          quantity: 1,
          price: 59.0,
          imageUrl:
            "https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&w=150",
        },
        {
          id: "preview-item-2",
          title: "Classic Sneakers",
          quantity: 1,
          price: 89.0,
          imageUrl:
            "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=150",
        },
      ];

      const previewCartTotal = mockCartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const baseCode = cartConfig.discount?.code || "SAVE10";
      const previewCode = `${baseCode}`;

      const previewIssueDiscount = async (_options?: {
        cartSubtotalCents?: number;
      }): Promise<{ code?: string; behavior?: string } | null> => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return { code: previewCode, behavior: "SHOW_CODE_AND_AUTO_APPLY" };
      };

      const previewOnEmailRecovery = async (_email: string): Promise<string | undefined> => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return previewCode;
      };

      return (
        <PreviewContainer scopedStylesNode={scopedStylesNode}>
          <div ref={setPreviewElementRef} data-popup-preview style={{ display: "contents" }}>
            <PreviewComponent
              config={cartConfig}
              isVisible={externalIsVisible}
              onClose={handleClose}
              cartItems={mockCartItems}
              cartTotal={previewCartTotal}
              issueDiscount={previewIssueDiscount}
              onEmailRecovery={previewOnEmailRecovery}
            />
          </div>
        </PreviewContainer>
      );
    }

    // Special handling for Product Upsell: provide a mocked add-to-cart callback
    if (templateType === TemplateTypeEnum.PRODUCT_UPSELL) {
      const upsellConfig = componentConfig as ProductUpsellConfig;

      const previewOnAddToCart = async (productIds: string[]): Promise<void> => {
        console.log("[TemplatePreview][ProductUpsell] Preview add to cart", {
          productIds,
        });
        await new Promise((resolve) => setTimeout(resolve, 400));
      };

      return (
        <PreviewContainer scopedStylesNode={scopedStylesNode}>
          <div ref={setPreviewElementRef} data-popup-preview style={{ display: "contents" }}>
            <PreviewComponent
              config={upsellConfig}
              isVisible={externalIsVisible}
              onClose={handleClose}
              onAddToCart={previewOnAddToCart}
            />
          </div>
        </PreviewContainer>
      );
    }

    // Special handling for new upsell popup variants: provide mocked add-to-cart callback
    const upsellVariantTypes = [
      TemplateTypeEnum.CLASSIC_UPSELL,
      TemplateTypeEnum.MINIMAL_SLIDE_UP,
      TemplateTypeEnum.PREMIUM_FULLSCREEN,
      TemplateTypeEnum.COUNTDOWN_URGENCY,
    ] as const;

    if (upsellVariantTypes.includes(templateType as (typeof upsellVariantTypes)[number])) {
      type UpsellVariantConfig =
        | ClassicUpsellConfig
        | MinimalSlideUpConfig
        | PremiumFullscreenConfig
        | BundleDealConfig
        | CountdownUrgencyConfig;
      const upsellVariantConfig = componentConfig as UpsellVariantConfig;

      const previewOnAddToCart = async (productIds: string[]): Promise<void> => {
        console.log(`[TemplatePreview][${templateType}] Preview add to cart`, { productIds });
        await new Promise((resolve) => setTimeout(resolve, 400));
      };

      return (
        <PreviewContainer scopedStylesNode={scopedStylesNode}>
          <div ref={setPreviewElementRef} data-popup-preview style={{ display: "contents" }}>
            <PreviewComponent
              config={upsellVariantConfig}
              isVisible={externalIsVisible}
              onClose={handleClose}
              onAddToCart={previewOnAddToCart}
            />
          </div>
        </PreviewContainer>
      );
    }

    // Special handling for Social Proof preview: inject mock notifications and
    // disable per-session limits so merchants can see all enabled types.
    if (templateType === TemplateTypeEnum.SOCIAL_PROOF) {
      const socialProofConfig: SocialProofConfig = {
        ...(componentConfig as Record<string, unknown>),
        // In preview, always show all notification types so merchants can see
        // each variant, regardless of the stored content flags.
        enablePurchaseNotifications: true,
        enableVisitorNotifications: true,
        enableReviewNotifications: true,
        // Disable per-session limit in preview so rotation keeps looping.
        maxNotificationsPerSession: 0,
      } as SocialProofConfig;

      const previewNotifications = buildSocialProofPreviewNotifications(
        socialProofConfig as unknown as Record<string, unknown>
      );

      console.log("[TemplatePreview][SocialProof] Rendering social proof preview", {
        templateType,
        notificationsCount: previewNotifications.length,
        flags: {
          enablePurchaseNotifications: socialProofConfig.enablePurchaseNotifications,
          enableVisitorNotifications: socialProofConfig.enableVisitorNotifications,
          enableReviewNotifications: socialProofConfig.enableReviewNotifications,
          maxNotificationsPerSession: socialProofConfig.maxNotificationsPerSession,
        },
      });

      return (
        <PreviewContainer scopedStylesNode={scopedStylesNode}>
          <div ref={setPreviewElementRef} data-popup-preview style={{ display: "contents" }}>
            <PreviewComponent
              config={socialProofConfig}
              isVisible={externalIsVisible}
              onClose={handleClose}
              notifications={previewNotifications}
            />
          </div>
        </PreviewContainer>
      );
    }

    return (
      <PreviewContainer scopedStylesNode={scopedStylesNode}>
        <div ref={setPreviewElementRef} data-popup-preview style={{ display: "contents" }}>
          <PreviewComponent
            config={componentConfig}
            isVisible={externalIsVisible}
            onClose={handleClose}
          />
        </div>
      </PreviewContainer>
    );
  }
);

function buildSocialProofPreviewNotifications(
  config: Record<string, unknown>
): PreviewSocialProofNotification[] {
  const notifications: PreviewSocialProofNotification[] = [];
  const now = Date.now();

  // Choose values that always satisfy any configured thresholds
  const visitorCount = Math.max(
    typeof config.minVisitorCount === "number" ? config.minVisitorCount + 1 : 23,
    1
  );

  const reviewRatingBase =
    typeof config.minReviewRating === "number" ? config.minReviewRating + 0.1 : 4.9;
  const reviewRating = Math.min(reviewRatingBase, 5);

  const enableVisitor = config.enableVisitorNotifications !== false;
  const enablePurchase = config.enablePurchaseNotifications !== false;
  const enableReview = config.enableReviewNotifications !== false;

  // In preview, show non-purchase types first so the differences are obvious
  // 1) Live visitors (Tier 1)
  if (enableVisitor) {
    notifications.push({
      id: "preview-visitor-live",
      type: "visitor",
      count: visitorCount,
      context: "viewing this product",
      trending: false,
      timestamp: now,
    });
  }

  // 2) Sales count (Tier 1 / Tier 2 hybrid)
  // "47 bought this in the last 24 hours"
  notifications.push({
    id: "preview-sales-count",
    type: "visitor",
    count: 47,
    context: "bought this in the last 24 hours",
    trending: true,
    timestamp: now - 10 * 60 * 1000,
  });

  // 3) Low stock alert (Tier 2)
  // "3 left in stock!"
  notifications.push({
    id: "preview-low-stock",
    type: "visitor",
    count: 3,
    context: "left in stock!",
    trending: false,
    timestamp: now - 20 * 60 * 1000,
  });

  // 4) Cart activity (Tier 2)
  // "5 added to cart in the last hour"
  notifications.push({
    id: "preview-cart-activity",
    type: "visitor",
    count: 5,
    context: "added to cart in the last hour",
    trending: false,
    timestamp: now - 25 * 60 * 1000,
  });

  // 5) Recently viewed (Tier 2)
  // "15 viewed this in the last hour"
  notifications.push({
    id: "preview-recently-viewed",
    type: "visitor",
    count: 15,
    context: "viewed this in the last hour",
    trending: false,
    timestamp: now - 35 * 60 * 1000,
  });

  // 6) Review notification
  if (enableReview) {
    notifications.push({
      id: "preview-review-1",
      type: "review",
      rating: reviewRating,
      reviewCount: 127,
      recentReview: {
        author: "Emily K.",
        text: "Great product! Highly recommend.",
        verified: true,
      },
      timestamp: now - 30 * 60 * 1000,
    });
  }

  // 7) Purchase notifications (added last)
  if (enablePurchase) {
    notifications.push(
      {
        id: "preview-purchase-1",
        type: "purchase",
        customerName: "John D.",
        location: "New York, NY",
        productName: "Classic T-Shirt",
        timeAgo: "2 minutes ago",
        verified: true,
        timestamp: now - 2 * 60 * 1000,
      },
      {
        id: "preview-purchase-2",
        type: "purchase",
        customerName: "Sarah M.",
        location: "Los Angeles, CA",
        productName: "Denim Jacket",
        timeAgo: "5 minutes ago",
        verified: true,
        timestamp: now - 5 * 60 * 1000,
      }
    );
  }

  // Fallback to a single purchase notification if everything is disabled
  if (notifications.length === 0) {
    notifications.push({
      id: "preview-purchase-fallback",
      type: "purchase",
      customerName: "Alex",
      location: "Nearby",
      productName: "Best-selling product",
      timeAgo: "Just now",
      verified: true,
      timestamp: now,
    });
  }

  console.log("[TemplatePreview][SocialProof] Built preview notifications", {
    notificationsCount: notifications.length,
    hasPurchase: notifications.some((n) => n.type === "purchase"),
    hasVisitor: notifications.some((n) => n.type === "visitor"),
    hasReview: notifications.some((n) => n.type === "review"),
  });

  return notifications;
}

// Helper function for deep comparison with stability
function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return obj1 === obj2;
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== "object") return obj1 === obj2;

  const o1 = obj1 as Record<string, unknown>;
  const o2 = obj2 as Record<string, unknown>;
  const keys1 = Object.keys(o1);
  const keys2 = Object.keys(o2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(o1[key], o2[key])) return false;
  }

  return true;
}

// Add display name to the component
TemplatePreviewComponent.displayName = "TemplatePreviewComponent";

// Export memoized component to prevent unnecessary re-renders
export const TemplatePreview = memo(TemplatePreviewComponent, (prevProps, nextProps) => {
  // Only re-render if template type changes or if configs have actually changed content
  if (prevProps.templateType !== nextProps.templateType) {
    return false; // Re-render
  }

  // Check CSS props changes
  if (prevProps.globalCustomCSS !== nextProps.globalCustomCSS) {
    return false; // Re-render
  }
  if (prevProps.campaignCustomCSS !== nextProps.campaignCustomCSS) {
    return false; // Re-render
  }

  // Use deep equality check which is more reliable than JSON.stringify
  const configEqual = deepEqual(prevProps.config, nextProps.config);
  const designConfigEqual = deepEqual(prevProps.designConfig, nextProps.designConfig);

  // Return true if configs are the same (no re-render needed)
  return configEqual && designConfigEqual;
});

TemplatePreview.displayName = "TemplatePreview";
