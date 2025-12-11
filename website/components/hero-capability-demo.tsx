"use client";

/**
 * HeroCapabilityDemo - Demonstrates app capabilities with animated preview
 *
 * 8-phase customer journey:
 * 1-4: Feature showcase (Social Proof, Spin-to-Win, Upsell, Cart Recovery)
 * 5-7: Flexibility showcase (Mobile, Desktop, Theme customization)
 * 8: CTA (Go live in 60 seconds)
 */

import React, { useEffect, useState, useMemo, useRef, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Smartphone,
  Monitor,
  Palette,
  Users,
  Gift,
  ShoppingCart,
  RotateCcw,
} from "lucide-react";

// Word swipe animation component - slides words in from above
function AnimatedHeadline({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`${className} overflow-hidden inline-flex`} aria-label={text}>
      <span key={text} className="inline-block animate-word-swipe">
        {text}
      </span>
    </span>
  );
}

// Lazy load the preview component
const TemplatePreview = lazy(() =>
  import("~/domains/popups/components/preview/TemplatePreview").then((m) => ({
    default: m.TemplatePreview,
  }))
);

// Animation phases - 8-step customer journey
type DemoPhase =
  | "social-proof" // 1. Build trust
  | "spin-to-win" // 2. Capture emails
  | "upsell" // 3. Increase AOV
  | "cart-recovery" // 4. Recover sales
  | "mobile" // 5. Mobile-first
  | "desktop" // 6. Desktop experience
  | "theme" // 7. Brand colors
  | "outro"; // 8. CTA

// Recipe IDs for each phase
const PHASE_RECIPES: Record<DemoPhase, string> = {
  "social-proof": "social-proof-minimal-dark", // Dark theme
  "spin-to-win": "newsletter-spa-serenity", // Spa Serenity newsletter
  upsell: "upsell-premium-fullscreen",
  "cart-recovery": "upsell-countdown-urgency", // Flash Deal Countdown
  mobile: "upsell-premium-fullscreen",
  desktop: "upsell-premium-fullscreen",
  theme: "upsell-premium-fullscreen",
  outro: "upsell-premium-fullscreen",
};

// Override content config for specific phases (e.g., faster rotation for social proof demo)
const PHASE_CONTENT_OVERRIDES: Partial<Record<DemoPhase, Record<string, unknown>>> = {
  "social-proof": {
    rotationInterval: 1, // Fast cycling through notification types
    displayDuration: 0.5, // Quick display
  },
};

