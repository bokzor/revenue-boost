/**
 * CountdownTimerPopup Component
 *
 * Banner-style countdown timer popup featuring:
 * - Live countdown timer (compact format)
 * - Top/bottom positioning
 * - Sticky option for persistent visibility
 * - Auto-hide on expiry
 * - Optional stock counter
 * - Minimal height for non-intrusive display
 * - CTA button
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { PopupDesignConfig } from './types';
import type { CountdownTimerContent } from '~/domains/campaigns/types/campaign';
import { calculateTimeRemaining } from './utils';

/**
 * CountdownTimerConfig - Extends both design config AND campaign content type
 * All content fields come from CountdownTimerContent
 * All design fields come from PopupDesignConfig
 */
export interface CountdownTimerConfig extends PopupDesignConfig, CountdownTimerContent {
  // Storefront-specific fields only
  ctaOpenInNewTab: boolean; // required by content schema default
  colorScheme: 'custom' | 'info' | 'success' | 'urgent';

  // Note: headline, endTime, countdownDuration, ctaUrl, etc.
  // all come from CountdownTimerContent
}

export interface CountdownTimerPopupProps {
  config: CountdownTimerConfig;
  isVisible: boolean;
  onClose: () => void;
  onExpiry?: () => void;
  onCtaClick?: () => void;
}

