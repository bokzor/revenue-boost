/**
 * Announcement Popup Bundle
 * Renders announcement banners/ribbons on the storefront
 */

import { AnnouncementPopup } from "../../../app/domains/storefront/popups-new/AnnouncementPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["ANNOUNCEMENT"] = AnnouncementPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Announcement popup registered");
  }
})();

