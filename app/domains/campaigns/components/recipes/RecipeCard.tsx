/**
 * RecipeCard Component
 *
 * Displays a single styled recipe with optional mini-preview.
 * Shows recipe icon, name, tagline, and badges for featured/new/seasonal.
 * Includes an info tooltip with the recipe description.
 * On hover, shows a larger desktop preview of the popup.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Text, InlineStack, Tooltip, Icon, Portal, Button } from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import { RECIPE_TAG_LABELS } from "../../recipes/styled-recipe-types";
import type { DesignTokens } from "../../types/design-tokens";
import { MiniPopupPreview } from "./MiniPopupPreview";
import { ShadowDomWrapper } from "./ShadowDomWrapper";
import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { DeviceFrame } from "~/domains/popups/components/preview/DeviceFrame";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";
import { usePreviewContext } from "./PreviewContext";
import { LazyLoad } from "~/components/LazyLoad";

// =============================================================================
// TYPES
// =============================================================================

export interface RecipeCardProps {
  /** The styled recipe to display */
  recipe: StyledRecipe;

  /** Whether this card is currently selected */
  isSelected?: boolean;

  /** Called when the card is clicked */
  onSelect: () => void;

  /** Show mini preview of the popup */
  showPreview?: boolean;

  /** Size variant */
  size?: "small" | "medium" | "large";

  /** Whether to show large preview on hover (default: true). When false, preview appears on click */
  hoverPreviewEnabled?: boolean;

  /** Default theme tokens from store's default preset (for preview when themeMode is "default") */
  defaultThemeTokens?: DesignTokens;
}

// =============================================================================
// STYLES
// =============================================================================

const getCardStyle = (isSelected: boolean, isHovered: boolean): React.CSSProperties => ({
  borderRadius: "12px",
  border: isSelected
    ? "2px solid var(--p-color-border-interactive)"
    : "1px solid var(--p-color-border-secondary)",
  backgroundColor: isSelected
    ? "var(--p-color-bg-surface-secondary-active)"
    : isHovered
      ? "var(--p-color-bg-surface-secondary-hover)"
      : "var(--p-color-bg-surface)",
  transition: "all 0.15s ease",
  overflow: "hidden",
  boxShadow: isSelected ? "0 0 0 2px var(--p-color-border-interactive)" : undefined,
  position: "relative",
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

// Preview container uses iPhone 14 aspect ratio (390:844 ≈ 9:19)
// with some padding for the device frame
const previewContainerStyle: React.CSSProperties = {
  aspectRatio: "9 / 16",
  overflow: "hidden",
  backgroundColor: "var(--p-color-bg-surface-secondary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderBottom: "1px solid var(--p-color-border-secondary)",
  position: "relative",
  padding: "8px",
};

const contentStyle: React.CSSProperties = {
  padding: "12px",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  flex: 1,
};

const titleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "8px",
};

const titleTextStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--p-color-text)",
  margin: 0,
  lineHeight: 1.3,
};

const subtitleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  marginTop: "4px",
};

const subtitleIconStyle: React.CSSProperties = {
  width: "14px",
  height: "14px",
  color: "var(--p-color-icon-success)",
};

const subtitleTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--p-color-text-success)",
  fontWeight: 500,
};

const descriptionStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--p-color-text-secondary)",
  margin: "8px 0",
  lineHeight: 1.4,
};

const tagsContainerStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  marginTop: "8px",
};

const tagStyle: React.CSSProperties = {
  fontSize: "11px",
  padding: "2px 8px",
  borderRadius: "4px",
  backgroundColor: "var(--p-color-bg-surface-secondary)",
  color: "var(--p-color-text-secondary)",
};

const storeThemeBadgeStyle: React.CSSProperties = {
  fontSize: "10px",
  padding: "2px 6px",
  borderRadius: "4px",
  backgroundColor: "var(--p-color-bg-fill-success)",
  color: "#FFFFFF",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

const eyeButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "6px",
  backgroundColor: "var(--p-color-bg-surface-secondary)",
  border: "none",
  cursor: "pointer",
  color: "var(--p-color-icon-secondary)",
  flexShrink: 0,
  transition: "background-color 0.15s ease, color 0.15s ease",
};

const eyeButtonHoverStyle: React.CSSProperties = {
  backgroundColor: "var(--p-color-bg-surface-tertiary)",
  color: "var(--p-color-icon)",
};

