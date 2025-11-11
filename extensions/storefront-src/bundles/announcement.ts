/**
 * Announcement Popup Bundle
 * Note: Uses NewsletterPopup as base for announcements
 */

import { NewsletterPopup } from "../../../app/domains/storefront/popups-new/NewsletterPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["ANNOUNCEMENT"] = NewsletterPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Announcement popup registered");
  }
})();

