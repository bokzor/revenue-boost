/**
 * Storefront Utilities
 *
 * Centralized utilities for storefront extension.
 * All utilities here only work on the storefront (not admin).
 */

// Shopify core utilities
export { getShopifyRoot } from "./shopify";

// Discount utilities
export {
  applyDiscountToCart,
  shouldAutoApply,
  saveDiscountToStorage,
  handleDiscountAutoApply,
} from "./discount";

// Cart utilities
export {
  getSectionsToRender,
  refreshCartDrawer,
  addToCart,
  getCart,
} from "./cart";

// URL utilities
export {
  addUTMParams,
  decorateUrlWithDiscount,
  normalizePath,
  buildUrl,
  type UTMParams,
} from "./url";

// Google Fonts utilities
export { loadGoogleFont, loadFontFromDesignConfig } from "./google-fonts";
