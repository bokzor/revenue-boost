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
import { requestChallengeToken, challengeTokenStore } from "~/domains/storefront/services/challenge-token.client";
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

export function PopupManagerPreact({ campaign, onClose, onShow, loader, api }: PopupManagerProps) {
  const [Component, setComponent] = useState<ComponentType<Record<string, unknown>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [preloadedResources, setPreloadedResources] = useState<Record<string, any> | null>(null);

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
            session.getVisitorId()
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
          setChallengeToken(hooksResult.loadedResources.challengeToken);
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
  }, [campaign.id, campaign.templateType, loader, onShow, api]);

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
      const autoApplyMode = result.autoApplyMode || "ajax";
      const deliveryMode = (campaign.discountConfig as any)?.deliveryMode;

      console.log("[PopupManager] 🎟️ Discount issued:", {
        code,
        autoApplyMode,
        deliveryMode,
        campaignId: campaign.id,
      });

      const shouldAutoApply =
        !!code &&
        autoApplyMode !== "none" &&
        (deliveryMode === "auto_apply_only" || deliveryMode === "show_code_fallback");

      console.log("[PopupManager] 🎟️ Should auto-apply discount?", {
        shouldAutoApply,
        hasCode: !!code,
        autoApplyMode,
        deliveryMode,
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

      // Get cart items from preloaded resources
      const cartItems = preloadedResources?.cart?.items;

      const result = await api.emailRecovery({
        campaignId: campaign.id,
        email,
        cartSubtotalCents,
        cartItems,
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

  const handleAddToCart = async (productIds: string[]) => {
    try {
      console.log("[PopupManager] Adding products to cart:", productIds);

      if (!productIds || productIds.length === 0) return;

      // Get products from preloaded resources
      const products = preloadedResources?.products || [];
      const itemsToAdd: { id: string; quantity: number }[] = [];

      for (const pid of productIds) {
        const product = products.find((p: any) => p.id === pid);
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

      // Add to cart using Shopify's Cart API
      const root = getShopifyRoot();
      const cartResponse = await fetch(`${root}cart/add.js`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsToAdd,
        }),
      });

      if (!cartResponse.ok) {
        console.error("[PopupManager] Failed to add to cart:", await cartResponse.text());
        throw new Error("Failed to add items to cart");
      }

      console.log("[PopupManager] Items added to cart successfully");

      // Check if we need to apply a discount
      if (campaign.discountConfig?.enabled) {
        await handleIssueDiscount();
      }

      // Trigger update events
      document.dispatchEvent(new CustomEvent("cart:updated"));
      document.dispatchEvent(new CustomEvent("cart.requestUpdate"));

      // Fetch new cart to ensure UI is in sync
      try {
        const cartRes = await fetch(`${root}cart.js`);
        if (cartRes.ok) {
          const cart = await cartRes.json();
          document.dispatchEvent(new CustomEvent("cart:refresh", { detail: cart }));

          // Update cart count logic (compatible with common themes)
          const cartCount = document.querySelector(".cart-count, [data-cart-count], .cart__count");
          if (cartCount && cart.item_count !== undefined) {
            cartCount.textContent = String(cart.item_count);
          }
        }
      } catch (e) {
        console.error("Error fetching cart after update", e);
      }

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

  return h(Component, {
    config: {
      ...campaign.contentConfig,
      ...campaign.designConfig,
      id: campaign.id,
      campaignId: campaign.id,
      challengeToken: challengeToken || undefined,
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
    cartItems: preloadedResources.cart?.items,
    cartTotal: preloadedResources.cart?.total,
    // Pass preloaded inventory for Flash Sale
    inventoryTotal: preloadedResources.inventory?.total,
    onTrack: trackClick,
    onAddToCart: handleAddToCart,
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

