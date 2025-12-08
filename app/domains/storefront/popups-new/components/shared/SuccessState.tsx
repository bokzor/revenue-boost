import React from "react";
import { DiscountCodeDisplay } from "./DiscountCodeDisplay";
import "./animations.css";

/**
 * Confetti particle component for celebration effect
 */
const ConfettiParticle: React.FC<{
  delay: number;
  color: string;
  left: number;
  size: number;
}> = ({ delay, color, left, size }) => (
  <div
    style={{
      position: "absolute",
      top: "20%",
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: size > 6 ? "2px" : "50%",
      animation: `confettiDrop 1.5s ease-out ${delay}s forwards`,
      opacity: 0,
      transform: `rotate(${Math.random() * 360}deg)`,
      zIndex: 100,
    }}
  />
);

/**
 * Animated checkmark with circle expand effect
 */
const AnimatedCheckmark: React.FC<{
  size?: number;
  color?: string;
  bgColor?: string;
}> = ({ size = 64, color = "#16a34a", bgColor }) => {
  const circleSize = size * 1.5;
  const bgColorValue = bgColor || `${color}20`;

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {/* Expanding circle behind */}
      <div
        style={{
          position: "absolute",
          width: `${circleSize}px`,
          height: `${circleSize}px`,
          borderRadius: "50%",
          backgroundColor: bgColorValue,
          animation: "circleExpand 0.8s ease-out forwards",
        }}
      />
      {/* Main circle */}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          backgroundColor: bgColorValue,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "elasticBounce 0.6s ease-out forwards",
          position: "relative",
          zIndex: 1,
        }}
      >
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          style={{ overflow: "visible" }}
        >
          <path
            d="M5 13l4 4L19 7"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 30,
              strokeDashoffset: 30,
              animation: "checkmarkDraw 0.4s ease-out 0.3s forwards",
            }}
          />
        </svg>
      </div>
    </div>
  );
};

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
  /**
   * Seconds remaining before auto-close (null = no countdown)
   */
  autoCloseIn?: number | null;
  /**
   * Callback to cancel auto-close
   */
  onCancelAutoClose?: () => void;
  /**
   * Optional secondary action button (e.g., "Go to Cart")
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
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
  accentColor,
  successColor,
  textColor,
  descriptionColor: _descriptionColor, // Reserved for future use
  animation: _animation = "bounceIn",
  fontSize = "1.875rem",
  fontWeight = "700",
  className,
  style,
  autoCloseIn,
  onCancelAutoClose,
  secondaryAction,
}) => {
  // Use CSS variable with fallback to prop value for design token integration
  const resolvedSuccessColor = successColor || "var(--rb-success, #16a34a)";
  const resolvedAccentColor = accentColor || "var(--rb-primary, #16a34a)";
  const resolvedTextColor = textColor || "var(--rb-foreground, #111827)";

  // Confetti colors based on accent
  const confettiColors = [
    resolvedSuccessColor,
    resolvedAccentColor,
    "#fbbf24", // gold
    "#ec4899", // pink
    "#8b5cf6", // purple
    "#06b6d4", // cyan
  ];

  const containerStyles: React.CSSProperties = {
    textAlign: "center",
    padding: "2rem 1rem",
    position: "relative",
    overflow: "hidden",
    fontFamily: "var(--rb-font-family, inherit)",
    ...style,
  };

  const messageStyles: React.CSSProperties = {
    fontSize,
    fontWeight,
    fontFamily: "var(--rb-heading-font-family, var(--rb-font-family, inherit))",
    color: resolvedTextColor,
    marginBottom: discountCode ? "1.5rem" : "0",
    lineHeight: 1.2,
    animation: "staggerFadeIn 0.5s ease-out 0.4s both",
  };

  const discountContainerStyles: React.CSSProperties = {
    animation: "prizeReveal 0.6s ease-out 0.6s both",
  };

  const footerStyles: React.CSSProperties = {
    marginTop: "1.5rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    animation: "staggerFadeIn 0.5s ease-out 0.8s both",
  };

  const primaryButtonStyles: React.CSSProperties = {
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: "0.5rem",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    backgroundColor: resolvedAccentColor,
    color: "#ffffff",
  };

  const countdownStyles: React.CSSProperties = {
    fontSize: "0.875rem",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  const keepOpenButtonStyles: React.CSSProperties = {
    background: "none",
    border: "none",
    color: resolvedAccentColor,
    cursor: "pointer",
    textDecoration: "underline",
    fontSize: "0.875rem",
    padding: 0,
  };

  return (
    <div className={className} style={containerStyles}>
      {/* Confetti particles */}
      {confettiColors.map((color, i) => (
        <React.Fragment key={i}>
          <ConfettiParticle
            delay={i * 0.1}
            color={color}
            left={10 + i * 15}
            size={Math.random() * 6 + 4}
          />
          <ConfettiParticle
            delay={i * 0.1 + 0.05}
            color={confettiColors[(i + 2) % confettiColors.length]}
            left={15 + i * 15}
            size={Math.random() * 8 + 4}
          />
        </React.Fragment>
      ))}

      {/* Icon with animated checkmark */}
      <div style={{ marginBottom: "1.5rem" }}>
        {icon || (
          <AnimatedCheckmark
            size={64}
            color={resolvedSuccessColor}
          />
        )}
      </div>

      {/* Message with staggered entrance */}
      <h3 style={messageStyles}>{message}</h3>

      {/* Optional Discount Code with reveal animation */}
      {discountCode && (
        <div style={discountContainerStyles}>
          <DiscountCodeDisplay
            code={discountCode}
            onCopy={onCopyCode}
            copied={copiedCode}
            label={discountLabel}
            variant="dashed"
            accentColor={resolvedAccentColor}
            size="md"
          />
        </div>
      )}

      {/* Footer: Secondary Action + Auto-close countdown */}
      {(secondaryAction || (autoCloseIn !== null && autoCloseIn !== undefined && autoCloseIn > 0)) && (
        <div style={footerStyles}>
          {/* Secondary Action Button */}
          {secondaryAction && (
            <button style={primaryButtonStyles} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          )}

          {/* Auto-close Countdown */}
          {autoCloseIn !== null && autoCloseIn !== undefined && autoCloseIn > 0 && (
            <div style={countdownStyles}>
              <span>Closing in {autoCloseIn}s...</span>
              {onCancelAutoClose && (
                <button style={keepOpenButtonStyles} onClick={onCancelAutoClose}>
                  Keep open
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

