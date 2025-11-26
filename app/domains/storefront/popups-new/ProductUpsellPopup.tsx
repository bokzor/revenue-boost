/**
 * ProductUpsellPopup Component - Enhanced Design v2
 *
 * A premium product upsell/cross-sell popup optimized for Shopify stores with:
 * - Mobile-first responsive design using container queries
 * - Clean, uncluttered layout following e-commerce best practices
 * - Two layout modes: Grid (default) and List
 * - Touch-friendly interactions (48px+ tap targets)
 * - Multi-select capability with visual feedback
 * - Add to cart functionality with loading states
 * - Product ratings and reviews display
 * - Bundle discount display with savings calculator
 * - Beautiful by default, fully customizable
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig, Product } from "./types";
import type { ProductUpsellContent } from "~/domains/campaigns/types/campaign";
import { formatCurrency, getSizeDimensions } from "./utils";
import { PopupCloseButton } from "./components/shared";

// Import custom hooks
import { usePopupAnimation } from "./hooks";

/**
 * ProductUpsellConfig - Extends both design config AND campaign content type
 * All content fields come from ProductUpsellContent
 * All design fields come from PopupDesignConfig
 */
export interface ProductUpsellConfig extends PopupDesignConfig, ProductUpsellContent {
  // Storefront-specific fields only
  products?: Product[];
  animationDuration?: number;
  imageAspectRatio?: "square" | "portrait" | "landscape";
  showAddIcon?: boolean;

  // Note: headline, subheadline, layout, bundleDiscount, etc.
  // all come from ProductUpsellContent
}

export interface ProductUpsellPopupProps {
  config: ProductUpsellConfig;
  isVisible: boolean;
  onClose: () => void;
  products?: Product[];
  onAddToCart?: (productIds: string[]) => Promise<void>;
  onProductClick?: (product: Product) => void;
}

