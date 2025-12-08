/**
 * PopupManagerPreact - Preact-based popup manager for storefront
 *
 * Renders popups using lazy-loaded components
 */

import { h, render, type ComponentType } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { ComponentLoader, type TemplateType } from "./component-loader";
import type { ApiClient } from "./api";
import { session } from "./session";
import { executeHooksForCampaign, clearCampaignCache } from "./hooks";
import {
  getShopifyRoot,
  applyDiscountToCart,
  shouldAutoApply,
  getSectionsToRender,
  refreshCartDrawer,
  addUTMParams,
  loadFontFromDesignConfig,
} from "../utils";

export interface StorefrontCampaign {
  id: string;
  name: string;
  templateType: TemplateType;
  contentConfig: Record<string, unknown>;
  designConfig: Record<string, unknown>;
  /**
   * Pre-resolved CSS custom properties for design tokens.
   * Format: "--rb-background: #fff; --rb-primary: #000; ..."
   * When present, applied as inline styles on the popup container.
   */
  designTokensCSS?: string;
  targetRules?: Record<string, unknown>;
  discountConfig?: Record<string, unknown>;
  experimentId?: string | null;
  variantKey?: string | null;
  globalCustomCSS?: string;
  customCSS?: string;
  /** Whether to show "Powered by Revenue Boost" branding (true for free tier) */
  showBranding?: boolean;
}

export interface PopupManagerProps {
  campaign: StorefrontCampaign;
  onClose: () => void;
  onShow?: (campaignId: string) => void;
  loader: ComponentLoader;
  api: ApiClient;
  triggerContext?: { productId?: string; [key: string]: unknown };
  globalCustomCSS?: string;
}

// Exit animation duration in ms - should match PopupPortal's animation timing
const EXIT_ANIMATION_DURATION_MS = 1600; // Max of backdrop + content animation

