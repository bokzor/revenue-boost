/**
 * React PopupManager Wrapper
 *
 * Thin React wrapper around PopupManagerCore that provides React-specific
 * state management and lifecycle hooks while delegating core logic to the
 * shared PopupManagerCore class.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { PopupConfig } from "../popups-new/types";
import { SlideInPopup } from "../slideins/SlideInPopup";
import { BannerPopup } from "../notifications/BannerPopup";
import { NewsletterPopup, type NewsletterConfig } from "../popups-new/NewsletterPopup";
import { ScratchCardPopup, type ScratchCardConfig } from "../popups-new/ScratchCardPopup";
import { SpinToWinPopup, type SpinToWinConfig } from "../popups-new/SpinToWinPopup";
import type { StorefrontCampaign } from "~/shared/types/campaign";
import { PopupManagerCore, type PopupManagerCallbacks } from "./PopupManagerCore";

// Re-export types from the original PopupManager for compatibility
export interface CampaignPopupConfig extends PopupConfig {
  campaignId: string;
  name?: string;
  previewMode?: boolean;
  triggerType:
    | "add_to_cart"
    | "exit_intent"
    | "time_delay"
    | "scroll_depth"
    | "checkout_start"
    | "page_load"
    | "product_view"
    | "custom_event"
    | "cart_abandonment";
  triggerConfig: {
    delay?: number;
    scrollPercentage?: number;
    exitSensitivity?: number;
    cartValueThreshold?: number;
    productIds?: string[];
    customEventName?: string;
  };
  templateType?: string;
  priority: number;
  maxDisplays?: number;
  cooldownMinutes?: number;

  // Enhanced configuration for new template types
  cartData?: {
    items: Array<{
      id: string;
      title: string;
      price: string;
      image?: string;
      quantity: number;
    }>;
    total: string;
    currency: string;
    itemCount: number;
  };

  // Product data for upsell popups
  products?: Array<{
    id: string;
    title: string;
    price: string;
    compareAtPrice?: string;
    image?: string;
    variants?: Array<{
      id: string;
      title: string;
      price: string;
      available: boolean;
    }>;
  }>;

  // Discount configuration
  discountConfig?: {
    type: "percentage" | "fixed_amount" | "free_shipping";
    value: number;
    code?: string;
    minimumAmount?: number;
    expiresAt?: string;
  };

  // Newsletter configuration
  newsletterConfig?: {
    provider: "shopify" | "mailchimp" | "klaviyo";
    listId?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
  };

  // Social proof configuration
  socialProofConfig?: {
    type: "recent_purchases" | "visitor_count" | "stock_level";
    message?: string;
    showTimer?: boolean;
    updateInterval?: number;
  };

  // Threshold configuration
  thresholds?: {
    freeShipping?: number;
    currency?: string;
  };

  // Content configuration for interactive popups
  contentConfig?: {
    prizes?: Array<{
      id: string;
      label: string;
      type: "discount" | "free_shipping" | "gift";
      value?: number;
      probability: number;
    }>;
    segments?: Array<{
      color: string;
      label: string;
      probability: number;
    }>;
  };

  // Countdown timer-specific properties
  endDate?: string;
  endTime?: string;
  timezone?: string;
  urgencyMessage?: string;
  showDays?: boolean;
  showStockCounter?: boolean;
  stockCount?: number;
  stockMessage?: string;
  ctaText?: string;
  ctaUrl?: string;
  dismissible?: boolean;
  hideOnExpiry?: boolean;
  expiryMessage?: string;
  colorScheme?: "urgency" | "limited-time" | "flash-sale" | "custom";

  // Flash sale properties
  discountPercentage?: number;
  showCountdown?: boolean;
  countdownDuration?: number;

  // Multi-step newsletter-specific properties
  nameStepEnabled?: boolean;
  nameStepRequired?: boolean;
  preferencesStepEnabled?: boolean;
  preferencesStepRequired?: boolean;
}

export interface PopupManagerProps {
  campaigns: StorefrontCampaign[];
  onPopupShow?: (campaignId: string) => void;
  onPopupClose?: (campaignId: string) => void;
  onPopupClick?: (campaignId: string, buttonUrl?: string) => void;
  onAddToCart?: (variantId: string, quantity: number) => Promise<void>;
  onApplyDiscount?: (discountCode: string) => Promise<void>;
  onUpdateCart?: () => void;
  onSaveForLater?: () => void;
  onShopMore?: () => void;
  renderInline?: boolean;
}

export const PopupManager: React.FC<PopupManagerProps> = ({
  campaigns,
  onPopupShow,
  onPopupClose,
  onPopupClick,
  onAddToCart,
  onApplyDiscount,
  onUpdateCart,
  onSaveForLater,
  onShopMore,
  renderInline = false,
}) => {
  // React state management
  const [activeCampaign, setActiveCampaign] = useState<StorefrontCampaign | null>(null);
  const [_dismissedCampaigns, setDismissedCampaigns] = useState<Set<string>>(new Set());
  const [_cooldownCampaigns, setCooldownCampaigns] = useState<Set<string>>(new Set());

  // Core logic instance
  const coreRef = useRef<PopupManagerCore | null>(null);

  // Initialize core logic
  useEffect(() => {
    const callbacks: PopupManagerCallbacks = {
      onPopupShow,
      onPopupClose,
      onPopupClick,
      onAddToCart,
      onApplyDiscount,
      onUpdateCart,
      onSaveForLater,
      onShopMore,
    };

    coreRef.current = new PopupManagerCore({
      campaigns,
      callbacks,
      renderInline,
    });

    // Sync initial state
    setActiveCampaign(coreRef.current.getActiveCampaign());
    setDismissedCampaigns(coreRef.current.getDismissedCampaigns());
    setCooldownCampaigns(coreRef.current.getCooldownCampaigns());

    return () => {
      coreRef.current?.cleanupTriggers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only initialize once on mount

  // Sync state changes from core to React state
  const syncStateFromCore = useCallback(() => {
    if (!coreRef.current) return;

    setActiveCampaign(coreRef.current.getActiveCampaign());
    setDismissedCampaigns(coreRef.current.getDismissedCampaigns());
    setCooldownCampaigns(coreRef.current.getCooldownCampaigns());
  }, []);

  // Override core state setters to sync with React state
  useEffect(() => {
    if (!coreRef.current) return;

    const originalSetActiveCampaign = coreRef.current.setActiveCampaign.bind(coreRef.current);
    const originalSetDismissedCampaigns = coreRef.current.setDismissedCampaigns.bind(
      coreRef.current
    );
    const originalSetCooldownCampaigns = coreRef.current.setCooldownCampaigns.bind(coreRef.current);

    coreRef.current.setActiveCampaign = (campaign: StorefrontCampaign | null) => {
      originalSetActiveCampaign(campaign);
      setActiveCampaign(campaign);
    };

    coreRef.current.setDismissedCampaigns = (campaigns: Set<string>) => {
      originalSetDismissedCampaigns(campaigns);
      setDismissedCampaigns(campaigns);
    };

    coreRef.current.setCooldownCampaigns = (campaigns: Set<string>) => {
      originalSetCooldownCampaigns(campaigns);
      setCooldownCampaigns(campaigns);
    };
  }, []);

  // Setup triggers when campaigns change
  useEffect(() => {
    if (!coreRef.current) return;

    console.log("[PopupManagerReact] Setting up triggers for campaigns:", campaigns.length);

    const cleanup = coreRef.current.setupTriggers(campaigns);

    return cleanup;
  }, [campaigns]);

  // Wrapper functions that delegate to core
  const _showPopup = useCallback(
    async (campaign: StorefrontCampaign) => {
      if (!coreRef.current) return false;
      const result = await coreRef.current.showPopup(campaign);
      syncStateFromCore();
      return result;
    },
    [syncStateFromCore]
  );

  const closePopup = useCallback(() => {
    if (!coreRef.current) return;
    coreRef.current.closePopup();
    syncStateFromCore();
  }, [syncStateFromCore]);

  const handlePopupClick = useCallback(() => {
    if (!coreRef.current) return;
    coreRef.current.handlePopupClick();
    syncStateFromCore();
  }, [syncStateFromCore]);

  // If no active campaign, render nothing
  if (!activeCampaign) {
    return null;
  }

  // Determine template type for rendering
  const templateType =
    activeCampaign.templateType || activeCampaign.normalizedTemplateType || "modal";
  const resolvedType = templateType.toLowerCase().replace(/_/g, "-");

  console.log("[PopupManager] Template resolution:", {
    campaignId: activeCampaign?.campaignId,
    templateType,
    resolvedType,
  });

  console.log("[PopupManagerReact] Rendering popup with type:", resolvedType);

  // Common props for all popup components

  // Render popup based on template type
  const renderPopup = () => {
    switch (resolvedType) {
      case "modal":
      case "newsletter":
      case "newsletter-elegant":
      case "newsletter-minimal": {
        const content = activeCampaign.contentConfig as any;
        const design = (activeCampaign as any).designConfig || {};

        return (
          <NewsletterPopup
            isVisible={true}
            onClose={closePopup}
            config={
              {
                ...content,
                ...design,
                id: activeCampaign.campaignId || (activeCampaign as any).id,
                campaignId: activeCampaign.campaignId || (activeCampaign as any).id,
                headline: content.headline || activeCampaign.title || "Join our newsletter",
                subheadline: content.subheadline || activeCampaign.description || "",
                buttonText: content.buttonText || activeCampaign.buttonText || "Subscribe",
                emailPlaceholder: content.emailPlaceholder || "Enter your email",
                successMessage: content.successMessage || "Thanks!",
                failureMessage: content.failureMessage || "Please try again",
                backgroundColor:
                  design.backgroundColor || activeCampaign.backgroundColor || "#FFFFFF",
                textColor: design.textColor || activeCampaign.textColor || "#000000",
                buttonColor: design.buttonColor || activeCampaign.buttonColor || "#007BFF",
                buttonTextColor:
                  design.buttonTextColor || activeCampaign.buttonTextColor || "#FFFFFF",
                imageUrl: design.imageUrl || activeCampaign.imageUrl,
                imagePosition: design.imagePosition || activeCampaign.imagePosition,
                theme: design.theme || (activeCampaign as any).theme,
                discount: activeCampaign.discountConfig?.enabled
                  ? {
                      enabled: true,
                      code: activeCampaign.discountConfig.code || "",
                      percentage:
                        activeCampaign.discountConfig.valueType === "PERCENTAGE"
                          ? activeCampaign.discountConfig.value
                          : undefined,
                      value:
                        activeCampaign.discountConfig.valueType === "FIXED_AMOUNT"
                          ? activeCampaign.discountConfig.value
                          : undefined,
                      type: activeCampaign.discountConfig.valueType,
                      behavior: activeCampaign.discountConfig.behavior,
                      expiryDays: activeCampaign.discountConfig.expiryDays,
                      description: activeCampaign.discountConfig.description,
                    }
                  : undefined,
              } as unknown as NewsletterConfig
            }
          />
        );
      }

      case "spin-to-win":
      // falls through
      case "lottery": {
        const content = activeCampaign.contentConfig as any;
        const design = (activeCampaign as any).designConfig || {};

        return (
          <SpinToWinPopup
            isVisible={true}
            onClose={closePopup}
            config={
              {
                // Flatten content + design like the storefront runtime
                ...content,
                ...design,
                // IDs
                id: activeCampaign.campaignId || (activeCampaign as any).id,
                campaignId: activeCampaign.campaignId || (activeCampaign as any).id,
                // Ensure wheelSegments are present for the wheel
                wheelSegments: content.wheelSegments || [],
                // Fallbacks for core copy
                headline: content.headline || activeCampaign.title || "Spin to Win!",
                subheadline: content.subheadline || activeCampaign.description || "",
                spinButtonText: content.spinButtonText || "Spin Now!",
                emailRequired:
                  typeof content.emailRequired === "boolean" ? content.emailRequired : true,
                emailPlaceholder: content.emailPlaceholder || "Enter your email",
                failureMessage: content.failureMessage || "Try again next time!",
                // Design fallbacks
                backgroundColor:
                  design.backgroundColor || activeCampaign.backgroundColor || "#FFFFFF",
                textColor: design.textColor || activeCampaign.textColor || "#000000",
                buttonColor: design.buttonColor || activeCampaign.buttonColor || "#007BFF",
                buttonTextColor:
                  design.buttonTextColor || activeCampaign.buttonTextColor || "#FFFFFF",
              } as unknown as SpinToWinConfig
            }
          />
        );
      }

      case "scratch-card": {
        const content = activeCampaign.contentConfig as any;
        const design = (activeCampaign as any).designConfig || {};

        return (
          <ScratchCardPopup
            isVisible={true}
            onClose={closePopup}
            config={
              {
                ...content,
                ...design,
                id: activeCampaign.campaignId || (activeCampaign as any).id,
                campaignId: activeCampaign.campaignId || (activeCampaign as any).id,
                prizes: content.prizes || [],
                headline: content.headline || activeCampaign.title || "Scratch to Win!",
                subheadline: content.subheadline || activeCampaign.description || "",
                emailRequired:
                  typeof content.emailRequired === "boolean" ? content.emailRequired : true,
                emailPlaceholder: content.emailPlaceholder || "Enter your email",
                scratchInstruction: content.scratchInstruction || "Scratch to reveal your prize!",
                scratchThreshold:
                  typeof content.scratchThreshold === "number" ? content.scratchThreshold : 50,
                scratchRadius:
                  typeof content.scratchRadius === "number" ? content.scratchRadius : 20,
                backgroundColor:
                  design.backgroundColor || activeCampaign.backgroundColor || "#FFFFFF",
                textColor: design.textColor || activeCampaign.textColor || "#000000",
                buttonColor: design.buttonColor || activeCampaign.buttonColor || "#007BFF",
                buttonTextColor:
                  design.buttonTextColor || activeCampaign.buttonTextColor || "#FFFFFF",
              } as unknown as ScratchCardConfig
            }
          />
        );
      }

      case "slide-in":
      case "slide":
        return (
          <SlideInPopup
            isVisible={true}
            onClose={closePopup}
            onButtonClick={handlePopupClick}
            config={{
              ...activeCampaign,
              title: activeCampaign.title || activeCampaign.name || "Popup",
              description: activeCampaign.description || "",
              buttonText: activeCampaign.buttonText || "Click Here",
              backgroundColor: activeCampaign.backgroundColor || "#FFFFFF",
              textColor: activeCampaign.textColor || "#000000",
              buttonColor: activeCampaign.buttonColor || "#3B82F6",
              buttonTextColor: activeCampaign.buttonTextColor || "#FFFFFF",
              position: ["left", "right"].includes(activeCampaign.position as string)
                ? (activeCampaign.position as "left" | "right")
                : "right",
              size:
                activeCampaign.size === "small" ||
                activeCampaign.size === "medium" ||
                activeCampaign.size === "large"
                  ? activeCampaign.size
                  : "medium",
            }}
          />
        );

      case "banner":
        return (
          <BannerPopup
            isVisible={true}
            onClose={closePopup}
            onButtonClick={handlePopupClick}
            config={{
              ...activeCampaign,
              title: activeCampaign.title || activeCampaign.name || "Popup",
              description: activeCampaign.description || "",
              buttonText: activeCampaign.buttonText || "Click Here",
              backgroundColor: activeCampaign.backgroundColor || "#FFFFFF",
              textColor: activeCampaign.textColor || "#000000",
              buttonColor: activeCampaign.buttonColor || "#3B82F6",
              buttonTextColor: activeCampaign.buttonTextColor || "#FFFFFF",
              position:
                activeCampaign.position === "top" || activeCampaign.position === "bottom"
                  ? activeCampaign.position
                  : "top",
              size:
                activeCampaign.size === "small" ||
                activeCampaign.size === "medium" ||
                activeCampaign.size === "large"
                  ? activeCampaign.size
                  : "medium",
            }}
          />
        );

      default:
        return (
          <NewsletterPopup
            isVisible={true}
            onClose={closePopup}
            config={
              {
                ...activeCampaign,
                headline:
                  activeCampaign.contentConfig?.headline || activeCampaign.title || "Welcome",
                subheadline:
                  activeCampaign.contentConfig?.subheadline || activeCampaign.description || "",
                buttonText:
                  activeCampaign.contentConfig?.buttonText ||
                  activeCampaign.buttonText ||
                  "Continue",
                emailPlaceholder:
                  (activeCampaign.contentConfig as any)?.emailPlaceholder || "Enter your email",
                backgroundColor: activeCampaign.backgroundColor || "#FFFFFF",
                textColor: activeCampaign.textColor || "#000000",
                buttonColor: activeCampaign.buttonColor || "#007BFF",
                buttonTextColor: activeCampaign.buttonTextColor || "#FFFFFF",
                imageUrl: activeCampaign.imageUrl,
                imagePosition: activeCampaign.imagePosition,
                theme: (activeCampaign as any).theme,
                discount: activeCampaign.discountConfig?.enabled
                  ? {
                      enabled: true,
                      code: activeCampaign.discountConfig.code || "",
                      percentage:
                        activeCampaign.discountConfig.valueType === "PERCENTAGE"
                          ? activeCampaign.discountConfig.value
                          : undefined,
                      value:
                        activeCampaign.discountConfig.valueType === "FIXED_AMOUNT"
                          ? activeCampaign.discountConfig.value
                          : undefined,
                      type: activeCampaign.discountConfig.valueType,
                      behavior: activeCampaign.discountConfig.behavior,
                      expiryDays: activeCampaign.discountConfig.expiryDays,
                      description: activeCampaign.discountConfig.description,
                    }
                  : undefined,
              } as unknown as NewsletterConfig
            }
          />
        );
    }
  };

  return renderPopup();
};
