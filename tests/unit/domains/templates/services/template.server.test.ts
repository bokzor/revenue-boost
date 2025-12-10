/**
 * Unit Tests for Template Service
 *
 * Tests template CRUD operations:
 * - getAllTemplates
 * - getTemplateById
 * - getTemplatesByType
 * - createTemplate
 * - getDefaultTemplate
 * - Template caching
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("~/db.server", () => ({
  default: {
    template: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock PlanGuardService
vi.mock("~/domains/billing/services/plan-guard.server", () => ({
  PlanGuardService: {
    assertFeatureEnabled: vi.fn().mockResolvedValue(undefined),
    assertCanCreateCustomTemplate: vi.fn().mockResolvedValue(undefined),
  },
}));

import { TemplateService, clearTemplateCache } from "~/domains/templates/services/template.server";
import prisma from "~/db.server";

// ==========================================================================
// TEST HELPERS
// ==========================================================================

function createMockTemplate(overrides = {}) {
  return {
    id: "template-123",
    storeId: null,
    templateType: "NEWSLETTER",
    name: "Newsletter Template",
    description: "A simple newsletter",
    category: "lead-capture",
    goals: ["NEWSLETTER_SIGNUP"],
    contentConfig: JSON.stringify({ headline: "Subscribe!" }),
    designConfig: JSON.stringify({}),
    targetRules: JSON.stringify({}),
    discountConfig: JSON.stringify({}),
    fields: JSON.stringify([]),
    isDefault: true,
    isActive: true,
    priority: 1,
    icon: "mail",
    preview: null,
    conversionRate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ==========================================================================
// GET ALL TEMPLATES TESTS
// ==========================================================================

describe("TemplateService.getAllTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTemplateCache();
  });

  it("should fetch all active templates", async () => {
    const mockTemplates = [
      createMockTemplate({ id: "t1", name: "Template 1" }),
      createMockTemplate({ id: "t2", name: "Template 2" }),
    ];
    vi.mocked(prisma.template.findMany).mockResolvedValue(mockTemplates as any);

    const result = await TemplateService.getAllTemplates("store-123");

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Template 1");
    expect(prisma.template.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it("should use cache on second call", async () => {
    const mockTemplates = [createMockTemplate()];
    vi.mocked(prisma.template.findMany).mockResolvedValue(mockTemplates as any);

    // First call - cache miss
    await TemplateService.getAllTemplates("store-123");
    // Second call - cache hit
    await TemplateService.getAllTemplates("store-123");

    // Prisma should only be called once
    expect(prisma.template.findMany).toHaveBeenCalledTimes(1);
  });
});

// ==========================================================================
// GET TEMPLATE BY ID TESTS
// ==========================================================================

describe("TemplateService.getTemplateById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return template when found", async () => {
    vi.mocked(prisma.template.findFirst).mockResolvedValue(createMockTemplate() as any);

    const result = await TemplateService.getTemplateById("template-123");

    expect(result).not.toBeNull();
    expect(result?.name).toBe("Newsletter Template");
  });

  it("should return null when template not found", async () => {
    vi.mocked(prisma.template.findFirst).mockResolvedValue(null);

    const result = await TemplateService.getTemplateById("nonexistent");

    expect(result).toBeNull();
  });
});

// ==========================================================================
// GET TEMPLATES BY TYPE TESTS
// ==========================================================================

describe("TemplateService.getTemplatesByType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTemplateCache();
  });

  it("should filter templates by type", async () => {
    const mockTemplates = [createMockTemplate()];
    vi.mocked(prisma.template.findMany).mockResolvedValue(mockTemplates as any);

    const result = await TemplateService.getTemplatesByType("NEWSLETTER");

    expect(result).toHaveLength(1);
    expect(prisma.template.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ templateType: "NEWSLETTER" }),
      })
    );
  });

  it("should use cache on second call for same type", async () => {
    vi.mocked(prisma.template.findMany).mockResolvedValue([createMockTemplate()] as any);

    await TemplateService.getTemplatesByType("SPIN_TO_WIN");
    await TemplateService.getTemplatesByType("SPIN_TO_WIN");

    expect(prisma.template.findMany).toHaveBeenCalledTimes(1);
  });
});

// ==========================================================================
// GET DEFAULT TEMPLATE TESTS
// ==========================================================================

describe("TemplateService.getDefaultTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default template for type", async () => {
    vi.mocked(prisma.template.findFirst).mockResolvedValue(
      createMockTemplate({ isDefault: true }) as any
    );

    const result = await TemplateService.getDefaultTemplate("NEWSLETTER");

    expect(result).not.toBeNull();
    expect(prisma.template.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          templateType: "NEWSLETTER",
          isDefault: true,
          isActive: true,
          storeId: null,
        }),
      })
    );
  });

  it("should return null when no default template exists", async () => {
    vi.mocked(prisma.template.findFirst).mockResolvedValue(null);

    const result = await TemplateService.getDefaultTemplate("SPIN_TO_WIN");

    expect(result).toBeNull();
  });
});

// ==========================================================================
// CREATE TEMPLATE TESTS
// ==========================================================================

describe("TemplateService.createTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTemplateCache();
  });

  it("should create template successfully", async () => {
    const newTemplate = createMockTemplate({ id: "new-template-123" });
    vi.mocked(prisma.template.create).mockResolvedValue(newTemplate as any);

    const result = await TemplateService.createTemplate({
      templateType: "NEWSLETTER",
      name: "My Template",
      description: "Test template",
      category: "popup",
      goals: ["NEWSLETTER_SIGNUP"],
    });

    expect(result.id).toBe("new-template-123");
    expect(prisma.template.create).toHaveBeenCalled();
  });

  it("should clear cache after creating template", async () => {
    vi.mocked(prisma.template.findMany).mockResolvedValue([createMockTemplate()] as any);
    vi.mocked(prisma.template.create).mockResolvedValue(createMockTemplate() as any);

    // Populate cache
    await TemplateService.getAllTemplates();

    // Create new template (should clear cache)
    await TemplateService.createTemplate({
      templateType: "NEWSLETTER",
      name: "New Template",
      description: "Another template",
      category: "popup",
      goals: ["NEWSLETTER_SIGNUP"],
    });

    // Next call should hit DB again
    await TemplateService.getAllTemplates();

    expect(prisma.template.findMany).toHaveBeenCalledTimes(2);
  });
});

// ==========================================================================
// CACHE TESTS
// ==========================================================================

describe("clearTemplateCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTemplateCache();
  });

  it("should clear the template cache", async () => {
    vi.mocked(prisma.template.findMany).mockResolvedValue([createMockTemplate()] as any);

    // Populate cache
    await TemplateService.getAllTemplates();
    expect(prisma.template.findMany).toHaveBeenCalledTimes(1);

    // Clear cache
    clearTemplateCache();

    // Next call should hit DB again
    await TemplateService.getAllTemplates();
    expect(prisma.template.findMany).toHaveBeenCalledTimes(2);
  });
});
