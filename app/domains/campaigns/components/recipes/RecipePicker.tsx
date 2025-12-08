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
  RECIPE_TAG_LABELS,
  type RecipeTag,
  type StyledRecipe,
} from "../../recipes/styled-recipe-types";
import type { DesignTokens } from "../../types/design-tokens";
import { RecipeCard } from "./RecipeCard";
import { PreviewProvider } from "./PreviewContext";
import type { TemplateType } from "../../types/campaign";
import { TEMPLATE_REGISTRY } from "~/domains/templates/registry/template-registry";

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
  "luxury",
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

  /** Whether to show large preview on hover (default: true). When false, preview appears on click */
  hoverPreviewEnabled?: boolean;

  /** Default theme tokens from store's default preset (for preview when themeMode is "default") */
  defaultThemeTokens?: DesignTokens;

  /** Filter recipes by goal (null = show all) */
  selectedGoal?: string | null;
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
  hoverPreviewEnabled = true,
  defaultThemeTokens,
  selectedGoal = null,
}: RecipePickerProps) {
  // Track selected template type filter (null = all)
  const [selectedTemplateType, setSelectedTemplateType] = useState<TemplateType | "all">("all");
  const [hoveredTemplateType, setHoveredTemplateType] = useState<string | null>(null);

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

  // Filter recipes by external goal prop first (if passed from parent)
  const goalFilteredRecipes = useMemo(() => {
    if (!selectedGoal) return recipes;
    return recipes.filter((recipe) => recipe.goal === selectedGoal);
  }, [recipes, selectedGoal]);

  // Get unique template types from filtered recipes (preserves order)
  const availableTemplateTypes = useMemo(() => {
    const types = new Set<TemplateType>();
    goalFilteredRecipes.forEach((recipe) => {
      types.add(recipe.templateType);
    });
    return Array.from(types);
  }, [goalFilteredRecipes]);

  // Group recipes by template type
  const recipesByTemplateType = useMemo(() => {
    const grouped: Partial<Record<TemplateType, StyledRecipe[]>> = {};

    goalFilteredRecipes.forEach((recipe) => {
      if (!grouped[recipe.templateType]) {
        grouped[recipe.templateType] = [];
      }
      grouped[recipe.templateType]!.push(recipe);
    });

    // Sort each template type group: "Uses store theme" (use_case) first, then featured, then by name
    Object.keys(grouped).forEach((key) => {
      const templateType = key as TemplateType;
      grouped[templateType]!.sort((a, b) => {
        // "Uses store theme" recipes first
        const aUsesStoreTheme = a.recipeType === "use_case";
        const bUsesStoreTheme = b.recipeType === "use_case";
        if (aUsesStoreTheme && !bUsesStoreTheme) return -1;
        if (!aUsesStoreTheme && bUsesStoreTheme) return 1;
        // Then featured
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [goalFilteredRecipes]);

  // Get filtered recipes based on selected template type AND tags
  const filteredRecipes = useMemo(() => {
    let result: StyledRecipe[];

    if (selectedTemplateType === "all") {
      result = [...goalFilteredRecipes];
    } else {
      result = recipesByTemplateType[selectedTemplateType] || [];
    }

    // Apply tag filters (AND logic - must match all selected tags)
    if (selectedTags.length > 0) {
      result = result.filter((recipe) =>
        selectedTags.every((tag) => recipe.tags?.includes(tag))
      );
    }

    // Sort: "Uses store theme" (use_case) first, then featured, then by name
    return result.sort((a, b) => {
      // "Uses store theme" recipes first
      const aUsesStoreTheme = a.recipeType === "use_case";
      const bUsesStoreTheme = b.recipeType === "use_case";
      if (aUsesStoreTheme && !bUsesStoreTheme) return -1;
      if (!aUsesStoreTheme && bUsesStoreTheme) return 1;
      // Then featured
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [selectedTemplateType, selectedTags, goalFilteredRecipes, recipesByTemplateType]);

  // Map template types to icons for display
  const templateTypeIcons: Record<TemplateType, string> = {
    NEWSLETTER: "📧",
    SPIN_TO_WIN: "🎡",
    SCRATCH_CARD: "🎟️",
    FLASH_SALE: "⚡",
    COUNTDOWN_TIMER: "⏱️",
    FREE_SHIPPING: "🚚",
    CART_ABANDONMENT: "🛒",
    PRODUCT_UPSELL: "🛍️",
    SOCIAL_PROOF: "👥",
    ANNOUNCEMENT: "📢",
    EXIT_INTENT: "🚪",
    CLASSIC_UPSELL: "🎁",
    MINIMAL_SLIDE_UP: "📱",
    PREMIUM_FULLSCREEN: "✨",
    COUNTDOWN_URGENCY: "🔥",
  };

  return (
    <PreviewProvider>
    <div style={{ display: "flex", gap: "24px", minHeight: "600px" }}>
      {/* Left Sidebar - Template Types (sticky) */}
      <div style={{ width: "240px", flexShrink: 0 }}>
        <div style={{ position: "sticky", top: "16px" }}>
        <Card>
          <BlockStack gap="100">
            <Text as="h3" variant="headingMd">
              Popup Type
            </Text>

            <BlockStack gap="100">
              {/* All Recipes */}
              <div
                style={{
                  ...sidebarItemStyle(selectedTemplateType === "all"),
                  ...(hoveredTemplateType === "all" && selectedTemplateType !== "all"
                    ? sidebarItemHoverStyle
                    : {}),
                }}
                onClick={() => setSelectedTemplateType("all")}
                onMouseEnter={() => setHoveredTemplateType("all")}
                onMouseLeave={() => setHoveredTemplateType(null)}
              >
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span">📚</Text>
                    <Text
                      as="span"
                      variant="bodyMd"
                      fontWeight={selectedTemplateType === "all" ? "semibold" : "regular"}
                    >
                      All Types
                    </Text>
                  </InlineStack>
                  <Text as="span" variant="bodySm" tone="subdued">
                    {goalFilteredRecipes.length}
                  </Text>
                </InlineStack>
              </div>

              {/* Template type items */}
              {availableTemplateTypes.map((templateType) => {
                const templateMeta = TEMPLATE_REGISTRY[templateType];
                const count = recipesByTemplateType[templateType]?.length || 0;
                const isActive = selectedTemplateType === templateType;
                const isHovered = hoveredTemplateType === templateType;

                if (count === 0) return null;

                return (
                  <div
                    key={templateType}
                    style={{
                      ...sidebarItemStyle(isActive),
                      ...(isHovered && !isActive ? sidebarItemHoverStyle : {}),
                    }}
                    onClick={() => setSelectedTemplateType(templateType)}
                    onMouseEnter={() => setHoveredTemplateType(templateType)}
                    onMouseLeave={() => setHoveredTemplateType(null)}
                  >
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="200" blockAlign="center">
                        <Text as="span">{templateTypeIcons[templateType] || "📄"}</Text>
                        <Text
                          as="span"
                          variant="bodyMd"
                          fontWeight={isActive ? "semibold" : "regular"}
                        >
                          {templateMeta?.label || templateType}
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
                    ...(hoveredTemplateType === "scratch" ? sidebarItemHoverStyle : {}),
                  }}
                  onClick={onBuildFromScratch}
                  onMouseEnter={() => setHoveredTemplateType("scratch")}
                  onMouseLeave={() => setHoveredTemplateType(null)}
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
      </div>

      {/* Right Content - Recipe Cards */}
      <div style={{ flex: 1 }}>
        <BlockStack gap="400">
          {/* Header */}
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h2" variant="headingLg">
              {selectedTemplateType === "all"
                ? "All Recipes"
                : TEMPLATE_REGISTRY[selectedTemplateType]?.label || selectedTemplateType}
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
                hoverPreviewEnabled={hoverPreviewEnabled}
                size="medium"
                defaultThemeTokens={defaultThemeTokens}
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
    </PreviewProvider>
  );
}

