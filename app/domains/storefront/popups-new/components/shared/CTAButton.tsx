/**
 * CTAButton Component
 *
 * Reusable CTA (Call-to-Action) button with standardized behavior:
 * - URL navigation with new tab support
 * - Custom click handlers
 * - Consistent styling
 * - Accessibility support
 *
 * Used by: AnnouncementPopup, CountdownTimerPopup, ProductUpsellPopup, SocialProofPopup
 */

import React, { useCallback } from "react";

export interface CTAButtonProps {
  /** Button text */
  text: string;
  /** URL to navigate to */
  url?: string;
  /** Whether to open URL in new tab */
  openInNewTab?: boolean;
  /** Custom click handler (called before navigation) */
  onClick?: () => void;
  /** Button variant */
  variant?: "primary" | "secondary";
  /** Accent color (for primary variant) */
  accentColor?: string;
  /** Text color */
  textColor?: string;
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
  /** Disabled state */
  disabled?: boolean;
  /** ARIA label */
  ariaLabel?: string;
}

/**
 * CTAButton - Standardized call-to-action button
 *
 * @example
 * ```tsx
 * <CTAButton
 *   text="Shop Now"
 *   url="https://example.com/shop"
 *   openInNewTab={true}
 *   accentColor="#3b82f6"
 *   textColor="#ffffff"
 * />
 * ```
 */
export const CTAButton: React.FC<CTAButtonProps> = ({
  text,
  url,
  openInNewTab = false,
  onClick,
  variant = "primary",
  accentColor = "#3b82f6",
  textColor = "#ffffff",
  className,
  style,
  disabled = false,
  ariaLabel,
}) => {
  const handleClick = useCallback(() => {
    // Call custom handler first
    if (onClick) {
      onClick();
    }

    // Then navigate if URL provided
    if (url && !disabled) {
      if (openInNewTab) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = url;
      }
    }
  }, [url, openInNewTab, onClick, disabled]);

  const baseStyles: React.CSSProperties = {
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    fontSize: "0.9375rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    transition: "all 0.2s ease",
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyles: React.CSSProperties =
    variant === "primary"
      ? {
          backgroundColor: accentColor,
          color: textColor,
        }
      : {
          backgroundColor: "transparent",
          color: accentColor,
          border: `2px solid ${accentColor}`,
        };

  return (
    <button
      onClick={handleClick}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel || text}
      style={{
        ...baseStyles,
        ...variantStyles,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && variant === "primary") {
          e.currentTarget.style.opacity = "0.9";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      {text}
    </button>
  );
};

