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
}

export interface PopupManagerProps {
  campaign: StorefrontCampaign;
  onClose: () => void;
  onShow?: (campaignId: string) => void;
  loader: ComponentLoader;
  api: ApiClient;
}

function getShopifyRoot(): string {
  try {
    const w: any = window as any;
    return w?.Shopify?.routes?.root || "/";
  } catch {
    return "/";
  }
}

async function applyDiscountViaAjax(code: string): Promise<boolean> {
  if (!code) return false;

  try {
    const root = getShopifyRoot();
    const response = await fetch(`${root}cart/update.js`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ discount: code }),
    });

    if (!response.ok) {
      let message = "";
      try {
        message = await response.text();
      } catch {
        // ignore
      }
      console.error("[PopupManager] Failed to apply discount via AJAX:", message || response.status);
      return false;
    }

    try {
      const cart = await response.json();
      if (cart) {
        document.dispatchEvent(new CustomEvent("cart:refresh", { detail: cart }));
      }
    } catch {
      // ignore JSON parse errors
    }

    document.dispatchEvent(new CustomEvent("cart:discount-applied", { detail: { code } }));
    document.dispatchEvent(new CustomEvent("cart:updated"));
    return true;
  } catch (error) {
    console.error("[PopupManager] Error applying discount via AJAX:", error);
    return false;
  }
}

