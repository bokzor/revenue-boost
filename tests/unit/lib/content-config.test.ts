/**
 * Unit Tests for Content Configuration
 */

import { describe, it, expect } from "vitest";

import { TEMPLATE_SECTIONS } from "~/lib/content-config";
import type { FieldType, TemplateSection, ContentFieldDefinition } from "~/lib/content-config";

describe("FieldType", () => {
  it("should support expected field types", () => {
    const fieldTypes: FieldType[] = [
      "text",
      "textarea",
      "color",
      "image",
      "layout",
      "animation",
      "typography",
      "boolean",
      "number",
      "product",
      "select",
      "email",
      "discount",
      "prize-list",
      "color-list",
      "product-picker",
      "collection-picker",
    ];

    // Type check - if this compiles, the types are correct
    expect(fieldTypes.length).toBeGreaterThan(0);
  });
});

describe("TemplateSection", () => {
  it("should support expected sections", () => {
    const sections: TemplateSection[] = [
      "content",
      "design",
      "theme",
      "layout",
      "positioning",
      "behavior",
      "products",
      "advanced",
    ];

    expect(sections.length).toBe(8);
  });
});

describe("TEMPLATE_SECTIONS", () => {
  it("should have metadata for all sections", () => {
    expect(TEMPLATE_SECTIONS.content).toBeDefined();
    expect(TEMPLATE_SECTIONS.design).toBeDefined();
    expect(TEMPLATE_SECTIONS.theme).toBeDefined();
    expect(TEMPLATE_SECTIONS.layout).toBeDefined();
    expect(TEMPLATE_SECTIONS.positioning).toBeDefined();
    expect(TEMPLATE_SECTIONS.behavior).toBeDefined();
    expect(TEMPLATE_SECTIONS.products).toBeDefined();
    expect(TEMPLATE_SECTIONS.advanced).toBeDefined();
  });

  it("should have required properties for each section", () => {
    for (const [key, section] of Object.entries(TEMPLATE_SECTIONS)) {
      expect(section.title).toBeDefined();
      expect(section.icon).toBeDefined();
      expect(typeof section.defaultOpen).toBe("boolean");
    }
  });

  it("should have content section open by default", () => {
    expect(TEMPLATE_SECTIONS.content.defaultOpen).toBe(true);
  });

  it("should have advanced section closed by default", () => {
    expect(TEMPLATE_SECTIONS.advanced.defaultOpen).toBe(false);
  });
});

describe("ContentFieldDefinition", () => {
  it("should support field definition structure", () => {
    const field: ContentFieldDefinition = {
      id: "headline",
      type: "text",
      label: "Headline",
      description: "Main headline text",
      defaultValue: "Welcome!",
      validation: {
        required: true,
        minLength: 1,
        maxLength: 100,
      },
      section: "content",
      placeholder: "Enter headline...",
    };

    expect(field.id).toBe("headline");
    expect(field.type).toBe("text");
    expect(field.validation?.required).toBe(true);
  });

  it("should support field conditions", () => {
    const field: ContentFieldDefinition = {
      id: "discountValue",
      type: "number",
      label: "Discount Value",
      conditions: [
        { field: "discountEnabled", operator: "equals", value: true },
      ],
    };

    expect(field.conditions).toHaveLength(1);
    expect(field.conditions![0].operator).toBe("equals");
  });
});

