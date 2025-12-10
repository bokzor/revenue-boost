/**
 * RecipeShowcaseGrid - Marketing Component for Recipe Gallery
 *
 * Displays all recipes in a filterable grid layout.
 * Designed for the marketing website to showcase ready-to-use popup designs.
 *
 * Features:
 * - Displays all 77+ recipes in a responsive grid
 * - Filter by category (Grow Email, Boost Sales, etc.)
 * - Each recipe shows a mini preview
 * - Click to see full preview
 *
 * Usage:
 * ```tsx
 * import { RecipeShowcaseGrid } from '~/shared/preview/examples/RecipeShowcaseGrid';
 *
 * export default function DesignsPage() {
 *   return <RecipeShowcaseGrid />;
 * }
 * ```
 */

import React, { useState, useMemo } from "react";
import {
  MARKETING_RECIPES,
  MARKETING_CATEGORIES,
  type MarketingCategory,
  type MarketingRecipe,
} from "../recipe-marketing-data";
import { MarketingRecipePreview } from "../MarketingRecipePreview";
import { RECIPE_TAG_LABELS, type RecipeTag } from "~/domains/campaigns/recipes/styled-recipe-types";

// =============================================================================
// TYPES
// =============================================================================

export interface RecipeShowcaseGridProps {
  /** Initial category filter */
  initialCategory?: MarketingCategory | "all";
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Whether to show the category filter */
  showFilters?: boolean;
  /** Max recipes to show (for homepage preview) */
  maxRecipes?: number;
  /** Callback when a recipe is clicked */
  onRecipeClick?: (recipe: MarketingRecipe) => void;
}

// =============================================================================
// STYLES
// =============================================================================

const gridStyles = (columns: number): React.CSSProperties => ({
  display: "grid",
  gridTemplateColumns: `repeat(${columns}, 1fr)`,
  gap: "24px",
  padding: "24px 0",
});

