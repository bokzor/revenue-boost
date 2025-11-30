/**
 * ProductUpsellPopup Component - Enhanced Design v3
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
 *
 * v3 Enhancements:
 * - 3D card hover effects with perspective tilt
 * - Animated selection glow ring and ripple effects
 * - Enhanced savings badges with pulse animations
 * - Real-time savings calculator with animations
 * - Add to cart success animations with particles
 * - Bundle banner with gradient shimmer
 * - Haptic feedback on mobile
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig, Product } from "./types";
import type { ProductUpsellContent } from "~/domains/campaigns/types/campaign";
import { formatCurrency, getSizeDimensions, prefersReducedMotion } from "./utils";
import { PopupCloseButton } from "./components/shared";

// Import custom hooks
import { usePopupAnimation } from "./hooks";

/**
 * Ripple effect state for card interactions
 */
interface RippleState {
  x: number;
  y: number;
  id: number;
}

/**
 * Extended layout types for ProductUpsell
 * - grid: Traditional grid layout (default)
 * - list: Horizontal list items (aka "card" from content type)
 * - carousel: One product at a time with peek of next/prev
 * - featured: Hero product + smaller grid
 * - stack: Overlapping cards like a deck
 */
export type ProductUpsellLayout = "grid" | "list" | "card" | "carousel" | "featured" | "stack";

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

  // Layout override (can use extended layouts beyond what ProductUpsellContent defines)
  layoutMode?: ProductUpsellLayout;

  // Enhanced v3 features
  enableHaptic?: boolean;
  enableParticles?: boolean;
  showSocialProof?: boolean;
  socialProofCount?: number;

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
  onProductClick: _onProductClick,
}) => {
  // Use animation hook
  const { showContent: _showContent } = usePopupAnimation({
    isVisible,
    entryDelay: 50,
  });

  // Component-specific state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [ripples, setRipples] = useState<Map<string, RippleState[]>>(new Map());
  const [showConfetti, setShowConfetti] = useState(false);
  const [animatedSavings, setAnimatedSavings] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [stackExpandedIndex, setStackExpandedIndex] = useState<number | null>(null);
  const rippleIdRef = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Feature flags
  const enableHaptic = config.enableHaptic !== false;
  const enableParticles = config.enableParticles !== false;

  // Determine active layout (layoutMode takes precedence over layout from content)
  const activeLayout: ProductUpsellLayout = config.layoutMode || (config.layout as ProductUpsellLayout) || "grid";

  // Haptic feedback helper
  const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
    if (!enableHaptic || prefersReducedMotion()) return;
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {
      // Silently fail
    }
  }, [enableHaptic]);

  const products = useMemo(
    () => propProducts || config.products || [],
    [propProducts, config.products]
  );
  const displayProducts = useMemo(
    () => (config.maxProducts ? products.slice(0, config.maxProducts) : products),
    [config.maxProducts, products]
  );

  // Create ripple effect on card
  const createRipple = useCallback((productId: string, event: React.MouseEvent | React.KeyboardEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    // For keyboard events, center the ripple; for mouse events, use click position
    const isMouseEvent = 'clientX' in event;
    const x = isMouseEvent ? event.clientX - rect.left : rect.width / 2;
    const y = isMouseEvent ? event.clientY - rect.top : rect.height / 2;
    const id = rippleIdRef.current++;

    setRipples(prev => {
      const newMap = new Map(prev);
      const productRipples = newMap.get(productId) || [];
      newMap.set(productId, [...productRipples, { x, y, id }]);
      return newMap;
    });

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => {
        const newMap = new Map(prev);
        const productRipples = newMap.get(productId) || [];
        newMap.set(productId, productRipples.filter(r => r.id !== id));
        return newMap;
      });
    }, 600);
  }, []);

  const handleProductSelect = useCallback(
    (productId: string, event?: React.MouseEvent | React.KeyboardEvent) => {
      // Trigger haptic feedback
      triggerHaptic(15);

      // Create ripple effect
      if (event) {
        createRipple(productId, event);
      }

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
      // Note: onProductClick is NOT called during selection
      // It's only used if the popup needs explicit "view product" navigation
    },
    [config.multiSelect, triggerHaptic, createRipple]
  );

  const handleAddToCart = useCallback(async () => {
    if (selectedProducts.size === 0) return;

    setIsLoading(true);
    triggerHaptic([30, 50, 30]); // Feedback pattern

    try {
      if (onAddToCart) {
        await onAddToCart(Array.from(selectedProducts));
        // Show success animation before closing
        setAddedSuccess(true);
        if (enableParticles) {
          setShowConfetti(true);
        }
        triggerHaptic([50, 30, 100]); // Success pattern

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setAddedSuccess(true);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      setIsLoading(false);
    }
  }, [selectedProducts, onAddToCart, onClose, triggerHaptic, enableParticles]);

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

  // Check if any products are selected (for bundle discount display)
  const hasSelectedProducts = selectedProducts.size > 0;

  // Calculate bundle discount (applies to any selected products)
  // The discount is scoped to only the selected products at checkout
  const calculateBundleSavings = useCallback(() => {
    if (!config.bundleDiscount || !hasSelectedProducts) return null;

    const total = calculateTotal();
    const savings = total * (config.bundleDiscount / 100);
    return savings;
  }, [hasSelectedProducts, config.bundleDiscount, calculateTotal]);

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

  // Animate savings counter when total changes
  const totalSavingsValue = calculateTotalSavings() || 0;
  useEffect(() => {
    if (prefersReducedMotion()) {
      setAnimatedSavings(totalSavingsValue);
      return;
    }

    const duration = 400;
    const startValue = animatedSavings;
    const difference = totalSavingsValue - startValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

      setAnimatedSavings(startValue + difference * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSavingsValue]);

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

  const { maxWidth: sizeMaxWidth } = getSizeDimensions(config.size || "medium", config.previewMode);

  // Get ripples for a specific product
  const getProductRipples = (productId: string) => ripples.get(productId) || [];

  // Render individual product card (grid layout)
  const renderProductCard = (product: Product, index: number) => {
    const isSelected = selectedProducts.has(product.id);
    const savingsPercent = getSavingsPercent(product);
    const productRipples = getProductRipples(product.id);
    const savingsAmount = product.compareAtPrice
      ? parseFloat(product.compareAtPrice) - parseFloat(product.price)
      : null;

    return (
      <div
        key={product.id}
        className={`upsell-product-card ${isSelected ? "upsell-product-card--selected" : ""}`}
        onClick={(e) => handleProductSelect(product.id, e)}
        style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleProductSelect(product.id)}
        aria-pressed={isSelected}
      >
        {/* Ripple effects */}
        {productRipples.map(ripple => (
          <span
            key={ripple.id}
            className="upsell-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
          />
        ))}

        {/* Selection glow ring */}
        {isSelected && <div className="upsell-selection-glow" />}

        {/* Selection badge */}
        {isSelected && (
          <div className="upsell-product-badge">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}

        {/* Savings badge - enhanced with pulse */}
        {savingsPercent !== null && (
          <div className="upsell-product-savings">
            <span className="upsell-savings-text">-{savingsPercent}%</span>
            <span className="upsell-savings-shine" />
          </div>
        )}

        {/* Product image with hover overlay */}
        {config.showImages !== false && product.imageUrl && (
          <div className="upsell-product-image">
            <div className="upsell-image-skeleton" />
            <img src={product.imageUrl} alt={product.title} loading="lazy" />
            <div className="upsell-image-overlay">
              <span className="upsell-quick-add">+</span>
            </div>
          </div>
        )}

        {/* Product info */}
        <div className="upsell-product-info">
          <h3 className="upsell-product-title">{product.title}</h3>

          {/* Social proof */}
          {config.showSocialProof && (
            <div className="upsell-social-proof">
              🔥 {config.socialProofCount || Math.floor(Math.random() * 50) + 20} added today
            </div>
          )}

          {/* Rating - enhanced with gradient stars */}
          {config.showRatings && product.rating && (
            <div className="upsell-product-rating">
              <span className="upsell-rating-stars">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`upsell-star ${i < Math.floor(product.rating!) ? 'upsell-star--filled' : ''} ${i === Math.floor(product.rating!) && product.rating! % 1 > 0 ? 'upsell-star--half' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </span>
              {config.showReviewCount && product.reviewCount && (
                <span className="upsell-rating-count">({product.reviewCount})</span>
              )}
            </div>
          )}

          {/* Price - enhanced with savings callout */}
          {config.showPrices !== false && (
            <div className="upsell-product-price">
              <span className="upsell-price-current">
                {formatCurrency(product.price, config.currency)}
              </span>
              {config.showCompareAtPrice && product.compareAtPrice && (
                <>
                  <span className="upsell-price-compare">
                    {formatCurrency(product.compareAtPrice, config.currency)}
                  </span>
                  {savingsAmount && savingsAmount > 0 && (
                    <span className="upsell-price-savings">
                      Save {formatCurrency(savingsAmount.toString(), config.currency)}
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Select button */}
          <button
            type="button"
            className={`upsell-product-select ${isSelected ? "upsell-product-select--selected" : ""}`}
          >
            {isSelected ? (
              <>
                <span className="upsell-select-icon">✓</span> Selected
              </>
            ) : (
              <>
                <span className="upsell-select-icon">+</span>{" "}
                {config.multiSelect ? "Add" : "Select"}
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Carousel navigation
  const goToNextSlide = useCallback(() => {
    setCarouselIndex(prev => Math.min(prev + 1, displayProducts.length - 1));
    triggerHaptic(8);
  }, [displayProducts.length, triggerHaptic]);

  const goToPrevSlide = useCallback(() => {
    setCarouselIndex(prev => Math.max(prev - 1, 0));
    triggerHaptic(8);
  }, [triggerHaptic]);

  // Render CAROUSEL layout - one product at a time with peek
  const renderCarouselLayout = () => (
    <div className="upsell-carousel-container">
      {/* Navigation arrows */}
      {carouselIndex > 0 && (
        <button className="upsell-carousel-nav upsell-carousel-prev" onClick={goToPrevSlide}>
          ‹
        </button>
      )}
      {carouselIndex < displayProducts.length - 1 && (
        <button className="upsell-carousel-nav upsell-carousel-next" onClick={goToNextSlide}>
          ›
        </button>
      )}

      {/* Carousel track */}
      <div
        ref={carouselRef}
        className="upsell-carousel-track"
        style={{ '--carousel-index': carouselIndex } as React.CSSProperties }
      >
        {displayProducts.map((product, index) => {
          const isActive = index === carouselIndex;
          const isSelected = selectedProducts.has(product.id);
          const savingsPercent = getSavingsPercent(product);
          const savingsAmount = product.compareAtPrice
            ? parseFloat(product.compareAtPrice) - parseFloat(product.price) : null;

          return (
            <div
              key={product.id}
              role="button"
              tabIndex={isActive ? 0 : -1}
              className={`upsell-carousel-slide ${isActive ? 'upsell-carousel-slide--active' : ''} ${isSelected ? 'upsell-carousel-slide--selected' : ''}`}
              onClick={(e) => isActive && handleProductSelect(product.id, e)}
              onKeyDown={(e) => isActive && e.key === 'Enter' && handleProductSelect(product.id, e)}
            >
              {/* Full product card for carousel */}
              <div className="upsell-carousel-card">
                {isSelected && <div className="upsell-selection-glow" />}

                {savingsPercent !== null && (
                  <div className="upsell-product-savings">
                    <span className="upsell-savings-text">-{savingsPercent}%</span>
                    <span className="upsell-savings-shine" />
                  </div>
                )}

                {config.showImages !== false && product.imageUrl && (
                  <div className="upsell-carousel-image">
                    <div className="upsell-image-skeleton" />
                    <img src={product.imageUrl} alt={product.title} loading="lazy" />
                  </div>
                )}

                <div className="upsell-carousel-info">
                  <h3 className="upsell-carousel-title">{product.title}</h3>

                  {product.description && (
                    <p className="upsell-carousel-desc">{product.description}</p>
                  )}

                  {config.showRatings && product.rating && (
                    <div className="upsell-carousel-rating">
                      <span className="upsell-rating-stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`upsell-star ${i < Math.floor(product.rating!) ? 'upsell-star--filled' : ''}`}>★</span>
                        ))}
                      </span>
                      {product.reviewCount && <span className="upsell-rating-count">({product.reviewCount} reviews)</span>}
                    </div>
                  )}

                  <div className="upsell-carousel-price">
                    <span className="upsell-price-current">{formatCurrency(product.price, config.currency)}</span>
                    {product.compareAtPrice && (
                      <span className="upsell-price-compare">{formatCurrency(product.compareAtPrice, config.currency)}</span>
                    )}
                    {savingsAmount && savingsAmount > 0 && (
                      <span className="upsell-price-savings">Save {formatCurrency(savingsAmount.toString(), config.currency)}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`upsell-carousel-select ${isSelected ? 'upsell-carousel-select--selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleProductSelect(product.id, e); }}
                  >
                    {isSelected ? '✓ Added to Bundle' : '+ Add to Bundle'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots indicator */}
      <div className="upsell-carousel-dots">
        {displayProducts.map((_, index) => (
          <button
            key={index}
            className={`upsell-carousel-dot ${index === carouselIndex ? 'upsell-carousel-dot--active' : ''} ${selectedProducts.has(displayProducts[index].id) ? 'upsell-carousel-dot--selected' : ''}`}
            onClick={() => { setCarouselIndex(index); triggerHaptic(5); }}
          />
        ))}
      </div>
    </div>
  );

  // Render FEATURED layout - hero product + smaller grid
  const renderFeaturedLayout = () => {
    const [featuredProduct, ...otherProducts] = displayProducts;
    if (!featuredProduct) return null;

    const isSelected = selectedProducts.has(featuredProduct.id);
    const savingsPercent = getSavingsPercent(featuredProduct);
    const savingsAmount = featuredProduct.compareAtPrice
      ? parseFloat(featuredProduct.compareAtPrice) - parseFloat(featuredProduct.price) : null;

    return (
      <div className="upsell-featured-layout">
        {/* Hero product */}
        <div
          role="button"
          tabIndex={0}
          className={`upsell-featured-hero ${isSelected ? 'upsell-featured-hero--selected' : ''}`}
          onClick={(e) => handleProductSelect(featuredProduct.id, e)}
          onKeyDown={(e) => e.key === 'Enter' && handleProductSelect(featuredProduct.id, e)}
        >
          {isSelected && <div className="upsell-selection-glow" />}

          <div className="upsell-featured-badge">⭐ FEATURED</div>

          {savingsPercent !== null && (
            <div className="upsell-product-savings upsell-product-savings--large">
              <span className="upsell-savings-text">-{savingsPercent}%</span>
              <span className="upsell-savings-shine" />
            </div>
          )}

          {featuredProduct.imageUrl && (
            <div className="upsell-featured-image">
              <img src={featuredProduct.imageUrl} alt={featuredProduct.title} />
            </div>
          )}

          <div className="upsell-featured-info">
            <h3 className="upsell-featured-title">{featuredProduct.title}</h3>
            {featuredProduct.description && (
              <p className="upsell-featured-desc">{featuredProduct.description}</p>
            )}

            {config.showRatings && featuredProduct.rating && (
              <div className="upsell-featured-rating">
                <span className="upsell-rating-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`upsell-star ${i < Math.floor(featuredProduct.rating!) ? 'upsell-star--filled' : ''}`}>★</span>
                  ))}
                </span>
                {featuredProduct.reviewCount && <span className="upsell-rating-count">({featuredProduct.reviewCount})</span>}
              </div>
            )}

            <div className="upsell-featured-price">
              <span className="upsell-price-current">{formatCurrency(featuredProduct.price, config.currency)}</span>
              {featuredProduct.compareAtPrice && (
                <span className="upsell-price-compare">{formatCurrency(featuredProduct.compareAtPrice, config.currency)}</span>
              )}
              {savingsAmount && savingsAmount > 0 && (
                <span className="upsell-price-savings">Save {formatCurrency(savingsAmount.toString(), config.currency)}</span>
              )}
            </div>

            <button className={`upsell-featured-select ${isSelected ? 'upsell-featured-select--selected' : ''}`}>
              {isSelected ? '✓ Added' : '+ Add to Bundle'}
            </button>
          </div>
        </div>

        {/* Other products in smaller grid */}
        {otherProducts.length > 0 && (
          <div className="upsell-featured-grid">
            <h4 className="upsell-featured-grid-title">Also Consider</h4>
            <div className="upsell-grid" style={{ '--upsell-columns': Math.min(3, otherProducts.length) } as React.CSSProperties}>
              {otherProducts.map((product, index) => renderProductCard(product, index))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render STACK layout - overlapping cards
  const renderStackLayout = () => (
    <div className="upsell-stack-container">
      {displayProducts.map((product, index) => {
        const isSelected = selectedProducts.has(product.id);
        const isExpanded = stackExpandedIndex === index;
        const savingsPercent = getSavingsPercent(product);
        const offset = index * 8;
        const zIndex = isExpanded ? 100 : displayProducts.length - index;

        return (
          <div
            key={product.id}
            role="button"
            tabIndex={0}
            className={`upsell-stack-card ${isSelected ? 'upsell-stack-card--selected' : ''} ${isExpanded ? 'upsell-stack-card--expanded' : ''}`}
            style={{
              '--stack-offset': `${offset}px`,
              '--stack-rotate': `${(index - 1) * 2}deg`,
              zIndex,
            } as React.CSSProperties}
            onClick={(e) => {
              if (isExpanded) {
                handleProductSelect(product.id, e);
              } else {
                setStackExpandedIndex(index);
                triggerHaptic(10);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (isExpanded) {
                  handleProductSelect(product.id, e);
                } else {
                  setStackExpandedIndex(index);
                  triggerHaptic(10);
                }
              }
            }}
          >
            {isSelected && <div className="upsell-selection-glow" />}

            {savingsPercent !== null && (
              <div className="upsell-product-savings">
                <span className="upsell-savings-text">-{savingsPercent}%</span>
              </div>
            )}

            {product.imageUrl && (
              <div className="upsell-stack-image">
                <img src={product.imageUrl} alt={product.title} />
              </div>
            )}

            <div className="upsell-stack-info">
              <h3 className="upsell-stack-title">{product.title}</h3>
              <div className="upsell-stack-price">
                <span className="upsell-price-current">{formatCurrency(product.price, config.currency)}</span>
                {product.compareAtPrice && (
                  <span className="upsell-price-compare">{formatCurrency(product.compareAtPrice, config.currency)}</span>
                )}
              </div>

              {isExpanded && (
                <button className={`upsell-stack-select ${isSelected ? 'upsell-stack-select--selected' : ''}`}>
                  {isSelected ? '✓ Added' : '+ Add'}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Collapse button when expanded */}
      {stackExpandedIndex !== null && (
        <button className="upsell-stack-collapse" onClick={() => setStackExpandedIndex(null)}>
          View All
        </button>
      )}
    </div>
  );

  // Render LIST layout (existing card layout)
  const renderListLayout = () => (
    <div className="upsell-list">
      {displayProducts.map((product) => {
        const isSelected = selectedProducts.has(product.id);
        const savingsPercent = getSavingsPercent(product);

        return (
          <div
            key={product.id}
            className={`upsell-list-item ${isSelected ? "upsell-list-item--selected" : ""}`}
            onClick={() => handleProductSelect(product.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleProductSelect(product.id)}
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
                handleProductSelect(product.id);
              }}
            >
              {isSelected ? "✓" : "+"}
            </button>
          </div>
        );
      })}
    </div>
  );

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

    switch (activeLayout) {
      case "carousel":
        return renderCarouselLayout();
      case "featured":
        return renderFeaturedLayout();
      case "stack":
        return renderStackLayout();
      case "list":
      case "card":
        return renderListLayout();
      case "grid":
      default:
        return (
          <div
            className="upsell-grid"
            style={{ "--upsell-columns": config.columns || 2 } as React.CSSProperties}
          >
            {displayProducts.map((product, index) => renderProductCard(product, index))}
          </div>
        );
    }
  };

  // Calculate values for summary
  const _totalSavings = calculateTotalSavings();
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
      showBranding={config.showBranding}
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
          margin: 0 auto;
          border-radius: ${borderRadius}px;
          overflow: hidden;
          background: ${baseBackground};
          color: ${textColor};
          font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          max-height: 90%;
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

        /* ===== BUNDLE BANNER - Enhanced with shimmer ===== */
        .upsell-bundle-banner {
          position: relative;
          background: linear-gradient(135deg, var(--upsell-accent) 0%, color-mix(in srgb, var(--upsell-accent), #000 15%) 100%);
          color: #fff;
          padding: 0.75rem 1rem;
          text-align: center;
          font-size: 0.875rem;
          font-weight: 600;
          flex-shrink: 0;
          transition: all 0.3s ease;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .upsell-banner-icon {
          font-size: 1.1rem;
          animation: bannerIconPulse 2s ease-in-out infinite;
        }
        .upsell-banner-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: bannerShimmer 3s ease-in-out infinite;
        }
        @keyframes bannerShimmer {
          0%, 100% { left: -100%; }
          50% { left: 100%; }
        }
        @keyframes bannerIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .upsell-bundle-banner--active {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          box-shadow: 0 0 12px 2px rgba(16, 185, 129, 0.4);
        }
        .upsell-bundle-banner--active .upsell-banner-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
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

        /* ============================================
         * CAROUSEL LAYOUT
         * One product at a time with peek of next/prev
         * Always centered regardless of screen size
         * ============================================ */
        .upsell-carousel-container {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 1rem 0;
          /* CSS custom properties for responsive sizing */
          --carousel-slide-width: 80%;
          --carousel-gap: 1rem;
        }
        .upsell-carousel-track {
          display: flex;
          gap: var(--carousel-gap);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          /*
           * Centering formula:
           * - Start at 50% (center of container)
           * - Subtract half the slide width to center first slide
           * - Then move by (slide width + gap) * index for each slide
           */
          transform: translateX(
            calc(
              50% - (var(--carousel-slide-width) / 2) -
              (var(--carousel-slide-width) + var(--carousel-gap)) * var(--carousel-index, 0)
            )
          );
        }
        .upsell-carousel-slide {
          flex: 0 0 var(--carousel-slide-width);
          transition: all 0.3s ease;
          opacity: 0.5;
          transform: scale(0.92);
          pointer-events: none;
        }
        .upsell-carousel-slide--active {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }
        .upsell-carousel-card {
          position: relative;
          background: var(--upsell-bg);
          border: 2px solid var(--upsell-border);
          border-radius: var(--upsell-radius);
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .upsell-carousel-slide--active .upsell-carousel-card {
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }
        .upsell-carousel-slide--selected .upsell-carousel-card {
          border-color: var(--upsell-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--upsell-accent) 25%, transparent);
        }
        .upsell-carousel-image {
          position: relative;
          aspect-ratio: 16/10;
          background: var(--upsell-bg-secondary);
          overflow: hidden;
        }
        .upsell-carousel-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .upsell-carousel-info {
          padding: 1.25rem;
        }
        .upsell-carousel-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
          color: var(--upsell-text);
        }
        .upsell-carousel-desc {
          font-size: 0.875rem;
          color: var(--upsell-text-muted);
          margin: 0 0 0.75rem;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .upsell-carousel-rating {
          margin-bottom: 0.75rem;
        }
        .upsell-carousel-price {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .upsell-carousel-price .upsell-price-current {
          font-size: 1.5rem;
        }
        .upsell-carousel-select {
          width: 100%;
          padding: 0.875rem;
          border: none;
          border-radius: calc(var(--upsell-radius) - 4px);
          background: var(--upsell-accent);
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .upsell-carousel-select:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .upsell-carousel-select--selected {
          background: var(--upsell-success);
        }

        /* Carousel navigation */
        .upsell-carousel-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 2.5rem;
          height: 2.5rem;
          border: none;
          border-radius: 50%;
          background: var(--upsell-bg);
          color: var(--upsell-text);
          font-size: 1.5rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upsell-carousel-nav:hover {
          background: var(--upsell-accent);
          color: #fff;
          transform: translateY(-50%) scale(1.1);
        }
        .upsell-carousel-prev { left: 0.5rem; }
        .upsell-carousel-next { right: 0.5rem; }

        /* Carousel dots */
        .upsell-carousel-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .upsell-carousel-dot {
          width: 0.5rem;
          height: 0.5rem;
          border: none;
          border-radius: 50%;
          background: var(--upsell-border);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .upsell-carousel-dot:hover {
          background: var(--upsell-text-muted);
        }
        .upsell-carousel-dot--active {
          background: var(--upsell-accent);
          transform: scale(1.3);
        }
        .upsell-carousel-dot--selected {
          box-shadow: 0 0 0 2px var(--upsell-success);
        }

        /* ============================================
         * FEATURED LAYOUT
         * Hero product + smaller grid
         * ============================================ */
        .upsell-featured-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .upsell-featured-hero {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          background: var(--upsell-bg);
          border: 2px solid var(--upsell-border);
          border-radius: var(--upsell-radius);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .upsell-featured-hero:hover {
          border-color: var(--upsell-accent);
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
        }
        .upsell-featured-hero--selected {
          border-color: var(--upsell-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--upsell-accent) 25%, transparent);
        }
        .upsell-featured-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 0.375rem 0.75rem;
          background: linear-gradient(135deg, #F59E0B, #FBBF24);
          color: #fff;
          font-size: 0.6875rem;
          font-weight: 700;
          border-radius: 4px;
          z-index: 5;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
        }
        .upsell-featured-image {
          aspect-ratio: 1;
          background: var(--upsell-bg-secondary);
          overflow: hidden;
        }
        .upsell-featured-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .upsell-featured-hero:hover .upsell-featured-image img {
          transform: scale(1.05);
        }
        .upsell-featured-info {
          padding: 1.5rem 1.5rem 1.5rem 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .upsell-featured-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.75rem;
          color: var(--upsell-text);
        }
        .upsell-featured-desc {
          font-size: 0.9375rem;
          color: var(--upsell-text-muted);
          margin: 0 0 1rem;
          line-height: 1.6;
        }
        .upsell-featured-rating {
          margin-bottom: 1rem;
        }
        .upsell-featured-price {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .upsell-featured-price .upsell-price-current {
          font-size: 1.75rem;
        }
        .upsell-featured-select {
          padding: 1rem 1.5rem;
          border: none;
          border-radius: calc(var(--upsell-radius) - 4px);
          background: var(--upsell-accent);
          color: #fff;
          font-size: 1.0625rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .upsell-featured-select:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .upsell-featured-select--selected {
          background: var(--upsell-success);
        }
        .upsell-featured-grid {
          border-top: 1px solid var(--upsell-border);
          padding-top: 1.5rem;
        }
        .upsell-featured-grid-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--upsell-text-muted);
          margin: 0 0 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ============================================
         * STACK LAYOUT
         * Overlapping cards like a deck
         * ============================================ */
        .upsell-stack-container {
          position: relative;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem;
        }
        .upsell-stack-card {
          position: absolute;
          top: 0;
          left: 50%;
          width: 85%;
          max-width: 320px;
          transform: translateX(-50%) translateY(var(--stack-offset, 0)) rotate(var(--stack-rotate, 0));
          background: var(--upsell-bg);
          border: 2px solid var(--upsell-border);
          border-radius: var(--upsell-radius);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .upsell-stack-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .upsell-stack-card--expanded {
          transform: translateX(-50%) translateY(0) rotate(0deg) scale(1.05) !important;
          z-index: 100 !important;
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
        }
        .upsell-stack-card--selected {
          border-color: var(--upsell-accent);
        }
        .upsell-stack-image {
          aspect-ratio: 16/9;
          background: var(--upsell-bg-secondary);
          overflow: hidden;
        }
        .upsell-stack-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .upsell-stack-info {
          padding: 1rem;
        }
        .upsell-stack-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: var(--upsell-text);
        }
        .upsell-stack-price {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .upsell-stack-select {
          width: 100%;
          margin-top: 0.75rem;
          padding: 0.75rem;
          border: none;
          border-radius: calc(var(--upsell-radius) - 4px);
          background: var(--upsell-accent);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .upsell-stack-select--selected {
          background: var(--upsell-success);
        }
        .upsell-stack-collapse {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.5rem 1rem;
          border: 2px solid var(--upsell-border);
          border-radius: 2rem;
          background: var(--upsell-bg);
          color: var(--upsell-text);
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .upsell-stack-collapse:hover {
          background: var(--upsell-accent);
          color: #fff;
          border-color: var(--upsell-accent);
        }

        /* ===== PRODUCT CARD - Enhanced 3D Effects ===== */
        .upsell-product-card {
          position: relative;
          border: 2px solid var(--upsell-border);
          border-radius: calc(var(--upsell-radius) - 2px);
          background: var(--upsell-bg);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeInUp 0.3s ease-out backwards;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .upsell-product-card:hover {
          border-color: var(--upsell-accent);
          transform: perspective(1000px) rotateX(2deg) rotateY(-2deg) translateY(-4px);
          box-shadow:
            0 12px 24px -8px rgba(0, 0, 0, 0.15),
            0 4px 8px -2px rgba(0, 0, 0, 0.1),
            0 0 0 1px var(--upsell-accent);
        }
        .upsell-product-card--selected {
          border-color: var(--upsell-accent);
          transform: perspective(1000px) scale(1.02);
          box-shadow:
            0 0 0 3px color-mix(in srgb, var(--upsell-accent) 30%, transparent),
            0 8px 20px -4px rgba(0, 0, 0, 0.12);
        }
        .upsell-product-card--selected:hover {
          transform: perspective(1000px) scale(1.02) translateY(-2px);
        }

        /* Selection glow ring */
        .upsell-selection-glow {
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(135deg, var(--upsell-accent), color-mix(in srgb, var(--upsell-accent), #fff 30%));
          opacity: 0.3;
          z-index: 0;
          animation: selectionGlow 1.5s ease-in-out infinite;
        }
        @keyframes selectionGlow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.02); }
        }

        /* Ripple effect */
        .upsell-ripple {
          position: absolute;
          border-radius: 50%;
          background: var(--upsell-accent);
          opacity: 0.3;
          transform: translate(-50%, -50%) scale(0);
          animation: rippleEffect 0.6s ease-out forwards;
          pointer-events: none;
          z-index: 10;
        }
        @keyframes rippleEffect {
          to {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }

        .upsell-product-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          z-index: 6;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          background: var(--upsell-accent);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bounceIn 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        /* ===== SAVINGS BADGE - Enhanced with pulse ===== */
        .upsell-product-savings {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          z-index: 5;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          overflow: hidden;
          animation: savingsPulse 2s ease-in-out infinite;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        }
        .upsell-savings-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: savingsShine 2.5s ease-in-out infinite;
        }
        @keyframes savingsPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes savingsShine {
          0%, 100% { left: -100%; }
          50% { left: 100%; }
        }

        /* ===== PRODUCT IMAGE - Enhanced with overlay ===== */
        .upsell-product-image {
          position: relative;
          aspect-ratio: 1;
          background: var(--upsell-bg-secondary);
          overflow: hidden;
        }
        .upsell-image-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, var(--upsell-bg-secondary) 25%, #e5e7eb 50%, var(--upsell-bg-secondary) 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.5s infinite;
        }
        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .upsell-product-image img {
          position: relative;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }
        .upsell-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .upsell-quick-add {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--upsell-accent);
          color: #fff;
          font-size: 1.5rem;
          font-weight: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: scale(0.8);
          opacity: 0;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .upsell-product-card:hover .upsell-product-image img {
          transform: scale(1.08);
        }
        .upsell-product-card:hover .upsell-image-overlay {
          opacity: 1;
        }
        .upsell-product-card:hover .upsell-quick-add {
          opacity: 1;
          transform: scale(1);
        }

        .upsell-product-info {
          padding: 0.875rem;
          position: relative;
          z-index: 1;
          background: var(--upsell-bg);
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

        /* Social proof badge */
        .upsell-social-proof {
          font-size: 0.6875rem;
          color: #EF4444;
          margin-bottom: 0.375rem;
          font-weight: 500;
          animation: socialProofFade 0.5s ease-out;
        }
        @keyframes socialProofFade {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ===== STAR RATINGS - Enhanced with gradient ===== */
        .upsell-product-rating,
        .upsell-carousel-rating,
        .upsell-list-rating {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.375rem;
        }
        .upsell-rating-stars {
          display: flex;
          gap: 1px;
        }
        .upsell-star {
          font-size: 0.8rem;
          color: #D1D5DB;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .upsell-star--filled {
          color: transparent;
          background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #F59E0B 100%);
          -webkit-background-clip: text;
          background-clip: text;
          animation: starPop 0.3s ease-out backwards;
        }
        .upsell-star--half {
          background: linear-gradient(90deg, #F59E0B 50%, #D1D5DB 50%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        @keyframes starPop {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .upsell-rating-count {
          font-size: 0.6875rem;
          color: var(--upsell-text-muted);
        }

        /* ===== PRICE - Enhanced with savings callout ===== */
        .upsell-product-price,
        .upsell-carousel-price,
        .upsell-list-price {
          display: flex;
          align-items: baseline;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        .upsell-price-current {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--upsell-text);
        }
        .upsell-price-compare {
          font-size: 0.8125rem;
          color: var(--upsell-text-muted);
          text-decoration: line-through;
          position: relative;
        }
        .upsell-price-compare::after {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: 100%;
          height: 1.5px;
          background: #EF4444;
          animation: strikeThrough 0.3s ease-out forwards;
        }
        @keyframes strikeThrough {
          from { width: 0; }
          to { width: 100%; }
        }
        .upsell-price-savings {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #10B981;
          background: rgba(16, 185, 129, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          animation: savingsCallout 0.4s ease-out backwards 0.2s;
        }
        @keyframes savingsCallout {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        /* ===== SELECT BUTTON - Enhanced ===== */
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
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .upsell-product-select:hover {
          background: var(--upsell-accent);
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .upsell-product-select--selected {
          background: var(--upsell-accent);
          color: #fff;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--upsell-accent) 40%, transparent);
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

        /* ===== FOOTER - Enhanced ===== */
        .upsell-footer {
          position: relative;
          border-top: 1px solid var(--upsell-border);
          padding: 1rem 1.5rem;
          background: var(--upsell-bg-secondary);
          flex-shrink: 0;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        .upsell-footer--success {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        }

        /* Confetti container */
        .upsell-confetti-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .upsell-confetti-particle {
          position: absolute;
          width: 8px;
          height: 8px;
          top: 50%;
          left: 50%;
          border-radius: 2px;
          animation: confettiBurst 1s ease-out forwards;
          animation-delay: calc(var(--particle-index) * 0.05s);
        }
        .upsell-confetti-particle:nth-child(1) { background: #F59E0B; }
        .upsell-confetti-particle:nth-child(2) { background: #EF4444; }
        .upsell-confetti-particle:nth-child(3) { background: #8B5CF6; }
        .upsell-confetti-particle:nth-child(4) { background: #06B6D4; }
        .upsell-confetti-particle:nth-child(5) { background: #10B981; }
        .upsell-confetti-particle:nth-child(6) { background: #EC4899; }
        .upsell-confetti-particle:nth-child(7) { background: #F59E0B; border-radius: 50%; }
        .upsell-confetti-particle:nth-child(8) { background: #6366F1; }
        .upsell-confetti-particle:nth-child(9) { background: #F97316; border-radius: 50%; }
        .upsell-confetti-particle:nth-child(10) { background: #14B8A6; }
        .upsell-confetti-particle:nth-child(11) { background: #A855F7; border-radius: 50%; }
        .upsell-confetti-particle:nth-child(12) { background: #FBBF24; }
        @keyframes confettiBurst {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(-50% + (var(--particle-index) - 6) * 40px),
              calc(-50% + sin(var(--particle-index) * 30deg) * 60px - 80px)
            ) scale(1) rotate(720deg);
            opacity: 0;
          }
        }

        /* Summary with thumbnails */
        .upsell-summary {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          margin-bottom: 1rem;
          animation: summarySlide 0.3s ease-out;
        }
        @keyframes summarySlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .upsell-summary-thumbs {
          display: flex;
          flex-shrink: 0;
        }
        .upsell-summary-thumb {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid var(--upsell-bg);
          margin-left: -8px;
          background: var(--upsell-bg-secondary);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .upsell-summary-thumb:first-child {
          margin-left: 0;
        }
        .upsell-summary-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .upsell-summary-thumb--more {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          font-weight: 700;
          color: var(--upsell-text-muted);
          background: var(--upsell-bg);
        }
        .upsell-summary-details {
          flex: 1;
          min-width: 0;
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
        .upsell-bundle-row {
          color: #10B981;
        }
        .upsell-bundle-savings {
          font-weight: 600;
        }
        .upsell-summary-total {
          font-size: 1rem;
          font-weight: 700;
          padding-top: 0.5rem;
          margin-top: 0.5rem;
          border-top: 1px solid var(--upsell-border);
        }
        .upsell-total-price {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .upsell-total-original {
          font-size: 0.875rem;
          font-weight: 400;
          text-decoration: line-through;
          color: var(--upsell-text-muted);
        }
        .upsell-total-current {
          color: var(--upsell-accent);
        }
        .upsell-savings-highlight {
          margin-top: 0.5rem;
          padding: 0.375rem 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 6px;
          animation: savingsHighlight 0.5s ease-out;
        }
        @keyframes savingsHighlight {
          0% { background: rgba(16, 185, 129, 0.3); transform: scale(1.02); }
          100% { background: rgba(16, 185, 129, 0.1); transform: scale(1); }
        }
        .upsell-summary-savings {
          color: var(--upsell-success);
          font-weight: 600;
        }

        /* Success message */
        .upsell-success-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          color: #fff;
          font-size: 1.125rem;
          font-weight: 600;
          animation: successFade 0.5s ease-out;
        }
        @keyframes successFade {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .upsell-success-icon {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: successCheck 0.5s ease-out 0.2s both;
        }
        .upsell-success-icon svg {
          width: 1.25rem;
          height: 1.25rem;
        }
        @keyframes successCheck {
          0% { transform: scale(0) rotate(-45deg); }
          60% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        /* ===== ACTIONS - Enhanced CTA ===== */
        .upsell-actions {
          display: flex;
          gap: 0.75rem;
          transition: all 0.3s ease;
        }
        .upsell-actions--active .upsell-cta {
          animation: ctaPulse 2s ease-in-out infinite;
        }
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          50% { box-shadow: 0 6px 20px color-mix(in srgb, var(--button-color) 40%, transparent); }
        }

        /* ===== CTA BUTTON - Enhanced with animations ===== */
        .upsell-cta {
          position: relative;
          flex: 1;
          padding: 0.875rem 1rem;
          border: none;
          border-radius: calc(var(--upsell-radius) - 2px);
          background: var(--button-color, var(--upsell-accent));
          color: var(--button-text-color, #fff);
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .upsell-cta:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px color-mix(in srgb, var(--button-color, var(--upsell-accent)) 35%, transparent);
        }
        .upsell-cta:active:not(:disabled) {
          transform: translateY(0);
        }
        .upsell-cta:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .upsell-cta-icon {
          font-size: 1.125rem;
          transition: transform 0.3s ease;
        }
        .upsell-cta:hover .upsell-cta-icon {
          animation: cartBounce 0.5s ease-out;
        }
        @keyframes cartBounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-4px) rotate(-5deg); }
          50% { transform: translateY(0) rotate(5deg); }
          75% { transform: translateY(-2px) rotate(0deg); }
        }
        .upsell-cta-text {
          position: relative;
        }
        .upsell-cta-savings {
          font-size: 0.6875rem;
          font-weight: 600;
          background: rgba(255,255,255,0.2);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          margin-left: 0.25rem;
        }

        /* Loading state */
        .upsell-cta--loading {
          pointer-events: none;
        }
        .upsell-cta-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .upsell-cta-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: rgba(255,255,255,0.5);
          animation: ctaProgress 1.5s ease-out infinite;
        }
        @keyframes ctaProgress {
          0% { width: 0; }
          100% { width: 100%; }
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
          transition: all 0.25s ease;
        }
        .upsell-dismiss:hover {
          background: var(--upsell-bg-secondary);
          color: var(--upsell-text);
          border-color: var(--upsell-text-muted);
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

        /* ===== RESPONSIVE - NEW LAYOUTS ===== */
        /* Carousel responsive - adjust slide width for different sizes */
        @container upsell (max-width: 540px) {
          .upsell-carousel-container {
            --carousel-slide-width: 88%;
            --carousel-gap: 0.75rem;
          }
          .upsell-carousel-info {
            padding: 1rem;
          }
          .upsell-carousel-title {
            font-size: 1rem;
          }
          .upsell-carousel-nav {
            width: 2rem;
            height: 2rem;
            font-size: 1.25rem;
          }
        }

        @container upsell (max-width: 380px) {
          .upsell-carousel-container {
            --carousel-slide-width: 92%;
            --carousel-gap: 0.5rem;
          }
        }

        /* Large screens - show more peek */
        @container upsell (min-width: 700px) {
          .upsell-carousel-container {
            --carousel-slide-width: 70%;
            --carousel-gap: 1.5rem;
          }
        }

        /* Featured layout responsive */
        @container upsell (max-width: 600px) {
          .upsell-featured-hero {
            grid-template-columns: 1fr;
          }
          .upsell-featured-image {
            aspect-ratio: 16/9;
          }
          .upsell-featured-info {
            padding: 1rem;
          }
          .upsell-featured-title {
            font-size: 1.125rem;
          }
          .upsell-featured-desc {
            font-size: 0.875rem;
          }
          .upsell-featured-price .upsell-price-current {
            font-size: 1.25rem;
          }
          .upsell-featured-grid .upsell-grid {
            --upsell-columns: 2 !important;
          }
        }

        @container upsell (max-width: 380px) {
          .upsell-featured-grid .upsell-grid {
            --upsell-columns: 1 !important;
          }
        }

        /* Stack layout responsive */
        @container upsell (max-width: 540px) {
          .upsell-stack-container {
            min-height: 280px;
            padding: 1.5rem 0.5rem;
          }
          .upsell-stack-card {
            width: 90%;
          }
        }

        /* Large size optimization - use single column for better visibility */
        @container upsell (min-width: 700px) {
          .upsell-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      <div className="upsell-popup" data-splitpop="true" data-template="product-upsell">
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
          {config.subheadline && <p className="upsell-subheadline">{config.subheadline}</p>}
        </div>

        {/* Bundle discount banner - enhanced with shimmer */}
        {config.bundleDiscount && config.bundleDiscount > 0 && (
          <div className={`upsell-bundle-banner ${hasSelectedProducts ? "upsell-bundle-banner--active" : ""}`}>
            <span className="upsell-banner-icon">✨</span>
            <span className="upsell-banner-text">
              {config.bundleDiscountText || `Save ${config.bundleDiscount}% on selected items!`}
            </span>
            <span className="upsell-banner-shimmer" />
          </div>
        )}

        {/* Products */}
        <div className="upsell-content">{renderProductsSection()}</div>

        {/* Footer with summary and actions */}
        <div className={`upsell-footer ${addedSuccess ? 'upsell-footer--success' : ''}`}>
          {/* Success confetti */}
          {showConfetti && (
            <div className="upsell-confetti-container">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="upsell-confetti-particle" style={{ '--particle-index': i } as React.CSSProperties} />
              ))}
            </div>
          )}

          {/* Summary with mini thumbnails */}
          {selectedProducts.size > 0 && !addedSuccess && (
            <div className="upsell-summary">
              {/* Mini product thumbnails */}
              <div className="upsell-summary-thumbs">
                {Array.from(selectedProducts).slice(0, 4).map((id) => {
                  const product = products.find(p => p.id === id);
                  return product?.imageUrl ? (
                    <div key={id} className="upsell-summary-thumb">
                      <img src={product.imageUrl} alt={product.title} />
                    </div>
                  ) : null;
                })}
                {selectedProducts.size > 4 && (
                  <div className="upsell-summary-thumb upsell-summary-thumb--more">
                    +{selectedProducts.size - 4}
                  </div>
                )}
              </div>

              <div className="upsell-summary-details">
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
                  <div className="upsell-summary-row upsell-bundle-row">
                    <span>🎉 {config.bundleDiscount}% bundle discount</span>
                    <span className="upsell-bundle-savings">-{formatCurrency(calculateBundleSavings()!, config.currency)}</span>
                  </div>
                )}

                <div className="upsell-summary-row upsell-summary-total">
                  <span>Total</span>
                  <div className="upsell-total-price">
                    {calculateCompareAtSavings() && (
                      <span className="upsell-total-original">{formatCurrency(calculateOriginalTotal(), config.currency)}</span>
                    )}
                    <span className="upsell-total-current">{formatCurrency(discountedTotal, config.currency)}</span>
                  </div>
                </div>

                {animatedSavings > 0 && (
                  <div className="upsell-summary-row upsell-savings-highlight">
                    <span className="upsell-summary-savings">
                      🎉 You save {formatCurrency(animatedSavings, config.currency)}!
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success message */}
          {addedSuccess && (
            <div className="upsell-success-message">
              <div className="upsell-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Added to cart!</span>
            </div>
          )}

          {/* Action buttons */}
          {!addedSuccess && (
            <div className={`upsell-actions ${selectedProducts.size > 0 ? 'upsell-actions--active' : ''}`}>
              <button
                type="button"
                className={`upsell-cta ${isLoading ? 'upsell-cta--loading' : ''}`}
                onClick={handleAddToCart}
                disabled={selectedProducts.size === 0 || isLoading}
                style={{
                  '--button-color': config.buttonColor || accentColor,
                  '--button-text-color': config.buttonTextColor || '#fff',
                } as React.CSSProperties}
              >
                {isLoading ? (
                  <>
                    <span className="upsell-cta-spinner" />
                    <span className="upsell-cta-progress" />
                    Adding...
                  </>
                ) : (
                  <>
                    <span className="upsell-cta-icon">🛒</span>
                    <span className="upsell-cta-text">{getCtaLabel()}</span>
                    {selectedProducts.size > 0 && animatedSavings > 0 && (
                      <span className="upsell-cta-savings">Save {formatCurrency(animatedSavings, config.currency)}</span>
                    )}
                  </>
                )}
              </button>

              <button type="button" className="upsell-dismiss" onClick={onClose}>
                {config.secondaryCtaLabel || config.dismissLabel || "No thanks"}
              </button>
            </div>
          )}
        </div>
      </div>
    </PopupPortal>
  );
};
