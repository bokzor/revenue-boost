/**
 * Countdown Timer Popup Bundle
 */

import { CountdownTimerPopup } from "../../../app/domains/storefront/popups-new/CountdownTimerPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["COUNTDOWN_TIMER"] = CountdownTimerPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Countdown Timer popup registered");
  }
})();

