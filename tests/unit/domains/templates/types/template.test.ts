/**
 * Unit Tests for Template Types
 *
 * Tests the template domain types and schemas.
 */

import { describe, it, expect } from "vitest";

import {
  TemplateFieldSchema,
  BaseTemplateSchema,
  TemplateWithConfigsSchema,
  TemplateCreateDataSchema,
  TemplateUpdateDataSchema,
  getTemplateContentSchema,
  parseTemplateContentConfig,
  getTemplateSchemaForType,
} from "~/domains/templates/types/template";

describe("Template Types", () => {
  describe("TemplateFieldSchema", () => {
    it("should validate a valid template field", () => {
      const field = {
        id: "headline",
        type: "text",
        label: "Headline",
        description: "Main headline text",
        defaultValue: "Welcome!",
        category: "content",
        section: "content",
      };

      const result = TemplateFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("should accept all valid field types", () => {
      const types = [
        "text", "textarea", "color", "image", "layout", "animation",
        "typography", "boolean", "number", "product", "select", "email",
        "discount", "prize-list", "color-list", "product-picker", "collection-picker",
      ];

      types.forEach((type) => {
        const field = {
          id: "test",
          type,
          label: "Test",
          category: "content",
        };
        const result = TemplateFieldSchema.safeParse(field);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid field type", () => {
      const field = {
        id: "test",
        type: "invalid",
        label: "Test",
        category: "content",
      };

      const result = TemplateFieldSchema.safeParse(field);
      expect(result.success).toBe(false);
    });

    it("should accept field with validation rules", () => {
      const field = {
        id: "email",
        type: "email",
        label: "Email",
        category: "content",
        validation: {
          required: true,
          minLength: 5,
          maxLength: 100,
          pattern: "^[a-z]+$",
        },
      };

      const result = TemplateFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });

    it("should accept field with options", () => {
      const field = {
        id: "size",
        type: "select",
        label: "Size",
        category: "design",
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium", description: "Default size" },
          { value: "large", label: "Large" },
        ],
      };

      const result = TemplateFieldSchema.safeParse(field);
      expect(result.success).toBe(true);
    });
  });

  describe("TemplateCreateDataSchema", () => {
    it("should validate valid create data", () => {
      const data = {
        templateType: "NEWSLETTER",
        name: "My Newsletter Template",
        description: "A custom newsletter template",
        category: "popup",
        goals: ["NEWSLETTER_SIGNUP"],
      };

      const result = TemplateCreateDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should require at least one goal", () => {
      const data = {
        templateType: "NEWSLETTER",
        name: "My Template",
        description: "Description",
        category: "popup",
        goals: [],
      };

      const result = TemplateCreateDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should require name", () => {
      const data = {
        templateType: "NEWSLETTER",
        name: "",
        description: "Description",
        category: "popup",
        goals: ["NEWSLETTER_SIGNUP"],
      };

      const result = TemplateCreateDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("getTemplateContentSchema", () => {
    it("should return schema for NEWSLETTER", () => {
      const schema = getTemplateContentSchema("NEWSLETTER");
      expect(schema).toBeDefined();
    });

    it("should return schema for SPIN_TO_WIN", () => {
      const schema = getTemplateContentSchema("SPIN_TO_WIN");
      expect(schema).toBeDefined();
    });

    it("should return base schema for undefined type", () => {
      const schema = getTemplateContentSchema(undefined);
      expect(schema).toBeDefined();
    });
  });

  describe("parseTemplateContentConfig", () => {
    it("should parse valid JSON object", () => {
      const result = parseTemplateContentConfig({ headline: "Test" }, "NEWSLETTER");
      expect(result).toBeDefined();
    });

    it("should parse JSON string", () => {
      const result = parseTemplateContentConfig('{"headline": "Test"}', "NEWSLETTER");
      expect(result).toBeDefined();
    });

    it("should return empty object for null", () => {
      const result = parseTemplateContentConfig(null, "NEWSLETTER");
      expect(result).toEqual({});
    });

    it("should return empty object for undefined", () => {
      const result = parseTemplateContentConfig(undefined, "NEWSLETTER");
      expect(result).toEqual({});
    });
  });

  describe("getTemplateSchemaForType", () => {
    it("should return TemplateWithConfigsSchema for any type", () => {
      const schema = getTemplateSchemaForType("NEWSLETTER");
      expect(schema).toBe(TemplateWithConfigsSchema);
    });
  });
});

