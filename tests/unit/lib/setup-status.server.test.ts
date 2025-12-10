/**
 * Unit Tests for Setup Status Server Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  invalidateSetupStatusCache,
  clearSetupStatusCache,
  checkThemeExtensionEnabled,
  checkCustomProxyUrl,
  checkAppProxyReachable,
  getSetupStatus,
} from "~/lib/setup-status.server";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Setup Status Server Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSetupStatusCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("invalidateSetupStatusCache", () => {
    it("should not throw when invalidating non-existent cache", () => {
      expect(() => invalidateSetupStatusCache("test-shop.myshopify.com")).not.toThrow();
    });
  });

  describe("clearSetupStatusCache", () => {
    it("should not throw when clearing empty cache", () => {
      expect(() => clearSetupStatusCache()).not.toThrow();
    });
  });

  describe("checkThemeExtensionEnabled", () => {
    it("should return false when themes API fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const result = await checkThemeExtensionEnabled({
        shop: "test-shop.myshopify.com",
        accessToken: "test-token",
      });

      expect(result).toBe(false);
    });

    it("should return false when no published theme found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ themes: [] }),
      });

      const result = await checkThemeExtensionEnabled({
        shop: "test-shop.myshopify.com",
        accessToken: "test-token",
      });

      expect(result).toBe(false);
    });

    it("should return false when settings_data.json fetch fails", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ themes: [{ id: "123", role: "main" }] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });

      const result = await checkThemeExtensionEnabled({
        shop: "test-shop.myshopify.com",
        accessToken: "test-token",
      });

      expect(result).toBe(false);
    });

    it("should return true when app embed is enabled by extension UID", async () => {
      const settingsData = {
        current: {
          blocks: {
            "block1": {
              // Real extension UID from shopify.extension.toml
              type: "shopify://apps/my-app/blocks/popup-embed/725cd6d8-2f2b-91cb-b1be-3983c340fe6376935e80",
              disabled: false,
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ themes: [{ id: "123", role: "main" }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            asset: { value: JSON.stringify(settingsData) },
          }),
        });

      const result = await checkThemeExtensionEnabled({
        shop: "test-shop.myshopify.com",
        accessToken: "test-token",
      });

      expect(result).toBe(true);
    });

    it("should return true when app embed is enabled by block handle", async () => {
      const settingsData = {
        current: {
          blocks: {
            "block1": {
              type: "shopify://apps/some-app-name/blocks/popup-embed/some-uid",
              disabled: false,
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ themes: [{ id: "123", role: "main" }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            asset: { value: JSON.stringify(settingsData) },
          }),
        });

      const result = await checkThemeExtensionEnabled({
        shop: "test-shop.myshopify.com",
        accessToken: "test-token",
      });

      expect(result).toBe(true);
    });

    it("should return true when app embed is enabled by app name", async () => {
      const settingsData = {
        current: {
          blocks: {
            "block1": {
              type: "shopify://apps/revenue-boost/blocks/other-block/some-uid",
              disabled: false,
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ themes: [{ id: "123", role: "main" }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            asset: { value: JSON.stringify(settingsData) },
          }),
        });

      const result = await checkThemeExtensionEnabled({
        shop: "test-shop.myshopify.com",
        accessToken: "test-token",
      });

      expect(result).toBe(true);
    });

    it("should return false when app embed is disabled", async () => {
      const settingsData = {
        current: {
          blocks: {
            "block1": {
              type: "shopify://apps/revenue-boost/blocks/popup-embed/725cd6d8-2f2b-91cb-b1be-3983c340fe6376935e80",
              disabled: true,
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ themes: [{ id: "123", role: "main" }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            asset: { value: JSON.stringify(settingsData) },
          }),
        });

      const result = await checkThemeExtensionEnabled({
        shop: "test-shop.myshopify.com",
        accessToken: "test-token",
      });

      expect(result).toBe(false);
    });

    it("should return true when disabled is undefined (default enabled state)", async () => {
      const settingsData = {
        current: {
          blocks: {
            "block1": {
              type: "shopify://apps/revenue-boost/blocks/popup-embed/some-uid",
              // disabled is undefined - means enabled per Shopify docs
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ themes: [{ id: "123", role: "main" }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            asset: { value: JSON.stringify(settingsData) },
          }),
        });

      const result = await checkThemeExtensionEnabled({
        shop: "test-shop.myshopify.com",
        accessToken: "test-token",
      });

      expect(result).toBe(true);
    });

    it("should return false when no blocks exist", async () => {
      const settingsData = {
        current: {
          blocks: {},
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ themes: [{ id: "123", role: "main" }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            asset: { value: JSON.stringify(settingsData) },
          }),
        });

      const result = await checkThemeExtensionEnabled({
        shop: "test-shop.myshopify.com",
        accessToken: "test-token",
      });

      expect(result).toBe(false);
    });

    it("should return false when only other apps are enabled", async () => {
      const settingsData = {
        current: {
          blocks: {
            "block1": {
              type: "shopify://apps/other-app/blocks/some-block/some-uid",
              disabled: false,
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ themes: [{ id: "123", role: "main" }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            asset: { value: JSON.stringify(settingsData) },
          }),
        });

      const result = await checkThemeExtensionEnabled({
        shop: "test-shop.myshopify.com",
        accessToken: "test-token",
      });

      expect(result).toBe(false);
    });
  });

  describe("checkCustomProxyUrl", () => {
    it("should return null when metafield is not set", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          json: async () => ({
            data: { shop: { metafield: null } },
          }),
        }),
      };

      const result = await checkCustomProxyUrl(mockAdmin);
      expect(result).toBeNull();
    });

    it("should return custom URL when metafield is set", async () => {
      const mockAdmin = {
        graphql: vi.fn().mockResolvedValue({
          json: async () => ({
            data: {
              shop: {
                metafield: { value: "https://custom-proxy.example.com" },
              },
            },
          }),
        }),
      };

      const result = await checkCustomProxyUrl(mockAdmin);
      expect(result).toBe("https://custom-proxy.example.com");
    });
  });

  describe("checkAppProxyReachable", () => {
    it("should return false when no app URL configured", async () => {
      const originalEnv = process.env.SHOPIFY_APP_URL;
      delete process.env.SHOPIFY_APP_URL;

      const result = await checkAppProxyReachable("test-shop.myshopify.com", null);
      expect(result).toBe(false);

      process.env.SHOPIFY_APP_URL = originalEnv;
    });
  });
});

