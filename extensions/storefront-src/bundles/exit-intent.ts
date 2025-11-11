/**
 * Exit Intent Popup Bundle
 * Note: Exit Intent is typically a trigger, not a popup type
 * This uses NewsletterPopup as the default component
 */

import { NewsletterPopup } from "../../../app/domains/storefront/popups-new/NewsletterPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["EXIT_INTENT"] = NewsletterPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Exit Intent popup registered");
  }
})();

