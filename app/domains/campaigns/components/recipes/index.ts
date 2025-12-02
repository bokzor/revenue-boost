/**
 * Recipe Components
 *
 * Components for the recipe-based campaign creation flow.
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

// Recipe picker - main component for selecting recipes
export { RecipePicker } from "./RecipePicker";
export type { RecipePickerProps } from "./RecipePicker";

// Recipe card - individual recipe display
export { RecipeCard } from "./RecipeCard";
export type { RecipeCardProps } from "./RecipeCard";

// Mini popup preview - scaled-down preview in cards
export { MiniPopupPreview } from "./MiniPopupPreview";
export type { MiniPopupPreviewProps } from "./MiniPopupPreview";

// Legacy components (kept for backwards compatibility)
export { RecipeConfigurationModal } from "./RecipeConfigurationModal";
export { RecipeCategorySection } from "./RecipeCategorySection";
export type { RecipeCategorySectionProps } from "./RecipeCategorySection";
export { RecipeQuickSetup } from "./RecipeQuickSetup";
export type { RecipeQuickSetupProps } from "./RecipeQuickSetup";
export { RecipeEditor } from "./RecipeEditor";
export type { RecipeEditorProps } from "./RecipeEditor";

