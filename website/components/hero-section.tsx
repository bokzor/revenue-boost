"use client"

import { useEffect, useState, Suspense, lazy, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ShieldCheck, Zap, CheckCircle2 } from "lucide-react"

// Recipe IDs to rotate through (user-specified selection)
const HERO_RECIPES = [
  { id: "upsell-classic-modal", name: "Classic Upsell Modal", animateSize: false },
  { id: "social-proof-complete", name: "Complete Social Proof", animateSize: false },
  { id: "cart-discount-incentive", name: "Discount Incentive", animateSize: false },
  { id: "upsell-complete-the-look", name: "Complete the Look", animateSize: false },
  { id: "free-gift-with-purchase", name: "Free Gift with Purchase", animateSize: false },
  { id: "tiered-discount", name: "Spend More, Save More", animateSize: false },
  { id: "spin-to-win-minimal-mono", name: "Minimal Mono", animateSize: false },
  { id: "newsletter-spa-serenity", name: "Spa Serenity", animateSize: true },
] as const

type SizeType = "small" | "medium" | "large"
const SIZES: SizeType[] = ["small", "medium", "large"]
const SIZE_ROTATION_INTERVAL = 1500 // How fast to cycle sizes for animated recipes

// Rotation interval in ms
const ROTATION_INTERVAL = 4000

// Lazy load the preview component
const RecipePopupPreview = lazy(() => import("./recipe-popup-preview"))

const PreviewSkeleton = () => {
  return (
    <div className="flex items-center justify-center w-full max-w-[420px] aspect-[4/5] bg-gradient-to-br from-muted to-muted/50 rounded-2xl">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-[#0E7768]/20 rounded-full" />
        <div className="w-48 h-6 bg-[#0E7768]/10 rounded" />
        <div className="w-32 h-4 bg-[#0E7768]/5 rounded" />
      </div>
    </div>
  )
}

export function HeroSection() {
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [sizeIndex, setSizeIndex] = useState(0)

  const currentRecipe = HERO_RECIPES[currentRecipeIndex]

  // Size cycling for recipes with animateSize: true (only Spa Serenity)
  useEffect(() => {
    if (!currentRecipe.animateSize || isPaused) {
      setSizeIndex(1) // Reset to medium when not animating
      return
    }

    const timer = setInterval(() => {
      setSizeIndex((prev) => (prev + 1) % SIZES.length)
    }, SIZE_ROTATION_INTERVAL)

    return () => clearInterval(timer)
  }, [currentRecipe.animateSize, isPaused])

  // Current size: animated for Spa Serenity, fixed "medium" for others
  const currentSize: SizeType = currentRecipe.animateSize ? SIZES[sizeIndex] : "medium"

  // Auto-rotate recipes
  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setCurrentRecipeIndex((prev) => (prev + 1) % HERO_RECIPES.length)
    }, ROTATION_INTERVAL)

    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-12 md:pb-24 md:pt-20">
      {/* Background gradient: brand colors #AEE5AB → #0E7768 */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#AEE5AB]/10 via-transparent to-transparent" />
      <div className="absolute -left-40 -top-40 -z-10 h-80 w-80 rounded-full bg-[#AEE5AB]/15 blur-3xl" />
      <div className="absolute -right-40 top-20 -z-10 h-80 w-80 rounded-full bg-[#0E7768]/15 blur-3xl" />

      <div className="container mx-auto">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left">
            <Badge variant="secondary" className="mb-6 gap-2 px-4 py-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>75+ Ready-to-Use Designs</span>
            </Badge>

            <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Pick a popup.{" "}
              <span className="text-primary">
                Go live in 60 seconds.
              </span>
            </h1>

            <p className="mx-auto lg:mx-0 mb-8 max-w-xl text-pretty text-lg text-muted-foreground">
              Expert-designed popups ready to use. Just add your brand colors and launch.
              No design skills needed.
            </p>

            <div className="flex flex-col items-center lg:items-start gap-4 sm:flex-row">
              <Button size="lg" className="gap-2 px-8" asChild>
                <a href="https://apps.shopify.com/revenue-boost" target="_blank" rel="noopener noreferrer">
                  Install Free on Shopify
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <a href="/designs">
                  Browse All Designs
                </a>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>&lt;25KB • Zero slowdown</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>A/B testing built-in</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Auto discount codes</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>All themes supported</span>
              </div>
            </div>
          </div>

          {/* Right: Rotating Recipe Preview with responsive size transitions */}
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Recipe indicator dots */}
            <div className="flex justify-center gap-1.5 mb-4 flex-wrap max-w-xs mx-auto">
              {HERO_RECIPES.map((recipe, index) => (
                <button
                  key={recipe.id}
                  onClick={() => setCurrentRecipeIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentRecipeIndex
                      ? "w-6 bg-[#0E7768]"
                      : "w-2 bg-[#0E7768]/30 hover:bg-[#0E7768]/50"
                  }`}
                  aria-label={`Show ${recipe.name} preview`}
                />
              ))}
            </div>

            {/* Preview container - responsive */}
            <div className="flex justify-center items-center px-4">
              <Suspense fallback={<PreviewSkeleton />}>
                <RecipePopupPreview
                  recipeId={currentRecipe.id}
                  size={currentSize}
                />
              </Suspense>
            </div>

            {/* Recipe name label */}
            <div className="flex justify-center mt-4 gap-2">
              <Badge variant="outline" className="text-xs">
                {currentRecipe.name}
              </Badge>
            </div>

            {/* Pause hint */}
            <p className="text-center text-xs text-muted-foreground mt-2">
              Hover to pause • Click dots to navigate
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
