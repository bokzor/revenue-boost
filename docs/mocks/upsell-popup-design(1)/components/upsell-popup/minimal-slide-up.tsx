"use client"

import type { UpsellPopupProps } from "./types"

export function MinimalSlideUp({ product, isOpen, onClose, onAccept, onDecline, currency = "$" }: UpsellPopupProps) {
  if (!isOpen) return null

  const discount = Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-foreground/20" onClick={onClose} />

      {/* Popup */}
      <div className="relative w-full max-w-lg mx-auto animate-in slide-in-from-bottom-8 duration-300 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Product Image */}
          <div className="relative w-full md:w-36 h-32 md:h-auto shrink-0 bg-muted">
            <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
            {product.badge && (
              <div className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded bg-badge text-badge-foreground">
                {product.badge}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 md:p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-base font-semibold text-card-foreground text-pretty">{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 p-1.5 -m-1.5 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Price & CTA */}
            <div className="flex items-center justify-between gap-4 mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-card-foreground">
                  {currency}
                  {product.salePrice.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {currency}
                  {product.originalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onDecline}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => onAccept(product)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
