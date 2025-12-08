/**
 * MinimalSlideUpPopup Component
 *
 * Compact bottom sheet ideal for mobile-first experiences.
 * Best for quick, non-intrusive single product upsells.
 */

import React, { useState } from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig, Product } from "./types";
import type { MinimalSlideUpContent } from "~/domains/campaigns/types/campaign";

export interface MinimalSlideUpConfig extends PopupDesignConfig, MinimalSlideUpContent {
  products?: Product[];
}

export interface MinimalSlideUpPopupProps {
  config: MinimalSlideUpConfig;
  isVisible: boolean;
  onClose: () => void;
  products?: Product[];
  onAddToCart?: (productIds: string[]) => Promise<void>;
}

const formatCurrency = (amount: string | number, currency = "USD"): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(numAmount);
};

export const MinimalSlideUpPopup: React.FC<MinimalSlideUpPopupProps> = ({
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
  const borderRadius = config.borderRadius || 16;

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || "rgba(0,0,0,0.2)",
        opacity: config.overlayOpacity ?? 0.2,
      }}
      animation={{ type: "slide" }}
      position="bottom"
      size={config.size || "medium"}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      showBranding={config.showBranding}
      designTokensCSS={config.designTokensCSS}
    >
      <style>{`
        /* Card container */
        .minimal-upsell {
          background: ${bgColor};
          color: ${textColor};
          width: 100%;
          max-width: 512px;
          overflow: hidden;
          border-radius: ${borderRadius}px;
        }

        /* ===== MOBILE-FIRST: Start with vertical (column) layout ===== */
        .minimal-upsell-row {
          display: flex;
          flex-direction: column;
        }

        /* Image section - full width on mobile */
        .minimal-upsell-image {
          position: relative;
          width: 100%;
          height: 128px;
          flex-shrink: 0;
          background: #f3f4f6;
        }
        .minimal-upsell-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .minimal-upsell-badge { position: absolute; top: 8px; left: 8px; padding: 2px 8px; font-size: 12px; font-weight: 500; border-radius: 4px; background: ${accentColor}; color: #fff; }

        /* Content section */
        .minimal-upsell-content { flex: 1; padding: 16px; display: flex; flex-direction: column; }

        .minimal-upsell-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
        .minimal-upsell-title { font-size: 16px; font-weight: 600; color: ${textColor}; margin: 0; }
        .minimal-upsell-desc { font-size: 12px; color: ${mutedColor}; margin: 4px 0 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        /* Close button */
        .minimal-upsell-close { flex-shrink: 0; padding: 6px; margin: -6px -6px 0 0; border: none; background: transparent; cursor: pointer; color: ${mutedColor}; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
        .minimal-upsell-close:hover { color: ${textColor}; }

        /* Footer with price and actions - stacked on mobile */
        .minimal-upsell-footer {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
          margin-top: 16px;
        }
        .minimal-upsell-price { display: flex; align-items: baseline; gap: 8px; justify-content: center; }
        .minimal-price-current { font-size: 18px; font-weight: 700; color: ${textColor}; }
        .minimal-price-compare { font-size: 14px; color: ${mutedColor}; text-decoration: line-through; }

        /* Action buttons */
        .minimal-upsell-actions { display: flex; align-items: center; gap: 8px; justify-content: center; }
        .minimal-upsell-skip { padding: 8px 12px; background: transparent; border: none; color: ${mutedColor}; font-size: 14px; cursor: pointer; transition: color 0.2s; }
        .minimal-upsell-skip:hover { color: ${textColor}; }
        .minimal-upsell-add { padding: 8px 16px; border-radius: 8px; background: ${config.buttonColor || accentColor}; color: ${config.buttonTextColor || "#fff"}; font-size: 14px; font-weight: 500; border: none; cursor: pointer; transition: opacity 0.2s; }
        .minimal-upsell-add:hover { opacity: 0.9; }
        .minimal-upsell-add:disabled { opacity: 0.6; cursor: not-allowed; }
        .minimal-upsell-add--success { background: #10b981; }

        /* ===== DESKTOP: Horizontal layout (image LEFT, content RIGHT) for wider viewports ===== */
        /* Uses PopupPortal's container query context */
        @container popup-viewport (min-width: 480px) {
          .minimal-upsell-row { flex-direction: row; }
          .minimal-upsell-image { width: 144px; height: auto; min-height: 120px; align-self: stretch; }
          .minimal-upsell-content { padding: 16px 20px; }
          .minimal-upsell-footer { flex-direction: row; align-items: center; justify-content: space-between; }
          .minimal-upsell-price { justify-content: flex-start; }
          .minimal-upsell-actions { justify-content: flex-end; }
        }

        /* Fallback media query for storefront (768px matches Tailwind's md: breakpoint) */
        @media (min-width: 768px) {
          .minimal-upsell-row { flex-direction: row; }
          .minimal-upsell-image { width: 144px; height: auto; min-height: 120px; align-self: stretch; }
          .minimal-upsell-content { padding: 16px 20px; }
          .minimal-upsell-footer { flex-direction: row; align-items: center; justify-content: space-between; }
          .minimal-upsell-price { justify-content: flex-start; }
          .minimal-upsell-actions { justify-content: flex-end; }
        }
      `}</style>

      <div className="minimal-upsell">
        <div className="minimal-upsell-row">
          {config.showImages !== false && product.imageUrl && (
            <div className="minimal-upsell-image">
              <img src={product.imageUrl} alt={product.title} />
              {product.savingsPercent && (
                <div className="minimal-upsell-badge">{product.savingsPercent}% OFF</div>
              )}
            </div>
          )}

          <div className="minimal-upsell-content">
            <div className="minimal-upsell-header">
              <div>
                <h3 className="minimal-upsell-title">{product.title}</h3>
                {product.description && (
                  <p className="minimal-upsell-desc">{product.description}</p>
                )}
              </div>
              <button className="minimal-upsell-close" onClick={onClose} aria-label="Close">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="minimal-upsell-footer">
              <div className="minimal-upsell-price">
                <span className="minimal-price-current">
                  {formatCurrency(product.price, config.currency)}
                </span>
                {product.compareAtPrice && (
                  <span className="minimal-price-compare">
                    {formatCurrency(product.compareAtPrice, config.currency)}
                  </span>
                )}
              </div>
              <div className="minimal-upsell-actions">
                <button className="minimal-upsell-skip" onClick={onClose}>
                  Skip
                </button>
                <button
                  className={`minimal-upsell-add ${addedSuccess ? "minimal-upsell-add--success" : ""}`}
                  onClick={handleAddToCart}
                  disabled={isLoading || addedSuccess}
                >
                  {addedSuccess ? "✓" : isLoading ? "..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};
