"use client"

import type { UpsellPopupProps } from "./types"

export function ClassicUpsell({ product, isOpen, onClose, onAccept, onDecline, currency = "$" }: UpsellPopupProps) {
  if (!isOpen) return null

  const discount = Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Popup */}
      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 fade-in duration-300 bg-card rounded-xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-3 left-3 z-10 px-3 py-1 text-xs font-semibold rounded-full bg-badge text-badge-foreground">
            {product.badge}
          </div>
        )}

        {/* Product Image */}
        <div className="relative h-48 md:h-56 bg-muted">
          <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold text-card-foreground mb-2 text-pretty">{product.name}</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{product.description}</p>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-2xl md:text-3xl font-bold text-primary">
              {currency}
              {product.salePrice.toFixed(2)}
            </span>
            <span className="text-base text-muted-foreground line-through">
              {currency}
              {product.originalPrice.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-success">Save {discount}%</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onAccept(product)}
              className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Add to Cart — {currency}
              {product.salePrice.toFixed(2)}
            </button>
            <button
              onClick={onDecline}
              className="w-full py-2.5 px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              No thanks, continue without
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
