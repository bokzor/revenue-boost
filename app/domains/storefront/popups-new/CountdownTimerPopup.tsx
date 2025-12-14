/**
 * CountdownTimerPopup Component
 *
 * Countdown timer popup with two display modes:
 * - Banner: Top/bottom bar with countdown (default)
 * - Popup: Centered popup with countdown
 *
 * Features:
 * - Live countdown timer (compact format for banner, full for popup)
 * - Top/bottom positioning for banner, center for popup
 * - Sticky option for persistent visibility (banner mode)
 * - Auto-hide on expiry
 * - Optional stock counter
 * - CTA button
 */

import React, { useState, useEffect, useRef } from "react";
import type { PopupDesignConfig } from "./types";
import type { CountdownTimerContent } from "~/domains/campaigns/types/campaign";
import { POPUP_SPACING } from "./utils/spacing";

// Import custom hooks
import { useCountdownTimer, useColorScheme } from "./hooks";
import { buildScopedCss } from "~/domains/storefront/shared/css";
import { getBackgroundStyles } from "./utils/utils";

// Animation duration for banner enter/exit
const BANNER_ANIMATION_DURATION = 300;

// Import shared components from Phase 1 & 2
import { TimerDisplay, CTAButton, PopupCloseButton } from "./components/shared";
import { PopupPortal } from "./PopupPortal";

/**
 * CountdownTimerConfig - Extends both design config AND campaign content type
 * All content fields come from CountdownTimerContent
 * All design fields come from PopupDesignConfig
 */
export interface CountdownTimerConfig extends PopupDesignConfig, CountdownTimerContent {
  // Storefront-specific fields only
  ctaOpenInNewTab: boolean; // required by content schema default
  colorScheme: "custom" | "info" | "success" | "urgent";

  // Note: headline, endTime, countdownDuration, ctaUrl, etc.
  // all come from CountdownTimerContent
  customCSS?: string;
  globalCustomCSS?: string;
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
  // Use countdown timer hook
  const { timeRemaining, hasExpired } = useCountdownTimer({
    enabled: true,
    mode: config.endTime ? "fixed_end" : "duration",
    endTime: config.endTime,
    duration: config.countdownDuration,
    onExpire: () => {
      if (onExpiry) onExpiry();
      if (config.hideOnExpiry) onClose();
    },
    autoHide: config.hideOnExpiry,
  });

  // Use color scheme hook
  const schemeColors = useColorScheme(config.colorScheme || "custom", {
    backgroundColor: config.backgroundColor,
    textColor: config.textColor,
    accentColor: config.buttonColor,
  });

  // Get displayMode (defaults to banner for countdown timers)
  const displayMode = config.displayMode || "banner";

  // Banner animation state (must be declared before any early returns due to rules of hooks)
  const [animState, setAnimState] = useState<"entering" | "visible" | "exiting" | "hidden">(
    isVisible ? "entering" : "hidden"
  );
  const hasInitialized = useRef(false);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const effectiveDuration = prefersReducedMotion ? 0 : BANNER_ANIMATION_DURATION;

