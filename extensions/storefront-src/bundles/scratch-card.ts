/**
 * Scratch Card Popup Bundle
 */

import { ScratchCardPopup } from "../../../app/domains/storefront/popups-new/ScratchCardPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["SCRATCH_CARD"] = ScratchCardPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Scratch Card popup registered");
  }
})();

