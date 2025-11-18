"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { type PopupTheme, type ThemeColors, getThemeColors } from "@/lib/popup-themes"

export type UpsellLayout = "grid" | "carousel" | "card"

export interface Product {
  id: string
  image: string
  title: string
  price: number
  compareAtPrice?: number
  rating?: number
  reviewCount?: number
  savingsPercent?: number
}

export interface ProductUpsellPopupProps {
  /** Whether the popup is open */
  isOpen: boolean
  /** Callback to close the popup */
  onClose: () => void
  /** Theme variant */
  theme?: PopupTheme
  /** Layout variant */
  layout?: UpsellLayout
  /** Main headline */
  headline?: string
  /** Subheadline description */
  subheadline?: string
  /** Array of products to display */
  products: Product[]
  /** Bundle discount percentage (e.g., 15 for 15% off when bundling) */
  bundleDiscount?: number
  /** Bundle discount message */
  bundleMessage?: string
  /** Primary CTA text */
  ctaText?: string
  /** Secondary CTA text */
  secondaryCtaText?: string
  /** Callback when products are added to cart */
  onAddToCart?: (selectedProducts: Product[]) => void | Promise<void>
  /** Callback for secondary action */
  onSecondaryAction?: () => void
  /** Custom color overrides */
  colors?: Partial<ThemeColors>
}

