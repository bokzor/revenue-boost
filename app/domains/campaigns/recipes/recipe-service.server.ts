/**
 * Recipe Service
 *
 * Provides lazy-loaded access to recipes with caching.
 *
 * Architecture:
 * - Today: Returns static recipes from catalog (STYLED_RECIPES)
 * - Future: Fetches from database with caching
 *
 * The service is lazy-loaded - recipes are only loaded when first requested,
 * then cached for subsequent calls within the same request.
 */

import type { StyledRecipe } from "./styled-recipe-types";
import type { BackgroundPreset } from "~/config/background-presets";
import { getBackgroundsForLayout as getBackgroundsForLayoutUtil } from "~/config/background-presets";

// Lazy-loaded cache for recipes
let cachedRecipes: StyledRecipe[] | null = null;

/**
 * Lazily load recipes from the catalog.
 * In the future, this will fetch from the database.
 */
async function loadRecipes(): Promise<StyledRecipe[]> {
  if (cachedRecipes) {
    return cachedRecipes;
  }

  // Dynamic import for lazy loading - only loads the catalog when needed
  const { STYLED_RECIPES } = await import("./styled-recipe-catalog");
  cachedRecipes = STYLED_RECIPES;

  // TODO: Replace with database fetch when recipes move to DB
  // cachedRecipes = await prisma.recipe.findMany({ where: { active: true } });

  return cachedRecipes;
}

/**
 * Get all recipes.
 * Lazy-loaded and cached.
 */
export async function getAllRecipes(): Promise<StyledRecipe[]> {
  return loadRecipes();
}

/**
 * Get a recipe by ID.
 */
export async function getRecipeById(id: string): Promise<StyledRecipe | undefined> {
  const recipes = await getAllRecipes();
  return recipes.find((r) => r.id === id);
}

/**
 * Get recipes that use a specific layout.
 */
export async function getRecipesByLayout(layout: string): Promise<StyledRecipe[]> {
  const recipes = await getAllRecipes();
  return recipes.filter((r) => r.layout === layout);
}

/**
 * Get recipes by category.
 */
export async function getRecipesByCategory(category: string): Promise<StyledRecipe[]> {
  const recipes = await getAllRecipes();
  return recipes.filter((r) => r.category === category);
}

/**
 * Get featured recipes.
 */
export async function getFeaturedRecipes(): Promise<StyledRecipe[]> {
  const recipes = await getAllRecipes();
  return recipes.filter((r) => r.featured);
}

/**
 * Get background presets that are proven to work with a specific layout.
 * Derives suggestions from recipes that use the same layout.
 *
 * @param layout - The layout to get backgrounds for (e.g., "split-left", "overlay")
 * @returns Array of background presets used by recipes with the given layout
 */
export async function getBackgroundsForLayout(
  layout: string | undefined
): Promise<BackgroundPreset[]> {
  if (!layout) return [];

  const recipes = await getAllRecipes();
  return getBackgroundsForLayoutUtil(layout, recipes);
}

/**
 * Get a map of all layouts to their proven backgrounds.
 * Useful for loading all background data once in a loader,
 * then filtering by layout in the component.
 *
 * @returns Map of layout -> BackgroundPreset[]
 */
export async function getBackgroundsByLayoutMap(): Promise<
  Record<string, BackgroundPreset[]>
> {
  const recipes = await getAllRecipes();

  // All possible layouts we care about
  const layouts = [
    "split-left",
    "split-right",
    "overlay",
    "stacked",
    "content-only",
  ];

  const result: Record<string, BackgroundPreset[]> = {};

  for (const layout of layouts) {
    result[layout] = getBackgroundsForLayoutUtil(layout, recipes);
  }

  return result;
}

/**
 * Clear the recipe cache.
 * Useful for testing or when recipes are updated in the database.
 */
export function clearRecipeCache(): void {
  cachedRecipes = null;
}

