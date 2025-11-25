/**
 * AnnouncementPopup Component
 *
 * Banner-style announcement popup featuring:
 * - Top/bottom positioning
 * - Sticky positioning option
 * - Close button
 * - Optional CTA button
 * - Minimal height for non-intrusive display
 * - Full-width display
 * - Icon support
 * - Multiple color scheme presets
 */

import React, { useCallback } from 'react';
import type { PopupDesignConfig } from './types';
import type { AnnouncementContent } from '~/domains/campaigns/types/campaign';
import { POPUP_SPACING, SPACING_GUIDELINES } from './spacing';

// Import custom hooks
import { usePopupAnimation } from './hooks';

/**
 * AnnouncementConfig - Extends both design config AND campaign content type
 * All content fields come from AnnouncementContent
 * All design fields come from PopupDesignConfig
 */
export interface AnnouncementConfig extends PopupDesignConfig, AnnouncementContent {
  // Storefront-specific fields only
  ctaOpenInNewTab: boolean; // required by AnnouncementContent schema default
  colorScheme: 'custom' | 'info' | 'success' | 'urgent';

  // Note: headline, icon, ctaUrl, etc. come from AnnouncementContent
}

export interface AnnouncementPopupProps {
  config: AnnouncementConfig;
  isVisible: boolean;
  onClose: () => void;
  onCtaClick?: () => void;
}

export const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({
  config,
  isVisible,
  onClose,
  onCtaClick,
}) => {
  // Use animation hook
  const { showContent } = usePopupAnimation({ isVisible });

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

  if (!isVisible) return null;

  // Color scheme presets
  const getColorScheme = () => {
    switch (config.colorScheme) {
      case 'info':
        return {
          backgroundColor: '#2563EB',
          textColor: '#FFFFFF',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#2563EB',
        };
      case 'success':
        return {
          backgroundColor: '#059669',
          textColor: '#FFFFFF',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#059669',
        };
      case 'urgent':
        return {
          backgroundColor: '#D97706',
          textColor: '#FFFFFF',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#D97706',
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

	  // Support both solid and gradient backgrounds. For gradient themes (e.g.
	  // "bold", "gradient"), backgroundColor will be a linear-gradient string,
	  // which must be applied via backgroundImage/background instead of
	  // backgroundColor.
	  const hasGradientBg =
	    typeof colors.backgroundColor === 'string' &&
	    colors.backgroundColor.includes('gradient');

	  const bannerBackgroundStyles: React.CSSProperties = hasGradientBg
	    ? {
	        backgroundImage: colors.backgroundColor,
	        backgroundColor: 'transparent',
	      }
	    : {
	        backgroundColor: colors.backgroundColor,
	      };

	  const bannerStyles: React.CSSProperties = {
	    position: config.sticky ? 'sticky' : 'fixed',
	    [config.position === 'bottom' ? 'bottom' : 'top']: 0,
	    left: 0,
	    right: 0,
	    ...bannerBackgroundStyles,
	    color: colors.textColor,
	    padding: '14px 20px',
	    zIndex: 10000,
	    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
	  };

  const containerStyles: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: POPUP_SPACING.gap.md,
    flexWrap: 'wrap',
    position: 'relative',
  };

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: POPUP_SPACING.gap.sm,
    flex: 1,
    justifyContent: 'center',
  };

  const buttonStyles: React.CSSProperties = {
    padding: POPUP_SPACING.component.buttonCompact,
    fontSize: '14px',
    fontWeight: 700,
    border: 'none',
    borderRadius: `${config.borderRadius ?? 6}px`,
    backgroundColor: colors.buttonColor,
    color: colors.buttonTextColor,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const dismissButtonStyles: React.CSSProperties = {
    padding: '0 4px',
    fontSize: '13px',
    border: 'none',
    background: 'transparent',
    color: colors.textColor,
    cursor: 'pointer',
    textDecoration: 'underline',
    whiteSpace: 'nowrap',
    opacity: 0.9,
    transition: 'opacity 0.2s',
  };

  const closeButtonStyles: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    background: 'transparent',
    border: 'none',
    color: colors.textColor,
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0 8px',
    opacity: 0.8,
    lineHeight: 1,
  };

  return (
    <div style={bannerStyles}>
      <div style={containerStyles}>
        <div style={contentStyles}>
          {/* Icon */}
          {config.icon && (
            <span style={{ fontSize: '20px', flexShrink: 0 }}>
              {config.icon}
            </span>
          )}

          {/* Headline */}
          <div style={{ fontWeight: 900, fontSize: '15px', textAlign: 'center' }}>
            {config.headline}
          </div>

          {/* Subheadline */}
          {config.subheadline && (
            <div style={{ fontSize: '14px', opacity: 0.9, textAlign: 'center' }}>
              {config.subheadline}
            </div>
          )}

          {/* CTA button */}
          {(config.buttonText || config.ctaText) && (
            <button
              onClick={handleCtaClick}
              style={buttonStyles}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {config.buttonText || config.ctaText}
            </button>
          )}

          {/* Dismiss text button */}
          <button
            type="button"
            onClick={onClose}
            style={dismissButtonStyles}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.9')}
          >
            {config.dismissLabel || 'No thanks'}
          </button>
        </div>

        {/* Close button */}
        {config.showCloseButton !== false && (
          <button
            onClick={onClose}
            style={closeButtonStyles}
            aria-label="Close announcement"
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

