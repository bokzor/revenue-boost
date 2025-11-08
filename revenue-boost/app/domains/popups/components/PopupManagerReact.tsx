/**
 * React PopupManager Wrapper
 *
 * Thin React wrapper around PopupManagerCore that provides React-specific
 * state management and lifecycle hooks while delegating core logic to the
 * shared PopupManagerCore class.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { PopupConfig } from "./BasePopup";
import { ModalPopup } from "./ModalPopup";
import { SlideInPopup } from "./SlideInPopup";
import { BannerPopup } from "./BannerPopup";
import { ProductUpsellPopup } from "./ProductUpsellPopup";
import { MinimumBasketPopup } from "./MinimumBasketPopup";
import { CartAbandonmentPopup } from "./CartAbandonmentPopup";
import { FreeShippingPopup } from "./FreeShippingPopup";
import { NewsletterPopup } from "./NewsletterPopup";
import { ScratchCardPopup, type ScratchCardConfig } from "./ScratchCardPopup";
import { SpinToWinPopup, type SpinToWinConfig } from "./SpinToWinPopup";
import { SocialProofPopup } from "./social-proof/SocialProofPopup";
import { CountdownTimerBanner } from "~/domains/campaigns/components/sales/CountdownTimerBanner";
import { FlashSaleModal } from "~/domains/campaigns/components/sales/FlashSaleModal";
import { MultiStepNewsletterForm } from "~/domains/campaigns/components/newsletter/MultiStepNewsletterForm";
import type { StorefrontCampaign } from "~/shared/types/campaign";
import {
  PopupManagerCore,
  type PopupManagerCallbacks,
} from "./PopupManagerCore";

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
    customFields?: Record<string, any>;
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
  const [activeCampaign, setActiveCampaign] =
    useState<StorefrontCampaign | null>(null);
  const [displayedCampaigns, setDisplayedCampaigns] = useState<Set<string>>(
    new Set(),
  );
  const [cooldownCampaigns, setCooldownCampaigns] = useState<Set<string>>(
    new Set(),
  );

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
    setDisplayedCampaigns(coreRef.current.getDisplayedCampaigns());
    setCooldownCampaigns(coreRef.current.getCooldownCampaigns());

    return () => {
      coreRef.current?.cleanupTriggers();
    };
  }, []);

  // Sync state changes from core to React state
  const syncStateFromCore = useCallback(() => {
    if (!coreRef.current) return;

    setActiveCampaign(coreRef.current.getActiveCampaign());
    setDisplayedCampaigns(coreRef.current.getDisplayedCampaigns());
    setCooldownCampaigns(coreRef.current.getCooldownCampaigns());
  }, []);

  // Override core state setters to sync with React state
  useEffect(() => {
    if (!coreRef.current) return;

    const originalSetActiveCampaign = coreRef.current.setActiveCampaign.bind(
      coreRef.current,
    );
    const originalSetDisplayedCampaigns =
      coreRef.current.setDisplayedCampaigns.bind(coreRef.current);
    const originalSetCooldownCampaigns =
      coreRef.current.setCooldownCampaigns.bind(coreRef.current);

    coreRef.current.setActiveCampaign = (
      campaign: StorefrontCampaign | null,
    ) => {
      originalSetActiveCampaign(campaign);
      setActiveCampaign(campaign);
    };

    coreRef.current.setDisplayedCampaigns = (campaigns: Set<string>) => {
      originalSetDisplayedCampaigns(campaigns);
      setDisplayedCampaigns(campaigns);
    };

    coreRef.current.setCooldownCampaigns = (campaigns: Set<string>) => {
      originalSetCooldownCampaigns(campaigns);
      setCooldownCampaigns(campaigns);
    };
  }, []);

  // Setup triggers when campaigns change
  useEffect(() => {
    if (!coreRef.current) return;

    console.log(
      "[PopupManagerReact] Setting up triggers for campaigns:",
      campaigns.length,
    );

    const cleanup = coreRef.current.setupTriggers(campaigns);

    return cleanup;
  }, [campaigns]);

  // Wrapper functions that delegate to core
  const showPopup = useCallback(
    async (campaign: StorefrontCampaign) => {
      if (!coreRef.current) return false;
      const result = await coreRef.current.showPopup(campaign);
      syncStateFromCore();
      return result;
    },
    [syncStateFromCore],
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
    activeCampaign.templateType ||
    activeCampaign.normalizedTemplateType ||
    "modal";
  const resolvedType = templateType.toLowerCase().replace(/_/g, "-");

  console.log("[PopupManager] Template resolution:", {
    campaignId: activeCampaign?.campaignId,
    templateType,
    resolvedType,
  });

  console.log("[PopupManagerReact] Rendering popup with type:", resolvedType);

  // Common props for all popup components
  const commonProps = {
    config: activeCampaign,
    isVisible: true,
    onClose: closePopup,
    onButtonClick: handlePopupClick,
    renderInline,
  };

  // Render popup based on template type
  const renderPopup = () => {
    switch (resolvedType) {
      case "modal":
      case "newsletter":
      case "newsletter-elegant":
      case "newsletter-minimal":
        return (
          <ModalPopup
            {...commonProps}
            config={{
              ...activeCampaign,
              title: activeCampaign.title || activeCampaign.name || "Popup",
              description: activeCampaign.description || "",
              buttonText: activeCampaign.buttonText || "Click Here",
              backgroundColor: activeCampaign.backgroundColor || "#FFFFFF",
              textColor: activeCampaign.textColor || "#000000",
              position: ["left", "right", "center", "top", "bottom"].includes(
                activeCampaign.position as string,
              )
                ? (activeCampaign.position as
                    | "left"
                    | "right"
                    | "center"
                    | "top"
                    | "bottom")
                : "center",
              size:
                activeCampaign.size === "small" ||
                activeCampaign.size === "medium" ||
                activeCampaign.size === "large"
                  ? activeCampaign.size
                  : "medium",
            }}
          />
        );

      case "spin-to-win":
      case "lottery":
        return (
          <SpinToWinPopup
            {...commonProps}
            config={
              {
                ...activeCampaign,
                campaignId: activeCampaign.campaignId,
                prizes: (activeCampaign.contentConfig as any)?.prizes || [],
                headline:
                  activeCampaign.contentConfig?.headline ||
                  activeCampaign.title ||
                  "Spin to Win!",
                subheadline:
                  activeCampaign.contentConfig?.subheadline ||
                  activeCampaign.description ||
                  "",
                emailRequired:
                  (activeCampaign.contentConfig as any)?.emailRequired ?? true,
                emailPlaceholder:
                  (activeCampaign.contentConfig as any)?.emailPlaceholder ||
                  "Enter your email",
                spinButtonText:
                  (activeCampaign.contentConfig as any)?.spinButtonText || "Spin Now!",
                successMessage:
                  activeCampaign.contentConfig?.successMessage ||
                  "Congratulations!",
                failureMessage:
                  activeCampaign.contentConfig?.failureMessage ||
                  "Try again next time!",
                backgroundColor: activeCampaign.backgroundColor || "#FFFFFF",
                textColor: activeCampaign.textColor || "#000000",
                buttonColor: activeCampaign.buttonColor || "#007BFF",
                buttonTextColor: activeCampaign.buttonTextColor || "#FFFFFF",
              } as unknown as SpinToWinConfig
            }
            onSpinComplete={async (data) => {
              console.log("[PopupManager] Spin completed:", data);
              // Don't close the popup - let user see the result
              // The popup will handle showing the result and copy/apply buttons
            }}
          />
        );

      case "scratch-card":
        return (
          <ScratchCardPopup
            {...commonProps}
            config={
              {
                ...activeCampaign,
                campaignId: activeCampaign.campaignId,
                prizes: (activeCampaign.contentConfig as any)?.prizes || [],
                headline:
                  activeCampaign.contentConfig?.headline ||
                  activeCampaign.title ||
                  "Scratch to Win!",
                subheadline:
                  activeCampaign.contentConfig?.subheadline ||
                  activeCampaign.description ||
                  "",
                emailRequired:
                  (activeCampaign.contentConfig as any)?.emailRequired ?? true,
                emailPlaceholder:
                  (activeCampaign.contentConfig as any)?.emailPlaceholder ||
                  "Enter your email",
                scratchInstruction:
                  (activeCampaign.contentConfig as any)?.scratchInstruction ||
                  "Scratch to reveal your prize!",
                backgroundColor: activeCampaign.backgroundColor || "#FFFFFF",
                textColor: activeCampaign.textColor || "#000000",
                buttonColor: activeCampaign.buttonColor || "#007BFF",
                buttonTextColor: activeCampaign.buttonTextColor || "#FFFFFF",
              } as unknown as ScratchCardConfig
            }
          />
        );

      case "slide-in":
      case "slide":
        return (
          <SlideInPopup
            {...commonProps}
            config={{
              ...activeCampaign,
              title: activeCampaign.title || activeCampaign.name || "Popup",
              description: activeCampaign.description || "",
              buttonText: activeCampaign.buttonText || "Click Here",
              backgroundColor: activeCampaign.backgroundColor || "#FFFFFF",
              textColor: activeCampaign.textColor || "#000000",
              position: ["left", "right"].includes(
                activeCampaign.position as string,
              )
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
            {...commonProps}
            config={{
              ...activeCampaign,
              title: activeCampaign.title || activeCampaign.name || "Popup",
              description: activeCampaign.description || "",
              buttonText: activeCampaign.buttonText || "Click Here",
              backgroundColor: activeCampaign.backgroundColor || "#FFFFFF",
              textColor: activeCampaign.textColor || "#000000",
              position:
                activeCampaign.position === "top" ||
                activeCampaign.position === "bottom"
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
          <ModalPopup
            {...commonProps}
            config={{
              ...activeCampaign,
              title: activeCampaign.title || activeCampaign.name || "Popup",
              description: activeCampaign.description || "",
              buttonText: activeCampaign.buttonText || "Click Here",
              backgroundColor: activeCampaign.backgroundColor || "#FFFFFF",
              textColor: activeCampaign.textColor || "#000000",
              position: "center",
              size: "medium",
            }}
          />
        );
    }
  };

  return renderPopup();
};
