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
  accentColor = "#3b82f6",
  textColor,
  backgroundColor,
  size = "md",
  className,
  style,
}) => {
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

  // Variant-specific styles
  const variantStyles: Record<string, React.CSSProperties> = {
    dashed: {
      border: `${sizeStyles.borderWidth} dashed ${accentColor}`,
      backgroundColor: backgroundColor || `${accentColor}15`,
    },
    solid: {
      border: `${sizeStyles.borderWidth} solid ${accentColor}`,
      backgroundColor: backgroundColor || `${accentColor}10`,
    },
    minimal: {
      border: "none",
      backgroundColor: backgroundColor || `${accentColor}08`,
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
    color: textColor || accentColor,
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
    color: textColor || accentColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    wordBreak: "break-all",
    overflowWrap: "break-word",
    maxWidth: "100%",
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
      {label && <div style={labelStyles}>{label}</div>}
      <div style={codeStyles}>
        {code}
        {copied && <CheckmarkIcon size={size === "sm" ? 16 : size === "lg" ? 24 : 20} color="#10b981" />}
      </div>
    </div>
  );
};

