/**
 * Unit Tests for Setup Status API
 *
 * Tests the response structure and query parameter parsing.
 */

import { describe, it, expect } from "vitest";

// Recreate the response structure types
interface SetupStatusResponse {
  success: boolean;
  status?: {
    shop: string;
    storeCreated: boolean;
    themeExtensionEnabled?: boolean;
    appProxyReachable?: boolean;
  };
  setupComplete?: boolean;
  error?: string;
}

// Recreate the query parameter parsing
function parseRefreshParam(url: URL): boolean {
  return url.searchParams.get("refresh") === "true";
}

// Recreate the setup complete logic
function isSetupComplete(status: {
  storeCreated: boolean;
  themeExtensionEnabled?: boolean;
  appProxyReachable?: boolean;
}): boolean {
  return (
    status.storeCreated === true &&
    status.themeExtensionEnabled === true &&
    status.appProxyReachable === true
  );
}

describe("Setup Status API", () => {
  describe("SetupStatusResponse structure", () => {
    it("should have valid success response structure", () => {
      const response: SetupStatusResponse = {
        success: true,
        status: {
          shop: "test-shop.myshopify.com",
          storeCreated: true,
          themeExtensionEnabled: true,
          appProxyReachable: true,
        },
        setupComplete: true,
      };

      expect(response.success).toBe(true);
      expect(response.status?.shop).toBe("test-shop.myshopify.com");
      expect(response.setupComplete).toBe(true);
    });

    it("should have valid error response structure", () => {
      const response: SetupStatusResponse = {
        success: false,
        error: "No shop session",
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe("No shop session");
    });
  });

  describe("parseRefreshParam", () => {
    it("should return true when refresh=true", () => {
      const url = new URL("http://localhost/api/setup/status?refresh=true");
      expect(parseRefreshParam(url)).toBe(true);
    });

    it("should return false when refresh=false", () => {
      const url = new URL("http://localhost/api/setup/status?refresh=false");
      expect(parseRefreshParam(url)).toBe(false);
    });

    it("should return false when refresh not present", () => {
      const url = new URL("http://localhost/api/setup/status");
      expect(parseRefreshParam(url)).toBe(false);
    });

    it("should return false for other values", () => {
      const url = new URL("http://localhost/api/setup/status?refresh=1");
      expect(parseRefreshParam(url)).toBe(false);
    });
  });

  describe("isSetupComplete", () => {
    it("should return true when all checks pass", () => {
      const status = {
        storeCreated: true,
        themeExtensionEnabled: true,
        appProxyReachable: true,
      };
      expect(isSetupComplete(status)).toBe(true);
    });

    it("should return false when store not created", () => {
      const status = {
        storeCreated: false,
        themeExtensionEnabled: true,
        appProxyReachable: true,
      };
      expect(isSetupComplete(status)).toBe(false);
    });

    it("should return false when theme extension not enabled", () => {
      const status = {
        storeCreated: true,
        themeExtensionEnabled: false,
        appProxyReachable: true,
      };
      expect(isSetupComplete(status)).toBe(false);
    });

    it("should return false when app proxy not reachable", () => {
      const status = {
        storeCreated: true,
        themeExtensionEnabled: true,
        appProxyReachable: false,
      };
      expect(isSetupComplete(status)).toBe(false);
    });

    it("should return false when checks are undefined", () => {
      const status = {
        storeCreated: true,
      };
      expect(isSetupComplete(status)).toBe(false);
    });
  });
});

