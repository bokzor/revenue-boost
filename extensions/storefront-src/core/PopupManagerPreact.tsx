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

      // Return the discount code if available
      return result.discountCode;
    } catch (err) {
      console.error("[PopupManager] Failed to submit lead:", err);
      throw err;
    }
  };

  if (loading) {
    return h("div", {
      style: {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 999999
      }
    }, "Loading...");
  }

  if (error) {
    console.error("[PopupManager] Error:", error);
    return null;
  }

  if (!Component) {
    return null;
  }

  // Render the loaded component
  return h(Component, {
    config: {
      ...campaign.contentConfig,
      ...campaign.designConfig,
      id: campaign.id,
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

