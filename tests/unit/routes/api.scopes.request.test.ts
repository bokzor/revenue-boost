/**
 * Unit Tests for Scope Request API
 *
 * Tests the /api/scopes/request endpoint for requesting additional OAuth scopes
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ActionFunctionArgs } from "react-router";

// Mock dependencies before importing the route module
vi.mock("~/shopify.server", () => ({
  authenticate: {
    admin: vi.fn(),
  },
}));

vi.mock("~/lib/api-helpers.server", () => ({
  createSuccessResponse: vi.fn((data) => ({ type: "success", data })),
}));

vi.mock("~/lib/api-error-handler.server", () => ({
  handleApiError: vi.fn((error) => ({ type: "error", error: error.message })),
}));

import { action } from "~/routes/api.scopes.request";
import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";

describe("POST /api/scopes/request", () => {
  const mockScopesRequest = vi.fn();
  const mockScopesQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: scopes.request() resolves (no redirect needed)
    // and scopes.query() returns granted scopes
    mockScopesRequest.mockResolvedValue(undefined);
    mockScopesQuery.mockResolvedValue({
      granted: ["read_customers"],
      required: [],
      optional: ["read_customers", "write_customers"],
    });

    vi.mocked(authenticate.admin).mockResolvedValue({
      session: { shop: "test.myshopify.com" },
      scopes: {
        request: mockScopesRequest,
        query: mockScopesQuery,
      },
    } as any);
  });

  function createRequest(body: unknown, method = "POST"): Request {
    return new Request("https://app.example.com/api/scopes/request", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns error for non-POST methods", async () => {
    const request = new Request("https://app.example.com/api/scopes/request", {
      method: "GET",
    });

    const response = await action({
      request,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    // React Router data() returns an object with data property
    expect((response as any).data?.error).toBe("Method not allowed");
  });

  it("returns error when scopes array is missing", async () => {
    const request = createRequest({});

    const response = await action({
      request,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    expect((response as any).data?.error).toBe("scopes array is required in request body");
  });

  it("returns error when scopes array is empty", async () => {
    const request = createRequest({ scopes: [] });

    const response = await action({
      request,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    expect((response as any).data?.error).toBe("scopes array is required in request body");
  });

  it("returns error for invalid scope requests", async () => {
    const request = createRequest({ scopes: ["read_orders", "read_products"] });

    const response = await action({
      request,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    expect((response as any).data?.error).toContain("Invalid scopes requested");
  });

  it("calls scopes.request with read_customers", async () => {
    mockScopesRequest.mockResolvedValue({ redirectUrl: null });
    const request = createRequest({ scopes: ["read_customers"] });

    await action({
      request,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    expect(mockScopesRequest).toHaveBeenCalledWith(["read_customers"]);
  });

  it("calls scopes.request with write_customers", async () => {
    mockScopesRequest.mockResolvedValue({ redirectUrl: null });
    const request = createRequest({ scopes: ["write_customers"] });

    await action({
      request,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    expect(mockScopesRequest).toHaveBeenCalledWith(["write_customers"]);
  });

  it("calls scopes.request with multiple valid scopes", async () => {
    mockScopesRequest.mockResolvedValue({ redirectUrl: null });
    const request = createRequest({
      scopes: ["read_customers", "write_customers"],
    });

    await action({
      request,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    expect(mockScopesRequest).toHaveBeenCalledWith([
      "read_customers",
      "write_customers",
    ]);
  });

  it("returns success with granted scopes when scopes are already granted", async () => {
    // When scopes are already granted, request() returns without redirecting
    mockScopesRequest.mockResolvedValue(undefined);
    mockScopesQuery.mockResolvedValue({
      granted: ["read_customers", "write_customers"],
      required: [],
      optional: ["read_customers", "write_customers"],
    });
    const request = createRequest({ scopes: ["read_customers"] });

    await action({
      request,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    expect(mockScopesQuery).toHaveBeenCalled();
    expect(createSuccessResponse).toHaveBeenCalledWith({
      success: true,
      message: "Scopes already granted or request initiated",
      granted: ["read_customers", "write_customers"],
    });
  });

  it("queries granted scopes after successful request", async () => {
    mockScopesRequest.mockResolvedValue(undefined);
    mockScopesQuery.mockResolvedValue({
      granted: ["read_customers"],
      required: [],
      optional: ["read_customers"],
    });
    const request = createRequest({ scopes: ["read_customers"] });

    await action({
      request,
      params: {},
      context: {},
    } as ActionFunctionArgs);

    expect(mockScopesRequest).toHaveBeenCalledWith(["read_customers"]);
    expect(mockScopesQuery).toHaveBeenCalled();
    expect(createSuccessResponse).toHaveBeenCalledWith({
      success: true,
      message: "Scopes already granted or request initiated",
      granted: ["read_customers"],
    });
  });
});

