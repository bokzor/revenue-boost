"use client"

/**
 * HeroCapabilityDemo - Demonstrates app capabilities with animated preview
 * 
 * Shows a single popup (Premium Fullscreen Experience) that:
 * 1. Animates from mobile → desktop size (responsive demonstration)
 * 2. Changes CSS color variables (brand color demonstration)
 * 3. Has explanatory text for what's happening
 */

import React, { useEffect, useState, useMemo, useRef, lazy, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ShieldCheck, Zap, CheckCircle2, Smartphone, Monitor, Palette } from "lucide-react"

// Lazy load the preview component
const TemplatePreview = lazy(() => 
  import("~/domains/popups/components/preview/TemplatePreview").then(m => ({ default: m.TemplatePreview }))
)

// Animation phases
type DemoPhase = "mobile" | "desktop" | "theme-1" | "theme-2" | "theme-3"

const PHASES: { phase: DemoPhase; duration: number; label: string; icon: React.ReactNode }[] = [
  { phase: "mobile", duration: 2500, label: "Mobile-first design", icon: <Smartphone className="h-4 w-4" /> },
  { phase: "desktop", duration: 2500, label: "Desktop experience", icon: <Monitor className="h-4 w-4" /> },
  { phase: "theme-1", duration: 2000, label: "Your brand colors", icon: <Palette className="h-4 w-4" /> },
  { phase: "theme-2", duration: 2000, label: "Any color scheme", icon: <Palette className="h-4 w-4" /> },
  { phase: "theme-3", duration: 2000, label: "Perfect match", icon: <Palette className="h-4 w-4" /> },
]

// Theme color presets for demonstration (flat properties for popup config)
const THEME_COLORS = {
  default: {
    accentColor: "#0E7768",
    buttonColor: "#0E7768",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    buttonTextColor: "#ffffff",
  },
  "theme-1": {
    accentColor: "#7C3AED",
    buttonColor: "#7C3AED",
    backgroundColor: "#faf5ff",
    textColor: "#1a1a1a",
    buttonTextColor: "#ffffff",
  },
  "theme-2": {
    accentColor: "#DC2626",
    buttonColor: "#DC2626",
    backgroundColor: "#fef2f2",
    textColor: "#1a1a1a",
    buttonTextColor: "#ffffff",
  },
  "theme-3": {
    accentColor: "#EA580C",
    buttonColor: "#EA580C",
    backgroundColor: "#fff7ed",
    textColor: "#1a1a1a",
    buttonTextColor: "#ffffff",
  },
}

// Size styles for each phase - use fixed heights to avoid aspectRatio transition issues
const SIZE_STYLES: Record<DemoPhase, React.CSSProperties> = {
  mobile: { width: "280px", height: "520px", maxWidth: "100%" },
  desktop: { width: "700px", height: "420px", maxWidth: "100%" },
  "theme-1": { width: "700px", height: "420px", maxWidth: "100%" },
  "theme-2": { width: "700px", height: "420px", maxWidth: "100%" },
  "theme-3": { width: "700px", height: "420px", maxWidth: "100%" },
}

// Scale factor for popup content per phase (shrinks the popup to fit without scrolling)
// [desktop viewport scale, mobile viewport scale]
const POPUP_SCALES: Record<DemoPhase, [number, number]> = {
  mobile: [0.55, 0.50],
  desktop: [0.65, 0.38],
  "theme-1": [0.65, 0.38],
  "theme-2": [0.65, 0.38],
  "theme-3": [0.65, 0.38],
}

const PreviewSkeleton = () => (
  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-muted to-muted/50 rounded-xl">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-16 h-16 bg-primary/20 rounded-full" />
      <div className="w-48 h-6 bg-primary/10 rounded" />
    </div>
  </div>
)

