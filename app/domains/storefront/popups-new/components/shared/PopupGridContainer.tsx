/**
 * PopupGridContainer
 *
 * Generic container for popup layouts with:
 * - Container queries for responsive behavior
 * - Close button with proper touch targets
 * - Two-column layout support (image + form)
 *
 * NO template-specific styles here - those belong in the popup components.
 */

import React from "react";
import type { PopupDesignConfig } from "app/domains/storefront/popups-new/types";

interface PopupGridContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  config: PopupDesignConfig;
  onClose: () => void;
  /** For two-column: which side the image is on */
  imagePosition?: "left" | "right";
  className?: string;
  /** If true, always single column (no side-by-side layout) */
  singleColumn?: boolean;
}

export const PopupGridContainer: React.FC<PopupGridContainerProps> = ({
  children,
  config,
  onClose,
  imagePosition = "left",
  className = "",
  singleColumn = false,
  ...rest
}) => {
  const baseBackground = config.backgroundColor || "#FFFFFF";
  const backgroundStyles: React.CSSProperties = baseBackground.startsWith("linear-gradient(")
    ? { backgroundImage: baseBackground, backgroundColor: "transparent" }
    : { backgroundColor: baseBackground };

  // Determine layout class based on props
  const layoutClass = singleColumn ? "single-column" : `two-column image-${imagePosition}`;

  return (
    <div
      className={`popup-grid-container ${layoutClass} ${className}`}
      style={backgroundStyles}
      {...rest}
    >
      <style>{`
        /* ========================================
           BASE CONTAINER
           ======================================== */
        .popup-grid-container {
          position: relative;
          display: flex;
          flex-direction: column;
          border-radius: ${config.borderRadius ?? 16}px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          background-color: #ffffff;
          font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'};
          /* Enable container queries */
          container-type: inline-size;
          container-name: popup;
        }

        .popup-grid-content {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 0;
        }

        /* ========================================
           CLOSE BUTTON
           Always 44px touch target on mobile
           ======================================== */
        .popup-close-button {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          border: none;
          background-color: rgba(15, 23, 42, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: ${config.textColor || "#4B5563"};
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.15);
          z-index: 50;
          transition: background-color 0.15s ease;
          font-size: 16px;
          -webkit-tap-highlight-color: transparent;
        }

        .popup-close-button:hover {
          background-color: rgba(15, 23, 42, 0.15);
        }

        .popup-close-button:active {
          background-color: rgba(15, 23, 42, 0.2);
        }

        /* ========================================
           DESKTOP: Two-column layout (≥520px)
           ======================================== */
        @container popup (min-width: 520px) {
          .popup-grid-container.two-column .popup-grid-content {
            flex-direction: row;
            min-height: 380px;
            /* Ensure children stretch to fill height */
            align-items: stretch;
          }

          /* Image cell - fills height via stretch */
          .popup-grid-container.two-column .popup-grid-content > *:first-child {
            flex: 0 0 45%;
            min-width: 0;
            min-height: 100%;
          }

          /* Form cell */
          .popup-grid-container.two-column .popup-grid-content > *:last-child {
            flex: 0 0 55%;
            min-width: 0;
          }

          /* Image on right: swap order */
          .popup-grid-container.image-right .popup-grid-content > *:first-child {
            order: 2;
          }
          .popup-grid-container.image-right .popup-grid-content > *:last-child {
            order: 1;
          }
        }

        /* ========================================
           LARGE DESKTOP (≥700px)
           ======================================== */
        @container popup (min-width: 700px) {
          .popup-grid-container.two-column .popup-grid-content {
            min-height: 420px;
          }

          .popup-grid-container.two-column .popup-grid-content > *:first-child,
          .popup-grid-container.two-column .popup-grid-content > *:last-child {
            flex: 0 0 50%;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={onClose}
        className="popup-close-button"
        aria-label="Close popup"
      >
        ✕
      </button>

      <div className="popup-grid-content">{children}</div>
    </div>
  );
};
