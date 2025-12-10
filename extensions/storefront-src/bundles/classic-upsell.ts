/**
 * Classic Upsell Popup Bundle
 * Registers the ClassicUpsellPopup component for storefront use
 */

import { ClassicUpsellPopup } from "../../../app/domains/storefront/popups-new/ClassicUpsellPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["CLASSIC_UPSELL"] = ClassicUpsellPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Classic Upsell popup registered");
  }
})();

