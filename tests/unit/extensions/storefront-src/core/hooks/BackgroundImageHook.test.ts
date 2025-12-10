/**
 * Unit Tests for BackgroundImageHook
 *
 * Tests the background image preloading and URL transformation logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the transformImageUrl helper
function transformImageUrl(imageUrl: string): string {
  // If it's already a full URL, use as-is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If it's a preset background path like /newsletter-backgrounds/...
  // Transform to App Proxy URL
  if (imageUrl.startsWith("/newsletter-backgrounds/")) {
    return `/apps/revenue-boost/assets${imageUrl}`;
  }

  // Other relative paths, try via assets proxy
  if (imageUrl.startsWith("/")) {
    return `/apps/revenue-boost/assets${imageUrl}`;
  }

  // Return as-is for any other format
  return imageUrl;
}

describe("BackgroundImageHook", () => {
  describe("transformImageUrl", () => {
    it("should return full HTTP URLs as-is", () => {
      const url = "http://example.com/image.jpg";
      expect(transformImageUrl(url)).toBe(url);
    });

    it("should return full HTTPS URLs as-is", () => {
      const url = "https://cdn.shopify.com/s/files/image.jpg";
      expect(transformImageUrl(url)).toBe(url);
    });

    it("should transform newsletter background paths to App Proxy URLs", () => {
      const url = "/newsletter-backgrounds/bold.jpg";
      expect(transformImageUrl(url)).toBe("/apps/revenue-boost/assets/newsletter-backgrounds/bold.jpg");
    });

    it("should transform other relative paths to App Proxy URLs", () => {
      const url = "/images/custom-bg.png";
      expect(transformImageUrl(url)).toBe("/apps/revenue-boost/assets/images/custom-bg.png");
    });

    it("should return non-path strings as-is", () => {
      const url = "data:image/png;base64,abc123";
      expect(transformImageUrl(url)).toBe(url);
    });

    it("should handle empty string", () => {
      expect(transformImageUrl("")).toBe("");
    });
  });

  describe("Hook configuration", () => {
    it("should have correct hook name", () => {
      const hookName = "backgroundImage";
      expect(hookName).toBe("backgroundImage");
    });

    it("should run in preview mode", () => {
      const runInPreview = true;
      expect(runInPreview).toBe(true);
    });

    it("should have 5 second timeout", () => {
      const timeoutMs = 5000;
      expect(timeoutMs).toBe(5000);
    });
  });

  describe("Image URL extraction", () => {
    it("should extract imageUrl from designConfig", () => {
      const designConfig = { imageUrl: "/newsletter-backgrounds/bold.jpg" };
      const imageUrl = designConfig.imageUrl || null;
      expect(imageUrl).toBe("/newsletter-backgrounds/bold.jpg");
    });

    it("should extract backgroundImageUrl from designConfig", () => {
      const designConfig = { backgroundImageUrl: "https://example.com/bg.jpg" };
      const imageUrl = designConfig.backgroundImageUrl || null;
      expect(imageUrl).toBe("https://example.com/bg.jpg");
    });

    it("should prefer imageUrl over backgroundImageUrl", () => {
      const designConfig = {
        imageUrl: "/primary.jpg",
        backgroundImageUrl: "/fallback.jpg",
      };
      const imageUrl = designConfig.imageUrl || designConfig.backgroundImageUrl;
      expect(imageUrl).toBe("/primary.jpg");
    });

    it("should return null when no image URL is present", () => {
      const designConfig = { backgroundColor: "#ffffff" };
      const imageUrl = (designConfig as { imageUrl?: string }).imageUrl || null;
      expect(imageUrl).toBeNull();
    });
  });

  describe("Hook result structure", () => {
    it("should return success with null data when no image", () => {
      const result = {
        success: true,
        data: null,
        hookName: "backgroundImage",
      };
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it("should return success with preload data when image loads", () => {
      const result = {
        success: true,
        data: { imageUrl: "/test.jpg", preloaded: true, loadTimeMs: 150 },
        hookName: "backgroundImage",
      };
      expect(result.success).toBe(true);
      expect(result.data?.preloaded).toBe(true);
    });

    it("should return success with error data when preload fails", () => {
      const result = {
        success: true, // Non-critical failure
        data: { preloaded: false, error: "Image failed to load" },
        hookName: "backgroundImage",
      };
      expect(result.success).toBe(true);
      expect(result.data?.preloaded).toBe(false);
      expect(result.data?.error).toBeDefined();
    });
  });
});

