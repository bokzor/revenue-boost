/**
 * Shared Popup Components - Barrel Export
 *
 * Centralized exports for all shared popup components, hooks, and utilities.
 * These components are used across all popup templates to reduce duplication
 * and ensure consistency.
 *
 * Phase 1: Foundation Components
 * - Icon components (CloseIcon, CheckmarkIcon, SpinnerIcon, ChevronIcon)
 * - LoadingSpinner component
 * - Animation styles (animations.css)
 *
 * Phase 2: Core Components
 * - DiscountCodeDisplay component
 * - SuccessState component
 * - LeadCaptureForm component
 * - TimerDisplay component
 * - PopupHeader component
 */

// ============================================
// ICONS
// ============================================
export {
  CloseIcon,
  CheckmarkIcon,
  SpinnerIcon,
  ChevronIcon,
  type CloseIconProps,
  type CheckmarkIconProps,
  type SpinnerIconProps,
  type ChevronIconProps,
} from "./icons";

// ============================================
// PHASE 1 COMPONENTS
// ============================================
export { LoadingSpinner, type LoadingSpinnerProps } from "./LoadingSpinner";

// ============================================
// PHASE 2 COMPONENTS
// ============================================
export { DiscountCodeDisplay, type DiscountCodeDisplayProps } from "./DiscountCodeDisplay";
export { SuccessState, type SuccessStateProps } from "./SuccessState";
export { LeadCaptureForm, type LeadCaptureFormProps } from "./LeadCaptureForm";
export { TimerDisplay, type TimerDisplayProps } from "./TimerDisplay";
export { PopupHeader, type PopupHeaderProps } from "./PopupHeader";

// ============================================
// PHASE A COMPONENTS (Storefront Refactoring)
// ============================================
export { CTAButton, type CTAButtonProps } from "./CTAButton";

// ============================================
// PHASE B COMPONENTS (Storefront Refactoring)
// ============================================
export { PopupCloseButton, type PopupCloseButtonProps } from "./PopupCloseButton";

// ============================================
// PHASE C COMPONENTS (Spa Serenity Design System)
// ============================================
export { TagBadge, type TagBadgeProps } from "./TagBadge";
export { FooterDisclaimer, type FooterDisclaimerProps } from "./FooterDisclaimer";
export { ImageFloatingBadge, type ImageFloatingBadgeProps } from "./ImageFloatingBadge";
export { StyledCheckbox, type StyledCheckboxProps } from "./StyledCheckbox";

// ============================================
// PROMOTION DISPLAY COMPONENT
// ============================================
export {
  PromotionDisplay,
  type PromotionDisplayProps,
  type DiscountTier,
  type FreeGiftConfig,
  type BogoConfig,
} from "./PromotionDisplay";

// ============================================
// PRODUCT IMAGE COMPONENT
// ============================================
export { ProductImage, type ProductImageProps } from "./ProductImage";

// ============================================
// STYLES
// ============================================
// Note: animations.css should be imported directly in components that need it:
// import "~/domains/storefront/popups-new/components/shared/animations.css";

