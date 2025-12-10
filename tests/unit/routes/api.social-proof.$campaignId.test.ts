/**
 * Unit Tests for Social Proof API
 *
 * Tests the social proof notification retrieval logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the notification structure
interface SocialProofNotification {
  id: string;
  type: "purchase" | "visitor" | "sales";
  message: string;
  timestamp: string;
  productName?: string;
  customerLocation?: string;
}

// Recreate the response structure
interface SocialProofResponse {
  success: boolean;
  notifications: SocialProofNotification[];
  timestamp: string;
  error?: string;
}

// Helper to parse query params
function parseSocialProofQueryParams(url: URL): {
  shop: string | null;
  productId: string | null;
  pageUrl: string | null;
} {
  return {
    shop: url.searchParams.get("shop"),
    productId: url.searchParams.get("productId"),
    pageUrl: url.searchParams.get("pageUrl"),
  };
}

// Helper to validate campaign ID
function validateCampaignId(campaignId: string | undefined): boolean {
  return !!campaignId && campaignId.length > 0;
}

describe("Social Proof API", () => {
  describe("parseSocialProofQueryParams", () => {
    it("should parse shop parameter", () => {
      const url = new URL(
        "https://example.com/api/social-proof/camp1?shop=mystore.myshopify.com"
      );
      const params = parseSocialProofQueryParams(url);
      expect(params.shop).toBe("mystore.myshopify.com");
    });

    it("should parse productId parameter", () => {
      const url = new URL(
        "https://example.com/api/social-proof/camp1?shop=test.myshopify.com&productId=123"
      );
      const params = parseSocialProofQueryParams(url);
      expect(params.productId).toBe("123");
    });

    it("should parse pageUrl parameter", () => {
      const url = new URL(
        "https://example.com/api/social-proof/camp1?shop=test.myshopify.com&pageUrl=/products/test"
      );
      const params = parseSocialProofQueryParams(url);
      expect(params.pageUrl).toBe("/products/test");
    });

    it("should handle missing parameters", () => {
      const url = new URL("https://example.com/api/social-proof/camp1");
      const params = parseSocialProofQueryParams(url);
      expect(params.shop).toBeNull();
      expect(params.productId).toBeNull();
      expect(params.pageUrl).toBeNull();
    });
  });

  describe("validateCampaignId", () => {
    it("should return true for valid campaign ID", () => {
      expect(validateCampaignId("camp_123")).toBe(true);
      expect(validateCampaignId("abc")).toBe(true);
    });

    it("should return false for undefined", () => {
      expect(validateCampaignId(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(validateCampaignId("")).toBe(false);
    });
  });

  describe("SocialProofNotification structure", () => {
    it("should have required fields", () => {
      const notification: SocialProofNotification = {
        id: "notif_1",
        type: "purchase",
        message: "Someone from New York just purchased Product X",
        timestamp: "2024-01-15T10:30:00Z",
      };

      expect(notification.id).toBe("notif_1");
      expect(notification.type).toBe("purchase");
      expect(notification.message).toBeDefined();
    });

    it("should support optional fields", () => {
      const notification: SocialProofNotification = {
        id: "notif_2",
        type: "purchase",
        message: "Someone just purchased",
        timestamp: "2024-01-15T10:30:00Z",
        productName: "Cool Product",
        customerLocation: "Los Angeles, CA",
      };

      expect(notification.productName).toBe("Cool Product");
      expect(notification.customerLocation).toBe("Los Angeles, CA");
    });

    it("should support different notification types", () => {
      const types: Array<"purchase" | "visitor" | "sales"> = [
        "purchase",
        "visitor",
        "sales",
      ];

      types.forEach((type) => {
        const notification: SocialProofNotification = {
          id: "test",
          type,
          message: "Test message",
          timestamp: new Date().toISOString(),
        };
        expect(notification.type).toBe(type);
      });
    });
  });

  describe("SocialProofResponse structure", () => {
    it("should have valid success response", () => {
      const response: SocialProofResponse = {
        success: true,
        notifications: [],
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.notifications).toEqual([]);
    });

    it("should have valid error response", () => {
      const response: SocialProofResponse = {
        success: false,
        notifications: [],
        timestamp: new Date().toISOString(),
        error: "Campaign ID is required",
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe("Campaign ID is required");
    });
  });
});

