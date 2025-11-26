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
 */

import React, { useState, useEffect, useCallback } from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig, CartItem, DiscountConfig } from "./types";
import type { CartAbandonmentContent } from "~/domains/campaigns/types/campaign";
import { formatCurrency } from "./utils";
import { POPUP_SPACING, getContainerPadding, SPACING_GUIDELINES } from "./spacing";

// Import custom hooks
import { useCountdownTimer, useDiscountCode, usePopupForm } from "./hooks";

// Import shared components from Phase 1 & 2
import {
  TimerDisplay,
  DiscountCodeDisplay,
  LeadCaptureForm,
  PopupCloseButton,
} from "./components/shared";

/**
 * CartAbandonmentConfig - Extends both design config AND campaign content type
 * All content fields come from CartAbandonmentContent
 * All design fields come from PopupDesignConfig
 */
export interface CartAbandonmentConfig extends PopupDesignConfig, CartAbandonmentContent {
  // Storefront-specific fields only
  discount?: DiscountConfig;

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
  }) => Promise<{ code?: string; autoApplyMode?: string } | null>;
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
  const { timeRemaining, hasExpired, formattedTime } = useCountdownTimer({
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
    handleSubmit: handleFormSubmit,
    isSubmitting: isEmailSubmitting,
    isSubmitted: emailSubmitted,
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

  const discountDeliveryMode = config.discount?.deliveryMode || "show_code_fallback";

  const emailSuccessCopy =
    config.emailSuccessMessage ||
    (discountDeliveryMode === "auto_apply_only"
      ? "We'll automatically apply your discount at checkout."
      : discountDeliveryMode === "show_in_popup_authorized_only"
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

        const result = await issueDiscount(cartSubtotalCents ? { cartSubtotalCents } : undefined);

        const code = result?.code;
        const shouldShowCodeFromCta =
          !!code &&
          (discountDeliveryMode === "show_code_always" ||
            discountDeliveryMode === "show_code_fallback" ||
            discountDeliveryMode === "show_in_popup_authorized_only");

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
  }, [
    config.discount?.enabled,
    config.ctaUrl,
    cartTotal,
    discountCode,
    discountDeliveryMode,
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
  }, [onSaveForLater, onClose]);

  const handleEmailSubmit = useCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
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

  const isEmailGateActive =
    !!config.enableEmailRecovery && !!config.requireEmailBeforeCheckout && !discountCode;
  const borderRadiusValue =
    typeof config.borderRadius === "number"
      ? `${config.borderRadius}px`
      : config.borderRadius || "16px";
  const cardMaxWidth =
    config.maxWidth ||
    (config.size === "small" ? "24rem" : config.size === "large" ? "32rem" : "28rem");
  const descriptionColor = config.descriptionColor || "#6b7280";

  const buttonStyles: React.CSSProperties = {
    width: "100%",
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: 600,
    border: "none",
    borderRadius: `${config.borderRadius ?? 8}px`,
    backgroundColor: config.buttonColor,
    color: config.buttonTextColor,
    cursor: "pointer",
    transition: "transform 0.1s",
  };

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: "transparent",
    color: config.textColor,
    border: `2px solid ${config.textColor}`,
    opacity: 0.7,
  };

  const dismissButtonStyles: React.CSSProperties = {
    background: "transparent",
    border: "none",
    padding: 0,
    marginTop: "4px",
    color: config.textColor,
    fontSize: "14px",
    opacity: 0.7,
    cursor: "pointer",
    textDecoration: "underline",
    alignSelf: "center",
    transition: "opacity 0.15s ease-out",
  };

  // Auto-close timer (migrated from BasePopup)
  useEffect(() => {
    if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;

    const timer = setTimeout(onClose, config.autoCloseDelay * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, config.autoCloseDelay, onClose]);

  if (!isVisible) return null;

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
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
    >
      <style>{`
        /* Base Container (Mobile First - Bottom Sheet) */
        .cart-ab-popup-container {
          width: 100%;
          background: ${config.backgroundColor || "#ffffff"};
          color: ${config.textColor || "#111827"};
          border-radius: 1.5rem 1.5rem 0 0; /* Bottom sheet rounded top */
          padding: 1.5rem;
          box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.15);
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease-out forwards;
          z-index: 10000;
          
          /* Enable container queries */
          container-type: inline-size;
          container-name: cart-popup;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* Desktop/Tablet Overrides (Centered Card) via Container Query */
        @container cart-popup (min-width: 480px) {
          .cart-ab-popup-container {
            position: relative;
            bottom: auto;
            left: auto;
            right: auto;
            max-width: ${cardMaxWidth};
            border-radius: ${borderRadiusValue};
            padding: ${getContainerPadding(config.size)};
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: fadeIn 0.3s ease-out forwards;
            margin: 0 auto;
          }

          /* Ensure buttons have normal padding on desktop */
          .cart-ab-primary-button {
            padding: ${POPUP_SPACING.component.button};
          }
          
          .cart-ab-email-row {
            flex-direction: row;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        }

        .cart-ab-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: ${POPUP_SPACING.gap.md};
          margin-bottom: ${SPACING_GUIDELINES.afterDescription};
        }

        .cart-ab-header-text {
          flex: 1;
        }

        .cart-ab-title {
          font-size: 1.875rem;
          font-weight: 900;
          line-height: 1.1;
          margin: 0 0 ${SPACING_GUIDELINES.afterHeadline} 0;
          letter-spacing: -0.02em;
        }

        .cart-ab-subtitle {
          margin: 0;
          font-size: 1rem;
          line-height: 1.6;
          color: ${descriptionColor};
        }

        .cart-ab-close {
          padding: 0.5rem;
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

        .cart-ab-body {
          display: flex;
          flex-direction: column;
          gap: ${SPACING_GUIDELINES.betweenSections};
        }

        .cart-ab-urgency {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.95rem;
          font-weight: 600;
          background: transparent;
          color: ${config.accentColor || "#b45309"};
          border: 1px solid ${config.accentColor || "#fcd34d"};
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          opacity: 0.9;
        }

        .cart-ab-discount {
          padding: 1rem;
          border-radius: 1rem;
          text-align: center;
          background: rgba(0, 0, 0, 0.03);
          border: 1px dashed ${config.buttonColor || "#3b82f6"};
        }

        .cart-ab-discount-label {
          margin: 0 0 0.25rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${descriptionColor};
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cart-ab-discount-amount {
          font-size: 1.5rem;
          font-weight: 800;
          color: ${config.buttonColor || "#1d4ed8"};
        }

        .cart-ab-discount-code {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0,0,0,0.1);
        }

        .cart-ab-items {
          border-radius: 1rem;
          border: 1px solid ${config.inputBorderColor || "rgba(0,0,0,0.1)"};
          padding: 0;
          max-height: 250px;
          overflow-y: auto;
          background: transparent;
        }

        .cart-ab-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid ${config.inputBorderColor || "rgba(0,0,0,0.1)"};
          background: transparent;
        }

        .cart-ab-item:last-child {
          border-bottom: none;
        }

        .cart-ab-item-image {
          width: 4rem;
          height: 4rem;
          border-radius: 0.5rem;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .cart-ab-item-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .cart-ab-item-title {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }

        .cart-ab-item-meta {
          font-size: 0.85rem;
          color: ${descriptionColor};
        }

        .cart-ab-item-price {
          font-size: 1rem;
          font-weight: 700;
          align-self: center;
        }

        .cart-ab-more {
          padding: 0.75rem;
          text-align: center;
          font-size: 0.875rem;
          color: ${descriptionColor};
          font-weight: 500;
          background: transparent;
        }

        .cart-ab-total-section {
          background: transparent;
          border: 1px solid ${config.accentColor || "#e5e7eb"};
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .cart-ab-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .cart-ab-new-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.25rem;
          font-weight: 800;
          color: ${config.successColor || "#16a34a"};
        }

        .cart-ab-savings {
          font-size: 0.9rem;
          color: ${config.successColor || "#16a34a"};
          text-align: right;
          font-weight: 600;
        }

        .cart-ab-stock-warning {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: rgba(254, 226, 226, 0.5);
          color: #991b1b;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
          border: 1px solid #fecaca;
        }

        .cart-ab-footer {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cart-ab-primary-button {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: ${config.borderRadius ?? 12}px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .cart-ab-primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .cart-ab-secondary-button {
          width: 100%;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .cart-ab-email-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cart-ab-email-row {
          display: flex;
          flex-direction: column; /* Stack input and button for better readability */
          gap: 0.75rem;
        }

        .cart-ab-email-input {
          flex: 1;
          min-width: 0;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid ${config.inputBorderColor || "#d1d5db"};
          background: ${config.inputBackgroundColor || "#ffffff"};
          color: ${config.inputTextColor || config.textColor || "#111827"};
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .cart-ab-email-input:focus {
          outline: none;
          border-color: ${config.buttonColor};
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .cart-ab-dismiss-button {
          background: transparent;
          border: none;
          padding: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.9rem;
          color: ${descriptionColor};
          text-decoration: none;
          cursor: pointer;
          align-self: center;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .cart-ab-dismiss-button:hover {
          opacity: 1;
          text-decoration: underline;
        }

        /* Mobile specific adjustments via Container Query */
        @container cart-popup (max-width: 480px) {
          .cart-ab-email-row {
            flex-direction: column;
          }

          .cart-ab-primary-button {
            padding: 1.125rem; /* Larger touch target */
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

          {config.discount?.enabled && config.discount.code && (
            <div className="cart-ab-discount">
              <p className="cart-ab-discount-label">Special offer for you!</p>
              <div className="cart-ab-discount-amount">
                {config.discount.percentage && `${config.discount.percentage}% OFF`}
                {config.discount.value &&
                  !config.discount.percentage &&
                  `$${config.discount.value} OFF`}
              </div>
              <code className="cart-ab-discount-code">{config.discount.code}</code>
            </div>
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
                      typeof config.discount.percentage === "number" ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                          <span
                            style={{
                              textDecoration: "line-through",
                              opacity: 0.6,
                              fontSize: "0.9em",
                            }}
                          >
                            {formatCurrency(safeBasePrice, config.currency)}
                          </span>
                          <span style={{ color: config.successColor || "#16a34a" }}>
                            {formatCurrency(discountedPrice, config.currency)}
                          </span>
                        </div>
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
                  style={{
                    textDecoration:
                      config.discount?.enabled &&
                      (config.discount.percentage || config.discount.value) &&
                      config.discount.type !== "free_shipping"
                        ? "line-through"
                        : "none",
                    opacity:
                      config.discount?.enabled &&
                      (config.discount.percentage || config.discount.value) &&
                      config.discount.type !== "free_shipping"
                        ? 0.7
                        : 1,
                  }}
                >
                  {typeof cartTotal === "number"
                    ? formatCurrency(cartTotal, config.currency)
                    : cartTotal}
                </span>
              </div>

              {config.discount?.enabled &&
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

            {discountCode && (
              <div className="cart-ab-code-block">
                <DiscountCodeDisplay
                  code={discountCode}
                  onCopy={handleCopyCode}
                  copied={copiedCode}
                  label="Your discount code:"
                  variant="dashed"
                  accentColor={config.accentColor || config.buttonColor}
                  textColor={config.textColor}
                  size="md"
                />
              </div>
            )}

            {!isEmailGateActive && (
              <button
                onClick={handleResumeCheckout}
                style={buttonStyles}
                className="cart-ab-primary-button"
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {config.buttonText || config.ctaText || "Resume Checkout"}
              </button>
            )}

            {config.saveForLaterText && !isEmailGateActive && (
              <button
                onClick={handleSaveForLater}
                style={secondaryButtonStyles}
                className="cart-ab-secondary-button"
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
              >
                {config.saveForLaterText}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={dismissButtonStyles}
              className="cart-ab-dismiss-button"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
            >
              {config.dismissLabel || "No thanks"}
            </button>
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};
