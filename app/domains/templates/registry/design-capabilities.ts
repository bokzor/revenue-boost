/**
 * Design Capabilities Registry
 * 
 * Static, code-only capability matrix to gate UI controls per template.
 * Does not affect schemas or persistence - DesignConfig remains a superset.
 * 
 * Purpose: Hide irrelevant design controls for templates that don't use them,
 * while keeping a unified data model across all templates.
 */

import type { TemplateType } from "~/domains/campaigns/types/campaign";

/**
 * Design capability flags for a template
 */
export type DesignCapabilities = {
  /** Whether template uses buttons (affects Button Colors group) */
  usesButtons?: boolean;
  
  /** Whether template uses input fields (affects Input Colors group) */
  usesInputs?: boolean;
  
  /** Whether template uses modal overlay (affects Overlay Settings group) */
  usesOverlay?: boolean;
  
  /** Whether template uses background images (affects Image Configuration group) */
  usesImage?: boolean;
  
  /** Whether template uses advanced typography controls (reserved for future) */
  usesTypographyAdvanced?: boolean;
  
  /** Whether template uses accent color (affects Main Colors group) */
  usesAccent?: boolean;
  
  /** Whether template uses success/warning colors (affects state color controls) */
  usesSuccessWarning?: boolean;
  
  /** Supported position values (constrains Position dropdown options) */
  supportsPosition?: Array<"center" | "top" | "bottom" | "left" | "right">;
  
  /** Supported size values (constrains Size dropdown options) */
  supportsSize?: Array<"small" | "medium" | "large">;
};

/**
 * Template Design Capabilities Map
 * 
 * Defines which design controls are relevant for each template type.
 * - undefined capability = show control (default permissive)
 * - true = show control
 * - false = hide control
 */
export const TEMPLATE_DESIGN_CAPABILITIES: Record<TemplateType, DesignCapabilities> = {
  // Full-featured modal templates
  NEWSLETTER: {
    usesButtons: true,
    usesInputs: true,
    usesOverlay: true,
    usesImage: true,
    usesTypographyAdvanced: true,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center", "top", "bottom", "left", "right"],
    supportsSize: ["small", "medium", "large"],
  },
  
  EXIT_INTENT: {
    usesButtons: true,
    usesInputs: true,
    usesOverlay: true,
    usesImage: true,
    usesTypographyAdvanced: true,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center", "top", "bottom", "left", "right"],
    supportsSize: ["small", "medium", "large"],
  },
  
  // Banner/bar templates (no overlay, no inputs)
  FREE_SHIPPING: {
    usesButtons: false,
    usesInputs: false,
    usesOverlay: false,
    usesImage: false,
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["top", "bottom"],
    supportsSize: ["small", "medium"],
  },
  
  // Promotional modals
  FLASH_SALE: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: true,
    usesImage: true,
    usesTypographyAdvanced: true,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center", "top", "bottom"],
    supportsSize: ["small", "medium", "large"],
  },
  
  // Gamification templates
  SPIN_TO_WIN: {
    usesButtons: true,
    usesInputs: true,
    usesOverlay: true,
    usesImage: false, // Wheel is generated, not an image
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center"],
    supportsSize: ["medium", "large"],
  },
  
  SCRATCH_CARD: {
    usesButtons: true,
    usesInputs: true,
    usesOverlay: true,
    usesImage: false, // Scratch canvas, not background image
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center"],
    supportsSize: ["small", "medium"],
  },
  
  // Recovery/cart templates
  CART_ABANDONMENT: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: false,
    usesImage: true,
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center", "bottom"],
    supportsSize: ["small", "medium", "large"],
  },
  
  // Product recommendation
  PRODUCT_UPSELL: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: false,
    usesImage: true,
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center"],
    supportsSize: ["small", "medium", "large"],
  },
  
  // Corner notification
  SOCIAL_PROOF: {
    usesButtons: false,
    usesInputs: false,
    usesOverlay: false,
    usesImage: true, // Product images
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: false,
    supportsPosition: ["bottom", "top", "left", "right"],
    supportsSize: ["small"],
  },
  
  // Banner/sticky templates
  COUNTDOWN_TIMER: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: false,
    usesImage: false,
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["top", "bottom"],
    supportsSize: ["small", "medium"],
  },
  
  ANNOUNCEMENT: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: false,
    usesImage: false,
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: false,
    supportsPosition: ["top", "bottom"],
    supportsSize: ["small", "medium"],
  },
};

/**
 * Get design capabilities for a template type
 * Returns undefined if template type is not found (permissive fallback)
 */
export function getDesignCapabilities(templateType?: TemplateType): DesignCapabilities | undefined {
  if (!templateType) {
    return undefined;
  }
  
  return TEMPLATE_DESIGN_CAPABILITIES[templateType];
}
