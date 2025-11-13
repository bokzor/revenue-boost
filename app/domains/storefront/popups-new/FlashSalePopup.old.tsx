/**
 * FlashSalePopup Component
 *
 * Redesigned flash sale popup featuring:
 * - Live countdown timer with clean design
 * - Auto-update every second
 * - Auto-hide on timer expiry
 * - Optional stock counter with animated dot
 * - Circular discount display
 * - "Limited Time" badge
 * - Enhanced expired state
 * - Themes handled through design config (like Newsletter)
 * - Uses PopupPortal for consistent behavior
 */

import React, { useState, useEffect } from 'react';
import type { PopupDesignConfig } from './types';
import type { FlashSaleContent } from '~/domains/campaigns/types/campaign';
import { PopupPortal } from './PopupPortal';

/**
 * FlashSale-specific configuration
 * Extends both design config and content type
 */
export interface FlashSaleConfig extends PopupDesignConfig, FlashSaleContent {
  // Storefront-specific fields
  ctaOpenInNewTab?: boolean;
}

export interface FlashSalePopupProps {
  config: FlashSaleConfig;
  isVisible: boolean;
  onClose: () => void;
  onExpiry?: () => void;
  onCtaClick?: () => void;
}

interface TimeRemaining {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeRemaining(endTime: Date | string): TimeRemaining {
  const end = typeof endTime === "string" ? new Date(endTime).getTime() : endTime.getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);

  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
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
        if (config.hideOnExpiry || config.autoHideOnExpire) {
          setTimeout(() => onClose(), config.autoHideOnExpire ? 2000 : 0);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [config, hasExpired, onExpiry, onClose]);

  const handleCtaClick = () => {
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
  };

  if (!isVisible) return null;

  // Size configuration
  const popupSize = config.popupSize || 'standard';
  const maxWidth = popupSize === 'compact' ? '24rem' :
                   popupSize === 'wide' ? '56rem' :
                   popupSize === 'full' ? '90%' : '32rem';

  const padding = popupSize === 'compact' ? '2rem 1.5rem' :
                  popupSize === 'wide' || popupSize === 'full' ? '3rem' : '2.5rem 2rem';

  const headlineSize = popupSize === 'compact' ? '2rem' :
                       popupSize === 'wide' || popupSize === 'full' ? '3rem' : '2.5rem';

