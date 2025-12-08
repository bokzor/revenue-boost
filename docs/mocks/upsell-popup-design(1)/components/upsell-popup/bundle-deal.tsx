"use client"

import type { UpsellPopupProps, Product } from "./types"

interface BundleDealProps extends Omit<UpsellPopupProps, "product"> {
  mainProduct: Product
  bundleProducts: Product[]
  bundleDiscount: number
}

export function BundleDeal({
  mainProduct,
  bundleProducts,
  bundleDiscount,
  isOpen,
  onClose,
  onAccept,
  onDecline,
  currency = "$",
}: BundleDealProps) {
  if (!isOpen) return null

  const totalOriginal = bundleProducts.reduce((sum, p) => sum + p.originalPrice, 0) + mainProduct.originalPrice
  const totalSale = (totalOriginal * (100 - bundleDiscount)) / 100

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Popup */}
      <div className="relative w-full max-w-lg animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 fade-in duration-300 bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-primary p-4 md:p-5 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 className="text-lg md:text-xl font-bold text-primary-foreground">🎉 Bundle & Save {bundleDiscount}%</h3>
          <p className="text-sm text-primary-foreground/80 mt-1">Complete your purchase with these items</p>
        </div>

        {/* Products */}
        <div className="p-4 md:p-5 space-y-3">
          {/* Main Product */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 border-2 border-primary/20">
            <div className="w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden">
              <img
                src={mainProduct.image || "/placeholder.svg"}
                alt={mainProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">In your cart</p>
              <h4 className="text-sm font-medium text-card-foreground truncate">{mainProduct.name}</h4>
              <p className="text-sm font-semibold text-card-foreground">
                {currency}
                {mainProduct.salePrice.toFixed(2)}
              </p>
            </div>
            <div className="text-lg text-primary">+</div>
          </div>

          {/* Bundle Products */}
          {bundleProducts.map((product, index) => (
            <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
              <div className="w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                {product.badge && (
                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-badge/20 text-accent mb-1">
                    {product.badge}
                  </span>
                )}
                <h4 className="text-sm font-medium text-card-foreground truncate">{product.name}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-card-foreground">
                    {currency}
                    {product.salePrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground line-through">
                    {currency}
                    {product.originalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
              {index < bundleProducts.length - 1 && <div className="text-lg text-primary">+</div>}
            </div>
          ))}
        </div>

        {/* Total & CTA */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Bundle Total:</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-card-foreground">
                {currency}
                {totalSale.toFixed(2)}
              </span>
              <span className="ml-2 text-sm text-muted-foreground line-through">
                {currency}
                {totalOriginal.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onAccept(mainProduct)}
              className="w-full py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Add Bundle to Cart
            </button>
            <button
              onClick={onDecline}
              className="w-full py-2.5 px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Just the original item
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
