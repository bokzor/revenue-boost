import { describe, it, expect } from "vitest";
import { GLOBAL_SYSTEM_TEMPLATES } from "../../prisma/template-data";
import { ProductUpsellContentSchema } from "~/domains/campaigns/types/campaign";

/**
 * Unit tests for the seeded Post-Add Upsell system template.
 *
 * These tests ensure that:
 * - The Post-Add Upsell system template exists in GLOBAL_SYSTEM_TEMPLATES
 * - Its contentConfig matches ProductUpsellContentSchema and has the expected defaults
 * - Its targetRules enable the add_to_cart enhanced trigger by default
 */

describe("GLOBAL_SYSTEM_TEMPLATES  Post-Add Upsell", () => {
  const postAddUpsell = GLOBAL_SYSTEM_TEMPLATES.find(
    (t) => t.templateType === "PRODUCT_UPSELL" && t.name === "Post-Add Upsell",
  );

  it("should include a Post-Add Upsell system template with correct basic metadata", () => {
    expect(postAddUpsell).toBeDefined();
    if (!postAddUpsell) return;

    expect(postAddUpsell.category).toBe("sales");
    expect(postAddUpsell.goals).toContain("INCREASE_REVENUE");
    expect(postAddUpsell.isDefault).toBe(true);
  });

  it("should provide content defaults that satisfy ProductUpsellContentSchema and match expected values", () => {
    expect(postAddUpsell).toBeDefined();
    if (!postAddUpsell) return;

    const result = ProductUpsellContentSchema.safeParse(postAddUpsell.contentConfig);
    expect(result.success).toBe(true);

    if (!result.success) {
      console.error(result.error.format());
      return;
    }

    const content = result.data;

    expect(content.headline).toBe("Great pick! Add this too");
    expect(content.subheadline).toBe("Bundle and save more");
    expect(content.productSelectionMethod).toBe("ai");
    expect(content.maxProducts).toBe(2);
    expect(content.bundleDiscount).toBe(10);
  });

  it("should have the add_to_cart enhanced trigger enabled by default", () => {
    expect(postAddUpsell).toBeDefined();
    if (!postAddUpsell) return;

    const enhanced = (postAddUpsell.targetRules as any)?.enhancedTriggers;
    expect(enhanced?.add_to_cart?.enabled).toBe(true);
  });
});