export function HeroCapabilityDemo() {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isInView, setIsInView] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const [recipeConfig, setRecipeConfig] = useState<{
    templateType: string
    contentConfig: Record<string, unknown>
    designConfig: Record<string, unknown>
  } | null>(null)

  const currentPhase = PHASES[phaseIndex]

  // Detect mobile viewport for responsive scaling
  useEffect(() => {
    const checkMobile = () => setIsMobileViewport(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Intersection Observer to detect when section is in view
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.3 } // Trigger when 30% of section is visible
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  // Load recipe config on mount
  useEffect(() => {
    setMounted(true)
    import("~/shared/preview/recipe-marketing-data").then((module) => {
      const recipe = module.getStyledRecipeForMarketing("upsell-premium-fullscreen")
      if (recipe) {
        setRecipeConfig({
          templateType: recipe.templateType,
          contentConfig: recipe.defaults.contentConfig || {},
          designConfig: recipe.defaults.designConfig || {},
        })
      }
    })
  }, [])

  // Auto-advance phases (only when in view and not paused)
  useEffect(() => {
    if (isPaused || !isInView) return
    const timer = setTimeout(() => {
      setPhaseIndex((prev) => (prev + 1) % PHASES.length)
    }, currentPhase.duration)
    return () => clearTimeout(timer)
  }, [phaseIndex, isPaused, isInView, currentPhase.duration])

  // Get current theme colors based on phase (flat properties for popup config)
  const themeColors = useMemo(() => {
    if (currentPhase.phase.startsWith("theme-")) {
      return THEME_COLORS[currentPhase.phase as keyof typeof THEME_COLORS]
    }
    return THEME_COLORS.default
  }, [currentPhase.phase])

  // Build design config with current theme colors as flat properties
  const designConfig = useMemo(() => {
    if (!recipeConfig) return null
    return {
      ...recipeConfig.designConfig,
      previewMode: true,
      disablePortal: true,
      // Apply theme colors as flat properties (how popup components expect them)
      ...themeColors,
    }
  }, [recipeConfig, themeColors])

  const config = useMemo(() => {
    if (!recipeConfig) return null
    return { ...recipeConfig.contentConfig, previewMode: true }
  }, [recipeConfig])

  // Determine if we're in "size" or "theme" demonstration
  const isThemePhase = currentPhase.phase.startsWith("theme-")
  const isSizePhase = !isThemePhase

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-4 pb-16 pt-12 md:pb-24 md:pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#AEE5AB]/10 via-transparent to-transparent" />
      <div className="absolute -left-40 -top-40 -z-10 h-80 w-80 rounded-full bg-[#AEE5AB]/15 blur-3xl" />
      <div className="absolute -right-40 top-20 -z-10 h-80 w-80 rounded-full bg-[#0E7768]/15 blur-3xl" />

      <div className="container mx-auto">
        {/* Header text */}
        <div className="text-center mb-8 lg:mb-12">
          <Badge variant="secondary" className="mb-6 gap-2 px-4 py-2">
            <Zap className="h-4 w-4 text-primary" />
            <span>40+ Ready-to-Use Designs</span>
          </Badge>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Pick a popup.{" "}
            <span className="text-primary">Go live in 60 seconds.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-pretty text-lg text-muted-foreground">
            Expert-designed popups ready to use. Just add your brand colors and launch.
          </p>
        </div>

        {/* Demo Area */}
        <div
          className="relative mb-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Phase indicator + explanation */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border">
              {currentPhase.icon}
              <span className="font-medium text-sm">{currentPhase.label}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md text-center">
              {isSizePhase
                ? "Watch how the popup adapts perfectly to every screen size"
                : "Apply your brand colors with one click — works with any theme"}
            </p>
          </div>

          {/* Preview container with smooth size transitions */}
          <div className="flex justify-center items-center">
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl bg-white transition-all duration-700 ease-out"
              style={SIZE_STYLES[currentPhase.phase]}
            >
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-100 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 ml-2 px-2.5 py-1 bg-white rounded text-xs text-gray-500 border border-gray-200 truncate">
                  your-store.myshopify.com
                </div>
              </div>

              {/* Popup content - scaled down to fit without scrolling */}
              <div className="relative h-[calc(100%-36px)] overflow-hidden bg-gray-50">
                {(() => {
                  const scaleValue = POPUP_SCALES[currentPhase.phase][isMobileViewport ? 1 : 0]
                  return (
                    <div
                      className="transition-all duration-700 ease-out"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: `${100 / scaleValue}%`,
                        height: `${100 / scaleValue}%`,
                        transform: `translate(-50%, -50%) scale(${scaleValue})`,
                        transformOrigin: "center center",
                      }}
                    >
                      {mounted && recipeConfig && config && designConfig ? (
                        <Suspense fallback={<PreviewSkeleton />}>
                          <TemplatePreview
                            templateType={recipeConfig.templateType}
                            config={config}
                            designConfig={designConfig}
                          />
                        </Suspense>
                      ) : (
                        <PreviewSkeleton />
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Phase dots */}
          <div className="flex justify-center gap-1.5 mt-6">
            {PHASES.map((p, index) => (
              <button
                key={p.phase}
                onClick={() => setPhaseIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === phaseIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-primary/30 hover:bg-primary/50"
                }`}
                aria-label={`Show ${p.label}`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Hover to pause • Click dots to navigate
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="gap-2 px-8" asChild>
            <a href="https://apps.shopify.com/revenue-boost" target="_blank" rel="noopener noreferrer">
              Install Free on Shopify
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" className="gap-2" asChild>
            <a href="/designs">Browse All Designs</a>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
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
    </section>
  )
}

