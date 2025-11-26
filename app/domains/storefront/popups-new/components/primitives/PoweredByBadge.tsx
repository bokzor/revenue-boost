import React from "react";

export interface PoweredByBadgeProps {
  /** Position of the badge */
  position?: "bottom-left" | "bottom-right" | "bottom-center";
  /** Optional custom styles */
  style?: React.CSSProperties;
  /** The URL to link to (defaults to app store/website) */
  href?: string;
  /** App name to display */
  appName?: string;
}

/**
 * PoweredByBadge
 *
 * Displays a "Powered by Revenue Boost" badge for free tier users.
 * This component is rendered inside the popup portal/overlay.
 */
export const PoweredByBadge: React.FC<PoweredByBadgeProps> = ({
  position = "bottom-right",
  style,
  href = "https://apps.shopify.com/revenue-boost",
  appName = "Revenue Boost",
}) => {
  const positionStyles: Record<string, React.CSSProperties> = {
    "bottom-left": { bottom: "8px", left: "12px" },
    "bottom-right": { bottom: "8px", right: "12px" },
    "bottom-center": { bottom: "8px", left: "50%", transform: "translateX(-50%)" },
  };

  const badgeStyles: React.CSSProperties = {
    position: "absolute",
    zIndex: 10,
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    fontSize: "10px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: 500,
    color: "rgba(255, 255, 255, 0.85)",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: "4px",
    textDecoration: "none",
    transition: "background-color 0.2s ease, color 0.2s ease",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    ...positionStyles[position],
    ...style,
  };

  const hoverStyles = `
    .rb-powered-by-badge:hover {
      background-color: rgba(0, 0, 0, 0.8) !important;
      color: rgba(255, 255, 255, 1) !important;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: hoverStyles }} />
      <a
        className="rb-powered-by-badge"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={badgeStyles}
        aria-label={`Powered by ${appName}`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span>
          Powered by <strong>{appName}</strong>
        </span>
      </a>
    </>
  );
};

