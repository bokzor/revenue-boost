/**
 * Spin to Win Popup Bundle
 */

import { SpinToWinPopup } from "../../../app/domains/storefront/popups-new/SpinToWinPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["SPIN_TO_WIN"] = SpinToWinPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Spin to Win popup registered");
  }
})();

