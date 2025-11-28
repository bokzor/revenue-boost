/**
 * AnnouncementPopup Component (Mobile-First Redesign)
 *
 * A sleek, modern announcement ribbon featuring:
 * - Mobile-first responsive design
 * - Stacked layout on mobile, inline on tablet/desktop
 * - Compact height (48-56px desktop, auto-height mobile)
 * - Clear visual hierarchy with icon + headline
 * - Touch-friendly CTA button
 * - Accessible close button
 * - Multiple color scheme presets
 */

import React, { useMemo } from "react";
import type { PopupDesignConfig } from "./types";
import type { AnnouncementContent } from "~/domains/campaigns/types/campaign";

// Import custom hooks
import { usePopupAnimation, useColorScheme } from "./hooks";
import { buildScopedCss } from "~/domains/storefront/shared/css";
import { getBackgroundStyles } from "./utils";

// Import shared components
import { CTAButton } from "./components/shared";

/**
 * AnnouncementConfig - Extends both design config AND campaign content type
 * All content fields come from AnnouncementContent
 * All design fields come from PopupDesignConfig
 */
export interface AnnouncementConfig extends PopupDesignConfig, AnnouncementContent {
  // Storefront-specific fields only
  ctaOpenInNewTab: boolean; // required by AnnouncementContent schema default
  colorScheme: "custom" | "info" | "success" | "urgent";

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
  const { showContent: _showContent } = usePopupAnimation({ isVisible });

  // Use color scheme hook
  const schemeColors = useColorScheme(config.colorScheme || "custom", {
    backgroundColor: config.backgroundColor,
    textColor: config.textColor,
    accentColor: config.buttonColor,
  });

  const scopedCss = useMemo(
    () =>
      buildScopedCss(
        config.globalCustomCSS,
        config.customCSS,
        "data-rb-banner",
        "announcement",
      ),
    [config.customCSS, config.globalCustomCSS],
  );

  // Build responsive CSS using container queries (mobile-first)
  const responsiveCss = useMemo(() => {
    const textColor = schemeColors.textColor;
    const buttonBg = config.buttonColor || schemeColors.textColor;
    const buttonText = config.buttonTextColor || schemeColors.backgroundColor;
    const borderRadius = config.borderRadius ?? 20; // Pill-shaped by default

    return `
      /* ========== ANIMATIONS ========== */
      @keyframes rb-slide-down {
        from { transform: translateY(-100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes rb-slide-up {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      /* ========== BASE STYLES (Mobile-first, stacked layout) ========== */
      [data-rb-banner] {
        font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'};
        animation: rb-slide-down 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      [data-rb-banner][data-position="bottom"] {
        animation-name: rb-slide-up;
      }

      [data-rb-banner] .rb-container {
        container-type: inline-size;
        container-name: banner;
        max-width: 1400px;
        margin: 0 auto;
        padding: 14px 48px 14px 16px;
        position: relative;
      }

      [data-rb-banner] .rb-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
      }

      [data-rb-banner] .rb-text-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }

      [data-rb-banner] .rb-headline-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      [data-rb-banner] .rb-icon {
        font-size: 20px;
        line-height: 1;
        flex-shrink: 0;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
      }

      [data-rb-banner] .rb-headline {
        font-weight: 600;
        font-size: 14px;
        line-height: 1.4;
        margin: 0;
        color: ${textColor};
        letter-spacing: -0.01em;
      }

      [data-rb-banner] .rb-separator {
        display: none;
      }

      [data-rb-banner] .rb-subheadline {
        font-size: 13px;
        line-height: 1.4;
        opacity: 0.85;
        margin: 0;
        color: ${textColor};
        font-weight: 400;
      }

      /* CTA Button - Modern pill style */
      [data-rb-banner] .rb-cta-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 10px 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-radius: ${borderRadius}px;
        background-color: ${buttonBg};
        color: ${buttonText};
        border: none;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1);
      }

      [data-rb-banner] .rb-cta-btn:hover {
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15);
      }

      [data-rb-banner] .rb-cta-btn:active {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
      }

      /* Close button (X) - visible on small containers */
      [data-rb-banner] .rb-close-btn {
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        border: none;
        color: ${textColor};
        font-size: 20px;
        cursor: pointer;
        opacity: 0.8;
        transition: all 0.2s;
        padding: 0;
        line-height: 1;
        border-radius: 50%;
      }

      [data-rb-banner] .rb-close-btn:hover {
        opacity: 1;
        background: rgba(255,255,255,0.2);
        transform: translateY(-50%) scale(1.05);
      }

      [data-rb-banner] .rb-close-btn:active {
        transform: translateY(-50%) scale(0.95);
      }

      /* Dismiss text button - hidden on small containers */
      [data-rb-banner] .rb-dismiss-btn {
        display: none;
      }

      /* ========== CONTAINER QUERIES ========== */

      /* Medium containers (600px+): Inline layout */
      @container banner (min-width: 600px) {
        [data-rb-banner] .rb-container {
          padding: 12px 24px;
        }

        [data-rb-banner] .rb-content {
          flex-direction: row;
          justify-content: center;
          gap: 20px;
        }

        [data-rb-banner] .rb-text-group {
          flex-direction: row;
          align-items: center;
          gap: 0;
        }

        [data-rb-banner] .rb-separator {
          display: inline-block;
          width: 4px;
          height: 4px;
          background: ${textColor};
          opacity: 0.4;
          border-radius: 50%;
          margin: 0 12px;
          flex-shrink: 0;
        }

        /* Show dismiss text, hide X button */
        [data-rb-banner] .rb-close-btn {
          display: none;
        }

        [data-rb-banner] .rb-dismiss-btn {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
          border: 1.5px solid currentColor;
          border-radius: ${borderRadius}px;
          background: transparent;
          color: ${textColor};
          cursor: pointer;
          white-space: nowrap;
          opacity: 0.75;
          transition: all 0.2s;
          text-decoration: none;
        }

        [data-rb-banner] .rb-dismiss-btn:hover {
          opacity: 1;
          background: rgba(255,255,255,0.1);
        }
      }

      /* Large containers (900px+): More spacious */
      @container banner (min-width: 900px) {
        [data-rb-banner] .rb-container {
          padding: 14px 32px;
        }

        [data-rb-banner] .rb-headline {
          font-size: 15px;
        }

        [data-rb-banner] .rb-content {
          gap: 24px;
        }

        [data-rb-banner] .rb-cta-btn {
          padding: 10px 24px;
          font-size: 13px;
        }
      }
    `;
  }, [schemeColors, config.fontFamily, config.buttonColor, config.buttonTextColor, config.borderRadius]);

