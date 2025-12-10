/**
 * PremiumFullscreenPopup Component
 *
 * Immersive full-page takeover for high-value products.
 * Features list, ratings, and urgency messaging.
 */

import React, { useState } from "react";
import { PopupPortal } from "./PopupPortal";
import type { MobilePresentationMode } from "./PopupPortal";
import type { PopupDesignConfig, Product } from "./types";
import type { PremiumFullscreenContent } from "~/domains/campaigns/types/campaign";
import { ProductImage } from "./components/shared";

export interface PremiumFullscreenConfig extends PopupDesignConfig, PremiumFullscreenContent {
  products?: Product[];
}

export interface PremiumFullscreenPopupProps {
  config: PremiumFullscreenConfig;
  isVisible: boolean;
  onClose: () => void;
  products?: Product[];
  onAddToCart?: (productIds: string[]) => Promise<void>;
}

const formatCurrency = (amount: string | number, currency = "USD"): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(numAmount);
};

export const PremiumFullscreenPopup: React.FC<PremiumFullscreenPopupProps> = ({
  config,
  isVisible,
  onClose,
  products: propProducts,
  onAddToCart,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const products = propProducts || config.products || [];
  const product = products[0];

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
    : product.compareAtPrice
      ? parseFloat(product.compareAtPrice)
      : null;

  // Calculate savings percentage for display
  const savingsPercent = hasUpsellDiscount
    ? bundleDiscount
    : product.compareAtPrice
      ? Math.round(
          ((parseFloat(product.compareAtPrice) - originalPrice) /
            parseFloat(product.compareAtPrice)) *
            100
        )
      : 0;

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
  const features = config.features || [];

  // Determine mobile presentation mode and size from config
  // When mobileFullScreen is true, use fullscreen on all viewports
  const mobilePresentationMode: MobilePresentationMode = config.mobileFullScreen ? "fullscreen" : "bottom-sheet";
  const effectiveSize = config.mobileFullScreen ? "fullscreen" : "large";

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{ color: "transparent", opacity: 0 }}
      animation={{ type: config.animation || "fade" }}
      position="center"
      size={effectiveSize}
      mobilePresentationMode={mobilePresentationMode}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={false}
      previewMode={config.previewMode}
      showBranding={config.showBranding}
      designTokensCSS={config.designTokensCSS}
    >
      <style>{`
        /* Base mobile-first styles - column layout */
        .premium-upsell {
          background: ${bgColor};
          color: ${textColor};
          display: flex;
          flex-direction: column;
          min-height: 100%;
          width: 100%;
          /* Let PopupPortal handle overflow - only scroll when content actually overflows */
          overflow: visible;
        }
        .premium-upsell-close { position: absolute; top: 16px; right: 16px; z-index: 10; width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.05); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ${textColor}; transition: background 0.2s; }
        .premium-upsell-close:hover { background: rgba(0,0,0,0.1); }
        .premium-upsell-image { position: relative; height: 40vh; min-height: 200px; width: 100%; flex-shrink: 0; background: #f3f4f6; }
        .premium-upsell-image img { width: 100%; height: 100%; object-fit: cover; }
        .premium-upsell-badge { position: absolute; top: 16px; left: 16px; padding: 6px 16px; font-size: 14px; font-weight: 600; border-radius: 999px; background: ${accentColor}; color: #fff; }
        .premium-upsell-content { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; padding: 24px; padding-bottom: 32px; }
        .premium-upsell-inner { max-width: 420px; width: 100%; }
        .premium-urgency { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(234,179,8,0.2); color: #92400e; font-size: 14px; font-weight: 500; margin-bottom: 16px; }
        .premium-urgency svg { width: 16px; height: 16px; }
        .premium-upsell-title { font-size: 24px; font-weight: 700; margin: 0 0 12px; color: ${textColor}; line-height: 1.2; }
        .premium-upsell-desc { font-size: 15px; color: ${mutedColor}; margin: 0 0 20px; line-height: 1.5; }
        .premium-features { list-style: none; padding: 0; margin: 0 0 20px; display: flex; flex-direction: column; gap: 10px; }
        .premium-feature { display: flex; align-items: center; gap: 10px; font-size: 14px; color: ${textColor}; }
        .premium-feature svg { width: 18px; height: 18px; color: var(--rb-success, #10b981); flex-shrink: 0; }
        .premium-rating { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
        .premium-stars { display: flex; }
        .premium-star { width: 18px; height: 18px; color: #d1d5db; }
        .premium-star--filled { color: #f59e0b; }
        .premium-rating-text { font-size: 13px; color: ${mutedColor}; }
        .premium-price { display: flex; align-items: baseline; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .premium-price-current { font-size: 28px; font-weight: 700; color: ${textColor}; }
        .premium-price-compare { font-size: 18px; color: ${mutedColor}; text-decoration: line-through; }
        .premium-discount { padding: 4px 8px; font-size: 13px; font-weight: 600; border-radius: 4px; background: rgba(16,185,129,0.2); color: var(--rb-success, #10b981); }
        .premium-actions { display: flex; flex-direction: column; gap: 10px; }
        .premium-cta { width: 100%; padding: 14px 20px; border-radius: 12px; background: ${config.buttonColor || accentColor}; color: ${config.buttonTextColor || "#fff"}; font-size: 15px; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.2s; }
        .premium-cta:hover { opacity: 0.9; }
        .premium-cta:disabled { opacity: 0.6; cursor: not-allowed; }
        .premium-cta--success { background: var(--rb-success, #10b981); }
        .premium-decline { width: 100%; padding: 10px 20px; background: transparent; border: none; color: ${mutedColor}; font-size: 14px; cursor: pointer; transition: color 0.2s; }
        .premium-decline:hover { color: ${textColor}; }

        /* ===== CONTAINER QUERY: Desktop (>= 768px) - queries parent popup-viewport ===== */
        @container popup-viewport (min-width: 768px) {
          .premium-upsell { flex-direction: row; min-height: 100%; }
          .premium-upsell-image { height: auto; min-height: 100%; width: 50%; }
          .premium-upsell-content { padding: 48px 64px; justify-content: center; }
          .premium-upsell-title { font-size: 36px; }
          .premium-upsell-desc { font-size: 16px; margin-bottom: 24px; }
          .premium-price-current { font-size: 32px; }
          .premium-price-compare { font-size: 20px; }
          .premium-cta { padding: 16px 24px; font-size: 16px; }
        }

        /* ===== CONTAINER QUERY: Compact Mobile (< 400px) ===== */
        @container popup-viewport (max-width: 399px) {
          .premium-upsell-image { height: 30vh; min-height: 160px; }
          .premium-upsell-content { padding: 16px; padding-bottom: 24px; }
          .premium-upsell-title { font-size: 20px; }
          .premium-upsell-desc { font-size: 14px; margin-bottom: 14px; }
          .premium-features { gap: 8px; margin-bottom: 14px; }
          .premium-feature { font-size: 13px; }
          .premium-price { margin-bottom: 18px; }
          .premium-price-current { font-size: 22px; }
          .premium-price-compare { font-size: 14px; }
          .premium-cta { padding: 12px 16px; font-size: 14px; }
          .premium-decline { padding: 8px 16px; font-size: 13px; }
        }
      `}</style>

      <div className="premium-upsell">
        <button className="premium-upsell-close" onClick={onClose} aria-label="Close">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {config.showImages !== false && product.imageUrl && (
          <div className="premium-upsell-image">
            <ProductImage
              src={product.imageUrl}
              alt={product.title}
              aspectRatio="square"
              priority={true}
            />
            {product.savingsPercent && (
              <div className="premium-upsell-badge">{product.savingsPercent}% OFF</div>
            )}
          </div>
        )}

        <div className="premium-upsell-content">
          <div className="premium-upsell-inner">
            {config.urgencyMessage && (
              <div className="premium-urgency">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {config.urgencyMessage}
              </div>
            )}

            <h2 className="premium-upsell-title">
              {config.headline || `Complete Your Order with ${product.title}`}
            </h2>
            {product.description && <p className="premium-upsell-desc">{product.description}</p>}

            {features.length > 0 && (
              <ul className="premium-features">
                {features.map((feature, index) => (
                  <li key={index} className="premium-feature">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {config.showRatings && product.rating && (
              <div className="premium-rating">
                <div className="premium-stars">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`premium-star ${i < Math.floor(product.rating!) ? "premium-star--filled" : ""}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="premium-rating-text">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Only show price if showPrices is enabled (default true) */}
            {config.showPrices !== false && (
              <div className="premium-price">
                <span className="premium-price-current">
                  {formatCurrency(displayPrice, config.currency)}
                </span>
                {/* Show compare-at price if enabled and there's a discount */}
                {config.showCompareAtPrice !== false && compareAtPrice && compareAtPrice > displayPrice && (
                  <span className="premium-price-compare">
                    {formatCurrency(compareAtPrice, config.currency)}
                  </span>
                )}
                {savingsPercent > 0 && <span className="premium-discount">-{savingsPercent}%</span>}
              </div>
            )}

            <div className="premium-actions">
              <button
                className={`premium-cta ${addedSuccess ? "premium-cta--success" : ""}`}
                onClick={handleAddToCart}
                disabled={isLoading || addedSuccess}
              >
                {addedSuccess
                  ? (config.successMessage || "✓ Added to My Order!")
                  : isLoading
                    ? "Adding..."
                    : (config.buttonText || "Claim This Deal")}
              </button>
              <button className="premium-decline" onClick={onClose}>
                {config.secondaryCtaLabel || "No thanks, I'll pass on this deal"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};
