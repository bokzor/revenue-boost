/**
 * Storefront Popup Components
 *
 * Professional, zero-dependency popup components for Shopify storefronts.
 * All components are built with TypeScript, React hooks, and inline styles.
 *
 * Features:
 * - Zero external dependencies (React only)
 * - Fully customizable via props
 * - Accessible (ARIA labels, keyboard navigation)
 * - Responsive design
 * - Preview mode support
 * - Respects prefers-reduced-motion
 */

// Base components
export { BasePopup } from './BasePopup'; // @deprecated - Use PopupPortal instead
export { PopupPortal } from './PopupPortal';
export type {
  PopupPortalProps,
  BackdropConfig,
  AnimationConfig,
  AnimationType
} from './PopupPortal';

// Newsletter components
export { NewsletterPopup } from './NewsletterPopup';
export type { NewsletterConfig, NewsletterPopupProps, NewsletterFormData } from './NewsletterPopup';

// Gamification components
export { SpinToWinPopup } from './SpinToWinPopup';
export type { SpinToWinConfig, SpinToWinPopupProps } from './SpinToWinPopup';

export { ScratchCardPopup } from './ScratchCardPopup';
export type { ScratchCardConfig, ScratchCardPopupProps } from './ScratchCardPopup';

// Sales components
export { FlashSalePopup } from './FlashSalePopup';
export type {
  FlashSaleConfig,
  FlashSalePopupProps
} from './FlashSalePopup';

export { CountdownTimerPopup } from './CountdownTimerPopup';
export type { CountdownTimerConfig, CountdownTimerPopupProps } from './CountdownTimerPopup';

// E-commerce components
export { CartAbandonmentPopup } from './CartAbandonmentPopup';
export type { CartAbandonmentConfig, CartAbandonmentPopupProps } from './CartAbandonmentPopup';

export { ProductUpsellPopup } from './ProductUpsellPopup';
export type { ProductUpsellConfig, ProductUpsellPopupProps } from './ProductUpsellPopup';

// Engagement components
export { FreeShippingPopup } from './FreeShippingPopup';
export type { FreeShippingConfig, FreeShippingPopupProps } from './FreeShippingPopup';

export { SocialProofPopup } from './SocialProofPopup';
export type {
  SocialProofConfig,
  SocialProofPopupProps,
  SocialProofNotification
} from './SocialProofPopup';

export { AnnouncementPopup } from './AnnouncementPopup';
export type { AnnouncementConfig, AnnouncementPopupProps } from './AnnouncementPopup';

// Shared types
export type {
  PopupConfig, // @deprecated - Use PopupDesignConfig + content types instead
  PopupDesignConfig,
  PopupPosition,
  PopupSize,
  PopupAnimation,
  DisplayMode,
  PopupCallbacks,
  BasePopupProps,
  DiscountConfig,
  Product,
  CartItem,
  Prize,
  ValidationRule,
  FormField,
} from './types';

// Utility functions
export {
  getSizeDimensions,
  getPositionStyles,
  getAnimationClass,
  getAnimationKeyframes,
  validateEmail,
  formatCurrency,
  copyToClipboard,
  calculateTimeRemaining,
  formatTimeRemaining,
  prefersReducedMotion,
  debounce,
} from './utils';

