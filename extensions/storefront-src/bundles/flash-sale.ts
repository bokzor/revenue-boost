/**
 * Flash Sale Popup Bundle
 * Uses BannerPopup for flash sales
 */

import { BannerPopup } from "../../../app/domains/storefront/notifications/BannerPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["FLASH_SALE"] = BannerPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Flash Sale popup registered");
  }
})();

