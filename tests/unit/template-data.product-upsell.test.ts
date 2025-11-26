import { describe, it, expect } from "vitest";
import { GLOBAL_SYSTEM_TEMPLATES } from "../../prisma/template-data";
import { ProductUpsellContentSchema } from "~/domains/campaigns/types/campaign";

/**
 * Unit tests for the seeded Cart Upsell system template.
 *
 * These tests ensure that:
 * - The Cart Upsell system template exists in GLOBAL_SYSTEM_TEMPLATES
 * - Its contentConfig matches ProductUpsellContentSchema and has the expected defaults
 * - Its targetRules enable the cart_drawer_open enhanced trigger by default
 */

describe("GLOBAL_SYSTEM_TEMPLATES Cart Upsell", () => {
  const cartUpsell = GLOBAL_SYSTEM_TEMPLATES.find(
    (t) => t.templateType === "PRODUCT_UPSELL" && t.name === "Cart Upsell",
  );

  it("should include a Cart Upsell system template with correct basic metadata", () => {
    expect(cartUpsell).toBeDefined();
    if (!cartUpsell) return;

    expect(cartUpsell.category).toBe("sales");
    expect(cartUpsell.goals).toContain("INCREASE_REVENUE");
    expect(cartUpsell.isDefault).toBe(true);
  });

  it("should provide content defaults that satisfy ProductUpsellContentSchema and match expected values", () => {
    expect(cartUpsell).toBeDefined();
    if (!cartUpsell) return;

    const result = ProductUpsellContentSchema.safeParse(cartUpsell.contentConfig);
    expect(result.success).toBe(true);

    if (!result.success) {
      console.error(result.error.format());
      return;
    }

    const content = result.data;

    expect(content.headline).toBe("Complete your look");
    expect(content.subheadline).toBe("Pairs perfectly with items in your cart");
    expect(content.productSelectionMethod).toBe("ai");
    expect(content.layout).toBe("grid");
    expect(content.maxProducts).toBe(4);
    expect(content.bundleDiscount).toBe(15);
  });

  it("should have the cart_drawer_open enhanced trigger enabled by default", () => {
    expect(cartUpsell).toBeDefined();
    if (!cartUpsell) return;

    const enhanced = (cartUpsell.targetRules as any)?.enhancedTriggers;
    expect(enhanced?.cart_drawer_open?.enabled).toBe(true);
  });
});

