/**
 * Product Upsell Popup Bundle
 */

import { ProductUpsellPopup } from "../../../app/domains/storefront/popups/ProductUpsellPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["PRODUCT_UPSELL"] = ProductUpsellPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Product Upsell popup registered");
  }
})();

