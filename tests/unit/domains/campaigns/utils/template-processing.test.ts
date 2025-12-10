/**
 * Unit Tests for Template Processing
 */

import { describe, it, expect } from "vitest";

import {
  safeParseJSON,
  processTemplate,
  processTemplates,
} from "~/domains/campaigns/utils/template-processing";
import { DesignConfigSchema } from "~/domains/campaigns/types/campaign";
import type { TemplateWithConfigs } from "~/domains/templates/types/template";

describe("safeParseJSON", () => {
  it("should parse valid JSON string", () => {
    const result = safeParseJSON('{"key": "value"}');
    expect(result).toEqual({ key: "value" });
  });

  it("should return object as-is", () => {
    const obj = { key: "value" };
    const result = safeParseJSON(obj);
    expect(result).toEqual(obj);
  });

  it("should return fallback for invalid JSON", () => {
    const result = safeParseJSON("invalid json", { default: true });
    expect(result).toEqual({ default: true });
  });

  it("should return fallback for null", () => {
    const result = safeParseJSON(null, { default: true });
    expect(result).toEqual({ default: true });
  });

  it("should return fallback for undefined", () => {
    const result = safeParseJSON(undefined, { default: true });
    expect(result).toEqual({ default: true });
  });
});

describe("processTemplate", () => {
  const mockTemplate: TemplateWithConfigs = {
    id: "template-1",
    storeId: null,
    name: "Test Template",
    templateType: "NEWSLETTER",
    category: "popup",
    description: "A test template",
    isDefault: false,
    isActive: true,
    preview: "/preview.png",
    priority: 15,
    conversionRate: 5.5,
    contentConfig: { headline: "Welcome!" },
    designConfig: DesignConfigSchema.parse({
      backgroundColor: "#FF0000",
      textColor: "#FFFFFF",
      buttonColor: "#00FF00",
    }),
    fields: [],
    goals: ["NEWSLETTER_SIGNUP"],
    createdAt: new Date(),
    updatedAt: new Date(),
    icon: null,
  };

  it("should process template with all fields", () => {
    const result = processTemplate(mockTemplate);

    expect(result.templateId).toBe("template-1");
    expect(result.name).toBe("Test Template");
    expect(result.category).toBe("popup");
    expect(result.description).toBe("A test template");
    expect(result.preview).toBe("/preview.png");
    expect(result.isPopular).toBe(true); // priority > 10
    expect(result.conversionRate).toBe(5.5);
  });

  it("should extract content config fields", () => {
    const result = processTemplate(mockTemplate);

    expect(result.title).toBe("Welcome!");
  });

  it("should extract design config fields", () => {
    const result = processTemplate(mockTemplate);

    expect(result.backgroundColor).toBe("#FF0000");
    expect(result.textColor).toBe("#FFFFFF");
    expect(result.buttonColor).toBe("#00FF00");
  });

  it("should use defaults for missing fields", () => {
    const minimalTemplate: TemplateWithConfigs = {
      ...mockTemplate,
      contentConfig: {},
      designConfig: DesignConfigSchema.parse({}),
    };

    const result = processTemplate(minimalTemplate);

    expect(result.title).toBe("Test Template"); // Falls back to name
    expect(result.buttonText).toBe("Get Started");
    expect(result.backgroundColor).toBe("#FFFFFF");
    expect(result.position).toBe("center");
    expect(result.size).toBe("medium");
    expect(result.showCloseButton).toBe(true);
    expect(result.overlayOpacity).toBe(0.6);
  });

  it("should use default preview for missing preview", () => {
    const templateWithoutPreview: TemplateWithConfigs = {
      ...mockTemplate,
      preview: null,
    };

    const result = processTemplate(templateWithoutPreview);

    expect(result.preview).toBe("/templates/default-preview.png");
  });
});

describe("processTemplates", () => {
  const mockTemplates: TemplateWithConfigs[] = [
    {
      id: "template-1",
      storeId: null,
      name: "Template 1",
      templateType: "NEWSLETTER",
      category: "popup",
      description: "",
      preview: null,
      isDefault: false,
      isActive: true,
      priority: 5,
      conversionRate: null,
      contentConfig: {},
      designConfig: DesignConfigSchema.parse({}),
      fields: [],
      goals: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      icon: null,
    },
    {
      id: "template-2",
      storeId: null,
      name: "Template 2",
      templateType: "SPIN_TO_WIN",
      category: "gamification",
      description: "",
      preview: null,
      isDefault: false,
      isActive: true,
      priority: 20,
      conversionRate: null,
      contentConfig: {},
      designConfig: DesignConfigSchema.parse({}),
      fields: [],
      goals: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      icon: null,
    },
  ];

  it("should process all templates", () => {
    const result = processTemplates(mockTemplates);

    expect(result).toHaveLength(2);
    expect(result[0].processedTemplate.name).toBe("Template 1");
    expect(result[1].processedTemplate.name).toBe("Template 2");
  });

  it("should include original template", () => {
    const result = processTemplates(mockTemplates);

    expect(result[0].originalTemplate).toBe(mockTemplates[0]);
  });
});
