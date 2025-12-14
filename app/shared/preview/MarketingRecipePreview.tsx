/**
 * MarketingRecipePreview Component
 *
 * A marketing site version of MiniPopupPreview that renders recipe previews
 * with the same structure as the admin (DeviceFrame + ShadowDomWrapper).
 *
 * Features:
 * - Uses the same rendering approach as admin's MiniPopupPreview
 * - DeviceFrame with iPhone dimensions for consistent preview
 * - ShadowDomWrapper for CSS isolation
 * - Two-layer scaling with container query support
 * - Self-contained - no ~/config imports that break website build
 *
 * Usage:
 * ```tsx
 * <MarketingRecipePreview
 *   recipeId="newsletter-elegant-luxe"
 *   width={300}
 *   height={280}
 * />
 * ```
 */

import React, { useMemo, useRef, useState, useLayoutEffect } from "react";
import type { StyledRecipe } from "~/domains/campaigns/recipes/styled-recipe-types";
import { getStyledRecipeForMarketing, type MarketingRecipe } from "./recipe-marketing-data";
import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { DeviceFrame } from "./DeviceFrame";
import { ShadowDomWrapper } from "~/domains/campaigns/components/recipes/ShadowDomWrapper";

// Inline background preset filenames to avoid ~/config imports that break website build
// Maps preset ID to filename (relative to public folder)
const BACKGROUND_PRESET_FILENAMES: Record<string, string> = {
  // Flash sale backgrounds
  "fs-bg-summer": "recipes/flash-sale/summer.jpg",
  "fs-bg-black-friday": "recipes/flash-sale/black-friday-center-negative.jpg",
  "fs-bg-christmas": "recipes/flash-sale/christman-center-negative.jpg",
  "fs-bg-valentine": "recipes/flash-sale/valentine-day-negative-center.jpg",
  "fs-bg-easter": "recipes/flash-sale/easter-negative-center.jpg",
  "fs-bg-halloween": "recipes/flash-sale/halloween-center-negative.jpg",
  "fs-bg-thanksgiving": "recipes/flash-sale/thanksgivin-center-negative.jpg",
  "fs-bg-new-year": "recipes/flash-sale/new-year-center-negative.jpg",
  "fs-bg-winter": "recipes/flash-sale/winter-negative-center.jpg",
  "fs-bg-back-to-school": "recipes/flash-sale/back-to-school-center-negative.jpg",
  // Newsletter backgrounds (in newsletter-backgrounds folder)
  "bg-modern": "newsletter-backgrounds/modern.jpg",
  "bg-minimal": "newsletter-backgrounds/minimal.jpg",
  "bg-bold": "newsletter-backgrounds/bold.jpg",
  "bg-elegant": "newsletter-backgrounds/elegant.jpg",
  "bg-dark": "newsletter-backgrounds/dark.jpg",
  "bg-luxury": "newsletter-backgrounds/luxury.jpg",
  "bg-neon": "newsletter-backgrounds/neon.jpg",
  "bg-ocean": "newsletter-backgrounds/ocean.jpg",
  "bg-summer": "newsletter-backgrounds/summer.jpg",
  "bg-gradient": "newsletter-backgrounds/gradient.jpg",
  "bg-glass": "newsletter-backgrounds/glass.jpg",
  "bg-christmas": "newsletter-backgrounds/christmas.jpg",
};

// Device type for preview
export type PreviewDevice = "mobile" | "desktop";

// iPhone 14 dimensions (same as admin's MiniPopupPreview)
const IPHONE_14_WIDTH = 390;
const IPHONE_14_HEIGHT = 844;
const DEVICE_FRAME_BORDER = 24;

// Desktop browser dimensions
const DESKTOP_WIDTH = 1280;
const DESKTOP_HEIGHT = 800;
const DESKTOP_CHROME_HEIGHT = 40;

// Virtual viewport: iPhone + device frame border
const MOBILE_VIRTUAL_WIDTH = IPHONE_14_WIDTH + DEVICE_FRAME_BORDER;
const MOBILE_VIRTUAL_HEIGHT = IPHONE_14_HEIGHT + DEVICE_FRAME_BORDER;

// Desktop uses the full browser dimensions
const DESKTOP_VIRTUAL_WIDTH = DESKTOP_WIDTH;
const DESKTOP_VIRTUAL_HEIGHT = DESKTOP_HEIGHT + DESKTOP_CHROME_HEIGHT;

