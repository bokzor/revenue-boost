/**
 * RecipePicker Component
 *
 * Step 1 of the Recipe Flow - allows users to browse and select a styled recipe.
 * Left sidebar with categories, right content area with recipe cards.
 *
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

import React, { useState, useMemo } from "react";
import {
  Box,
  Text,
  InlineStack,
  BlockStack,
  Button,
  InlineGrid,
  Card,
} from "@shopify/polaris";
import { ChevronRightIcon } from "@shopify/polaris-icons";
import {
  RECIPE_CATEGORIES,
  type RecipeCategory,
  type StyledRecipe,
} from "../../recipes/styled-recipe-types";
import { RecipeCard } from "./RecipeCard";

// =============================================================================
// TYPES
// =============================================================================

export interface RecipePickerProps {
  /** All available styled recipes */
  recipes: StyledRecipe[];

  /** Currently selected recipe (if any) */
  selectedRecipeId?: string;

  /** Called when a recipe is selected */
  onSelect: (recipe: StyledRecipe) => void;

  /** Called when user wants to build from scratch */
  onBuildFromScratch?: () => void;

  /** Maximum recipes to show per category before "See all" */
  maxPerCategory?: number;

  /** Show mini previews in cards */
  showPreviews?: boolean;
}

// =============================================================================
// STYLES
// =============================================================================

const sidebarItemStyle = (isActive: boolean): React.CSSProperties => ({
  padding: "12px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  backgroundColor: isActive
    ? "var(--p-color-bg-surface-selected)"
    : "transparent",
  border: isActive
    ? "1px solid var(--p-color-border-interactive)"
    : "1px solid transparent",
  transition: "all 0.15s ease",
});

const sidebarItemHoverStyle: React.CSSProperties = {
  backgroundColor: "var(--p-color-bg-surface-hover)",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function RecipePicker({
  recipes,
  selectedRecipeId,
  onSelect,
  onBuildFromScratch,
  showPreviews = true,
}: RecipePickerProps) {
  // Track selected category (null = all)
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | "all">("all");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Group recipes by category
  const recipesByCategory = useMemo(() => {
    const grouped: Record<RecipeCategory, StyledRecipe[]> = {
      email_leads: [],
      sales_promos: [],
      cart_recovery: [],
      announcements: [],
    };

    recipes.forEach((recipe) => {
      if (grouped[recipe.category]) {
        grouped[recipe.category].push(recipe);
      }
    });

    // Sort each category: featured first, then by name
    Object.keys(grouped).forEach((key) => {
      const category = key as RecipeCategory;
      grouped[category].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [recipes]);

  // Get filtered recipes based on selected category
  const filteredRecipes = useMemo(() => {
    if (selectedCategory === "all") {
      // Show all recipes, sorted by featured then name
      return [...recipes].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      });
    }
    return recipesByCategory[selectedCategory] || [];
  }, [selectedCategory, recipes, recipesByCategory]);

  // Order of categories to display
  const categoryOrder: RecipeCategory[] = [
    "sales_promos",
    "email_leads",
    "cart_recovery",
    "announcements",
  ];

  return (
    <div style={{ display: "flex", gap: "24px", minHeight: "600px" }}>
      {/* Left Sidebar - Categories */}
      <div style={{ width: "240px", flexShrink: 0 }}>
        <Card>
          <BlockStack gap="100">
            <Text as="h3" variant="headingMd">
              Categories
            </Text>

            <BlockStack gap="100">
              {/* All Recipes */}
              <div
                style={{
                  ...sidebarItemStyle(selectedCategory === "all"),
                  ...(hoveredCategory === "all" && selectedCategory !== "all"
                    ? sidebarItemHoverStyle
                    : {}),
                }}
                onClick={() => setSelectedCategory("all")}
                onMouseEnter={() => setHoveredCategory("all")}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span">📚</Text>
                    <Text
                      as="span"
                      variant="bodyMd"
                      fontWeight={selectedCategory === "all" ? "semibold" : "regular"}
                    >
                      All Recipes
                    </Text>
                  </InlineStack>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {recipes.length}
                  </Text>
                </InlineStack>
              </div>

              {/* Category items */}
              {categoryOrder.map((category) => {
                const categoryMeta = RECIPE_CATEGORIES[category];
                const count = recipesByCategory[category].length;
                const isActive = selectedCategory === category;
                const isHovered = hoveredCategory === category;

                if (count === 0) return null;

                return (
                  <div
                    key={category}
                    style={{
                      ...sidebarItemStyle(isActive),
                      ...(isHovered && !isActive ? sidebarItemHoverStyle : {}),
                    }}
                    onClick={() => setSelectedCategory(category)}
                    onMouseEnter={() => setHoveredCategory(category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="200" blockAlign="center">
                        <Text as="span">{categoryMeta.icon}</Text>
                        <Text
                          as="span"
                          variant="bodyMd"
                          fontWeight={isActive ? "semibold" : "regular"}
                        >
                          {categoryMeta.label}
                        </Text>
                      </InlineStack>
                      <Text as="span" variant="bodySm" tone="subdued">
                        {count}
                      </Text>
                    </InlineStack>
                  </div>
                );
              })}
            </BlockStack>

            {/* Build from scratch */}
            {onBuildFromScratch && (
              <>
                <Box paddingBlockStart="400" paddingBlockEnd="200">
                  <div
                    style={{
                      height: "1px",
                      backgroundColor: "var(--p-color-border-secondary)",
                    }}
                  />
                </Box>
                <div
                  style={{
                    ...sidebarItemStyle(false),
                    ...(hoveredCategory === "scratch" ? sidebarItemHoverStyle : {}),
                  }}
                  onClick={onBuildFromScratch}
                  onMouseEnter={() => setHoveredCategory("scratch")}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span">🛠️</Text>
                    <Text as="span" variant="bodyMd">
                      Build from scratch
                    </Text>
                  </InlineStack>
                </div>
              </>
            )}
          </BlockStack>
        </Card>
      </div>

      {/* Right Content - Recipe Cards */}
      <div style={{ flex: 1 }}>
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h2" variant="headingLg">
              {selectedCategory === "all"
                ? "All Recipes"
                : RECIPE_CATEGORIES[selectedCategory].label}
            </Text>
            <Text as="span" tone="subdued">
              {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""}
            </Text>
          </InlineStack>

          {/* Recipe Grid */}
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap="400">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isSelected={recipe.id === selectedRecipeId}
                onSelect={() => onSelect(recipe)}
                showPreview={showPreviews}
                size="medium"
              />
            ))}
          </InlineGrid>

          {/* Empty state */}
          {filteredRecipes.length === 0 && (
            <Box padding="800" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="200" inlineAlign="center">
                <Text as="p" variant="bodyMd" tone="subdued">
                  No recipes in this category yet.
                </Text>
                <Button onClick={() => setSelectedCategory("all")}>View all recipes</Button>
              </BlockStack>
            </Box>
          )}
        </BlockStack>
      </div>
    </div>
  );
}