export function PopupManagerPreact({ campaign, onClose, onShow, loader, api }: PopupManagerProps) {
  const [Component, setComponent] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPopupComponent() {
      try {
        console.log("[PopupManager] Loading component for:", campaign.templateType);
        const comp = await loader.loadComponent(campaign.templateType);

        if (mounted) {
          setComponent(() => comp as ComponentType<Record<string, unknown>>);
          setLoading(false);
          onShow?.(campaign.id);
        }
      } catch (err) {
        console.error("[PopupManager] Failed to load component:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load popup");
          setLoading(false);
        }
      }
    }

    loadPopupComponent();

    return () => {
      mounted = false;
    };
  }, [campaign.id, campaign.templateType, loader, onShow]);

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

      const result = await api.submitLead({
        email: data.email,
        campaignId: campaign.id,
        sessionId: session.getSessionId(),
        visitorId: session.getVisitorId(),
        consent: data.gdprConsent,
        firstName: data.name,
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

          // Add to cart using Shopify's Cart API
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
            }),
          });

          if (!cartResponse.ok) {
            console.error("[PopupManager] Failed to add free gift to cart:", await cartResponse.text());
          } else {
            console.log("[PopupManager] Free gift added to cart successfully");

            // Trigger multiple cart update events for compatibility with different themes
            document.dispatchEvent(new CustomEvent('cart:updated'));
            document.dispatchEvent(new CustomEvent('cart.requestUpdate'));

            // Trigger Shopify theme events
            if (typeof window !== 'undefined') {
              const w = window as any;

              // Dawn theme and similar
              if (w.Shopify?.theme?.cart) {
                w.Shopify.theme.cart.getCart?.();
              }

              // Debut theme
              if (w.theme?.cart) {
                w.theme.cart.getCart?.();
              }

              // Fetch cart to trigger section rendering
              fetch('/cart.js')
                .then(res => res.json())
                .then(cart => {
                  // Dispatch with cart data
                  document.dispatchEvent(new CustomEvent('cart:refresh', { detail: cart }));

                  // Update cart count in header (common selector)
                  const cartCount = document.querySelector('.cart-count, [data-cart-count], .cart__count');
                  if (cartCount && cart.item_count !== undefined) {
                    cartCount.textContent = String(cart.item_count);
                  }
                })
                .catch(err => console.error("[PopupManager] Failed to fetch cart:", err));
            }
          }
        } catch (cartError) {
          console.error("[PopupManager] Error adding free gift to cart:", cartError);
          // Don't fail the whole flow if cart addition fails
        }
      }

      // Auto-apply discount via AJAX when configured to do so
      const discountCode = result.discountCode;
      const deliveryMode = (campaign.discountConfig as any)?.deliveryMode;

      const shouldAutoApply =
        !!discountCode &&
        (deliveryMode === "auto_apply_only" || deliveryMode === "show_code_fallback");

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

      const result = await api.issueDiscount({
        campaignId: campaign.id,
        sessionId: session.getSessionId(),
        cartSubtotalCents: options?.cartSubtotalCents,
      });

      if (!result.success) {
        console.error("[PopupManager] Failed to issue discount:", result.error);
        return null;
      }

      const code = result.code;
      const autoApplyMode = result.autoApplyMode || "ajax";
      const deliveryMode = (campaign.discountConfig as any)?.deliveryMode;

      const shouldAutoApply =
        !!code &&
        autoApplyMode !== "none" &&
        (deliveryMode === "auto_apply_only" || deliveryMode === "show_code_fallback");

      if (shouldAutoApply) {
        // Fire-and-forget; don't block popup interactions
        void applyDiscountViaAjax(code);
      }

      return result;
    } catch (err) {
      console.error("[PopupManager] Error issuing discount:", err);
      return null;
    }
  };


  // Don't render anything while loading - this prevents showing "Loading..." to users
  if (loading || !Component) {
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
      const w: any = window as any;
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

      const result = await api.emailRecovery({
        campaignId: campaign.id,
        email,
        cartSubtotalCents,
        cartItems: cartData?.items,
      });

      if (!result.success) {
        console.error("[PopupManager] Email recovery failed:", result.error);
        throw new Error(result.error || "Email recovery failed");
      }

      const code = result.discountCode;
      const autoApplyMode = result.autoApplyMode || "ajax";
      const deliveryMode = (campaign.discountConfig as any)?.deliveryMode;

      const shouldAutoApply =
        !!code &&
        autoApplyMode !== "none" &&
        (deliveryMode === "auto_apply_only" || deliveryMode === "show_code_fallback");

      if (shouldAutoApply && code) {
        // Fire-and-forget; don't block popup interactions
        void applyDiscountViaAjax(code);
      }

      // For modes that are meant to show the code in the popup, don't redirect automatically.
      if (
        deliveryMode === "show_code_always" ||
        deliveryMode === "show_in_popup_authorized_only"
      ) {
        return code || undefined;
      }

      const root = getShopifyRoot();
      const contentConfig = (campaign.contentConfig || {}) as any;
      const configuredUrl =
        typeof contentConfig.ctaUrl === "string" && contentConfig.ctaUrl.trim() !== ""
          ? contentConfig.ctaUrl
          : "checkout";

      const normalizedPath = configuredUrl.replace(/^\//, "");
      window.location.href = `${root}${normalizedPath}`;

      return code || undefined;
    } catch (error) {
      console.error("[PopupManager] Error during email recovery flow:", error);
      throw error;
    }
  };

  const [upsellProducts, setUpsellProducts] = useState<any[] | null>(null);

  // Lazy-load upsell products for PRODUCT_UPSELL campaigns based on campaignId
  // Lazy-load upsell products for PRODUCT_UPSELL campaigns based on campaignId
  useEffect(() => {
    if (campaign.templateType !== "PRODUCT_UPSELL") {
      return;
    }

    let cancelled = false;

    const loadUpsellProducts = async () => {
      try {
        const url = `/apps/revenue-boost/api/upsell-products?campaignId=${encodeURIComponent(campaign.id)}`;
        const res = await fetch(url, { credentials: "same-origin" });
        if (!res.ok) {
          console.warn("[PopupManager] Upsell products request failed:", res.status);
          return;
        }

        const json = await res.json();
        if (!cancelled) {
          setUpsellProducts(Array.isArray(json.products) ? json.products : []);
        }
      } catch (err) {
        console.error("[PopupManager] Failed to load upsell products:", err);
      }
    };

    void loadUpsellProducts();

    return () => {
      cancelled = true;
    };
  }, [campaign.id, campaign.templateType]);

  // Fetch cart data for CART_ABANDONMENT campaigns
  const [cartData, setCartData] = useState<{ items: any[]; total: number } | null>(null);

  useEffect(() => {
    if (campaign.templateType !== "CART_ABANDONMENT") {
      return;
    }

    let cancelled = false;

    const loadCartData = async () => {
      try {
        const res = await fetch("/cart.js");
        if (!res.ok) {
          console.warn("[PopupManager] Failed to fetch cart data:", res.status);
          return;
        }

        const cart = await res.json();
        if (!cancelled) {
          setCartData({
            items: cart.items || [],
            total: cart.total_price ? cart.total_price / 100 : 0,
          });
        }
      } catch (err) {
        console.error("[PopupManager] Error loading cart data:", err);
      }
    };

    void loadCartData();

    return () => {
      cancelled = true;
    };
  }, [campaign.id, campaign.templateType]);


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

  return h(Component, {
    config: {
      ...campaign.contentConfig,
      ...campaign.designConfig,
      id: campaign.id,
      currentCartTotal,
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
        deliveryMode: campaign.discountConfig.deliveryMode,
        expiryDays: campaign.discountConfig.expiryDays,
        description: campaign.discountConfig.description,
      } : undefined,
      // If we have upsell products, inject them so ProductUpsellPopup can render them
      ...(upsellProducts ? { products: upsellProducts } : {}),
    },
    isVisible: true,
    onClose,
    onSubmit: handleSubmit,
    issueDiscount: handleIssueDiscount,
    campaignId: campaign.id,
    renderInline: false,
    onEmailRecovery: handleEmailRecovery,
    // Pass cart data for Cart Abandonment
    cartItems: cartData?.items,
    cartTotal: cartData?.total,
    onTrack: trackClick,
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
  onShow?: (campaignId: string) => void
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