export function PopupManagerPreact({ campaign, onClose, onShow, loader, api, triggerContext }: PopupManagerProps) {
  const [Component, setComponent] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preloadedResources, setPreloadedResources] = useState<Record<string, unknown> | null>(null);

  // Track visibility for exit animation
  const [isVisible, setIsVisible] = useState(true);

  // Track when popup was shown (for bot detection timing validation)
  const popupShownAtRef = useRef<number>(Date.now());

  // Handle close with exit animation
  const handleCloseWithAnimation = useCallback(() => {
    // Set invisible first - triggers exit animation in PopupPortal
    setIsVisible(false);

    // After exit animation completes, call the actual onClose
    setTimeout(() => {
      onClose();
    }, EXIT_ANIMATION_DURATION_MS);
  }, [onClose]);

  // Expose popupShownAt and visitorId as globals for popup components to use
  // This avoids passing these through props and keeps bundle size small
  useEffect(() => {
    const w = window as { __RB_POPUP_SHOWN_AT?: number; __RB_VISITOR_ID?: string };
    w.__RB_POPUP_SHOWN_AT = popupShownAtRef.current;
    w.__RB_VISITOR_ID = session.getVisitorId();
  }, []);

  // Execute pre-display hooks and load component
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        console.log("[PopupManager] Initializing popup for:", campaign.templateType);

        // Load custom Google Font if specified in design config
        loadFontFromDesignConfig(campaign.designConfig);

        // Execute hooks and load component in parallel for faster initialization
        const [hooksResult, comp] = await Promise.all([
          executeHooksForCampaign(
            campaign,
            api,
            session.getSessionId(),
            session.getVisitorId(),
            triggerContext // Pass trigger context to hooks
          ),
          loader.loadComponent(campaign.templateType),
        ]);

        if (!mounted) return;

        // Check if hooks failed - don't display popup if all hooks failed
        if (!hooksResult.success) {
          console.error(
            `[PopupManager] Cannot display popup - PreDisplayHook failed:`,
            hooksResult.errors
          );
          setError("Failed to load required resources");
          setLoading(false);
          return;
        }

        // Set preloaded resources
        setPreloadedResources(hooksResult.loadedResources);

        // Set component
        setComponent(() => comp as ComponentType<Record<string, unknown>>);
        setLoading(false);
        onShow?.(campaign.id);

      } catch (err) {
        console.error("[PopupManager] Failed to initialize popup:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load popup");
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
      // Clear cached resources when component unmounts
      clearCampaignCache(campaign.id);
    };
  }, [api, campaign, loader, onShow, triggerContext]);

  const trackClick = (metadata?: Record<string, unknown>) => {
    try {
      api
        .trackEvent({
          type: "CLICK",
          campaignId: campaign.id,
          sessionId: session.getSessionId(),
          data: {
            ...(metadata ?? {}),
            experimentId: campaign.experimentId ?? undefined,
            variantKey: campaign.variantKey ?? undefined,
            pageUrl:
              typeof window !== "undefined" ? window.location.href : undefined,
            referrer:
              typeof document !== "undefined" ? document.referrer : undefined,
          },
        })
        .catch((err) => {
          console.error("[PopupManager] Failed to track click event:", err);
        });
    } catch (err) {
      console.error("[PopupManager] Failed to schedule click tracking:", err);
    }
  };

  // Handle lead submission
  const handleSubmit = async (data: { email: string; name?: string; gdprConsent?: boolean }) => {
    try {
      console.log("[PopupManager] Submitting lead:", data);

      trackClick({ action: "submit" });

      // GDPR: Get the consent text from campaign config to store with the lead
      const contentConfig = campaign.contentConfig as Record<string, unknown>;
      const consentText = data.gdprConsent
        ? (contentConfig.consentFieldText as string) ||
          (contentConfig.gdprLabel as string) ||
          "I agree to receive marketing emails"
        : undefined;

      const result = await api.submitLead({
        email: data.email,
        campaignId: campaign.id,
        sessionId: session.getSessionId(),
        visitorId: session.getVisitorId(),
        consent: data.gdprConsent,
        consentText, // GDPR: Include the consent text the user agreed to
        firstName: data.name,
        // Bot detection: send timing info
        popupShownAt: popupShownAtRef.current,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit lead");
      }

      console.log("[PopupManager] Lead submitted successfully:", result);

      // If there's a free gift, add it to the cart
      if (result.freeGift) {
        try {
          console.log("[PopupManager] Adding free gift to cart:", result.freeGift);

          // Extract variant ID number from GID (e.g., "gid://shopify/ProductVariant/123" -> "123")
          const variantId = result.freeGift.variantId.split('/').pop() || result.freeGift.variantId;

          // Detect which sections to render for cart drawer refresh
          const sectionsToRender = getSectionsToRender();

          // Add to cart using Shopify's Cart API with Section Rendering
          const cartResponse = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              items: [{
                id: variantId,
                quantity: result.freeGift.quantity,
              }],
              sections: sectionsToRender,
              sections_url: window.location.pathname,
            }),
          });

          if (!cartResponse.ok) {
            console.error("[PopupManager] Failed to add free gift to cart:", await cartResponse.text());
          } else {
            const cartData = await cartResponse.json();
            console.log("[PopupManager] Free gift added to cart successfully");

            // Refresh cart drawer using Section Rendering API response
            await refreshCartDrawer(cartData, '/');
          }
        } catch (cartError) {
          console.error("[PopupManager] Error adding free gift to cart:", cartError);
          // Don't fail the whole flow if cart addition fails
        }
      }

      // Auto-apply discount via AJAX when configured to do so
      const discountCode = result.discountCode;
      const discountConfig = campaign.discountConfig as
        | { behavior?: string }
        | undefined;
      const behavior = discountConfig?.behavior;

      if (discountCode && shouldAutoApply(behavior)) {
        // Fire-and-forget; don't block the success UI on cart update
        void applyDiscountToCart(discountCode, "PopupManager");
      }

      // Return the discount code if available (for UI display)
      return discountCode;
    } catch (err) {
      console.error("[PopupManager] Failed to submit lead:", err);
      throw err;
    }
  };

  const handleIssueDiscount = async (options?: {
    cartSubtotalCents?: number;
    selectedProductIds?: string[];
    bundleDiscountPercent?: number;
  }) => {
    try {
      console.log("[PopupManager] Issuing discount for campaign:", campaign.id, options);

      trackClick({
        action: "issue_discount",
        cartSubtotalCents: options?.cartSubtotalCents,
      });

      const result = await api.issueDiscount({
        campaignId: campaign.id,
        sessionId: session.getSessionId(),
        visitorId: session.getVisitorId(),
        // Bot detection: send timing info
        popupShownAt: popupShownAtRef.current,
        cartSubtotalCents: options?.cartSubtotalCents,
        selectedProductIds: options?.selectedProductIds,
        bundleDiscountPercent: options?.bundleDiscountPercent,
      });

      if (!result.success) {
        console.error("[PopupManager] Failed to issue discount:", result.error);
        return null;
      }

      const code = result.code;
      const discountConfig = campaign.discountConfig as
        | { behavior?: string }
        | undefined;
      const behavior = discountConfig?.behavior;

      console.log("[PopupManager] 🎟️ Discount issued:", {
        code,
        behavior,
        campaignId: campaign.id,
      });

      const autoApplyEnabled = code && shouldAutoApply(behavior);

      console.log("[PopupManager] 🎟️ Should auto-apply discount?", {
        autoApplyEnabled,
        hasCode: !!code,
        behavior,
      });

      if (autoApplyEnabled) {
        console.log("[PopupManager] 🎟️ Auto-applying discount code:", code);
        // Fire-and-forget; don't block popup interactions
        void applyDiscountToCart(code, "PopupManager");
      } else {
        console.log("[PopupManager] ℹ️ Discount will not be auto-applied (manual application required)");
      }

      return result;
    } catch (err) {
      console.error("[PopupManager] Error issuing discount:", err);
      return null;
    }
  };


  // Don't render anything while loading - this prevents showing "Loading..." to users
  // Wait for both component AND preloaded resources to be ready
  if (loading || !Component || !preloadedResources) {
    return null;
  }

  if (error) {
    console.error("[PopupManager] Error:", error);
    return null;
  }

  // Render the loaded component
  // Inject initial cart total (from app embed) so FreeShipping bar can render correct progress
  const currentCartTotal = (() => {
    try {
      const w = window as {
        REVENUE_BOOST_CONFIG?: { cartValue?: string | number };
      };
      const raw = w?.REVENUE_BOOST_CONFIG?.cartValue;
      const n = typeof raw === 'string' ? parseFloat(raw) : (typeof raw === 'number' ? raw : 0);
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  })();

  const handleEmailRecovery = async (email: string): Promise<string | undefined> => {
    try {
      console.log("[PopupManager] Email recovery for campaign:", campaign.id, { email });

      const cartSubtotalCents =
        typeof currentCartTotal === "number" && Number.isFinite(currentCartTotal)
          ? Math.round(currentCartTotal * 100)
          : undefined;

      trackClick({
        action: "email_recovery",
        email,
        cartSubtotalCents,
      });

      // Get cart items from preloaded resources
      const cartItems = (preloadedResources?.cart as { items?: unknown[] } | undefined)?.items;

      const result = await api.emailRecovery({
        campaignId: campaign.id,
        email,
        cartSubtotalCents,
        cartItems: cartItems as Record<string, unknown>[] | undefined,
      });

      if (!result.success) {
        console.error("[PopupManager] Email recovery failed:", result.error);
        throw new Error(result.error || "Email recovery failed");
      }

      const code = result.discountCode;
      const discountConfig = campaign.discountConfig as
        | { behavior?: string }
        | undefined;
      const behavior = discountConfig?.behavior;

      if (code && shouldAutoApply(behavior)) {
        // Fire-and-forget; don't block popup interactions
        void applyDiscountToCart(code, "PopupManager");
      }

      // For modes that show the code in the popup, don't redirect automatically
      if (
        behavior === "SHOW_CODE_ONLY" ||
        behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL"
      ) {
        return code || undefined;
      }

      const root = getShopifyRoot();
      const contentConfig = (campaign.contentConfig || {}) as Record<string, unknown>;
      const configuredUrl =
        typeof contentConfig.ctaUrl === "string" && contentConfig.ctaUrl.trim() !== ""
          ? contentConfig.ctaUrl
          : "checkout";

      const urlWithUtm = addUTMParams(configuredUrl, {
        utmCampaign: (campaign.designConfig as { utmCampaign?: string | null })?.utmCampaign,
        utmSource: (campaign.designConfig as { utmSource?: string | null })?.utmSource,
        utmMedium: (campaign.designConfig as { utmMedium?: string | null })?.utmMedium,
      });
      const normalizedPath = configuredUrl.replace(/^\//, "");
      const target = urlWithUtm?.startsWith("http")
        ? urlWithUtm
        : `${root}${normalizedPath}${urlWithUtm && urlWithUtm.includes("?") ? urlWithUtm.slice(urlWithUtm.indexOf("?")) : ""}`;
      window.location.href = target;

      return code || undefined;
    } catch (error) {
      console.error("[PopupManager] Error during email recovery flow:", error);
      throw error;
    }
  };

  const handleAddToCart = async (productIds: string[]) => {
    try {
      console.log("[PopupManager] Adding products to cart:", productIds);

      // Track the add to cart click
      trackClick({ action: "add_to_cart", productIds });

      if (!productIds || productIds.length === 0) return;

      // Get products from preloaded resources
      const products = (preloadedResources?.products as Array<{ id: string; variantId?: string }> | undefined) || [];
      const itemsToAdd: { id: string; quantity: number }[] = [];

      for (const pid of productIds) {
        const product = products.find((p) => p.id === pid);
        if (product && product.variantId) {
          // Extract numeric ID if it's a GID
          const variantId = product.variantId.split('/').pop() || product.variantId;
          itemsToAdd.push({ id: variantId, quantity: 1 });
        } else {
          // Fallback to using the ID as is if not found in products (rare case)
          const variantId = pid.split('/').pop() || pid;
          itemsToAdd.push({ id: variantId, quantity: 1 });
        }
      }

      if (itemsToAdd.length === 0) {
        console.warn("[PopupManager] No valid items to add");
        return;
      }

      // Add to cart using Shopify's Cart API with Section Rendering
      const root = getShopifyRoot();

      // Detect which sections to render for cart drawer refresh
      const sectionsToRender = getSectionsToRender();

      const cartResponse = await fetch(`${root}cart/add.js`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsToAdd,
          sections: sectionsToRender,
          sections_url: window.location.pathname,
        }),
      });

      if (!cartResponse.ok) {
        console.error("[PopupManager] Failed to add to cart:", await cartResponse.text());
        throw new Error("Failed to add items to cart");
      }

      const cartData = await cartResponse.json();
      console.log("[PopupManager] Items added to cart successfully");

      // Check if we need to apply a bundle discount
      const contentConfig = campaign.contentConfig || {};
      const bundleDiscount = (contentConfig as { bundleDiscount?: number }).bundleDiscount;

      console.log("[PopupManager] Bundle discount check:", {
        bundleDiscount,
        selectedCount: productIds.length,
        discountEnabled: campaign.discountConfig?.enabled,
      });

      // Apply bundle discount if:
      // 1. bundleDiscount is set in contentConfig (auto-sync mode), OR
      // 2. discountConfig is explicitly enabled
      const shouldApplyBundleDiscount = bundleDiscount && bundleDiscount > 0 && productIds.length > 0;
      const shouldApplyExplicitDiscount = campaign.discountConfig?.enabled && !bundleDiscount;

      if (shouldApplyBundleDiscount || shouldApplyExplicitDiscount) {
        // Fetch cart total for tiered discount support
        let cartSubtotalCents: number | undefined;
        try {
          const cartRes = await fetch(`${root}cart.js`);
          if (cartRes.ok) {
            const cart = await cartRes.json();
            // Cart total is in cents in Shopify's cart.js response
            cartSubtotalCents = cart.total_price;
            console.log("[PopupManager] Cart subtotal for discount:", {
              cents: cartSubtotalCents,
              dollars: cartSubtotalCents ? (cartSubtotalCents / 100).toFixed(2) : 'N/A'
            });
          }
        } catch (e) {
          console.warn("[PopupManager] Failed to fetch cart total for discount:", e);
        }

        // For bundle discounts, pass the selected product IDs so discount is scoped to them
        await handleIssueDiscount({
          cartSubtotalCents,
          selectedProductIds: shouldApplyBundleDiscount ? productIds : undefined,
          bundleDiscountPercent: shouldApplyBundleDiscount ? bundleDiscount : undefined,
        });
      }

      // Refresh cart drawer using Section Rendering API response
      await refreshCartDrawer(cartData, root)

    } catch (error) {
      console.error("[PopupManager] Error adding to cart:", error);
      throw error;
    }
  };

  // Legacy upsell products and cart data loading removed - now handled by pre-display hooks


  // Debug logging for storefront popup configuration
  try {
    console.log("[PopupManagerPreact] Rendering campaign", {
      id: campaign.id,
      templateType: campaign.templateType,
      contentConfig: campaign.contentConfig,
      designConfig: campaign.designConfig,
    });
  } catch {
    // ignore logging errors
  }

  const decorateUrl = (url?: string | null) => addUTMParams(url, {
    utmCampaign: (campaign.designConfig as { utmCampaign?: string | null })?.utmCampaign,
    utmSource: (campaign.designConfig as { utmSource?: string | null })?.utmSource,
    utmMedium: (campaign.designConfig as { utmMedium?: string | null })?.utmMedium,
  }) || url || undefined;

  const decoratedContentConfig: Record<string, unknown> = {
    ...(campaign.contentConfig as Record<string, unknown>),
  };

  if (decoratedContentConfig.ctaUrl) {
    decoratedContentConfig.ctaUrl = decorateUrl(decoratedContentConfig.ctaUrl as string);
  }
  if (decoratedContentConfig.buttonUrl) {
    decoratedContentConfig.buttonUrl = decorateUrl(decoratedContentConfig.buttonUrl as string);
  }
  if (Array.isArray(decoratedContentConfig.products)) {
    decoratedContentConfig.products = decoratedContentConfig.products.map((p: { url?: string; handle?: string } & Record<string, unknown>) => {
      const url = p.url || (p.handle ? `/products/${p.handle}` : undefined);
      return { ...p, url: decorateUrl(url) };
    });
  }

  // Get transformed image URL from BackgroundImageHook if available
  // This ensures preset background images use the correct App Proxy URL
  const backgroundImageData = preloadedResources?.backgroundImage as
    | { imageUrl?: string; preloaded?: boolean }
    | undefined;
  const transformedImageUrl = backgroundImageData?.imageUrl;

  const decoratedDesignConfig: Record<string, unknown> = {
    ...(campaign.designConfig as Record<string, unknown>),
    globalCustomCSS: campaign.globalCustomCSS,
    customCSS: (campaign.designConfig as Record<string, unknown>)?.customCSS,
    // Override imageUrl with transformed URL from hook (for preset backgrounds)
    ...(transformedImageUrl ? { imageUrl: transformedImageUrl } : {}),
  };

  if (decoratedDesignConfig.buttonUrl) {
    decoratedDesignConfig.buttonUrl = decorateUrl(decoratedDesignConfig.buttonUrl as string);
  }

  const handleProductClick = (product: { id?: string; url?: string; handle?: string }) => {
    trackClick({ action: "product_click", productId: product?.id });
    const root = getShopifyRoot();
    const targetUrl = decorateUrl(product?.url || (product?.handle ? `/products/${product.handle}` : undefined));
    if (!targetUrl) return;
    if (targetUrl.startsWith("http")) {
      window.location.href = targetUrl;
      return;
    }
    const normalized = targetUrl.replace(/^\//, "");
    window.location.href = `${root}${normalized}`;
  };

  // IMPORTANT: Spread designConfig FIRST, then contentConfig
  // This ensures content fields (headline, subheadline, buttonText, etc.)
  // from contentConfig are NOT overwritten by any accidentally included
  // content fields in designConfig (which should only have design fields)
  return h(Component, {
    config: {
      ...decoratedDesignConfig,
      ...decoratedContentConfig,
      id: campaign.id,
      campaignId: campaign.id,
      currentCartTotal,
      // Design tokens as CSS custom properties (--rb-background, --rb-primary, etc.)
      // This enables theme-aware styling without complex token resolution client-side
      designTokensCSS: campaign.designTokensCSS,
      // Show "Powered by Revenue Boost" branding for free tier
      showBranding: campaign.showBranding,
      // Pass discount config if enabled
      discount: campaign.discountConfig?.enabled ? {
        enabled: true,
        code: campaign.discountConfig.code || '',
        percentage: (campaign.discountConfig.valueType === "PERCENTAGE" || campaign.discountConfig.type === "percentage")
          ? campaign.discountConfig.value
          : undefined,
        value: (campaign.discountConfig.valueType === "FIXED_AMOUNT" || campaign.discountConfig.type === "fixed_amount")
          ? campaign.discountConfig.value
          : undefined,
        type: campaign.discountConfig.valueType || campaign.discountConfig.type,
        behavior: campaign.discountConfig.behavior,
        expiryDays: campaign.discountConfig.expiryDays,
        description: campaign.discountConfig.description,
      } : undefined,
      // Inject preloaded products if available
      ...(preloadedResources.products ? { products: preloadedResources.products } : {}),
    },
    isVisible,
    onClose: handleCloseWithAnimation,
    onSubmit: handleSubmit,
    issueDiscount: handleIssueDiscount,
    campaignId: campaign.id,
    renderInline: false,
    onEmailRecovery: handleEmailRecovery,
    // Pass preloaded cart data for Cart Abandonment
    cartItems: (preloadedResources.cart as { items?: unknown[] } | undefined)?.items,
    cartTotal: (preloadedResources.cart as { total?: number } | undefined)?.total,
    // Pass preloaded inventory for Flash Sale
    inventoryTotal: (preloadedResources.inventory as { total?: number } | undefined)?.total,
    onTrack: trackClick,
    // Pass onCtaClick for popups that use it (FlashSale, Announcement, etc.)
    onCtaClick: () => trackClick({ action: "cta_click" }),
    onAddToCart: handleAddToCart,
    onProductClick: handleProductClick,
  });
}

/**
 * Render a popup into the DOM
 */
export function renderPopup(
  campaign: StorefrontCampaign,
  onClose: () => void,
  loader: ComponentLoader,
  api: ApiClient,
  onShow?: (campaignId: string) => void,
  triggerContext?: { productId?: string; [key: string]: unknown }
): () => void {
  // Create container
  const container = document.createElement("div");
  container.id = `revenue-boost-popup-${campaign.id}`;
  document.body.appendChild(container);

  // Render popup
  render(
    h(PopupManagerPreact, {
      campaign,
      onClose: () => {
        onClose();
        cleanup();
      },
      onShow,
      loader,
      api,
      triggerContext,
      globalCustomCSS: campaign.globalCustomCSS,
    }),
    container
  );

  // Cleanup function
  function cleanup() {
    render(null, container);
    container.remove();
  }

  return cleanup;
}