// Hover preview overlay styles
const hoverPreviewOverlayStyle: React.CSSProperties = {
  position: "fixed",
  zIndex: 1000,
  backgroundColor: "var(--p-color-bg-surface)",
  borderRadius: "12px",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)",
  overflow: "hidden",
  pointerEvents: "none",
  transition: "opacity 0.2s ease, transform 0.2s ease",
};

// Container dimensions for the large preview modal
// Sized to fit comfortably within Shopify admin viewport
const PREVIEW_CONTAINER_WIDTH = 560;
const PREVIEW_CONTAINER_HEIGHT = 480;
const PREVIEW_MARGIN = 16; // Margin around browser frame

// =============================================================================
// PREVIEW SKELETON (shown while lazy loading)
// =============================================================================

function PreviewSkeleton() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        backgroundColor: "var(--p-color-bg-surface-secondary)",
      }}
    >
      {/* Phone outline skeleton */}
      <div
        style={{
          width: "60%",
          maxWidth: "120px",
          aspectRatio: "9 / 16",
          borderRadius: "12px",
          backgroundColor: "var(--p-color-bg-surface-tertiary)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      {/* Inline keyframes for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// LARGE PREVIEW CONTENT COMPONENT
// Renders popup inside a browser frame with dynamic scaling
// =============================================================================

interface LargePreviewContentProps {
  recipe: StyledRecipe;
  contentConfig: Record<string, unknown>;
  designConfig: Record<string, unknown>;
  previewPosition: { top: number; left: number };
  showLargePreview: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  defaultThemeTokens?: DesignTokens;
}

// Browser frame adds ~42px for chrome (40px + border)
const BROWSER_CHROME_HEIGHT = 42;

function LargePreviewContent({
  recipe,
  contentConfig,
  designConfig,
  previewPosition,
  showLargePreview,
  onMouseEnter,
  onMouseLeave,
  onClick,
  defaultThemeTokens,
}: LargePreviewContentProps) {
  // We render a simulated browser at a larger size then scale it down
  // This gives realistic proportions while fitting in the container
  const BROWSER_WIDTH = 900;
  const BROWSER_HEIGHT = 600;

  // Calculate scale to fit browser in container
  const availableWidth = PREVIEW_CONTAINER_WIDTH - PREVIEW_MARGIN * 2;
  const availableHeight = PREVIEW_CONTAINER_HEIGHT - PREVIEW_MARGIN * 2;
  const scale = Math.min(
    availableWidth / BROWSER_WIDTH,
    availableHeight / (BROWSER_HEIGHT + BROWSER_CHROME_HEIGHT),
    1.0
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Select recipe from preview"
      style={{
        ...hoverPreviewOverlayStyle,
        top: previewPosition.top,
        left: previewPosition.left,
        opacity: showLargePreview ? 1 : 0,
        transform: showLargePreview ? "scale(1)" : "scale(0.95)",
        pointerEvents: "auto",
        cursor: "pointer",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--p-color-border-secondary)",
          backgroundColor: "var(--p-color-bg-surface)",
        }}
      >
        <InlineStack gap="200" blockAlign="center">
          <span style={{ fontSize: "18px" }}>{recipe.icon}</span>
          <Text as="span" variant="headingSm">
            {recipe.name}
          </Text>
        </InlineStack>
      </div>

      {/* Preview Content - Browser frame with popup */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#e8e8e8",
          position: "relative",
        }}
      >
        <ShadowDomWrapper>
          {/* Outer container clips to scaled size */}
          <div
            style={{
              width: BROWSER_WIDTH * scale,
              height: (BROWSER_HEIGHT + BROWSER_CHROME_HEIGHT) * scale,
              overflow: "hidden",
              position: "relative",
              pointerEvents: "none",
            }}
          >
            {/* Inner container renders at full size then scales */}
            <div
              style={{
                width: BROWSER_WIDTH,
                height: BROWSER_HEIGHT + BROWSER_CHROME_HEIGHT,
                position: "absolute",
                top: 0,
                left: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <DeviceFrame device="desktop" showShadow={false}>
                <TemplatePreview
                  templateType={recipe.templateType}
                  config={contentConfig}
                  designConfig={designConfig}
                  defaultThemeTokens={defaultThemeTokens}
                />
              </DeviceFrame>
            </div>
          </div>
        </ShadowDomWrapper>
      </div>

      {/* Footer hint */}
      <div
        style={{
          padding: "6px 16px",
          borderTop: "1px solid var(--p-color-border-secondary)",
          backgroundColor: "var(--p-color-bg-surface)",
          textAlign: "center",
        }}
      >
        <Text as="span" variant="bodySm" tone="subdued">
          Click to select
        </Text>
      </div>
    </div>
  );
}

// =============================================================================
// HOOK: Build design config from recipe
// =============================================================================

function useRecipeDesignConfig(recipe: StyledRecipe) {
  return React.useMemo(() => {
    // Use recipe's theme if specified, otherwise leave undefined
    // When undefined, the preview will use defaultThemeTokens (store's default theme)
    const theme = recipe.theme as NewsletterThemeKey | undefined;
    const themeColors = theme ? NEWSLETTER_THEMES[theme] : undefined;

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

    // If recipe has a theme, apply its colors
    // Otherwise, colors come from defaultThemeTokens passed to the preview
    const themeColorConfig = themeColors
      ? {
          backgroundColor: themeColors.background,
          textColor: themeColors.text,
          primaryColor: themeColors.primary,
          accentColor: themeColors.primary,
          buttonColor: themeColors.ctaBg || themeColors.primary,
          buttonTextColor: themeColors.ctaText || "#FFFFFF",
        }
      : {};

    return {
      // Only set theme if recipe has one - otherwise preview uses defaultThemeTokens
      ...(theme ? { theme } : {}),
      layout: recipe.layout,
      position: recipe.defaults.designConfig?.position || "center",
      size: recipe.defaults.designConfig?.size || "medium",
      backgroundImageMode,
      backgroundImagePresetKey,
      imageUrl,
      imagePosition,
      backgroundOverlayOpacity: 0.6,
      previewMode: true,
      // Apply theme colors first (if any)
      ...themeColorConfig,
      // Then spread recipe's designConfig which may override colors
      ...recipe.defaults.designConfig,
    };
  }, [recipe]);
}

// =============================================================================
// COMPONENT
// =============================================================================

export function RecipeCard({
  recipe,
  isSelected = false,
  onSelect,
  showPreview = true,
  size: _size = "medium",
  hoverPreviewEnabled = true,
  defaultThemeTokens,
}: RecipeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [localShowPreview, setLocalShowPreview] = useState(false);
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use context if available (ensures only one preview at a time)
  const previewContext = usePreviewContext();

  // Determine if this card's preview should be shown
  const showLargePreview = previewContext
    ? previewContext.isPreviewOpen(recipe.id)
    : localShowPreview;

  // Unified function to open preview
  const openPreview = useCallback(() => {
    if (previewContext) {
      previewContext.openPreview(recipe.id);
    } else {
      setLocalShowPreview(true);
    }
  }, [previewContext, recipe.id]);

  // Unified function to close preview
  const closePreview = useCallback(() => {
    if (previewContext) {
      previewContext.closePreview();
    } else {
      setLocalShowPreview(false);
    }
  }, [previewContext]);

  const designConfig = useRecipeDesignConfig(recipe);
  const contentConfig = {
    ...(recipe.defaults.contentConfig || {}),
    // Include discount config for tiered discounts, BOGO, etc.
    discountConfig: recipe.defaults.discountConfig,
  };

  // Calculate preview position based on card position
  const calculatePreviewPosition = useCallback(() => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Preview size: container dimensions + header/footer (~60px for recipe header + hint)
    const previewWidth = PREVIEW_CONTAINER_WIDTH;
    const previewHeight = PREVIEW_CONTAINER_HEIGHT + 60;

    // Shopify admin menu is typically ~240px, add safety margin
    const leftBoundary = 60;
    const rightBoundary = 20;
    const topBoundary = 60;
    const bottomBoundary = 20;

    // Position to the right of the card by default
    let left = rect.right + 16;
    let top = rect.top;

    // If it would overflow right, position to the left of the card
    if (left + previewWidth > viewportWidth - rightBoundary) {
      left = rect.left - previewWidth - 16;
    }

    // Ensure it doesn't go behind left menu
    if (left < leftBoundary) {
      left = leftBoundary;
    }

    // If it would overflow bottom, adjust top
    if (top + previewHeight > viewportHeight - bottomBoundary) {
      top = viewportHeight - previewHeight - bottomBoundary;
    }

    // Ensure it doesn't go above viewport
    if (top < topBoundary) {
      top = topBoundary;
    }

    setPreviewPosition({ top, left });
  }, []);

  // Clear hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Handle mouse enter on card (only for hover mode)
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);

    if (!hoverPreviewEnabled) return;

    clearHideTimeout();

    // Delay showing hover preview
    hoverTimeoutRef.current = setTimeout(() => {
      calculatePreviewPosition();
      openPreview();
    }, 400);
  }, [hoverPreviewEnabled, clearHideTimeout, calculatePreviewPosition, openPreview]);

  // Handle mouse leave from card (only for hover mode)
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);

    if (!hoverPreviewEnabled) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Delay hiding to allow moving to preview
    hideTimeoutRef.current = setTimeout(() => {
      if (!isPreviewHovered) {
        closePreview();
      }
    }, 100);
  }, [hoverPreviewEnabled, isPreviewHovered, closePreview]);

  // Handle mouse enter on preview (only for hover mode)
  const handlePreviewMouseEnter = useCallback(() => {
    if (!hoverPreviewEnabled) return;
    setIsPreviewHovered(true);
    clearHideTimeout();
  }, [hoverPreviewEnabled, clearHideTimeout]);

  // Handle mouse leave from preview (only for hover mode)
  const handlePreviewMouseLeave = useCallback(() => {
    if (!hoverPreviewEnabled) return;
    setIsPreviewHovered(false);

    // Delay hiding to allow moving back to card
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHovered) {
        closePreview();
      }
    }, 100);
  }, [hoverPreviewEnabled, isHovered, closePreview]);

  // Handle preview click (selects the recipe and closes preview)
  const handlePreviewClick = useCallback(() => {
    closePreview();
    onSelect();
  }, [closePreview, onSelect]);

  // Close preview when clicking outside (for click mode)
  useEffect(() => {
    if (!showLargePreview || hoverPreviewEnabled) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (cardRef.current && !cardRef.current.contains(target)) {
        closePreview();
      }
    };

    // Delay adding listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showLargePreview, hoverPreviewEnabled, closePreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={cardRef}
        style={getCardStyle(isSelected, isHovered)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Mini Preview - Lazy loaded for performance */}
        {showPreview && (
          <div style={previewContainerStyle}>
            <LazyLoad height="100%" width="100%" rootMargin="150px" loader={<PreviewSkeleton />}>
              <MiniPopupPreview recipe={recipe} defaultThemeTokens={defaultThemeTokens} />
            </LazyLoad>
          </div>
        )}

        {/* Content */}
        <div style={contentStyle}>
          {/* Title row with eye button */}
          <div style={titleRowStyle}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={titleTextStyle}>{recipe.name}</h3>

              {/* Subtitle with stats icon */}
              <div style={subtitleStyle}>
                <svg
                  style={subtitleIconStyle}
                  viewBox="0 0 18 19"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.3125 3.95557L9.5625 10.7056L6.75 7.89307L1.6875 12.9556"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16.3125 8.45557V3.95557H11.8125"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={subtitleTextStyle}>{recipe.tagline}</span>
              </div>
            </div>

            {/* Eye button for full preview */}
            <Tooltip content="View full preview">
              <button
                style={eyeButtonStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  if (showLargePreview) {
                    closePreview();
                  } else {
                    calculatePreviewPosition();
                    openPreview();
                  }
                }}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, eyeButtonHoverStyle);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, eyeButtonStyle);
                }}
                aria-label="View full preview"
              >
                <Icon source={ViewIcon} />
              </button>
            </Tooltip>
          </div>

          {/* Description */}
          <p style={descriptionStyle}>{recipe.description}</p>

          {/* Store Theme Badge - shown for use_case recipes */}
          {recipe.recipeType === "use_case" && (
            <div style={{ marginTop: "4px" }}>
              <span style={storeThemeBadgeStyle}>
                🎨 Uses store theme
              </span>
            </div>
          )}

          {/* Tags (max 3) */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div style={tagsContainerStyle}>
              {recipe.tags.slice(0, 3).map((tag) => (
                <div key={tag} style={tagStyle}>
                  <span>{RECIPE_TAG_LABELS[tag] || tag}</span>
                </div>
              ))}
            </div>
          )}

          {/* Select Button - pushed to bottom with marginTop: auto */}
          <div style={{ marginTop: "auto", paddingTop: "12px" }}>
            <Button
              variant={isSelected ? "primary" : "secondary"}
              fullWidth
              onClick={() => onSelect()}
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
          </div>
        </div>
      </div>

      {/* Large Preview Portal - Interactive */}
      {showLargePreview && (
        <Portal>
          <LargePreviewContent
            recipe={recipe}
            contentConfig={contentConfig}
            designConfig={designConfig}
            previewPosition={previewPosition}
            showLargePreview={showLargePreview}
            onMouseEnter={handlePreviewMouseEnter}
            onMouseLeave={handlePreviewMouseLeave}
            onClick={handlePreviewClick}
            defaultThemeTokens={defaultThemeTokens}
          />
        </Portal>
      )}
    </>
  );
}
