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
    } else if (config.countdownDuration) {
      const endDate = new Date(Date.now() + config.countdownDuration * 1000);
      return calculateTimeRemaining(endDate);
    }
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  });

  const [hasExpired, setHasExpired] = useState(false);

  // Update countdown every second
  useEffect(() => {
    if (hasExpired) return;

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

  if (!isVisible || (hasExpired && config.hideOnExpiry)) return null;

  // Color scheme presets
  const getColorScheme = () => {
    switch (config.colorScheme) {
      case 'urgent':
        return {
          backgroundColor: '#DC2626',
          textColor: '#FFFFFF',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#DC2626',
        };
      case 'success':
        return {
          backgroundColor: '#059669',
          textColor: '#FFFFFF',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#059669',
        };
      case 'info':
        return {
          backgroundColor: '#2563EB',
          textColor: '#FFFFFF',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#2563EB',
        };
      default:
        return {
          backgroundColor: config.backgroundColor,
          textColor: config.textColor,
          buttonColor: config.buttonColor,
          buttonTextColor: config.buttonTextColor,
        };
    }
  };

  const colors = getColorScheme();

  const bannerStyles: React.CSSProperties = {
    position: config.sticky ? 'sticky' : 'fixed',
    [config.position === 'bottom' ? 'bottom' : 'top']: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundColor,
    color: colors.textColor,
    padding: '12px 20px',
    zIndex: 10000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  };

  const containerStyles: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
  };

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    flexWrap: 'wrap',
  };

  const timerStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontWeight: 700,
    fontSize: '18px',
    fontFamily: 'monospace',
  };

  const buttonStyles: React.CSSProperties = {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: `${config.borderRadius ?? 6}px`,
    backgroundColor: colors.buttonColor,
    color: colors.buttonTextColor,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s',
  };

  const closeButtonStyles: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: colors.textColor,
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0 8px',
    opacity: 0.8,
    lineHeight: 1,
  };

  const formatTime = () => {
    const parts = [];

    if (timeRemaining.days > 0) {
      parts.push(`${timeRemaining.days}d`);
    }

    parts.push(
      `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`
    );

    return parts.join(' ');
  };

  return (
    <div style={bannerStyles}>
      <div style={containerStyles}>
        <div style={contentStyles}>
          {/* Headline */}
          <div style={{ fontWeight: 600, fontSize: '16px' }}>
            {config.headline}
          </div>

          {/* Timer */}
          {!hasExpired && (
            <div style={timerStyles}>
              ⏰ {formatTime()}
            </div>
          )}

          {/* Stock counter */}
          {config.showStockCounter && config.stockCount !== undefined && (
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              Only {config.stockCount} left!
            </div>
          )}

          {/* Expired message */}
          {hasExpired && !config.hideOnExpiry && (
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              Sale ended
            </div>
          )}
        </div>

        {/* CTA button */}
        {!hasExpired && (config.buttonText || config.ctaText) && (
          <button
            onClick={handleCtaClick}
            style={buttonStyles}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {config.buttonText || config.ctaText}
          </button>
        )}

        {/* Close button */}
        {config.showCloseButton !== false && (
          <button
            onClick={onClose}
            style={closeButtonStyles}
            aria-label="Close banner"
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

