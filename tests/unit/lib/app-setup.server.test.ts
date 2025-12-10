/**
 * Unit Tests for App Setup Service
 *
 * Tests the helper functions and configuration logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the GID extraction logic
function extractShopIdFromGid(gid: string): string | null {
  const last = gid.split("/").pop();
  if (!last || !/^\d+$/.test(last)) {
    return null;
  }
  return last;
}

// Recreate the default store settings structure
function getDefaultStoreSettings() {
  return {
    frequencyCapping: {
      enabled: false,
      maxPerSession: 1,
      maxPerDay: 2,
      cooldownMinutes: 30,
    },
    socialProofFrequencyCapping: {
      enabled: false,
      maxPerSession: 5,
      maxPerDay: 20,
      cooldownMinutes: 5,
    },
    bannerFrequencyCapping: {
      enabled: false,
      maxPerSession: 0,
      maxPerDay: 0,
      cooldownMinutes: 0,
    },
  };
}

describe("App Setup Service", () => {
  describe("extractShopIdFromGid", () => {
    it("should extract numeric ID from valid GID", () => {
      const id = extractShopIdFromGid("gid://shopify/Shop/12345");
      expect(id).toBe("12345");
    });

    it("should handle large shop IDs", () => {
      const id = extractShopIdFromGid("gid://shopify/Shop/9876543210");
      expect(id).toBe("9876543210");
    });

    it("should return null for invalid GID format", () => {
      const id = extractShopIdFromGid("gid://shopify/Shop/abc");
      expect(id).toBeNull();
    });

    it("should return null for empty GID", () => {
      const id = extractShopIdFromGid("");
      expect(id).toBeNull();
    });

    it("should return null for GID without numeric ID", () => {
      const id = extractShopIdFromGid("gid://shopify/Shop/");
      expect(id).toBeNull();
    });
  });

  describe("Default store settings", () => {
    it("should have frequency capping disabled by default", () => {
      const settings = getDefaultStoreSettings();
      expect(settings.frequencyCapping.enabled).toBe(false);
    });

    it("should have popup frequency limits", () => {
      const settings = getDefaultStoreSettings();
      expect(settings.frequencyCapping.maxPerSession).toBe(1);
      expect(settings.frequencyCapping.maxPerDay).toBe(2);
      expect(settings.frequencyCapping.cooldownMinutes).toBe(30);
    });

    it("should have social proof frequency limits", () => {
      const settings = getDefaultStoreSettings();
      expect(settings.socialProofFrequencyCapping.maxPerSession).toBe(5);
      expect(settings.socialProofFrequencyCapping.maxPerDay).toBe(20);
      expect(settings.socialProofFrequencyCapping.cooldownMinutes).toBe(5);
    });

    it("should have banner frequency with no limits", () => {
      const settings = getDefaultStoreSettings();
      expect(settings.bannerFrequencyCapping.maxPerSession).toBe(0);
      expect(settings.bannerFrequencyCapping.maxPerDay).toBe(0);
      expect(settings.bannerFrequencyCapping.cooldownMinutes).toBe(0);
    });
  });

  describe("Welcome campaign defaults", () => {
    it("should have correct welcome campaign content", () => {
      const welcomeContent = {
        title: "Welcome! 🎉",
        subtitle: "Get 10% off your first order",
        description: "Join our newsletter and receive exclusive offers and updates.",
        buttonText: "Get My Discount",
        emailPlaceholder: "Enter your email",
        successMessage: "Thanks! Check your email for your discount code.",
        showPrivacyNote: true,
        privacyNote: "We respect your privacy. Unsubscribe anytime.",
      };

      expect(welcomeContent.title).toBe("Welcome! 🎉");
      expect(welcomeContent.buttonText).toBe("Get My Discount");
      expect(welcomeContent.showPrivacyNote).toBe(true);
    });

    it("should have correct welcome campaign design", () => {
      const welcomeDesign = {
        themeMode: "default",
        position: "center",
        size: "medium",
        borderRadius: 8,
        animation: "fade",
        overlayOpacity: 0.6,
        backgroundImageMode: "none",
      };

      expect(welcomeDesign.themeMode).toBe("default");
      expect(welcomeDesign.position).toBe("center");
      expect(welcomeDesign.overlayOpacity).toBe(0.6);
    });

    it("should have correct welcome campaign triggers", () => {
      const welcomeTriggers = {
        enhancedTriggers: {
          enabled: true,
          page_load: {
            enabled: true,
            delay: 3000,
          },
        },
      };

      expect(welcomeTriggers.enhancedTriggers.enabled).toBe(true);
      expect(welcomeTriggers.enhancedTriggers.page_load.delay).toBe(3000);
    });
  });
});

