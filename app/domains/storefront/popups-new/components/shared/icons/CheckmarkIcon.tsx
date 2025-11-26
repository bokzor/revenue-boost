import React from "react";

export interface CheckmarkIconProps {
  /**
   * Size of the icon in pixels
   * @default 24
   */
  size?: number;
  /**
   * Color of the icon
   * @default "currentColor"
   */
  color?: string;
  /**
   * Stroke width of the icon
   * @default 3
   */
  strokeWidth?: number;
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
 * CheckmarkIcon Component
 * 
 * A reusable checkmark/success icon used in success states across popup components.
 * Uses currentColor by default to inherit text color from parent.
 */
export const CheckmarkIcon: React.FC<CheckmarkIconProps> = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 3,
  className,
  style,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

