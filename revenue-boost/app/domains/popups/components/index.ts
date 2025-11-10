/**
 * Popup Components - Legacy Export
 *
 * Re-exports from new storefront location for backward compatibility.
 * New code should import from ~/domains/storefront instead.
 */

// Re-export from new storefront location
export { BasePopup, ModalPopup, ProductUpsellPopup, MinimumBasketPopup, CartAbandonmentPopup, FreeShippingPopup } from "../../storefront/popups";
export { SlideInPopup } from "../../storefront/slideins";
export { BannerPopup } from "../../storefront/notifications";
export { PopupManager } from "../../storefront/shared";

export type { PopupConfig, BasePopupProps } from "../../storefront/popups/BasePopup";
export type { ModalPopupProps } from "../../storefront/popups/ModalPopup";
export type { SlideInPopupProps } from "../../storefront/slideins/SlideInPopup";
export type { BannerPopupProps } from "../../storefront/notifications/BannerPopup";
export type {
  ProductUpsellConfig,
  ProductUpsellPopupProps,
} from "../../storefront/popups/ProductUpsellPopup";
export type {
  MinimumBasketConfig,
  MinimumBasketPopupProps,
} from "../../storefront/popups/MinimumBasketPopup";
export type {
  CartAbandonmentConfig,
  CartAbandonmentPopupProps,
} from "../../storefront/popups/CartAbandonmentPopup";
export type {
  FreeShippingConfig,
  FreeShippingPopupProps,
} from "../../storefront/popups/FreeShippingPopup";
export type { PopupManagerProps, CampaignPopupConfig } from "../../storefront/shared/PopupManager";
