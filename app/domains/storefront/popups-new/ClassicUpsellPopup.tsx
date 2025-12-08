/**
 * ClassicUpsellPopup Component
 *
 * Traditional centered modal with image, pricing, and clear CTAs.
 * Best for single product upsells with a classic, clean look.
 */

import React, { useState } from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig, Product } from "./types";
import type { ClassicUpsellContent } from "~/domains/campaigns/types/campaign";

export interface ClassicUpsellConfig extends PopupDesignConfig, ClassicUpsellContent {
  products?: Product[];
}

export interface ClassicUpsellPopupProps {
  config: ClassicUpsellConfig;
  isVisible: boolean;
  onClose: () => void;
  products?: Product[];
  onAddToCart?: (productIds: string[]) => Promise<void>;
}

const formatCurrency = (amount: string | number, currency = "USD"): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(numAmount);
};

export const ClassicUpsellPopup: React.FC<ClassicUpsellPopupProps> = ({
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

  const discount = product.compareAtPrice
    ? Math.round(
        ((parseFloat(product.compareAtPrice) - parseFloat(product.price)) /
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

  const accentColor = config.accentColor || config.buttonColor || "#000";
  const textColor = config.textColor || "#1f2937";
  const mutedColor = config.descriptionColor || "#6b7280";
  const bgColor = config.backgroundColor || "#ffffff";
  const borderRadius = config.borderRadius || 12;

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || "rgba(0,0,0,0.5)",
        opacity: config.overlayOpacity ?? 0.5,
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
        .classic-upsell { background: ${bgColor}; color: ${textColor}; border-radius: ${borderRadius}px; width: 100%; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        .classic-upsell-close { position: absolute; top: 12px; right: 12px; z-index: 10; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.05); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: ${mutedColor}; transition: background 0.2s; }
        .classic-upsell-close:hover { background: rgba(0,0,0,0.1); }
        .classic-upsell-badge { position: absolute; top: 12px; left: 12px; z-index: 10; padding: 4px 12px; font-size: 12px; font-weight: 600; border-radius: 999px; background: ${accentColor}; color: #fff; }
        .classic-upsell-image { position: relative; height: 224px; background: #f3f4f6; }
        .classic-upsell-image img { width: 100%; height: 100%; object-fit: cover; }
        .classic-upsell-content { padding: 20px 24px 24px; }
        .classic-upsell-title { font-size: 18px; font-weight: 600; margin: 0 0 8px; color: ${textColor}; }
        .classic-upsell-desc { font-size: 14px; color: ${mutedColor}; margin: 0 0 16px; line-height: 1.5; }
        .classic-upsell-price { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .classic-price-current { font-size: 24px; font-weight: 700; color: ${accentColor}; }
        .classic-price-compare { font-size: 16px; color: ${mutedColor}; text-decoration: line-through; }
        .classic-price-savings { font-size: 14px; font-weight: 500; color: #10b981; }
        .classic-upsell-actions { display: flex; flex-direction: column; gap: 12px; }
        .classic-upsell-cta { width: 100%; padding: 14px 16px; border-radius: 8px; background: ${config.buttonColor || accentColor}; color: ${config.buttonTextColor || "#fff"}; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.2s; }
        .classic-upsell-cta:hover { opacity: 0.9; }
        .classic-upsell-cta:disabled { opacity: 0.6; cursor: not-allowed; }
        .classic-upsell-cta--success { background: #10b981; }
        .classic-upsell-decline { width: 100%; padding: 10px 16px; background: transparent; border: none; color: ${mutedColor}; font-size: 14px; cursor: pointer; transition: color 0.2s; }
        .classic-upsell-decline:hover { color: ${textColor}; }

        /* ===== CONTAINER QUERY: Compact/Mobile (< 360px) - queries parent popup-viewport ===== */
        @container popup-viewport (max-width: 359px) {
          .classic-upsell-image { height: 160px; }
          .classic-upsell-content { padding: 16px; }
          .classic-upsell-title { font-size: 16px; }
          .classic-upsell-desc { font-size: 13px; margin-bottom: 12px; }
          .classic-price-current { font-size: 20px; }
          .classic-price-compare { font-size: 14px; }
          .classic-upsell-cta { padding: 12px 14px; font-size: 13px; }
        }

        /* Fallback media query for storefront */
        @media (max-width: 359px) {
          .classic-upsell-image { height: 160px; }
          .classic-upsell-content { padding: 16px; }
          .classic-upsell-title { font-size: 16px; }
          .classic-upsell-desc { font-size: 13px; margin-bottom: 12px; }
          .classic-price-current { font-size: 20px; }
          .classic-price-compare { font-size: 14px; }
          .classic-upsell-cta { padding: 12px 14px; font-size: 13px; }
        }
      `}</style>

      <div className="classic-upsell">
        <button className="classic-upsell-close" onClick={onClose} aria-label="Close">
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

        {product.savingsPercent && (
          <div className="classic-upsell-badge">{product.savingsPercent}% OFF</div>
        )}

        {config.showImages !== false && product.imageUrl && (
          <div className="classic-upsell-image">
            <img src={product.imageUrl} alt={product.title} />
          </div>
        )}

        <div className="classic-upsell-content">
          <h3 className="classic-upsell-title">{product.title}</h3>
          {product.description && <p className="classic-upsell-desc">{product.description}</p>}

          <div className="classic-upsell-price">
            <span className="classic-price-current">
              {formatCurrency(product.price, config.currency)}
            </span>
            {product.compareAtPrice && (
              <span className="classic-price-compare">
                {formatCurrency(product.compareAtPrice, config.currency)}
              </span>
            )}
            {discount > 0 && <span className="classic-price-savings">Save {discount}%</span>}
          </div>

          <div className="classic-upsell-actions">
            <button
              className={`classic-upsell-cta ${addedSuccess ? "classic-upsell-cta--success" : ""}`}
              onClick={handleAddToCart}
              disabled={isLoading || addedSuccess}
            >
              {addedSuccess
                ? "✓ Added to Cart"
                : isLoading
                  ? "Adding..."
                  : `Add to Cart — ${formatCurrency(product.price, config.currency)}`}
            </button>
            <button className="classic-upsell-decline" onClick={onClose}>
              {config.secondaryCtaLabel || "No thanks, continue without"}
            </button>
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};
