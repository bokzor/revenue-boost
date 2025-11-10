// Popup Design System Components
export { default as PopupDesignEditorV2 } from "./PopupDesignEditorV2";
export { TemplateSelector } from "./TemplateSelector";
export { StyleCustomizationPanel } from "./StyleCustomizationPanel";
export { PopupPreview } from "./PopupPreview";
export { SmartTemplateRecommendations } from "./SmartTemplateRecommendations";
export { CustomCSSEditor } from "./CustomCSSEditor";

// Template Library
export {
  TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  getPopularTemplates,
  getTemplateById,
  getRecommendedTemplates,
  searchTemplates,
  getPopupTemplates,
  validatePopupTemplates,
  type TemplateCategoryInfo,
} from "./PopupTemplateLibrary";

// Types
export type { PopupTemplate } from "./PopupTemplateLibrary";
export type { PopupDesignConfig } from "./PopupDesignEditorV2";
export type { TemplateSelectorProps } from "./TemplateSelector";
export type { StyleCustomizationPanelProps } from "./StyleCustomizationPanel";
export type { PopupPreviewProps, PopupPreviewRef } from "./PopupPreview";
