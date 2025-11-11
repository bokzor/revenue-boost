/**
 * FlashSalePopup Component
 *
 * Urgency-driven flash sale popup featuring:
 * - Live countdown timer (hours:minutes:seconds)
 * - Auto-update every second
 * - Auto-hide on timer expiry
 * - Optional stock counter
 * - Discount display
 * - Urgency messaging
 * - CTA button with link
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BasePopup } from './BasePopup';
import type { PopupDesignConfig } from './types';
import type { FlashSaleContent } from '~/domains/campaigns/types/campaign';
import { calculateTimeRemaining, formatTimeRemaining } from './utils';

/**
 * FlashSaleConfig - Extends both design config AND campaign content type
 * All content fields come from FlashSaleContent
 * All design fields come from PopupDesignConfig
 */
export interface FlashSaleConfig extends PopupDesignConfig, FlashSaleContent {
  // Storefront-specific fields only
  ctaOpenInNewTab?: boolean;

  // Note: headline, subheadline, discountPercentage, urgencyMessage, etc.
  // all come from FlashSaleContent
}

export interface FlashSalePopupProps {
  config: FlashSaleConfig;
  isVisible: boolean;
  onClose: () => void;
  onExpiry?: () => void;
  onCtaClick?: () => void;
}

export const FlashSalePopup: React.FC<FlashSalePopupProps> = ({
  config,
  isVisible,
  onClose,
  onExpiry,
  onCtaClick,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (config.endTime) {
      return calculateTimeRemaining(config.endTime);
    } else if (config.countdownDuration) {
      const endDate = new Date(Date.now() + config.countdownDuration * 1000);
      return calculateTimeRemaining(endDate);
    }
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  });

  const [hasExpired, setHasExpired] = useState(false);

  // Update countdown every second
  useEffect(() => {
    if (!config.showCountdown || hasExpired) return;

    const timer = setInterval(() => {
      let newTime;

      if (config.endTime) {
        newTime = calculateTimeRemaining(config.endTime);
      } else if (config.countdownDuration) {
        const endDate = new Date(Date.now() + config.countdownDuration * 1000);
        newTime = calculateTimeRemaining(endDate);
      } else {
        return;
      }

      setTimeRemaining(newTime);

      // Check if expired
      if (newTime.total <= 0) {
        setHasExpired(true);
        if (onExpiry) {
          onExpiry();
        }
        if (config.hideOnExpiry) {
          onClose();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [config, hasExpired, onExpiry, onClose]);

  const handleCtaClick = useCallback(() => {
    if (onCtaClick) {
      onCtaClick();
    }

    if (config.ctaUrl) {
      if (config.ctaOpenInNewTab) {
        window.open(config.ctaUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = config.ctaUrl;
      }
    }
  }, [config, onCtaClick]);

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 700,
    border: 'none',
    borderRadius: `${config.borderRadius ?? 8}px`,
    backgroundColor: config.buttonColor,
    color: config.buttonTextColor,
    cursor: 'pointer',
    transition: 'transform 0.1s',
    textDecoration: 'none',
    display: 'inline-block',
    textAlign: 'center',
  };

  const timerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '20px 0',
  };

  const timerUnitStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '60px',
  };

  const timerNumberStyles: React.CSSProperties = {
    fontSize: '36px',
    fontWeight: 700,
    lineHeight: 1,
    padding: '12px 16px',
    backgroundColor: config.accentColor || 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    minWidth: '60px',
    textAlign: 'center',
  };

  const timerLabelStyles: React.CSSProperties = {
    fontSize: '12px',
    marginTop: '6px',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <BasePopup config={config} isVisible={isVisible} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
        {/* Headline */}
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', lineHeight: 1.2 }}>
            {config.headline}
          </h2>
          {config.subheadline && (
            <p style={{ fontSize: '18px', margin: 0, opacity: 0.9 }}>
              {config.subheadline}
            </p>
          )}
        </div>

        {/* Discount display */}
        {(config.discountPercentage || config.discountValue) && (
          <div style={{
            padding: '24px',
            backgroundColor: config.accentColor || 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            margin: '8px 0',
          }}>
            <div style={{ fontSize: '64px', fontWeight: 700, lineHeight: 1 }}>
              {config.discountType === 'percentage' && config.discountPercentage && `${config.discountPercentage}%`}
              {config.discountType === 'fixed_amount' && config.discountValue && `$${config.discountValue}`}
              {!config.discountType && config.discountPercentage && `${config.discountPercentage}%`}
            </div>
            <div style={{ fontSize: '18px', marginTop: '8px', fontWeight: 600 }}>
              OFF
            </div>

            {/* Price comparison */}
            {config.originalPrice && config.salePrice && (
              <div style={{ marginTop: '16px', fontSize: '20px' }}>
                <span style={{ textDecoration: 'line-through', opacity: 0.6, marginRight: '12px' }}>
                  ${config.originalPrice}
                </span>
                <span style={{ fontWeight: 700, fontSize: '28px' }}>
                  ${config.salePrice}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Countdown timer */}
        {config.showCountdown !== false && !hasExpired && (
          <div>
            {config.urgencyMessage && (
              <p style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>
                {config.urgencyMessage}
              </p>
            )}
            <div style={timerStyles}>
              {timeRemaining.days > 0 && (
                <div style={timerUnitStyles}>
                  <div style={timerNumberStyles}>{String(timeRemaining.days).padStart(2, '0')}</div>
                  <div style={timerLabelStyles}>Days</div>
                </div>
              )}
              <div style={timerUnitStyles}>
                <div style={timerNumberStyles}>{String(timeRemaining.hours).padStart(2, '0')}</div>
                <div style={timerLabelStyles}>Hours</div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700, opacity: 0.5 }}>:</div>
              <div style={timerUnitStyles}>
                <div style={timerNumberStyles}>{String(timeRemaining.minutes).padStart(2, '0')}</div>
                <div style={timerLabelStyles}>Minutes</div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700, opacity: 0.5 }}>:</div>
              <div style={timerUnitStyles}>
                <div style={timerNumberStyles}>{String(timeRemaining.seconds).padStart(2, '0')}</div>
                <div style={timerLabelStyles}>Seconds</div>
              </div>
            </div>
          </div>
        )}

        {/* Stock counter */}
        {config.showStockCounter && config.stockCount !== undefined && (
          <div style={{
            padding: '12px 20px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
          }}>
            ⚠️ Only {config.stockCount} left in stock!
          </div>
        )}

        {/* Expired message */}
        {hasExpired && !config.hideOnExpiry && (
          <div style={{
            padding: '16px',
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 600,
          }}>
            This sale has ended
          </div>
        )}

        {/* CTA button */}
        {!hasExpired && (
          <button
            onClick={handleCtaClick}
            style={buttonStyles}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {config.buttonText || config.ctaText || 'Shop Now'}
          </button>
        )}
      </div>
    </BasePopup>
  );
};

