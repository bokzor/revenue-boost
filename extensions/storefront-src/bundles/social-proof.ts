/**
 * Social Proof Popup Bundle
 */

import { SocialProofPopup } from "../../../app/domains/storefront/popups-new/SocialProofPopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["SOCIAL_PROOF"] = SocialProofPopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Social Proof popup registered");
  }
})();

