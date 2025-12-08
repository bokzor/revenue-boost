import type { CSSProperties } from "react";
import type { PopupConfig } from "../popups-new/types";
import type { ExtendedColorConfig } from "~/domains/popups/color-customization.types";

/**
 * Centralized popup styling functions
 *
 * This module provides consistent styling across:
 * - PopupPortal-based popups (actual storefront popups)
 * - PopupPreview.tsx (design preview)
 * - SlideInPopup.tsx (slide-in variant)
 * - BannerPopup.tsx (banner variant)
 *
 * All popup components should use these shared style functions
 * to ensure visual consistency between preview and actual popups.
 */

// ============================================================================
// MODAL/SLIDE-IN POPUP STYLES (Centered, Vertical Layout)
// ============================================================================

/**
 * Title styles for modal and slide-in popups
 * - Centered alignment
 * - Large, prominent font size (28px)
 * - Proper spacing
 * - Extended color support
 */
export const getPopupTitleStyles = (
  config: PopupConfig | ExtendedColorConfig,
  _hasCloseButton: boolean = true,
  templateType?: string
): CSSProperties => {
  const baseStyles: CSSProperties = {
    margin: "0 0 20px 0",
    fontSize: "28px",
    fontWeight: "700",
    color: config.textColor,
    lineHeight: "1.3",
    textAlign: "center",
  };

  // Template-specific title styling
  const extendedConfig = config as ExtendedColorConfig;
  if (templateType === "sales" && extendedConfig.urgencyTextColor) {
    return {
      ...baseStyles,
      color: extendedConfig.urgencyTextColor,
      textShadow: `0 1px 2px rgba(0, 0, 0, 0.1)`,
    };
  }

  if (templateType === "announcement" && extendedConfig.highlightTextColor) {
    return {
      ...baseStyles,
      color: extendedConfig.highlightTextColor,
      fontSize: "24px", // Slightly smaller for announcements
    };
  }

  return baseStyles;
};

/**
 * Description styles for modal and slide-in popups
 * - Centered alignment
 * - Readable font size (16px)
 * - Proper line height and spacing
 * - Extended color support
 */
export const getPopupDescriptionStyles = (
  config: PopupConfig | ExtendedColorConfig,
  templateType?: string
): CSSProperties => {
  const baseStyles: CSSProperties = {
    margin: "0 0 28px 0",
    fontSize: "16px",
    lineHeight: "1.6",
    color: config.textColor,
    opacity: 0.85,
    textAlign: "center",
    flex: 1,
  };

  // Template-specific description styling
  const extendedConfig = config as ExtendedColorConfig;
  if (templateType === "exit-intent" && extendedConfig.lastChanceTextColor) {
    return {
      ...baseStyles,
      color: extendedConfig.lastChanceTextColor,
      fontWeight: "500",
    };
  }

  return baseStyles;
};

/**
 * Button container styles for modal and slide-in popups
 * - Centered button
 * - No border divider (modern, clean look)
 */
export const getPopupButtonContainerStyles = (): CSSProperties => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginTop: "8px",
  // No paddingTop or borderTop - cleaner design
});

/**
 * Button styles for all popup types
 * - Consistent sizing and colors
 * - Smooth transitions
 * - Extended color support
 */
export const getPopupButtonStyles = (
  config: PopupConfig | ExtendedColorConfig,
  buttonType: "primary" | "secondary" | "add-to-cart" = "primary"
): CSSProperties => {
  const extendedConfig = config as ExtendedColorConfig;

  // Determine button colors based on type
  let backgroundColor = config.buttonColor || "#007cba";
  let textColor = config.buttonTextColor || "#ffffff";
  let borderColor = "transparent";

  switch (buttonType) {
    case "secondary":
      backgroundColor = extendedConfig.secondaryColor || extendedConfig.accentColor || "#f8f9fa";
      textColor = config.textColor;
      borderColor = extendedConfig.borderColor || "#dee2e6";
      break;
    case "add-to-cart":
      if (extendedConfig.addToCartButtonColor) {
        backgroundColor = extendedConfig.addToCartButtonColor;
      }
      break;
  }

  return {
    backgroundColor,
    color: textColor,
    border: `1px solid ${borderColor}`,
    borderRadius: "6px",
    padding: "14px 28px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    textAlign: "center",
    transition: "all 0.2s ease",
    minWidth: "140px",
    boxShadow: buttonType === "primary" ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
  };
};

