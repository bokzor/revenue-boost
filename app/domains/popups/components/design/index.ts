// Popup Design System Components
export { default as PopupDesignEditor } from "./PopupDesignEditor";
export { TemplateSelector } from "./TemplateSelector";
export { StyleCustomizationPanel } from "./StyleCustomizationPanel";
// PopupPreview has been removed as it was legacy code.
// Active preview components are TemplatePreview and LivePreviewPanel.
export { CustomCSSEditor } from "./CustomCSSEditor";

// Template Library
export { getTemplateById, getPopupTemplates, validatePopupTemplates } from "./PopupTemplateLibrary";

// Types
export type { PopupDesignConfig } from "./PopupDesignEditor";
export type { TemplateSelectorProps } from "./TemplateSelector";
export type { StyleCustomizationPanelProps } from "./StyleCustomizationPanel";
