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
import { BasePopup } from './BasePopup';
import type { PopupDesignConfig, Product } from './types';
import type { ProductUpsellContent } from '~/domains/campaigns/types/campaign';
import { formatCurrency } from './utils';

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
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const products = useMemo(() => propProducts || config.products || [], [propProducts, config.products]);
  const displayProducts = useMemo(
    () => (config.maxProducts ? products.slice(0, config.maxProducts) : products),
    [config.maxProducts, products]
  );

  // Animate content in
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

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
  const handlePrevSlide = useCallback(() => {
    if (displayProducts.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + displayProducts.length) % displayProducts.length);
  }, [displayProducts.length]);

  const handleNextSlide = useCallback(() => {
    if (displayProducts.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % displayProducts.length);
  }, [displayProducts.length]);


  }, [config.multiSelect]);

  const handleAddToCart = useCallback(async () => {
    if (selectedProducts.size === 0) return;

    setIsLoading(true);
    try {
      if (config.previewMode) {
        // Preview mode - simulate success
        await new Promise(resolve => setTimeout(resolve, 1500));
        onClose();
      } else if (onAddToCart) {
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
  }, [selectedProducts, onAddToCart, onClose, config.previewMode]);

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

  const calculateSavings = useCallback(() => {
    if (!config.bundleDiscount || selectedProducts.size < 2) return null;

    const total = calculateTotal();
    const savings = total * (config.bundleDiscount / 100);
    return savings;
  }, [selectedProducts, config.bundleDiscount, calculateTotal]);

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
    const savings = calculateSavings();
    return savings ? total - savings : total;
  }, [calculateTotal, calculateSavings]);

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

  const renderProduct = (product: Product, index: number) => {
    const isSelected = selectedProducts.has(product.id);
    const isHovered = hoveredProduct === product.id;

    const cardStyles: React.CSSProperties = {
      border: `2px solid ${isSelected ? accentColor : config.inputBorderColor || '#E5E7EB'}`,
      borderRadius: `${borderRadius}px`,
      padding: '0',
      cursor: 'pointer',
      transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      backgroundColor: config.backgroundColor || '#FFFFFF',
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
    const columns = config.columns || 2;

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(columns, displayProducts.length)}, 1fr)`,
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
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 360,
            padding: '24px 40px',
            gap: '32px',
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
            style={{
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
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
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  border: `2px solid ${
                    isSelected ? accentColor : config.inputBorderColor || '#E5E7EB'
                  }`,
                  borderRadius: borderRadius,
                  padding: '12px 16px',
                  backgroundColor: config.backgroundColor || '#FFFFFF',
                }}
              >
                {config.showImages !== false && product.imageUrl && (
                  <div
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
      <div style={getGridStyles()}>
        {displayProducts.map((product, index) => renderProduct(product, index))}
      </div>
    );
  };



  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: '16px 24px',
    fontSize: '16px',
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
    gap: '10px'
  };

  const savings = calculateSavings();
  const total = calculateTotal();
  const discountedTotal = calculateDiscountedTotal();

  return (
    <BasePopup config={config} isVisible={isVisible} onClose={onClose}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(10px)',
        transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}>
        {/* Header */}
        <div
          style={{
            padding: '48px 32px 32px',
            textAlign: 'center',
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          <h2
            style={{
              fontSize: '30px',
              fontWeight: 800,
              margin: '0 0 8px 0',
              lineHeight: 1.2,
              color: textColor,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            {config.headline}
          </h2>
          {config.subheadline && (
            <p
              style={{
                fontSize: '16px',
                margin: 0,
                color: textColor,
                opacity: 0.7,
                lineHeight: 1.5,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              {config.subheadline}
            </p>
          )}
        </div>

        {/* Bundle discount banner */}
        {config.bundleDiscount && selectedProducts.size >= 2 && (
          <div style={{
            padding: '20px',
            background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}10 100%)`,
            borderRadius: `${borderRadius}px`,
            border: `2px solid ${accentColor}30`,
            textAlign: 'center',
            animation: 'slideIn 0.4s ease-out'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: config.textColor || '#374151',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              🎉 Bundle Deal Active
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: accentColor,
              marginBottom: '4px'
            }}>
              {config.bundleDiscountText || `Save ${config.bundleDiscount}% Together!`}
            </div>
            {savings && (
              <div style={{
                fontSize: '24px',
                fontWeight: 800,
                color: config.successColor || accentColor || '#10B981',
                marginTop: '8px'
              }}>
                -{formatCurrency(savings, config.currency)} off
              </div>
            )}
          </div>
        )}

        {/* Products grid / layout */}
        {renderProductsSection()}

        {/* Selection summary */}
        {selectedProducts.size > 0 && (
          <div
            style={{
              padding: '24px 32px',
              background: secondaryColor,
              borderTop: `2px solid ${borderColor}`,
              marginTop: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: savings ? '12px' : '0',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: textColor,
                    opacity: 0.7,
                    marginBottom: '4px',
                  }}
                >
                  {selectedProducts.size} item{selectedProducts.size !== 1 ? 's' : ''} selected
                </div>
                {savings && (
                  <div style={{
                    fontSize: '12px',
                    color: config.successColor || accentColor || '#10B981',
                    fontWeight: 600
                  }}>
                    You save {formatCurrency(savings, config.currency)}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                {savings && (
                  <div style={{
                    fontSize: '14px',
                    textDecoration: 'line-through',
                    color: config.textColor || '#9CA3AF',
                    fontWeight: 500
                  }}>
                    {formatCurrency(total, config.currency)}
                  </div>
                )}
                <div style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: config.textColor || '#111827'
                }}>
                  {formatCurrency(discountedTotal, config.currency)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA button */}
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
            e.currentTarget.style.boxShadow = selectedProducts.size > 0 ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none';
          }}
        >
          {isLoading ? (
            <>
              <span style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#FFF',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
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

        {/* Secondary CTA */}
        {config.secondaryCtaLabel && (
          <button
            onClick={onClose}
            style={{
              ...buttonStyles,
              backgroundColor: 'transparent',
              color: config.textColor || '#6B7280',
              border: `2px solid ${config.inputBorderColor || '#E5E7EB'}`,
              boxShadow: 'none',
              opacity: 1
            }}
          >
            {config.secondaryCtaLabel}
          </button>
        )}
      </div>

      {/* Keyframe animations */}
      <style>{`
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
    </BasePopup>
  );
};
