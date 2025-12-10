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

  /** Whether template supports layout selection (affects Layout and Mobile Layout selectors)
   *  - true or undefined: show layout selectors
   *  - false: hide layout selectors (template has fixed layout)
   */
  usesLayout?: boolean;
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

  // Promotional modals - size and displayMode are recipe-controlled only
  FLASH_SALE: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: true,
    usesImage: true, // Supports full background image with overlay
    usesTypographyAdvanced: true,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center", "top", "bottom"],
    supportsSize: [], // Size is controlled by recipes (popup vs banner mode)
    supportsDisplayMode: false, // Display mode (popup/banner) is recipe-controlled only
    supportedImagePositions: ["full", "none"], // Only full background or no image
    /** @note Layout/MobileLayout selectors are hidden - FlashSale only supports centered with optional overlay background */
    usesLayout: false,
  },

  // Gamification templates
  SPIN_TO_WIN: {
    usesButtons: true,
    usesInputs: true,
    usesOverlay: true,
    usesImage: true, // Supports full background image behind wheel
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true,
    supportsPosition: ["center"],
    supportsSize: ["medium", "large"],
    // Layout is fixed for SpinToWin (wheel left + form right on desktop, stacked on mobile)
    // The wheel IS the visual element and cannot be repositioned like an image
    supportedImagePositions: ["full", "none"], // Only full background or no image (layout selector hidden)
    /** @note Layout/MobileLayout selectors are hidden because SpinToWin has a fixed layout */
    usesLayout: false,
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

  // =============================================================================
  // NEW UPSELL POPUP TEMPLATES
  // =============================================================================

  // Classic centered modal for single product upsells
  CLASSIC_UPSELL: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: true,
    usesImage: true,
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: false,
    supportsPosition: ["center"],
    supportsSize: ["small", "medium", "large"],
    supportedImagePositions: ["left", "right", "none"],
    usesLayout: false, // Fixed layout
  },

  // Minimal slide-up bottom sheet for mobile
  MINIMAL_SLIDE_UP: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: true,
    usesImage: true,
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: false,
    supportsPosition: ["bottom"],
    supportsSize: ["small", "medium"],
    supportedImagePositions: ["left", "none"],
    usesLayout: false, // Fixed bottom sheet layout
  },

  // Premium fullscreen takeover for high-value products
  PREMIUM_FULLSCREEN: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: true,
    usesImage: true,
    usesTypographyAdvanced: true,
    usesAccent: true,
    usesSuccessWarning: false,
    supportsPosition: ["center"],
    supportsSize: ["large"],
    supportedImagePositions: ["left", "right", "full"],
    usesLayout: false, // Fixed fullscreen layout
  },

  // Countdown urgency with timer
  COUNTDOWN_URGENCY: {
    usesButtons: true,
    usesInputs: false,
    usesOverlay: true,
    usesImage: true,
    usesTypographyAdvanced: false,
    usesAccent: true,
    usesSuccessWarning: true, // Uses warning colors for urgency
    supportsPosition: ["center"],
    supportsSize: ["medium", "large"],
    supportedImagePositions: ["left", "right", "none"],
    usesLayout: false, // Fixed countdown layout
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
