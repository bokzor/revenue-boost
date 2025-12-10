/**
 * CountdownUrgencyPopup Component
 *
 * Time-limited offer with live countdown timer.
 * Creates urgency with visual countdown and auto-decline on expiry.
 */

import React, { useState, useEffect } from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig, Product } from "./types";
import type { CountdownUrgencyContent } from "~/domains/campaigns/types/campaign";
import { ProductImage } from "./components/shared";

export interface CountdownUrgencyConfig extends PopupDesignConfig, CountdownUrgencyContent {
  products?: Product[];
}

export interface CountdownUrgencyPopupProps {
  config: CountdownUrgencyConfig;
  isVisible: boolean;
  onClose: () => void;
  products?: Product[];
  onAddToCart?: (productIds: string[]) => Promise<void>;
}

const formatCurrency = (amount: string | number, currency = "USD"): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(numAmount);
};

export const CountdownUrgencyPopup: React.FC<CountdownUrgencyPopupProps> = ({
  config,
  isVisible,
  onClose,
  products: propProducts,
  onAddToCart,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(config.expiresInSeconds || 300);

  const products = propProducts || config.products || [];
  const product = products[0];

  // Countdown timer effect
  useEffect(() => {
    if (!isVisible) {
      setTimeLeft(config.expiresInSeconds || 300);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, config.expiresInSeconds]);

  // Handle expiry - close popup when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && isVisible) {
      onClose();
    }
  }, [timeLeft, isVisible, onClose]);

  if (!product) return null;

  // Calculate pricing with bundleDiscount
  const originalPrice = parseFloat(product.price);
  const bundleDiscount = config.bundleDiscount || 0;

  // If bundleDiscount is configured, apply it to the product price
  // Otherwise, fall back to compareAtPrice discount (existing product sale)
  const hasUpsellDiscount = bundleDiscount > 0;
  const discountedPrice = hasUpsellDiscount
    ? originalPrice * (1 - bundleDiscount / 100)
    : originalPrice;

  // For display: show original price as compare-at when bundleDiscount is applied
  // Or use product's compareAtPrice if no bundleDiscount
  const displayPrice = hasUpsellDiscount ? discountedPrice : originalPrice;
  const compareAtPrice = hasUpsellDiscount
    ? originalPrice
    : (product.compareAtPrice ? parseFloat(product.compareAtPrice) : null);

  // Calculate savings percentage for display
  const savingsPercent = hasUpsellDiscount
    ? bundleDiscount
    : (product.compareAtPrice
        ? Math.round(((parseFloat(product.compareAtPrice) - originalPrice) / parseFloat(product.compareAtPrice)) * 100)
        : 0);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const urgencyLevel = timeLeft < 60 ? "high" : timeLeft < 180 ? "medium" : "low";

  const handleAddToCart = async () => {
    if (!onAddToCart || isLoading) return;
    setIsLoading(true);
    try {
      await onAddToCart([product.id]);
      setAddedSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const accentColor = config.accentColor || config.buttonColor || "var(--rb-primary, #000)";
  const textColor = config.textColor || "var(--rb-foreground, #1f2937)";
  const mutedColor = config.descriptionColor || "var(--rb-muted, #6b7280)";
  const bgColor = config.backgroundColor || "var(--rb-background, #ffffff)";
  const borderRadius = config.borderRadius || 16;

  // Urgency colors - high uses error token, medium is warning (kept static), low uses accent
  const urgencyColors = {
    high: { bg: "var(--rb-error, #ef4444)", text: "#fff" },
    medium: { bg: "#f59e0b", text: "#fff" },
    low: { bg: accentColor, text: "#fff" },
  };
  const currentUrgency = urgencyColors[urgencyLevel];

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || "rgba(0,0,0,0.6)",
        opacity: config.overlayOpacity ?? 0.6,
        blur: 4,
      }}
      animation={{ type: config.animation || "fade" }}
      position={config.position || "center"}
      size={config.size || "medium"}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      showBranding={config.showBranding}
      designTokensCSS={config.designTokensCSS}
    >
      <style>{`
        .countdown-upsell { background: ${bgColor}; color: ${textColor}; border-radius: ${borderRadius}px; width: 100%; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        .countdown-header { padding: 16px; text-align: center; background: ${currentUrgency.bg}; color: ${currentUrgency.text}; transition: background 0.3s; }
        .countdown-header-close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; transition: background 0.2s; }
        .countdown-header-close:hover { background: rgba(255,255,255,0.3); }
        .countdown-label { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
        .countdown-timer { font-size: 36px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .countdown-timer--pulse { animation: pulse 1s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .countdown-content { padding: 20px 24px 24px; position: relative; }
        .countdown-product { display: flex; gap: 16px; margin-bottom: 16px; }
        .countdown-image { width: 96px; height: 96px; border-radius: 8px; background: #f3f4f6; overflow: hidden; flex-shrink: 0; }
        .countdown-image img { width: 100%; height: 100%; object-fit: cover; }
        .countdown-info { flex: 1; }
        .countdown-title { font-size: 15px; font-weight: 600; color: ${textColor}; margin: 0 0 4px; }
        .countdown-desc { font-size: 13px; color: ${mutedColor}; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .countdown-price-box { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 12px; background: rgba(0,0,0,0.03); margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
        .countdown-price-label { font-size: 11px; color: ${mutedColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .countdown-prices { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
        .countdown-price-current { font-size: 22px; font-weight: 700; color: ${textColor}; }
        .countdown-price-compare { font-size: 14px; color: ${mutedColor}; text-decoration: line-through; }
        .countdown-discount { padding: 6px 12px; border-radius: 999px; background: var(--rb-success, #10b981); color: #fff; font-size: 14px; font-weight: 700; }
        .countdown-social { display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${mutedColor}; margin-bottom: 16px; }
        .countdown-social svg { width: 16px; height: 16px; color: var(--rb-success, #10b981); }
        .countdown-actions { display: flex; flex-direction: column; gap: 12px; }
        .countdown-cta { width: 100%; padding: 14px 16px; border-radius: 10px; background: ${config.buttonColor || accentColor}; color: ${config.buttonTextColor || "#fff"}; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
        .countdown-cta:hover { opacity: 0.9; }
        .countdown-cta:disabled { opacity: 0.6; cursor: not-allowed; }
        .countdown-cta--high { background: var(--rb-error, #ef4444); animation: pulse 1s infinite; }
        .countdown-cta--success { background: var(--rb-success, #10b981); animation: none; }
        .countdown-decline { width: 100%; padding: 10px 16px; background: transparent; border: none; color: ${mutedColor}; font-size: 14px; cursor: pointer; transition: color 0.2s; }
        .countdown-decline:hover { color: ${textColor}; }

        /* ===== CONTAINER QUERY: Compact/Mobile (< 360px) - queries parent popup-viewport ===== */
        @container popup-viewport (max-width: 359px) {
          .countdown-header { padding: 12px; }
          .countdown-timer { font-size: 28px; }
          .countdown-content { padding: 16px; }
          .countdown-product { flex-direction: column; gap: 12px; }
          .countdown-image { width: 100%; height: 140px; }
          .countdown-price-box { padding: 12px; flex-direction: column; align-items: flex-start; }
          .countdown-price-current { font-size: 18px; }
          .countdown-cta { padding: 12px 14px; font-size: 13px; }
        }


      `}</style>

      <div className="countdown-upsell">
        <div className="countdown-header">
          <button className="countdown-header-close" onClick={onClose} aria-label="Close">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <p className="countdown-label">⚡ This offer expires in</p>
          <div
            className={`countdown-timer ${urgencyLevel === "high" ? "countdown-timer--pulse" : ""}`}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>

        <div className="countdown-content">
          <div className="countdown-product">
            {config.showImages !== false && product.imageUrl && (
              <div className="countdown-image">
                <ProductImage
                  src={product.imageUrl}
                  alt={product.title}
                  aspectRatio="square"
                  priority={true}
                />
              </div>
            )}
            <div className="countdown-info">
              <h3 className="countdown-title">{product.title}</h3>
              {product.description && <p className="countdown-desc">{product.description}</p>}
            </div>
          </div>

          {/* Only show price box if showPrices is enabled (default true) */}
          {config.showPrices !== false && (
            <div className="countdown-price-box">
              <div>
                <p className="countdown-price-label">
                  {config.bundleDiscountText || "Limited Time Price"}
                </p>
                <div className="countdown-prices">
                  {/* Show discounted price as current price */}
                  <span className="countdown-price-current">
                    {formatCurrency(displayPrice, config.currency)}
                  </span>
                  {/* Show original price as compare-at (struck through) - only if showCompareAtPrice enabled */}
                  {config.showCompareAtPrice !== false && compareAtPrice && compareAtPrice > displayPrice && (
                    <span className="countdown-price-compare">
                      {formatCurrency(compareAtPrice, config.currency)}
                    </span>
                  )}
                </div>
              </div>
              {savingsPercent > 0 && <div className="countdown-discount">-{savingsPercent}%</div>}
            </div>
          )}

          {config.socialProofMessage && (
            <div className="countdown-social">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{config.socialProofMessage}</span>
            </div>
          )}

          <div className="countdown-actions">
            <button
              className={`countdown-cta ${urgencyLevel === "high" && !addedSuccess ? "countdown-cta--high" : ""} ${addedSuccess ? "countdown-cta--success" : ""}`}
              onClick={handleAddToCart}
              disabled={isLoading || addedSuccess}
            >
              {addedSuccess ? "✓ Deal Claimed!" : isLoading ? "Claiming..." : "Claim This Deal Now"}
            </button>
            <button className="countdown-decline" onClick={onClose}>
              {config.secondaryCtaLabel || "No thanks"}
            </button>
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};
