/**
 * Flash Sale Popup Bundle
 * Uses BannerPopup for flash sales
 */

import { BannerPopup } from "../../../app/domains/storefront/notifications/BannerPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["FLASH_SALE"] = BannerPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Flash Sale popup registered");
  }
})();

