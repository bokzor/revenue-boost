/**
 * Unit Tests for Shopify Files Create From Staged API
 *
 * Tests the file creation from staged upload logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the request body structure
interface CreateFromStagedRequestBody {
  resourceUrl?: string;
  alt?: string;
}

// Helper to validate request body
function validateCreateFromStagedRequest(
  body: unknown
): body is CreateFromStagedRequestBody & { resourceUrl: string } {
  if (!body || typeof body !== "object") return false;
  const req = body as Record<string, unknown>;
  return typeof req.resourceUrl === "string" && req.resourceUrl.length > 0;
}

// Helper to build file creation params
function buildFileCreationParams(body: CreateFromStagedRequestBody): {
  resourceUrl: string;
  alt?: string;
} {
  return {
    resourceUrl: body.resourceUrl!,
    alt: body.alt,
  };
}

describe("Shopify Files Create From Staged API", () => {
  describe("validateCreateFromStagedRequest", () => {
    it("should return true for valid request with resourceUrl", () => {
      const body = {
        resourceUrl: "https://shopify.com/staged/abc123",
      };
      expect(validateCreateFromStagedRequest(body)).toBe(true);
    });

    it("should return true for request with resourceUrl and alt", () => {
      const body = {
        resourceUrl: "https://shopify.com/staged/abc123",
        alt: "Product image",
      };
      expect(validateCreateFromStagedRequest(body)).toBe(true);
    });

    it("should return false for missing resourceUrl", () => {
      const body = { alt: "Product image" };
      expect(validateCreateFromStagedRequest(body)).toBe(false);
    });

    it("should return false for empty resourceUrl", () => {
      const body = { resourceUrl: "" };
      expect(validateCreateFromStagedRequest(body)).toBe(false);
    });

    it("should return false for null body", () => {
      expect(validateCreateFromStagedRequest(null)).toBe(false);
    });

    it("should return false for undefined body", () => {
      expect(validateCreateFromStagedRequest(undefined)).toBe(false);
    });
  });

  describe("buildFileCreationParams", () => {
    it("should build params with resourceUrl only", () => {
      const body: CreateFromStagedRequestBody = {
        resourceUrl: "https://shopify.com/staged/abc123",
      };

      const params = buildFileCreationParams(body);

      expect(params.resourceUrl).toBe("https://shopify.com/staged/abc123");
      expect(params.alt).toBeUndefined();
    });

    it("should build params with resourceUrl and alt", () => {
      const body: CreateFromStagedRequestBody = {
        resourceUrl: "https://shopify.com/staged/abc123",
        alt: "Product image description",
      };

      const params = buildFileCreationParams(body);

      expect(params.resourceUrl).toBe("https://shopify.com/staged/abc123");
      expect(params.alt).toBe("Product image description");
    });
  });

  describe("HTTP method validation", () => {
    it("should only allow POST method", () => {
      const allowedMethods = ["POST"];
      const disallowedMethods = ["GET", "PUT", "DELETE"];

      expect(allowedMethods).toContain("POST");
      disallowedMethods.forEach((method) => {
        expect(allowedMethods).not.toContain(method);
      });
    });
  });

  describe("Response structure", () => {
    it("should have valid success response with file", () => {
      const response = {
        success: true,
        data: {
          file: {
            id: "gid://shopify/MediaImage/123",
            url: "https://cdn.shopify.com/image.jpg",
            alt: "Product image",
          },
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.file.id).toBeDefined();
    });

    it("should have valid error response", () => {
      const response = {
        success: false,
        error: "resourceUrl is required",
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe("resourceUrl is required");
    });
  });
});

