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
export type DisplayMode = "modal" | "banner" | "slide-in" | "inline";
export type ImagePosition = "left" | "right" | "top" | "bottom" | "none";

/**
 * PopupDesignConfig - Pure design/visual properties
 * Does NOT include content fields (headline, buttonText, etc.)
 * Those come from campaign content types
 */
export interface PopupDesignConfig {
  id: string;
  campaignId?: string;

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

  // Background image configuration (used by Newsletter and compatible templates)
  backgroundImageMode?: "none" | "preset" | "file";
  backgroundImagePresetKey?: string;
  backgroundImageFileId?: string;

  // Layout Properties
  position: PopupPosition;
  size: PopupSize;
  popupSize?: "compact" | "standard" | "wide" | "full"; // FlashSale-specific size
  borderRadius?: string | number;
  padding?: string | number;
  maxWidth?: string | number;
  animation?: PopupAnimation;
  displayMode?: DisplayMode;


  // Additional style/customization
  boxShadow?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  customCSS?: string;
  imageUrl?: string;
  imagePosition?: ImagePosition;
  buttonUrl?: string;

  // Behavior Properties
  previewMode?: boolean;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  autoCloseDelay?: number;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
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
  onSuccess?: (data?: any) => void;
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
  deliveryMode?: 'auto_apply_only' | 'show_code_fallback' | 'show_code_always' | 'show_in_popup_authorized_only';
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
  discountType?: "percentage" | "fixed_amount" | "free_shipping";
  discountValue?: number;
  discountCode?: string;
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

