/**
 * Recipe Components
 *
 * Components for the recipe-based campaign creation flow.
 * @see docs/RECIPE_SYSTEM_ARCHITECTURE.md
 */

// Recipe picker (step 1)
export { RecipePicker } from "./RecipePicker";
export type { RecipePickerProps } from "./RecipePicker";

// Recipe quick setup (step 2)
export { RecipeQuickSetup } from "./RecipeQuickSetup";
export type { RecipeQuickSetupProps } from "./RecipeQuickSetup";

// Recipe editor (step 3)
export { RecipeEditor } from "./RecipeEditor";
export type { RecipeEditorProps } from "./RecipeEditor";

// Recipe card
export { RecipeCard } from "./RecipeCard";
export type { RecipeCardProps } from "./RecipeCard";

// Recipe category section
export { RecipeCategorySection } from "./RecipeCategorySection";
export type { RecipeCategorySectionProps } from "./RecipeCategorySection";

// Mini popup preview
export { MiniPopupPreview } from "./MiniPopupPreview";
export type { MiniPopupPreviewProps } from "./MiniPopupPreview";

// Legacy modal (to be refactored)
export { RecipeConfigurationModal } from "./RecipeConfigurationModal";