  // Handle visibility state transitions for banner
  useEffect(() => {
    // Skip if not in banner mode (popup mode uses PopupPortal for animations)
    if (displayMode !== "banner") return;

    // Skip the first render if we already initialized with the correct state
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // If we started visible, transition from entering to visible
      if (isVisible && animState === "entering") {
        const timer = setTimeout(() => setAnimState("visible"), effectiveDuration);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (isVisible && (animState === "hidden" || animState === "exiting")) {
      setAnimState("entering");
      const timer = setTimeout(() => setAnimState("visible"), effectiveDuration);
      return () => clearTimeout(timer);
    } else if (!isVisible && (animState === "visible" || animState === "entering")) {
      setAnimState("exiting");
      const timer = setTimeout(() => setAnimState("hidden"), effectiveDuration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, displayMode, effectiveDuration, animState]);

  // Early return after all hooks are called
  if (!isVisible || (hasExpired && config.hideOnExpiry)) return null;

  // Determine background (gradient for presets, solid for custom)
  const backgroundValue =
    config.colorScheme === "urgent"
      ? "linear-gradient(135deg, var(--rb-error, #dc2626) 0%, #f97316 100%)"
      : config.colorScheme === "success"
        ? "linear-gradient(135deg, var(--rb-success, #10b981) 0%, #14b8a6 100%)"
        : config.colorScheme === "info"
          ? "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
          : schemeColors.backgroundColor;

  // Timer and CTA colors
  const timerBg =
    config.colorScheme !== "custom"
      ? "rgba(255, 255, 255, 0.2)"
      : config.inputBackgroundColor || "rgba(0, 0, 0, 0.08)";
  const timerText = config.colorScheme !== "custom" ? "#ffffff" : schemeColors.textColor;
  const ctaBg =
    config.colorScheme !== "custom" ? "#ffffff" : config.buttonColor || schemeColors.accentColor;
  const ctaText =
    config.colorScheme !== "custom"
      ? schemeColors.backgroundColor
      : config.buttonTextColor || "#ffffff";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- config has dynamic previewMode field
  const isPreview = (config as any).previewMode;

  // Check if using full background image (modal mode only)
  const hasFullBgImage = config.imageUrl && config.leadCaptureLayout?.desktop === "overlay";

  // Popup/Modal display mode (centered overlay)
  if (displayMode === "popup") {
    return (
      <PopupPortal
        isVisible={isVisible}
        onClose={onClose}
        backdrop={{
          color: config.overlayColor || "#000000",
          opacity: config.overlayOpacity ?? 0.5,
        }}
        animation={{
          type: (config.animation as "fade" | "slide" | "zoom" | "bounce" | "none") || "fade",
        }}
        position={config.position || "center"}
        size={config.size || "medium"}
        closeOnEscape
        closeOnBackdropClick
        previewMode={isPreview as boolean | undefined}
        designTokensCSS={config.designTokensCSS}
      >
        <style>{`
          .countdown-modal {
            font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'};
            container-type: inline-size;
            container-name: countdown-modal;
            border-radius: ${config.borderRadius ?? 12}px;
            padding: 2rem;
            width: min(500px, calc(100% - 2rem));
            text-align: center;
            overflow: hidden;
          }
          /* Full background image support */
          .countdown-modal.has-bg-image {
            position: relative;
          }
          .countdown-modal-bg-image {
            position: absolute;
            inset: 0;
            z-index: 0;
          }
          .countdown-modal-bg-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .countdown-modal-bg-overlay {
            position: absolute;
            inset: 0;
            z-index: 1;
            background: ${config.backgroundColor || "#000000"};
            opacity: ${config.backgroundOverlayOpacity ?? 0.6};
          }
          .countdown-modal-content {
            position: relative;
            z-index: 2;
          }
          .countdown-modal-headline {
            font-size: 1.75rem;
            font-weight: 800;
            line-height: 1.2;
            margin: 0 0 0.5rem 0;
          }
          .countdown-modal-subheadline {
            font-size: 1rem;
            line-height: 1.5;
            margin: 0 0 1.5rem 0;
            opacity: 0.9;
          }
          .countdown-modal-timer {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .countdown-modal-stock {
            font-size: 0.875rem;
            font-weight: 600;
            padding: 0.5rem 1rem;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.2);
            display: inline-block;
            margin-bottom: 1.5rem;
          }
          .countdown-modal-cta {
            padding: 0.875rem 2rem;
            font-size: 1rem;
            font-weight: 700;
            border: none;
            border-radius: ${config.borderRadius ?? 8}px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          .countdown-modal-cta:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          }
          .countdown-modal-cta:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .countdown-modal-expired {
            font-size: 1.25rem;
            font-weight: 600;
            padding: 1rem;
          }
          .countdown-modal-close {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: transparent;
            border: none;
            font-size: 1.5rem;
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
          .countdown-modal-close:hover {
            opacity: 1;
          }

          @container countdown-modal (max-width: 400px) {
            .countdown-modal {
              padding: 1.5rem;
            }
            .countdown-modal-headline {
              font-size: 1.5rem;
            }
            .countdown-modal-subheadline {
              font-size: 0.875rem;
            }
          }
        `}</style>

        <div
          className={`countdown-modal${hasFullBgImage ? " has-bg-image" : ""}`}
          style={{
            ...(hasFullBgImage ? {} : getBackgroundStyles(backgroundValue)),
            color: schemeColors.textColor,
            position: "relative",
          }}
        >
          {/* Background image with overlay */}
          {hasFullBgImage && (
            <>
              <div className="countdown-modal-bg-image">
                <img src={config.imageUrl} alt="" aria-hidden="true" />
              </div>
              <div className="countdown-modal-bg-overlay" />
            </>
          )}

          {/* Content wrapper for z-index layering above background */}
          <div className="countdown-modal-content">
            <PopupCloseButton
              onClose={onClose}
              color={schemeColors.textColor}
              size={24}
              show={config.showCloseButton !== false}
              className="countdown-modal-close"
              position="custom"
            />

            <h2 className="countdown-modal-headline">{config.headline}</h2>
            {config.subheadline && (
              <p className="countdown-modal-subheadline">{config.subheadline}</p>
            )}

            {!hasExpired ? (
              <>
                <div className="countdown-modal-timer">
                  <TimerDisplay
                    timeRemaining={timeRemaining}
                    format="full"
                    showDays={timeRemaining.days > 0}
                    showLabels={true}
                    backgroundColor={timerBg}
                    textColor={timerText}
                    accentColor={ctaBg}
                  />
                </div>

                {config.showStockCounter && config.stockCount && (
                  <div className="countdown-modal-stock" style={{ color: schemeColors.textColor }}>
                    ⚡ Only {config.stockCount} left in stock
                  </div>
                )}
              </>
            ) : (
              <div className="countdown-modal-expired" style={{ color: schemeColors.textColor }}>
                Offer has ended
              </div>
            )}

            {(config.buttonText || config.ctaText || hasExpired) && (
              <CTAButton
                text={hasExpired ? "Offer Expired" : config.buttonText || config.ctaText || ""}
                url={hasExpired ? undefined : config.ctaUrl}
                openInNewTab={config.ctaOpenInNewTab}
                onClick={hasExpired ? undefined : onCtaClick}
                disabled={hasExpired}
                accentColor={ctaBg}
                textColor={ctaText}
                className="countdown-modal-cta"
              />
            )}
          </div>
        </div>
      </PopupPortal>
    );
  }

  // Banner display mode (default)
  // Get animation class for banner
  const getBannerAnimationClass = () => {
    if (prefersReducedMotion || isPreview) return "";

    const position = config.position === "bottom" ? "bottom" : "top";
    if (animState === "entering") {
      return `countdown-banner-slide-in-${position}`;
    }
    if (animState === "exiting") {
      return `countdown-banner-slide-out-${position}`;
    }
    return "";
  };

  // Don't render if hidden (after exit animation)
  if (displayMode === "banner" && animState === "hidden") return null;

  const positionStyle: React.CSSProperties = isPreview
    ? {
        // In admin preview, keep the banner constrained to the preview
        // frame instead of the full window. Absolute positioning inside the
        // TemplatePreview's relative container mimics top/bottom banners
        // without breaking out of the device frame.
        position: "absolute",
        [config.position === "bottom" ? "bottom" : "top"]: 0,
        left: 0,
        right: 0,
      }
    : config.sticky
      ? {
          // Storefront behavior: stick to the top/bottom of the viewport.
          position: "fixed",
          [config.position === "bottom" ? "bottom" : "top"]: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        }
      : {
          // Non-sticky mode: banner participates in normal document flow.
          position: "relative",
        };

  const scopedCss = buildScopedCss(
    config.globalCustomCSS,
    config.customCSS,
    "data-rb-banner",
    "countdown"
  );

  return (
    <>
      {scopedCss ? <style dangerouslySetInnerHTML={{ __html: scopedCss }} /> : null}
      <style>{`
        .countdown-banner {
          font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'};
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
          font-weight: 900;
          line-height: 1.2;
          margin: 0 0 ${POPUP_SPACING.section.xs} 0;
        }
        .countdown-banner-subheadline {
          font-size: 0.875rem;
          line-height: 1.5;
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
          gap: ${POPUP_SPACING.gap.sm};
          align-items: center;
        }
        .countdown-banner-timer-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: ${POPUP_SPACING.component.timerUnit};
          border-radius: 0.375rem;
          min-width: 3.5rem;
        }
        .countdown-banner-timer-value {
          font-size: 1.5rem;
          font-weight: 900;
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
          padding: ${POPUP_SPACING.component.buttonCompact};
          font-size: 1rem;
          font-weight: 700;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .countdown-banner-cta:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
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

        /* Banner enter/exit animations */
        @keyframes countdown-banner-slide-in-from-top {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes countdown-banner-slide-out-to-top {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(-100%); opacity: 0; }
        }
        @keyframes countdown-banner-slide-in-from-bottom {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes countdown-banner-slide-out-to-bottom {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
        .countdown-banner-slide-in-top {
          animation: countdown-banner-slide-in-from-top ${effectiveDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .countdown-banner-slide-out-top {
          animation: countdown-banner-slide-out-to-top ${effectiveDuration}ms cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        .countdown-banner-slide-in-bottom {
          animation: countdown-banner-slide-in-from-bottom ${effectiveDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .countdown-banner-slide-out-bottom {
          animation: countdown-banner-slide-out-to-bottom ${effectiveDuration}ms cubic-bezier(0.4, 0, 1, 1) forwards;
        }
      `}</style>

      <div
        className={`countdown-banner ${getBannerAnimationClass()}`.trim()}
        data-rb-banner
        style={{
          ...positionStyle,
          ...getBackgroundStyles(backgroundValue),
          color: schemeColors.textColor,
          boxShadow:
            config.position === "bottom"
              ? "0 -2px 8px rgba(0, 0, 0, 0.1)"
              : "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="countdown-banner-content">
          <PopupCloseButton
            onClose={onClose}
            color={schemeColors.textColor}
            size={20}
            show={config.showCloseButton !== false}
            className="countdown-banner-close"
            position="custom"
          />

          <div className="countdown-banner-left">
            <h2 className="countdown-banner-headline">{config.headline}</h2>
            {config.subheadline && (
              <p className="countdown-banner-subheadline">{config.subheadline}</p>
            )}
          </div>

          <div className="countdown-banner-center">
            {!hasExpired ? (
              <>
                <TimerDisplay
                  timeRemaining={timeRemaining}
                  format="compact"
                  backgroundColor={timerBg}
                  textColor={timerText}
                />

                {config.showStockCounter && config.stockCount && (
                  <div className="countdown-banner-stock" style={{ color: schemeColors.textColor }}>
                    ⚡ Only {config.stockCount} left in stock
                  </div>
                )}
              </>
            ) : (
              <div className="countdown-banner-expired" style={{ color: schemeColors.textColor }}>
                Offer has ended
              </div>
            )}
          </div>

          <div className="countdown-banner-right">
            {(config.buttonText || config.ctaText || hasExpired) && (
              <CTAButton
                text={hasExpired ? "Offer Expired" : config.buttonText || config.ctaText || ""}
                url={hasExpired ? undefined : config.ctaUrl}
                openInNewTab={config.ctaOpenInNewTab}
                onClick={hasExpired ? undefined : onCtaClick}
                disabled={hasExpired}
                accentColor={ctaBg}
                textColor={ctaText}
                className="countdown-banner-cta"
                style={{
                  borderRadius: `${config.borderRadius ?? 6}px`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
