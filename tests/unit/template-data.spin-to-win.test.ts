import { describe, it, expect } from "vitest";
import { GLOBAL_SYSTEM_TEMPLATES } from "../../prisma/template-data";
import { SpinToWinContentSchema } from "~/domains/campaigns/types/campaign";

/**
 * Unit tests for the seeded Spin to Win system template.
 *
 * These tests ensure that:
 * - The Spin to Win system template exists in GLOBAL_SYSTEM_TEMPLATES
 * - Its contentConfig matches SpinToWinContentSchema and has the expected defaults
 * - Prize configuration is exposed as wheelSegments with correct structure
 * - nameFieldEnabled and consentFieldEnabled are present and defaulted as expected
 */

describe("GLOBAL_SYSTEM_TEMPLATES – Spin to Win", () => {
  const spinToWin = GLOBAL_SYSTEM_TEMPLATES.find(
    (t) => t.templateType === "SPIN_TO_WIN",
  );

  it("should include a Spin to Win system template with correct basic metadata", () => {
    expect(spinToWin).toBeDefined();
    if (!spinToWin) return;

    expect(spinToWin.name).toBe("Spin to Win");
    expect(spinToWin.category).toBe("engagement");
    expect(spinToWin.goals).toContain("NEWSLETTER_SIGNUP");
    expect(spinToWin.goals).toContain("INCREASE_REVENUE");
    expect(spinToWin.isDefault).toBe(true);
  });

  it("should provide content defaults that satisfy SpinToWinContentSchema and include wheelSegments", () => {
    expect(spinToWin).toBeDefined();
    if (!spinToWin) return;

    const result = SpinToWinContentSchema.safeParse(spinToWin.contentConfig);
    expect(result.success).toBe(true);

    if (!result.success) {
      console.error(result.error.format());
      return;
    }

    const content = result.data;

    // Core messaging
    expect(content.headline).toBe("Spin to Win!");
    expect(content.subheadline).toBe("Try your luck for exclusive discounts");
    expect(content.buttonText).toBe("Spin Now");

    // Wheel segments
    expect(Array.isArray(content.wheelSegments)).toBe(true);
    expect(content.wheelSegments.length).toBeGreaterThan(0);

    for (const segment of content.wheelSegments) {
      expect(typeof segment.id).toBe("string");
      expect(typeof segment.label).toBe("string");
      expect(typeof segment.probability).toBe("number");

      if (segment.discountConfig && segment.discountConfig.valueType) {
        expect(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]).toContain(
          segment.discountConfig.valueType,
        );
      }
    }
  });

  it("should enable nameFieldEnabled and consentFieldEnabled by default in seeded template", () => {
    expect(spinToWin).toBeDefined();
    if (!spinToWin) return;

    const result = SpinToWinContentSchema.safeParse(spinToWin.contentConfig);
    expect(result.success).toBe(true);

    if (!result.success) {
      console.error(result.error.format());
      return;
    }

    const content = result.data;

    expect(content.nameFieldEnabled).toBe(true);
    expect(content.consentFieldEnabled).toBe(true);
    expect(typeof content.consentFieldText!).toBe("string");
    expect(content.consentFieldText!.length).toBeGreaterThan(0);
  });
});

