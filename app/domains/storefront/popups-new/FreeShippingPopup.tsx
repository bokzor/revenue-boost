/**
 * FreeShippingPopup Component
 *
 * Free shipping threshold popup featuring:
 * - Progress bar showing cart value vs threshold
 * - Dynamic messaging based on cart value
 * - Success state when threshold reached
 * - Optional product recommendations to reach threshold
 * - Multiple display modes (banner/modal/sticky)
 * - Auto-hide option
 */

import React, { useMemo, useCallback } from 'react';
import { BasePopup } from './BasePopup';
import type { PopupDesignConfig, Product } from './types';
import type { FreeShippingContent } from '~/domains/campaigns/types/campaign';
import { formatCurrency } from './utils';

/**
 * FreeShippingConfig - Extends both design config AND campaign content type
 * All content fields come from FreeShippingContent
 * All design fields come from PopupDesignConfig
 */
export interface FreeShippingConfig extends PopupDesignConfig, FreeShippingContent {
  // Storefront-specific fields only
  currentCartTotal?: number;
  products?: Product[];

  // Note: freeShippingThreshold, initialMessage, progressMessage, etc.
  // all come from FreeShippingContent
}

export interface FreeShippingPopupProps {
  config: FreeShippingConfig;
  isVisible: boolean;
  onClose: () => void;
  cartTotal?: number;
  products?: Product[];
  onProductClick?: (product: Product) => void;
}

export const FreeShippingPopup: React.FC<FreeShippingPopupProps> = ({
  config,
  isVisible,
  onClose,
  cartTotal: propCartTotal,
  products: propProducts,
  onProductClick,
}) => {
  const cartTotal = propCartTotal ?? config.currentCartTotal ?? 0;
  const threshold = config.freeShippingThreshold;

  const { remaining, percentage, hasReached } = useMemo(() => {
    const remaining = Math.max(0, threshold - cartTotal);
    const percentage = Math.min(100, (cartTotal / threshold) * 100);
    const hasReached = cartTotal >= threshold;

    return { remaining, percentage, hasReached };
  }, [cartTotal, threshold]);

  const products = useMemo(() => {
    const allProducts = propProducts || config.products || [];

    if (config.productFilter === 'under_threshold') {
      return allProducts.filter(p => parseFloat(p.price) <= remaining);
    }

    return allProducts;
  }, [propProducts, config.products, config.productFilter, remaining]);

  const displayProducts = config.maxProductsToShow
    ? products.slice(0, config.maxProductsToShow)
    : products;

  const getMessage = useCallback(() => {
    if (hasReached) {
      return config.successTitle || 'You unlocked FREE SHIPPING! 🎉';
    }

    const message = config.initialMessage || 'Add {{remaining}} more for FREE SHIPPING! 🚚';
    return message
      .replace('{{remaining}}', formatCurrency(remaining, config.currency))
      .replace('{{percentage}}', Math.round(percentage).toString());
  }, [hasReached, remaining, percentage, config]);

  const renderBanner = () => {
    const bannerStyles: React.CSSProperties = {
      position: config.displayStyle === 'sticky' ? 'sticky' : 'fixed',
      [config.position === 'bottom' ? 'bottom' : 'top']: 0,
      left: 0,
      right: 0,
      backgroundColor: hasReached ? '#10B981' : config.backgroundColor,
      color: hasReached ? '#FFFFFF' : config.textColor,
      padding: '16px 20px',
      zIndex: 10000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    };

    const containerStyles: React.CSSProperties = {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    };

    const headerStyles: React.CSSProperties = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    };

    const closeButtonStyles: React.CSSProperties = {
      background: 'transparent',
      border: 'none',
      color: hasReached ? '#FFFFFF' : config.textColor,
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0 8px',
      opacity: 0.8,
      lineHeight: 1,
    };

    return (
      <div style={bannerStyles}>
        <div style={containerStyles}>
          <div style={headerStyles}>
            <div style={{ fontWeight: 600, fontSize: '16px' }}>
              {getMessage()}
            </div>
            {config.showCloseButton !== false && (
              <button
                onClick={onClose}
                style={closeButtonStyles}
                aria-label="Close banner"
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
              >
                ×
              </button>
            )}
          </div>

          {/* Progress bar */}
          {config.showProgress !== false && !hasReached && (
            <div style={{
              height: '8px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: config.progressColor || config.accentColor || '#10B981',
                transition: 'width 0.3s ease',
              }} />
            </div>
          )}

          {/* Product recommendations */}
          {config.showProducts && !hasReached && displayProducts.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              padding: '8px 0',
            }}>
              {displayProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => onProductClick?.(product)}
                  style={{
                    minWidth: '120px',
                    cursor: 'pointer',
                    padding: '8px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        marginBottom: '6px',
                      }}
                    />
                  )}
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    {product.title}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    {formatCurrency(product.price, config.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderModal = () => {
    return (
      <BasePopup config={config} isVisible={isVisible} onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
          {/* Icon */}
          <div style={{ fontSize: '48px' }}>
            {hasReached ? '🎉' : '🚚'}
          </div>

          {/* Message */}
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>
              {getMessage()}
            </h2>
            {!hasReached && config.progressMessage && (
              <p style={{ fontSize: '14px', margin: 0, opacity: 0.8 }}>
                {config.progressMessage.replace('{{percentage}}', Math.round(percentage).toString())}
              </p>
            )}
            {hasReached && config.successSubhead && (
              <p style={{ fontSize: '16px', margin: 0, opacity: 0.8 }}>
                {config.successSubhead}
              </p>
            )}
          </div>

          {/* Progress bar */}
          {config.showProgress !== false && !hasReached && (
            <div>
              <div style={{
                height: '12px',
                backgroundColor: '#E5E7EB',
                borderRadius: '6px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${percentage}%`,
                  backgroundColor: config.progressColor || config.accentColor || '#10B981',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ fontSize: '14px', marginTop: '8px', fontWeight: 600 }}>
                {Math.round(percentage)}% there!
              </p>
            </div>
          )}

          {/* Product recommendations */}
          {config.showProducts && !hasReached && displayProducts.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 12px 0' }}>
                Add one of these to qualify:
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
              }}>
                {displayProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => onProductClick?.(product)}
                    style={{
                      cursor: 'pointer',
                      padding: '12px',
                      border: `1px solid ${config.inputBorderColor || '#E5E7EB'}`,
                      borderRadius: '8px',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = config.accentColor || config.buttonColor}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = config.inputBorderColor || '#E5E7EB'}
                  >
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          marginBottom: '8px',
                        }}
                      />
                    )}
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                      {product.title}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>
                      {formatCurrency(product.price, config.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </BasePopup>
    );
  };

  if (!isVisible) return null;

  return config.displayStyle === 'banner' || config.displayStyle === 'sticky'
    ? renderBanner()
    : renderModal();
};

