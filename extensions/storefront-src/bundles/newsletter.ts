/**
 * Newsletter Popup Bundle
 * Registers the NewsletterPopup component globally
 */

import { NewsletterPopup } from "../../../app/domains/storefront/popups-new/NewsletterPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["NEWSLETTER"] = NewsletterPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Newsletter popup registered");
  }
})();

