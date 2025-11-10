/**
 * Content Configuration Types and Constants
 *
 * Defines the structure for template content fields and sections
 */

export type FieldType =
  | "text"
  | "textarea"
  | "color"
  | "image"
  | "layout"
  | "animation"
  | "typography"
  | "boolean"
  | "number"
  | "product"
  | "select"
  | "email"
  | "discount"
  | "prize-list"
  | "color-list"
  | "product-picker"
  | "collection-picker";

export type TemplateSection =
  | "content"
  | "theme"
  | "layout"
  | "positioning"
  | "behavior"
  | "products"
  | "advanced";

export interface FieldCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than";
  value: unknown;
}

export interface ContentFieldDefinition {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  section?: TemplateSection;
  conditions?: FieldCondition[];
  placeholder?: string;
  group?: string;
  advanced?: boolean;
}

export interface TemplateSectionMetadata {
  title: string;
  description?: string;
  icon: string;
  defaultOpen: boolean;
}

/**
 * Template section metadata
 */
export const TEMPLATE_SECTIONS: Record<TemplateSection, TemplateSectionMetadata> = {
  content: {
    title: "Content",
    description: "Main content and messaging",
    icon: "📝",
    defaultOpen: true,
  },
  theme: {
    title: "Theme & Colors",
    description: "Visual styling and branding",
    icon: "🎨",
    defaultOpen: true,
  },
  layout: {
    title: "Layout",
    description: "Structure and positioning",
    icon: "📐",
    defaultOpen: false,
  },
  positioning: {
    title: "Positioning",
    description: "Popup position and alignment",
    icon: "📍",
    defaultOpen: false,
  },
  behavior: {
    title: "Behavior",
    description: "Interactions and animations",
    icon: "⚡",
    defaultOpen: false,
  },
  products: {
    title: "Products",
    description: "Product selection and display",
    icon: "🛍️",
    defaultOpen: true,
  },
  advanced: {
    title: "Advanced",
    description: "Advanced configuration options",
    icon: "⚙️",
    defaultOpen: false,
  },
};

