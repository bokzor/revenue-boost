/**
 * Unit Tests for Shopify Files Staged Uploads API
 *
 * Tests the staged upload creation logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the request body structure
interface StagedUploadRequestBody {
  filename?: string;
  mimeType?: string;
  fileSize?: number;
}

// Helper to validate request body
function validateStagedUploadRequest(
  body: unknown
): body is StagedUploadRequestBody & { filename: string; mimeType: string } {
  if (!body || typeof body !== "object") return false;
  const req = body as Record<string, unknown>;
  return (
    typeof req.filename === "string" &&
    req.filename.length > 0 &&
    typeof req.mimeType === "string" &&
    req.mimeType.length > 0
  );
}

// Helper to build staged upload params
function buildStagedUploadParams(body: StagedUploadRequestBody): {
  filename: string;
  mimeType: string;
  fileSize?: number;
} {
  return {
    filename: body.filename!,
    mimeType: body.mimeType!,
    fileSize:
      typeof body.fileSize === "number" && body.fileSize > 0
        ? body.fileSize
        : undefined,
  };
}

// Helper to validate mime type
function isValidImageMimeType(mimeType: string): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  return validTypes.includes(mimeType);
}

describe("Shopify Files Staged Uploads API", () => {
  describe("validateStagedUploadRequest", () => {
    it("should return true for valid request", () => {
      const body = {
        filename: "product.jpg",
        mimeType: "image/jpeg",
      };
      expect(validateStagedUploadRequest(body)).toBe(true);
    });

    it("should return true for request with fileSize", () => {
      const body = {
        filename: "product.jpg",
        mimeType: "image/jpeg",
        fileSize: 1024000,
      };
      expect(validateStagedUploadRequest(body)).toBe(true);
    });

    it("should return false for missing filename", () => {
      const body = { mimeType: "image/jpeg" };
      expect(validateStagedUploadRequest(body)).toBe(false);
    });

    it("should return false for missing mimeType", () => {
      const body = { filename: "product.jpg" };
      expect(validateStagedUploadRequest(body)).toBe(false);
    });

    it("should return false for empty filename", () => {
      const body = { filename: "", mimeType: "image/jpeg" };
      expect(validateStagedUploadRequest(body)).toBe(false);
    });

    it("should return false for null body", () => {
      expect(validateStagedUploadRequest(null)).toBe(false);
    });
  });

  describe("buildStagedUploadParams", () => {
    it("should build params without fileSize", () => {
      const body: StagedUploadRequestBody = {
        filename: "product.jpg",
        mimeType: "image/jpeg",
      };

      const params = buildStagedUploadParams(body);

      expect(params.filename).toBe("product.jpg");
      expect(params.mimeType).toBe("image/jpeg");
      expect(params.fileSize).toBeUndefined();
    });

    it("should build params with valid fileSize", () => {
      const body: StagedUploadRequestBody = {
        filename: "product.jpg",
        mimeType: "image/jpeg",
        fileSize: 1024000,
      };

      const params = buildStagedUploadParams(body);

      expect(params.fileSize).toBe(1024000);
    });

    it("should ignore zero fileSize", () => {
      const body: StagedUploadRequestBody = {
        filename: "product.jpg",
        mimeType: "image/jpeg",
        fileSize: 0,
      };

      const params = buildStagedUploadParams(body);

      expect(params.fileSize).toBeUndefined();
    });

    it("should ignore negative fileSize", () => {
      const body: StagedUploadRequestBody = {
        filename: "product.jpg",
        mimeType: "image/jpeg",
        fileSize: -100,
      };

      const params = buildStagedUploadParams(body);

      expect(params.fileSize).toBeUndefined();
    });
  });

  describe("isValidImageMimeType", () => {
    it("should validate common image types", () => {
      expect(isValidImageMimeType("image/jpeg")).toBe(true);
      expect(isValidImageMimeType("image/png")).toBe(true);
      expect(isValidImageMimeType("image/gif")).toBe(true);
      expect(isValidImageMimeType("image/webp")).toBe(true);
    });

    it("should reject non-image types", () => {
      expect(isValidImageMimeType("application/pdf")).toBe(false);
      expect(isValidImageMimeType("text/plain")).toBe(false);
      expect(isValidImageMimeType("video/mp4")).toBe(false);
    });
  });
});

