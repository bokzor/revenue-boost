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

import React, { useState, useEffect, useCallback } from 'react';
import { PopupPortal } from './PopupPortal';
import type { PopupDesignConfig, CartItem, DiscountConfig } from './types';
import type { CartAbandonmentContent } from '~/domains/campaigns/types/campaign';
import { calculateTimeRemaining, formatCurrency, validateEmail, copyToClipboard } from './utils';

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
  issueDiscount?: (
    options?: { cartSubtotalCents?: number },
  ) => Promise<{ code?: string; autoApplyMode?: string } | null>;
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
}) => {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (config.urgencyTimer) {
      const endDate = new Date(Date.now() + config.urgencyTimer * 1000);
      return calculateTimeRemaining(endDate);
    }
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  });

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState<string | null>(null);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [discountCodeToShow, setDiscountCodeToShow] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);


  const discountDeliveryMode = config.discount?.deliveryMode || 'show_code_fallback';

  const emailSuccessCopy =
    config.emailSuccessMessage ||
    (discountDeliveryMode === 'auto_apply_only'
      ? "We'll automatically apply your discount at checkout."
      : discountDeliveryMode === 'show_in_popup_authorized_only'
        ? 'Your discount code is authorized for this email address only.'
        : 'Your discount code is ready to use at checkout.');

  // Update urgency timer
  useEffect(() => {
    if (!config.showUrgency || !config.urgencyTimer) return;

    const timer = setInterval(() => {
      const endDate = new Date(Date.now() + config.urgencyTimer! * 1000);
      const newTime = calculateTimeRemaining(endDate);
      setTimeRemaining(newTime);

      if (newTime.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [config.showUrgency, config.urgencyTimer]);

  const handleResumeCheckout = useCallback(
    async () => {
      let shouldRedirect = true;

      try {
        if (
          config.discount?.enabled &&
          typeof issueDiscount === 'function' &&
          !discountCodeToShow
        ) {
          let numericTotal: number | undefined;
          if (typeof cartTotal === 'number') {
            numericTotal = cartTotal;
          } else if (typeof cartTotal === 'string') {
            const parsed = parseFloat(cartTotal);
            if (!Number.isNaN(parsed)) {
              numericTotal = parsed;
            }
          }

          const cartSubtotalCents =
            typeof numericTotal === 'number' ? Math.round(numericTotal * 100) : undefined;

          const result = await issueDiscount(
            cartSubtotalCents ? { cartSubtotalCents } : undefined,
          );

          const code = result?.code;
          const shouldShowCodeFromCta =
            !!code &&
            (discountDeliveryMode === 'show_code_always' ||
              discountDeliveryMode === 'show_code_fallback' ||
              discountDeliveryMode === 'show_in_popup_authorized_only');

          if (shouldShowCodeFromCta) {
            setDiscountCodeToShow(code || null);
            shouldRedirect = false;
          }
        }
      } catch (err) {
        console.error('[CartAbandonmentPopup] Failed to issue discount on resume:', err);
      }

      if (shouldRedirect) {
        if (onResumeCheckout) {
          onResumeCheckout();
        } else if (config.ctaUrl) {
          window.location.href = config.ctaUrl;
        }
      }
    },
    [
      config.discount?.enabled,
      config.ctaUrl,
      cartTotal,
      discountCodeToShow,
      discountDeliveryMode,
      issueDiscount,
      onResumeCheckout,
    ],
  );

  const handleSaveForLater = useCallback(() => {
    if (onSaveForLater) {
      onSaveForLater();
    }
    onClose();
  }, [onSaveForLater, onClose]);

  const handleEmailSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setEmailError(null);
      setEmailSuccessMessage(null);

      const trimmed = email.trim();
      if (!trimmed) {
        setEmailError(config.emailErrorMessage || 'Please enter your email');
        return;
      }
      if (!validateEmail(trimmed)) {
        setEmailError(config.emailErrorMessage || 'Please enter a valid email');
        return;
      }

      if (!config.enableEmailRecovery) {
        handleResumeCheckout();
        return;
      }

      if (!onEmailRecovery) {
        handleResumeCheckout();
        return;
      }

      setIsEmailSubmitting(true);
      try {
        const result = onEmailRecovery(trimmed);
        let resolved: unknown = result;
        if (result && typeof (result as any).then === 'function') {
          resolved = await (result as Promise<unknown>);
        }

        if (typeof resolved === 'string' && resolved.length > 0) {
          setDiscountCodeToShow(resolved);
        }

        setEmailSuccessMessage(emailSuccessCopy);
      } catch (err) {
        console.error('[CartAbandonmentPopup] Email recovery failed', err);
        setEmailError(
          config.emailErrorMessage ||
            'Something went wrong. Please try again.',
        );
      } finally {
        setIsEmailSubmitting(false);
      }
    },
    [
      email,
      config.emailErrorMessage,
      config.enableEmailRecovery,
      emailSuccessCopy,
      onEmailRecovery,
      handleResumeCheckout,
    ],
  );

  const handleCopyCode = useCallback(async () => {
    if (!discountCodeToShow) return;

    try {
      const success = await copyToClipboard(discountCodeToShow);
      if (success) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch (err) {
      console.error('[CartAbandonmentPopup] Failed to copy discount code:', err);
    }
  }, [discountCodeToShow]);


  const displayItems = config.maxItemsToShow
    ? cartItems.slice(0, config.maxItemsToShow)
    : cartItems;

  const isBottomPosition = (config.position || 'center') === 'bottom';

  const isEmailGateActive =
    !!config.enableEmailRecovery &&
    !!config.requireEmailBeforeCheckout &&
    !discountCodeToShow;
  const borderRadiusValue =
    typeof config.borderRadius === 'number'
      ? `${config.borderRadius}px`
      : config.borderRadius || '16px';
  const cardMaxWidth =
    config.maxWidth ||
    (config.size === 'small'
      ? '24rem'
      : config.size === 'large'
      ? '32rem'
      : '28rem');
  const descriptionColor = config.descriptionColor || '#6b7280';

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    borderRadius: `${config.borderRadius ?? 8}px`,
    backgroundColor: config.buttonColor,
    color: config.buttonTextColor,
    cursor: 'pointer',
    transition: 'transform 0.1s',
  };

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'transparent',
    color: config.textColor,
    border: `2px solid ${config.textColor}`,
    opacity: 0.7,
  };

  const dismissButtonStyles: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    marginTop: '4px',
    color: config.textColor,
    fontSize: '14px',
    opacity: 0.7,
    cursor: 'pointer',
    textDecoration: 'underline',
    alignSelf: 'center',
    transition: 'opacity 0.15s ease-out',
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
        color: config.overlayColor || 'rgba(0, 0, 0, 1)',
        opacity: config.overlayOpacity ?? 0.6,
        blur: 4,
      }}
      animation={{
        type: config.animation || 'fade',
      }}
      position={config.position || 'center'}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
    >
      <style>{`
        .cart-ab-popup-container {
          width: 100%;
          max-width: ${cardMaxWidth};
          background: ${config.backgroundColor || '#ffffff'};
          color: ${config.textColor || '#111827'};
          border-radius: ${isBottomPosition ? '1rem 1rem 0 0' : borderRadiusValue};
          padding: 1.75rem 1.5rem 1.5rem;
          box-shadow: 0 24px 50px rgba(15, 23, 42, 0.25);
        }

        @media (min-width: 768px) {
          .cart-ab-popup-container {
            padding: 2rem;
          }
        }

        .cart-ab-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .cart-ab-header-text {
          flex: 1;
        }

        .cart-ab-title {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 0 0 0.25rem 0;
        }

        .cart-ab-subtitle {
          margin: 0;
          font-size: 0.9375rem;
          line-height: 1.6;
          color: ${descriptionColor};
        }

        .cart-ab-close {
          padding: 0.5rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: ${descriptionColor};
          transition: background 0.2s ease, color 0.2s ease;
          flex-shrink: 0;
        }

        .cart-ab-close:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .cart-ab-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cart-ab-urgency {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          background: #fef3c7;
          color: #92400e;
          text-align: center;
        }

        .cart-ab-discount {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          text-align: center;
          background: ${config.accentColor || '#dbeafe'};
        }

        .cart-ab-discount-label {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: ${descriptionColor};
        }

        .cart-ab-discount-amount {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .cart-ab-discount-code {
          display: inline-block;
          margin-top: 0.5rem;
          padding: 0.35rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          background: ${config.backgroundColor || '#ffffff'};
        }

        .cart-ab-items {
          border-radius: 0.75rem;
          border: 1px solid ${config.inputBorderColor || '#e5e7eb'};
          padding: 0.75rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .cart-ab-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid ${config.inputBorderColor || '#e5e7eb'};
        }

        .cart-ab-item:last-child {
          border-bottom: none;
        }

        .cart-ab-item-image {
          width: 3rem;
          height: 3rem;
          border-radius: 0.5rem;
          object-fit: cover;
          flex-shrink: 0;
        }

        .cart-ab-item-main {
          flex: 1;
        }

        .cart-ab-item-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .cart-ab-item-meta {
          font-size: 0.875rem;
          color: ${descriptionColor};
        }

        .cart-ab-item-price {
          font-size: 0.95rem;
          font-weight: 700;
          align-self: center;
        }

        .cart-ab-more {
          padding-top: 0.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: ${descriptionColor};
        }

        .cart-ab-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          background: ${config.accentColor || '#f3f4f6'};
          font-size: 1rem;
          font-weight: 600;
        }

        .cart-ab-code-copy {
          margin-top: 0.5rem;
          padding: 0.4rem 0.9rem;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 9999px;
          border: 1px solid ${config.buttonColor};
          background: transparent;
          color: ${config.buttonColor};
          cursor: pointer;
        }

        .cart-ab-code-copy:hover {
          background: ${config.buttonColor};
          color: ${config.buttonTextColor};
        }


        .cart-ab-stock-warning {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: #fee2e2;
          color: #991b1b;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }

        .cart-ab-footer {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cart-ab-code-block {
          margin-top: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: #ecfdf5;
          border: 1px solid ${config.successColor || '#16a34a'};
          text-align: center;
        }

        .cart-ab-code-label {
          margin: 0 0 0.25rem 0;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: ${config.successColor || '#16a34a'};
        }

        .cart-ab-code-value {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

          gap: 0.75rem;
        }

        .cart-ab-primary-button,
        .cart-ab-secondary-button {
          width: 100%;
        }

        .cart-ab-secondary-button {
          font-size: 0.95rem;
        }

        .cart-ab-email-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .cart-ab-email-row {
          display: flex;
          gap: 0.5rem;
        }

        .cart-ab-email-input {
          flex: 1;
          min-width: 0;
          padding: 0.6rem 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid ${config.inputBorderColor || '#e5e7eb'};
          background: ${config.inputBackgroundColor || '#ffffff'};
          color: ${config.inputTextColor || config.textColor || '#111827'};
        }

        .cart-ab-email-error {
          color: #b91c1c;
          font-size: 0.8rem;
        }

        .cart-ab-email-success {
          color: ${config.successColor || '#16a34a'};
          font-size: 0.8rem;
        }

        .cart-ab-dismiss-button {
          background: transparent;
          border: none;
          padding: 0;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: ${descriptionColor};
          text-decoration: underline;
          text-underline-offset: 2px;
          cursor: pointer;
          align-self: center;
        }
      `}</style>

      <div className="cart-ab-popup-container">
        <div className="cart-ab-header">
          <div className="cart-ab-header-text">
            <h2 className="cart-ab-title">{config.headline}</h2>
            {config.subheadline && (
              <p className="cart-ab-subtitle">
                {config.subheadline}
              </p>
            )}
          </div>

          {config.showCloseButton !== false && (
            <button
              className="cart-ab-close"
              onClick={onClose}
              aria-label="Close popup"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="cart-ab-body">
          {config.showUrgency && config.urgencyTimer && timeRemaining.total > 0 && (
            <div className="cart-ab-urgency">
              {config.urgencyMessage?.replace(
                '{{time}}',
                `${timeRemaining.minutes}:${String(timeRemaining.seconds).padStart(2, '0')}`,
              ) ||
                `Complete your order in ${timeRemaining.minutes}:${String(
                  timeRemaining.seconds,
                ).padStart(2, '0')}`}
            </div>
          )}

          {config.discount?.enabled && config.discount.code && (
            <div className="cart-ab-discount">
              <p className="cart-ab-discount-label">
                Special offer for you!
              </p>
              <div className="cart-ab-discount-amount">
                {config.discount.percentage && `${config.discount.percentage}% OFF`}
                {config.discount.value && !config.discount.percentage && `$${config.discount.value} OFF`}
              </div>
              <code className="cart-ab-discount-code">
                {config.discount.code}
              </code>
            </div>
          )}

          {config.showCartItems !== false && displayItems.length > 0 && (
            <div className="cart-ab-items">
              {displayItems.map((item) => (
                <div key={item.id} className="cart-ab-item">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="cart-ab-item-image"
                    />
                  )}
                  <div className="cart-ab-item-main">
                    <div className="cart-ab-item-title">
                      {item.title}
                    </div>
                    <div className="cart-ab-item-meta">
                      Qty: {item.quantity}
                    </div>
                  </div>
                  <div className="cart-ab-item-price">
                    {formatCurrency(item.price, config.currency)}
                  </div>
                </div>
              ))}

              {cartItems.length > displayItems.length && (
                <div className="cart-ab-more">
                  +{cartItems.length - displayItems.length} more item
                  {cartItems.length - displayItems.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {config.showCartTotal !== false && cartTotal && (
            <div className="cart-ab-total">
              <span>Total:</span>
              <span>
                {typeof cartTotal === 'number'
                  ? formatCurrency(cartTotal, config.currency)
                  : cartTotal}
              </span>
            </div>
          )}

          {config.showStockWarnings && (
            <div className="cart-ab-stock-warning">
              {config.stockWarningMessage || '⚠️ Items in your cart are selling fast!'}
            </div>
          )}

          <div className="cart-ab-footer">
            {config.enableEmailRecovery && (
              <form onSubmit={handleEmailSubmit} className="cart-ab-email-form">
                <div className="cart-ab-email-row">
                  <input
                    type="email"
                    className="cart-ab-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      config.emailPlaceholder ||
                      'Enter your email to receive your cart and discount'
                    }
                    aria-label="Email address for cart recovery"
                  />
                  <button
                    type="submit"
                    style={buttonStyles}
                    disabled={isEmailSubmitting}
                  >
                    {isEmailSubmitting
                      ? 'Sending…'
                      : config.emailButtonText || 'Email me my cart'}
                  </button>
                </div>
                {emailError && (
                  <p className="cart-ab-email-error">{emailError}</p>
                )}
                {emailSuccessMessage && (
                  <p className="cart-ab-email-success">
                    {emailSuccessMessage}
                  </p>
                )}
              </form>
            )}

            {discountCodeToShow && (
              <div className="cart-ab-code-block">
                <p className="cart-ab-code-label">Your discount code:</p>
                <p className="cart-ab-code-value">{discountCodeToShow}</p>
                <button
                  type="button"
                  className="cart-ab-code-copy"
                  onClick={handleCopyCode}
                >
                  {copiedCode ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}

            {!isEmailGateActive && (
              <button
                onClick={handleResumeCheckout}
                style={buttonStyles}
                className="cart-ab-primary-button"
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {config.buttonText || config.ctaText || 'Resume Checkout'}
              </button>
            )}

            {config.saveForLaterText && !isEmailGateActive && (
                <button
                  onClick={handleSaveForLater}
                  style={secondaryButtonStyles}
                  className="cart-ab-secondary-button"
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                >
                  {config.saveForLaterText}
                </button>
              )}

            <button
              type="button"
              onClick={onClose}
              style={dismissButtonStyles}
              className="cart-ab-dismiss-button"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              {config.dismissLabel || 'No thanks'}
            </button>
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};

