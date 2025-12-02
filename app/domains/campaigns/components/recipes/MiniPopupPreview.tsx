/**
 * MiniPopupPreview Component
 *
 * Renders a scaled-down preview of a popup based on recipe configuration.
 * Used in RecipeCard to show what the popup will look like.
 *
 * Uses the actual TemplatePreview component with CSS transform scaling
 * to ensure the preview matches the real popup appearance.
 *
 * Each instance gets a unique scopeId passed through config to scope CSS
 * selectors and prevent style leakage between multiple preview instances.
 */

import React, { useMemo, useRef, useState, useLayoutEffect } from "react";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";
import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { DeviceFrame } from "~/domains/popups/components/preview/DeviceFrame";
import { ShadowDomWrapper } from "./ShadowDomWrapper";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";

// iPhone 14 dimensions (used by DeviceFrame for mobile)
const IPHONE_14_WIDTH = 390;
const IPHONE_14_HEIGHT = 844;

// =============================================================================
// TYPES
// =============================================================================

export interface MiniPopupPreviewProps {
  /** The styled recipe to preview */
  recipe: StyledRecipe;

  /** Scale factor (0.35 = 35% size) */
  scale?: number;

  /** Width of the preview container */
  width?: number;

  /** Height of the preview container */
  height?: number;
}

// =============================================================================
// STYLES
// =============================================================================

const containerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  borderRadius: "8px",
  backgroundColor: "var(--p-color-bg-surface-secondary)",
};

// Template types that use banner/bar layout (full width)
const BANNER_TEMPLATES = [
  "ANNOUNCEMENT",
  "FREE_SHIPPING",
  "SOCIAL_PROOF",
];

// Layouts that indicate banner/bar style
const BANNER_LAYOUTS = [
  "banner-top",
  "banner-bottom",
  "bar",
];

// =============================================================================
// COMPONENT
// =============================================================================