/**
 * Close button styles
 * - Positioned in top-right corner
 * - Subtle but visible
 */
export const getPopupCloseButtonStyles = (textColor: string): CSSProperties => ({
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: textColor,
  opacity: 0.7,
  transition: "opacity 0.2s ease",
});

/**
 * Image styles for popup content
 */
export const getPopupImageStyles = (): CSSProperties => ({
  maxWidth: "100%",
  height: "auto",
  borderRadius: "6px",
  maxHeight: "120px",
  objectFit: "cover",
});

/**
 * Image container styles
 * - Centered image
 * - Proper spacing below
 */
export const getPopupImageContainerStyles = (): CSSProperties => ({
  marginBottom: "20px",
  textAlign: "center",
});

/**
 * Content container styles
 * - Flex layout for proper spacing
 */
export const getPopupContentContainerStyles = (): CSSProperties => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
});

// ============================================================================
// SIZE-SPECIFIC STYLES
// ============================================================================

/**
 * Size-specific width and padding
 */
export const getPopupSizeStyles = (size?: "small" | "medium" | "large" | "fullscreen") => {
  switch (size) {
    case "small":
      return { width: "360px", padding: "24px" };
    case "large":
      return { width: "520px", padding: "40px" };
    case "fullscreen":
      return { width: "100%", padding: "0" };
    default:
      return { width: "420px", padding: "32px" };
  }
};

// ============================================================================
// BANNER-SPECIFIC STYLES (Horizontal Layout)
// ============================================================================

/**
 * Title styles for banner popups
 * - Smaller font size for horizontal layout
 * - Left-aligned (banner context)
 */
export const getBannerTitleStyles = (config: PopupConfig): CSSProperties => ({
  margin: "0 0 4px 0",
  fontSize: "18px",
  fontWeight: "700",
  color: config.textColor,
  lineHeight: "1.3",
});

/**
 * Description styles for banner popups
 * - Compact for horizontal layout
 */
export const getBannerDescriptionStyles = (config: PopupConfig): CSSProperties => ({
  margin: 0,
  lineHeight: "1.4",
  color: config.textColor,
  opacity: 0.85,
  fontSize: "14px",
});

/**
 * Banner image styles
 * - Fixed size for horizontal layout
 */
export const getBannerImageStyles = (): CSSProperties => ({
  width: "60px",
  height: "60px",
  borderRadius: "6px",
  objectFit: "cover",
});

/**
 * Banner content container
 * - Horizontal flex layout
 */
export const getBannerContentContainerStyles = (): CSSProperties => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "16px",
});

// ============================================================================
// HOVER EFFECTS
// ============================================================================

/**
 * Button hover effects
 * Apply these in onMouseEnter/onMouseLeave handlers
 */
export const applyButtonHoverEffect = (element: HTMLElement) => {
  element.style.transform = "translateY(-1px)";
  element.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
};

export const removeButtonHoverEffect = (element: HTMLElement) => {
  element.style.transform = "translateY(0)";
  element.style.boxShadow = "none";
};

/**
 * Close button hover effects
 */
export const applyCloseButtonHoverEffect = (element: HTMLElement) => {
  element.style.opacity = "1";
};

export const removeCloseButtonHoverEffect = (element: HTMLElement) => {
  element.style.opacity = "0.7";
};

// ============================================================================
// TEMPLATE-SPECIFIC STYLING UTILITIES
// ============================================================================

/**
 * Form input styles with extended color support
 */
export const getFormInputStyles = (
  config: ExtendedColorConfig,
  isFocused: boolean = false
): CSSProperties => ({
  width: "100%",
  padding: "12px 16px",
  fontSize: "16px",
  border: `1px solid ${config.inputBorderColor || "#D1D5DB"}`,
  borderRadius: "8px",
  backgroundColor: config.inputBackgroundColor || "#FFFFFF",
  color: config.inputTextColor || config.textColor,
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  ...(isFocused && {
    borderColor: config.inputFocusColor || config.buttonColor,
    boxShadow: `0 0 0 3px ${config.inputFocusColor || config.buttonColor}20`,
  }),
});

/**
 * Success message styles
 */
