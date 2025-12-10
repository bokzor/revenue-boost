/**
 * BundleDealPopup Component
 *
 * Multi-product bundle offer with combined savings.
 * Perfect for cross-sell bundles and combo deals.
 */

import React, { useState } from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig, Product } from "./types";
import type { BundleDealContent } from "~/domains/campaigns/types/campaign";
import { getAdaptiveMutedColor } from "./utils/utils";
import { ProductImage } from "./components/shared";

export interface BundleDealConfig extends PopupDesignConfig, BundleDealContent {
  products?: Product[];
}

export interface BundleDealPopupProps {
  config: BundleDealConfig;
  isVisible: boolean;
  onClose: () => void;
  products?: Product[];
  onAddToCart?: (productIds: string[]) => Promise<void>;
}

const formatCurrency = (amount: string | number, currency = "USD"): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(numAmount);
};

export const BundleDealPopup: React.FC<BundleDealPopupProps> = ({
  config,
  isVisible,
  onClose,
  products: propProducts,
  onAddToCart,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const products = propProducts || config.products || [];
  if (products.length === 0) return null;

  const [mainProduct, ...bundleProducts] = products;
  const bundleDiscountPercent = config.bundleDiscount || 15;

  const totalOriginal = products.reduce((sum, p) => {
    const compare = p.compareAtPrice ? parseFloat(p.compareAtPrice) : parseFloat(p.price);
    return sum + compare;
  }, 0);
  const totalSale = totalOriginal * (1 - bundleDiscountPercent / 100);

  const handleAddBundle = async () => {
    if (!onAddToCart || isLoading) return;
    setIsLoading(true);
    try {
      await onAddToCart(products.map(p => p.id));
      setAddedSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const accentColor = config.accentColor || config.buttonColor || "var(--rb-primary, #007BFF)";
  const textColor = config.textColor || "var(--rb-foreground, #1f2937)";
  const bgColor = config.backgroundColor || "var(--rb-background, #ffffff)";
  // Use adaptive muted color based on background for proper contrast
  const mutedColor = config.descriptionColor || getAdaptiveMutedColor(bgColor);
  const borderRadius = config.borderRadius || 16;

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{ color: config.overlayColor || "rgba(0,0,0,0.5)", opacity: config.overlayOpacity ?? 0.5, blur: 4 }}
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
        .bundle-upsell { background: ${bgColor}; color: ${textColor}; border-radius: ${borderRadius}px; width: 100%; max-width: 520px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        .bundle-header { position: sticky; top: 0; z-index: 5; background: ${config.buttonColor || accentColor}; padding: 16px 20px; text-align: center; }
        .bundle-header-close { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; transition: background 0.2s; }
        .bundle-header-close:hover { background: rgba(255,255,255,0.2); }
        .bundle-header-title { font-size: 18px; font-weight: 700; color: #fff; margin: 0; }
        .bundle-header-subtitle { font-size: 14px; color: rgba(255,255,255,0.8); margin: 4px 0 0; }
        .bundle-products { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
        .bundle-item { display: flex; align-items: center; gap: 16px; padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.03); }
        .bundle-item--main { border: 2px solid ${accentColor}20; background: ${accentColor}08; }
        .bundle-item-image { width: 64px; height: 64px; border-radius: 8px; background: #f3f4f6; overflow: hidden; flex-shrink: 0; }
        .bundle-item-image img { width: 100%; height: 100%; object-fit: cover; }
        .bundle-item-info { flex: 1; min-width: 0; }
        .bundle-item-label { font-size: 11px; color: ${mutedColor}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .bundle-item-badge { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 500; border-radius: 4px; background: ${accentColor}20; color: ${accentColor}; margin-bottom: 4px; }
        .bundle-item-title { font-size: 14px; font-weight: 500; color: ${textColor}; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bundle-item-prices { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
        .bundle-price-current { font-size: 14px; font-weight: 600; color: ${textColor}; }
        .bundle-price-compare { font-size: 12px; color: ${mutedColor}; text-decoration: line-through; }
        .bundle-plus { font-size: 18px; color: ${accentColor}; font-weight: 500; }
        .bundle-footer { position: sticky; bottom: 0; background: ${bgColor}; border-top: 1px solid rgba(0,0,0,0.08); padding: 16px 20px; }
        .bundle-total { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
        .bundle-total-label { font-size: 14px; color: ${mutedColor}; }
        .bundle-total-prices { text-align: right; }
        .bundle-total-sale { font-size: 24px; font-weight: 700; color: ${textColor}; }
        .bundle-total-original { margin-left: 8px; font-size: 14px; color: ${mutedColor}; text-decoration: line-through; }
        .bundle-actions { display: flex; flex-direction: column; gap: 8px; }
        .bundle-cta { width: 100%; padding: 14px 16px; border-radius: 12px; background: ${config.buttonColor || accentColor}; color: ${config.buttonTextColor || "#fff"}; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: opacity 0.2s; }
        .bundle-cta:hover { opacity: 0.9; }
        .bundle-cta:disabled { opacity: 0.6; cursor: not-allowed; }
        .bundle-cta--success { background: var(--rb-success, #10b981); }
        .bundle-decline { width: 100%; padding: 10px 16px; background: transparent; border: none; color: ${mutedColor}; font-size: 14px; cursor: pointer; transition: color 0.2s; }
        .bundle-decline:hover { color: ${textColor}; }

        /* ===== CONTAINER QUERY: Compact/Mobile (< 400px) - queries parent popup-viewport ===== */
        @container popup-viewport (max-width: 399px) {
          .bundle-header { padding: 12px 16px; }
          .bundle-header-title { font-size: 16px; }
          .bundle-header-subtitle { font-size: 12px; }
          .bundle-products { padding: 12px 16px; gap: 8px; }
          .bundle-item { gap: 12px; padding: 10px; }
          .bundle-item-image { width: 52px; height: 52px; }
          .bundle-item-title { font-size: 13px; }
          .bundle-footer { padding: 12px 16px; }
          .bundle-total-sale { font-size: 20px; }
          .bundle-cta { padding: 12px 14px; font-size: 13px; }
        }

        /* Fallback media query for storefront */
        @media (max-width: 399px) {
          .bundle-header { padding: 12px 16px; }
          .bundle-header-title { font-size: 16px; }
          .bundle-header-subtitle { font-size: 12px; }
          .bundle-products { padding: 12px 16px; gap: 8px; }
          .bundle-item { gap: 12px; padding: 10px; }
          .bundle-item-image { width: 52px; height: 52px; }
          .bundle-item-title { font-size: 13px; }
          .bundle-footer { padding: 12px 16px; }
          .bundle-total-sale { font-size: 20px; }
          .bundle-cta { padding: 12px 14px; font-size: 13px; }
        }
      `}</style>

      <div className="bundle-upsell">
        <div className="bundle-header">
          <button className="bundle-header-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <h3 className="bundle-header-title">{config.bundleHeaderText || `🎉 Bundle & Save ${bundleDiscountPercent}%`}</h3>
          <p className="bundle-header-subtitle">{config.bundleSubheaderText || "Complete your purchase with these items"}</p>
        </div>

        <div className="bundle-products">
          <div className="bundle-item bundle-item--main">
            <div className="bundle-item-image">
              <ProductImage
                src={mainProduct.imageUrl}
                alt={mainProduct.title}
                aspectRatio="auto"
                height="100%"
                priority={true}
              />
            </div>
            <div className="bundle-item-info">
              <p className="bundle-item-label">In your cart</p>
              <h4 className="bundle-item-title">{mainProduct.title}</h4>
              <p className="bundle-price-current">{formatCurrency(mainProduct.price, config.currency)}</p>
            </div>
            {bundleProducts.length > 0 && <div className="bundle-plus">+</div>}
          </div>

          {bundleProducts.map((product, index) => (
            <div key={product.id} className="bundle-item">
              <div className="bundle-item-image">
                <ProductImage
                  src={product.imageUrl}
                  alt={product.title}
                  aspectRatio="auto"
                  height="100%"
                  priority={index < 2}
                />
              </div>
              <div className="bundle-item-info">
                {product.savingsPercent && (
                  <span className="bundle-item-badge">{product.savingsPercent}% OFF</span>
                )}
                <h4 className="bundle-item-title">{product.title}</h4>
                <div className="bundle-item-prices">
                  <span className="bundle-price-current">{formatCurrency(product.price, config.currency)}</span>
                  {product.compareAtPrice && (
                    <span className="bundle-price-compare">{formatCurrency(product.compareAtPrice, config.currency)}</span>
                  )}
                </div>
              </div>
              {index < bundleProducts.length - 1 && <div className="bundle-plus">+</div>}
            </div>
          ))}
        </div>

        <div className="bundle-footer">
          <div className="bundle-total">
            <span className="bundle-total-label">Bundle Total:</span>
            <div className="bundle-total-prices">
              <span className="bundle-total-sale">{formatCurrency(totalSale.toFixed(2), config.currency)}</span>
              <span className="bundle-total-original">{formatCurrency(totalOriginal.toFixed(2), config.currency)}</span>
            </div>
          </div>
          <div className="bundle-actions">
            <button
              className={`bundle-cta ${addedSuccess ? "bundle-cta--success" : ""}`}
              onClick={handleAddBundle}
              disabled={isLoading || addedSuccess}
            >
              {addedSuccess ? "✓ Bundle Added!" : isLoading ? "Adding Bundle..." : "Add Bundle to Cart"}
            </button>
            <button className="bundle-decline" onClick={onClose}>
              {config.secondaryCtaLabel || "Just the original item"}
            </button>
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};

