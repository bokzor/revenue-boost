/**
 * RecipeCategorySection Component
 *
 * Displays a category of recipes with horizontal scrolling or grid layout.
 */

import React from "react";
import { Box, Text, InlineStack, BlockStack, Button } from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import type { RecipeCategoryMeta, StyledRecipe } from "../../recipes/styled-recipe-types";
import { RecipeCard } from "./RecipeCard";
import { PreviewProvider } from "./PreviewContext";

// =============================================================================
// TYPES
// =============================================================================

export interface RecipeCategorySectionProps {
  /** Category metadata */
  category: RecipeCategoryMeta;

  /** Recipes to display */
  recipes: StyledRecipe[];

  /** Currently selected recipe ID */
  selectedRecipeId?: string;

  /** Called when a recipe is selected */
  onSelect: (recipe: StyledRecipe) => void;

  /** Show mini previews */
  showPreviews?: boolean;

  /** Whether to show large preview on hover (default: true). When false, preview appears on click */
  hoverPreviewEnabled?: boolean;

  /** Is this category expanded */
  isExpanded?: boolean;

  /** Show "See all" button */
  showSeeAll?: boolean;

  /** Total count of recipes in this category */
  totalCount?: number;

  /** Called when expand/collapse is toggled */
  onToggleExpand?: () => void;
}

// =============================================================================
// STYLES
// =============================================================================

const categoryHeaderStyle: React.CSSProperties = {
  marginBottom: "12px",
};

const recipeGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "16px",
};

// For horizontal scrolling on smaller screens
const recipeScrollStyle: React.CSSProperties = {
  display: "flex",
  gap: "16px",
  overflowX: "auto",
  paddingBottom: "8px",
  scrollSnapType: "x mandatory",
};

const recipeScrollItemStyle: React.CSSProperties = {
  flex: "0 0 220px",
  scrollSnapAlign: "start",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function RecipeCategorySection({
  category,
  recipes,
  selectedRecipeId,
  onSelect,
  showPreviews = true,
  hoverPreviewEnabled = true,
  isExpanded = false,
  showSeeAll = false,
  totalCount = 0,
  onToggleExpand,
}: RecipeCategorySectionProps) {
  const remainingCount = totalCount - recipes.length;

  return (
    <PreviewProvider>
    <Box>
      {/* Category Header */}
      <div style={categoryHeaderStyle}>
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Text as="span" variant="headingMd">
              {category.icon} {category.label}
            </Text>
            <Text as="span" variant="bodySm" tone="subdued">
              {totalCount} {totalCount === 1 ? "recipe" : "recipes"}
            </Text>
          </InlineStack>

          {showSeeAll && onToggleExpand && (
            <Button
              variant="plain"
              onClick={onToggleExpand}
              icon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
            >
              {isExpanded ? "Show less" : `See all ${remainingCount > 0 ? `(+${remainingCount})` : ""}`}
            </Button>
          )}
        </InlineStack>

        {/* Category description - only show when expanded or few recipes */}
        {(isExpanded || recipes.length <= 4) && (
          <Text as="p" variant="bodySm" tone="subdued">
            {category.description}
          </Text>
        )}
      </div>

      {/* Recipe Grid */}
      <div style={isExpanded ? recipeGridStyle : recipeScrollStyle}>
        {recipes.map((recipe) => (
          <div key={recipe.id} style={isExpanded ? undefined : recipeScrollItemStyle}>
            <RecipeCard
              recipe={recipe}
              isSelected={selectedRecipeId === recipe.id}
              onSelect={() => onSelect(recipe)}
              showPreview={showPreviews}
              hoverPreviewEnabled={hoverPreviewEnabled}
            />
          </div>
        ))}
      </div>
    </Box>
    </PreviewProvider>
  );
}

