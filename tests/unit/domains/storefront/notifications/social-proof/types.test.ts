/**
 * Unit Tests for Social Proof Types
 */

import { describe, it, expect } from "vitest";

import {
  DEFAULT_SOCIAL_PROOF_CONFIG,
  type SocialProofConfig,
  type PurchaseNotification,
  type VisitorNotification,
  type ReviewNotification,
} from "~/domains/storefront/notifications/social-proof/types";

describe("Social Proof Types", () => {
  describe("DEFAULT_SOCIAL_PROOF_CONFIG", () => {
    it("should have notification types enabled by default", () => {
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.enablePurchaseNotifications).toBe(true);
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.enableVisitorNotifications).toBe(true);
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.enableReviewNotifications).toBe(true);
    });

    it("should have default display settings", () => {
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.position).toBe("bottom-left");
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.displayDuration).toBe(5);
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.rotationInterval).toBe(8);
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.maxNotificationsPerSession).toBe(5);
    });

    it("should have default data settings", () => {
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.purchaseLookbackHours).toBe(48);
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.minVisitorCount).toBe(5);
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.minReviewRating).toBe(4.0);
    });

    it("should have default privacy settings", () => {
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.anonymizeCustomerNames).toBe(true);
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.showCustomerLocation).toBe(true);
    });

    it("should have default design settings", () => {
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.backgroundColor).toBe("#FFFFFF");
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.textColor).toBe("#1A1A1A");
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.accentColor).toBe("#10B981");
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.showIcons).toBe(true);
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.showVerifiedBadge).toBe(true);
    });

    it("should have enhanced color properties", () => {
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.notificationBackgroundColor).toBe("#F9FAFB");
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.timestampColor).toBe("#6B7280");
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.actionTextColor).toBe("#059669");
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.customerNameColor).toBe("#1F2937");
      expect(DEFAULT_SOCIAL_PROOF_CONFIG.productNameColor).toBe("#3B82F6");
    });
  });

  describe("Type Structures", () => {
    it("should allow valid PurchaseNotification", () => {
      const notification: PurchaseNotification = {
        id: "1",
        type: "purchase",
        timestamp: Date.now(),
        customerName: "John D.",
        location: "New York, NY",
        productName: "Classic T-Shirt",
        timeAgo: "2 minutes ago",
        verified: true,
      };

      expect(notification.type).toBe("purchase");
      expect(notification.customerName).toBeDefined();
      expect(notification.productName).toBeDefined();
    });

    it("should allow valid VisitorNotification", () => {
      const notification: VisitorNotification = {
        id: "2",
        type: "visitor",
        timestamp: Date.now(),
        count: 23,
        context: "viewing this product",
        trending: true,
      };

      expect(notification.type).toBe("visitor");
      expect(notification.count).toBe(23);
      expect(notification.trending).toBe(true);
    });

    it("should allow valid ReviewNotification", () => {
      const notification: ReviewNotification = {
        id: "3",
        type: "review",
        timestamp: Date.now(),
        rating: 4.8,
        reviewCount: 1234,
        recentReview: {
          text: "Love this product!",
          author: "Sarah M.",
          verified: true,
        },
      };

      expect(notification.type).toBe("review");
      expect(notification.rating).toBe(4.8);
      expect(notification.recentReview?.text).toBe("Love this product!");
    });

    it("should allow partial SocialProofConfig", () => {
      const config: Partial<SocialProofConfig> = {
        enablePurchaseNotifications: true,
        position: "bottom-right",
      };

      expect(config.enablePurchaseNotifications).toBe(true);
      expect(config.position).toBe("bottom-right");
    });
  });
});

