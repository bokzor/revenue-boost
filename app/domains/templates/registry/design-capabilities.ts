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

/** Image position options for templates */
export type ImagePositionOption = "left" | "right" | "top" | "bottom" | "full" | "none";

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

  /** Whether template supports displayMode toggle (banner vs popup) */
  supportsDisplayMode?: boolean;

  /** Supported image position values (constrains Image Position dropdown options)
   *  - "left", "right", "top", "bottom": side panel image
   *  - "full": full background image with overlay
   *  - "none": no image
   */
  supportedImagePositions?: ImagePositionOption[];
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
    supportedImagePositions: ["left", "right", "top", "bottom", "full", "none"],
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
    supportedImagePositions: ["left", "right", "top", "bottom", "full", "none"],
  },

  // Banner/bar templates (no overlay, no inputs, full-width)
  FREE_SHIPPING: {
    usesButtons: false,
    usesInputs: false,
    usesOverlay: false,
    usesImage: false,
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["top", "bottom"],
    supportsSize: [], // Full-width bar, size not applicable
  },

  // Promotional modals (uses popupSize instead of size)
  FLASH_SALE: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: true,
    usesImage: true, // Supports full background image with overlay
    usesTypographyAdvanced: true,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center", "top", "bottom"],
    supportsSize: [], // Uses popupSize (compact/standard/wide/full) instead
    supportsDisplayMode: true, // Show display mode toggle (banner vs popup)
    supportedImagePositions: ["full", "none"], // Only full background or no image
  },

  // Gamification templates
  SPIN_TO_WIN: {
    usesButtons: true,
    usesInputs: true,
    usesOverlay: true,
    usesImage: true, // Now supports full background image
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center"],
    supportsSize: ["medium", "large"],
    supportedImagePositions: ["full", "none"], // Only full background or no image
  },

  SCRATCH_CARD: {
    usesButtons: true,
    usesInputs: true,
    usesOverlay: true,
    usesImage: true, // Background image behind scratch card
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center"],
    supportsSize: ["small", "medium"],
    supportedImagePositions: ["left", "right", "full", "none"], // Side panels or full background
  },

  // Recovery/cart templates
  CART_ABANDONMENT: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: false,
    usesImage: false, // Uses line item images only, no design image
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
    usesImage: false, // Uses product images only, no design image
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center"],
    supportsSize: ["small", "medium", "large"],
  },

  // Corner notification (uses cornerPosition from content config, not design position)
  SOCIAL_PROOF: {
    usesButtons: false,
    usesInputs: false,
    usesOverlay: false,
    usesImage: false, // Uses product images only, no design background
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: false,
    supportsPosition: [], // Uses cornerPosition (bottom-left/top-right/etc) from content config instead
    supportsSize: [], // Fixed corner notification, size not applicable
  },

  // Countdown Timer - supports both banner and popup mode
  COUNTDOWN_TIMER: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: true, // Popup mode uses overlay
    usesImage: true, // Full background support (modal mode)
    supportedImagePositions: ["full", "none"], // Only full background or none
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center", "top", "bottom"], // Center for popup, top/bottom for banner
    supportsSize: ["small", "medium", "large"], // Size applies in popup mode
    supportsDisplayMode: true, // Show display mode toggle (banner vs popup)
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
    supportsSize: [], // Full-width banner, size not applicable
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
