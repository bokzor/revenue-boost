/**
 * CountdownTimerBanner Component (Stub)
 * 
 * TODO: This is a stub component created to fix build issues.
 * The actual implementation should be migrated from the storefront extension.
 * 
 * Expected features:
 * - Sticky banner with countdown timer
 * - Flash sales and limited-time offers
 * - Urgency messaging and CTA button
 * - Optional stock counter
 * 
 * Reference: extensions/storefront-src/auto-generated/components/sales/CountdownTimerBanner.tsx
 */

import React from "react";

export interface CountdownTimerConfig {
  endTime: string | Date;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaUrl?: string;
  showStockCounter?: boolean;
  stockCount?: number;
  colorScheme?: "urgent" | "success" | "info" | "custom";
  backgroundColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  hideOnExpiry?: boolean;
  position?: "top" | "bottom";
  showCloseButton?: boolean;
}

export interface CountdownTimerBannerProps {
  config: CountdownTimerConfig;
  onClose?: () => void;
  onCtaClick?: () => void;
  onExpire?: () => void;
  previewMode?: boolean;
}

export const CountdownTimerBanner: React.FC<CountdownTimerBannerProps> = ({
  config,
  onClose,
  onCtaClick,
  previewMode = false,
}) => {
  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: config.backgroundColor || "#FF6B6B",
        color: config.textColor || "#FFFFFF",
        textAlign: "center",
        position: previewMode ? "relative" : "fixed",
        top: config.position === "bottom" ? "auto" : 0,
        bottom: config.position === "bottom" ? 0 : "auto",
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {config.headline && (
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "bold" }}>
            {config.headline}
          </h3>
        )}
        {config.subheadline && (
          <p style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
            {config.subheadline}
          </p>
        )}
        <div style={{ fontSize: "24px", fontWeight: "bold", margin: "12px 0" }}>
          ⏰ Countdown Timer (TODO: Implement)
        </div>
        {config.ctaText && (
          <button
            onClick={onCtaClick}
            style={{
              padding: "10px 24px",
              backgroundColor: config.buttonColor || "#FFFFFF",
              color: config.buttonTextColor || "#FF6B6B",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            {config.ctaText}
          </button>
        )}
        {config.showCloseButton && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "transparent",
              border: "none",
              color: config.textColor || "#FFFFFF",
              fontSize: "20px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ×
          </button>
        )}
        <p style={{ fontSize: "12px", marginTop: "12px", opacity: 0.8 }}>
          TODO: Implement actual countdown timer functionality
        </p>
      </div>
    </div>
  );
};

export default CountdownTimerBanner;

