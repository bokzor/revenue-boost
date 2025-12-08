"use client"

import { useState } from "react"
import { ClassicUpsell } from "@/components/upsell-popup/classic-upsell"
import { MinimalSlideUp } from "@/components/upsell-popup/minimal-slide-up"
import { PremiumFullscreen } from "@/components/upsell-popup/premium-fullscreen"
import { BundleDeal } from "@/components/upsell-popup/bundle-deal"
import { CountdownUrgency } from "@/components/upsell-popup/countdown-urgency"
import type { Product } from "@/components/upsell-popup/types"

const sampleProduct: Product = {
  id: "1",
  name: "Premium Wireless Headphones",
  description:
    "Experience crystal-clear audio with our noise-cancelling headphones. Perfect for work, travel, and everyday listening.",
  image: "/premium-wireless-headphones-product.jpg",
  originalPrice: 199.99,
  salePrice: 149.99,
  badge: "Best Seller",
  rating: 4.8,
  reviewCount: 2847,
  features: ["Active noise cancellation", "40-hour battery life", "Premium comfort fit", "Bluetooth 5.0 connectivity"],
}

const bundleProducts: Product[] = [
  {
    id: "2",
    name: "Carrying Case",
    description: "Protective hard case for your headphones",
    image: "/headphone-carrying-case.jpg",
    originalPrice: 39.99,
    salePrice: 29.99,
    badge: "Popular",
  },
  {
    id: "3",
    name: "Premium Audio Cable",
    description: "3.5mm gold-plated audio cable",
    image: "/premium-audio-cable-gold.jpg",
    originalPrice: 24.99,
    salePrice: 19.99,
  },
]

type PopupVariant = "classic" | "minimal" | "premium" | "bundle" | "countdown"

export default function UpsellShowcase() {
  const [activePopup, setActivePopup] = useState<PopupVariant | null>(null)

  const handleAccept = (product: Product) => {
    alert(`Added ${product.name} to cart!`)
    setActivePopup(null)
  }

  const handleDecline = () => {
    setActivePopup(null)
  }

  const variants: { id: PopupVariant; name: string; description: string }[] = [
    {
      id: "classic",
      name: "Classic Card",
      description: "Traditional centered modal with image, pricing, and clear CTAs",
    },
    {
      id: "minimal",
      name: "Minimal Slide-Up",
      description: "Compact bottom sheet ideal for mobile-first experiences",
    },
    {
      id: "premium",
      name: "Premium Fullscreen",
      description: "Immersive full-page takeover for high-value products",
    },
    {
      id: "bundle",
      name: "Bundle Deal",
      description: "Multi-product bundle offer with combined savings",
    },
    {
      id: "countdown",
      name: "Countdown Urgency",
      description: "Time-limited offer with live countdown timer",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground text-balance">Product Upsell Popup Variants</h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            5 professional, configurable popup designs for any e-commerce store. Mobile-first, plain CSS, no
            dependencies.
          </p>
        </div>
      </header>

      {/* Variant Grid */}
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => setActivePopup(variant.id)}
              className="group text-left p-5 md:p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
                  {variant.name}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{variant.description}</p>
              <div className="mt-4 flex items-center text-sm font-medium text-primary">
                Preview
                <svg
                  className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Configuration Note */}
        <div className="mt-8 md:mt-12 p-5 md:p-6 rounded-xl bg-secondary/50 border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Easy Configuration</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            All popup variants accept the same base props for easy integration:
          </p>
          <pre className="p-4 rounded-lg bg-card text-sm overflow-x-auto">
            <code className="text-muted-foreground">{`<ClassicUpsell
  product={yourProduct}
  isOpen={isOpen}
  onClose={() => setOpen(false)}
  onAccept={(product) => addToCart(product)}
  onDecline={() => setOpen(false)}
  currency="$"
/>`}</code>
          </pre>
        </div>
      </main>

      {/* Popup Variants */}
      <ClassicUpsell
        product={sampleProduct}
        isOpen={activePopup === "classic"}
        onClose={() => setActivePopup(null)}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      <MinimalSlideUp
        product={sampleProduct}
        isOpen={activePopup === "minimal"}
        onClose={() => setActivePopup(null)}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      <PremiumFullscreen
        product={sampleProduct}
        isOpen={activePopup === "premium"}
        onClose={() => setActivePopup(null)}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      <BundleDeal
        mainProduct={sampleProduct}
        bundleProducts={bundleProducts}
        bundleDiscount={25}
        isOpen={activePopup === "bundle"}
        onClose={() => setActivePopup(null)}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      <CountdownUrgency
        product={sampleProduct}
        isOpen={activePopup === "countdown"}
        onClose={() => setActivePopup(null)}
        onAccept={handleAccept}
        onDecline={handleDecline}
        expiresInSeconds={180}
      />
    </div>
  )
}
