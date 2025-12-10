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

// iPhone 14 dimensions (same as admin's MiniPopupPreview)
const IPHONE_14_WIDTH = 390;
const IPHONE_14_HEIGHT = 844;
const DEVICE_FRAME_BORDER = 24;

// Virtual viewport: iPhone + device frame border
const VIRTUAL_WIDTH = IPHONE_14_WIDTH + DEVICE_FRAME_BORDER;
const VIRTUAL_HEIGHT = IPHONE_14_HEIGHT + DEVICE_FRAME_BORDER;

export interface MarketingRecipePreviewProps {
  /** The recipe ID or MarketingRecipe object */
  recipe: string | MarketingRecipe;

  /** Width of the preview container */
  width?: number | string;

  /** Height of the preview container */
  height?: number | string;

  /** Whether to show recipe info below the preview */
  showInfo?: boolean;

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
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Get the full recipe data
  const recipeId = typeof recipe === "string" ? recipe : recipe.id;
  const fullRecipe = useMemo(() => getStyledRecipeForMarketing(recipeId), [recipeId]);

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
  // Override colorScheme to "custom" so our brand colors from designConfig are used
  const contentConfig = useMemo(
    () => ({
      ...fullRecipe.defaults.contentConfig,
      // Force "custom" colorScheme so brand colors from designConfig are applied
      colorScheme: "custom",
      discountConfig: fullRecipe.defaults.discountConfig,
      previewMode: true,
    }),
    [fullRecipe]
  );

  // Build design config from recipe
  const designConfig = useMemo(() => buildDesignConfig(fullRecipe), [fullRecipe]);

  // If showInfo is true, wrap in a flex container
  const previewElement = (
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
            {/* iPhone frame for consistent preview (same as admin) */}
            <DeviceFrame device="mobile">
              <TemplatePreview
                templateType={fullRecipe.templateType}
                config={contentConfig}
                designConfig={designConfig}
              />
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
// BRAND COLORS & HELPER FUNCTIONS
// =============================================================================

/**
 * Revenue Boost brand colors (greenish teal).
 * Used for ALL recipe previews on the marketing website to maintain consistent branding.
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
 * Build design config from recipe, applying Revenue Boost brand colors.
 *
 * For the marketing website, we ALWAYS use brand colors (greenish teal)
 * to maintain consistent branding. Recipe-specific colors are ignored.
 */
function buildDesignConfig(recipe: StyledRecipe): Record<string, unknown> {
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
  // Then check for background preset - build URL directly
  else if (recipe.backgroundPresetId) {
    backgroundImagePresetKey = recipe.backgroundPresetId;
    // Background images are served from /apps/revenue-boost/backgrounds/
    // The preset ID maps to the image filename
    imageUrl = `/apps/revenue-boost/backgrounds/${recipe.backgroundPresetId}.webp`;
    backgroundImageMode = "preset";
  }

  // Extract non-color properties from recipe's designConfig
  // We want to keep layout/position/size but override all colors with brand colors
  const recipeDesign = recipe.defaults.designConfig || {};
  const nonColorProps: Record<string, unknown> = {};
  const colorKeys = [
    "backgroundColor",
    "textColor",
    "primaryColor",
    "accentColor",
    "buttonColor",
    "buttonTextColor",
    "descriptionColor",
    "inputBackgroundColor",
    "inputTextColor",
    "inputBorderColor",
    "overlayColor",
    "secondaryButtonColor",
    "secondaryButtonTextColor",
  ];

  // Copy only non-color properties from recipe's designConfig
  for (const [key, value] of Object.entries(recipeDesign)) {
    if (!colorKeys.includes(key)) {
      nonColorProps[key] = value;
    }
  }

  // Always use Revenue Boost brand colors for marketing website
  const brandColorConfig = {
    backgroundColor: BRAND_COLORS.background,
    textColor: BRAND_COLORS.text,
    primaryColor: BRAND_COLORS.primary,
    accentColor: BRAND_COLORS.primary,
    buttonColor: BRAND_COLORS.buttonBg,
    buttonTextColor: BRAND_COLORS.buttonText,
    descriptionColor: "#6B7280", // Gray-500 for descriptions
  };

  return {
    layout: recipe.layout,
    position: recipeDesign.position || "center",
    size: recipeDesign.size || "medium",
    // Background image settings
    backgroundImageMode,
    backgroundImagePresetKey,
    imageUrl,
    imagePosition,
    backgroundOverlayOpacity: 0.6,
    // Preview mode settings
    previewMode: true,
    disablePortal: true,
    // Apply non-color properties from recipe
    ...nonColorProps,
    // Always apply brand colors (overrides any recipe colors)
    ...brandColorConfig,
  };
}

export default MarketingRecipePreview;