const PHASES: {
  phase: DemoPhase;
  duration: number;
  label: string;
  headline: string;
  icon: React.ReactNode;
}[] = [
  {
    phase: "social-proof",
    duration: 2500,
    label: "Social Proof",
    headline: "Build instant trust.",
    icon: <Users className="h-4 w-4" />,
  },
  {
    phase: "spin-to-win",
    duration: 2500,
    label: "Email Capture",
    headline: "Capture every visitor.",
    icon: <Gift className="h-4 w-4" />,
  },
  {
    phase: "upsell",
    duration: 2500,
    label: "Upsell",
    headline: "Boost order value.",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {
    phase: "cart-recovery",
    duration: 2500,
    label: "Cart Recovery",
    headline: "Recover lost sales.",
    icon: <RotateCcw className="h-4 w-4" />,
  },
  {
    phase: "mobile",
    duration: 2000,
    label: "Mobile-first",
    headline: "Mobile-first design.",
    icon: <Smartphone className="h-4 w-4" />,
  },
  {
    phase: "desktop",
    duration: 2000,
    label: "Desktop",
    headline: "Desktop experience.",
    icon: <Monitor className="h-4 w-4" />,
  },
  {
    phase: "theme",
    duration: 2000,
    label: "Your colors",
    headline: "Your brand colors.",
    icon: <Palette className="h-4 w-4" />,
  },
  {
    phase: "outro",
    duration: 2500,
    label: "Ready",
    headline: "Go live in 60 seconds.",
    icon: <Zap className="h-4 w-4" />,
  },
];

// Theme color presets for demonstration (flat properties for popup config)
const THEME_COLORS = {
  default: {
    accentColor: "#0E7768",
    buttonColor: "#0E7768",
    backgroundColor: "#ffffff",
    textColor: "#1a1a1a",
    buttonTextColor: "#ffffff",
  },
  theme: {
    accentColor: "#7C3AED",
    buttonColor: "#7C3AED",
    backgroundColor: "#faf5ff",
    textColor: "#1a1a1a",
    buttonTextColor: "#ffffff",
  },
};

// Size styles for each phase - desktop size throughout, mobile only for mobile phase
const DESKTOP_SIZE: React.CSSProperties = { width: "700px", height: "420px", maxWidth: "100%" };
const MOBILE_SIZE: React.CSSProperties = { width: "280px", height: "520px", maxWidth: "100%" };

const SIZE_STYLES: Record<DemoPhase, React.CSSProperties> = {
  "social-proof": DESKTOP_SIZE,
  "spin-to-win": DESKTOP_SIZE,
  upsell: DESKTOP_SIZE,
  "cart-recovery": DESKTOP_SIZE,
  mobile: MOBILE_SIZE,
  desktop: DESKTOP_SIZE,
  theme: DESKTOP_SIZE,
  outro: DESKTOP_SIZE,
};

// Scale factor for popup content per phase (shrinks the popup to fit without scrolling)
// [desktop viewport scale, mobile viewport scale]
const POPUP_SCALES: Record<DemoPhase, [number, number]> = {
  "social-proof": [1.0, 1.0], // Social proof is a small notification, no scaling needed
  "spin-to-win": [0.65, 0.38],
  upsell: [0.65, 0.38],
  "cart-recovery": [0.65, 0.38],
  mobile: [0.55, 0.5],
  desktop: [0.65, 0.38],
  theme: [0.65, 0.38],
  outro: [0.65, 0.38],
};

const PreviewSkeleton = () => (
  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-muted to-muted/50 rounded-xl">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-16 h-16 bg-primary/20 rounded-full" />
      <div className="w-48 h-6 bg-primary/10 rounded" />
    </div>
  </div>
);

// Cache for loaded recipes
type RecipeConfig = {
  templateType: string;
  contentConfig: Record<string, unknown>;
  designConfig: Record<string, unknown>;
};

export function HeroCapabilityDemo() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [recipeCache, setRecipeCache] = useState<Record<string, RecipeConfig>>({});
  const [recipesLoaded, setRecipesLoaded] = useState(false);

  const currentPhase = PHASES[phaseIndex];
  const currentRecipeId = PHASE_RECIPES[currentPhase.phase];

  // Detect mobile viewport for responsive scaling
  useEffect(() => {
    const checkMobile = () => setIsMobileViewport(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Intersection Observer to detect when section is in view
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.3 } // Trigger when 30% of section is visible
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Load all recipe configs on mount
  useEffect(() => {
    setMounted(true);
    import("~/shared/preview/recipe-marketing-data").then((module) => {
      const cache: Record<string, RecipeConfig> = {};
      const uniqueRecipeIds = [...new Set(Object.values(PHASE_RECIPES))];

      console.log("[HeroDemo] Loading recipes:", uniqueRecipeIds);

      for (const recipeId of uniqueRecipeIds) {
        const recipe = module.getStyledRecipeForMarketing(recipeId);
        if (recipe) {
          cache[recipeId] = {
            templateType: recipe.templateType,
            contentConfig: recipe.defaults.contentConfig || {},
            designConfig: recipe.defaults.designConfig || {},
          };
          console.log(`[HeroDemo] Loaded recipe: ${recipeId}`, recipe.templateType);
        } else {
          console.warn(`[HeroDemo] Recipe not found: ${recipeId}`);
        }
      }

      console.log("[HeroDemo] Cache:", Object.keys(cache));
      setRecipeCache(cache);
      setRecipesLoaded(true);
    });
  }, []);

  // Handle phase transitions: exit -> change -> enter
  const handlePhaseChange = (newIndex: number) => {
    if (newIndex === phaseIndex || isExiting) return;

    const currentRecipeId = PHASE_RECIPES[PHASES[phaseIndex].phase];
    const newRecipeId = PHASE_RECIPES[PHASES[newIndex].phase];
    const isSameRecipe = currentRecipeId === newRecipeId;

    // If same recipe (e.g., mobile/desktop/theme transitions), just change phase smoothly
    if (isSameRecipe) {
      setPhaseIndex(newIndex);
      return;
    }

    // Different recipe: do full exit -> enter animation
    // Step 1: Start exit animation
    setIsExiting(true);
    setShowPopup(true);

    // Step 2: After exit completes, change phase and hide popup briefly
    setTimeout(() => {
      setShowPopup(false);
      setPhaseIndex(newIndex);
      setIsExiting(false);

      // Step 3: Show new popup with enter animation
      setTimeout(() => {
        setShowPopup(true);
        setIsEntering(true);

        // Step 4: Clear entering state after animation
        setTimeout(() => {
          setIsEntering(false);
        }, 500);
      }, 50); // Brief delay before enter
    }, 250); // Exit animation duration
  };

  // Auto-advance phases (only when in view and not paused)
  useEffect(() => {
    if (isPaused || !isInView || isExiting) return;
    const timer = setTimeout(() => {
      handlePhaseChange((phaseIndex + 1) % PHASES.length);
    }, currentPhase.duration);
    return () => clearTimeout(timer);
  }, [phaseIndex, isPaused, isInView, currentPhase.duration, isExiting]);

  // Get current recipe config for the phase
  const currentRecipe = recipeCache[currentRecipeId];

  // Get current theme colors based on phase (flat properties for popup config)
  const themeColors = useMemo(() => {
    if (currentPhase.phase === "theme") {
      return THEME_COLORS.theme;
    }
    return THEME_COLORS.default;
  }, [currentPhase.phase]);

  // Build design config with current theme colors as flat properties
  const designConfig = useMemo(() => {
    if (!currentRecipe) return null;
    return {
      ...currentRecipe.designConfig,
      previewMode: true,
      disablePortal: true,
      // Apply theme colors as flat properties (how popup components expect them)
      ...themeColors,
    };
  }, [currentRecipe, themeColors]);

  const config = useMemo(() => {
    if (!currentRecipe) return null;
    const phaseOverrides = PHASE_CONTENT_OVERRIDES[currentPhase.phase] || {};
    return { ...currentRecipe.contentConfig, ...phaseOverrides, previewMode: true };
  }, [currentRecipe, currentPhase.phase]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-4 pb-16 pt-12 md:pb-24 md:pt-20"
    >
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

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            <span className="block">Pick a popup.</span>
            <AnimatedHeadline
              key={currentPhase.headline}
              text={currentPhase.headline}
              className="block text-primary"
            />
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
                {showPopup &&
                  (() => {
                    const scaleValue = POPUP_SCALES[currentPhase.phase][isMobileViewport ? 1 : 0];
                    // Determine animation class
                    let animationClass = "";
                    if (isExiting) animationClass = "animate-popup-exit";
                    else if (isEntering) animationClass = "animate-popup-enter";

                    return (
                      <div
                        key={`popup-${currentPhase.phase}`}
                        className={animationClass}
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
                        {mounted && recipesLoaded && currentRecipe && config && designConfig ? (
                          <Suspense fallback={<PreviewSkeleton />}>
                            <TemplatePreview
                              key={`${currentRecipeId}-${currentPhase.phase}`}
                              templateType={currentRecipe.templateType}
                              config={config}
                              designConfig={designConfig}
                            />
                          </Suspense>
                        ) : (
                          <PreviewSkeleton />
                        )}
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>

          {/* Phase dots */}
          <div className="flex justify-center gap-1.5 mt-6">
            {PHASES.map((p, index) => (
              <button
                key={p.phase}
                onClick={() => handlePhaseChange(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === phaseIndex ? "w-6 bg-primary" : "w-2 bg-primary/30 hover:bg-primary/50"
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
            <a
              href="https://apps.shopify.com/revenue-boost"
              target="_blank"
              rel="noopener noreferrer"
            >
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
  );
}
