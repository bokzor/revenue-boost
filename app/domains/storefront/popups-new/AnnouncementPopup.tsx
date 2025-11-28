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

import React, { useMemo } from "react";
import type { PopupDesignConfig } from "./types";
import type { AnnouncementContent } from "~/domains/campaigns/types/campaign";
import { POPUP_SPACING } from "./spacing";

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
    fontFamily: config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    padding: "14px 20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  };

  const containerStyles: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: POPUP_SPACING.gap.md,
    flexWrap: "wrap",
    position: "relative",
  };

  const contentStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: POPUP_SPACING.gap.sm,
    flex: 1,
    justifyContent: "center",
  };

  const dismissButtonStyles: React.CSSProperties = {
    padding: "0 4px",
    fontSize: "13px",
    border: "none",
    background: "transparent",
    color: schemeColors.textColor,
    cursor: "pointer",
    textDecoration: "underline",
    whiteSpace: "nowrap",
    opacity: 0.9,
    transition: "opacity 0.2s",
  };

  const closeButtonStyles: React.CSSProperties = {
    position: "absolute",
    right: 0,
    background: "transparent",
    border: "none",
    color: schemeColors.textColor,
    fontSize: "24px",
    cursor: "pointer",
    padding: "0 8px",
    opacity: 0.8,
    lineHeight: 1,
  };

  // Responsive CSS for dismiss/close button visibility
  // Desktop & Tablet: Show "No Thanks" only
  // Mobile: Show close button (×) only
  const responsiveButtonCss = `
    [data-rb-banner] .rb-dismiss-btn {
      display: inline-block;
    }
    [data-rb-banner] .rb-close-btn {
      display: none;
    }
    @media (max-width: 768px) {
      [data-rb-banner] .rb-dismiss-btn {
        display: none;
      }
      [data-rb-banner] .rb-close-btn {
        display: block;
      }
    }
  `;

  return (
    <div style={bannerStyles} data-rb-banner>
      <style dangerouslySetInnerHTML={{ __html: responsiveButtonCss }} />
      {scopedCss ? <style dangerouslySetInnerHTML={{ __html: scopedCss }} /> : null}
      <div style={containerStyles}>
        <div style={contentStyles}>
          {/* Icon */}
          {config.icon && <span style={{ fontSize: "20px", flexShrink: 0 }}>{config.icon}</span>}

          {/* Headline */}
          <div style={{ fontWeight: 900, fontSize: "15px", textAlign: "center" }}>
            {config.headline}
          </div>

          {/* Subheadline */}
          {config.subheadline && (
            <div style={{ fontSize: "14px", opacity: 0.9, textAlign: "center" }}>
              {config.subheadline}
            </div>
          )}

          {/* CTA button */}
          {(config.buttonText || config.ctaText) && (
            <CTAButton
              text={config.buttonText || config.ctaText || ""}
              url={config.ctaUrl}
              openInNewTab={config.ctaOpenInNewTab}
              onClick={onCtaClick}
              accentColor={config.buttonColor || schemeColors.textColor}
              textColor={config.buttonTextColor || schemeColors.backgroundColor}
              style={{
                padding: POPUP_SPACING.component.buttonCompact,
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                borderRadius: `${config.borderRadius ?? 6}px`,
              }}
            />
          )}

          {/* Dismiss text button - Desktop & Tablet only */}
          <button
            type="button"
            className="rb-dismiss-btn"
            onClick={onClose}
            style={dismissButtonStyles}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
          >
            {config.dismissLabel || "No thanks"}
          </button>
        </div>

        {/* Close button (×) - Mobile only */}
        {config.showCloseButton !== false && (
          <button
            className="rb-close-btn"
            onClick={onClose}
            style={closeButtonStyles}
            aria-label="Close announcement"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