  const discountSize = popupSize === 'compact' ? '6rem' :
                       popupSize === 'wide' || popupSize === 'full' ? '10rem' : '8rem';

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || 'rgba(0, 0, 0, 0.7)',
        opacity: config.overlayOpacity ?? 0.7,
        blur: 4,
      }}
      animation={{
        type: config.animation || 'zoom',
      }}
      position={config.position || 'center'}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.ariaLabel || config.headline || 'Flash Sale'}
      ariaDescribedBy={config.ariaDescribedBy}
    >
      <style>{`
        .flash-sale-container {
          position: relative;
          width: 100%;
          max-width: ${maxWidth};
          border-radius: ${typeof config.borderRadius === 'number' ? config.borderRadius : parseFloat(config.borderRadius || '16')}px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          background: ${config.backgroundColor || '#ffffff'};
          color: ${config.textColor || '#111827'};
          font-family: ${config.fontFamily || 'inherit'};
        }

        .flash-sale-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          padding: 0.5rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          color: ${config.descriptionColor || config.textColor || '#52525b'};
        }

        .flash-sale-close:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .flash-sale-content {
          padding: ${padding};
          text-align: center;
        }

        .flash-sale-badge {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          text-transform: uppercase;
          background: ${config.accentColor || '#ef4444'};
          color: ${config.backgroundColor || '#ffffff'};
        }

        .flash-sale-headline {
          font-size: ${headlineSize};
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 0.75rem;
          color: ${config.textColor || '#111827'};
        }

        .flash-sale-supporting {
          font-size: 1.125rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          color: ${config.descriptionColor || config.textColor || '#52525b'};
        }

        .flash-sale-discount {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: ${discountSize};
          height: ${discountSize};
          border-radius: 9999px;
          margin-bottom: 2rem;
          position: relative;
          background: ${config.accentColor || '#ef4444'};
          color: ${config.backgroundColor || '#ffffff'};
        }

        .flash-sale-discount::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          padding: 4px;
          background: currentColor;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.3;
        }

        .flash-sale-discount-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .flash-sale-discount-percent {
          font-size: calc(${discountSize} * 0.4);
          font-weight: 900;
          line-height: 1;
        }

        .flash-sale-discount-label {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
        }

        .flash-sale-prices {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .flash-sale-original-price {
          font-size: 1.25rem;
          text-decoration: line-through;
          opacity: 0.6;
          color: ${config.descriptionColor || config.textColor || '#52525b'};
        }

        .flash-sale-sale-price {
          font-size: 2rem;
          font-weight: 900;
          color: ${config.accentColor || '#ef4444'};
        }

        .flash-sale-urgency {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
          color: ${config.descriptionColor || config.textColor || '#52525b'};
        }

        .flash-sale-timer {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .flash-sale-timer-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          min-width: 4rem;
          padding: 1rem 0.75rem;
          border-radius: 0.5rem;
          background: ${config.accentColor ? `${config.accentColor}20` : 'rgba(239, 68, 68, 0.1)'};
          color: ${config.accentColor || '#ef4444'};
        }

        .flash-sale-timer-value {
          font-size: 2rem;
          font-weight: 900;
          line-height: 1;
        }

        .flash-sale-timer-label {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
        }

        .flash-sale-stock {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 2rem;
          background: ${config.accentColor ? `${config.accentColor}20` : 'rgba(239, 68, 68, 0.1)'};
          color: ${config.accentColor || '#ef4444'};
        }

        .flash-sale-stock-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background: ${config.accentColor || '#ef4444'};
          animation: pulse 2s infinite;
        }

        .flash-sale-cta {
          width: 100%;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          border: none;
          font-size: 1.125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: ${config.buttonColor || config.accentColor || '#ef4444'};
          color: ${config.buttonTextColor || '#ffffff'};
        }

        .flash-sale-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }

        .flash-sale-cta:active {
          transform: translateY(0);
        }

        .flash-sale-expired {
          padding: 2rem;
          text-align: center;
        }

        .flash-sale-expired-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .flash-sale-content-wide {
            text-align: center;
          }
        }

        @media (max-width: 640px) {
          .flash-sale-content {
            padding: 2rem 1.5rem;
          }

          .flash-sale-headline {
            font-size: 2rem;
          }

          .flash-sale-discount {
            width: 7rem;
            height: 7rem;
          }

          .flash-sale-discount-percent {
            font-size: 2rem;
          }

          .flash-sale-timer-unit {
            min-width: 3.5rem;
            padding: 0.75rem 0.5rem;
          }

          .flash-sale-timer-value {
            font-size: 1.5rem;
          }
        }
      `}</style>

      <div className="flash-sale-container">
        <button
          onClick={onClose}
          className="flash-sale-close"
          aria-label="Close popup"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {hasExpired ? (
          <div className="flash-sale-expired">
            <div className="flash-sale-expired-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
              Sale Ended
            </h3>
            <p style={{ opacity: 0.8 }}>
              This flash sale has expired. Check back soon for more deals!
            </p>
          </div>
        ) : (
          <div className="flash-sale-content">
            <div className="flash-sale-badge">
              Limited Time
            </div>

            <h2 className="flash-sale-headline">
              {config.headline || 'Flash Sale!'}
            </h2>

            <p className="flash-sale-supporting">
              {config.subheadline || 'Limited time offer - Don\'t miss out!'}
            </p>

            {config.discountPercentage && (
              <div className="flash-sale-discount">
                <div className="flash-sale-discount-inner">
                  <div className="flash-sale-discount-percent">
                    {config.discountPercentage}%
                  </div>
                  <div className="flash-sale-discount-label">OFF</div>
                </div>
              </div>
            )}

            {(config.originalPrice || config.salePrice) && (
              <div className="flash-sale-prices">
                {config.originalPrice && (
                  <div className="flash-sale-original-price">
                    ${config.originalPrice}
                  </div>
                )}
                {config.salePrice && (
                  <div className="flash-sale-sale-price">
                    ${config.salePrice}
                  </div>
                )}
              </div>
            )}

            {config.urgencyMessage && (
              <div className="flash-sale-urgency">
                {config.urgencyMessage}
              </div>
            )}

            {config.showCountdown && (
              <div className="flash-sale-timer">
                {timeRemaining.days > 0 && (
                  <div className="flash-sale-timer-unit">
                    <div className="flash-sale-timer-value">
                      {String(timeRemaining.days).padStart(2, "0")}
                    </div>
                    <div className="flash-sale-timer-label">Days</div>
                  </div>
                )}
                <div className="flash-sale-timer-unit">
                  <div className="flash-sale-timer-value">
                    {String(timeRemaining.hours).padStart(2, "0")}
                  </div>
                  <div className="flash-sale-timer-label">Hours</div>
                </div>
                <div className="flash-sale-timer-unit">
                  <div className="flash-sale-timer-value">
                    {String(timeRemaining.minutes).padStart(2, "0")}
                  </div>
                  <div className="flash-sale-timer-label">Mins</div>
                </div>
                <div className="flash-sale-timer-unit">
                  <div className="flash-sale-timer-value">
                    {String(timeRemaining.seconds).padStart(2, "0")}
                  </div>
                  <div className="flash-sale-timer-label">Secs</div>
                </div>
              </div>
            )}

            {(config.showStockCounter && config.stockMessage) && (
              <div className="flash-sale-stock">
                <div className="flash-sale-stock-dot" />
                {config.stockMessage}
              </div>
            )}

            <button
              onClick={handleCtaClick}
              className="flash-sale-cta"
            >
              {config.buttonText || 'Shop Now'}
            </button>
          </div>
        )}
      </div>
    </PopupPortal>
  );
};

export default FlashSalePopup;

