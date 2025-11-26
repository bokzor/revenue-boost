import React from "react";

export interface CloseIconProps {
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
   * Stroke width of the icon
   * @default 2
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
 * CloseIcon Component
 * 
 * A reusable X/close icon used across all popup components.
 * Uses currentColor by default to inherit text color from parent.
 */
export const CloseIcon: React.FC<CloseIconProps> = ({
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
};

