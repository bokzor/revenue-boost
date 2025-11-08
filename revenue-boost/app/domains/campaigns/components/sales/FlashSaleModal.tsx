/**
 * FlashSaleModal Component (Stub)
 *
 * TODO: This is a stub component created to fix build issues.
 * The actual implementation should be created based on requirements.
 *
 * Expected features:
 * - Modal popup for flash sales
 * - Countdown timer
 * - Product showcase
 * - Discount information
 * - CTA button
 */

import React from "react";

export interface FlashSaleConfig {
  headline?: string;
  subheadline?: string;
  urgencyMessage?: string;
  endTime?: string | Date;
  discountCode?: string;
  discountValue?: number;
  discountPercentage?: number;
  discountType?: "percentage" | "fixed";
  ctaText?: string;
  ctaUrl?: string;
  productImage?: string;
  productTitle?: string;
  originalPrice?: number;
  salePrice?: number;
  showCountdown?: boolean;
  countdownDuration?: number;
  showStockCounter?: boolean;
  stockCount?: number;
}

export interface FlashSaleModalProps {
  config: FlashSaleConfig;
  isOpen?: boolean;
  onClose?: () => void;
  onCtaClick?: () => void;
  previewMode?: boolean;
}

export const FlashSaleModal: React.FC<FlashSaleModalProps> = ({
  config,
  isOpen = true,
  onClose,
  onCtaClick,
  previewMode = false,
}) => {
  if (!isOpen && !previewMode) return null;

  return (
    <div
      style={{
        position: previewMode ? "relative" : "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: previewMode ? "transparent" : "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          padding: "32px",
          maxWidth: "500px",
          width: "100%",
          position: "relative",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          ×
        </button>

        {config.headline && (
          <h2 style={{ margin: "0 0 12px 0", fontSize: "24px", color: "#333" }}>
            {config.headline}
          </h2>
        )}

        {config.subheadline && (
          <p style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#666" }}>
            {config.subheadline}
          </p>
        )}

        <div
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#FF6B6B",
            margin: "16px 0",
            textAlign: "center",
          }}
        >
          ⏰ Flash Sale Timer (TODO)
        </div>

        {config.discountCode && (
          <div
            style={{
              backgroundColor: "#F5F5F5",
              padding: "12px",
              borderRadius: "4px",
              textAlign: "center",
              margin: "16px 0",
            }}
          >
            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#666" }}>
              Use code:
            </p>
            <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#333" }}>
              {config.discountCode}
            </p>
          </div>
        )}

        {config.ctaText && (
          <button
            onClick={onCtaClick}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#FF6B6B",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "16px",
            }}
          >
            {config.ctaText}
          </button>
        )}

        <p style={{ fontSize: "12px", marginTop: "16px", color: "#999", textAlign: "center" }}>
          TODO: Implement full flash sale modal functionality
        </p>
      </div>
    </div>
  );
};

export default FlashSaleModal;