export function ProductUpsellPopup({
  isOpen,
  onClose,
  theme = "modern",
  layout = "grid",
  headline = "Complete Your Look",
  subheadline = "Customers who bought this also loved:",
  products = [],
  bundleDiscount = 0,
  bundleMessage = "Save {discount}% when you bundle!",
  ctaText = "Add to Cart",
  secondaryCtaText = "No Thanks",
  onAddToCart,
  onSecondaryAction,
  colors: customColors,
}: ProductUpsellPopupProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const colors = getThemeColors(theme, customColors)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen, onClose])

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const selectedProductsList = products.filter((p) => selectedProducts.has(p.id))
  const originalTotal = selectedProductsList.reduce((sum, p) => sum + p.price, 0)
  const hasBundleDiscount = bundleDiscount > 0 && selectedProducts.size > 1
  const discountAmount = hasBundleDiscount ? originalTotal * (bundleDiscount / 100) : 0
  const finalTotal = originalTotal - discountAmount

  const handleAddToCart = async () => {
    if (selectedProducts.size === 0) return
    setIsLoading(true)
    try {
      await onAddToCart?.(selectedProductsList)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSecondaryAction = () => {
    onSecondaryAction?.()
    onClose()
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % products.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="upsell-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={star <= rating ? "upsell-star-filled" : "upsell-star-empty"}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    )
  }

  const renderProducts = () => {
    if (products.length === 0) {
      return (
        <div className="upsell-empty">
          <p>No products available</p>
        </div>
      )
    }

    if (layout === "carousel") {
      const product = products[currentSlide]
      const isSelected = selectedProducts.has(product.id)

      return (
        <div className="upsell-carousel-container">
          <div className="upsell-carousel-product">
            <div className="upsell-product-image-wrapper upsell-carousel-image">
              <img src={product.image || "/placeholder.svg"} alt={product.title} className="upsell-product-image" />
              {product.savingsPercent && <div className="upsell-savings-badge">SAVE {product.savingsPercent}%</div>}
            </div>
            <div className="upsell-carousel-info">
              <h3 className="upsell-product-title upsell-carousel-title">{product.title}</h3>
              {(product.rating || product.reviewCount) && (
                <div className="upsell-rating-wrapper">
                  {product.rating && renderStars(product.rating)}
                  {product.reviewCount && <span className="upsell-review-count">({product.reviewCount})</span>}
                </div>
              )}
              <div className="upsell-price-row">
                <div className="upsell-price upsell-carousel-price">${product.price.toFixed(2)}</div>
                {product.compareAtPrice && (
                  <div className="upsell-compare-price">${product.compareAtPrice.toFixed(2)}</div>
                )}
              </div>
              <button
                onClick={() => toggleProduct(product.id)}
                className={`upsell-carousel-select-btn ${isSelected ? "selected" : ""}`}
                style={{
                  borderColor: colors.primary,
                  color: isSelected ? "#ffffff" : colors.primary,
                  background: isSelected ? colors.success : "transparent",
                }}
              >
                {isSelected ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Selected
                  </>
                ) : (
                  "Select Product"
                )}
              </button>
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="upsell-carousel-nav upsell-carousel-prev"
            style={{ background: colors.secondary, borderColor: colors.border, color: colors.text }}
            aria-label="Previous product"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="upsell-carousel-nav upsell-carousel-next"
            style={{ background: colors.secondary, borderColor: colors.border, color: colors.text }}
            aria-label="Next product"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="upsell-carousel-dots">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`upsell-carousel-dot ${index === currentSlide ? "active" : ""}`}
                style={{
                  background: index === currentSlide ? colors.primary : colors.border,
                }}
                aria-label={`Go to product ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )
    }

    if (layout === "card") {
      return (
        <div className="upsell-cards-container">
          {products.map((product) => {
            const isSelected = selectedProducts.has(product.id)
            return (
              <div key={product.id} className="upsell-card" style={{ borderColor: colors.border }}>
                <div className="upsell-card-image-wrapper" style={{ background: colors.secondary }}>
                  <img src={product.image || "/placeholder.svg"} alt={product.title} className="upsell-product-image" />
                  {product.savingsPercent && (
                    <div className="upsell-savings-badge" style={{ background: colors.warning }}>
                      SAVE {product.savingsPercent}%
                    </div>
                  )}
                </div>
                <div className="upsell-card-content" style={{ minWidth: 0 }}>
                  <h3 className="upsell-product-title" style={{ color: colors.text }}>
                    {product.title}
                  </h3>
                  {(product.rating || product.reviewCount) && (
                    <div className="upsell-rating-wrapper">
                      {product.rating && renderStars(product.rating)}
                      {product.reviewCount && (
                        <span className="upsell-review-count" style={{ color: colors.text }}>
                          ({product.reviewCount})
                        </span>
                      )}
                    </div>
                  )}
                  <div className="upsell-price-row">
                    <div className="upsell-price" style={{ color: colors.text }}>
                      ${product.price.toFixed(2)}
                    </div>
                    {product.compareAtPrice && (
                      <div className="upsell-compare-price" style={{ color: colors.text }}>
                        ${product.compareAtPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleProduct(product.id)}
                  className={`upsell-card-action-btn ${isSelected ? "selected" : ""}`}
                  style={{
                    borderColor: isSelected ? colors.success : colors.primary,
                    color: isSelected ? "#ffffff" : colors.primary,
                    background: isSelected ? colors.success : "transparent",
                  }}
                >
                  {isSelected ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Added
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                      Add
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )
    }

    // Default grid layout
    return (
      <div className="upsell-products-grid">
        {products.map((product) => {
          const isSelected = selectedProducts.has(product.id)
          return (
            <div
              key={product.id}
              className={`upsell-product ${isSelected ? "upsell-product-selected" : ""}`}
              onClick={() => toggleProduct(product.id)}
              style={{
                borderColor: isSelected ? colors.success : colors.border,
                background: isSelected ? colors.accent : colors.background,
              }}
            >
              <div className="upsell-product-image-wrapper" style={{ background: colors.secondary }}>
                <img src={product.image || "/placeholder.svg"} alt={product.title} className="upsell-product-image" />
                {product.savingsPercent && (
                  <div className="upsell-savings-badge" style={{ background: colors.warning }}>
                    SAVE {product.savingsPercent}%
                  </div>
                )}
                {isSelected && (
                  <div className="upsell-checkmark" style={{ background: colors.success }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="upsell-product-title" style={{ color: colors.text }}>
                {product.title}
              </h3>
              {(product.rating || product.reviewCount) && (
                <div className="upsell-rating-wrapper">
                  {product.rating && renderStars(product.rating)}
                  {product.reviewCount && (
                    <span className="upsell-review-count" style={{ color: colors.text }}>
                      ({product.reviewCount})
                    </span>
                  )}
                </div>
              )}
              <div className="upsell-price-row">
                <div className="upsell-price" style={{ color: colors.text }}>
                  ${product.price.toFixed(2)}
                </div>
                {product.compareAtPrice && (
                  <div className="upsell-compare-price" style={{ color: colors.text }}>
                    ${product.compareAtPrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        .upsell-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: upsellFadeIn 0.2s ease-out;
        }
        
        .upsell-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        
        .upsell-container {
          position: relative;
          width: 100%;
          max-width: 56rem;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: upsellSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          margin: 0 auto;
        }
        
        /* Adjusted close button position for more compact design */
        .upsell-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 10;
          padding: 0.5rem;
          border-radius: 9999px;
          background: var(--upsell-secondary);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--upsell-text);
        }
        
        .upsell-close:hover {
          background: var(--upsell-accent);
          transform: scale(1.1);
        }
        
        /* Significantly reduced header padding and font sizes */
        .upsell-header {
          padding: 1.25rem 1.5rem 0.875rem;
          text-align: center;
          border-bottom: 1px solid var(--upsell-border);
          flex-shrink: 0;
        }
        
        .upsell-headline {
          font-size: 1.375rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 0.375rem;
          color: var(--upsell-text);
        }
        
        .upsell-subheadline {
          font-size: 0.8125rem;
          line-height: 1.4;
          color: var(--upsell-text);
          opacity: 0.65;
        }
        
        /* More compact bundle banner */
        .upsell-bundle-banner {
          background: var(--upsell-accent);
          padding: 0.5rem 1rem;
          text-align: center;
          font-weight: 600;
          font-size: 0.8125rem;
          color: var(--upsell-primary);
          border-bottom: 1px solid var(--upsell-border);
          flex-shrink: 0;
        }
        
        /* Reduced content padding */
        .upsell-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem 1.5rem;
          min-height: 0;
        }
        
        /* Smaller grid gaps and images */
        /* Grid Layout */
        .upsell-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .upsell-product {
          position: relative;
          border: 2px solid var(--upsell-border);
          border-radius: 0.75rem;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--upsell-bg);
        }
        
        .upsell-product:hover {
          border-color: var(--upsell-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .upsell-product-selected {
          border-color: var(--upsell-success);
          background: var(--upsell-accent);
        }
        
        /* Carousel Layout */
        .upsell-carousel-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          min-height: 300px;
          padding: 1rem 3rem;
          gap: 1rem;
        }
        
        .upsell-carousel-product {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          width: 100%;
          max-width: 500px;
        }
        
        /* Significantly reduced image size to ensure details are always visible */
        .upsell-carousel-image {
          width: 100%;
          max-width: 280px;
          aspect-ratio: 1;
        }
        
        .upsell-carousel-info {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: center;
          text-align: center;
        }
        
        .upsell-carousel-title {
          font-size: 1.125rem;
          margin-bottom: 0;
          line-height: 1.3;
        }
        
        .upsell-carousel-price {
          font-size: 1.25rem;
        }
        
        .upsell-carousel-select-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          border: 2px solid var(--upsell-primary);
          background: transparent;
          color: var(--upsell-primary);
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          max-width: 280px;
          margin-bottom: 2.5rem;
        }
        
        .upsell-carousel-select-btn:hover {
          background: var(--upsell-primary);
          color: white;
        }
        
        .upsell-carousel-select-btn.selected {
          background: var(--upsell-success);
          border-color: var(--upsell-success);
          color: white;
        }
        
        .upsell-carousel-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          padding: 0.75rem;
          border-radius: 9999px;
          background: var(--upsell-secondary);
          border: 1px solid var(--upsell-border);
          cursor: pointer;
          transition: all 0.2s;
          color: var(--upsell-text);
          z-index: 2;
        }
        
        .upsell-carousel-nav:hover {
          background: var(--upsell-primary);
          color: white;
          transform: translateY(-50%) scale(1.1);
        }
        
        .upsell-carousel-prev {
          left: 0.5rem;
        }
        
        .upsell-carousel-next {
          right: 0.5rem;
        }
        
        .upsell-carousel-dots {
          position: absolute;
          bottom: 0.5rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.5rem;
          z-index: 1;
        }
        
        .upsell-carousel-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background: var(--upsell-border);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }
        
        .upsell-carousel-dot.active {
          background: var(--upsell-primary);
          width: 1.5rem;
        }
        
        /* Card Layout */
        .upsell-cards-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .upsell-card {
          display: flex;
          gap: 1rem;
          border: 2px solid var(--upsell-border);
          border-radius: 0.75rem;
          padding: 1rem 1rem 1rem 1rem;
          background: var(--upsell-bg);
          transition: all 0.2s;
          align-items: center;
        }
        
        .upsell-card:hover {
          border-color: var(--upsell-primary);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .upsell-card-image-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          flex-shrink: 0;
          border-radius: 0.5rem;
          overflow: hidden;
          background: var(--upsell-secondary);
        }
        
        .upsell-card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 0;
        }
        
        .upsell-card-action-btn {
          flex-shrink: 0;
          padding: 0.625rem 1rem;
          border-radius: 0.5rem;
          border: 2px solid var(--upsell-primary);
          background: transparent;
          color: var(--upsell-primary);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          white-space: nowrap;
          margin-left: 1.5rem;
        }
        
        .upsell-card-action-btn:hover {
          background: var(--upsell-primary);
          color: white;
        }
        
        .upsell-card-action-btn.selected {
          background: var(--upsell-success);
          border-color: var(--upsell-success);
          color: white;
        }
        
        /* Reduced product image size */
        .upsell-product-image-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          border-radius: 0.5rem;
          overflow: hidden;
          margin-bottom: 0.625rem;
          background: var(--upsell-secondary);
        }
        
        .upsell-product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .upsell-savings-badge {
          position: absolute;
          top: 0.375rem;
          right: 0.375rem;
          background: var(--upsell-badge);
          color: white;
          padding: 0.1875rem 0.4375rem;
          border-radius: 0.25rem;
          font-size: 0.6875rem;
          font-weight: 700;
        }
        
        .upsell-checkmark {
          position: absolute;
          top: 0.375rem;
          left: 0.375rem;
          width: 1.75rem;
          height: 1.75rem;
          background: var(--upsell-success);
          color: white;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: upsellCheckmark 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        /* Smaller product title and tighter spacing */
        .upsell-product-title {
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.3;
          margin-bottom: 0.375rem;
          color: var(--upsell-text);
        }
        
        .upsell-rating-wrapper {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.5rem;
        }
        
        .upsell-rating {
          display: flex;
          gap: 0.125rem;
        }
        
        .upsell-star-filled {
          color: #fbbf24;
        }
        
        .upsell-star-empty {
          color: #d1d5db;
        }
        
        .upsell-review-count {
          font-size: 0.6875rem;
          color: var(--upsell-text);
          opacity: 0.6;
        }
        
        .upsell-price-row {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        
        /* Slightly smaller price font */
        .upsell-price {
          font-size: 1rem;
          font-weight: 700;
          color: var(--upsell-text);
        }
        
        .upsell-compare-price {
          font-size: 0.8125rem;
          text-decoration: line-through;
          color: var(--upsell-text);
          opacity: 0.5;
        }
        
        .upsell-empty {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--upsell-text);
          opacity: 0.6;
        }
        
        /* More compact footer */
        .upsell-footer {
          border-top: 2px solid var(--upsell-border);
          padding: 0.875rem 1.5rem;
          background: var(--upsell-secondary);
          flex-shrink: 0;
        }
        
        .upsell-summary {
          margin-bottom: 0.625rem;
        }
        
        .upsell-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.375rem;
          font-size: 0.8125rem;
          color: var(--upsell-text);
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
          border-top: 1px solid var(--upsell-border);
          margin-bottom: 0.375rem;
        }
        
        .upsell-summary-savings {
          color: var(--upsell-success);
          font-size: 0.8125rem;
          font-weight: 600;
        }
        
        .upsell-actions {
          display: flex;
          gap: 0.625rem;
          flex-direction: row;
        }
        
        .upsell-btn {
          flex: 1;
          padding: 0.625rem 0.875rem;
          border-radius: 0.5rem;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .upsell-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .upsell-btn-primary {
          background: var(--upsell-primary);
          color: white;
        }
        
        .upsell-btn-primary:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .upsell-btn-secondary {
          background: transparent;
          color: var(--upsell-text);
          border: 1px solid var(--upsell-border);
        }
        
        .upsell-btn-secondary:hover {
          background: var(--upsell-accent);
        }
        
        .upsell-spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 9999px;
          animation: upsellSpin 0.6s linear infinite;
        }
        
        .upsell-cart-icon {
          width: 1.25rem;
          height: 1.25rem;
        }
        
        .upsell-cart-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.25rem;
          height: 1.25rem;
          padding: 0 0.25rem;
          background: white;
          color: var(--upsell-primary);
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        
        @keyframes upsellFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes upsellSlideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes upsellCheckmark {
          from { 
            transform: scale(0);
          }
          to { 
            transform: scale(1);
          }
        }
        
        @keyframes upsellSpin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          /* Adjusted grid layout for smaller screens */
          .upsell-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 0.875rem;
          }
          
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
          
          .upsell-btn {
            font-size: 0.8125rem;
            padding: 0.5625rem 0.75rem;
          }
          
          .upsell-carousel-container {
            padding: 0.75rem 2.5rem;
            min-height: 280px;
          }
          
          .upsell-carousel-product {
            gap: 0.75rem;
          }
          
          .upsell-carousel-image {
            max-width: 220px;
          }
          
          .upsell-carousel-title {
            font-size: 1rem;
          }
          
          .upsell-carousel-price {
            font-size: 1.125rem;
          }
          
          .upsell-carousel-select-btn {
            padding: 0.625rem 1.25rem;
            font-size: 0.875rem;
            max-width: 220px;
            margin-bottom: 2rem;
          }
          
          .upsell-rating-wrapper {
            gap: 0.25rem;
            margin-bottom: 0.25rem;
          }
          
          /* Card layout: stack vertically with full-width button on mobile */
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
            width: 100%;
            margin-left: 0;
            margin-top: 0.5rem;
            justify-content: center;
            padding: 0.75rem 1rem;
          }
        }
        
        /* Enhanced height constraints for tablets and small screens */
        @media (max-height: 700px) {
          .upsell-header {
            padding: 1rem 1.5rem 0.75rem;
          }
          
          .upsell-headline {
            font-size: 1.25rem;
          }
          
          .upsell-subheadline {
            font-size: 0.75rem;
          }
          
          .upsell-bundle-banner {
            padding: 0.375rem 1rem;
            font-size: 0.75rem;
          }
          
          .upsell-content {
            padding: 1rem 1.5rem;
          }
          
          .upsell-footer {
            padding: 0.75rem 1.5rem;
          }
          
          .upsell-summary {
            margin-bottom: 0.5rem;
          }
          
          .upsell-summary-row {
            font-size: 0.75rem;
            margin-bottom: 0.25rem;
          }
          
          .upsell-summary-total {
            font-size: 1rem;
            padding-top: 0.375rem;
          }
          
          .upsell-btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.8125rem;
          }
          
          .upsell-products-grid {
            gap: 0.75rem;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
          
          .upsell-product {
            padding: 0.5rem;
          }
          
          .upsell-product-image-wrapper {
            margin-bottom: 0.5rem;
          }
          
          .upsell-product-title {
            font-size: 0.75rem;
            margin-bottom: 0.25rem;
          }
          
          .upsell-price {
            font-size: 0.875rem;
          }
          
          .upsell-compare-price {
            font-size: 0.75rem;
          }
          
          .upsell-savings-badge {
            font-size: 0.625rem;
            padding: 0.125rem 0.375rem;
          }
          
          .upsell-checkmark {
            width: 1.5rem;
            height: 1.5rem;
          }
          
          .upsell-rating-wrapper {
            gap: 0.25rem;
            margin-bottom: 0.25rem;
          }
        }
        
        /* Even more aggressive optimization for very short screens */
        @media (max-height: 600px) {
          .upsell-container {
            max-height: 95vh;
          }
          
          .upsell-header {
            padding: 0.75rem 1.25rem 0.625rem;
          }
          
          .upsell-headline {
            font-size: 1.125rem;
            margin-bottom: 0.25rem;
          }
          
          .upsell-subheadline {
            font-size: 0.6875rem;
          }
          
          .upsell-bundle-banner {
            padding: 0.3125rem 0.875rem;
            font-size: 0.6875rem;
          }
          
          .upsell-content {
            padding: 0.75rem 1.25rem;
          }
          
          .upsell-footer {
            padding: 0.625rem 1.25rem;
          }
          
          .upsell-products-grid {
            gap: 0.625rem;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }
          
          .upsell-product {
            padding: 0.4375rem;
          }
          
          .upsell-product-image-wrapper {
            margin-bottom: 0.375rem;
          }
          
          .upsell-product-title {
            font-size: 0.6875rem;
          }
          
          .upsell-summary-row {
            font-size: 0.6875rem;
          }
          
          .upsell-summary-total {
            font-size: 0.9375rem;
          }
          
          .upsell-btn {
            padding: 0.4375rem 0.625rem;
            font-size: 0.75rem;
          }
          
          .upsell-carousel-container {
            padding: 0.625rem 2rem;
            min-height: 220px;
            gap: 0.5rem;
          }
          
          .upsell-carousel-product {
            gap: 0.5rem;
          }
          
          .upsell-carousel-image {
            max-width: 160px;
          }
          
          .upsell-carousel-title {
            font-size: 0.875rem;
          }
          
          .upsell-carousel-price {
            font-size: 1rem;
          }
          
          .upsell-carousel-select-btn {
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
            max-width: 160px;
            margin-bottom: 1.75rem;
          }
        }
      `}</style>

      <div className="upsell-overlay">
        <div className="upsell-backdrop" onClick={onClose} aria-hidden="true" />

        <div
          className="upsell-container"
          style={
            {
              background: colors.background,
              "--upsell-bg": colors.background,
              "--upsell-text": colors.text,
              "--upsell-primary": colors.primary,
              "--upsell-secondary": colors.secondary,
              "--upsell-accent": colors.accent,
              "--upsell-border": colors.border,
              "--upsell-success": colors.success,
              "--upsell-badge": colors.warning,
            } as React.CSSProperties
          }
        >
          <button onClick={onClose} className="upsell-close" aria-label="Close popup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="upsell-header">
            <h2 className="upsell-headline">{headline}</h2>
            <p className="upsell-subheadline">{subheadline}</p>
          </div>

          {hasBundleDiscount && (
            <div className="upsell-bundle-banner">
              ✨ {bundleMessage.replace("{discount}", bundleDiscount.toString())}
            </div>
          )}

          <div className="upsell-content">{renderProducts()}</div>

          <div className="upsell-footer">
            {selectedProducts.size > 0 && (
              <div className="upsell-summary">
                <div className="upsell-summary-row">
                  <span className="upsell-summary-label">
                    {selectedProducts.size} {selectedProducts.size === 1 ? "item" : "items"} selected
                  </span>
                  {hasBundleDiscount && (
                    <span className="upsell-summary-value upsell-summary-original">${originalTotal.toFixed(2)}</span>
                  )}
                </div>
                <div className="upsell-summary-row upsell-summary-total">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
                {hasBundleDiscount && (
                  <div className="upsell-summary-row">
                    <span className="upsell-summary-savings">You save ${discountAmount.toFixed(2)}!</span>
                  </div>
                )}
              </div>
            )}

            <div className="upsell-actions">
              <button
                onClick={handleAddToCart}
                disabled={selectedProducts.size === 0 || isLoading}
                className="upsell-btn upsell-btn-primary"
                style={{ background: colors.primary }}
              >
                {isLoading ? (
                  <>
                    <div className="upsell-spinner" />
                    Adding...
                  </>
                ) : (
                  <>
                    <svg
                      className="upsell-cart-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 2L7 6H20L18 2H9Z" />
                      <path d="M7 6L5 22H19L17 6" />
                      <circle cx="9" cy="20" r="1" fill="currentColor" />
                      <circle cx="15" cy="20" r="1" fill="currentColor" />
                    </svg>
                    {selectedProducts.size > 0 ? (
                      <>
                        {ctaText}
                        <span className="upsell-cart-count" style={{ color: colors.primary }}>
                          {selectedProducts.size}
                        </span>
                      </>
                    ) : (
                      ctaText
                    )}
                  </>
                )}
              </button>
              {secondaryCtaText && (
                <button onClick={handleSecondaryAction} className="upsell-btn upsell-btn-secondary">
                  {secondaryCtaText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
