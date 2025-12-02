/**
 * Shared Types for Storefront Popup Components
 *
 * ARCHITECTURE:
 * - PopupDesignConfig: Visual/design properties (colors, position, size, etc.)
 * - Content types come from campaign types (NewsletterContent, SpinToWinContent, etc.)
 * - Specific popup configs extend BOTH design + content types
 */

export type PopupPosition = "center" | "top" | "bottom" | "left" | "right";
export type PopupSize = "small" | "medium" | "large";
export type PopupAnimation = "fade" | "slide" | "bounce" | "none";
export type DisplayMode = "popup" | "banner" | "slide-in" | "inline";

// Layout types for Lead Capture family (Newsletter, Spin-to-Win, Scratch Card)
export type DesktopLayout =
  | "split-left"    // Visual left, form right (50/50)
  | "split-right"   // Form left, visual right (50/50)
  | "stacked"       // Visual top, form bottom
  | "overlay"       // Full background, form overlays
  | "content-only"; // No visual, just form

export type MobileLayout =
  | "stacked"       // Visual top, form bottom
  | "overlay"       // Full background, form overlays
  | "fullscreen"    // Visual fills entire viewport, minimal form floats on top
  | "content-only"; // No visual, just form

export interface LayoutConfig {
  desktop: DesktopLayout;
  mobile: MobileLayout;
  /** Size of visual area on desktop (e.g., "50%", "45%") */
  visualSizeDesktop?: string;
  /** Size of visual area on mobile (e.g., "40%", "45%") */
  visualSizeMobile?: string;
  /** Negative margin to overlap content with visual (e.g., "-2rem") */
  contentOverlap?: string;
  /** Show gradient overlay on visual area */
  visualGradient?: boolean;
}



/**
 * PopupDesignConfig - Pure design/visual properties
 * Does NOT include content fields (headline, buttonText, etc.)
 * Those come from campaign content types
 */
export interface PopupDesignConfig {
  id: string;
  campaignId?: string;
  challengeToken?: string;
  utmCampaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;

  // Design/Visual Properties
  backgroundColor: string;
  textColor: string;
  descriptionColor?: string; // Specific color for description/subheadline text
  buttonColor: string;
  buttonTextColor: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputBorderColor?: string;
  accentColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  imageBgColor?: string; // Background color for image placeholder
  successColor?: string; // Success state color

  // Background image configuration (used by Newsletter, FlashSale, and compatible templates)
  backgroundImageMode?: "none" | "preset" | "file";
  backgroundImagePresetKey?: string;
  backgroundImageFileId?: string;
  backgroundOverlayOpacity?: number; // Overlay opacity for full background images (0-1)

  // Layout Properties
  position: PopupPosition;
  size: PopupSize;
  popupSize?: "compact" | "standard" | "wide" | "full"; // FlashSale-specific size
  borderRadius?: string | number;
  padding?: string | number;
  maxWidth?: string | number;
  animation?: PopupAnimation;
  displayMode?: DisplayMode;

  // Lead Capture Layout (Newsletter, Spin-to-Win, Scratch Card)
  // Note: Named 'leadCaptureLayout' to avoid conflict with ProductUpsell's 'layout' field
  leadCaptureLayout?: LayoutConfig;

  // Additional style/customization
  boxShadow?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  customCSS?: string;
  globalCustomCSS?: string;
  imageUrl?: string;
  buttonUrl?: string;

  // Typography (template-specific)
  titleFontSize?: string;
  titleFontWeight?: string;
  titleTextShadow?: string;
  descriptionFontSize?: string;
  descriptionFontWeight?: string;

  // Input styling (template-specific)
  inputBackdropFilter?: string;
  inputBoxShadow?: string;
  inputBorderRadius?: string | number;
  inputStyle?: "outlined" | "filled" | "underline";

  // Button styling
  buttonBorderRadius?: string | number;
  buttonStyle?: "filled" | "outline" | "ghost";
  buttonBoxShadow?: string;
  secondaryButtonColor?: string;
  secondaryButtonTextColor?: string;

  // Text alignment and spacing
  textAlign?: "left" | "center" | "right";
  contentSpacing?: "compact" | "comfortable" | "spacious";

  // Image effects
  imageFilter?: string; // CSS filter (e.g., "brightness(0.8) contrast(1.1)")
  imageBorderRadius?: string | number;
  imagePosition?: "left" | "right" | "top" | "bottom" | "full"; // Image layout position

  // Scratch Card specific design properties (visual only - content fields come from ScratchCardContent)
  scratchCardBackgroundColor?: string; // Background color of the prize reveal area
  scratchCardTextColor?: string; // Text color in the prize reveal area
  scratchOverlayColor?: string; // Color of the scratch overlay (fallback if no image)
  scratchOverlayImage?: string; // URL of the scratch overlay texture image

  // Behavior Properties
  previewMode?: boolean;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  autoCloseDelay?: number;

  // Branding (for free tier)
  showBranding?: boolean;

  // Theme selection (from admin DesignConfig)
  theme?: string;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;

  // CSS Scoping (for mini previews to prevent style leakage)
  scopeId?: string;
}

/**
 * @deprecated Use PopupDesignConfig + specific content type instead
 * Kept for backward compatibility
 */
export interface PopupConfig extends PopupDesignConfig {
  // Content fields (deprecated - should come from content types)
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  ctaText?: string;
  successMessage?: string;
  errorMessage?: string;
}

export interface PopupCallbacks {
  onClose: () => void;
  onSuccess?: (data?: unknown) => void;
  onError?: (error: Error) => void;
}

export interface BasePopupProps {
  config: PopupConfig;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
  children?: React.ReactNode;
}

export interface DiscountConfig {
  enabled: boolean;
  code?: string;
  value?: number;
  percentage?: number;
  type?: "percentage" | "fixed_amount" | "free_shipping";
  expiryDate?: string | Date;
  minimumPurchase?: number;
  behavior?:
    | "SHOW_CODE_AND_AUTO_APPLY"
    | "SHOW_CODE_ONLY"
    | "SHOW_CODE_AND_ASSIGN_TO_EMAIL";
}

export interface Product {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  imageUrl: string;
  variantId: string;
  handle: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  savingsPercent?: number;
}

export interface CartItem {
  id: string;
  title: string;
  price: string;
  quantity: number;
  imageUrl: string;
  variantId: string;
  handle?: string;
}

export interface Prize {
  id: string;
  label: string;
  probability: number;
  color?: string;
  // Discount codes are now generated dynamically via backend API
  // The generated code will be added to the prize object after winning
  generatedCode?: string;
  generatedDiscountId?: string;
  discountCode?: string; // For backward compatibility and display
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
}

export interface FormField {
  id: string;
  type: "text" | "email" | "checkbox" | "textarea";
  label?: string;
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule;
  defaultValue?: string | boolean;
}
