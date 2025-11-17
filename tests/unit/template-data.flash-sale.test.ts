import { describe, it, expect } from "vitest";
import { GLOBAL_SYSTEM_TEMPLATES } from "../../prisma/template-data";
import {
  FlashSaleContentSchema,
  DiscountConfigSchema,
} from "~/domains/campaigns/types/campaign";

/**
 * Unit tests for the seeded Flash Sale system template.
 *
 * These tests ensure that:
 * - The Flash Sale system template exists in GLOBAL_SYSTEM_TEMPLATES
 * - Its contentConfig matches FlashSaleContentSchema and has the expected defaults
 * - Its designConfig uses Modern theme-inspired colors (aligned with newsletter "modern" theme)
 * - Its discountConfig matches DiscountConfigSchema and encodes a 30% shared percentage discount
 */

describe("GLOBAL_SYSTEM_TEMPLATES – Flash Sale Alert", () => {
  const flashSale = GLOBAL_SYSTEM_TEMPLATES.find(
    (t) => t.templateType === "FLASH_SALE",
  );

  it("should include a Flash Sale system template with correct basic metadata", () => {
    expect(flashSale).toBeDefined();
    if (!flashSale) return;

    expect(flashSale.name).toBe("Flash Sale Alert");
    expect(flashSale.category).toBe("sales");
    expect(flashSale.goals).toContain("INCREASE_REVENUE");
    expect(flashSale.isDefault).toBe(true);
  });

  it("should use Minimal theme-inspired design defaults", () => {
    expect(flashSale).toBeDefined();
    if (!flashSale) return;

    const design = flashSale.designConfig as any;

    // Theme + key colors from Modern newsletter preset
    expect(design.theme).toBe("modern");
    expect(design.backgroundColor).toBe("#ffffff");
    expect(design.textColor).toBe("#111827");
    expect(design.buttonColor).toBe("#3b82f6");
    expect(design.buttonTextColor).toBe("#ffffff");
  });

  it("should provide content defaults that satisfy FlashSaleContentSchema and match expected values", () => {
    expect(flashSale).toBeDefined();
    if (!flashSale) return;

    const result = FlashSaleContentSchema.safeParse(flashSale.contentConfig);
    expect(result.success).toBe(true);

    if (!result.success) {
      console.error(result.error.format());
      return;
    }

    const content = result.data;

    // Core messaging
    expect(content.headline).toBe("🔥 2-Hour Flash Sale - 30% OFF!");
    expect(content.subheadline).toBe(
      "Biggest discount of the year - don't miss out!",
    );
    expect(content.buttonText).toBe("Shop Now & Save");
    expect(content.successMessage).toBe(
      "Discount applied! Complete your order before the timer runs out.",
    );

    // Flash sale specifics
    expect(content.urgencyMessage).toBe("Sale ends in:");
    expect(content.discountPercentage).toBe(30);

    // Advanced Features defaults
    expect(content.showCountdown).toBe(true);
    expect(content.countdownDuration).toBe(7200);
    expect(content.hideOnExpiry).toBe(true);
  });

  it("should provide discountConfig defaults that satisfy DiscountConfigSchema for a 30% shared percentage discount", () => {
    expect(flashSale).toBeDefined();
    if (!flashSale) return;

    const rawConfig = (flashSale.discountConfig || {}) as unknown;
    const result = DiscountConfigSchema.safeParse(rawConfig);
    expect(result.success).toBe(true);

    if (!result.success) {
      console.error(result.error.format());
      return;
    }

    const config = result.data;

    expect(config.enabled).toBe(true);
    expect(config.showInPreview).toBe(true);
    expect(config.type).toBe("shared");
    expect(config.valueType).toBe("PERCENTAGE");
    expect(config.value).toBe(30);
    expect(config.prefix).toBe("FLASH30");
    expect(config.expiryDays).toBe(2);
    expect(config.deliveryMode).toBe("show_code_always");
    expect(config.autoApplyMode).toBe("ajax");
    expect(config.codePresentation).toBe("show_code");
  });
});

