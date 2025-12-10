import React from "react";
import { CheckmarkIcon } from "./icons/CheckmarkIcon";

/**
 * DiscountCodeDisplay Component
 *
 * A reusable component for displaying discount codes with copy functionality.
 * Supports three visual variants (dashed, solid, minimal) and integrates with
 * the useDiscountCode hook for copy-to-clipboard functionality.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DiscountCodeDisplay code="SAVE20" />
 *
 * // With copy functionality
 * const { discountCode, copiedCode, handleCopyCode } = useDiscountCode("SAVE20");
 * <DiscountCodeDisplay
 *   code={discountCode}
 *   onCopy={handleCopyCode}
 *   copied={copiedCode}
 *   label="Your discount code:"
 * />
 *
 * // Different variants
 * <DiscountCodeDisplay code="SAVE20" variant="solid" />
 * <DiscountCodeDisplay code="SAVE20" variant="minimal" />
 *
 * // Custom styling
 * <DiscountCodeDisplay
 *   code="SAVE20"
 *   size="lg"
 *   accentColor="#ff0000"
 *   backgroundColor="#fff5f5"
 * />
 * ```
 *
 * @component
 * @category Shared Components
 * @subcategory Phase 2 - Core Components
 */
export interface DiscountCodeDisplayProps {
  /**
   * The discount code to display
   */
  code: string;
  /**
   * Callback when the code is clicked/copied
   */
  onCopy?: () => void;
  /**
   * Whether the code has been copied (shows checkmark)
   */
  copied?: boolean;
  /**
   * Optional label above the code (e.g., "Your discount code:")
   */
  label?: string;
  /**
   * Visual variant of the display
   * - dashed: Dashed border (default)
   * - solid: Solid border
   * - minimal: No border, subtle background
   * @default "dashed"
   */
  variant?: "dashed" | "solid" | "minimal";
  /**
   * Accent color for border and text
   * @default "#3b82f6"
   */
  accentColor?: string;
  /**
   * Text color for the code
   * Falls back to accentColor if not provided
   */
  textColor?: string;
  /**
   * Background color
   * Auto-generated from accentColor if not provided
   */
  backgroundColor?: string;
  /**
   * Size of the display
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
}

/**
 * DiscountCodeDisplay Component
 * 
 * Displays a discount code with copy-to-clipboard functionality.
 * Supports multiple visual variants and sizes.
 * Integrates with the useDiscountCode hook for state management.
 * 
 * @example
 * ```tsx
 * const { discountCode, copiedCode, handleCopyCode } = useDiscountCode();
 * 
 * <DiscountCodeDisplay
 *   code={discountCode}
 *   onCopy={handleCopyCode}
 *   copied={copiedCode}
 *   label="Your discount code:"
 *   variant="dashed"
 *   accentColor="#3b82f6"
 * />
 * ```
 */
export const DiscountCodeDisplay: React.FC<DiscountCodeDisplayProps> = ({
  code,
  onCopy,
  copied = false,
  label,
  variant = "dashed",
  // Colors are optional - CSS variables provide defaults via design-tokens.css
  accentColor,
  textColor,
  backgroundColor,
  size = "md",
  className,
  style,
}) => {
  // Use CSS variable if no prop provided
  const effectiveAccentColor = accentColor || "var(--rb-primary)";
  // Size mappings
  const sizeMap = {
    sm: {
      padding: "0.5rem 1rem",
      fontSize: "1rem",
      labelFontSize: "0.75rem",
      borderRadius: "0.375rem",
      borderWidth: "1.5px",
    },
    md: {
      padding: "0.75rem 1.5rem",
      fontSize: "1.5rem",
      labelFontSize: "0.875rem",
      borderRadius: "0.5rem",
      borderWidth: "2px",
    },
    lg: {
      padding: "1rem 2rem",
      fontSize: "2rem",
      labelFontSize: "1rem",
      borderRadius: "0.75rem",
      borderWidth: "2.5px",
    },
  };

  const sizeStyles = sizeMap[size];

  // Variant-specific styles - use CSS variables with proper fallbacks
  // Note: For CSS variable backgrounds, we use rgba with opacity instead of hex+alpha
  const variantStyles: Record<string, React.CSSProperties> = {
    dashed: {
      border: `${sizeStyles.borderWidth} dashed ${effectiveAccentColor}`,
      backgroundColor: backgroundColor || "color-mix(in srgb, var(--rb-primary) 10%, transparent)",
    },
    solid: {
      border: `${sizeStyles.borderWidth} solid ${effectiveAccentColor}`,
      backgroundColor: backgroundColor || "color-mix(in srgb, var(--rb-primary) 8%, transparent)",
    },
    minimal: {
      border: "none",
      backgroundColor: backgroundColor || "color-mix(in srgb, var(--rb-primary) 5%, transparent)",
    },
  };

  const containerStyles: React.CSSProperties = {
    display: "block",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: sizeStyles.padding,
    borderRadius: sizeStyles.borderRadius,
    textAlign: "center",
    cursor: onCopy ? "pointer" : "default",
    transition: "all 0.2s ease",
    userSelect: "none",
    overflow: "hidden",
    ...variantStyles[variant],
    ...style,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: sizeStyles.labelFontSize,
    fontWeight: 500,
    marginBottom: "0.25rem",
    color: textColor || effectiveAccentColor,
    opacity: 0.8,
  };

  // Calculate responsive font size based on code length
  // For codes longer than 10 characters, scale down the font
  const getResponsiveFontSize = () => {
    const baseSize = sizeStyles.fontSize;
    const codeLength = code.length;

    // If code is short, use base size
    if (codeLength <= 10) {
      return baseSize;
    }

    // For longer codes, use a smaller size
    // clamp ensures minimum readability
    if (codeLength <= 15) {
      return size === "lg" ? "1.5rem" : size === "md" ? "1.25rem" : "0.875rem";
    }

    // Very long codes get even smaller
    return size === "lg" ? "1.25rem" : size === "md" ? "1rem" : "0.75rem";
  };

  const codeStyles: React.CSSProperties = {
    fontSize: getResponsiveFontSize(),
    fontWeight: 700,
    letterSpacing: "0.025em",
    color: textColor || effectiveAccentColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    wordBreak: "break-all",
    overflowWrap: "break-word",
    maxWidth: "100%",
  };

  const codeWrapperStyles: React.CSSProperties = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  };

