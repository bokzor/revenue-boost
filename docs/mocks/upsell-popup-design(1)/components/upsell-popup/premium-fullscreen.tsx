"use client"

import type { UpsellPopupProps } from "./types"

export function PremiumFullscreen({ product, isOpen, onClose, onAccept, onDecline, currency = "$" }: UpsellPopupProps) {
  if (!isOpen) return null

  const discount = Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100)

  return (
    <div className="fixed inset-0 z-50 bg-card animate-in fade-in duration-300 overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-10 p-3 rounded-full bg-secondary hover:bg-muted transition-colors"
        aria-label="Close"
      >
        <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="relative h-[45vh] md:h-screen md:w-1/2 bg-muted shrink-0">
          <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
          {product.badge && (
            <div className="absolute top-4 left-4 px-4 py-1.5 text-sm font-semibold rounded-full bg-badge text-badge-foreground">
              {product.badge}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col justify-center p-6 md:p-12 lg:p-16">
          <div className="max-w-md">
            {/* Urgency message */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/20 text-warning-foreground text-sm font-medium mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Limited time offer
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-card-foreground mb-3 text-pretty">
              Complete Your Order with {product.name}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">{product.description}</p>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <ul className="space-y-3 mb-6">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-card-foreground">
                    <svg
                      className="w-5 h-5 text-success shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(product.rating!) ? "text-warning" : "text-muted"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-3xl md:text-4xl font-bold text-card-foreground">
                {currency}
                {product.salePrice.toFixed(2)}
              </span>
              <span className="text-xl text-muted-foreground line-through">
                {currency}
                {product.originalPrice.toFixed(2)}
              </span>
              <span className="px-2 py-1 text-sm font-semibold rounded bg-success/20 text-success">-{discount}%</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onAccept(product)}
                className="w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
              >
                Yes, Add to My Order!
              </button>
              <button
                onClick={onDecline}
                className="w-full py-3 px-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                No thanks, I'll pass on this deal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
