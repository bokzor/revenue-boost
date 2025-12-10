/**
 * Premium Fullscreen Popup Bundle
 * Registers the PremiumFullscreenPopup component for storefront use
 */

import { PremiumFullscreenPopup } from "../../../app/domains/storefront/popups-new/PremiumFullscreenPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["PREMIUM_FULLSCREEN"] = PremiumFullscreenPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Premium Fullscreen popup registered");
  }
})();