export interface MarketingRecipePreviewProps {
  /** The recipe ID or MarketingRecipe object */
  recipe: string | MarketingRecipe;

  /** Width of the preview container */
  width?: number | string;

  /** Height of the preview container */
  height?: number | string;

  /** Whether to show recipe info below the preview */
  showInfo?: boolean;

  /** Device mode - mobile or desktop */
  device?: PreviewDevice;

  /** If true, fills container at 100% without scaling (best for desktop modals) */
  fillContainer?: boolean;

  /** Custom class name */
  className?: string;

  /** Custom styles */
  style?: React.CSSProperties;
}

export const MarketingRecipePreview: React.FC<MarketingRecipePreviewProps> = ({
  recipe,
  width = "100%",
  height = 280,
  showInfo = false,
  device = "mobile",
  fillContainer = false,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Get the full recipe data
  const recipeId = typeof recipe === "string" ? recipe : recipe.id;
  const fullRecipe = useMemo(() => getStyledRecipeForMarketing(recipeId), [recipeId]);

  // Determine virtual dimensions based on device
  const VIRTUAL_WIDTH = device === "desktop" ? DESKTOP_VIRTUAL_WIDTH : MOBILE_VIRTUAL_WIDTH;
  const VIRTUAL_HEIGHT = device === "desktop" ? DESKTOP_VIRTUAL_HEIGHT : MOBILE_VIRTUAL_HEIGHT;

  // Measure container on mount and resize
  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate scale to fit entire popup in container (same logic as MiniPopupPreview)
  const effectiveScale = useMemo(() => {
    const { width: cw, height: ch } = containerDimensions;

    // If dimensions are too small (likely measuring before layout is complete),
    // use a reasonable fallback. With aspect-ratio: 9/16 parent, we expect
    // reasonable dimensions. Anything under 50px is likely a measurement error.
    if (cw < 50 || ch < 50) return 0.35; // Fallback while measuring

    // Add some padding (90% of container) so popup doesn't touch edges
    const padding = 0.9;
    const scaleX = (cw * padding) / VIRTUAL_WIDTH;
    const scaleY = (ch * padding) / VIRTUAL_HEIGHT;

    // Use minimum scale to ensure entire popup fits
    // Also clamp to reasonable bounds to prevent extreme scales
    const calculatedScale = Math.min(scaleX, scaleY);
    return Math.max(0.1, Math.min(calculatedScale, 1.0));
  }, [containerDimensions]);

  if (!fullRecipe) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#999" }}>
        Recipe not found: {recipeId}
      </div>
    );
  }

  // Build content config from recipe defaults
  const contentConfig = useMemo(
    () => ({
      ...fullRecipe.defaults.contentConfig,
      discountConfig: fullRecipe.defaults.discountConfig,
      previewMode: true,
    }),
    [fullRecipe]
  );

  // Build design config from recipe
  const designConfig = useMemo(() => buildDesignConfig(fullRecipe), [fullRecipe]);

  // Template preview content (shared between scaled and fill modes)
  const templateContent = (
    <TemplatePreview
      templateType={fullRecipe.templateType}
      config={contentConfig}
      designConfig={designConfig}
    />
  );

  // fillContainer mode: render at 100% without scaling (for desktop modals)
  const previewElement = fillContainer ? (
    <div
      className={!showInfo ? className : undefined}
      style={{
        position: "relative",
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        borderRadius: "8px",
        backgroundColor: "#f6f6f7",
        ...(!showInfo ? style : {}),
      }}
    >
      <ShadowDomWrapper
        style={{
          position: "absolute",
          inset: 0,
        }}
      >
        <DeviceFrame device={device}>
          {templateContent}
        </DeviceFrame>
      </ShadowDomWrapper>
    </div>
  ) : (
    // Scaled mode: fit content into container with scaling (for thumbnails)
    <div
      ref={containerRef}
      className={!showInfo ? className : undefined}
      style={{
        position: "relative",
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        borderRadius: "8px",
        backgroundColor: "#f6f6f7",
        ...(!showInfo ? style : {}),
      }}
    >
      {/* Fill the entire container */}
      <ShadowDomWrapper
        style={{
          position: "absolute",
          inset: 0,
        }}
      >
        {/* Clip container - fills the entire available space */}
        <div
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Inner viewport - renders at full size so container queries work */}
          <div
            style={{
              width: VIRTUAL_WIDTH,
              height: VIRTUAL_HEIGHT,
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${effectiveScale})`,
              transformOrigin: "center center",
              // Enable container queries for popup components
              containerType: "inline-size",
              containerName: "popup-viewport",
            } as React.CSSProperties}
          >
            {/* Device frame for consistent preview (same as admin) */}
            <DeviceFrame device={device}>
              {templateContent}
            </DeviceFrame>
          </div>
        </div>
      </ShadowDomWrapper>
    </div>
  );

  // Simple render without wrapper if no info needed
  if (!showInfo) {
    return previewElement;
  }

  // With info, wrap in flex container
  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        ...style,
      }}
    >
      {previewElement}
      <RecipeInfo recipe={fullRecipe} />
    </div>
  );
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const RecipeInfo: React.FC<{ recipe: StyledRecipe }> = ({ recipe }) => (
  <div style={{ textAlign: "center", maxWidth: "300px" }}>
    <div style={{ fontSize: "24px", marginBottom: "8px" }}>{recipe.icon}</div>
    <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 600, color: "#1F2937" }}>
      {recipe.name}
    </h3>
    <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#6B7280" }}>
      {recipe.tagline}
    </p>
  </div>
);

// =============================================================================
// THEME DATA & HELPER FUNCTIONS
// =============================================================================

/**
 * Theme colors for marketing preview.
 * Matches NEWSLETTER_THEMES from ~/config/color-presets.ts
 */
const MARKETING_THEMES: Record<string, {
  background: string;
  text: string;
  primary: string;
  ctaBg?: string;
  ctaText?: string;
}> = {
  // Generic themes
  modern: {
    background: "#ffffff",
    text: "#111827",
    primary: "#3b82f6",
    ctaBg: "#3b82f6",
    ctaText: "#ffffff",
  },
  minimal: {
    background: "#fafafa",
    text: "#18181b",
    primary: "#18181b",
    ctaBg: "#18181b",
    ctaText: "#ffffff",
  },
  dark: {
    background: "#111827",
    text: "#f9fafb",
    primary: "#3b82f6",
    ctaBg: "#3b82f6",
    ctaText: "#ffffff",
  },
  gradient: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    text: "#ffffff",
    primary: "#e0e7ff",
    ctaBg: "#ffffff",
    ctaText: "#667eea",
  },
  luxury: {
    background: "#1a1a0a",
    text: "#d4af37",
    primary: "#d4af37",
    ctaBg: "#d4af37",
    ctaText: "#1a1a0a",
  },
  neon: {
    background: "#0a0a0a",
    text: "#00ff88",
    primary: "#00ff88",
    ctaBg: "#00ff88",
    ctaText: "#0a0a0a",
  },
  ocean: {
    background: "#0c4a6e",
    text: "#f0f9ff",
    primary: "#38bdf8",
    ctaBg: "#38bdf8",
    ctaText: "#0c4a6e",
  },
  // Seasonal themes
  summer: {
    background: "#fef3c7",
    text: "#92400e",
    primary: "#f59e0b",
    ctaBg: "#f59e0b",
    ctaText: "#ffffff",
  },
  "black-friday": {
    background: "#000000",
    text: "#ffffff",
    primary: "#ef4444",
    ctaBg: "#ef4444",
    ctaText: "#ffffff",
  },
  holiday: {
    background: "#14532d",
    text: "#ffffff",
    primary: "#ef4444",
    ctaBg: "#ef4444",
    ctaText: "#ffffff",
  },
  valentine: {
    background: "#fdf2f8",
    text: "#831843",
    primary: "#ec4899",
    ctaBg: "#ec4899",
    ctaText: "#ffffff",
  },
  spring: {
    background: "#f0fdf4",
    text: "#166534",
    primary: "#22c55e",
    ctaBg: "#22c55e",
    ctaText: "#ffffff",
  },
};

/**
 * Revenue Boost brand colors (greenish teal).
 * Used as fallback for recipes without a specific theme.
 */
const BRAND_COLORS = {
  primary: "#0E7768",      // Teal - main brand color
  secondary: "#AEE5AB",    // Light green - accent
  background: "#FFFFFF",   // White background
  text: "#1F2937",         // Dark gray text
  buttonBg: "#0E7768",     // Teal button
  buttonText: "#FFFFFF",   // White button text
};

/**
 * Build design config from recipe, applying theme colors.
 * Preserves original recipe themes while using brand colors as fallback.
 */
function buildDesignConfig(recipe: StyledRecipe): Record<string, unknown> {
  // Get theme colors if recipe has a theme
  const theme = recipe.theme;
  const themeColors = theme && MARKETING_THEMES[theme] ? MARKETING_THEMES[theme] : null;

  // Determine image position based on layout
  const imagePosition =
    recipe.defaults.designConfig?.imagePosition ||
    (recipe.layout === "hero"
      ? "top"
      : recipe.layout === "fullscreen"
        ? "full"
        : recipe.layout === "split-right"
          ? "right"
          : "left");

  // Build background image config from recipe
  let imageUrl: string | undefined;
  let backgroundImageMode: "none" | "preset" | "file" = "none";
  let backgroundImagePresetKey: string | undefined;

  // First check for direct imageUrl on recipe (for split/hero layouts)
  if (recipe.imageUrl) {
    imageUrl = recipe.imageUrl;
    backgroundImageMode = "file";
  }
  // Then check for background preset - look up the actual filename from inline map
  else if (recipe.backgroundPresetId) {
    backgroundImagePresetKey = recipe.backgroundPresetId;
    // Look up the preset filename from inline map
    const filename = BACKGROUND_PRESET_FILENAMES[recipe.backgroundPresetId];
    if (filename) {
      imageUrl = `/${filename}`;
    } else {
      // Fallback: try newsletter-backgrounds folder with .jpg extension
      imageUrl = `/newsletter-backgrounds/${recipe.backgroundPresetId}.jpg`;
    }
    backgroundImageMode = "preset";
  }

  // Build color config: use theme colors if available, recipe colors if defined,
  // or brand colors as final fallback
  const recipeDesign = recipe.defaults.designConfig || {};

  // Start with brand colors as base fallback
  let colorConfig = {
    backgroundColor: BRAND_COLORS.background,
    textColor: BRAND_COLORS.text,
    primaryColor: BRAND_COLORS.primary,
    accentColor: BRAND_COLORS.secondary,
    buttonColor: BRAND_COLORS.buttonBg,
    buttonTextColor: BRAND_COLORS.buttonText,
  };

  // If recipe has a theme, use theme colors
  if (themeColors) {
    colorConfig = {
      backgroundColor: themeColors.background,
      textColor: themeColors.text,
      primaryColor: themeColors.primary,
      accentColor: themeColors.primary,
      buttonColor: themeColors.ctaBg || themeColors.primary,
      buttonTextColor: themeColors.ctaText || "#FFFFFF",
    };
  }
  // Otherwise, use recipe's own colors if they exist
  else if (recipeDesign.backgroundColor || recipeDesign.buttonColor) {
    colorConfig = {
      backgroundColor: recipeDesign.backgroundColor || colorConfig.backgroundColor,
      textColor: recipeDesign.textColor || colorConfig.textColor,
      primaryColor: recipeDesign.accentColor || colorConfig.primaryColor,
      accentColor: recipeDesign.accentColor || colorConfig.accentColor,
      buttonColor: recipeDesign.buttonColor || colorConfig.buttonColor,
      buttonTextColor: recipeDesign.buttonTextColor || colorConfig.buttonTextColor,
    };
  }

  return {
    // Only set theme if recipe has one
    ...(theme ? { theme } : {}),
    layout: recipe.layout,
    position: recipeDesign.position || "center",
    size: recipeDesign.size || "medium",
    // Background image settings
    backgroundImageMode,
    backgroundImagePresetKey,
    imageUrl,
    imagePosition,
    // Use recipe's overlay opacity if defined, otherwise default to 0.6
    backgroundOverlayOpacity: recipeDesign.backgroundOverlayOpacity ?? 0.6,
    // Preview mode settings
    previewMode: true,
    disablePortal: true,
    // Spread all recipe design config first (includes leadCaptureLayout)
    ...recipeDesign,
    // Then apply the resolved color config (theme > recipe > brand fallback)
    ...colorConfig,
  };
}

export default MarketingRecipePreview;

