/**
 * Cart Abandonment Popup Bundle
 */

import { CartAbandonmentPopup } from "../../../app/domains/storefront/popups-new/CartAbandonmentPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["CART_ABANDONMENT"] = CartAbandonmentPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Cart Abandonment popup registered");
  }
})();

