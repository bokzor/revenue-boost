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
import { calculateTimeRemaining, formatCurrency } from './utils';

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
}

export const CartAbandonmentPopup: React.FC<CartAbandonmentPopupProps> = ({
  config,
  isVisible,
  onClose,
  cartItems = [],
  cartTotal,
  onResumeCheckout,
  onSaveForLater,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (config.urgencyTimer) {
      const endDate = new Date(Date.now() + config.urgencyTimer * 1000);
      return calculateTimeRemaining(endDate);
    }
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  });

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

  const handleResumeCheckout = useCallback(() => {
    if (onResumeCheckout) {
      onResumeCheckout();
    } else if (config.ctaUrl) {
      window.location.href = config.ctaUrl;
    }
  }, [config.ctaUrl, onResumeCheckout]);

  const handleSaveForLater = useCallback(() => {
    if (onSaveForLater) {
      onSaveForLater();
    }
    onClose();
  }, [onSaveForLater, onClose]);

  const displayItems = config.maxItemsToShow
    ? cartItems.slice(0, config.maxItemsToShow)
    : cartItems;

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Headline */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
            {config.headline}
          </h2>
          {config.subheadline && (
            <p style={{ fontSize: '16px', margin: 0, opacity: 0.8 }}>
              {config.subheadline}
            </p>
          )}
        </div>

        {/* Urgency timer */}
        {config.showUrgency && config.urgencyTimer && timeRemaining.total > 0 && (
          <div style={{
            padding: '16px',
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: 600,
          }}>
            {config.urgencyMessage?.replace('{{time}}', `${timeRemaining.minutes}:${String(timeRemaining.seconds).padStart(2, '0')}`)
              || `Complete your order in ${timeRemaining.minutes}:${String(timeRemaining.seconds).padStart(2, '0')}`}
          </div>
        )}

        {/* Discount offer */}
        {config.discount?.enabled && config.discount.code && (
          <div style={{
            padding: '16px',
            backgroundColor: config.accentColor || '#DBEAFE',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '14px', margin: '0 0 8px 0', fontWeight: 600 }}>
              Special offer for you!
            </p>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>
              {config.discount.percentage && `${config.discount.percentage}% OFF`}
              {config.discount.value && `$${config.discount.value} OFF`}
            </div>
            <code style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '6px 12px',
              backgroundColor: config.backgroundColor,
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '1px',
            }}>
              {config.discount.code}
            </code>
          </div>
        )}

        {/* Cart items */}
        {config.showCartItems !== false && displayItems.length > 0 && (
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: `1px solid ${config.inputBorderColor || '#E5E7EB'}`,
            borderRadius: '8px',
            padding: '12px',
          }}>
            {displayItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: `1px solid ${config.inputBorderColor || '#E5E7EB'}`,
                }}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>
                    Qty: {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>
                  {formatCurrency(item.price, config.currency)}
                </div>
              </div>
            ))}

            {cartItems.length > displayItems.length && (
              <div style={{ padding: '12px 0', textAlign: 'center', fontSize: '14px', opacity: 0.7 }}>
                +{cartItems.length - displayItems.length} more item{cartItems.length - displayItems.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Cart total */}
        {config.showCartTotal !== false && cartTotal && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: config.accentColor || '#F3F4F6',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 700,
          }}>
            <span>Total:</span>
            <span>{typeof cartTotal === 'number' ? formatCurrency(cartTotal, config.currency) : cartTotal}</span>
          </div>
        )}

        {/* Stock warning */}
        {config.showStockWarnings && (
          <div style={{
            padding: '12px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            textAlign: 'center',
          }}>
            {config.stockWarningMessage || '⚠️ Items in your cart are selling fast!'}
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleResumeCheckout}
            style={buttonStyles}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {config.buttonText || config.ctaText || 'Resume Checkout'}
          </button>

          {config.saveForLaterText && (
            <button
              onClick={handleSaveForLater}
              style={secondaryButtonStyles}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              {config.saveForLaterText}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={dismissButtonStyles}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
          >
            {config.dismissLabel || 'No thanks'}
          </button>
        </div>
      </div>
    </PopupPortal>
  );
};

