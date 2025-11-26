import React from "react";

export interface ChevronIconProps {
  /**
   * Direction of the chevron
   * @default "down"
   */
  direction?: "up" | "down" | "left" | "right";
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
 * ChevronIcon Component
 * 
 * A reusable chevron/arrow icon used for dropdowns, accordions, and navigation.
 * Supports all four directions (up, down, left, right).
 * Uses currentColor by default to inherit text color from parent.
 */
export const ChevronIcon: React.FC<ChevronIconProps> = ({
  direction = "down",
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
  className,
  style,
}) => {
  // Rotation angles for each direction
  const rotationMap = {
    down: 0,
    left: 90,
    up: 180,
    right: 270,
  };

  const rotation = rotationMap[direction];

  const chevronStyle: React.CSSProperties = {
    transform: `rotate(${rotation}deg)`,
    transition: "transform 0.2s ease",
    ...style,
  };

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
      style={chevronStyle}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
};

