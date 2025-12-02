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
  Tag,
  Divider,
} from "@shopify/polaris";
import { ChevronRightIcon, XSmallIcon } from "@shopify/polaris-icons";
import {
  RECIPE_CATEGORIES,
  RECIPE_TAG_LABELS,
  type RecipeCategory,
  type RecipeTag,
  type StyledRecipe,
} from "../../recipes/styled-recipe-types";
import { RecipeCard } from "./RecipeCard";

// Industry tags for filtering newsletter design recipes
const INDUSTRY_TAGS: RecipeTag[] = [
  "fashion",
  "beauty",
  "food",
  "tech",
  "fitness",
  "home",
  "outdoor",
  "wellness",
  "luxury",
];

// Style tags for filtering
const STYLE_TAGS: RecipeTag[] = [
  "minimal",
  "bold",
  "elegant",
  "warm",
  "dark",
  "modern",
];

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

  // Track selected tags for filtering
  const [selectedTags, setSelectedTags] = useState<RecipeTag[]>([]);

  // Toggle a tag selection
  const toggleTag = (tag: RecipeTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Clear all tag filters
  const clearTags = () => setSelectedTags([]);

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

  // Get filtered recipes based on selected category AND tags
  const filteredRecipes = useMemo(() => {
    let result: StyledRecipe[];

    if (selectedCategory === "all") {
      result = [...recipes];
    } else {
      result = recipesByCategory[selectedCategory] || [];
    }

    // Apply tag filters (AND logic - must match all selected tags)
    if (selectedTags.length > 0) {
      result = result.filter((recipe) =>
        selectedTags.every((tag) => recipe.tags?.includes(tag))
      );
    }

    // Sort: featured first, then by name
    return result.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [selectedCategory, selectedTags, recipes, recipesByCategory]);

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

          {/* Tag Filters */}
          <Card>
            <BlockStack gap="300">
              {/* Industry Tags */}
              <BlockStack gap="200">
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  Industry
                </Text>
                <InlineStack gap="200" wrap>
                  {INDUSTRY_TAGS.map((tag) => (
                    <Tag
                      key={tag}
                      onClick={() => toggleTag(tag)}
                    >
                      <span style={{
                        opacity: selectedTags.includes(tag) ? 1 : 0.6,
                        fontWeight: selectedTags.includes(tag) ? 600 : 400,
                      }}>
                        {selectedTags.includes(tag) ? "✓ " : ""}{RECIPE_TAG_LABELS[tag]}
                      </span>
                    </Tag>
                  ))}
                </InlineStack>
              </BlockStack>

              <Divider />

              {/* Style Tags */}
              <BlockStack gap="200">
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  Style
                </Text>
                <InlineStack gap="200" wrap>
                  {STYLE_TAGS.map((tag) => (
                    <Tag
                      key={tag}
                      onClick={() => toggleTag(tag)}
                    >
                      <span style={{
                        opacity: selectedTags.includes(tag) ? 1 : 0.6,
                        fontWeight: selectedTags.includes(tag) ? 600 : 400,
                      }}>
                        {selectedTags.includes(tag) ? "✓ " : ""}{RECIPE_TAG_LABELS[tag]}
                      </span>
                    </Tag>
                  ))}
                </InlineStack>
              </BlockStack>

              {/* Clear filters */}
              {selectedTags.length > 0 && (
                <InlineStack align="end">
                  <Button variant="plain" onClick={clearTags}>
                    {`Clear filters (${selectedTags.length})`}
                  </Button>
                </InlineStack>
              )}
            </BlockStack>
          </Card>

          {/* Recipe Grid */}
          <InlineGrid columns={{ xs: 1, sm: 2, md: 3, lg: 3 }} gap="400">
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
                  {selectedTags.length > 0
                    ? "No recipes match the selected filters."
                    : "No recipes in this category yet."}
                </Text>
                <InlineStack gap="200">
                  {selectedTags.length > 0 && (
                    <Button onClick={clearTags}>Clear filters</Button>
                  )}
                  <Button onClick={() => { setSelectedCategory("all"); clearTags(); }}>
                    View all recipes
                  </Button>
                </InlineStack>
              </BlockStack>
            </Box>
          )}
        </BlockStack>
      </div>
    </div>
  );
}

