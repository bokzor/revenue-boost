/**
 * Unit Tests for Shopify Discount Server Module
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  createDiscountCode,
  getDiscountCode,
  createBxGyDiscountCode,
  type DiscountCodeInput,
} from "~/lib/shopify/discount.server";

describe("Shopify Discount Server Module", () => {
  const mockAdmin = {
    graphql: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDiscountCode", () => {
    it("should create a percentage discount", async () => {
      mockAdmin.graphql.mockResolvedValueOnce({
        json: async () => ({
          data: {
            discountCodeBasicCreate: {
              codeDiscountNode: {
                id: "gid://shopify/DiscountCodeNode/123",
                codeDiscount: {
                  title: "Test Discount",
                  codes: { nodes: [{ id: "code1", code: "TEST10" }] },
                  status: "ACTIVE",
                  createdAt: "2024-01-01T00:00:00Z",
                  updatedAt: "2024-01-01T00:00:00Z",
                },
              },
              userErrors: [],
            },
          },
        }),
      });

      const input: DiscountCodeInput = {
        title: "Test Discount",
        code: "TEST10",
        value: 10,
        valueType: "PERCENTAGE",
      };

      const result = await createDiscountCode(mockAdmin as never, input);

      expect(result.discount).toBeDefined();
      expect(result.discount?.title).toBe("Test Discount");
      expect(result.errors).toBeUndefined();
    });

    it("should handle user errors", async () => {
      mockAdmin.graphql.mockResolvedValueOnce({
        json: async () => ({
          data: {
            discountCodeBasicCreate: {
              codeDiscountNode: null,
              userErrors: [{ message: "Code already exists", field: ["code"] }],
            },
          },
        }),
      });

      const input: DiscountCodeInput = {
        title: "Test Discount",
        code: "EXISTING",
        value: 10,
        valueType: "PERCENTAGE",
      };

      const result = await createDiscountCode(mockAdmin as never, input);

      expect(result.errors).toBeDefined();
      expect(result.errors).toContain("Code already exists");
    });

    it("should create a free shipping discount", async () => {
      mockAdmin.graphql.mockResolvedValueOnce({
        json: async () => ({
          data: {
            discountCodeFreeShippingCreate: {
              codeDiscountNode: {
                id: "gid://shopify/DiscountCodeNode/456",
                codeDiscount: {
                  title: "Free Shipping",
                  codes: { nodes: [{ id: "code2", code: "FREESHIP" }] },
                  status: "ACTIVE",
                  createdAt: "2024-01-01T00:00:00Z",
                  updatedAt: "2024-01-01T00:00:00Z",
                },
              },
              userErrors: [],
            },
          },
        }),
      });

      const input: DiscountCodeInput = {
        title: "Free Shipping",
        code: "FREESHIP",
        valueType: "FREE_SHIPPING",
      };

      const result = await createDiscountCode(mockAdmin as never, input);

      expect(result.discount).toBeDefined();
      expect(result.discount?.title).toBe("Free Shipping");
    });
  });

  describe("getDiscountCode", () => {
    it("should get discount by ID", async () => {
      mockAdmin.graphql.mockResolvedValueOnce({
        json: async () => ({
          data: {
            codeDiscountNode: {
              id: "gid://shopify/DiscountCodeNode/123",
              codeDiscount: {
                title: "Test Discount",
                codes: { nodes: [{ id: "code1", code: "TEST10" }] },
                status: "ACTIVE",
                createdAt: "2024-01-01T00:00:00Z",
                updatedAt: "2024-01-01T00:00:00Z",
              },
            },
          },
        }),
      });

      const result = await getDiscountCode(
        mockAdmin as never,
        "gid://shopify/DiscountCodeNode/123"
      );

      expect(result.discount).toBeDefined();
      expect(result.discount?.id).toBe("gid://shopify/DiscountCodeNode/123");
    });

    it("should return error when discount not found", async () => {
      mockAdmin.graphql.mockResolvedValueOnce({
        json: async () => ({
          data: {
            codeDiscountNode: null,
          },
        }),
      });

      const result = await getDiscountCode(mockAdmin as never, "invalid-id");

      expect(result.errors).toContain("Discount not found");
    });
  });
});

