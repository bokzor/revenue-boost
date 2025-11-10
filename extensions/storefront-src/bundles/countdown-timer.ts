/**
 * Countdown Timer Popup Bundle
 * Uses BannerPopup for countdown timers
 */

import { BannerPopup } from "../../../app/domains/storefront/notifications/BannerPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["COUNTDOWN_TIMER"] = BannerPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Countdown Timer popup registered");
  }
})();

