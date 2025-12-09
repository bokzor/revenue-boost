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

import React, { useMemo, useRef, useState, useLayoutEffect, useCallback } from "react";
import type { NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";
import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { DeviceFrame } from "~/domains/popups/components/preview/DeviceFrame";
import { ShadowDomWrapper } from "./ShadowDomWrapper";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import type { DesignTokens } from "../../types/design-tokens";

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

  /** Default theme tokens from store's default preset (for preview when themeMode is "default") */
  defaultThemeTokens?: DesignTokens;
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

// =============================================================================
// CONSTANTS
// =============================================================================

// How long to wait before the popup reappears after closing
const REAPPEAR_DELAY_MS = 2000;

// =============================================================================
// COMPONENT
// =============================================================================

export function MiniPopupPreview({ recipe, scale, width, height, defaultThemeTokens }: MiniPopupPreviewProps) {
  // Ref to measure container dimensions for scaling
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // State for controlling popup visibility (for exit/enter animations)
  const [isPopupVisible, setIsPopupVisible] = useState(true);
  const [remountKey, setRemountKey] = useState(0);

  // Handle close: trigger exit animation, then schedule reappear
  const handleClose = useCallback(() => {
    // Set invisible - this triggers exit animation in PopupPortal
    setIsPopupVisible(false);

    // After exit animation + delay, show popup again with fresh mount
    setTimeout(() => {
      setRemountKey(k => k + 1);
      setIsPopupVisible(true);
    }, REAPPEAR_DELAY_MS);
  }, []);

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

  // Virtual viewport sizes - the "native" size at which we render the popup
  // All templates render as iPhone 14 (390×844) with device frame to show mobile layout
  // DeviceFrame adds 24px border (12px each side)
  const DEVICE_FRAME_BORDER = 24;
  const virtualWidth = IPHONE_14_WIDTH + DEVICE_FRAME_BORDER;
  const virtualHeight = IPHONE_14_HEIGHT + DEVICE_FRAME_BORDER;

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
      // Include discount config for tiered discounts, BOGO, etc.
      discountConfig: recipe.defaults.discountConfig,
      // Add preview mode flag
      previewMode: true,
    };
  }, [recipe.defaults.contentConfig, recipe.defaults.discountConfig]);

  // Build design config from recipe
  const designConfig = useMemo(() => {
    // Use recipe's theme if specified, otherwise leave undefined
    // When undefined, preview uses store's default theme colors via defaultThemeTokens
    const theme = recipe.theme as NewsletterThemeKey | undefined;

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
    const imagePosition =
      recipe.defaults.designConfig?.imagePosition ||
      (recipe.layout === "hero"
        ? "top"
        : recipe.layout === "fullscreen"
          ? "full"
          : recipe.layout === "split-right"
            ? "right"
            : "left");

    const result = {
      // Only set theme if recipe has one - otherwise preview uses defaultThemeTokens
      ...(theme ? { theme } : {}),
      layout: recipe.layout,
      position: recipe.defaults.designConfig?.position || "center",
      size: recipe.defaults.designConfig?.size || "medium",
      // Background image settings (matching full flow format)
      backgroundImageMode,
      backgroundImagePresetKey,
      imageUrl,
      imagePosition,
      backgroundOverlayOpacity: 0.6,
      // Preview mode settings
      previewMode: true,
      disablePortal: true,
      // Use recipe's designConfig colors (if specified)
      ...recipe.defaults.designConfig,
    };

    return result;
  }, [recipe]);

  // Calculate container dimensions
  // Default to 100% to fill parent container
  const containerWidthProp = width || "100%";
  const containerHeightProp = height || "100%";

  // Popup style: use two-layer scaling for container queries
  // Outer layer clips and scales, inner layer renders at full size
  const scaledWidth = virtualWidth * effectiveScale;
  const scaledHeight = virtualHeight * effectiveScale;

  return (
    <div
      ref={containerRef}
      style={{
        ...containerStyle,
        width:
          typeof containerWidthProp === "number" ? `${containerWidthProp}px` : containerWidthProp,
        height:
          typeof containerHeightProp === "number"
            ? `${containerHeightProp}px`
            : containerHeightProp,
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
          }}
        >
          {/* Inner viewport - renders at full size so container queries work */}
          <div
            style={
              {
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
              } as React.CSSProperties
            }
          >
            {/* All templates render inside iPhone frame for consistent preview */}
            <DeviceFrame device="mobile" showShadow={false}>
              <TemplatePreview
                key={remountKey}
                templateType={recipe.templateType}
                config={contentConfig}
                designConfig={designConfig}
                onClose={handleClose}
                isVisible={isPopupVisible}
                defaultThemeTokens={defaultThemeTokens}
              />
            </DeviceFrame>
          </div>
        </div>
      </ShadowDomWrapper>
    </div>
  );
}
