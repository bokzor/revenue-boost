/**
 * Social Proof Popup Bundle
 */

import { SocialProofPopup } from "../../../app/domains/storefront/notifications/social-proof/SocialProofPopup";

(function register() {
  const g = window as any;
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["SOCIAL_PROOF"] = SocialProofPopup;

  if (g.console && g.console.debug) {
    console.debug("[Revenue Boost] Social Proof popup registered");
  }
})();

