/**
 * RecipeCard Component
 *
 * Displays a single styled recipe with optional mini-preview.
 * Shows recipe icon, name, tagline, and badges for featured/new/seasonal.
 * Includes an info tooltip with the recipe description.
 * On hover, shows a larger desktop preview of the popup.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Box, Text, InlineStack, Badge, Tooltip, Icon, Portal } from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import { RECIPE_TAG_LABELS } from "../../recipes/styled-recipe-types";
import { MiniPopupPreview } from "./MiniPopupPreview";
import { ShadowDomWrapper } from "./ShadowDomWrapper";
import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { DeviceFrame } from "~/domains/popups/components/preview/DeviceFrame";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";
import { usePreviewContext } from "./PreviewContext";

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
}

// =============================================================================
// STYLES
// =============================================================================

const getCardStyle = (isSelected: boolean, isHovered: boolean): React.CSSProperties => ({
  cursor: "pointer",
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

// MacBook Air 13" dimensions: 1440 x 900 (scaled down to fit)
// DeviceFrame adds 40px browser chrome + 2px border
const MACBOOK_AIR_WIDTH = 1440;
const MACBOOK_AIR_HEIGHT = 900;
const BROWSER_CHROME_HEIGHT = 42; // 40px chrome + 2px border
const DESKTOP_FRAME_WIDTH = MACBOOK_AIR_WIDTH;
const DESKTOP_FRAME_HEIGHT = MACBOOK_AIR_HEIGHT + BROWSER_CHROME_HEIGHT;
const DESKTOP_PREVIEW_SCALE = 0.45;

const hoverPreviewContentStyle: React.CSSProperties = {
  width: `${DESKTOP_FRAME_WIDTH * DESKTOP_PREVIEW_SCALE}px`, // ~648px
  height: `${DESKTOP_FRAME_HEIGHT * DESKTOP_PREVIEW_SCALE}px`, // ~424px
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "var(--p-color-bg-surface-secondary)",
  position: "relative",
};

// =============================================================================
// HOOK: Build design config from recipe
// =============================================================================

function useRecipeDesignConfig(recipe: StyledRecipe) {
  return React.useMemo(() => {
    const theme = (recipe.theme as NewsletterThemeKey) || "modern";
    const themeColors = NEWSLETTER_THEMES[theme] || NEWSLETTER_THEMES.modern;

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

    return {
      theme,
      layout: recipe.layout,
      position: recipe.defaults.designConfig?.position || "center",
      size: recipe.defaults.designConfig?.size || "medium",
      backgroundColor: themeColors.background,
      textColor: themeColors.text,
      primaryColor: themeColors.primary,
      buttonColor: themeColors.ctaBg || themeColors.primary,
      buttonTextColor: themeColors.ctaText || "#FFFFFF",
      backgroundImageMode,
      backgroundImagePresetKey,
      imageUrl,
      imagePosition,
      backgroundOverlayOpacity: 0.6,
      previewMode: true,
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
  size = "medium",
  hoverPreviewEnabled = true,
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
  const contentConfig = recipe.defaults.contentConfig || {};

  // Calculate preview position based on card position
  const calculatePreviewPosition = useCallback(() => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Preview size: Desktop frame scaled + header/footer (~80px for recipe header + hint)
    const previewWidth = DESKTOP_FRAME_WIDTH * DESKTOP_PREVIEW_SCALE;
    const previewHeight = DESKTOP_FRAME_HEIGHT * DESKTOP_PREVIEW_SCALE + 80;

    // Position to the right of the card by default
    let left = rect.right + 16;
    let top = rect.top;

    // If it would overflow right, position to the left
    if (left + previewWidth > viewportWidth - 20) {
      left = rect.left - previewWidth - 16;
    }

    // If it would overflow bottom, adjust top
    if (top + previewHeight > viewportHeight - 20) {
      top = viewportHeight - previewHeight - 20;
    }

    // Ensure it doesn't go above viewport
    if (top < 20) {
      top = 20;
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

  // Handle card click - always selects the recipe
  // Preview is handled by the eye button
  const handleCardClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

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
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        aria-pressed={isSelected}
        aria-label={`Select ${recipe.name} recipe`}
      >
        {/* Mini Preview */}
        {showPreview && (
          <div style={previewContainerStyle}>
            <MiniPopupPreview recipe={recipe} />
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
                <svg style={subtitleIconStyle} viewBox="0 0 18 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.3125 3.95557L9.5625 10.7056L6.75 7.89307L1.6875 12.9556" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16.3125 8.45557V3.95557H11.8125" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
        </div>
      </div>

      {/* Large Preview Portal - Interactive */}
      {showLargePreview && (
        <Portal>
          <div
            onMouseEnter={handlePreviewMouseEnter}
            onMouseLeave={handlePreviewMouseLeave}
            onClick={(e) => {
              e.stopPropagation();
              handlePreviewClick();
            }}
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
                padding: "12px 16px",
                borderBottom: "1px solid var(--p-color-border-secondary)",
                backgroundColor: "var(--p-color-bg-surface)",
              }}
            >
              <InlineStack gap="200" blockAlign="center">
                <span style={{ fontSize: "20px" }}>{recipe.icon}</span>
                <Text as="span" variant="headingSm">
                  {recipe.name}
                </Text>
              </InlineStack>
            </div>

            {/* Preview Content - Desktop viewport simulation with browser frame */}
            <div style={hoverPreviewContentStyle}>
              <ShadowDomWrapper>
                {/*
                  Two-layer scaling approach for container queries:
                  - Outer div: sized to fit the scaled frame visually
                  - Inner div: renders at MacBook Air 13" size with DeviceFrame
                  - Scale transform reduces it to fit in the preview container
                */}
                <div
                  style={{
                    width: DESKTOP_FRAME_WIDTH * DESKTOP_PREVIEW_SCALE,
                    height: DESKTOP_FRAME_HEIGHT * DESKTOP_PREVIEW_SCALE,
                    overflow: "hidden",
                    position: "relative",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      width: DESKTOP_FRAME_WIDTH,
                      height: DESKTOP_FRAME_HEIGHT,
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: `translate(-50%, -50%) scale(${DESKTOP_PREVIEW_SCALE})`,
                      transformOrigin: "center center",
                    }}
                  >
                    <DeviceFrame device="desktop">
                      <TemplatePreview
                        templateType={recipe.templateType}
                        config={contentConfig}
                        designConfig={designConfig}
                      />
                    </DeviceFrame>
                  </div>
                </div>
              </ShadowDomWrapper>
            </div>

            {/* Footer hint */}
            <div
              style={{
                padding: "8px 16px",
                borderTop: "1px solid var(--p-color-border-secondary)",
                backgroundColor: "var(--p-color-bg-surface)",
                textAlign: "center",
              }}
            >
              <Text as="span" variant="bodySm" tone="subdued">
                Desktop preview • Click to select
              </Text>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
