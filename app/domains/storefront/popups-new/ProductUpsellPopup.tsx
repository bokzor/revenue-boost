/**
 * ProductUpsellPopup Component - Enhanced Design
 *
 * A premium product upsell/cross-sell popup optimized for Shopify stores with:
 * - Modern, polished design with smooth animations
 * - Multiple product display (grid/carousel/card layouts)
 * - Enhanced product cards with hover effects
 * - Product images with zoom on hover
 * - Multi-select capability with visual feedback
 * - Add to cart functionality with loading states
 * - Product ratings and reviews
 * - Bundle discount display with savings calculator
 * - Responsive layouts
 * - Beautiful by default, fully customizable
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { PopupPortal } from './PopupPortal';
import type { PopupDesignConfig, Product } from './types';
import type { ProductUpsellContent } from '~/domains/campaigns/types/campaign';
import { formatCurrency, getSizeDimensions } from './utils';
import { POPUP_SPACING, getContainerPadding, SPACING_GUIDELINES } from './spacing';

// Import custom hooks
import { usePopupAnimation } from './hooks';

/**
 * ProductUpsellConfig - Extends both design config AND campaign content type
 * All content fields come from ProductUpsellContent
 * All design fields come from PopupDesignConfig
 */
export interface ProductUpsellConfig extends PopupDesignConfig, ProductUpsellContent {
  // Storefront-specific fields only
  products?: Product[];
  animationDuration?: number;
  imageAspectRatio?: 'square' | 'portrait' | 'landscape';
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
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const products = useMemo(() => propProducts || config.products || [], [propProducts, config.products]);
  const displayProducts = useMemo(
    () => (config.maxProducts ? products.slice(0, config.maxProducts) : products),
    [config.maxProducts, products]
  );

