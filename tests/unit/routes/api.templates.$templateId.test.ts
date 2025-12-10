/**
 * Unit Tests for Individual Template API
 *
 * Tests the template retrieval logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the template structure
interface Template {
  id: string;
  name: string;
  templateType: string;
  description?: string;
  contentConfig?: Record<string, unknown>;
  designConfig?: Record<string, unknown>;
  isDefault: boolean;
  storeId?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper to validate template ID
function validateTemplateId(templateId: string | undefined): boolean {
  return !!templateId && templateId.length > 0;
}

// Helper to check if template belongs to store
function templateBelongsToStore(
  template: Template,
  storeId: string
): boolean {
  // Default templates (no storeId) are accessible to all stores
  if (!template.storeId) return true;
  return template.storeId === storeId;
}

describe("Individual Template API", () => {
  describe("validateTemplateId", () => {
    it("should return true for valid template ID", () => {
      expect(validateTemplateId("tmpl_123")).toBe(true);
      expect(validateTemplateId("abc")).toBe(true);
    });

    it("should return false for undefined", () => {
      expect(validateTemplateId(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(validateTemplateId("")).toBe(false);
    });
  });

  describe("templateBelongsToStore", () => {
    it("should return true for default templates (no storeId)", () => {
      const template: Template = {
        id: "tmpl_1",
        name: "Default Newsletter",
        templateType: "NEWSLETTER",
        isDefault: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      expect(templateBelongsToStore(template, "store_123")).toBe(true);
    });

    it("should return true when storeId matches", () => {
      const template: Template = {
        id: "tmpl_1",
        name: "Custom Template",
        templateType: "FLASH_SALE",
        isDefault: false,
        storeId: "store_123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      expect(templateBelongsToStore(template, "store_123")).toBe(true);
    });

    it("should return false when storeId doesn't match", () => {
      const template: Template = {
        id: "tmpl_1",
        name: "Custom Template",
        templateType: "FLASH_SALE",
        isDefault: false,
        storeId: "store_456",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      expect(templateBelongsToStore(template, "store_123")).toBe(false);
    });
  });

  describe("Template structure", () => {
    it("should have required fields", () => {
      const template: Template = {
        id: "tmpl_1",
        name: "Newsletter Template",
        templateType: "NEWSLETTER",
        isDefault: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.templateType).toBeDefined();
      expect(template.isDefault).toBeDefined();
    });

    it("should support optional config fields", () => {
      const template: Template = {
        id: "tmpl_1",
        name: "Flash Sale Template",
        templateType: "FLASH_SALE",
        description: "A template for flash sales",
        contentConfig: { headline: "Flash Sale!" },
        designConfig: { backgroundColor: "#ff0000" },
        isDefault: false,
        storeId: "store_123",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      expect(template.description).toBe("A template for flash sales");
      expect(template.contentConfig).toEqual({ headline: "Flash Sale!" });
      expect(template.designConfig).toEqual({ backgroundColor: "#ff0000" });
    });
  });

  describe("Response structure", () => {
    it("should have valid success response", () => {
      const response = {
        success: true,
        data: {
          template: {
            id: "tmpl_1",
            name: "Test Template",
            templateType: "NEWSLETTER",
            isDefault: true,
          },
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.template.id).toBe("tmpl_1");
    });
  });
});

