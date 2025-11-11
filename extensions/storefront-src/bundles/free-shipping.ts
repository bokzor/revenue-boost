/**
 * Free Shipping Popup Bundle
 */

import { FreeShippingPopup } from "../../../app/domains/storefront/popups-new/FreeShippingPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["FREE_SHIPPING"] = FreeShippingPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Free Shipping popup registered");
  }
})();