  const handleProductSelect = useCallback((productId: string) => {
    if (config.multiSelect) {
      setSelectedProducts(prev => {
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
  }, [config.multiSelect]);

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
      console.error('Add to cart error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProducts, onAddToCart, onClose]);

  const calculateTotal = useCallback(() => {
    let total = 0;
    selectedProducts.forEach(id => {
      const product = products.find(p => p.id === id);
      if (product) {
        total += parseFloat(product.price);
      }
    });
    return total;
  }, [selectedProducts, products]);

  // Calculate original total (using compare-at prices if available)
  const calculateOriginalTotal = useCallback(() => {
    let total = 0;
    selectedProducts.forEach(id => {
      const product = products.find(p => p.id === id);
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
    selectedProducts.forEach(id => {
      const product = products.find(p => p.id === id);
      if (product && product.compareAtPrice) {
        const price = parseFloat(product.price);
        const compareAt = parseFloat(product.compareAtPrice);
        if (compareAt > price) {
          savings += (compareAt - price);
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

  // Keep scroll focus inside the upsell content when possible
  const handleContentWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const container = event.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const deltaY = event.deltaY;

      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      // If the content can still scroll in this direction, handle it here and
      // stop the event from bubbling up to parent scroll containers (like
      // the admin preview frame or page).
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) {
        event.stopPropagation();
      }
    },
    [],
  );

  const handlePrevSlide = useCallback(() => {
    if (displayProducts.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + displayProducts.length) % displayProducts.length);
  }, [displayProducts.length]);

  const handleNextSlide = useCallback(() => {
    if (displayProducts.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % displayProducts.length);
  }, [displayProducts.length]);

  const handleGoToSlide = useCallback((index: number) => {
    if (index < 0 || index >= displayProducts.length) return;
    setCurrentSlide(index);
  }, [displayProducts.length]);



  // Enhanced default colors and settings
  const accentColor = config.accentColor || config.buttonColor || '#6366F1';
  const borderRadius = typeof config.borderRadius === 'string'
    ? parseFloat(config.borderRadius) || 12
    : (config.borderRadius ?? 12);
  const animDuration = config.animationDuration ?? 300;
  const imageHeight = config.imageAspectRatio === 'portrait' ? '280px'
    : config.imageAspectRatio === 'landscape' ? '180px'
      : '240px';
  const textColor = config.textColor || '#111827';
  const secondaryColor = config.inputBackgroundColor || '#F3F4F6';
  const borderColor = config.inputBorderColor || 'rgba(148, 163, 184, 0.5)';
  const baseBackground = config.backgroundColor || '#FFFFFF';
  const backgroundStyles: React.CSSProperties =
    baseBackground.startsWith('linear-gradient(')
      ? { backgroundImage: baseBackground, backgroundColor: 'transparent' }
      : { backgroundColor: baseBackground };

  const { width: sizeWidth, maxWidth: sizeMaxWidth } = getSizeDimensions(config.size || 'medium', config.previewMode);


  const renderProduct = (product: Product, index: number) => {
    const isSelected = selectedProducts.has(product.id);
    const isHovered = hoveredProduct === product.id;

    const cardStyles: React.CSSProperties = {
      border: `2px solid ${isSelected ? accentColor : config.inputBorderColor || '#E5E7EB'}`,
      borderRadius: `${borderRadius}px`,
      padding: '0',
      cursor: 'pointer',
      transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      ...backgroundStyles,
      boxShadow: isSelected
        ? `0 8px 24px ${accentColor}30, 0 0 0 3px ${accentColor}15`
        : isHovered
          ? '0 8px 24px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.08)',
      transform: isSelected ? 'scale(1.02)' : isHovered ? 'translateY(-4px)' : 'translateY(0)',
      overflow: 'hidden',
      opacity: showContent ? 1 : 0,
      animation: showContent ? `fadeInUp 0.5s ease-out ${index * 0.1}s both` : 'none',
      position: 'relative',
    };

    return (
      <div
        key={product.id}
        style={cardStyles}
        onClick={() => {
          handleProductSelect(product.id);
          if (onProductClick) {
            onProductClick(product);
          }
        }}
        onMouseEnter={() => setHoveredProduct(product.id)}
        onMouseLeave={() => setHoveredProduct(null)}
      >
        {/* Selection checkmark badge */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: accentColor,
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 700,
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            animation: 'bounceIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          }}>
            ✓
          </div>
        )}

        {/* Product image */}
        {config.showImages !== false && product.imageUrl && (
          <div style={{
            width: '100%',
            height: imageHeight,
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#F9FAFB'
          }}>
            <img
              src={product.imageUrl}
              alt={product.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: `transform ${animDuration}ms ease-out`,
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              }}
            />
            {/* Overlay on hover */}
            {isHovered && !isSelected && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.05)',
                transition: `opacity ${animDuration}ms`,
              }} />
            )}
          </div>
        )}

        {/* Product details */}
        <div style={{ padding: '16px' }}>
          {/* Product title */}
          <h3 style={{
            fontSize: '16px',
            fontWeight: 700,
            margin: '0 0 8px 0',
            lineHeight: 1.4,
            color: config.textColor || '#111827',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}>
            {product.title}
          </h3>

          {/* Rating */}
          {config.showRatings && product.rating && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px'
            }}>
              <div style={{ color: '#F59E0B', fontSize: '14px', lineHeight: 1 }}>
                {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
              </div>
              {config.showReviewCount && product.reviewCount && (
                <span style={{
                  fontSize: '13px',
                  color: config.textColor || '#6B7280',
                  fontWeight: 500
                }}>
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          {config.showPrices !== false && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <span style={{
                fontSize: '20px',
                fontWeight: 800,
                color: config.textColor || '#111827',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}>
                {formatCurrency(product.price, config.currency)}
              </span>
              {config.showCompareAtPrice && product.compareAtPrice && (
                <>
                  <span style={{
                    fontSize: '15px',
                    textDecoration: 'line-through',
                    color: config.textColor || '#9CA3AF',
                    fontWeight: 500
                  }}>
                    {formatCurrency(product.compareAtPrice, config.currency)}
                  </span>
                  {getSavingsPercent(product) !== null && (
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: config.buttonTextColor || '#FFFFFF',
                      backgroundColor: config.accentColor || config.buttonColor || '#EF4444',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      SAVE {getSavingsPercent(product)}%
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Selection button */}
          <div style={{
            marginTop: '14px',
            padding: '10px 16px',
            backgroundColor: isSelected
              ? accentColor
              : config.inputBackgroundColor || '#F3F4F6',
            color: isSelected ? '#FFFFFF' : config.textColor || '#374151',
            borderRadius: `${borderRadius - 4}px`,
            fontSize: '14px',
            fontWeight: 700,
            textAlign: 'center',
            transition: `all ${animDuration}ms`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            {isSelected ? (
              <>
                <span>✓</span> Selected
              </>
            ) : (
              <>
                {config.showAddIcon !== false && <span>+</span>}
                {config.multiSelect ? 'Add to Bundle' : 'Select'}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getGridStyles = (): React.CSSProperties => {
    return {
      display: 'grid',
      gap: '16px',
      marginBottom: '24px',
    };
  };

  const renderProductsSection = (): React.ReactNode => {
    if (displayProducts.length === 0) {
      return (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: config.textColor || '#9CA3AF',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <p>No products available</p>
        </div>
      );
    }

    if (config.layout === 'carousel') {
      const product = displayProducts[Math.min(currentSlide, displayProducts.length - 1)];
      const isSelected = selectedProducts.has(product.id);
      const savingsPercent = getSavingsPercent(product);

      return (
        <div
          className="upsell-carousel-container"
          style={{
            position: 'relative',
          }}
        >
          {/* Previous button */}
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Previous product"
            style={{
              borderRadius: '9999px',
              border: `1px solid ${config.inputBorderColor || '#E5E7EB'}`,
              backgroundColor: config.inputBackgroundColor || '#F3F4F6',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18 }}>‹</span>
          </button>

          {/* Main carousel product */}
          <div
            className="upsell-carousel-product"
            style={{
              width: '100%',
              maxWidth: 720,
            }}
          >
            {config.showImages !== false && product.imageUrl && (
              <div
                style={{
                  flex: 1,
                  maxWidth: 280,
                  aspectRatio: '1 / 1',
                  borderRadius: 16,
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#F9FAFB',
                }}
              >
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {savingsPercent !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      padding: '4px 10px',
                      borderRadius: 9999,
                      backgroundColor: config.accentColor || config.buttonColor || '#22C55E',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    SAVE {savingsPercent}%
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  color: config.textColor || '#111827',
                }}
              >
                {product.title}
              </h3>

              {config.showRatings && product.rating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: '#F59E0B', fontSize: 14 }}>
                    {'★'.repeat(Math.floor(product.rating))}
                    {'☆'.repeat(5 - Math.floor(product.rating))}
                  </div>
                  {config.showReviewCount && product.reviewCount && (
                    <span
                      style={{
                        fontSize: 13,
                        color: config.textColor || '#6B7280',
                      }}
                    >
                      ({product.reviewCount})
                    </span>
                  )}
                </div>
              )}

              {config.showPrices !== false && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: config.textColor || '#111827',
                    }}
                  >
                    {formatCurrency(product.price, config.currency)}
                  </span>
                  {config.showCompareAtPrice && product.compareAtPrice && (
                    <span
                      style={{
                        fontSize: 14,
                        textDecoration: 'line-through',
                        color: config.textColor || '#9CA3AF',
                      }}
                    >
                      {formatCurrency(product.compareAtPrice, config.currency)}
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleProductSelect(product.id)}
                style={{
                  marginTop: 8,
                  padding: '10px 18px',
                  borderRadius: 9999,
                  border: `2px solid ${accentColor}`,
                  backgroundColor: isSelected ? accentColor : 'transparent',
                  color: isSelected ? '#FFFFFF' : accentColor,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {isSelected ? 'Selected' : 'Select Product'}
              </button>
            </div>
          </div>

          {/* Next button */}
          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Next product"
            style={{
              borderRadius: '9999px',
              border: `1px solid ${config.inputBorderColor || '#E5E7EB'}`,
              backgroundColor: config.inputBackgroundColor || '#F3F4F6',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18 }}>›</span>
          </button>

          {/* Dots */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 6,
            }}
          >
            {displayProducts.map((p, index) => (
              <button
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                type="button"
                onClick={() => handleGoToSlide(index)}
                style={{
                  width: index === currentSlide ? 18 : 8,
                  height: 8,
                  borderRadius: 9999,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  backgroundColor:
                    index === currentSlide
                      ? accentColor
                      : config.inputBorderColor || '#E5E7EB',
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (config.layout === 'card') {
      return (
        <div
          className="upsell-cards-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {displayProducts.map((product) => {
            const isSelected = selectedProducts.has(product.id);
            const savingsPercent = getSavingsPercent(product);

            return (
              <div
                key={product.id}
                className="upsell-card"
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  border: `2px solid ${isSelected ? accentColor : config.inputBorderColor || '#E5E7EB'
                    }`,
                  borderRadius: borderRadius,
                  padding: '12px 16px',
                  ...backgroundStyles,
                }}
              >
                {config.showImages !== false && product.imageUrl && (
                  <div
                    className="upsell-card-image-wrapper"
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 12,
                      overflow: 'hidden',
                      position: 'relative',
                      backgroundColor: '#F9FAFB',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {savingsPercent !== null && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          backgroundColor:
                            config.accentColor || config.buttonColor || '#22C55E',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        SAVE {savingsPercent}%
                      </div>
                    )}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      margin: 0,
                      marginBottom: 4,
                      color: config.textColor || '#111827',
                    }}
                  >
                    {product.title}
                  </h3>

                  {config.showRatings && product.rating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ color: '#F59E0B', fontSize: 14 }}>
                        {'★'.repeat(Math.floor(product.rating))}
                        {'☆'.repeat(5 - Math.floor(product.rating))}
                      </div>
                      {config.showReviewCount && product.reviewCount && (
                        <span
                          style={{
                            fontSize: 13,
                            color: config.textColor || '#6B7280',
                          }}
                        >
                          ({product.reviewCount})
                        </span>
                      )}
                    </div>
                  )}

                  {config.showPrices !== false && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: config.textColor || '#111827',
                        }}
                      >
                        {formatCurrency(product.price, config.currency)}
                      </span>
                      {config.showCompareAtPrice && product.compareAtPrice && (
                        <span
                          style={{
                            fontSize: 14,
                            textDecoration: 'line-through',
                            color: config.textColor || '#9CA3AF',
                          }}
                        >
                          {formatCurrency(product.compareAtPrice, config.currency)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="upsell-card-action-btn"
                  onClick={() => handleProductSelect(product.id)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 9999,
                    border: `2px solid ${accentColor}`,
                    backgroundColor: isSelected ? accentColor : 'transparent',
                    color: isSelected ? '#FFFFFF' : accentColor,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isSelected ? 'Added' : 'Add'}
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
        className="upsell-products-grid"
        style={{
          ...getGridStyles(),
          // Use CSS variable for configured columns (don't limit by product count)
          '--upsell-columns': config.columns || 2,
        } as React.CSSProperties}
      >
        {displayProducts.map((product, index) => renderProduct(product, index))}
      </div>
    );
  };



  const buttonStyles: React.CSSProperties = {
    flex: 1,
    padding: '10px 14px',
    fontSize: '14px',
    fontWeight: 700,
    border: 'none',
    borderRadius: `${borderRadius}px`,
    backgroundColor: config.buttonColor || '#6366F1',
    color: config.buttonTextColor || '#FFFFFF',
    cursor: selectedProducts.size === 0 || isLoading ? 'not-allowed' : 'pointer',
    opacity: selectedProducts.size === 0 || isLoading ? 0.5 : 1,
    transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    boxShadow: selectedProducts.size > 0 && !isLoading ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const savings = calculateTotalSavings();
  const total = calculateTotal();
  const discountedTotal = calculateDiscountedTotal();

  const popupConfig = {
    ...config,
    padding: 0,
    maxWidth: config.maxWidth || sizeMaxWidth || '56rem',
  };

  // Auto-close timer (migrated from BasePopup)
  useEffect(() => {
    if (!isVisible || !popupConfig.autoCloseDelay || popupConfig.autoCloseDelay <= 0) return;

    const timer = setTimeout(onClose, popupConfig.autoCloseDelay * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, popupConfig.autoCloseDelay, onClose]);


  if (!isVisible) return null;

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: popupConfig.overlayColor || 'rgba(0, 0, 0, 1)',
        opacity: popupConfig.overlayOpacity ?? 0.6,
        blur: 4,
      }}
      animation={{
        type: popupConfig.animation || 'fade',
      }}
      position={popupConfig.position || 'center'}
      closeOnEscape={popupConfig.closeOnEscape !== false}
      closeOnBackdropClick={popupConfig.closeOnOverlayClick !== false}
      previewMode={popupConfig.previewMode}
      ariaLabel={popupConfig.ariaLabel || popupConfig.headline}
      ariaDescribedBy={popupConfig.ariaDescribedBy}
    >
      <div
        className="upsell-container"
        data-splitpop="true"
        data-template="product-upsell"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(10px)',
          transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          ...backgroundStyles,
          borderRadius: `${borderRadius}px`,
          // Expose design tokens as CSS variables so css can mirror the mock precisely
          '--upsell-bg': baseBackground,
          '--upsell-text': textColor,
          '--upsell-primary': accentColor,
          '--upsell-secondary': secondaryColor,
          '--upsell-accent': accentColor,
          '--upsell-border': borderColor,
          '--upsell-success': config.successColor || accentColor || '#10B981',
          '--upsell-badge': accentColor,
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="upsell-header">
          <h2 className="upsell-headline">
            {config.headline}
          </h2>
          {config.subheadline && (
            <p className="upsell-subheadline">
              {config.subheadline}
            </p>
          )}
        </div>

        {/* Bundle discount banner */}
        {config.bundleDiscount && config.bundleDiscount > 0 && (
          <div className="upsell-bundle-banner">
            ✨ {config.bundleDiscountText || `Save ${config.bundleDiscount}% when you bundle!`}
          </div>
        )}

        {/* Products grid / layout */}
        <div className="upsell-content" onWheel={handleContentWheel}>
          {renderProductsSection()}
        </div>

        {/* Footer: selection summary + actions */}
        <div className="upsell-footer">
          {selectedProducts.size > 0 && (() => {
            const total = calculateTotal();
            const originalTotal = calculateOriginalTotal();
            const compareAtSavings = calculateCompareAtSavings();
            const bundleSavings = calculateBundleSavings();
            const totalSavings = calculateTotalSavings();
            const discountedTotal = calculateDiscountedTotal();
            const hasCompareAtSavings = compareAtSavings && compareAtSavings > 0;
            const hasBundleSavings = bundleSavings && bundleSavings > 0;

            return (
              <div className="upsell-summary">
                {/* Item count */}
                <div className="upsell-summary-row">
                  <span className="upsell-summary-label">
                    {selectedProducts.size} item{selectedProducts.size !== 1 ? 's' : ''} selected
                  </span>
                  {hasCompareAtSavings && (
                    <span className="upsell-summary-value upsell-summary-original">
                      {formatCurrency(originalTotal, config.currency)}
                    </span>
                  )}
                </div>

                {/* Subtotal (current prices before bundle discount) */}
                {hasCompareAtSavings && (
                  <div className="upsell-summary-row" style={{ fontSize: '14px', opacity: 0.8 }}>
                    <span>Subtotal</span>
                    <span>{formatCurrency(total, config.currency)}</span>
                  </div>
                )}

                {/* Bundle discount line */}
                {hasBundleSavings && (
                  <div className="upsell-summary-row" style={{ fontSize: '14px', color: accentColor }}>
                    <span>Bundle Discount ({config.bundleDiscount}%)</span>
                    <span>-{formatCurrency(bundleSavings, config.currency)}</span>
                  </div>
                )}

                {/* Total */}
                <div className="upsell-summary-row upsell-summary-total">
                  <span>Total</span>
                  <span>{formatCurrency(discountedTotal, config.currency)}</span>
                </div>

                {/* Total savings breakdown */}
                {totalSavings && totalSavings > 0 && (
                  <div className="upsell-summary-row">
                    <span className="upsell-summary-savings">
                      {hasCompareAtSavings && hasBundleSavings ? (
                        <>
                          You save {formatCurrency(totalSavings, config.currency)}!
                          <span style={{ fontSize: '12px', display: 'block', opacity: 0.8, marginTop: '2px' }}>
                            ({formatCurrency(compareAtSavings, config.currency)} sale + {formatCurrency(bundleSavings, config.currency)} bundle)
                          </span>
                        </>
                      ) : (
                        <>You save {formatCurrency(totalSavings, config.currency)}!</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="upsell-actions">
            <button
              onClick={handleAddToCart}
              disabled={selectedProducts.size === 0 || isLoading}
              style={buttonStyles}
              onMouseEnter={(e) => {
                if (selectedProducts.size > 0 && !isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  selectedProducts.size > 0 ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none';
              }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#FFF',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Adding to Cart...
                </>
              ) : (
                <>
                  <span style={{ fontSize: '18px' }}>🛒</span>
                  {(() => {
                    const count = selectedProducts.size;
                    const baseLabel = config.buttonText || config.ctaText;

                    if (baseLabel) {
                      return baseLabel.includes('{count}')
                        ? baseLabel.replace('{count}', String(count || 0))
                        : baseLabel;
                    }

                    if (count > 0) {
                      return `Add ${count} to Cart`;
                    }

                    return 'Select Products';
                  })()}
                </>
              )}
            </button>

            <button
              onClick={onClose}
              style={{
                ...buttonStyles,
                backgroundColor: 'transparent',
                color: config.textColor || '#6B7280',
                border: `2px solid ${config.inputBorderColor || '#E5E7EB'}`,
                boxShadow: 'none',
                opacity: 0.9,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.9')}
            >
              {config.secondaryCtaLabel || config.dismissLabel || 'No thanks'}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe animations & responsive layout helpers */}
      <style>{`
        /* Layout and typography closely aligned with docs/mockup ProductUpsellPopup */
        .upsell-container {
          width: 100%;
          max-width: ${popupConfig.maxWidth || sizeMaxWidth || '56rem'};
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          max-height: 100%;
          /* Enable container queries for preview/device-based responsiveness */
          container-type: inline-size;
          container-name: upsell;
        }

        .upsell-header {
          padding: ${getContainerPadding(config.size)};
          padding-bottom: ${POPUP_SPACING.section.md};
          text-align: center;
          border-bottom: 1px solid var(--upsell-border, ${borderColor});
          flex-shrink: 0;
        }

        .upsell-headline {
          font-size: 1.875rem;
          font-weight: 900;
          line-height: 1.1;
          margin: 0 0 ${SPACING_GUIDELINES.afterHeadline} 0;
          color: var(--upsell-text, ${textColor});
        }

        .upsell-subheadline {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--upsell-text, ${textColor});
          opacity: 0.8;
          margin: 0;
        }

        .upsell-bundle-banner {
          background: var(--upsell-accent, ${accentColor});
          padding: 0.5rem 1rem;
          text-align: center;
          font-weight: 600;
          font-size: 0.8125rem;
          color: #FFFFFF;
          border-bottom: 1px solid var(--upsell-border, ${borderColor});
          flex-shrink: 0;
        }

        .upsell-content {
          flex: 1;
          overflow-y: auto;
          padding: ${POPUP_SPACING.section.lg} ${POPUP_SPACING.section.xl};
          min-height: 0;
        }

        .upsell-footer {
          border-top: 2px solid var(--upsell-border, ${borderColor});
          padding: ${POPUP_SPACING.section.lg} ${POPUP_SPACING.section.xl};
          background: var(--upsell-secondary, ${secondaryColor});
          flex-shrink: 0;
        }

        .upsell-actions {
          display: flex;
          gap: ${SPACING_GUIDELINES.betweenButtons};
          margin-top: ${POPUP_SPACING.section.md};
        }

        .upsell-summary {
          margin-bottom: ${POPUP_SPACING.section.md};
        }

        .upsell-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.375rem;
          font-size: 0.8125rem;
          color: var(--upsell-text, ${textColor});
        }

        .upsell-summary-label {
          opacity: 0.7;
        }

        .upsell-summary-value {
          font-weight: 600;
        }

        .upsell-summary-original {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .upsell-summary-total {
          font-size: 1.125rem;
          font-weight: 700;
          padding-top: 0.5rem;
          border-top: 1px solid var(--upsell-border, ${borderColor});
          margin-bottom: 0.375rem;
        }

        .upsell-summary-savings {
          color: var(--upsell-success, ${config.successColor || accentColor || '#10B981'});
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .upsell-products-grid {
          display: grid;
          /* Use auto-fit to only create columns for existing items */
          /* Minimum width ensures max columns = configured value */
          /* Formula: max(100% / columns, 180px) ensures items don't get too small */
          grid-template-columns: repeat(auto-fit, minmax(clamp(180px, calc(100% / var(--upsell-columns, 2)), 100%), 1fr));
          gap: ${POPUP_SPACING.gap.md};
          margin-bottom: ${SPACING_GUIDELINES.beforeCTA};
        }

        .upsell-carousel-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          padding: 1rem 3rem 2.5rem;
          gap: 1rem;
        }

        .upsell-carousel-product {
          display: flex;
          gap: 1rem;
          align-items: center;
          width: 100%;
          max-width: 720px;
        }

        .upsell-card {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .upsell-card-image-wrapper {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background-color: #F9FAFB;
          flex-shrink: 0;
        }

        .upsell-card-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Container query for preview/device-based responsiveness */
        @container upsell (max-width: 768px) {
          .upsell-header {
            padding: 1rem 1.25rem 0.75rem;
          }

          .upsell-headline {
            font-size: 1.25rem;
          }

          .upsell-subheadline {
            font-size: 0.75rem;
          }

          .upsell-content {
            padding: 1rem 1.25rem;
          }

          .upsell-footer {
            padding: 0.75rem 1.25rem;
          }

          .upsell-actions {
            gap: 0.5rem;
          }

          .upsell-products-grid {
            /* On mobile, use auto-fit with smaller minimum width */
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 0.875rem;
          }

          .upsell-carousel-container {
            padding: 0.75rem 2.5rem;
            min-height: 280px;
          }

          .upsell-carousel-product {
            flex-direction: column;
            text-align: center;
          }

          .upsell-card {
            flex-direction: column;
            align-items: stretch;
            padding: 1rem;
          }

          .upsell-card-image-wrapper {
            width: 100%;
            height: 150px;
          }

          .upsell-card-action-btn {
            align-self: stretch;
            margin-left: 0;
            margin-top: 0.5rem;
            justify-content: center;
          }
        }



        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </PopupPortal>
  );
};
