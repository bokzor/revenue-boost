/**
 * Schema Defaults Validation Tests
 * 
 * Verifies that component default behavior matches Zod schema defaults.
 * This catches mismatches between schema.default() values and component 
 * handling of undefined values.
 */

import { describe, it, expect } from "vitest";
import {
  CartAbandonmentContentSchema,
  ProductUpsellContentSchema,
  FreeShippingContentSchema,
  AnnouncementContentSchema,
  SocialProofContentSchema,
  ScratchCardContentSchema,
  SpinToWinContentSchema,
  NewsletterContentSchema,
  FlashSaleContentSchema,
} from "~/domains/campaigns/types/campaign";

// Required fields for BaseContentConfigSchema
// Note: successMessage now has a default ("Thank you!") so it's not required
const BASE_REQUIRED_FIELDS = {
  headline: "Test",
  buttonText: "Test",
};

describe("Schema Defaults Validation", () => {
  describe("BaseContentConfigSchema Required Fields", () => {
    it("successMessage has a default value and is not required", () => {
      // successMessage now has a default, so schemas extending BaseContentConfigSchema
      // don't need to provide it explicitly
      const parsed = CartAbandonmentContentSchema.parse({
        headline: "Test",
        buttonText: "Test",
        // successMessage not provided - should use default
      });

      expect(parsed.successMessage).toBe("Thank you!");
    });
  });

  describe("CartAbandonmentContentSchema", () => {
    it("should have correct defaults for boolean fields", () => {
      const parsed = CartAbandonmentContentSchema.parse({
        ...BASE_REQUIRED_FIELDS,
      });

      // These should be TRUE by default
      expect(parsed.showCartItems).toBe(true);
      expect(parsed.showCartTotal).toBe(true);
      expect(parsed.showUrgency).toBe(true);

      // These should be FALSE by default
      expect(parsed.showStockWarnings).toBe(false);
      expect(parsed.enableEmailRecovery).toBe(false);
      expect(parsed.requireEmailBeforeCheckout).toBe(false);
    });

    it("should have correct defaults for numeric fields", () => {
      const parsed = CartAbandonmentContentSchema.parse({
        ...BASE_REQUIRED_FIELDS,
      });

      expect(parsed.maxItemsToShow).toBe(3);
      expect(parsed.urgencyTimer).toBe(300);
    });
  });

  describe("ProductUpsellContentSchema", () => {
    it("should have correct defaults for selection and layout", () => {
      const parsed = ProductUpsellContentSchema.parse({
        ...BASE_REQUIRED_FIELDS,
      });

      expect(parsed.productSelectionMethod).toBe("ai");
      expect(parsed.layout).toBe("grid");
      expect(parsed.columns).toBe(2);
      expect(parsed.maxProducts).toBe(3);
    });

    it("should have correct defaults for display toggles", () => {
      const parsed = ProductUpsellContentSchema.parse({
        ...BASE_REQUIRED_FIELDS,
      });

      // TRUE by default
      expect(parsed.showPrices).toBe(true);
      expect(parsed.showCompareAtPrice).toBe(true);
      expect(parsed.showImages).toBe(true);
      expect(parsed.multiSelect).toBe(true);

      // FALSE by default
      expect(parsed.showRatings).toBe(false);
      expect(parsed.showReviewCount).toBe(false);
    });
  });

  describe("FreeShippingContentSchema", () => {
    it("should have correct defaults", () => {
      // FreeShippingContentSchema doesn't extend BaseContentConfigSchema
      const parsed = FreeShippingContentSchema.parse({});
      
      expect(parsed.threshold).toBe(75);
      expect(parsed.currency).toBe("$");
      expect(parsed.nearMissThreshold).toBe(10);
      expect(parsed.barPosition).toBe("top");
      
      // TRUE by default
      expect(parsed.dismissible).toBe(true);
      expect(parsed.showIcon).toBe(true);
      expect(parsed.celebrateOnUnlock).toBe(true);
      
      // FALSE by default
      expect(parsed.requireEmailToClaim).toBe(false);
    });
  });

  describe("AnnouncementContentSchema", () => {
    it("should have correct defaults", () => {
      const parsed = AnnouncementContentSchema.parse({
        ...BASE_REQUIRED_FIELDS,
      });

      expect(parsed.sticky).toBe(true);
      expect(parsed.ctaOpenInNewTab).toBe(false);
      expect(parsed.colorScheme).toBe("custom");
    });
  });

  describe("SpinToWinContentSchema", () => {
    // SpinToWin omits successMessage from BaseContentConfigSchema
    const SPIN_REQUIRED = {
      headline: "Test",
      buttonText: "Spin",
    };

    it("should have correct defaults for wheel configuration", () => {
      const parsed = SpinToWinContentSchema.parse(SPIN_REQUIRED);

      expect(parsed.wheelSize).toBe(400);
      expect(parsed.wheelBorderWidth).toBe(2);
      expect(parsed.spinDuration).toBe(4000); // milliseconds
      expect(parsed.minSpins).toBe(5);
    });

    it("should have correct defaults for form fields", () => {
      const parsed = SpinToWinContentSchema.parse(SPIN_REQUIRED);

      expect(parsed.emailRequired).toBe(true);
      expect(parsed.nameFieldEnabled).toBe(false);
      expect(parsed.nameFieldRequired).toBe(false);
      expect(parsed.consentFieldEnabled).toBe(false);
      expect(parsed.consentFieldRequired).toBe(false);
    });
  });

  describe("ScratchCardContentSchema", () => {
    // ScratchCard also omits successMessage from BaseContentConfigSchema
    const SCRATCH_REQUIRED = {
      headline: "Test",
      buttonText: "Reveal",
    };

    it("should have correct defaults", () => {
      const parsed = ScratchCardContentSchema.parse(SCRATCH_REQUIRED);

      expect(parsed.emailRequired).toBe(true);
      expect(parsed.emailBeforeScratching).toBe(false);
      expect(parsed.scratchThreshold).toBe(50);
      expect(parsed.scratchRadius).toBe(20);
      expect(parsed.consentFieldEnabled).toBe(false);
    });
  });

  describe("NewsletterContentSchema", () => {
    it("should have correct defaults for form fields", () => {
      const parsed = NewsletterContentSchema.parse({
        ...BASE_REQUIRED_FIELDS,
      });

      expect(parsed.emailRequired).toBe(true);
      expect(parsed.nameFieldEnabled).toBe(false);
      expect(parsed.nameFieldRequired).toBe(false);
      expect(parsed.consentFieldEnabled).toBe(false);
      expect(parsed.consentFieldRequired).toBe(false);
    });
  });

  describe("FlashSaleContentSchema", () => {
    it("should have correct defaults for timer", () => {
      const parsed = FlashSaleContentSchema.parse({
        ...BASE_REQUIRED_FIELDS,
        urgencyMessage: "Hurry!",
        discountPercentage: 10,
      });

      expect(parsed.showCountdown).toBe(true);
      expect(parsed.countdownDuration).toBe(3600);
      expect(parsed.hideOnExpiry).toBe(true);
      expect(parsed.autoHideOnExpire).toBe(false);
    });
  });

  describe("SocialProofContentSchema", () => {
    it("should have correct defaults for notification types", () => {
      const parsed = SocialProofContentSchema.parse({
        ...BASE_REQUIRED_FIELDS,
      });

      expect(parsed.enablePurchaseNotifications).toBe(true);
      expect(parsed.enableVisitorNotifications).toBe(false); // Fixed: actual schema default
      expect(parsed.enableReviewNotifications).toBe(false);
    });

    it("should have correct defaults for display settings", () => {
      const parsed = SocialProofContentSchema.parse({
        ...BASE_REQUIRED_FIELDS,
      });

      expect(parsed.cornerPosition).toBe("bottom-left");
      expect(parsed.displayDuration).toBe(6); // seconds
      expect(parsed.rotationInterval).toBe(8); // seconds
      expect(parsed.maxNotificationsPerSession).toBe(5);
      expect(parsed.showProductImage).toBe(true);
      expect(parsed.showTimer).toBe(true);
    });
  });
});
