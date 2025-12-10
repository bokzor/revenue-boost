/**
 * CartAbandonmentPopup Component
 *
 * Cart recovery popup featuring:
 * - Display cart items with images and prices
 * - Show cart total
 * - Urgency countdown timer
 * - Discount code application
 * - "Save for Later" option
 * - Stock warnings
 * - CTA to resume checkout
 *
 * RESPONSIVE DESIGN:
 * - Uses CSS Container Queries for true container-based responsiveness
 * - Mobile: Bottom sheet with slide-up animation
 * - Tablet/Desktop: Centered card with responsive sizing
 * - All sizing uses container-relative units (cqi, cqmin, clamp)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig, CartItem, DiscountConfig } from "./types";
import type { CartAbandonmentContent } from "~/domains/campaigns/types/campaign";
import { formatCurrency, getAdaptiveMutedColor } from "app/domains/storefront/popups-new/utils/utils";

// Import custom hooks
import { useCountdownTimer, useDiscountCode, usePopupForm } from "./hooks";

// Import shared components from Phase 1 & 2
import {
  TimerDisplay,
  DiscountCodeDisplay,
  LeadCaptureForm,
  PopupCloseButton,
} from "./components/shared";

// Tiered discount types (for "Spend more, save more" messaging)
interface DiscountTier {
  thresholdCents: number;
  discount: { kind: string; value: number };
}

interface TieredDiscountConfig {
  tiers?: DiscountTier[];
}

/**
 * Get tiered discount messaging based on cart total
 * Returns messaging like "Spend $20 more to get 20% off!"
 */
function getTieredDiscountInfo(
  tiers: DiscountTier[] | undefined,
  cartTotalCents: number,
  currency?: string
): { message: string; currentTier?: DiscountTier; nextTier?: DiscountTier } | null {
  if (!tiers?.length) return null;

  // Sort tiers by threshold (ascending)
  const sortedTiers = [...tiers].sort((a, b) => a.thresholdCents - b.thresholdCents);

  // Find current and next tiers
  let currentTier: DiscountTier | undefined;
  let nextTier: DiscountTier | undefined;

  for (const tier of sortedTiers) {
    if (cartTotalCents >= tier.thresholdCents) {
      currentTier = tier;
    } else if (!nextTier) {
      nextTier = tier;
      break;
    }
  }

  // Format discount display
  const formatDiscount = (tier: DiscountTier) => {
    if (tier.discount.kind === "free_shipping") return "free shipping";
    if (tier.discount.kind === "percentage") return `${tier.discount.value}% off`;
    return `${formatCurrency(tier.discount.value, currency)} off`;
  };

  // Generate appropriate message
  if (nextTier) {
    const amountNeeded = (nextTier.thresholdCents - cartTotalCents) / 100;
    const nextDiscount = formatDiscount(nextTier);
    if (currentTier) {
      // Already qualified for one tier, show upgrade message
      return {
        message: `Add ${formatCurrency(amountNeeded, currency)} more to get ${nextDiscount}!`,
        currentTier,
        nextTier,
      };
    } else {
      // Not yet qualified for any tier
      return {
        message: `Spend ${formatCurrency(amountNeeded, currency)} more to get ${nextDiscount}!`,
        nextTier,
      };
    }
  } else if (currentTier) {
    // Already at highest tier
    const currentDiscount = formatDiscount(currentTier);
    return {
      message: `You qualify for ${currentDiscount}!`,
      currentTier,
    };
  }

  return null;
}

/**
 * CartAbandonmentConfig - Extends both design config AND campaign content type
 * All content fields come from CartAbandonmentContent
 * All design fields come from PopupDesignConfig
 */
export interface CartAbandonmentConfig extends PopupDesignConfig, CartAbandonmentContent {
  // Storefront-specific fields only
  discount?: DiscountConfig & TieredDiscountConfig;

  // Note: headline, subheadline, urgencyMessage, ctaUrl, etc.
  // all come from CartAbandonmentContent
}

export interface CartAbandonmentPopupProps {
  config: CartAbandonmentConfig;
  isVisible: boolean;
  onClose: () => void;
  cartItems?: CartItem[];
  cartTotal?: string | number;
  onResumeCheckout?: () => void;
  onSaveForLater?: () => void;
  onEmailRecovery?: (email: string) => Promise<string | void> | string | void;
  issueDiscount?: (options?: {
    cartSubtotalCents?: number;
    /** Product IDs from cart items - for cart-scoped discounts */
    cartProductIds?: string[];
  }) => Promise<{ code?: string; behavior?: string } | null>;
  onTrack?: (metadata?: Record<string, unknown>) => void;
}

