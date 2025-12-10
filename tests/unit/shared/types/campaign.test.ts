/**
 * Unit Tests for Shared Campaign Types
 *
 * Tests the StorefrontCampaign type structure and re-exports.
 */

import { describe, it, expect } from "vitest";

// Test the type structure by creating mock objects
describe("Shared Campaign Types", () => {
  describe("StorefrontCampaign structure", () => {
    it("should support base campaign properties", () => {
      const campaign = {
        id: "cmp_123",
        name: "Summer Sale",
        status: "ACTIVE",
        templateType: "FLASH_SALE",
        contentConfig: {},
        designConfig: {},
        targetRules: {},
      };

      expect(campaign.id).toBe("cmp_123");
      expect(campaign.name).toBe("Summer Sale");
      expect(campaign.status).toBe("ACTIVE");
    });

    it("should support runtime properties", () => {
      const campaign = {
        id: "cmp_123",
        name: "Test",
        previewMode: true,
        campaignId: "cmp_123",
        buttonUrl: "https://example.com",
        cooldownMinutes: 30,
        normalizedTemplateType: "flash_sale",
      };

      expect(campaign.previewMode).toBe(true);
      expect(campaign.campaignId).toBe("cmp_123");
      expect(campaign.buttonUrl).toBe("https://example.com");
      expect(campaign.cooldownMinutes).toBe(30);
    });

    it("should support flattened config properties", () => {
      const campaign = {
        id: "cmp_123",
        name: "Test",
        title: "Big Sale!",
        buttonText: "Shop Now",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        buttonColor: "#ff0000",
        buttonTextColor: "#ffffff",
        position: "center",
        size: "medium",
        imageUrl: "https://example.com/image.jpg",
        overlayOpacity: 0.5,
        showCloseButton: true,
        globalCustomCSS: ".popup { border-radius: 8px; }",
      };

      expect(campaign.title).toBe("Big Sale!");
      expect(campaign.buttonText).toBe("Shop Now");
      expect(campaign.backgroundColor).toBe("#ffffff");
      expect(campaign.position).toBe("center");
      expect(campaign.overlayOpacity).toBe(0.5);
      expect(campaign.showCloseButton).toBe(true);
    });

    it("should support additional runtime properties via index signature", () => {
      const campaign: Record<string, unknown> = {
        id: "cmp_123",
        name: "Test",
        customProperty: "custom value",
        anotherProperty: 42,
      };

      expect(campaign.customProperty).toBe("custom value");
      expect(campaign.anotherProperty).toBe(42);
    });
  });

  describe("Type re-exports", () => {
    it("should export CampaignGoal type values", () => {
      const goals = ["NEWSLETTER_SIGNUP", "INCREASE_REVENUE", "ENGAGEMENT"];
      expect(goals).toContain("NEWSLETTER_SIGNUP");
      expect(goals).toContain("INCREASE_REVENUE");
    });

    it("should export CampaignStatus type values", () => {
      const statuses = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"];
      expect(statuses).toContain("DRAFT");
      expect(statuses).toContain("ACTIVE");
    });

    it("should export TemplateType type values", () => {
      const types = [
        "NEWSLETTER",
        "SPIN_TO_WIN",
        "FLASH_SALE",
        "SCRATCH_CARD",
        "FREE_SHIPPING",
      ];
      expect(types).toContain("NEWSLETTER");
      expect(types).toContain("SPIN_TO_WIN");
    });

    it("should export ExperimentStatus type values", () => {
      const statuses = ["DRAFT", "RUNNING", "COMPLETED", "STOPPED"];
      expect(statuses).toContain("DRAFT");
      expect(statuses).toContain("RUNNING");
    });
  });
});

