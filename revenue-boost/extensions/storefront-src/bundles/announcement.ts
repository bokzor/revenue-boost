/**
 * Announcement Popup Bundle
 * Note: Uses NewsletterPopup as base for announcements
 */

import { NewsletterPopup } from "../../../app/domains/storefront/popups/NewsletterPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["ANNOUNCEMENT"] = NewsletterPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Announcement popup registered");
  }
})();