  // Success green color
  const successColor = "#10b981";

  const overlayStyles: React.CSSProperties = {
    position: "absolute",
    top: "-2px",
    left: "-2px",
    right: "-2px",
    bottom: "-2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    background: successColor,
    borderRadius: sizeStyles.borderRadius,
    border: `2px solid ${successColor}`,
    color: "#ffffff",
    fontWeight: 700,
    fontSize: size === "sm" ? "0.875rem" : size === "lg" ? "1.25rem" : "1rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    boxShadow: `0 0 20px ${successColor}50`,
    animation: "copiedPulse 0.4s ease-out",
  };

  // Wrap onCopy to prevent event leakage (don't pass MouseEvent as argument)
  const handleClick = onCopy
    ? () => {
        onCopy();
      }
    : undefined;

  return (
    <div
      className={className}
      style={containerStyles}
      onClick={handleClick}
      title={onCopy ? "Click to copy" : undefined}
      role={onCopy ? "button" : undefined}
      tabIndex={onCopy ? 0 : undefined}
      onKeyDown={(e) => {
        if (onCopy && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onCopy();
        }
      }}
    >
      {/* Inline keyframe animation for the copied pulse effect */}
      <style>{`
        @keyframes copiedPulse {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes checkmarkDraw {
          0% {
            stroke-dashoffset: 24;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      {label && <div style={labelStyles}>{label}</div>}
      <div style={codeWrapperStyles}>
        <div style={{ ...codeStyles, opacity: copied ? 0.3 : 1, transition: "opacity 0.2s" }}>
          {code}
        </div>
        {copied && (
          <div style={overlayStyles}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: size === "sm" ? 24 : size === "lg" ? 36 : 30,
              height: size === "sm" ? 24 : size === "lg" ? 36 : 30,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              border: "2px solid #ffffff",
            }}>
              <CheckmarkIcon
                size={size === "sm" ? 14 : size === "lg" ? 22 : 18}
                color="#ffffff"
                strokeWidth={3}
              />
            </div>
            <span>Copied!</span>
          </div>
        )}
      </div>
    </div>
  );
};