export const CartAbandonmentPopup: React.FC<CartAbandonmentPopupProps> = ({
  config,
  isVisible,
  onClose,
  cartItems = [],
  cartTotal,
  onResumeCheckout,
  onSaveForLater,
  onEmailRecovery,
  issueDiscount,
  onTrack,
}) => {
  // Use countdown timer hook
  const { timeRemaining } = useCountdownTimer({
    enabled: config.showUrgency === true && !!config.urgencyTimer,
    mode: "duration",
    duration: config.urgencyTimer,
    onExpire: () => {
      // Timer expired - could auto-close or show expired message
    },
  });

  // Use discount code hook
  const { discountCode, setDiscountCode, copiedCode, handleCopyCode } = useDiscountCode();

  // Use form hook for email recovery
  const {
    formState,
    setEmail,
    errors,
    isSubmitting: isEmailSubmitting,
    handleSubmit: handleFormSubmit,
  } = usePopupForm({
    config: {
      emailRequired: true,
      emailErrorMessage: config.emailErrorMessage,
      campaignId: config.campaignId,
      previewMode: config.previewMode,
    },
    endpoint: config.enableEmailRecovery
      ? "/apps/revenue-boost/api/cart/email-recovery"
      : undefined,
    onSubmit: onEmailRecovery
      ? async (data) => {
          const result = await onEmailRecovery(data.email);
          return typeof result === "string" ? result : undefined;
        }
      : undefined,
  });

  // Component-specific state
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);

  const discountBehavior = config.discount?.behavior || "SHOW_CODE_AND_AUTO_APPLY";

  const emailSuccessCopy =
    config.emailSuccessMessage ||
    (discountBehavior === "SHOW_CODE_AND_AUTO_APPLY"
      ? "We'll automatically apply your discount at checkout."
      : discountBehavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL"
        ? "Your discount code is authorized for this email address only."
        : "Your discount code is ready to use at checkout.");

  // Timer is now handled by useCountdownTimer hook

  const handleResumeCheckout = useCallback(async () => {
    let shouldRedirect = true;

    try {
      if (config.discount?.enabled && typeof issueDiscount === "function" && !discountCode) {
        let numericTotal: number | undefined;
        if (typeof cartTotal === "number") {
          numericTotal = cartTotal;
        } else if (typeof cartTotal === "string") {
          const parsed = parseFloat(cartTotal);
          if (!Number.isNaN(parsed)) {
            numericTotal = parsed;
          }
        }

        const cartSubtotalCents =
          typeof numericTotal === "number" ? Math.round(numericTotal * 100) : undefined;

        // Extract product IDs from cart items for cart-scoped discounts
        const cartProductIds = cartItems
          .map((item) => item.productId || item.id)
          .filter((id): id is string => !!id);

        const result = await issueDiscount({
          cartSubtotalCents,
          cartProductIds: cartProductIds.length > 0 ? cartProductIds : undefined,
        });

        const code = result?.code;
        // All behaviors show the code, so show it if we have one
        const shouldShowCodeFromCta = !!code;

        if (shouldShowCodeFromCta && code) {
          setDiscountCode(code);
          shouldRedirect = false;
        }
      }
    } catch (err) {
      console.error("[CartAbandonmentPopup] Failed to issue discount on resume:", err);
    }

    if (shouldRedirect) {
      if (onResumeCheckout) {
        onResumeCheckout();
      } else if (config.ctaUrl) {
        window.location.href = config.ctaUrl;
      }
    }

    // Track the click
    if (onTrack) {
      onTrack({
        action: "resume_checkout",
        discountApplied: !!discountCode,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onTrack is stable callback from parent
  }, [
    config.discount?.enabled,
    config.ctaUrl,
    cartItems,
    cartTotal,
    discountCode,
    discountBehavior,
    issueDiscount,
    onResumeCheckout,
    setDiscountCode,
  ]);

  const handleSaveForLater = useCallback(() => {
    if (onSaveForLater) {
      onSaveForLater();
    }
    if (onTrack) {
      onTrack({ action: "save_for_later" });
    }
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onTrack is stable callback from parent
  }, [onSaveForLater, onClose]);

  const handleEmailSubmit = useCallback(
    async (e?: React.FormEvent): Promise<void> => {
      if (e) e.preventDefault();

      if (!config.enableEmailRecovery) {
        handleResumeCheckout();
        return;
      }

      const result = await handleFormSubmit();
      if (result.success) {
        if (result.discountCode) {
          setDiscountCode(result.discountCode);
        }
        setEmailSuccessMessage(emailSuccessCopy);
      }
    },
    [
      config.enableEmailRecovery,
      handleFormSubmit,
      handleResumeCheckout,
      emailSuccessCopy,
      setDiscountCode,
    ]
  );

  // Copy code handler now from useDiscountCode hook

  const displayItems = cartItems.slice(0, config.maxItemsToShow || 3);

  // Calculate cart total in cents for tiered discount calculation
  const cartTotalCents = useMemo(() => {
    if (typeof cartTotal === "number") return Math.round(cartTotal * 100);
    if (typeof cartTotal === "string") {
      const parsed = parseFloat(cartTotal.replace(/[^0-9.-]+/g, ""));
      if (!Number.isNaN(parsed)) return Math.round(parsed * 100);
    }
    return 0;
  }, [cartTotal]);

  // Get tiered discount info (for "Spend more, save more" messaging)
  const tieredInfo = useMemo(() => {
    if (!config.discount?.tiers?.length) return null;
    return getTieredDiscountInfo(config.discount.tiers, cartTotalCents, config.currency);
  }, [config.discount?.tiers, cartTotalCents, config.currency]);

  const isEmailGateActive =
    !!config.enableEmailRecovery && !!config.requireEmailBeforeCheckout && !discountCode;

  // Computed styles
  const borderRadiusValue =
    typeof config.borderRadius === "number"
      ? `${config.borderRadius}px`
      : config.borderRadius || "16px";

  // Container-relative max widths based on size
  const cardMaxWidth = useMemo(() => {
    if (config.maxWidth) return config.maxWidth;
    switch (config.size) {
      case "small":
        return "min(420px, 95cqi)";
      case "large":
        return "min(520px, 95cqi)";
      default:
        return "min(460px, 95cqi)";
    }
  }, [config.maxWidth, config.size]);

  // Design tokens - use config values with --rb-* fallbacks
  const bgColor = config.backgroundColor || "var(--rb-background, #ffffff)";
  const textColor = config.textColor || "var(--rb-foreground, #111827)";
  // Use adaptive muted color based on background for proper contrast
  const descriptionColor = config.descriptionColor || getAdaptiveMutedColor(bgColor);
  const buttonBgColor = config.buttonColor || "var(--rb-primary, #3b82f6)";
  const buttonTextColor = config.buttonTextColor || "var(--rb-primary-foreground, #ffffff)";
  const accentColor = config.accentColor || "var(--rb-primary, #f59e0b)";
  const successColor = config.successColor || "var(--rb-success, #16a34a)";
  const inputBorderColor = config.inputBorderColor || "var(--rb-border, rgba(0,0,0,0.1))";
  const inputBgColor = config.inputBackgroundColor || "var(--rb-surface, #ffffff)";
  const inputTextColor = config.inputTextColor || config.textColor || "var(--rb-foreground, #111827)";
  const maxWidthValue = typeof cardMaxWidth === "number" ? `${cardMaxWidth}px` : cardMaxWidth;

  // Auto-close timer (migrated from BasePopup)
  useEffect(() => {
    if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;

    const timer = setTimeout(onClose, config.autoCloseDelay * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, config.autoCloseDelay, onClose]);

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || "rgba(0, 0, 0, 1)",
        opacity: config.overlayOpacity ?? 0.6,
        blur: 4,
      }}
      animation={{
        type: config.animation || "fade",
      }}
      position={config.position || "center"}
      size={config.size || "medium"}
      mobilePresentationMode="bottom-sheet"
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      showBranding={config.showBranding}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
      designTokensCSS={config.designTokensCSS}
    >
      <style>{`
        /* ============================================
         * CSS CUSTOM PROPERTIES (Structural Only)
         * ============================================ */
        .cart-ab-popup-container {
          /* Responsive spacing using container-relative units */
          --cart-ab-padding-x: clamp(1rem, 5cqi, 2rem);
          --cart-ab-padding-y: clamp(1.25rem, 4cqi, 2rem);
          --cart-ab-gap: clamp(0.875rem, 3cqi, 1.5rem);
          --cart-ab-item-gap: clamp(0.75rem, 2.5cqi, 1rem);

          /* Typography scaling */
          --cart-ab-title-size: clamp(1.25rem, 5cqi, 1.875rem);
          --cart-ab-body-size: clamp(0.875rem, 3cqi, 1rem);
          --cart-ab-small-size: clamp(0.75rem, 2.5cqi, 0.875rem);

          /* Item image sizing */
          --cart-ab-img-size: clamp(3rem, 12cqi, 4.5rem);

          /* Max width */
          --cart-ab-max-width: ${maxWidthValue};
        }

        /* ============================================
         * BASE CONTAINER (Mobile-First)
         * ============================================ */
        .cart-ab-popup-container {
          width: 100%;
          background: ${bgColor};
          color: ${textColor};
          font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};

          /* Bottom sheet style on mobile */
          border-radius: clamp(1rem, 4cqi, 1.5rem) clamp(1rem, 4cqi, 1.5rem) 0 0;
          padding: var(--cart-ab-padding-y) var(--cart-ab-padding-x);
          padding-bottom: calc(var(--cart-ab-padding-y) + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.15);

          /* Let PopupPortal handle positioning - don't override with fixed positioning */
          /* The cart items list (.cart-ab-items) handles its own scrolling */
          overflow: visible;
        }

        @keyframes cart-ab-slideUp {
          from {
            transform: translateY(100%);
            opacity: 0.8;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* ============================================
         * TABLET+ LAYOUT (Container Query @ 420px)
         * Transforms to centered card
         * Uses popup-viewport container from PopupPortal
         * ============================================ */
        @container popup-viewport (min-width: 420px) {
          .cart-ab-popup-container {
            /* Center the card */
            position: relative;
            bottom: auto;
            left: auto;
            right: auto;
            margin: 0 auto;

            /* Responsive max-width */

            /* Card styling */
            border-radius: ${borderRadiusValue};
            padding: var(--cart-ab-padding-y) var(--cart-ab-padding-x);
            box-shadow:
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(0, 0, 0, 0.03);

            /* Different animation for card */
            animation: cart-ab-fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }

        @keyframes cart-ab-fadeIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        /* ============================================
         * HEADER SECTION
         * ============================================ */
        .cart-ab-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--cart-ab-item-gap);
          margin-bottom: var(--cart-ab-gap);
        }

        .cart-ab-header-text {
          flex: 1;
          min-width: 0;
        }

        .cart-ab-title {
          font-size: var(--cart-ab-title-size);
          font-weight: 800;
          line-height: 1.15;
          margin: 0 0 clamp(0.375rem, 1.5cqi, 0.625rem) 0;
          letter-spacing: -0.02em;
          color: ${textColor};
        }

        .cart-ab-subtitle {
          margin: 0;
          font-size: var(--cart-ab-body-size);
          line-height: 1.5;
          color: ${descriptionColor};
        }

        /* Close button */
        .cart-ab-close {
          padding: clamp(0.375rem, 1.5cqi, 0.5rem);
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: ${descriptionColor};
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .cart-ab-close:hover {
          background: rgba(0, 0, 0, 0.1);
          transform: rotate(90deg);
        }

        .cart-ab-close:focus-visible {
          outline: 2px solid ${buttonBgColor};
          outline-offset: 2px;
        }

        /* ============================================
         * BODY SECTION
         * ============================================ */
        .cart-ab-body {
          display: flex;
          flex-direction: column;
          gap: var(--cart-ab-gap);
        }

        /* ============================================
         * URGENCY BANNER
         * ============================================ */
        .cart-ab-urgency {
          padding: clamp(0.625rem, 2cqi, 0.875rem) clamp(0.875rem, 3cqi, 1.25rem);
          border-radius: clamp(0.5rem, 2cqi, 0.75rem);
          font-size: var(--cart-ab-small-size);
          font-weight: 600;
          background: color-mix(in srgb, ${accentColor} 8%, transparent);
          color: ${accentColor};
          border: 1px solid color-mix(in srgb, ${accentColor} 30%, transparent);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(0.375rem, 1.5cqi, 0.5rem);
          flex-wrap: wrap;
        }

        /* ============================================
         * DISCOUNT HIGHLIGHT
         * ============================================ */
        .cart-ab-discount {
          padding: clamp(0.875rem, 3cqi, 1.25rem);
          border-radius: clamp(0.75rem, 2.5cqi, 1rem);
          text-align: center;
          background: color-mix(in srgb, ${buttonBgColor} 6%, transparent);
          border: 2px dashed color-mix(in srgb, ${buttonBgColor} 40%, transparent);
        }

        .cart-ab-discount-label {
          margin: 0 0 clamp(0.25rem, 1cqi, 0.375rem) 0;
          font-size: var(--cart-ab-small-size);
          font-weight: 600;
          color: ${descriptionColor};
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cart-ab-discount-amount {
          font-size: clamp(1.25rem, 4.5cqi, 1.75rem);
          font-weight: 800;
          color: ${buttonBgColor};
        }

        .cart-ab-discount-code {
          display: inline-block;
          margin-top: clamp(0.375rem, 1.5cqi, 0.5rem);
          padding: clamp(0.25rem, 1cqi, 0.375rem) clamp(0.625rem, 2cqi, 0.875rem);
          border-radius: clamp(0.375rem, 1.5cqi, 0.5rem);
          font-size: var(--cart-ab-small-size);
          font-weight: 700;
          font-family: ui-monospace, monospace;
          letter-spacing: 0.05em;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid ${inputBorderColor};
        }

        .cart-ab-discount-hint {
          margin: 0;
          margin-top: clamp(0.25rem, 1cqi, 0.375rem);
          font-size: var(--cart-ab-small-size);
          color: ${descriptionColor};
          font-style: italic;
        }

        /* ============================================
         * CART ITEMS LIST
         * ============================================ */
        .cart-ab-items {
          border-radius: clamp(0.75rem, 2.5cqi, 1rem);
          border: 1px solid ${inputBorderColor};
          padding: 0;
          max-height: clamp(180px, 35cqi, 280px);
          overflow-y: auto;
          overscroll-behavior: contain;
          background: transparent;
        }

        .cart-ab-item {
          display: flex;
          gap: var(--cart-ab-item-gap);
          padding: var(--cart-ab-item-gap);
          border-bottom: 1px solid ${inputBorderColor};
          background: transparent;
          align-items: center;
        }

        .cart-ab-item:last-child {
          border-bottom: none;
        }

        .cart-ab-item-image {
          width: var(--cart-ab-img-size);
          height: var(--cart-ab-img-size);
          border-radius: clamp(0.375rem, 1.5cqi, 0.5rem);
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(0, 0, 0, 0.05);
          background: ${inputBgColor};
        }

        .cart-ab-item-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: clamp(0.125rem, 0.5cqi, 0.25rem);
        }

        .cart-ab-item-title {
          font-size: var(--cart-ab-body-size);
          font-weight: 600;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .cart-ab-item-meta {
          font-size: var(--cart-ab-small-size);
          color: ${descriptionColor};
        }

        .cart-ab-item-price {
          font-size: var(--cart-ab-body-size);
          font-weight: 700;
          flex-shrink: 0;
          text-align: right;
        }

        /* Discounted price display */
        .cart-ab-price-discounted {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
        }

        .cart-ab-price-original {
          text-decoration: line-through;
          opacity: 0.55;
          font-size: 0.9em;
          font-weight: 500;
        }

        .cart-ab-price-new {
          color: ${successColor};
          font-weight: 700;
        }

        .cart-ab-more {
          padding: clamp(0.5rem, 2cqi, 0.75rem);
          text-align: center;
          font-size: var(--cart-ab-small-size);
          color: ${descriptionColor};
          font-weight: 500;
          background: color-mix(in srgb, ${inputBorderColor} 50%, transparent);
          border-top: 1px solid ${inputBorderColor};
        }

        /* ============================================
         * TOTAL SECTION
         * ============================================ */
        .cart-ab-total-section {
          background: color-mix(in srgb, ${accentColor} 5%, transparent);
          border: 1px solid color-mix(in srgb, ${accentColor} 20%, transparent);
          border-radius: clamp(0.75rem, 2.5cqi, 1rem);
          padding: clamp(0.875rem, 3cqi, 1.25rem);
          display: flex;
          flex-direction: column;
          gap: clamp(0.375rem, 1.5cqi, 0.5rem);
        }

        .cart-ab-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--cart-ab-body-size);
          font-weight: 600;
        }

        .cart-ab-total-struck {
          text-decoration: line-through;
          opacity: 0.6;
        }

        .cart-ab-new-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: clamp(1.125rem, 4cqi, 1.375rem);
          font-weight: 800;
          color: ${successColor};
        }

        .cart-ab-savings {
          font-size: var(--cart-ab-small-size);
          color: ${successColor};
          text-align: right;
          font-weight: 600;
        }

        /* ============================================
         * STOCK WARNING
         * ============================================ */
        .cart-ab-stock-warning {
          padding: clamp(0.625rem, 2cqi, 0.875rem) clamp(0.875rem, 3cqi, 1.25rem);
          border-radius: clamp(0.5rem, 2cqi, 0.75rem);
          background: rgba(254, 226, 226, 0.6);
          color: #991b1b;
          font-size: var(--cart-ab-small-size);
          font-weight: 600;
          text-align: center;
          border: 1px solid rgba(254, 202, 202, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(0.375rem, 1.5cqi, 0.5rem);
        }

        /* ============================================
         * FOOTER (Actions)
         * ============================================ */
        .cart-ab-footer {
          margin-top: var(--cart-ab-gap);
          display: flex;
          flex-direction: column;
          gap: clamp(0.625rem, 2cqi, 0.875rem);
        }

        /* Email form */
        .cart-ab-email-form {
          display: flex;
          flex-direction: column;
          gap: clamp(0.5rem, 2cqi, 0.75rem);
        }

        .cart-ab-email-row {
          display: flex;
          flex-direction: column;
          gap: clamp(0.5rem, 2cqi, 0.75rem);
        }

        /* Side-by-side email form on larger containers */
        @container popup-viewport (min-width: 380px) {
          .cart-ab-email-row {
            flex-direction: row;
          }
        }

        .cart-ab-email-input {
          flex: 1;
          min-width: 0;
          padding: clamp(0.75rem, 2.5cqi, 1rem) clamp(0.875rem, 3cqi, 1.25rem);
          border-radius: clamp(0.5rem, 2cqi, 0.75rem);
          border: 1px solid ${inputBorderColor};
          background: ${inputBgColor};
          color: ${inputTextColor};
          font-size: var(--cart-ab-body-size);
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .cart-ab-email-input:focus {
          outline: none;
          border-color: ${buttonBgColor};
          box-shadow: 0 0 0 3px color-mix(in srgb, ${buttonBgColor} 15%, transparent);
        }

        .cart-ab-email-input::placeholder {
          color: ${descriptionColor};
        }

        /* Primary CTA Button */
        .cart-ab-primary-button {
          width: 100%;
          padding: clamp(0.875rem, 3cqi, 1.125rem) clamp(1rem, 4cqi, 1.5rem);
          font-size: clamp(0.9375rem, 3.5cqi, 1.125rem);
          font-weight: 700;
          border: none;
          border-radius: ${borderRadiusValue};
          background: ${buttonBgColor};
          color: ${buttonTextColor};
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .cart-ab-primary-button:hover {
          transform: translateY(-2px);
          box-shadow:
            0 10px 20px -5px rgba(0, 0, 0, 0.15),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .cart-ab-primary-button:active {
          transform: translateY(0);
        }

        .cart-ab-primary-button:focus-visible {
          outline: 2px solid ${textColor};
          outline-offset: 2px;
        }

        /* Secondary CTA Button */
        .cart-ab-secondary-button {
          width: 100%;
          padding: clamp(0.75rem, 2.5cqi, 0.875rem) clamp(1rem, 4cqi, 1.5rem);
          font-size: var(--cart-ab-body-size);
          font-weight: 600;
          border: 2px solid color-mix(in srgb, ${textColor} 25%, transparent);
          border-radius: ${borderRadiusValue};
          background: transparent;
          color: ${textColor};
          cursor: pointer;
          transition: all 0.15s ease;
          opacity: 0.85;
        }

        .cart-ab-secondary-button:hover {
          opacity: 1;
          border-color: color-mix(in srgb, ${textColor} 50%, transparent);
          background: color-mix(in srgb, ${textColor} 5%, transparent);
        }

        .cart-ab-secondary-button:focus-visible {
          outline: 2px solid ${buttonBgColor};
          outline-offset: 2px;
        }

        /* Dismiss link */
        .cart-ab-dismiss-button {
          background: transparent;
          border: none;
          padding: clamp(0.375rem, 1.5cqi, 0.5rem);
          margin-top: clamp(0.25rem, 1cqi, 0.5rem);
          font-size: var(--cart-ab-small-size);
          color: ${descriptionColor};
          text-decoration: none;
          cursor: pointer;
          align-self: center;
          opacity: 0.75;
          transition: opacity 0.15s ease;
        }

        .cart-ab-dismiss-button:hover {
          opacity: 1;
          text-decoration: underline;
        }

        .cart-ab-dismiss-button:focus-visible {
          outline: 1px solid ${descriptionColor};
          outline-offset: 2px;
        }

        /* ============================================
         * SMALL CONTAINER ADJUSTMENTS (< 360px)
         * ============================================ */
        @container popup-viewport (max-width: 360px) {
          .cart-ab-item {
            flex-wrap: wrap;
          }

          .cart-ab-item-image {
            width: clamp(2.5rem, 20cqi, 3rem);
            height: clamp(2.5rem, 20cqi, 3rem);
          }

          .cart-ab-item-price {
            width: 100%;
            text-align: left;
            margin-top: 0.25rem;
            padding-left: calc(var(--cart-ab-img-size) + var(--cart-ab-item-gap));
          }
        }

        /* ============================================
         * LARGE CONTAINER ENHANCEMENTS (> 480px)
         * ============================================ */
        @container popup-viewport (min-width: 480px) {
          .cart-ab-popup-container {
            --cart-ab-padding-x: clamp(1.5rem, 6cqi, 2.5rem);
            --cart-ab-padding-y: clamp(1.5rem, 5cqi, 2.5rem);
          }

          .cart-ab-discount {
            padding: clamp(1rem, 4cqi, 1.5rem);
          }

          .cart-ab-items {
            max-height: clamp(220px, 40cqi, 320px);
          }
        }

        /* ============================================
         * REDUCED MOTION
         * ============================================ */
        @media (prefers-reduced-motion: reduce) {
          .cart-ab-popup-container,
          .cart-ab-primary-button,
          .cart-ab-secondary-button,
          .cart-ab-close {
            animation: none !important;
            transition: none !important;
          }
        }

      `}</style>

      <div
        className="cart-ab-popup-container"
        data-splitpop="true"
        data-template="cart-abandonment"
      >
        <div className="cart-ab-header">
          <div className="cart-ab-header-text">
            <h2 className="cart-ab-title">{config.headline}</h2>
            {config.subheadline && <p className="cart-ab-subtitle">{config.subheadline}</p>}
          </div>

          <PopupCloseButton
            onClose={onClose}
            color={config.textColor}
            size={20}
            show={config.showCloseButton !== false}
            className="cart-ab-close"
            position="custom"
          />
        </div>

        <div className="cart-ab-body">
          {config.showUrgency && config.urgencyTimer && timeRemaining.total > 0 && (
            <div className="cart-ab-urgency">
              {config.urgencyMessage ? (
                config.urgencyMessage.includes("{{time}}") ? (
                  config.urgencyMessage.replace(
                    "{{time}}",
                    `${timeRemaining.minutes}:${String(timeRemaining.seconds).padStart(2, "0")}`
                  )
                ) : (
                  <>
                    {config.urgencyMessage}{" "}
                    <TimerDisplay
                      timeRemaining={timeRemaining}
                      format="compact"
                      showDays={false}
                      accentColor={config.accentColor || config.buttonColor}
                      textColor={config.textColor}
                    />
                  </>
                )
              ) : (
                <>
                  Complete your order in{" "}
                  <TimerDisplay
                    timeRemaining={timeRemaining}
                    format="compact"
                    showDays={false}
                    accentColor={config.accentColor || config.buttonColor}
                    textColor={config.textColor}
                  />
                </>
              )}
            </div>
          )}

          {/* Discount section - shows teaser OR generated code */}
          {config.discount?.enabled && (
            <>
              {/* Tiered discount messaging */}
              {tieredInfo && !discountCode && (
                <div className="cart-ab-discount cart-ab-discount--tiered">
                  <p className="cart-ab-discount-label">🎯 Spend more, save more!</p>
                  <div className="cart-ab-discount-amount cart-ab-discount-tiered-msg">
                    {tieredInfo.message}
                  </div>
                  {tieredInfo.currentTier && (
                    <p className="cart-ab-discount-hint">
                      Current discount:{" "}
                      {tieredInfo.currentTier.discount.kind === "percentage"
                        ? `${tieredInfo.currentTier.discount.value}% off`
                        : tieredInfo.currentTier.discount.kind === "free_shipping"
                          ? "Free shipping"
                          : `${formatCurrency(tieredInfo.currentTier.discount.value, config.currency)} off`}
                    </p>
                  )}
                </div>
              )}
              {/* Basic discount teaser (percentage or fixed amount) OR generated code */}
              {!tieredInfo && (config.discount.percentage || config.discount.value || discountCode) && (
                <div className="cart-ab-discount">
                  {discountCode ? (
                    <>
                      <p className="cart-ab-discount-label">Your discount code:</p>
                      <DiscountCodeDisplay
                        code={discountCode}
                        onCopy={handleCopyCode}
                        copied={copiedCode}
                        variant="minimal"
                        backgroundColor="transparent"
                        accentColor={config.accentColor || config.buttonColor}
                        textColor={config.textColor}
                        size="md"
                      />
                    </>
                  ) : (
                    <>
                      <p className="cart-ab-discount-label">Special offer for you!</p>
                      <div className="cart-ab-discount-amount">
                        {config.discount.percentage && `${config.discount.percentage}% OFF`}
                        {config.discount.value &&
                          !config.discount.percentage &&
                          `${formatCurrency(config.discount.value, config.currency)} OFF`}
                      </div>
                      <p className="cart-ab-discount-hint">Click below to claim your discount</p>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {config.showCartItems !== false && displayItems.length > 0 && (
            <div className="cart-ab-items">
              {displayItems.map((item) => {
                const basePrice = parseFloat(item.price);
                const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;

                const discountedPrice =
                  config.discount?.enabled && typeof config.discount.percentage === "number"
                    ? safeBasePrice * (1 - config.discount.percentage / 100)
                    : safeBasePrice;

                return (
                  <div key={item.id} className="cart-ab-item">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.title} className="cart-ab-item-image" />
                    )}
                    <div className="cart-ab-item-main">
                      <div className="cart-ab-item-title">{item.title}</div>
                      <div className="cart-ab-item-meta">Qty: {item.quantity}</div>
                    </div>
                    <div className="cart-ab-item-price">
                      {config.discount?.enabled &&
                      discountCode &&
                      typeof config.discount.percentage === "number" ? (
                        <span className="cart-ab-price-discounted">
                          <span className="cart-ab-price-original">
                            {formatCurrency(safeBasePrice, config.currency)}
                          </span>
                          <span className="cart-ab-price-new">
                            {formatCurrency(discountedPrice, config.currency)}
                          </span>
                        </span>
                      ) : (
                        formatCurrency(safeBasePrice, config.currency)
                      )}
                    </div>
                  </div>
                );
              })}

              {cartItems.length > displayItems.length && (
                <div className="cart-ab-more">
                  +{cartItems.length - displayItems.length} more item
                  {cartItems.length - displayItems.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}

          {config.showCartTotal !== false && cartTotal && (
            <div className="cart-ab-total-section">
              <div className="cart-ab-total">
                <span>Total:</span>
                <span
                  className={
                    config.discount?.enabled &&
                    discountCode &&
                    (config.discount.percentage || config.discount.value) &&
                    config.discount.type !== "free_shipping"
                      ? "cart-ab-total-struck"
                      : ""
                  }
                >
                  {typeof cartTotal === "number"
                    ? formatCurrency(cartTotal, config.currency)
                    : cartTotal}
                </span>
              </div>

              {config.discount?.enabled &&
                discountCode &&
                (() => {
                  // Case 1: Free Shipping
                  if (config.discount.type === "free_shipping") {
                    return <div className="cart-ab-savings">+ Free Shipping!</div>;
                  }

                  const numericTotal =
                    typeof cartTotal === "number" ? cartTotal : parseFloat(String(cartTotal));

                  // Case 2: Cannot calculate (NaN or complex type like BOGO/Fixed Amount if we don't trust it matches subtotal exactly)
                  // For now, we trust Percentage and Fixed Amount on the subtotal.
                  // If we can't parse the total, show generic message.
                  if (Number.isNaN(numericTotal)) {
                    return <div className="cart-ab-savings">Discount applied at checkout</div>;
                  }

                  let discountAmount = 0;
                  let canCalculate = false;

                  if (config.discount.percentage) {
                    discountAmount = numericTotal * (config.discount.percentage / 100);
                    canCalculate = true;
                  } else if (config.discount.value) {
                    discountAmount = config.discount.value;
                    canCalculate = true;
                  }

                  // Case 3: Complex/Unknown discount type (e.g. BOGO where we don't have the logic)
                  if (!canCalculate) {
                    return <div className="cart-ab-savings">Special offer applied at checkout</div>;
                  }

                  if (discountAmount <= 0) return null;

                  const newTotal = Math.max(0, numericTotal - discountAmount);

                  return (
                    <>
                      <div className="cart-ab-new-total">
                        <span>New Total:</span>
                        <span>{formatCurrency(newTotal, config.currency)}</span>
                      </div>
                      <div className="cart-ab-savings">
                        You save {formatCurrency(discountAmount, config.currency)}!
                      </div>
                    </>
                  );
                })()}
            </div>
          )}

          {config.showStockWarnings && (
            <div className="cart-ab-stock-warning">
              {config.stockWarningMessage || "⚠️ Items in your cart are selling fast!"}
            </div>
          )}

          <div className="cart-ab-footer">
            {(config.enableEmailRecovery ||
              (config.previewMode && config.requireEmailBeforeCheckout)) && (
              <div className="cart-ab-email-form">
                <LeadCaptureForm
                  data={formState}
                  errors={errors}
                  onEmailChange={setEmail}
                  onNameChange={() => {}}
                  onGdprChange={() => {}}
                  onSubmit={handleEmailSubmit}
                  isSubmitting={isEmailSubmitting}
                  showName={false}
                  showGdpr={false}
                  emailRequired={true}
                  placeholders={{
                    email:
                      config.emailPlaceholder ||
                      "Enter your email to receive your cart and discount",
                  }}
                  labels={{
                    submit: config.emailButtonText || "Email me my cart",
                  }}
                  accentColor={config.accentColor || config.buttonColor}
                  textColor={config.textColor}
                  backgroundColor={config.inputBackgroundColor}
                  buttonTextColor={config.buttonTextColor}
                  extraFields={
                    emailSuccessMessage ? (
                      <p className="cart-ab-email-success">{emailSuccessMessage}</p>
                    ) : undefined
                  }
                />
              </div>
            )}

            {!isEmailGateActive && (
              <button
                onClick={handleResumeCheckout}
                className="cart-ab-primary-button"
                type="button"
              >
                {config.buttonText || config.ctaText || "Resume Checkout"}
              </button>
            )}

            {config.saveForLaterText && !isEmailGateActive && (
              <button
                onClick={handleSaveForLater}
                className="cart-ab-secondary-button"
                type="button"
              >
                {config.saveForLaterText}
              </button>
            )}

            <button type="button" onClick={onClose} className="cart-ab-dismiss-button">
              {config.dismissLabel || "No thanks"}
            </button>
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};
