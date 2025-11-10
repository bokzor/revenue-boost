/**
 * Exit Intent Popup Bundle
 * Note: Exit Intent is typically a trigger, not a popup type
 * This uses NewsletterPopup as the default component
 */

import { NewsletterPopup } from "../../../app/domains/storefront/popups/NewsletterPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["EXIT_INTENT"] = NewsletterPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Exit Intent popup registered");
  }
})();

