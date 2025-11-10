/**
 * Free Shipping Popup Bundle
 */

import { FreeShippingPopup } from "../../../app/domains/storefront/popups/FreeShippingPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["FREE_SHIPPING"] = FreeShippingPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Free Shipping popup registered");
  }
})();

