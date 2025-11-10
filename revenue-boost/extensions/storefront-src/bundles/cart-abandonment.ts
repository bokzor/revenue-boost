/**
 * Cart Abandonment Popup Bundle
 */

import { CartAbandonmentPopup } from "../../../app/domains/storefront/popups/CartAbandonmentPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["CART_ABANDONMENT"] = CartAbandonmentPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Cart Abandonment popup registered");
  }
})();

