/**
 * Unit Tests for Shopify Order Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import { createDraftOrder } from "~/lib/shopify/order.server";

describe("createDraftOrder", () => {
  const mockAdmin = {
    graphql: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create draft order successfully", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            draftOrderCreate: {
              draftOrder: {
                id: "gid://shopify/DraftOrder/123",
                invoiceUrl: "https://shop.myshopify.com/invoice/123",
                name: "#D123",
              },
              userErrors: [],
            },
          },
        }),
    });

    const result = await createDraftOrder(mockAdmin as any, {
      email: "test@example.com",
      lineItems: [{ variant_id: 456, quantity: 2 }],
    });

    expect(result.success).toBe(true);
    expect(result.draftOrder?.id).toBe("gid://shopify/DraftOrder/123");
    expect(result.draftOrder?.invoiceUrl).toBe("https://shop.myshopify.com/invoice/123");
  });

  it("should return error for empty line items", async () => {
    const result = await createDraftOrder(mockAdmin as any, {
      email: "test@example.com",
      lineItems: [],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain("No valid line items provided");
  });

  it("should skip line items without variant ID", async () => {
    const result = await createDraftOrder(mockAdmin as any, {
      email: "test@example.com",
      lineItems: [{ quantity: 1 }], // No variant_id or id
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain("No valid line items provided");
  });

  it("should handle user errors from Shopify", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            draftOrderCreate: {
              draftOrder: null,
              userErrors: [{ field: "email", message: "Invalid email" }],
            },
          },
        }),
    });

    const result = await createDraftOrder(mockAdmin as any, {
      email: "invalid",
      lineItems: [{ variant_id: 123, quantity: 1 }],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Invalid email");
  });

  it("should handle GraphQL errors", async () => {
    mockAdmin.graphql.mockRejectedValue(new Error("Network error"));

    const result = await createDraftOrder(mockAdmin as any, {
      email: "test@example.com",
      lineItems: [{ variant_id: 123, quantity: 1 }],
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Network error");
  });

  it("should use id field if variant_id is not present", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            draftOrderCreate: {
              draftOrder: { id: "123", invoiceUrl: "url", name: "#D1" },
              userErrors: [],
            },
          },
        }),
    });

    await createDraftOrder(mockAdmin as any, {
      email: "test@example.com",
      lineItems: [{ id: 789, quantity: 1 }],
    });

    expect(mockAdmin.graphql).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            lineItems: expect.arrayContaining([
              expect.objectContaining({
                variantId: "gid://shopify/ProductVariant/789",
              }),
            ]),
          }),
        }),
      })
    );
  });

  it("should include custom attributes from properties", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            draftOrderCreate: {
              draftOrder: { id: "123", invoiceUrl: "url", name: "#D1" },
              userErrors: [],
            },
          },
        }),
    });

    await createDraftOrder(mockAdmin as any, {
      email: "test@example.com",
      lineItems: [{ variant_id: 123, quantity: 1, properties: { color: "red" } }],
    });

    expect(mockAdmin.graphql).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        variables: expect.objectContaining({
          input: expect.objectContaining({
            lineItems: expect.arrayContaining([
              expect.objectContaining({
                customAttributes: [{ key: "color", value: "red" }],
              }),
            ]),
          }),
        }),
      })
    );
  });
});

