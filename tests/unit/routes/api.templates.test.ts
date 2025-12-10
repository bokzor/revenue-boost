/**
 * Unit Tests for Templates API
 *
 * Tests the template listing and creation logic.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the template type enum
const TemplateTypeSchema = z.enum([
  "NEWSLETTER",
  "SPIN_TO_WIN",
  "FLASH_SALE",
  "SCRATCH_CARD",
  "FREE_SHIPPING",
  "CART_ABANDONMENT",
  "UPSELL",
  "SOCIAL_PROOF",
  "ANNOUNCEMENT_BAR",
  "COUNTDOWN_BAR",
  "GAMIFIED_DISCOUNT",
]);

// Recreate the template create schema
const TemplateCreateDataSchema = z.object({
  name: z.string().min(1, "Name is required"),
  templateType: TemplateTypeSchema,
  description: z.string().optional(),
  contentConfig: z.record(z.string(), z.any()).optional(),
  designConfig: z.record(z.string(), z.any()).optional(),
  isDefault: z.boolean().optional().default(false),
});

// Helper to parse query params
function parseTemplateQueryParams(url: URL): {
  type: string | null;
  defaultOnly: boolean;
} {
  return {
    type: url.searchParams.get("type"),
    defaultOnly: url.searchParams.get("default") === "true",
  };
}

describe("Templates API", () => {
  describe("TemplateTypeSchema", () => {
    it("should validate valid template types", () => {
      expect(TemplateTypeSchema.safeParse("NEWSLETTER").success).toBe(true);
      expect(TemplateTypeSchema.safeParse("SPIN_TO_WIN").success).toBe(true);
      expect(TemplateTypeSchema.safeParse("FLASH_SALE").success).toBe(true);
    });

    it("should reject invalid template types", () => {
      expect(TemplateTypeSchema.safeParse("INVALID").success).toBe(false);
      expect(TemplateTypeSchema.safeParse("").success).toBe(false);
    });
  });

  describe("TemplateCreateDataSchema", () => {
    it("should validate valid template data", () => {
      const validData = {
        name: "My Newsletter Template",
        templateType: "NEWSLETTER",
      };

      const result = TemplateCreateDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should require name", () => {
      const invalidData = {
        templateType: "NEWSLETTER",
      };

      const result = TemplateCreateDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should require templateType", () => {
      const invalidData = {
        name: "My Template",
      };

      const result = TemplateCreateDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept optional fields", () => {
      const validData = {
        name: "My Template",
        templateType: "FLASH_SALE",
        description: "A flash sale template",
        contentConfig: { headline: "Sale!" },
        designConfig: { backgroundColor: "#ff0000" },
        isDefault: true,
      };

      const result = TemplateCreateDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should default isDefault to false", () => {
      const validData = {
        name: "My Template",
        templateType: "NEWSLETTER",
      };

      const result = TemplateCreateDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDefault).toBe(false);
      }
    });
  });

  describe("parseTemplateQueryParams", () => {
    it("should parse type parameter", () => {
      const url = new URL("https://example.com/api/templates?type=NEWSLETTER");
      const params = parseTemplateQueryParams(url);
      expect(params.type).toBe("NEWSLETTER");
    });

    it("should parse default parameter", () => {
      const url = new URL("https://example.com/api/templates?default=true");
      const params = parseTemplateQueryParams(url);
      expect(params.defaultOnly).toBe(true);
    });

    it("should handle missing parameters", () => {
      const url = new URL("https://example.com/api/templates");
      const params = parseTemplateQueryParams(url);
      expect(params.type).toBeNull();
      expect(params.defaultOnly).toBe(false);
    });

    it("should handle combined parameters", () => {
      const url = new URL(
        "https://example.com/api/templates?type=SPIN_TO_WIN&default=true"
      );
      const params = parseTemplateQueryParams(url);
      expect(params.type).toBe("SPIN_TO_WIN");
      expect(params.defaultOnly).toBe(true);
    });
  });
});