export const getSuccessMessageStyles = (config: ExtendedColorConfig): CSSProperties => ({
  padding: "16px 20px",
  backgroundColor: config.successColor ? `${config.successColor}10` : "#F0FDF4",
  color: config.successColor || "#16A34A",
  border: `1px solid ${config.successColor ? `${config.successColor}30` : "#BBF7D0"}`,
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "500",
  textAlign: "center",
});

/**
 * Error message styles
 */
export const getErrorMessageStyles = (config: ExtendedColorConfig): CSSProperties => ({
  padding: "12px 16px",
  backgroundColor: config.errorColor ? `${config.errorColor}10` : "#FEE2E2",
  color: config.errorColor || "#DC2626",
  border: `1px solid ${config.errorColor ? `${config.errorColor}30` : "#FECACA"}`,
  borderRadius: "6px",
  fontSize: "14px",
  marginBottom: "16px",
});

/**
 * Discount code display styles
 */
export const getDiscountCodeStyles = (config: ExtendedColorConfig): CSSProperties => ({
  padding: "16px 24px",
  backgroundColor: config.discountCodeBackgroundColor || config.accentColor || "#F3F4F6",
  borderRadius: "8px",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "2px",
  color: config.buttonColor,
  textAlign: "center",
  border: `2px dashed ${config.borderColor || config.buttonColor}40`,
  fontFamily: "monospace",
});

/**
 * Product card styles for recommendation templates
 */
export const getProductCardStyles = (config: ExtendedColorConfig): CSSProperties => ({
  backgroundColor: config.productCardBackgroundColor || "#FFFFFF",
  border: `1px solid ${config.borderColor || "#E5E7EB"}`,
  borderRadius: "8px",
  padding: "16px",
  transition: "box-shadow 0.2s ease, transform 0.1s ease",
  cursor: "pointer",
});

/**
 * Product card hover styles
 * Apply these in onMouseEnter/onMouseLeave handlers
 */
export const applyProductCardHoverEffect = (element: HTMLElement) => {
  element.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
  element.style.transform = "translateY(-2px)";
};

export const removeProductCardHoverEffect = (element: HTMLElement) => {
  element.style.boxShadow = "none";
  element.style.transform = "translateY(0)";
};

/**
 * Product title styles
 */
export const getProductTitleStyles = (config: ExtendedColorConfig): CSSProperties => ({
  fontSize: "16px",
  fontWeight: "600",
  color: config.productTitleColor || config.textColor,
  marginBottom: "8px",
  lineHeight: "1.4",
});

/**
 * Product price styles
 */
export const getProductPriceStyles = (
  config: ExtendedColorConfig,
  isDiscounted: boolean = false
): CSSProperties => ({
  fontSize: isDiscounted ? "18px" : "16px",
  fontWeight: "700",
  color: config.productPriceColor || config.priceTextColor || "#16A34A",
  ...(isDiscounted && {
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  }),
});

/**
 * Social proof notification styles
 */
export const getSocialProofNotificationStyles = (config: ExtendedColorConfig): CSSProperties => ({
  backgroundColor: config.notificationBackgroundColor || "#F0FDF4",
  border: `1px solid ${config.borderColor || "#D1FAE5"}`,
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  color: config.textColor,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  animation: "slideInRight 0.3s ease-out",
});

/**
 * Customer name styles for social proof
 */
export const getCustomerNameStyles = (config: ExtendedColorConfig): CSSProperties => ({
  fontWeight: "600",
  color: config.customerNameColor || config.buttonColor,
});

/**
 * Timestamp styles for social proof
 */
export const getTimestampStyles = (config: ExtendedColorConfig): CSSProperties => ({
  fontSize: "12px",
  color: config.timestampColor || "#6B7280",
  opacity: 0.8,
});

/**
 * Progress bar container styles for thresholds
 */
export const getProgressBarStyles = (config: ExtendedColorConfig): CSSProperties => ({
  width: "100%",
  height: "8px",
  backgroundColor: config.borderColor || "#E5E7EB",
  borderRadius: "4px",
  overflow: "hidden",
  position: "relative",
});

/**
 * Progress bar fill styles
 * Apply this to a nested element inside the progress bar
 */
export const getProgressBarFillStyles = (
  config: ExtendedColorConfig,
  percentage: number
): CSSProperties => ({
  position: "absolute",
  top: 0,
  left: 0,
  height: "100%",
  width: `${Math.min(100, Math.max(0, percentage))}%`,
  backgroundColor: config.progressBarColor || config.successColor || "#16A34A",
  borderRadius: "4px",
  transition: "width 0.3s ease",
});