export const CountdownTimerPopup: React.FC<CountdownTimerPopupProps> = ({
  config,
  isVisible,
  onClose,
  onExpiry,
  onCtaClick,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (config.endTime) {
      return calculateTimeRemaining(config.endTime);
    }
    if (config.countdownDuration) {
      const endDate = new Date(Date.now() + config.countdownDuration * 1000);
      return calculateTimeRemaining(endDate);
    }
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  });

  const [hasExpired, setHasExpired] = useState(false);

  // Update countdown every second using a stable target time
  useEffect(() => {
    if (!isVisible || hasExpired) return;

    let targetDate: Date | null = null;

    if (config.endTime) {
      targetDate = new Date(config.endTime);
    } else if (config.countdownDuration) {
      targetDate = new Date(Date.now() + config.countdownDuration * 1000);
    }

    if (!targetDate || isNaN(targetDate.getTime())) {
      return;
    }

    const updateTimer = () => {
      const remaining = calculateTimeRemaining(targetDate as Date);
      setTimeRemaining(remaining);

      if (remaining.total <= 0 && !hasExpired) {
        setHasExpired(true);
        if (onExpiry) {
          onExpiry();
        }
        if (config.hideOnExpiry) {
          onClose();
        }
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [
    config.endTime,
    config.countdownDuration,
    config.hideOnExpiry,
    isVisible,
    hasExpired,
    onExpiry,
    onClose,
  ]);

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

  if (!isVisible || (hasExpired && config.hideOnExpiry)) return null;

  // Color scheme presets adapted from mock countdown banner
  const getColorSchemeStyles = () => {
    switch (config.colorScheme) {
      case 'urgent':
        return {
          background: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
          text: '#ffffff',
          timerBg: 'rgba(255, 255, 255, 0.2)',
          timerText: '#ffffff',
          ctaBg: '#ffffff',
          ctaText: '#dc2626',
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
          text: '#ffffff',
          timerBg: 'rgba(255, 255, 255, 0.2)',
          timerText: '#ffffff',
          ctaBg: '#ffffff',
          ctaText: '#10b981',
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
          text: '#ffffff',
          timerBg: 'rgba(255, 255, 255, 0.2)',
          timerText: '#ffffff',
          ctaBg: '#ffffff',
          ctaText: '#3b82f6',
        };
      default:
        return {
          background: config.backgroundColor,
          text: config.textColor,
          timerBg: config.inputBackgroundColor || 'rgba(0, 0, 0, 0.08)',
          timerText: config.textColor,
          ctaBg: config.buttonColor,
          ctaText: config.buttonTextColor || '#ffffff',
        };
    }
  };

  const schemeColors = getColorSchemeStyles();

  const positionStyle: React.CSSProperties = config.sticky
    ? {
        position: 'fixed',
        [config.position === 'bottom' ? 'bottom' : 'top']: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }
    : {
        position: 'relative',
      };

  return (
    <>
      <style>{`
        .countdown-banner {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          container-type: inline-size;
          container-name: countdown-banner;
        }
        .countdown-banner-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          position: relative;
          padding-right: 3.5rem;
        }
        .countdown-banner-left {
          flex: 1;
          min-width: 0;
        }
        .countdown-banner-headline {
          font-size: 1.125rem;
          font-weight: 700;
          line-height: 1.4;
          margin: 0 0 0.25rem 0;
        }
        .countdown-banner-subheadline {
          font-size: 0.875rem;
          line-height: 1.4;
          margin: 0;
          opacity: 0.9;
        }
        .countdown-banner-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .countdown-banner-timer {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .countdown-banner-timer-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          min-width: 3.5rem;
        }
        .countdown-banner-timer-value {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .countdown-banner-timer-label {
          font-size: 0.625rem;
          text-transform: uppercase;
          opacity: 0.8;
          margin-top: 0.25rem;
          letter-spacing: 0.5px;
        }
        .countdown-banner-timer-separator {
          font-size: 1.25rem;
          font-weight: 700;
          opacity: 0.6;
        }
        .countdown-banner-stock {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          white-space: nowrap;
        }
        .countdown-banner-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .countdown-banner-cta {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .countdown-banner-cta:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        .countdown-banner-cta:active:not(:disabled) {
          transform: translateY(0);
        }
        .countdown-banner-cta:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .countdown-banner-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: transparent;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          opacity: 0.7;
          transition: opacity 0.2s;
          padding: 0.25rem;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .countdown-banner-close:hover {
          opacity: 1;
        }
        .countdown-banner-expired {
          text-align: center;
          padding: 0.5rem;
          font-weight: 600;
        }


        @container countdown-banner (max-width: 768px) {
          .countdown-banner-content {
            flex-direction: column;
            padding: 1.25rem 1rem;
            gap: 1rem;
            text-align: center;
            padding-right: 3rem;
          }
          .countdown-banner-right {
            width: 100%;
          }
          .countdown-banner-cta {
            width: 100%;
          }
          .countdown-banner-headline {
            font-size: 1rem;
          }
          .countdown-banner-subheadline {
            font-size: 0.8125rem;
          }
          .countdown-banner-timer-unit {
            min-width: 3rem;
            padding: 0.375rem 0.5rem;
          }
          .countdown-banner-timer-value {
            font-size: 1.25rem;
          }
          .countdown-banner-timer-label {
            font-size: 0.5625rem;
          }
          .countdown-banner-close {
            top: 0.5rem;
            right: 0.5rem;
          }
        }
        @container countdown-banner (max-width: 480px) {
          .countdown-banner-content {
            padding: 1rem 0.75rem;
            padding-right: 2.5rem;
          }
          .countdown-banner-timer {
            gap: 0.25rem;
          }
          .countdown-banner-timer-unit {
            min-width: 2.5rem;
            padding: 0.25rem 0.375rem;
          }
          .countdown-banner-timer-value {
            font-size: 1.125rem;
          }
          .countdown-banner-timer-separator {
            font-size: 1rem;
          }
        }
      `}</style>

      <div
        className="countdown-banner"
        style={{
          ...positionStyle,
          background: schemeColors.background,
          color: schemeColors.text,
          boxShadow:
            config.position === 'bottom'
              ? '0 -2px 8px rgba(0, 0, 0, 0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="countdown-banner-content">
          {config.showCloseButton !== false && (
            <button
              className="countdown-banner-close"
              onClick={onClose}
              style={{ color: schemeColors.text }}
              aria-label="Close banner"
            >
              ×
            </button>
          )}

          <div className="countdown-banner-left">
            <h2 className="countdown-banner-headline">{config.headline}</h2>
            {config.subheadline && (
              <p className="countdown-banner-subheadline">{config.subheadline}</p>
            )}
          </div>

          <div className="countdown-banner-center">
            {!hasExpired ? (
              <>
                <div className="countdown-banner-timer">
                  {timeRemaining.days > 0 && (
                    <>
                      <div
                        className="countdown-banner-timer-unit"
                        style={{
                          background: schemeColors.timerBg,
                          color: schemeColors.timerText,
                        }}
                      >
                        <div className="countdown-banner-timer-value">
                          {String(timeRemaining.days).padStart(2, '0')}
                        </div>
                        <div className="countdown-banner-timer-label">Days</div>
                      </div>
                      <span
                        className="countdown-banner-timer-separator"
                        style={{ color: schemeColors.text }}
                      >
                        :
                      </span>
                    </>
                  )}

                  <div
                    className="countdown-banner-timer-unit"
                    style={{
                      background: schemeColors.timerBg,
                      color: schemeColors.timerText,
                    }}
                  >
                    <div className="countdown-banner-timer-value">
                      {String(timeRemaining.hours).padStart(2, '0')}
                    </div>
                    <div className="countdown-banner-timer-label">Hours</div>
                  </div>

                  <span
                    className="countdown-banner-timer-separator"
                    style={{ color: schemeColors.text }}
                  >
                    :
                  </span>

                  <div
                    className="countdown-banner-timer-unit"
                    style={{
                      background: schemeColors.timerBg,
                      color: schemeColors.timerText,
                    }}
                  >
                    <div className="countdown-banner-timer-value">
                      {String(timeRemaining.minutes).padStart(2, '0')}
                    </div>
                    <div className="countdown-banner-timer-label">Mins</div>
                  </div>

                  <span
                    className="countdown-banner-timer-separator"
                    style={{ color: schemeColors.text }}
                  >
                    :
                  </span>

                  <div
                    className="countdown-banner-timer-unit"
                    style={{
                      background: schemeColors.timerBg,
                      color: schemeColors.timerText,
                    }}
                  >
                    <div className="countdown-banner-timer-value">
                      {String(timeRemaining.seconds).padStart(2, '0')}
                    </div>
                    <div className="countdown-banner-timer-label">Secs</div>
                  </div>
                </div>

                {config.showStockCounter && config.stockCount && (
                  <div
                    className="countdown-banner-stock"
                    style={{ color: schemeColors.text }}
                  >
                    ⚡ Only {config.stockCount} left in stock
                  </div>
                )}
              </>
            ) : (
              <div
                className="countdown-banner-expired"
                style={{ color: schemeColors.text }}
              >
                Offer has ended
              </div>
            )}
          </div>

          <div className="countdown-banner-right">
            {(config.buttonText || config.ctaText || hasExpired) && (
              <button
                className="countdown-banner-cta"
                onClick={handleCtaClick}
                disabled={hasExpired}
                style={{
                  background: schemeColors.ctaBg,
                  color: schemeColors.ctaText,
                  borderRadius: `${config.borderRadius ?? 6}px`,
                }}
              >
                {hasExpired ? 'Offer Expired' : (config.buttonText || config.ctaText)}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

