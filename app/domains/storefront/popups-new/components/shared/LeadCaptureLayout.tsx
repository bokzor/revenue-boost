/**
 * LeadCaptureLayout - Unified Grid Layout for Lead Capture Popups
 *
 * Shared layout component for Newsletter, Spin-to-Win, and Scratch Card popups.
 * Uses CSS Grid with container queries for responsive behavior.
 *
 * LAYOUT MODES:
 * - Desktop: split-left, split-right, stacked, overlay, content-only
 * - Mobile: stacked, overlay, content-only
 *
 * ARCHITECTURE:
 * - visualSlot: Image, wheel, scratch card, etc.
 * - formSlot: Form content, success state, etc.
 * - CSS custom properties control sizing
 * - Container queries handle responsive switching
 */

import React from "react";
import type { DesktopLayout, MobileLayout } from "app/domains/storefront/popups-new/types";

// =============================================================================
// TYPES
// =============================================================================

export interface LayoutSize {
  desktop: string; // e.g., "50%", "40%", "100%"
  mobile: string; // e.g., "45%", "30%", "0"
}

export interface LeadCaptureLayoutProps {
  /** Desktop layout mode */
  desktopLayout: DesktopLayout;
  /** Mobile layout mode (< 520px container width) */
  mobileLayout: MobileLayout;
  /** Size of visual area */
  visualSize?: LayoutSize;
  /** Negative margin to overlap content with visual (e.g., "-2rem") */
  contentOverlap?: string;
  /** Show gradient overlay on visual area (for stacked/overlay modes) */
  visualGradient?: boolean;
  /** Gradient color (defaults to background color from CSS var) */
  gradientColor?: string;
  /** Visual area content (image, wheel, card, etc.) */
  visualSlot?: React.ReactNode;
  /** Form area content */
  formSlot: React.ReactNode;
  /** Additional actions in visual area (close button, drag indicator) */
  visualActions?: React.ReactNode;
  /** Background color for the layout */
  backgroundColor?: string;
  /** Border radius for the container */
  borderRadius?: number;
  /** Overlay opacity for overlay mode (0-1) */
  overlayOpacity?: number;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close button click handler */
  onClose?: () => void;
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Data attributes to pass through */
  [key: `data-${string}`]: string | boolean | undefined;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function LeadCaptureLayout({
  desktopLayout,
  mobileLayout,
  visualSize = { desktop: "50%", mobile: "45%" },
  contentOverlap = "0",
  visualGradient = false,
  gradientColor,
  visualSlot,
  formSlot,
  visualActions,
  backgroundColor = "#ffffff",
  borderRadius = 16,
  overlayOpacity = 0.6,
  showCloseButton = true,
  onClose,
  className = "",
  style,
  ...dataProps
}: LeadCaptureLayoutProps) {
  // Extract data-* props
  const dataAttributes = Object.fromEntries(
    Object.entries(dataProps).filter(([key]) => key.startsWith("data-"))
  );

  // Determine if visual should be hidden (mobile hiding handled by CSS container queries)
  const hideVisualDesktop = desktopLayout === "content-only";

  return (
    <>
      <style>{`
        /* ===========================================
           LEAD CAPTURE LAYOUT - CSS GRID SYSTEM
           =========================================== */

        .lead-capture-layout {
          display: grid;
          width: 100%;
          /* Use min-height for intrinsic sizing with max-height constraint from parent */
          min-height: 400px; /* Ensure minimum usable height */
          max-height: 100%; /* Don't exceed parent's max-height */
          position: relative;
          overflow: hidden;
          background: var(--lcl-bg-color, ${backgroundColor});
          border-radius: var(--lcl-border-radius, ${borderRadius}px);
        }

        /* ----- VISUAL AREA ----- */
        .lead-capture-visual {
          grid-area: visual;
          position: relative;
          overflow: hidden;
          min-height: 0;
        }

        .lead-capture-visual-content {
          width: 100%;
          height: 100%;
        }

        .lead-capture-visual-content img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .lead-capture-visual-actions {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .lead-capture-visual-actions > * {
          pointer-events: auto;
        }

        /* Gradient overlay */
        .lead-capture-visual-gradient {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        /* ----- FORM AREA ----- */
        .lead-capture-form {
          grid-area: form;
          position: relative;
          z-index: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* ===========================================
           DESKTOP LAYOUTS (default)
           =========================================== */

        /* Split Left: [VISUAL | FORM] */
        .lead-capture-layout[data-desktop="split-left"] {
          grid-template-columns: var(--lcl-visual-desktop, 50%) 1fr;
          grid-template-rows: 1fr;
          grid-template-areas: "visual form";
        }

        /* Split Right: [FORM | VISUAL] */
        .lead-capture-layout[data-desktop="split-right"] {
          grid-template-columns: 1fr var(--lcl-visual-desktop, 50%);
          grid-template-rows: 1fr;
          grid-template-areas: "form visual";
        }

        /* Stacked: VISUAL on top, FORM below */
        .lead-capture-layout[data-desktop="stacked"] {
          grid-template-columns: 1fr;
          grid-template-rows: var(--lcl-visual-desktop, 40%) 1fr;
          grid-template-areas:
            "visual"
            "form";
        }

        /* Stacked with overlap */
        .lead-capture-layout[data-desktop="stacked"] .lead-capture-form {
          margin-top: var(--lcl-content-overlap, 0);
        }

        /* Stacked gradient: bottom to top */
        .lead-capture-layout[data-desktop="stacked"] .lead-capture-visual-gradient {
          background: linear-gradient(
            to top,
            var(--lcl-gradient-color) 0%,
            color-mix(in srgb, var(--lcl-gradient-color) 60%, transparent) 30%,
            transparent 100%
          );
        }

        /* Overlay: Full background, form overlays */
        .lead-capture-layout[data-desktop="overlay"] {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr;
          grid-template-areas: "stack";
        }
        .lead-capture-layout[data-desktop="overlay"] .lead-capture-visual,
        .lead-capture-layout[data-desktop="overlay"] .lead-capture-form {
          grid-area: stack;
        }
        .lead-capture-layout[data-desktop="overlay"] .lead-capture-visual {
          z-index: 0;
        }
        .lead-capture-layout[data-desktop="overlay"] .lead-capture-form {
          z-index: 1;
          background: rgba(0, 0, 0, var(--lcl-overlay-opacity, 0.6));
          backdrop-filter: blur(4px);
        }

        /* Close button */
        .lead-capture-close-btn {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 10;
          background: rgba(0, 0, 0, 0.3);
          border: none;
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: background 0.2s ease;
        }
        .lead-capture-close-btn:hover {
          background: rgba(0, 0, 0, 0.5);
        }

        /* Content Only: No visual */
        .lead-capture-layout[data-desktop="content-only"] {
          grid-template-columns: 1fr;
          grid-template-rows: 1fr;
          grid-template-areas: "form";
        }
        .lead-capture-layout[data-desktop="content-only"] .lead-capture-visual {
          display: none;
        }

        /* ===========================================
           MOBILE LAYOUTS (container query < 520px)
           =========================================== */

        @container popup-viewport (max-width: 519px) {
          /* Mobile Stacked */
          .lead-capture-layout[data-mobile="stacked"] {
            grid-template-columns: 1fr;
            grid-template-rows: var(--lcl-visual-mobile, 45%) 1fr;
            grid-template-areas:
              "visual"
              "form";
          }

          .lead-capture-layout[data-mobile="stacked"] .lead-capture-form {
            margin-top: var(--lcl-content-overlap, 0);
          }

          /* Mobile stacked gradient */
          .lead-capture-layout[data-mobile="stacked"] .lead-capture-visual-gradient {
            background: linear-gradient(
              to top,
              var(--lcl-gradient-color) 0%,
              color-mix(in srgb, var(--lcl-gradient-color) 60%, transparent) 30%,
              transparent 100%
            );
          }

          /* Mobile Overlay */
          .lead-capture-layout[data-mobile="overlay"] {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr;
            grid-template-areas: "stack";
          }
          .lead-capture-layout[data-mobile="overlay"] .lead-capture-visual,
          .lead-capture-layout[data-mobile="overlay"] .lead-capture-form {
            grid-area: stack;
          }
          .lead-capture-layout[data-mobile="overlay"] .lead-capture-visual {
            z-index: 0;
          }
          .lead-capture-layout[data-mobile="overlay"] .lead-capture-form {
            z-index: 1;
            background: rgba(0, 0, 0, var(--lcl-overlay-opacity, 0.6));
            backdrop-filter: blur(4px);
          }

          /* Mobile Content Only */
          .lead-capture-layout[data-mobile="content-only"] {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr;
            grid-template-areas: "form";
          }
          .lead-capture-layout[data-mobile="content-only"] .lead-capture-visual {
            display: none;
          }

          /* Mobile Fullscreen - Image fills entire viewport, form floats at bottom */
          .lead-capture-layout[data-mobile="fullscreen"] {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr;
            grid-template-areas: "stack";
          }
          .lead-capture-layout[data-mobile="fullscreen"] .lead-capture-visual,
          .lead-capture-layout[data-mobile="fullscreen"] .lead-capture-form {
            grid-area: stack;
          }
          .lead-capture-layout[data-mobile="fullscreen"] .lead-capture-visual {
            z-index: 0;
          }
          .lead-capture-layout[data-mobile="fullscreen"] .lead-capture-form {
            z-index: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding-bottom: 1.5rem;
            background: linear-gradient(
              to bottom,
              transparent 0%,
              transparent 40%,
              rgba(0, 0, 0, 0.4) 70%,
              rgba(0, 0, 0, 0.7) 100%
            );
          }
          .lead-capture-layout[data-mobile="fullscreen"] .lead-capture-visual-gradient {
            background: linear-gradient(
              to bottom,
              transparent 0%,
              transparent 50%,
              rgba(0, 0, 0, 0.6) 100%
            );
          }
        }
      `}</style>

      <div
        className={`lead-capture-layout ${className}`}
        data-desktop={desktopLayout}
        data-mobile={mobileLayout}
        style={
          {
            "--lcl-visual-desktop": visualSize.desktop,
            "--lcl-visual-mobile": visualSize.mobile,
            "--lcl-content-overlap": contentOverlap,
            "--lcl-bg-color": backgroundColor,
            "--lcl-border-radius": `${borderRadius}px`,
            "--lcl-gradient-color": gradientColor || backgroundColor,
            "--lcl-overlay-opacity": overlayOpacity,
            ...style,
          } as React.CSSProperties
        }
        {...dataAttributes}
      >
        {/* Close Button */}
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lead-capture-close-btn"
            aria-label="Close"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L13 13M1 13L13 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

        {/* Visual Area */}
        {visualSlot && !hideVisualDesktop && (
          <div className="lead-capture-visual">
            <div className="lead-capture-visual-content">{visualSlot}</div>
            {visualGradient && <div className="lead-capture-visual-gradient" />}
            {visualActions && <div className="lead-capture-visual-actions">{visualActions}</div>}
          </div>
        )}

        {/* Form Area */}
        <div className="lead-capture-form">{formSlot}</div>
      </div>
    </>
  );
}
