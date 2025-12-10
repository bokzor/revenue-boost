/**
 * Countdown Urgency Popup Bundle
 * Registers the CountdownUrgencyPopup component for storefront use
 */

import { CountdownUrgencyPopup } from "../../../app/domains/storefront/popups-new/CountdownUrgencyPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["COUNTDOWN_URGENCY"] = CountdownUrgencyPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Countdown Urgency popup registered");
  }
})();

