import React from "react";

export interface SpinnerIconProps {
  /**
   * Size of the icon in pixels
   * @default 20
   */
  size?: number;
  /**
   * Color of the icon
   * @default "currentColor"
   */
  color?: string;
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
 * SpinnerIcon Component
 * 
 * A reusable loading spinner icon used across popup components.
 * Automatically animates using the spin keyframe from animations.css.
 * Uses currentColor by default to inherit text color from parent.
 */
export const SpinnerIcon: React.FC<SpinnerIconProps> = ({
  size = 20,
  color = "currentColor",
  className,
  style,
}) => {
  const spinnerStyle: React.CSSProperties = {
    animation: "spin 1s linear infinite",
    ...style,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={spinnerStyle}
      aria-hidden="true"
      role="status"
    >
      <circle
        style={{ opacity: 0.25 }}
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        style={{ opacity: 0.75 }}
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

