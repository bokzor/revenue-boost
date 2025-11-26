/**
 * PopupManagerPreact - Preact-based popup manager for storefront
 *
 * Renders popups using lazy-loaded components
 */

import { h, render, type ComponentType } from "preact";
import { useState, useEffect } from "preact/hooks";
import { ComponentLoader, type TemplateType } from "./component-loader";
import type { ApiClient } from "./api";
import { session } from "./session";
import { challengeTokenStore } from "./challenge-token";
import { executeHooksForCampaign, clearCampaignCache } from "./hooks";

export interface StorefrontCampaign {
  id: string;
  name: string;
  templateType: TemplateType;
  contentConfig: Record<string, unknown>;
  designConfig: Record<string, unknown>;
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

function getShopifyRoot(): string {
  try {
    const w = window as unknown as {
      Shopify?: { routes?: { root?: string } };
    };
    return w?.Shopify?.routes?.root || "/";
  } catch {
    return "/";
  }
}

async function applyDiscountViaAjax(code: string): Promise<boolean> {
  if (!code) {
    console.warn("[PopupManager] Cannot apply discount: no code provided");
    return false;
  }

  console.log("[PopupManager] 🎟️ Attempting to apply discount code via AJAX:", code);

  try {
    const root = getShopifyRoot();
    const url = `${root}cart/update.js`;
    console.log("[PopupManager] 🎟️ Sending discount to:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ discount: code }),
    });

    console.log("[PopupManager] 🎟️ Discount application response status:", response.status);

    if (!response.ok) {
      let message = "";
      try {
        message = await response.text();
      } catch {
        // ignore
      }
      console.error("[PopupManager] ❌ Failed to apply discount via AJAX:", {
        status: response.status,
        statusText: response.statusText,
        message: message || "(no error message)",
        code,
      });
      return false;
    }

    try {
      const cart = await response.json();
      console.log("[PopupManager] ✅ Discount applied successfully. Cart updated:", {
        code,
        itemCount: cart?.item_count,
        totalPrice: cart?.total_price,
        appliedDiscount: cart?.total_discount,
      });

      if (cart) {
        document.dispatchEvent(new CustomEvent("cart:refresh", { detail: cart }));
      }
    } catch (parseError) {
      console.warn("[PopupManager] ⚠️ Discount may have been applied, but failed to parse cart response:", parseError);
    }

    document.dispatchEvent(new CustomEvent("cart:discount-applied", { detail: { code } }));
    document.dispatchEvent(new CustomEvent("cart:updated"));
    console.log("[PopupManager] 🎟️ Discount application events dispatched");
    return true;
  } catch (error) {
    console.error("[PopupManager] ❌ Error applying discount via AJAX:", {
      error,
      code,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// Type definitions for cart drawer elements and window extensions
interface CartDrawerElement extends Element {
  renderContents?: (payload: { sections?: Record<string, string>; [key: string]: unknown }) => void;
  getSectionsToRender?: () => Array<{ id: string; section?: string; selector?: string }>;
}

interface CartNotificationElement extends Element {
  renderContents?: (payload: { sections?: Record<string, string>; [key: string]: unknown }) => void;
  getSectionsToRender?: () => Array<{ id: string; section?: string; selector?: string }>;
}

interface WindowWithTheme {
  Shopify?: {
    theme?: {
      cart?: { getCart?: () => void; refresh?: () => void };
      sections?: { load?: (section: string) => void };
    };
  };
  theme?: { cart?: { getCart?: () => void; refresh?: () => void } };
  cart?: { refresh?: () => void };
}

/**
 * Detect which sections to request for cart drawer refresh.
 * Dawn theme and similar themes use cart-drawer and cart-icon-bubble.
 */
function getSectionsToRender(): string[] {
  const sections: string[] = [];

  // Check for Dawn-style cart-drawer custom element
  const cartDrawer = document.querySelector('cart-drawer') as CartDrawerElement | null;
  if (cartDrawer?.getSectionsToRender) {
    const drawerSections = cartDrawer.getSectionsToRender();
    drawerSections.forEach(s => {
      if (s.id && !sections.includes(s.id)) {
        sections.push(s.id);
      }
    });
  }

  // Check for cart-notification custom element
  const cartNotification = document.querySelector('cart-notification') as CartNotificationElement | null;
  if (cartNotification?.getSectionsToRender) {
    const notifSections = cartNotification.getSectionsToRender();
    notifSections.forEach(s => {
      if (s.id && !sections.includes(s.id)) {
        sections.push(s.id);
      }
    });
  }

  // Default sections used by Dawn theme if we couldn't detect dynamically
  if (sections.length === 0) {
    sections.push('cart-drawer', 'cart-icon-bubble');
  }

  return sections;
}

/**
 * Refresh cart drawer after adding items to cart.
 * Uses Section Rendering API response to properly update Dawn theme and similar themes.
 */
async function refreshCartDrawer(
  cartData: { sections?: Record<string, string>; item_count?: number; [key: string]: unknown },
  root: string
): Promise<void> {
  // Trigger comprehensive cart update events for different themes
  document.dispatchEvent(new CustomEvent('cart:updated'));
  document.dispatchEvent(new CustomEvent('cart.requestUpdate'));
  document.dispatchEvent(new CustomEvent('cart:update'));
  document.dispatchEvent(new CustomEvent('cart:change'));
  document.dispatchEvent(new CustomEvent('theme:cart:update'));
  document.dispatchEvent(new CustomEvent('cart:item-added'));
  document.dispatchEvent(new CustomEvent('cart:add'));

  // Dispatch cart refresh with the cart data
  document.dispatchEvent(new CustomEvent('cart:refresh', { detail: cartData }));

  // Update cart count in header (common selectors)
  const cartCountSelectors = '.cart-count, [data-cart-count], .cart__count, #cart-icon-bubble span';
  const cartCount = document.querySelector(cartCountSelectors);
  if (cartCount && cartData.item_count !== undefined) {
    cartCount.textContent = String(cartData.item_count);
  }

  // If we have sections from Section Rendering API, use them to update the drawer
  if (cartData.sections) {
    try {
      // Dawn theme (Web Components) - cart-drawer element
      const cartDrawer = document.querySelector('cart-drawer') as CartDrawerElement | null;
      if (cartDrawer && typeof cartDrawer.renderContents === 'function') {
        console.log("[PopupManager] Refreshing Dawn cart-drawer with sections");
        cartDrawer.renderContents(cartData);
      }

      // Dawn theme - cart-notification element
      const cartNotification = document.querySelector('cart-notification') as CartNotificationElement | null;
      if (cartNotification && typeof cartNotification.renderContents === 'function') {
        console.log("[PopupManager] Refreshing Dawn cart-notification with sections");
        cartNotification.renderContents(cartData);
      }
    } catch (e) {
      console.debug("[PopupManager] Error using renderContents:", e);
    }
  } else {
    // Fallback: fetch sections separately if not included in response
    try {
      const sectionsToRender = getSectionsToRender();
      const sectionsParam = sectionsToRender.join(',');
      const sectionsRes = await fetch(`${root}cart.js?sections=${sectionsParam}`);

      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json() as { sections?: Record<string, string>; item_count?: number };

        // Update cart count if available
        if (sectionsData.item_count !== undefined) {
          const countEl = document.querySelector(cartCountSelectors);
          if (countEl) {
            countEl.textContent = String(sectionsData.item_count);
          }
        }

        // Try Dawn theme renderContents with fetched sections
        const cartDrawer = document.querySelector('cart-drawer') as CartDrawerElement | null;
        if (cartDrawer && typeof cartDrawer.renderContents === 'function' && sectionsData.sections) {
          console.log("[PopupManager] Refreshing Dawn cart-drawer with fetched sections");
          cartDrawer.renderContents(sectionsData);
        }

        const cartNotification = document.querySelector('cart-notification') as CartNotificationElement | null;
        if (cartNotification && typeof cartNotification.renderContents === 'function' && sectionsData.sections) {
          console.log("[PopupManager] Refreshing Dawn cart-notification with fetched sections");
          cartNotification.renderContents(sectionsData);
        }
      }
    } catch (e) {
      console.debug("[PopupManager] Fallback section fetch failed:", e);
    }
  }

  // Also try legacy theme-specific methods as additional fallback
  try {
    const w = window as WindowWithTheme;

    // Dawn/Debut theme methods
    if (typeof w.Shopify?.theme?.cart?.getCart === 'function') {
      w.Shopify.theme.cart.getCart();
    }
    if (typeof w.theme?.cart?.getCart === 'function') {
      w.theme.cart.getCart();
    }
    if (typeof w.theme?.cart?.refresh === 'function') {
      w.theme.cart.refresh();
    }
    if (typeof w.cart?.refresh === 'function') {
      w.cart.refresh();
    }

    // Trigger Shopify section rendering (used by many themes)
    if (typeof w.Shopify?.theme?.sections?.load === 'function') {
      w.Shopify.theme.sections.load('cart-drawer');
    }
  } catch (themeError) {
    console.debug("[PopupManager] Theme-specific cart refresh not available:", themeError);
  }
}

export function PopupManagerPreact({ campaign, onClose, onShow, loader, api, triggerContext }: PopupManagerProps) {
  const [Component, setComponent] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [preloadedResources, setPreloadedResources] = useState<Record<string, unknown> | null>(null);

  // Execute pre-display hooks and load component
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        console.log("[PopupManager] Initializing popup for:", campaign.templateType);

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

        // Set challenge token if loaded via hook
        if (hooksResult.loadedResources.challengeToken) {
          setChallengeToken(hooksResult.loadedResources.challengeToken as string);
        }

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

      // SECURITY: Retrieve challenge token
      const challengeToken = challengeTokenStore.get(campaign.id);

      if (!challengeToken) {
        throw new Error("Security check failed. Please refresh the page.");
      }

      const result = await api.submitLead({
        email: data.email,
        campaignId: campaign.id,
        sessionId: session.getSessionId(),
        visitorId: session.getVisitorId(),
        consent: data.gdprConsent,
        firstName: data.name,
        challengeToken,
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

      // Check if auto-apply is enabled based on behavior field
      const shouldAutoApply =
        !!discountCode && behavior === "SHOW_CODE_AND_AUTO_APPLY";

      if (shouldAutoApply) {
        // Fire-and-forget; don't block the success UI on cart update
        void applyDiscountViaAjax(discountCode);
      }

      // Return the discount code if available (for UI display)
      return discountCode;
    } catch (err) {
      console.error("[PopupManager] Failed to submit lead:", err);
      throw err;
    }
  };

  const handleIssueDiscount = async (options?: { cartSubtotalCents?: number }) => {
    try {
      console.log("[PopupManager] Issuing discount for campaign:", campaign.id, options);

      trackClick({
        action: "issue_discount",
        cartSubtotalCents: options?.cartSubtotalCents,
      });

      // SECURITY: Retrieve challenge token
      const token = challengeTokenStore.get(campaign.id);

      if (!token) {
        console.error("[PopupManager] ❌ Cannot issue discount: no challenge token available");
        return {
          success: false,
          error: "Security check failed. Please refresh the page.",
        };
      }

      console.log("[PopupManager] 🎟️ Using challenge token for discount issuance");

      const result = await api.issueDiscount({
        campaignId: campaign.id,
        sessionId: session.getSessionId(),
        challengeToken: token,
        cartSubtotalCents: options?.cartSubtotalCents,
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

      // Check if auto-apply is enabled based on behavior field
      const shouldAutoApply =
        !!code && behavior === "SHOW_CODE_AND_AUTO_APPLY";

      console.log("[PopupManager] 🎟️ Should auto-apply discount?", {
        shouldAutoApply,
        hasCode: !!code,
        behavior,
      });

      if (shouldAutoApply) {
        console.log("[PopupManager] 🎟️ Auto-applying discount code:", code);
        // Fire-and-forget; don't block popup interactions
        void applyDiscountViaAjax(code);
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

      // Check if auto-apply is enabled based on behavior field
      const shouldAutoApply =
        !!code && behavior === "SHOW_CODE_AND_AUTO_APPLY";

      if (shouldAutoApply && code) {
        // Fire-and-forget; don't block popup interactions
        void applyDiscountViaAjax(code);
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

  function addUTMParams(
    url: string | null | undefined,
    data: { utmCampaign?: string | null; utmSource?: string | null; utmMedium?: string | null },
  ) {
    if (!url || !data?.utmCampaign) return url;
    try {
      const urlObj = new URL(url, url.startsWith("http") ? undefined : "https://placeholder.local");
      urlObj.searchParams.set("utm_campaign", data.utmCampaign);
      if (data.utmSource) urlObj.searchParams.set("utm_source", data.utmSource);
      if (data.utmMedium) urlObj.searchParams.set("utm_medium", data.utmMedium);

      if (!url.startsWith("http")) {
        return `${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      }
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  const handleAddToCart = async (productIds: string[]) => {
    try {
      console.log("[PopupManager] Adding products to cart:", productIds);

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

      // Check if we need to apply a discount
      if (campaign.discountConfig?.enabled) {
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

        await handleIssueDiscount({ cartSubtotalCents });
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

  const decoratedDesignConfig: Record<string, unknown> = {
    ...(campaign.designConfig as Record<string, unknown>),
    globalCustomCSS: campaign.globalCustomCSS,
    customCSS: (campaign.designConfig as Record<string, unknown>)?.customCSS,
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

  return h(Component, {
    config: {
      ...decoratedContentConfig,
      ...decoratedDesignConfig,
      id: campaign.id,
      campaignId: campaign.id,
      challengeToken: challengeToken || undefined,
      currentCartTotal,
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
    isVisible: true,
    onClose,
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
