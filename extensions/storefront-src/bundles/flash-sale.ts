/**
 * Flash Sale Popup Bundle
 * Registers the FlashSale popup component for storefront use
 */

import { FlashSalePopup } from "../../../app/domains/storefront/popups-new/FlashSalePopup";

(function register() {
  const g = window as unknown as { RevenueBoostComponents?: Record<string, unknown>; console?: Console };
  g.RevenueBoostComponents = g.RevenueBoostComponents || {};
  g.RevenueBoostComponents["FLASH_SALE"] = FlashSalePopup;

  if (typeof g.console?.debug === "function") {
    console.debug("[Revenue Boost] Flash Sale popup registered");
  }
})();

