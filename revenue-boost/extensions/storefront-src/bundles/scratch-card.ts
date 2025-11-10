/**
 * Scratch Card Popup Bundle
 */

import { ScratchCardPopup } from "../../../app/domains/storefront/popups/ScratchCardPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["SCRATCH_CARD"] = ScratchCardPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Scratch Card popup registered");
  }
})();

