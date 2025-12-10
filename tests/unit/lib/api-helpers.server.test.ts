/**
 * Unit Tests for API Helpers
 */

import { describe, it, expect, vi } from "vitest";

// Type for mock return value
interface MockDataResult {
  data: unknown;
  init: ResponseInit | null;
}

// Mock dependencies
vi.mock("react-router", () => ({
  data: vi.fn((payload, init) => ({ data: payload, init: init ?? null })),
}));

vi.mock("~/lib/cors.server", () => ({
  adminCors: vi.fn(() => ({ "Access-Control-Allow-Origin": "*" })),
}));

vi.mock("~/lib/api-types", () => ({
  createApiResponse: vi.fn((success, data, message, errors) => ({
    success,
    data,
    message,
    errors,
  })),
}));

import {
  createSuccessResponse,
  createErrorResponse,
  validateResourceExists,
  validateRequiredId,
} from "~/lib/api-helpers.server";

describe("createSuccessResponse", () => {
  it("should create success response with data", () => {
    const result = createSuccessResponse({ id: "123", name: "Test" }) as unknown as MockDataResult;
    const payload = result.data as { success: boolean; data: { id: string; name: string } };

    expect(payload.success).toBe(true);
    expect(payload.data).toEqual({ id: "123", name: "Test" });
    expect(result.init?.status).toBe(200);
  });

  it("should allow custom status code", () => {
    const result = createSuccessResponse({ created: true }, 201) as unknown as MockDataResult;

    expect(result.init?.status).toBe(201);
  });

  it("should include CORS headers", () => {
    const result = createSuccessResponse({}) as unknown as MockDataResult;

    expect((result.init?.headers as Record<string, string>)?.["Access-Control-Allow-Origin"]).toBe("*");
  });
});

describe("createErrorResponse", () => {
  it("should create error response with message", () => {
    const result = createErrorResponse("Something went wrong") as unknown as MockDataResult;
    const payload = result.data as { success: boolean; message?: string };

    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Something went wrong");
    expect(result.init?.status).toBe(400);
  });

  it("should allow custom status code", () => {
    const result = createErrorResponse("Not found", 404) as unknown as MockDataResult;

    expect(result.init?.status).toBe(404);
  });

  it("should include errors array", () => {
    const result = createErrorResponse("Validation failed", 400, ["field1: required", "field2: invalid"]) as unknown as MockDataResult;
    const payload = result.data as { errors?: string[] };

    expect(payload.errors).toEqual(["field1: required", "field2: invalid"]);
  });
});

describe("validateResourceExists", () => {
  it("should not throw for existing resource", () => {
    const resource = { id: "123" };

    expect(() => validateResourceExists(resource, "Campaign")).not.toThrow();
  });

  it("should throw 404 for null resource", () => {
    try {
      validateResourceExists(null, "Campaign");
      expect.fail("Should have thrown");
    } catch (error) {
      expect((error as Error).message).toBe("Campaign not found");
      expect((error as { status: number }).status).toBe(404);
    }
  });

  it("should throw 404 for undefined resource", () => {
    try {
      validateResourceExists(undefined, "Template");
      expect.fail("Should have thrown");
    } catch (error) {
      expect((error as Error).message).toBe("Template not found");
      expect((error as { status: number }).status).toBe(404);
    }
  });
});

describe("validateRequiredId", () => {
  it("should not throw for valid ID", () => {
    expect(() => validateRequiredId("abc123", "Campaign")).not.toThrow();
  });

  it("should throw 400 for undefined ID", () => {
    try {
      validateRequiredId(undefined, "Campaign");
      expect.fail("Should have thrown");
    } catch (error) {
      expect((error as Error).message).toBe("Campaign ID is required");
      expect((error as { status: number }).status).toBe(400);
    }
  });
});
