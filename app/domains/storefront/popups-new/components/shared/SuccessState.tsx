import React from "react";
import { CheckmarkIcon } from "./icons/CheckmarkIcon";
import { DiscountCodeDisplay } from "./DiscountCodeDisplay";
import "./animations.css";

/**
 * SuccessState Component
 *
 * A reusable component for displaying success messages with optional discount codes.
 * Features an animated checkmark icon and integrates with DiscountCodeDisplay for
 * showing discount codes with copy functionality.
 *
 * @example
 * ```tsx
 * // Basic success message
 * <SuccessState message="Thanks for subscribing!" />
 *
 * // With discount code
 * const { discountCode, copiedCode, handleCopyCode } = useDiscountCode("SAVE20");
 * <SuccessState
 *   message="Thanks for subscribing!"
 *   discountCode={discountCode}
 *   onCopyCode={handleCopyCode}
 *   copiedCode={copiedCode}
 *   discountLabel="Your discount code:"
 * />
 *
 * // Custom icon and animation
 * <SuccessState
 *   message="Success!"
 *   icon={<CustomIcon />}
 *   animation="zoom"
 *   successColor="#00ff00"
 * />
 *
 * // Different animations
 * <SuccessState message="Done!" animation="fade" />
 * <SuccessState message="Done!" animation="slideUp" />
 * ```
 *
 * @component
 * @category Shared Components
 * @subcategory Phase 2 - Core Components
 */
export interface SuccessStateProps {
  /**
   * Success message to display
   */
  message: string;
  /**
   * Optional discount code to display below the message
   */
  discountCode?: string;
  /**
   * Callback when discount code is clicked/copied
   */
  onCopyCode?: () => void;
  /**
   * Whether the discount code has been copied
   */
  copiedCode?: boolean;
  /**
   * Label for the discount code (e.g., "Your discount code:")
   */
  discountLabel?: string;
  /**
   * Custom icon to display (defaults to checkmark)
   */
  icon?: React.ReactNode;
  /**
   * Accent color for icon background and discount code
   * @default "#16a34a" (green)
   */
  accentColor?: string;
  /**
   * Success color for icon
   * @default "#16a34a" (green)
   */
  successColor?: string;
  /**
   * Text color for the message
   * @default "#111827"
   */
  textColor?: string;
  /**
   * Description color for secondary text
   */
  descriptionColor?: string;
  /**
   * Animation for the success state
   * @default "bounceIn"
   */
  animation?: "fade" | "bounce" | "zoom" | "slideUp";
  /**
   * Font size for the message
   * @default "1.875rem"
   */
  fontSize?: string;
  /**
   * Font weight for the message
   * @default "700"
   */
  fontWeight?: string | number;
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
 * SuccessState Component
 * 
 * Displays a success message with an animated checkmark icon.
 * Optionally includes a discount code display with copy functionality.
 * Used across multiple popup types for consistent success experiences.
 * 
 * @example
 * ```tsx
 * const { discountCode, copiedCode, handleCopyCode } = useDiscountCode();
 * 
 * <SuccessState
 *   message="Thanks for subscribing!"
 *   discountCode={discountCode}
 *   onCopyCode={handleCopyCode}
 *   copiedCode={copiedCode}
 *   discountLabel="Your discount code:"
 *   accentColor="#3b82f6"
 * />
 * ```
 */
export const SuccessState: React.FC<SuccessStateProps> = ({
  message,
  discountCode,
  onCopyCode,
  copiedCode = false,
  discountLabel,
  icon,
  accentColor = "#16a34a",
  successColor = "#16a34a",
  textColor = "#111827",
  descriptionColor, // Reserved for future use
  animation = "bounceIn",
  fontSize = "1.875rem",
  fontWeight = "700",
  className,
  style,
}) => {
  const animationMap: Record<string, string> = {
    fade: "fadeInUp 0.5s ease-out",
    bounce: "bounceIn 0.6s ease-out",
    zoom: "zoomIn 0.4s ease-out",
    slideUp: "slideUpFade 0.5s ease-out",
  };

  const containerStyles: React.CSSProperties = {
    textAlign: "center",
    padding: "2rem 0",
    animation: animationMap[animation] || animationMap.bounce,
    ...style,
  };

  const iconContainerStyles: React.CSSProperties = {
    width: "4rem",
    height: "4rem",
    borderRadius: "9999px",
    background: `${successColor}20`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
    animation: "bounceIn 0.6s ease-out",
  };

  const messageStyles: React.CSSProperties = {
    fontSize,
    fontWeight,
    color: textColor,
    marginBottom: discountCode ? "1.5rem" : "0",
    lineHeight: 1.1,
  };

  return (
    <div className={className} style={containerStyles}>
      {/* Icon */}
      <div style={iconContainerStyles}>
        {icon || <CheckmarkIcon size={32} color={successColor} strokeWidth={3} />}
      </div>

      {/* Message */}
      <h3 style={messageStyles}>{message}</h3>

      {/* Optional Discount Code */}
      {discountCode && (
        <DiscountCodeDisplay
          code={discountCode}
          onCopy={onCopyCode}
          copied={copiedCode}
          label={discountLabel}
          variant="dashed"
          accentColor={accentColor}
          size="md"
        />
      )}
    </div>
  );
};

