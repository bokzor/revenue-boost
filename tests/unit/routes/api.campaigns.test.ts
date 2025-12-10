/**
 * Unit Tests for Campaigns API
 *
 * Tests the campaign listing, creation, and update logic.
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

// Recreate the campaign status enum
const CampaignStatusSchema = z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]);

// Helper to parse query params
function parseCampaignQueryParams(url: URL): {
  templateType: string | null;
  status: string | null;
  id: string | null;
} {
  return {
    templateType: url.searchParams.get("templateType"),
    status: url.searchParams.get("status"),
    id: url.searchParams.get("id"),
  };
}

// Recreate the sanitizeDesignCustomCss logic
function sanitizeDesignCustomCss(designConfig?: { customCSS?: unknown }): void {
  if (!designConfig) return;

  const css = designConfig.customCSS;
  if (css === undefined || css === null) {
    if ("customCSS" in designConfig) {
      delete (designConfig as Record<string, unknown>).customCSS;
    }
    return;
  }

  if (typeof css !== "string") {
    throw new Error("customCSS must be a string");
  }

  // Trim and validate
  const trimmed = css.trim();
  if (trimmed.length === 0) {
    delete (designConfig as Record<string, unknown>).customCSS;
    return;
  }

  designConfig.customCSS = trimmed;
}

describe("Campaigns API", () => {
  describe("parseCampaignQueryParams", () => {
    it("should parse templateType parameter", () => {
      const url = new URL("https://example.com/api/campaigns?templateType=NEWSLETTER");
      const params = parseCampaignQueryParams(url);
      expect(params.templateType).toBe("NEWSLETTER");
    });

    it("should parse status parameter", () => {
      const url = new URL("https://example.com/api/campaigns?status=active");
      const params = parseCampaignQueryParams(url);
      expect(params.status).toBe("active");
    });

    it("should parse id parameter for PUT/DELETE", () => {
      const url = new URL("https://example.com/api/campaigns?id=cmp_123");
      const params = parseCampaignQueryParams(url);
      expect(params.id).toBe("cmp_123");
    });

    it("should handle missing parameters", () => {
      const url = new URL("https://example.com/api/campaigns");
      const params = parseCampaignQueryParams(url);
      expect(params.templateType).toBeNull();
      expect(params.status).toBeNull();
      expect(params.id).toBeNull();
    });
  });

  describe("sanitizeDesignCustomCss", () => {
    it("should do nothing for undefined designConfig", () => {
      expect(() => sanitizeDesignCustomCss(undefined)).not.toThrow();
    });

    it("should trim whitespace from customCSS", () => {
      const config = { customCSS: "  .popup { color: red; }  " };
      sanitizeDesignCustomCss(config);
      expect(config.customCSS).toBe(".popup { color: red; }");
    });

    it("should delete empty customCSS", () => {
      const config: { customCSS?: unknown } = { customCSS: "   " };
      sanitizeDesignCustomCss(config);
      expect("customCSS" in config).toBe(false);
    });

    it("should throw for non-string customCSS", () => {
      const config = { customCSS: 123 };
      expect(() => sanitizeDesignCustomCss(config)).toThrow("customCSS must be a string");
    });
  });

  describe("TemplateTypeSchema", () => {
    it("should validate all template types", () => {
      const types = [
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
      ];

      types.forEach((type) => {
        expect(TemplateTypeSchema.safeParse(type).success).toBe(true);
      });
    });
  });

  describe("CampaignStatusSchema", () => {
    it("should validate all campaign statuses", () => {
      const statuses = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"];

      statuses.forEach((status) => {
        expect(CampaignStatusSchema.safeParse(status).success).toBe(true);
      });
    });
  });
});

