/**
 * Unit Tests for Shopify Files Service
 */

import { describe, it, expect, vi } from "vitest";

import {
  createImageStagedUpload,
  createImageFileFromStaged,
} from "~/lib/shopify/files.server";

describe("createImageStagedUpload", () => {
  it("should return staged upload target", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              stagedUploadsCreate: {
                stagedTargets: [
                  {
                    url: "https://upload.shopify.com/staged",
                    resourceUrl: "https://cdn.shopify.com/resource",
                    parameters: [{ name: "key", value: "value" }],
                  },
                ],
                userErrors: [],
              },
            },
          }),
      }),
    };

    const result = await createImageStagedUpload(mockAdmin as any, {
      filename: "test.jpg",
      mimeType: "image/jpeg",
    });

    expect(result.url).toBe("https://upload.shopify.com/staged");
    expect(result.resourceUrl).toBe("https://cdn.shopify.com/resource");
    expect(result.parameters).toHaveLength(1);
  });

  it("should throw on GraphQL errors", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            errors: [{ message: "Upload failed" }],
          }),
      }),
    };

    await expect(
      createImageStagedUpload(mockAdmin as any, {
        filename: "test.jpg",
        mimeType: "image/jpeg",
      })
    ).rejects.toThrow("Upload failed");
  });

  it("should throw on user errors", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              stagedUploadsCreate: {
                stagedTargets: [],
                userErrors: [{ message: "Invalid file type" }],
              },
            },
          }),
      }),
    };

    await expect(
      createImageStagedUpload(mockAdmin as any, {
        filename: "test.jpg",
        mimeType: "image/jpeg",
      })
    ).rejects.toThrow("Invalid file type");
  });
});

describe("createImageFileFromStaged", () => {
  it("should return created file with image URL", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              fileCreate: {
                files: [
                  {
                    id: "gid://shopify/MediaImage/123",
                    fileStatus: "READY",
                    alt: "Test image",
                    image: { url: "https://cdn.shopify.com/image.jpg" },
                  },
                ],
                userErrors: [],
              },
            },
          }),
      }),
    };

    const result = await createImageFileFromStaged(mockAdmin as any, {
      resourceUrl: "https://staged.shopify.com/resource",
      alt: "Test image",
    });

    expect(result.id).toBe("gid://shopify/MediaImage/123");
    expect(result.url).toBe("https://cdn.shopify.com/image.jpg");
    expect(result.alt).toBe("Test image");
  });

  it("should throw on FAILED status", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              fileCreate: {
                files: [
                  {
                    id: "gid://shopify/MediaImage/123",
                    fileStatus: "FAILED",
                  },
                ],
                userErrors: [],
              },
            },
          }),
      }),
    };

    await expect(
      createImageFileFromStaged(mockAdmin as any, {
        resourceUrl: "https://staged.shopify.com/resource",
      })
    ).rejects.toThrow("FAILED status");
  });

  it("should fall back to resourceUrl when no image URL", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              fileCreate: {
                files: [
                  {
                    id: "gid://shopify/MediaImage/123",
                    fileStatus: "PROCESSING",
                  },
                ],
                userErrors: [],
              },
            },
          }),
      }),
    };

    const result = await createImageFileFromStaged(mockAdmin as any, {
      resourceUrl: "https://staged.shopify.com/resource",
    });

    expect(result.url).toBe("https://staged.shopify.com/resource");
  });
});