export function MiniPopupPreview({
  recipe,
  scale,
  width,
  height,
}: MiniPopupPreviewProps) {
  // Ref to measure container dimensions for scaling
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

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

    // Use ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Determine if this is a banner-style template by checking both templateType and layout
  const isBanner =
    BANNER_TEMPLATES.includes(recipe.templateType) ||
    BANNER_LAYOUTS.includes(recipe.layout);

  // Virtual viewport sizes - the "native" size at which we render the popup
  // Mini preview always renders as iPhone 14 (390×844) with device frame to show mobile layout
  // Banners use wider aspect ratio without device frame
  // DeviceFrame adds 24px border (12px each side)
  const DEVICE_FRAME_BORDER = 24;
  const virtualWidth = isBanner ? 600 : (IPHONE_14_WIDTH + DEVICE_FRAME_BORDER);
  const virtualHeight = isBanner ? 80 : (IPHONE_14_HEIGHT + DEVICE_FRAME_BORDER);

  // Calculate scale to fit entire popup in container
  // Use min of width ratio and height ratio to ensure everything fits
  const effectiveScale = useMemo(() => {
    if (scale) return scale;

    const { width: cw, height: ch } = containerDimensions;
    if (cw === 0 || ch === 0) return 0.35; // Fallback while measuring

    // Add some padding (90% of container) so popup doesn't touch edges
    const padding = 0.9;
    const scaleX = (cw * padding) / virtualWidth;
    const scaleY = (ch * padding) / virtualHeight;

    // Use minimum scale to ensure entire popup fits
    return Math.min(scaleX, scaleY);
  }, [scale, containerDimensions, virtualWidth, virtualHeight]);

  // Build content config from recipe defaults
  const contentConfig = useMemo(() => {
    return {
      ...recipe.defaults.contentConfig,
      // Add preview mode flag
      previewMode: true,
    };
  }, [recipe.defaults.contentConfig]);

  // Build design config from recipe
  const designConfig = useMemo(() => {
    const theme = (recipe.theme as NewsletterThemeKey) || "modern";
    const themeColors = NEWSLETTER_THEMES[theme] || NEWSLETTER_THEMES.modern;

    // Get background image if recipe has one
    let imageUrl: string | undefined;
    let backgroundImageMode: "none" | "preset" | "file" = "none";
    let backgroundImagePresetKey: string | undefined;

    // First check for direct imageUrl on recipe (for split/hero layouts)
    if (recipe.imageUrl) {
      imageUrl = recipe.imageUrl;
      backgroundImageMode = "file";
    }
    // Then check for background preset (for full background mode)
    else if (recipe.backgroundPresetId) {
      const preset = getBackgroundById(recipe.backgroundPresetId);
      if (preset) {
        imageUrl = getBackgroundUrl(preset);
        backgroundImageMode = "preset";
        backgroundImagePresetKey = preset.id;
      }
    }

    // Determine imagePosition based on layout
    const imagePosition = recipe.defaults.designConfig?.imagePosition ||
      (recipe.layout === "hero" ? "top" :
       recipe.layout === "fullscreen" ? "full" :
       recipe.layout === "split-right" ? "right" : "left");

    return {
      theme,
      layout: recipe.layout,
      position: recipe.defaults.designConfig?.position || "center",
      size: recipe.defaults.designConfig?.size || "medium",
      // Colors from theme
      backgroundColor: themeColors.background,
      textColor: themeColors.text,
      primaryColor: themeColors.primary,
      buttonColor: themeColors.ctaBg || themeColors.primary,
      buttonTextColor: themeColors.ctaText || "#FFFFFF",
      // Background image settings (matching full flow format)
      backgroundImageMode,
      backgroundImagePresetKey,
      imageUrl,
      imagePosition,
      backgroundOverlayOpacity: 0.6,
      // Preview mode settings
      previewMode: true,
      disablePortal: true,
      ...recipe.defaults.designConfig,
    };
  }, [recipe]);

  // Calculate container dimensions
  // Default to 100% to fill parent container
  const containerWidthProp = width || "100%";
  const containerHeightProp = height || "100%";

  // Styles to inject into Shadow DOM for banner previews
  const bannerShadowStyles = `
    [data-mini-banner-preview] .free-shipping-bar,
    [data-mini-banner-preview] [data-rb-banner],
    [data-mini-banner-preview] .announcement-bar,
    [data-mini-banner-preview] [class*="announcement"],
    [data-mini-banner-preview] [class*="social-proof"] {
      position: relative !important;
      top: auto !important;
      bottom: auto !important;
      left: auto !important;
      right: auto !important;
      width: 100% !important;
      transform: none !important;
      animation: none !important;
    }
    [data-mini-banner-preview] .free-shipping-bar-close,
    [data-mini-banner-preview] .free-shipping-bar-dismiss {
      display: none !important;
    }
  `;

  // For banners: use two-layer scaling for container queries
  // Outer layer clips and scales, inner layer renders at full size
  const bannerScaledWidth = virtualWidth * effectiveScale;
  const bannerScaledHeight = 80; // Fixed height for banner preview

  if (isBanner) {
    return (
      <div
        ref={containerRef}
        style={{
          ...containerStyle,
          width: typeof containerWidthProp === "number" ? `${containerWidthProp}px` : containerWidthProp,
          height: typeof containerHeightProp === "number" ? `${containerHeightProp}px` : containerHeightProp,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ShadowDomWrapper styles={bannerShadowStyles}>
          {/* Outer clip container */}
          <div
            style={{
              width: bannerScaledWidth,
              height: bannerScaledHeight,
              overflow: "hidden",
              position: "relative",
              pointerEvents: "none",
            }}
          >
            {/* Inner viewport - renders at full size */}
            <div
              data-mini-banner-preview="true"
              style={{
                width: virtualWidth,
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) scale(${effectiveScale})`,
                transformOrigin: "center center",
              }}
            >
              <TemplatePreview
                templateType={recipe.templateType}
                config={contentConfig}
                designConfig={designConfig}
              />
            </div>
          </div>
        </ShadowDomWrapper>
      </div>
    );
  }

  // Popup style: use two-layer scaling for container queries
  // Outer layer clips and scales, inner layer renders at full size
  const scaledWidth = virtualWidth * effectiveScale;
  const scaledHeight = virtualHeight * effectiveScale;

  return (
    <div
      ref={containerRef}
      style={{
        ...containerStyle,
        width: typeof containerWidthProp === "number" ? `${containerWidthProp}px` : containerWidthProp,
        height: typeof containerHeightProp === "number" ? `${containerHeightProp}px` : containerHeightProp,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ShadowDomWrapper
        style={{
          width: "auto",
          height: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer clip container - sized to the scaled dimensions */}
        <div
          style={{
            width: scaledWidth,
            height: scaledHeight,
            overflow: "hidden",
            position: "relative",
            pointerEvents: "none",
          }}
        >
          {/* Inner viewport - renders at full size so container queries work */}
          <div
            style={{
              width: virtualWidth,
              height: virtualHeight,
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
            {isBanner ? (
              // Banners render without device frame
              <TemplatePreview
                templateType={recipe.templateType}
                config={contentConfig}
                designConfig={designConfig}
              />
            ) : (
              // Regular popups render inside iPhone frame (no shadow for mini preview)
              <DeviceFrame device="mobile" showShadow={false}>
                <TemplatePreview
                  templateType={recipe.templateType}
                  config={contentConfig}
                  designConfig={designConfig}
                />
              </DeviceFrame>
            )}
          </div>
        </div>
      </ShadowDomWrapper>
    </div>
  );
}

