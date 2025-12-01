/**
 * RecipeCard Component
 *
 * Displays a single styled recipe with optional mini-preview.
 * Shows recipe icon, name, tagline, and badges for featured/new/seasonal.
 * Includes an info tooltip with the recipe description.
 */

import React from "react";
import { Box, Text, InlineStack, Badge, Tooltip, Icon } from "@shopify/polaris";
import { InfoIcon } from "@shopify/polaris-icons";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import { MiniPopupPreview } from "./MiniPopupPreview";

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
});

const previewContainerStyle: React.CSSProperties = {
  height: "180px", // Taller to fit entire popup preview
  overflow: "hidden",
  backgroundColor: "var(--p-color-bg-surface-secondary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderBottom: "1px solid var(--p-color-border-secondary)",
};

const contentStyle: React.CSSProperties = {
  padding: "12px",
};

const iconStyle: React.CSSProperties = {
  fontSize: "24px",
  lineHeight: 1,
};

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
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      style={getCardStyle(isSelected, isHovered)}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
  );
}

