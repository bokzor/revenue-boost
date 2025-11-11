/**
 * Countdown Timer Popup Bundle
 * Uses BannerPopup for countdown timers
 */

import { BannerPopup } from "../../../app/domains/storefront/notifications/BannerPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["COUNTDOWN_TIMER"] = BannerPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Countdown Timer popup registered");
  }
})();

