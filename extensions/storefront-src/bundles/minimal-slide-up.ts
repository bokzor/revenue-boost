/**
 * Minimal Slide-Up Popup Bundle
 * Registers the MinimalSlideUpPopup component for storefront use
 */

import { MinimalSlideUpPopup } from "../../../app/domains/storefront/popups-new/MinimalSlideUpPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["MINIMAL_SLIDE_UP"] = MinimalSlideUpPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Minimal Slide-Up popup registered");
  }
})();

