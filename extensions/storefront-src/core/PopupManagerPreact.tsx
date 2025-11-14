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
}

export interface PopupManagerProps {
  campaign: StorefrontCampaign;
  onClose: () => void;
  onShow?: (campaignId: string) => void;
  loader: ComponentLoader;
  api: ApiClient;
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

  // Handle lead submission
  const handleSubmit = async (data: { email: string; name?: string; gdprConsent?: boolean }) => {
    try {
      console.log("[PopupManager] Submitting lead:", data);

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

      // Return the discount code if available
      return result.discountCode;
    } catch (err) {
      console.error("[PopupManager] Failed to submit lead:", err);
      throw err;
    }
  };

  const handleIssueDiscount = async (options?: { cartSubtotalCents?: number }) => {
    try {
      console.log("[PopupManager] Issuing discount for campaign:", campaign.id, options);
      const result = await api.issueDiscount({
        campaignId: campaign.id,
        sessionId: session.getSessionId(),
        cartSubtotalCents: options?.cartSubtotalCents,
      });

      if (!result.success) {
        console.error("[PopupManager] Failed to issue discount:", result.error);
        return null;
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
    },
    isVisible: true,
    onClose,
    onSubmit: handleSubmit,
    issueDiscount: handleIssueDiscount,
    campaignId: campaign.id,
    renderInline: false,
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

