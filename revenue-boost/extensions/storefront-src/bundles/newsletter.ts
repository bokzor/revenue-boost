/**
 * Newsletter Popup Bundle
 * Registers the NewsletterPopup component globally
 */

import { NewsletterPopup } from "../../../app/domains/storefront/popups/NewsletterPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["NEWSLETTER"] = NewsletterPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Newsletter popup registered");
  }
})();