  if (!isVisible) return null;

  // Get background styles (handles gradients)
  const bannerBackgroundStyles = getBackgroundStyles(schemeColors.backgroundColor);

  // Determine position style based on preview mode vs storefront
  const positionStyle: React.CSSProperties = config.previewMode
    ? {
        // In admin preview, use absolute positioning to keep the banner
        // constrained within the preview frame instead of the full window
        position: "absolute",
        [config.position === "bottom" ? "bottom" : "top"]: 0,
        left: 0,
        right: 0,
      }
    : config.sticky
      ? {
          // Storefront behavior: stick to the top/bottom of the viewport
          position: "sticky",
          [config.position === "bottom" ? "bottom" : "top"]: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
        }
      : {
          // Non-sticky storefront: fixed position
          position: "fixed",
          [config.position === "bottom" ? "bottom" : "top"]: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
        };

  const bannerStyles: React.CSSProperties = {
    ...positionStyle,
    ...bannerBackgroundStyles,
    color: schemeColors.textColor,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  };

  const hasButton = Boolean(config.buttonText || config.ctaText);
  const hasSubheadline = Boolean(config.subheadline);
  const position = config.position === "bottom" ? "bottom" : "top";

  return (
    <div style={bannerStyles} data-rb-banner data-position={position}>
      <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
      {scopedCss ? <style dangerouslySetInnerHTML={{ __html: scopedCss }} /> : null}

      <div className="rb-container">
        <div className="rb-content">
          {/* Text group: Icon + Headline + Separator + Subheadline */}
          <div className="rb-text-group">
            <div className="rb-headline-row">
              {config.icon && <span className="rb-icon">{config.icon}</span>}
              <p className="rb-headline">{config.headline}</p>
            </div>
            {hasSubheadline && (
              <>
                <span className="rb-separator" aria-hidden="true" />
                <p className="rb-subheadline">{config.subheadline}</p>
              </>
            )}
          </div>

          {/* CTA button */}
          {hasButton && (
            <CTAButton
              text={config.buttonText || config.ctaText || ""}
              url={config.ctaUrl}
              openInNewTab={config.ctaOpenInNewTab}
              onClick={onCtaClick}
              accentColor={config.buttonColor || schemeColors.textColor}
              textColor={config.buttonTextColor || schemeColors.backgroundColor}
              className="rb-cta-btn"
            />
          )}

          {/* Dismiss text button - Desktop & Tablet only (hidden via CSS on mobile) */}
          <button
            type="button"
            className="rb-dismiss-btn"
            onClick={onClose}
          >
            {config.dismissLabel || "No thanks"}
          </button>
        </div>

        {/* Close button (×) - Mobile only (hidden via CSS on tablet+) */}
        {config.showCloseButton !== false && (
          <button
            type="button"
            className="rb-close-btn"
            onClick={onClose}
            aria-label="Close announcement"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
