/**
 * Product Upsell Popup Bundle
 */

import { ProductUpsellPopup } from "../../../app/domains/storefront/popups-new/ProductUpsellPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["PRODUCT_UPSELL"] = ProductUpsellPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Product Upsell popup registered");
  }
})();

