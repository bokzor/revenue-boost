/**
 * PopupCloseButton Component
 *
 * Standardized close button for popups with:
 * - Consistent positioning (top-right, top-left, or custom)
 * - Hover effects
 * - Accessibility support
 * - Customizable size and color
 *
 * Used by: CartAbandonmentPopup, FlashSalePopup, FreeShippingPopup, and others
 */

import React from "react";
import { CloseIcon } from "./icons";

export interface PopupCloseButtonProps {
  /** Close handler */
  onClose: () => void;
  /** Icon color */
  color?: string;
  /** Icon size in pixels */
  size?: number;
  /** Additional CSS class */
  className?: string;
  /** Position preset */
  position?: "top-right" | "top-left" | "custom";
  /** Whether to show the button */
  show?: boolean;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** ARIA label */
  ariaLabel?: string;
}

/**
 * PopupCloseButton - Standardized close button for popups
 *
 * @example
 * ```tsx
 * <PopupCloseButton
 *   onClose={handleClose}
 *   color="#111827"
 *   size={20}
 *   position="top-right"
 * />
 * ```
 */
export const PopupCloseButton: React.FC<PopupCloseButtonProps> = ({
  onClose,
  color = "#111827",
  size = 20,
  className,
  position = "top-right",
  show = true,
  style,
  ariaLabel = "Close popup",
}) => {
  if (!show) return null;

  const positionStyles: React.CSSProperties =
    position === "custom"
      ? {}
      : {
          position: "absolute",
          top: "10px",
          [position === "top-right" ? "right" : "left"]: "10px",
        };

  const baseStyles: React.CSSProperties = {
    ...positionStyles,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    transition: "opacity 0.2s ease, transform 0.2s ease",
    zIndex: 10,
  };

  return (
    <button
      onClick={onClose}
      className={className}
      aria-label={ariaLabel}
      style={{
        ...baseStyles,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.7";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <CloseIcon size={size} color={color} />
    </button>
  );
};

