/**
 * ImageFloatingBadge Component
 *
 * A floating badge displayed over the image area for social proof.
 * Used for content like "Join 10,000+ members" with an icon.
 *
 * Uses CSS variables for styling:
 * - --rb-popup-bg: Background color
 * - --rb-popup-fg: Text color
 * - --rb-popup-accent: Icon background color
 */

import React from "react";
import type { BadgeIcon } from "~/domains/campaigns/types/campaign";

export interface ImageFloatingBadgeProps {
  /** Icon to display */
  icon?: BadgeIcon;
  /** Small title text (e.g., "Join") */
  title?: string;
  /** Main value text (e.g., "10,000+ members") */
  value: string;
  /** Position of the badge */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Background color (overrides CSS variable) */
  backgroundColor?: string;
  /** Text color (overrides CSS variable) */
  textColor?: string;
  /** Accent color for icon background (overrides CSS variable) */
  accentColor?: string;
  /** Additional className */
  className?: string;
}

/**
 * Icon component for floating badge icons
 */
function FloatingBadgeIcon({ icon, size = 20 }: { icon: BadgeIcon; size?: number }) {
  const iconStyle = { width: size, height: size };

  switch (icon) {
    case "leaf":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
        </svg>
      );
    case "sparkle":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M12 2L13.09 8.26L19 9L14 13.14L15.18 19.02L12 16L8.82 19.02L10 13.14L5 9L10.91 8.26L12 2Z" />
        </svg>
      );
    case "gift":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M22,12V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V12A1,1 0 0,1 1,11V8A2,2 0 0,1 3,6H6.17C6.06,5.69 6,5.35 6,5A3,3 0 0,1 9,2C10,2 10.88,2.5 11.43,3.24L12,4L12.57,3.24C13.12,2.5 14,2 15,2A3,3 0 0,1 18,5C18,5.35 17.94,5.69 17.83,6H21A2,2 0 0,1 23,8V11A1,1 0 0,1 22,12M4,20H11V12H4V20M20,20V12H13V20H20M9,4A1,1 0 0,0 8,5A1,1 0 0,0 9,6A1,1 0 0,0 10,5A1,1 0 0,0 9,4M15,4A1,1 0 0,0 14,5A1,1 0 0,0 15,6A1,1 0 0,0 16,5A1,1 0 0,0 15,4M3,8V10H11V8H3M13,8V10H21V8H13Z" />
        </svg>
      );
    case "percent":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M18.5,3.5L3.5,18.5L5.5,20.5L20.5,5.5M7,4A3,3 0 0,0 4,7A3,3 0 0,0 7,10A3,3 0 0,0 10,7A3,3 0 0,0 7,4M17,14A3,3 0 0,0 14,17A3,3 0 0,0 17,20A3,3 0 0,0 20,17A3,3 0 0,0 17,14Z" />
        </svg>
      );
    case "fire":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={iconStyle}>
          <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5Z" />
        </svg>
      );
    case "none":
    default:
      return null;
  }
}

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  "top-left": { top: "1.5rem", left: "1.5rem" },
  "top-right": { top: "1.5rem", right: "1.5rem" },
  "bottom-left": { bottom: "1.5rem", left: "1.5rem" },
  "bottom-right": { bottom: "1.5rem", right: "1.5rem" },
};

export function ImageFloatingBadge({
  icon = "leaf",
  title,
  value,
  position = "bottom-left",
  backgroundColor,
  textColor,
  accentColor,
  className = "",
}: ImageFloatingBadgeProps) {
  const positionStyle = POSITION_STYLES[position] || POSITION_STYLES["bottom-left"];

  return (
    <div
      className={`rb-image-floating-badge ${className}`}
      style={{
        position: "absolute",
        ...positionStyle,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "1rem",
        borderRadius: "0.75rem",
        backgroundColor: backgroundColor || "var(--rb-popup-bg, rgba(255, 255, 255, 0.95))",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      }}
    >
      {icon && icon !== "none" && (
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "50%",
            backgroundColor: accentColor || "var(--rb-popup-badge-bg, #F0FDF4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: textColor || "var(--rb-popup-accent, #166534)",
          }}
        >
          <FloatingBadgeIcon icon={icon} size={20} />
        </div>
      )}
      <div>
        {title && (
          <p
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: textColor ? `${textColor}99` : "var(--rb-popup-fg, #6B7280)",
              opacity: 0.7,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </p>
        )}
        <p
          style={{
            fontSize: "1.125rem",
            fontWeight: 500,
            color: textColor || "var(--rb-popup-fg, #1F2937)",
            margin: 0,
            lineHeight: 1.3,
            fontFamily: "var(--rb-popup-headline-font, serif)",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default ImageFloatingBadge;