/**
 * Timer/countdown styles
 */
export const getTimerStyles = (
  config: ExtendedColorConfig,
  isUrgent: boolean = false
): CSSProperties => ({
  fontSize: isUrgent ? "24px" : "20px",
  fontWeight: "700",
  color: config.timerColor || config.urgencyTextColor || "#DC2626",
  textAlign: "center",
  fontFamily: "monospace",
  letterSpacing: "1px",
  ...(isUrgent && {
    animation: "pulse 1s infinite",
    textShadow: `0 0 10px ${config.timerColor || "#DC2626"}40`,
  }),
});

/**
 * Badge styles for announcements
 */
export const getBadgeStyles = (
  config: ExtendedColorConfig,
  variant: "success" | "warning" | "info" | "default" = "default"
): CSSProperties => {
  let backgroundColor = config.badgeBackgroundColor || config.accentColor || "#F3F4F6";
  let textColor = config.badgeTextColor || config.textColor;

  switch (variant) {
    case "success":
      backgroundColor = config.successColor || "#10B981";
      textColor = "#FFFFFF";
      break;
    case "warning":
      backgroundColor = config.warningColor || "#F59E0B";
      textColor = "#FFFFFF";
      break;
    case "info":
      backgroundColor = config.infoColor || "#3B82F6";
      textColor = "#FFFFFF";
      break;
  }

  return {
    display: "inline-block",
    padding: "4px 8px",
    fontSize: "12px",
    fontWeight: "500",
    backgroundColor,
    color: textColor,
    borderRadius: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };
};

/**
 * Universal color application function
 */
export const applyColorsToElement = (
  element: HTMLElement,
  config: ExtendedColorConfig,
  colorMap: Record<string, keyof ExtendedColorConfig>
): void => {
  Object.entries(colorMap).forEach(([cssProperty, configKey]) => {
    const value = config[configKey];
    if (value && typeof value === "string") {
      element.style.setProperty(cssProperty, value);
    }
  });
};

// ============================================================================
// OVERLAY STYLES
// ============================================================================

/**
 * Overlay styles for modal popups with extended configuration
 */
export const getOverlayStyles = (
  config?: ExtendedColorConfig,
  fallbackOpacity: number = 0.6
): CSSProperties => {
  const opacity = config?.overlayOpacity ?? fallbackOpacity;
  const _overlayColor = config?.overlayColor || "rgba(0, 0, 0, 1)";

  // Parse overlay color to apply opacity
  let backgroundColor = `rgba(0, 0, 0, ${opacity})`;
  if (config?.overlayColor && config.overlayColor.startsWith("#")) {
    const hex = config.overlayColor.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999999,
    backdropFilter: "blur(2px)",
  };
};

/**
 * Base popup container styles with extended color support
 */
export const getBasePopupStyles = (
  config: PopupConfig | ExtendedColorConfig,
  templateType?: string
): CSSProperties => {
  const extendedConfig = config as ExtendedColorConfig;

  // Type guard for config with optional properties
  interface ConfigWithOptionalStyles {
    borderRadius?: string;
    boxShadow?: string;
  }

  // Base styles
  const baseStyles: CSSProperties = {
    backgroundColor: config.backgroundColor,
    color: config.textColor,
    borderRadius: (config as ConfigWithOptionalStyles).borderRadius || "12px",
    boxShadow: (config as ConfigWithOptionalStyles).boxShadow || "0 8px 32px rgba(0, 0, 0, 0.12)",
    position: "relative",
    maxWidth: "90vw",
    maxHeight: "100%",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
  };

  // Add border if borderColor is specified
  if (extendedConfig.borderColor) {
    baseStyles.border = `1px solid ${extendedConfig.borderColor}`;
  }

  // Template-specific styling
  if (templateType === "sales") {
    baseStyles.boxShadow = "0 10px 40px rgba(239, 68, 68, 0.15)";
    if (extendedConfig.urgencyIndicatorColor) {
      baseStyles.borderTop = `4px solid ${extendedConfig.urgencyIndicatorColor}`;
    }
  }

  if (templateType === "announcement" && extendedConfig.announcementBannerColor) {
    baseStyles.borderLeft = `6px solid ${extendedConfig.announcementBannerColor}`;
  }

  return baseStyles;
};
