/**
 * Unit Tests for Discount Issue API
 *
 * Tests the validation schema and helper functions.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the validation schema from the route
const IssueDiscountRequestSchema = z.object({
  campaignId: z.string().min(1).refine(
    (id) => id.startsWith("preview-") || /^[cC][^\s-]{8,}$/.test(id),
    "Invalid campaign ID format"
  ),
  cartSubtotalCents: z.number().int().min(0).optional(),
  sessionId: z.string(),
  visitorId: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .optional(),
  selectedProductIds: z.array(z.string()).optional(),
  cartProductIds: z.array(z.string()).optional(),
  popupShownAt: z.number().optional(),
  honeypot: z.string().optional(),
});

describe("Discount Issue API", () => {
  describe("IssueDiscountRequestSchema", () => {
    it("should validate valid request with campaign ID", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "cm1234567890",
        sessionId: "session-123",
      });

      expect(result.success).toBe(true);
    });

    it("should validate preview campaign ID", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "preview-abc123",
        sessionId: "session-123",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid campaign ID format", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "invalid",
        sessionId: "session-123",
      });

      expect(result.success).toBe(false);
    });

    it("should require sessionId", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "cm1234567890",
      });

      expect(result.success).toBe(false);
    });

    it("should validate with cart subtotal", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "cm1234567890",
        sessionId: "session-123",
        cartSubtotalCents: 5000,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cartSubtotalCents).toBe(5000);
      }
    });

    it("should reject negative cart subtotal", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "cm1234567890",
        sessionId: "session-123",
        cartSubtotalCents: -100,
      });

      expect(result.success).toBe(false);
    });

    it("should validate with line items", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "cm1234567890",
        sessionId: "session-123",
        lineItems: [
          { variantId: "variant-1", quantity: 2 },
          { variantId: "variant-2", quantity: 1 },
        ],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lineItems).toHaveLength(2);
      }
    });

    it("should reject line items with zero quantity", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "cm1234567890",
        sessionId: "session-123",
        lineItems: [{ variantId: "variant-1", quantity: 0 }],
      });

      expect(result.success).toBe(false);
    });

    it("should validate with selected product IDs", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "cm1234567890",
        sessionId: "session-123",
        selectedProductIds: ["product-1", "product-2"],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectedProductIds).toEqual(["product-1", "product-2"]);
      }
    });

    it("should validate with cart product IDs", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "cm1234567890",
        sessionId: "session-123",
        cartProductIds: ["product-1"],
      });

      expect(result.success).toBe(true);
    });

    it("should validate with bot detection fields", () => {
      const result = IssueDiscountRequestSchema.safeParse({
        campaignId: "cm1234567890",
        sessionId: "session-123",
        popupShownAt: Date.now() - 5000,
        honeypot: "",
      });

      expect(result.success).toBe(true);
    });
  });
});

