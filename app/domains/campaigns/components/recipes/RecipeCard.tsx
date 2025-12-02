/**
 * RecipeCard Component
 *
 * Displays a single styled recipe with optional mini-preview.
 * Shows recipe icon, name, tagline, and badges for featured/new/seasonal.
 * Includes an info tooltip with the recipe description.
 * On hover, shows a larger desktop preview of the popup.
 */

import React, { useRef, useState, useCallback } from "react";
import { Box, Text, InlineStack, Badge, Tooltip, Icon, Portal } from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import { MiniPopupPreview } from "./MiniPopupPreview";
import { ShadowDomWrapper } from "./ShadowDomWrapper";
import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";
import { getBackgroundById, getBackgroundUrl } from "~/config/background-presets";

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

const previewContainerStyle: React.CSSProperties = {
  aspectRatio: "1 / 1",
  overflow: "hidden",
  backgroundColor: "var(--p-color-bg-surface-secondary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderBottom: "1px solid var(--p-color-border-secondary)",
  position: "relative",
};

const contentStyle: React.CSSProperties = {
  padding: "12px",
};

const iconStyle: React.CSSProperties = {
  fontSize: "24px",
  lineHeight: 1,
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

const hoverPreviewContentStyle: React.CSSProperties = {
  width: "420px",
  height: "520px",
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
    const imagePosition = recipe.defaults.designConfig?.imagePosition ||
      (recipe.layout === "hero" ? "top" :
       recipe.layout === "fullscreen" ? "full" :
       recipe.layout === "split-right" ? "right" : "left");

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
}: RecipeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showHoverPreview, setShowHoverPreview] = useState(false);
  const [isPreviewHovered, setIsPreviewHovered] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const designConfig = useRecipeDesignConfig(recipe);
  const contentConfig = recipe.defaults.contentConfig || {};

  // Clear hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  // Handle mouse enter on card
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    clearHideTimeout();

    // Delay showing hover preview
    hoverTimeoutRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const previewWidth = 420;
        const previewHeight = 560;

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

        setHoverPosition({ top, left });
        setShowHoverPreview(true);
      }
    }, 400);
  }, [clearHideTimeout]);

  // Handle mouse leave from card
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Delay hiding to allow moving to preview
    hideTimeoutRef.current = setTimeout(() => {
      if (!isPreviewHovered) {
        setShowHoverPreview(false);
      }
    }, 100);
  }, [isPreviewHovered]);

  // Handle mouse enter on preview
  const handlePreviewMouseEnter = useCallback(() => {
    setIsPreviewHovered(true);
    clearHideTimeout();
  }, [clearHideTimeout]);

  // Handle mouse leave from preview
  const handlePreviewMouseLeave = useCallback(() => {
    setIsPreviewHovered(false);

    // Delay hiding to allow moving back to card
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHovered) {
        setShowHoverPreview(false);
      }
    }, 100);
  }, [isHovered]);

  // Cleanup on unmount
  React.useEffect(() => {
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
        onClick={onSelect}
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
        {/* Icon, Name, and Info Tooltip */}
        <InlineStack gap="200" blockAlign="center" wrap={false}>
          <span style={iconStyle}>{recipe.icon}</span>
          <Box>
            <InlineStack gap="100" blockAlign="center">
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                {recipe.name}
              </Text>
              <Tooltip content={recipe.description} width="wide">
                <span
                  style={{
                    display: "inline-flex",
                    cursor: "help",
                    color: "var(--p-color-icon-secondary)"
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon source={InfoIcon} tone="subdued" />
                </span>
              </Tooltip>
            </InlineStack>
          </Box>
        </InlineStack>

        {/* Tagline */}
        <Box paddingBlockStart="100">
          <Text as="p" variant="bodySm" tone="subdued" truncate>
            {recipe.tagline}
          </Text>
        </Box>

        {/* Badges */}
        {(recipe.featured || recipe.new || recipe.seasonal) && (
          <Box paddingBlockStart="200">
            <InlineStack gap="100">
              {recipe.featured && <Badge tone="success">Popular</Badge>}
              {recipe.new && <Badge tone="info">New</Badge>}
              {recipe.seasonal && <Badge>Seasonal</Badge>}
            </InlineStack>
          </Box>
        )}
      </div>
    </div>

      {/* Hover Preview Portal - Interactive */}
      {showHoverPreview && (
        <Portal>
          <div
            onMouseEnter={handlePreviewMouseEnter}
            onMouseLeave={handlePreviewMouseLeave}
            onClick={() => {
              setShowHoverPreview(false);
              onSelect();
            }}
            style={{
              ...hoverPreviewOverlayStyle,
              top: hoverPosition.top,
              left: hoverPosition.left,
              opacity: showHoverPreview ? 1 : 0,
              transform: showHoverPreview ? "scale(1)" : "scale(0.95)",
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

            {/* Preview Content - Tablet viewport simulation */}
            <div style={hoverPreviewContentStyle}>
              <ShadowDomWrapper>
                {/*
                  Two-layer scaling approach for container queries:
                  - Outer div: sized to fit the scaled popup
                  - Inner div: renders at tablet size (520px+) so container queries trigger tablet layout
                */}
                <div
                  style={{
                    width: 380,
                    height: 450,
                    overflow: "hidden",
                    position: "relative",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 540,
                      position: "absolute",
                      transform: "scale(0.7)",
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
                Tablet preview • Click to select
              </Text>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

