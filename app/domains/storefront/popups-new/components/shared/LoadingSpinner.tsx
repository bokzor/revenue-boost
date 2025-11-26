import React from "react";
import { SpinnerIcon } from "./icons/SpinnerIcon";

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
  /**
   * Color of the spinner
   * @default "currentColor"
   */
  color?: string;
  /**
   * Optional text to display alongside the spinner
   */
  text?: string;
  /**
   * Position of text relative to spinner
   * @default "right"
   */
  textPosition?: "top" | "right" | "bottom" | "left";
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
  /**
   * Center the spinner in its container
   * @default false
   */
  centered?: boolean;
}

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner with optional text label.
 * Supports three sizes (sm, md, lg) and flexible text positioning.
 * Uses the SpinnerIcon component with the spin animation from animations.css.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "currentColor",
  text,
  textPosition = "right",
  className,
  style,
  centered = false,
}) => {
  // Size mappings
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 32,
  };

  const textSizeMap = {
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
  };

  const gapMap = {
    sm: "0.5rem",
    md: "0.625rem",
    lg: "0.75rem",
  };

  const spinnerSize = sizeMap[size];
  const textSize = textSizeMap[size];
  const gap = gapMap[size];

  // Layout direction based on text position
  const flexDirectionMap = {
    top: "column-reverse",
    right: "row",
    bottom: "column",
    left: "row-reverse",
  };

  const containerStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: centered ? "center" : "flex-start",
    flexDirection: flexDirectionMap[textPosition] as any,
    gap: text ? gap : 0,
    color,
    ...style,
  };

  const textStyles: React.CSSProperties = {
    fontSize: textSize,
    fontWeight: 500,
    lineHeight: 1.5,
    color: "inherit",
  };

  return (
    <div
      className={className}
      style={containerStyles}
      role="status"
      aria-live="polite"
      aria-label={text || "Loading"}
    >
      <SpinnerIcon size={spinnerSize} color={color} />
      {text && (
        <span style={textStyles} aria-hidden="true">
          {text}
        </span>
      )}
    </div>
  );
};

