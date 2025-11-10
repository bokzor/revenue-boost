/**
 * Spin to Win Popup Bundle
 */

import { SpinToWinPopup } from "../../../app/domains/storefront/popups/SpinToWinPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["SPIN_TO_WIN"] = SpinToWinPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Spin to Win popup registered");
  }
})();

