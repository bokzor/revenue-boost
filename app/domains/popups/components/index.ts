/**
 * Popup Components - Legacy Export
 *
 * Re-exports from new storefront location for backward compatibility.
 * New code should import from ~/domains/storefront instead.
 */

// Re-export from new storefront location
export * from "../../storefront/popups-new";
export { SlideInPopup } from "../../storefront/slideins";
export { BannerPopup } from "../../storefront/notifications";
export { PopupManager } from "../../storefront/shared";

export type { PopupManagerProps, CampaignPopupConfig } from "../../storefront/shared/PopupManager";