export const ProductUpsellPopup: React.FC<ProductUpsellPopupProps> = ({
  config,
  isVisible,
  onClose,
  products: propProducts,
  onAddToCart,
  onProductClick,
}) => {
  // Use animation hook
  const { showContent } = usePopupAnimation({
    isVisible,
    entryDelay: 50,
  });

  // Component-specific state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const products = useMemo(
    () => propProducts || config.products || [],
    [propProducts, config.products]
  );
  const displayProducts = useMemo(
    () => (config.maxProducts ? products.slice(0, config.maxProducts) : products),
    [config.maxProducts, products]
  );

  const handleProductSelect = useCallback(
    (productId: string, product?: Product) => {
      if (config.multiSelect) {
        setSelectedProducts((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(productId)) {
            newSet.delete(productId);
          } else {
            newSet.add(productId);
          }
          return newSet;
        });
      } else {
        setSelectedProducts(new Set([productId]));
      }
      if (product && onProductClick) {
        onProductClick(product);
      }
    },
    [config.multiSelect, onProductClick]
  );

  const handleAddToCart = useCallback(async () => {
    if (selectedProducts.size === 0) return;

    setIsLoading(true);
    try {
      if (onAddToCart) {
        await onAddToCart(Array.from(selectedProducts));
        onClose();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Add to cart error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProducts, onAddToCart, onClose]);

  const calculateTotal = useCallback(() => {
    let total = 0;
    selectedProducts.forEach((id) => {
      const product = products.find((p) => p.id === id);
      if (product) {
        total += parseFloat(product.price);
      }
    });
    return total;
  }, [selectedProducts, products]);

  // Calculate original total (using compare-at prices if available)
  const calculateOriginalTotal = useCallback(() => {
    let total = 0;
    selectedProducts.forEach((id) => {
      const product = products.find((p) => p.id === id);
      if (product) {
        const originalPrice = product.compareAtPrice
          ? parseFloat(product.compareAtPrice)
          : parseFloat(product.price);
        total += originalPrice;
      }
    });
    return total;
  }, [selectedProducts, products]);

  // Calculate savings from compare-at prices (individual product discounts)
  const calculateCompareAtSavings = useCallback(() => {
    let savings = 0;
    selectedProducts.forEach((id) => {
      const product = products.find((p) => p.id === id);
      if (product && product.compareAtPrice) {
        const price = parseFloat(product.price);
        const compareAt = parseFloat(product.compareAtPrice);
        if (compareAt > price) {
          savings += compareAt - price;
        }
      }
    });
    return savings > 0 ? savings : null;
  }, [selectedProducts, products]);

  // Calculate bundle discount (applied to current prices, not compare-at)
  const calculateBundleSavings = useCallback(() => {
    if (!config.bundleDiscount || selectedProducts.size < 2) return null;

    const total = calculateTotal();
    const savings = total * (config.bundleDiscount / 100);
    return savings;
  }, [selectedProducts, config.bundleDiscount, calculateTotal]);

  // Calculate total savings (compare-at + bundle)
  const calculateTotalSavings = useCallback(() => {
    const compareAtSavings = calculateCompareAtSavings() || 0;
    const bundleSavings = calculateBundleSavings() || 0;
    const total = compareAtSavings + bundleSavings;
    return total > 0 ? total : null;
  }, [calculateCompareAtSavings, calculateBundleSavings]);

  const getSavingsPercent = (product: Product): number | null => {
    if (product.savingsPercent != null) {
      return product.savingsPercent;
    }
    if (!product.compareAtPrice) return null;
    const price = parseFloat(product.price);
    const compare = parseFloat(product.compareAtPrice);
    if (!Number.isFinite(price) || !Number.isFinite(compare) || compare <= 0 || price >= compare) {
      return null;
    }
    return Math.round((1 - price / compare) * 100);
  };

  const calculateDiscountedTotal = useCallback(() => {
    const total = calculateTotal();
    const bundleSavings = calculateBundleSavings();
    return bundleSavings ? total - bundleSavings : total;
  }, [calculateTotal, calculateBundleSavings]);

  // Design tokens
  const accentColor = config.accentColor || config.buttonColor || "#6366F1";
  const borderRadius =
    typeof config.borderRadius === "string"
      ? parseFloat(config.borderRadius) || 12
      : (config.borderRadius ?? 12);
  const textColor = config.textColor || "#111827";
  const secondaryBg = config.inputBackgroundColor || "#F9FAFB";
  const borderColor = config.inputBorderColor || "#E5E7EB";
  const baseBackground = config.backgroundColor || "#FFFFFF";

  const { maxWidth: sizeMaxWidth } = getSizeDimensions(
    config.size || "medium",
    config.previewMode
  );

  // Render individual product card (grid layout)
  const renderProductCard = (product: Product, index: number) => {
    const isSelected = selectedProducts.has(product.id);
    const savingsPercent = getSavingsPercent(product);

    return (
      <div
        key={product.id}
        className={`upsell-product-card ${isSelected ? "upsell-product-card--selected" : ""}`}
        onClick={() => handleProductSelect(product.id, product)}
        style={{ animationDelay: `${index * 0.05}s` }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleProductSelect(product.id, product)}
        aria-pressed={isSelected}
      >
        {/* Selection badge */}
        {isSelected && (
          <div className="upsell-product-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}

        {/* Savings badge */}
        {savingsPercent !== null && (
          <div className="upsell-product-savings">-{savingsPercent}%</div>
        )}

        {/* Product image */}
        {config.showImages !== false && product.imageUrl && (
          <div className="upsell-product-image">
            <img src={product.imageUrl} alt={product.title} loading="lazy" />
          </div>
        )}

        {/* Product info */}
        <div className="upsell-product-info">
          <h3 className="upsell-product-title">{product.title}</h3>

          {/* Rating */}
          {config.showRatings && product.rating && (
            <div className="upsell-product-rating">
              <span className="upsell-rating-stars">
                {"★".repeat(Math.floor(product.rating))}
                {"☆".repeat(5 - Math.floor(product.rating))}
              </span>
              {config.showReviewCount && product.reviewCount && (
                <span className="upsell-rating-count">({product.reviewCount})</span>
              )}
            </div>
          )}

          {/* Price */}
          {config.showPrices !== false && (
            <div className="upsell-product-price">
              <span className="upsell-price-current">
                {formatCurrency(product.price, config.currency)}
              </span>
              {config.showCompareAtPrice && product.compareAtPrice && (
                <span className="upsell-price-compare">
                  {formatCurrency(product.compareAtPrice, config.currency)}
                </span>
              )}
            </div>
          )}

          {/* Select button */}
          <button
            type="button"
            className={`upsell-product-select ${isSelected ? "upsell-product-select--selected" : ""}`}
          >
            {isSelected ? (
              <><span className="upsell-select-icon">✓</span> Selected</>
            ) : (
              <><span className="upsell-select-icon">+</span> {config.multiSelect ? "Add" : "Select"}</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render products section based on layout
  const renderProductsSection = (): React.ReactNode => {
    if (displayProducts.length === 0) {
      return (
        <div className="upsell-empty">
          <span className="upsell-empty-icon">📦</span>
          <p>No products available</p>
        </div>
      );
    }

    // List layout (also used as fallback for deprecated "carousel" layout)
    if (config.layout === "card" || config.layout === "carousel") {
      return (
        <div className="upsell-list">
          {displayProducts.map((product) => {
            const isSelected = selectedProducts.has(product.id);
            const savingsPercent = getSavingsPercent(product);

            return (
              <div
                key={product.id}
                className={`upsell-list-item ${isSelected ? "upsell-list-item--selected" : ""}`}
                onClick={() => handleProductSelect(product.id, product)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleProductSelect(product.id, product)}
              >
                {config.showImages !== false && product.imageUrl && (
                  <div className="upsell-list-image">
                    <img src={product.imageUrl} alt={product.title} />
                    {savingsPercent !== null && (
                      <span className="upsell-list-savings">-{savingsPercent}%</span>
                    )}
                  </div>
                )}

                <div className="upsell-list-info">
                  <h3 className="upsell-list-title">{product.title}</h3>

                  {config.showRatings && product.rating && (
                    <div className="upsell-list-rating">
                      <span className="upsell-rating-stars">
                        {"★".repeat(Math.floor(product.rating))}
                        {"☆".repeat(5 - Math.floor(product.rating))}
                      </span>
                      {config.showReviewCount && product.reviewCount && (
                        <span className="upsell-rating-count">({product.reviewCount})</span>
                      )}
                    </div>
                  )}

                  {config.showPrices !== false && (
                    <div className="upsell-list-price">
                      <span className="upsell-price-current">
                        {formatCurrency(product.price, config.currency)}
                      </span>
                      {config.showCompareAtPrice && product.compareAtPrice && (
                        <span className="upsell-price-compare">
                          {formatCurrency(product.compareAtPrice, config.currency)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className={`upsell-list-action ${isSelected ? "upsell-list-action--selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductSelect(product.id, product);
                  }}
                >
                  {isSelected ? "✓" : "+"}
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    // Default grid layout
    return (
      <div
        className="upsell-grid"
        style={{ "--upsell-columns": config.columns || 2 } as React.CSSProperties}
      >
        {displayProducts.map((product, index) => renderProductCard(product, index))}
      </div>
    );
  };

  // Calculate values for summary
  const totalSavings = calculateTotalSavings();
  const discountedTotal = calculateDiscountedTotal();

  const popupMaxWidth = config.maxWidth || sizeMaxWidth || "56rem";

  // Auto-close timer
  useEffect(() => {
    if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;
    const timer = setTimeout(onClose, config.autoCloseDelay * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, config.autoCloseDelay, onClose]);

  if (!isVisible) return null;

  // Get CTA button label
  const getCtaLabel = () => {
    const count = selectedProducts.size;
    const baseLabel = config.buttonText || config.ctaText;

    if (baseLabel) {
      return baseLabel.includes("{count}")
        ? baseLabel.replace("{count}", String(count || 0))
        : baseLabel;
    }

    return count > 0 ? `Add ${count} to Cart` : "Select Products";
  };

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || "rgba(0, 0, 0, 0.6)",
        opacity: config.overlayOpacity ?? 0.6,
        blur: 4,
      }}
      animation={{ type: config.animation || "fade" }}
      position={config.position || "center"}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
    >
      <style>{`
        /* ===== BASE CONTAINER ===== */
        .upsell-popup {
          position: relative;
          width: 100%;
          max-width: ${popupMaxWidth};
          border-radius: ${borderRadius}px;
          overflow: hidden;
          background: ${baseBackground};
          color: ${textColor};
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          container-type: inline-size;
          container-name: upsell;

          /* CSS Custom Properties for theming */
          --upsell-accent: ${accentColor};
          --upsell-text: ${textColor};
          --upsell-text-muted: ${config.descriptionColor || "#6B7280"};
          --upsell-bg: ${baseBackground};
          --upsell-bg-secondary: ${secondaryBg};
          --upsell-border: ${borderColor};
          --upsell-radius: ${borderRadius}px;
          --upsell-success: ${config.successColor || "#10B981"};
        }

        /* ===== CLOSE BUTTON ===== */
        .upsell-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 10;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          cursor: pointer;
          color: var(--upsell-text-muted);
          transition: background 0.2s, color 0.2s;
        }
        .upsell-close:hover {
          background: rgba(0, 0, 0, 0.1);
          color: var(--upsell-text);
        }

        /* ===== HEADER ===== */
        .upsell-header {
          padding: 1.5rem 2rem 1rem;
          text-align: center;
          flex-shrink: 0;
        }
        .upsell-headline {
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 0 0 0.5rem;
          color: var(--upsell-text);
        }
        .upsell-subheadline {
          font-size: 0.9375rem;
          line-height: 1.5;
          color: var(--upsell-text-muted);
          margin: 0;
        }

        /* ===== BUNDLE BANNER ===== */
        .upsell-bundle-banner {
          background: var(--upsell-accent);
          color: #fff;
          padding: 0.625rem 1rem;
          text-align: center;
          font-size: 0.8125rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        /* ===== CONTENT AREA ===== */
        .upsell-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.5rem;
          min-height: 0;
        }

        /* ===== EMPTY STATE ===== */
        .upsell-empty {
          padding: 2.5rem 1rem;
          text-align: center;
          color: var(--upsell-text-muted);
        }
        .upsell-empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.75rem;
        }

        /* ===== GRID LAYOUT ===== */
        .upsell-grid {
          display: grid;
          grid-template-columns: repeat(var(--upsell-columns, 2), 1fr);
          gap: 1rem;
        }

        /* Product Card */
        .upsell-product-card {
          position: relative;
          border: 2px solid var(--upsell-border);
          border-radius: calc(var(--upsell-radius) - 2px);
          background: var(--upsell-bg);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          animation: fadeInUp 0.3s ease-out backwards;
        }
        .upsell-product-card:hover {
          border-color: var(--upsell-accent);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .upsell-product-card--selected {
          border-color: var(--upsell-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--upsell-accent) 20%, transparent);
        }

        .upsell-product-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          z-index: 5;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          background: var(--upsell-accent);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bounceIn 0.3s ease;
        }

        .upsell-product-savings {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          z-index: 5;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          background: #EF4444;
          color: #fff;
          font-size: 0.6875rem;
          font-weight: 700;
        }

        .upsell-product-image {
          aspect-ratio: 1;
          background: var(--upsell-bg-secondary);
          overflow: hidden;
        }
        .upsell-product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .upsell-product-card:hover .upsell-product-image img {
          transform: scale(1.05);
        }

        .upsell-product-info {
          padding: 0.875rem;
        }

        .upsell-product-title {
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.3;
          margin: 0 0 0.375rem;
          color: var(--upsell-text);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .upsell-product-rating,
        .upsell-carousel-rating,
        .upsell-list-rating {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.375rem;
        }
        .upsell-rating-stars {
          color: #F59E0B;
          font-size: 0.75rem;
          line-height: 1;
        }
        .upsell-rating-count {
          font-size: 0.6875rem;
          color: var(--upsell-text-muted);
        }

        .upsell-product-price,
        .upsell-carousel-price,
        .upsell-list-price {
          display: flex;
          align-items: baseline;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        .upsell-price-current {
          font-size: 1rem;
          font-weight: 700;
          color: var(--upsell-text);
        }
        .upsell-price-compare {
          font-size: 0.8125rem;
          color: var(--upsell-text-muted);
          text-decoration: line-through;
        }

        .upsell-product-select {
          width: 100%;
          margin-top: 0.75rem;
          padding: 0.625rem 0.75rem;
          border: none;
          border-radius: calc(var(--upsell-radius) - 4px);
          background: var(--upsell-bg-secondary);
          color: var(--upsell-text);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          transition: all 0.2s ease;
        }
        .upsell-product-select--selected {
          background: var(--upsell-accent);
          color: #fff;
        }
        .upsell-select-icon {
          font-size: 1rem;
        }

        /* ===== LIST LAYOUT ===== */
        .upsell-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .upsell-list-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem;
          border: 2px solid var(--upsell-border);
          border-radius: calc(var(--upsell-radius) - 2px);
          background: var(--upsell-bg);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .upsell-list-item:hover {
          border-color: var(--upsell-accent);
        }
        .upsell-list-item--selected {
          border-color: var(--upsell-accent);
          background: color-mix(in srgb, var(--upsell-accent) 5%, var(--upsell-bg));
        }

        .upsell-list-image {
          position: relative;
          flex-shrink: 0;
          width: 4.5rem;
          height: 4.5rem;
          border-radius: 0.5rem;
          overflow: hidden;
          background: var(--upsell-bg-secondary);
        }
        .upsell-list-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .upsell-list-savings {
          position: absolute;
          top: 0.25rem;
          left: 0.25rem;
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          background: #EF4444;
          color: #fff;
          font-size: 0.5625rem;
          font-weight: 700;
        }

        .upsell-list-info {
          flex: 1;
          min-width: 0;
        }
        .upsell-list-title {
          font-size: 0.9375rem;
          font-weight: 600;
          margin: 0 0 0.25rem;
          color: var(--upsell-text);
        }
        .upsell-list-price {
          margin-top: 0.25rem;
        }

        .upsell-list-action {
          flex-shrink: 0;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          border: 2px solid var(--upsell-accent);
          background: transparent;
          color: var(--upsell-accent);
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .upsell-list-action--selected {
          background: var(--upsell-accent);
          color: #fff;
        }

        /* ===== FOOTER ===== */
        .upsell-footer {
          border-top: 1px solid var(--upsell-border);
          padding: 1rem 1.5rem;
          background: var(--upsell-bg-secondary);
          flex-shrink: 0;
        }

        .upsell-summary {
          margin-bottom: 0.875rem;
        }
        .upsell-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
          color: var(--upsell-text);
        }
        .upsell-summary-row + .upsell-summary-row {
          margin-top: 0.25rem;
        }
        .upsell-summary-label {
          color: var(--upsell-text-muted);
        }
        .upsell-summary-original {
          text-decoration: line-through;
          opacity: 0.6;
        }
        .upsell-summary-total {
          font-size: 1rem;
          font-weight: 700;
          padding-top: 0.5rem;
          margin-top: 0.5rem;
          border-top: 1px solid var(--upsell-border);
        }
        .upsell-summary-savings {
          color: var(--upsell-success);
          font-weight: 600;
        }

        .upsell-actions {
          display: flex;
          gap: 0.75rem;
        }

        .upsell-cta {
          flex: 1;
          padding: 0.875rem 1rem;
          border: none;
          border-radius: calc(var(--upsell-radius) - 2px);
          background: var(--upsell-accent);
          color: #fff;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }
        .upsell-cta:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .upsell-cta:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .upsell-cta-icon {
          font-size: 1.125rem;
        }
        .upsell-cta-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .upsell-dismiss {
          flex: 1;
          padding: 0.875rem 1rem;
          border: 2px solid var(--upsell-border);
          border-radius: calc(var(--upsell-radius) - 2px);
          background: transparent;
          color: var(--upsell-text-muted);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .upsell-dismiss:hover {
          background: var(--upsell-bg-secondary);
          color: var(--upsell-text);
        }

        /* ===== ANIMATIONS ===== */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ===== RESPONSIVE - CONTAINER QUERIES ===== */
        @container upsell (max-width: 540px) {
          .upsell-header {
            padding: 1.25rem 1rem 0.75rem;
          }
          .upsell-headline {
            font-size: 1.25rem;
          }
          .upsell-subheadline {
            font-size: 0.8125rem;
          }

          .upsell-content {
            padding: 0.875rem 1rem;
          }

          .upsell-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }

          .upsell-product-info {
            padding: 0.625rem;
          }
          .upsell-product-title {
            font-size: 0.8125rem;
          }
          .upsell-price-current {
            font-size: 0.9375rem;
          }
          .upsell-product-select {
            padding: 0.5rem;
            font-size: 0.75rem;
          }

          /* List mobile */
          .upsell-list-item {
            padding: 0.625rem;
            gap: 0.625rem;
          }
          .upsell-list-image {
            width: 3.5rem;
            height: 3.5rem;
          }
          .upsell-list-title {
            font-size: 0.8125rem;
          }
          .upsell-list-action {
            width: 2rem;
            height: 2rem;
            font-size: 1rem;
          }

          .upsell-footer {
            padding: 0.875rem 1rem;
          }
          .upsell-actions {
            flex-direction: column;
            gap: 0.5rem;
          }
          .upsell-cta,
          .upsell-dismiss {
            width: 100%;
            padding: 0.75rem;
          }
        }

        @container upsell (max-width: 380px) {
          .upsell-grid {
            grid-template-columns: 1fr;
          }
          .upsell-product-image {
            aspect-ratio: 4/3;
          }
        }
      `}</style>

      <div
        className="upsell-popup"
        data-splitpop="true"
        data-template="product-upsell"
      >
        {/* Close button */}
        <PopupCloseButton
          onClose={onClose}
          color={textColor}
          size={18}
          className="upsell-close"
          position="custom"
        />

        {/* Header */}
        <div className="upsell-header">
          <h2 className="upsell-headline">{config.headline || "Complete Your Order"}</h2>
          {config.subheadline && (
            <p className="upsell-subheadline">{config.subheadline}</p>
          )}
        </div>

        {/* Bundle discount banner */}
        {config.bundleDiscount && config.bundleDiscount > 0 && (
          <div className="upsell-bundle-banner">
            ✨ {config.bundleDiscountText || `Save ${config.bundleDiscount}% when you bundle!`}
          </div>
        )}

        {/* Products */}
        <div className="upsell-content">
          {renderProductsSection()}
        </div>

        {/* Footer with summary and actions */}
        <div className="upsell-footer">
          {/* Summary */}
          {selectedProducts.size > 0 && (
            <div className="upsell-summary">
              <div className="upsell-summary-row">
                <span className="upsell-summary-label">
                  {selectedProducts.size} item{selectedProducts.size !== 1 ? "s" : ""} selected
                </span>
                {calculateCompareAtSavings() && (
                  <span className="upsell-summary-original">
                    {formatCurrency(calculateOriginalTotal(), config.currency)}
                  </span>
                )}
              </div>

              {calculateBundleSavings() && (
                <div className="upsell-summary-row" style={{ color: accentColor }}>
                  <span>Bundle discount ({config.bundleDiscount}%)</span>
                  <span>-{formatCurrency(calculateBundleSavings()!, config.currency)}</span>
                </div>
              )}

              <div className="upsell-summary-row upsell-summary-total">
                <span>Total</span>
                <span>{formatCurrency(discountedTotal, config.currency)}</span>
              </div>

              {totalSavings && totalSavings > 0 && (
                <div className="upsell-summary-row">
                  <span className="upsell-summary-savings">
                    You save {formatCurrency(totalSavings, config.currency)}!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="upsell-actions">
            <button
              type="button"
              className="upsell-cta"
              onClick={handleAddToCart}
              disabled={selectedProducts.size === 0 || isLoading}
              style={{
                background: config.buttonColor || accentColor,
                color: config.buttonTextColor || "#fff",
              }}
            >
              {isLoading ? (
                <><span className="upsell-cta-spinner" /> Adding...</>
              ) : (
                <><span className="upsell-cta-icon">🛒</span> {getCtaLabel()}</>
              )}
            </button>

            <button
              type="button"
              className="upsell-dismiss"
              onClick={onClose}
            >
              {config.secondaryCtaLabel || config.dismissLabel || "No thanks"}
            </button>
          </div>
        </div>
      </div>
    </PopupPortal>
  );
};