const cardStyles: React.CSSProperties = {
  borderRadius: "12px",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  backgroundColor: "#FFFFFF",
  overflow: "hidden",
  cursor: "pointer",
  transition: "all 0.15s ease",
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

const cardHoverStyles: React.CSSProperties = {
  ...cardStyles,
  transform: "translateY(-2px)",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
};

// Using aspect-ratio 9/16 like the admin (portrait preview)
const previewContainerStyles: React.CSSProperties = {
  aspectRatio: "9 / 16",
  overflow: "hidden",
  backgroundColor: "#f6f6f7",
  borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
  position: "relative",
};

const cardInfoStyles: React.CSSProperties = {
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  flex: "1 1 0%",
};

const filterContainerStyles: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const filterButtonStyles = (isActive: boolean): React.CSSProperties => ({
  padding: "10px 20px",
  borderRadius: "24px",
  border: "none",
  background: isActive ? "#6366F1" : "#F3F4F6",
  color: isActive ? "#FFFFFF" : "#374151",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

// =============================================================================
// COMPONENT
// =============================================================================

export const RecipeShowcaseGrid: React.FC<RecipeShowcaseGridProps> = ({
  initialCategory = "all",
  columns = 3,
  showFilters = true,
  maxRecipes,
  onRecipeClick,
}) => {
  const [activeCategory, setActiveCategory] = useState<MarketingCategory | "all">(initialCategory);
  const [hoveredRecipe, setHoveredRecipe] = useState<string | null>(null);

  // Filter recipes by category
  const filteredRecipes = useMemo(() => {
    let recipes = activeCategory === "all"
      ? MARKETING_RECIPES
      : MARKETING_RECIPES.filter((r) => r.category === activeCategory);

    if (maxRecipes) {
      recipes = recipes.slice(0, maxRecipes);
    }

    return recipes;
  }, [activeCategory, maxRecipes]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: MARKETING_RECIPES.length };
    Object.keys(MARKETING_CATEGORIES).forEach((cat) => {
      counts[cat] = MARKETING_RECIPES.filter((r) => r.category === cat).length;
    });
    return counts;
  }, []);

  return (
    <div>
      {/* Category Filters */}
      {showFilters && (
        <div style={filterContainerStyles}>
          <button
            style={filterButtonStyles(activeCategory === "all")}
            onClick={() => setActiveCategory("all")}
          >
            All Designs
            <span style={{ opacity: 0.7 }}>({categoryCounts.all})</span>
          </button>
          {Object.values(MARKETING_CATEGORIES).map((cat) => (
            <button
              key={cat.id}
              style={filterButtonStyles(activeCategory === cat.id)}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.label}
              <span style={{ opacity: 0.7 }}>({categoryCounts[cat.id]})</span>
            </button>
          ))}
        </div>
      )}

      {/* Recipe Grid */}
      <div style={gridStyles(columns)}>
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            style={hoveredRecipe === recipe.id ? cardHoverStyles : cardStyles}
            onMouseEnter={() => setHoveredRecipe(recipe.id)}
            onMouseLeave={() => setHoveredRecipe(null)}
            onClick={() => onRecipeClick?.(recipe)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onRecipeClick?.(recipe)}
          >
            {/* Preview - matching admin's structure */}
            <div style={previewContainerStyles}>
              <div style={{
                position: "absolute",
                inset: "8px",
              }}>
                <MarketingRecipePreview
                  recipe={recipe}
                  width="100%"
                  height="100%"
                />
              </div>
            </div>

            {/* Info - matching admin's styling */}
            <div style={cardInfoStyles}>
              {/* Title row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ flex: "1 1 0%", minWidth: 0 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1f2937",
                    lineHeight: 1.3,
                  }}>
                    {recipe.name}
                  </h3>
                  {/* Tagline with icon (like admin) */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "4px",
                  }}>
                    <svg
                      style={{
                        width: "14px",
                        height: "14px",
                        color: "#9ca3af",
                        flexShrink: 0,
                      }}
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
                    <span style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      lineHeight: 1.3,
                    }}>
                      {recipe.tagline}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{
                margin: "8px 0 0 0",
                fontSize: "12px",
                color: "#9ca3af",
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {recipe.description}
              </p>

              {/* Category badge */}
              <div style={{ marginTop: "8px" }}>
                <span style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: getCategoryColor(recipe.category) + "15",
                  color: getCategoryColor(recipe.category),
                  fontWeight: 500,
                }}>
                  {MARKETING_CATEGORIES[recipe.category].icon} {MARKETING_CATEGORIES[recipe.category].label}
                </span>
              </div>

              {/* Tags (max 3) */}
              {recipe.tags && recipe.tags.length > 0 && (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "4px",
                  marginTop: "8px",
                }}>
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: "#f3f4f6",
                        color: "#6b7280",
                        fontWeight: 400,
                      }}
                    >
                      {RECIPE_TAG_LABELS[tag as RecipeTag] || tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Featured/New badges */}
              {(recipe.featured || recipe.new || recipe.seasonal) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                  {recipe.featured && <Badge color="#6366F1">Featured</Badge>}
                  {recipe.new && <Badge color="#10B981">New</Badge>}
                  {recipe.seasonal && <Badge color="#F59E0B">Seasonal</Badge>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show count */}
      <div style={{ textAlign: "center", marginTop: "24px", color: "#6B7280" }}>
        Showing {filteredRecipes.length} of {MARKETING_RECIPES.length} designs
      </div>
    </div>
  );
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getCategoryColor(category: MarketingCategory): string {
  const colors: Record<MarketingCategory, string> = {
    "grow-email": "#3B82F6",    // Blue
    "boost-sales": "#10B981",   // Green
    "recover-carts": "#F59E0B", // Amber
    "announce": "#8B5CF6",      // Purple
  };
  return colors[category] || "#6B7280";
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const Badge: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <span
    style={{
      fontSize: "11px",
      padding: "2px 8px",
      borderRadius: "4px",
      backgroundColor: `${color}15`,
      color: color,
      fontWeight: 500,
    }}
  >
    {children}
  </span>
);

export default RecipeShowcaseGrid;

