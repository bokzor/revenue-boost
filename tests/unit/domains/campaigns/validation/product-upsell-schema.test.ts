/**
 * Product Upsell Content Schema Validation Tests
 * 
 * Comprehensive tests for ProductUpsellContentSchema covering:
 * - All field validations
 * - Boundary conditions
 * - Enum validations
 * - Optional vs required fields
 * - Type validations
 */

import { describe, it, expect } from "vitest";
import { ProductUpsellContentSchema } from "~/domains/campaigns/types/campaign";

describe("ProductUpsellContentSchema Validation", () => {
  describe("Valid Configurations", () => {
    it("validates minimal valid configuration with defaults", () => {
      const config = {
        headline: "Test Headline",
        buttonText: "Add to Cart",
        successMessage: "Added!",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.productSelectionMethod).toBe("ai");
        expect(result.data.layout).toBe("grid");
        expect(result.data.maxProducts).toBe(3);
        expect(result.data.columns).toBe(2);
        expect(result.data.showPrices).toBe(true);
        expect(result.data.showCompareAtPrice).toBe(true);
        expect(result.data.showImages).toBe(true);
        expect(result.data.showRatings).toBe(false);
        expect(result.data.showReviewCount).toBe(false);
        expect(result.data.bundleDiscount).toBe(15);
        expect(result.data.multiSelect).toBe(true);
        expect(result.data.currency).toBe("USD");
      }
    });

    it("validates configuration with all fields explicitly set", () => {
      const config = {
        headline: "Complete Your Order",
        subheadline: "Save more when you bundle",
        buttonText: "Add to Cart",
        successMessage: "Added to cart!",
        productSelectionMethod: "manual" as const,
        selectedProducts: ["gid://shopify/Product/123", "gid://shopify/Product/456"],
        maxProducts: 5,
        layout: "grid" as const,
        columns: 3,
        showPrices: true,
        showCompareAtPrice: true,
        showImages: true,
        showRatings: true,
        showReviewCount: true,
        bundleDiscount: 20,
        bundleDiscountText: "Save 20% on bundle!",
        multiSelect: true,
        secondaryCtaLabel: "View Details",
        currency: "EUR",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.productSelectionMethod).toBe("manual");
        expect(result.data.selectedProducts).toEqual(["gid://shopify/Product/123", "gid://shopify/Product/456"]);
        expect(result.data.maxProducts).toBe(5);
        expect(result.data.layout).toBe("grid");
        expect(result.data.columns).toBe(3);
        expect(result.data.bundleDiscount).toBe(20);
        expect(result.data.bundleDiscountText).toBe("Save 20% on bundle!");
        expect(result.data.currency).toBe("EUR");
      }
    });
  });

  describe("Product Selection Method Validation", () => {
    it("accepts 'ai' as productSelectionMethod", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        productSelectionMethod: "ai" as const,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts 'manual' as productSelectionMethod", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        productSelectionMethod: "manual" as const,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts 'collection' as productSelectionMethod", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        productSelectionMethod: "collection" as const,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("rejects invalid productSelectionMethod", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        productSelectionMethod: "invalid",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe("Layout Validation", () => {
    it("accepts 'grid' as layout", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        layout: "grid" as const,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts 'grid' as layout", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        layout: "grid" as const,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts 'card' as layout", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        layout: "card" as const,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("rejects invalid layout", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        layout: "invalid",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe("Boundary Validations", () => {
    describe("maxProducts", () => {
      it("accepts minimum value of 1", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          maxProducts: 1,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      it("accepts maximum value of 12", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          maxProducts: 12,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      it("rejects value less than 1", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          maxProducts: 0,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(false);
      });

      it("rejects value greater than 12", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          maxProducts: 13,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(false);
      });

      it("rejects non-integer values", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          maxProducts: 5.5,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(false);
      });
    });

    describe("columns", () => {
      it("accepts minimum value of 1", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          columns: 1,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      it("accepts maximum value of 4", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          columns: 4,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      it("rejects value less than 1", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          columns: 0,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(false);
      });

      it("rejects value greater than 4", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          columns: 5,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(false);
      });

      it("rejects non-integer values", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          columns: 2.5,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(false);
      });
    });

    describe("bundleDiscount", () => {
      it("accepts minimum value of 0", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          bundleDiscount: 0,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      it("accepts maximum value of 100", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          bundleDiscount: 100,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      it("rejects negative values", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          bundleDiscount: -1,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(false);
      });

      it("rejects value greater than 100", () => {
        const config = {
          headline: "Test",
          buttonText: "Add",
          successMessage: "Done",
          bundleDiscount: 101,
        };

        const result = ProductUpsellContentSchema.safeParse(config);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Boolean Display Options", () => {
    it("accepts showPrices as true", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        showPrices: true,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showPrices).toBe(true);
      }
    });

    it("accepts showPrices as false", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        showPrices: false,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.showPrices).toBe(false);
      }
    });

    it("accepts showCompareAtPrice as boolean", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        showCompareAtPrice: false,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts showImages as boolean", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        showImages: false,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts showRatings as boolean", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        showRatings: true,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts showReviewCount as boolean", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        showReviewCount: true,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts multiSelect as boolean", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        multiSelect: false,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("rejects non-boolean values for boolean fields", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        showPrices: "yes",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe("Optional Fields", () => {
    it("accepts configuration without selectedProducts", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        productSelectionMethod: "ai" as const,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts configuration with selectedProducts array", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        selectedProducts: ["gid://shopify/Product/1", "gid://shopify/Product/2"],
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts configuration without selectedCollection", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        productSelectionMethod: "ai" as const,
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts configuration with selectedCollection", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        selectedCollection: "gid://shopify/Collection/123",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts configuration without bundleDiscountText", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts configuration with bundleDiscountText", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        bundleDiscountText: "Save 20% when you bundle!",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts configuration without secondaryCtaLabel", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("accepts configuration with secondaryCtaLabel", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        secondaryCtaLabel: "View Product",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe("Type Validations", () => {
    it("rejects non-string headline", () => {
      const config = {
        headline: 123,
        buttonText: "Add",
        successMessage: "Done",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("rejects non-array selectedProducts", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        selectedProducts: "not-an-array",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("rejects non-number maxProducts", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        maxProducts: "5",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("rejects non-number bundleDiscount", () => {
      const config = {
        headline: "Test",
        buttonText: "Add",
        successMessage: "Done",
        bundleDiscount: "15",
      };

      const result = ProductUpsellContentSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});

