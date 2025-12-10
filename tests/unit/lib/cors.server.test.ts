/**
 * Unit Tests for CORS Configuration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env
vi.mock("~/lib/env.server", () => ({
  getEnv: vi.fn(() => ({
    SHOPIFY_APP_URL: "https://myapp.example.com",
  })),
}));

import { adminCors, storefrontCors } from "~/lib/cors.server";

describe("adminCors", () => {
  it("should return CORS headers for admin requests", () => {
    const headers = adminCors("https://admin.shopify.com");

    expect(headers["Access-Control-Allow-Origin"]).toBe("https://admin.shopify.com");
    expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
    expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
    expect(headers["Access-Control-Allow-Methods"]).toContain("DELETE");
    expect(headers["Access-Control-Allow-Headers"]).toContain("Authorization");
  });

  it("should allow myshopify.com origins", () => {
    const headers = adminCors("https://my-store.myshopify.com");

    expect(headers["Access-Control-Allow-Origin"]).toBe("https://my-store.myshopify.com");
  });

  it("should allow app URL origin", () => {
    const headers = adminCors("https://myapp.example.com");

    expect(headers["Access-Control-Allow-Origin"]).toBe("https://myapp.example.com");
  });

  it("should return wildcard for missing origin", () => {
    const headers = adminCors(null);

    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("should include Vary header", () => {
    const headers = adminCors("https://admin.shopify.com");

    expect(headers["Vary"]).toBe("Origin");
  });
});

describe("storefrontCors", () => {
  it("should return CORS headers for storefront requests", () => {
    const headers = storefrontCors("https://my-store.myshopify.com");

    expect(headers["Access-Control-Allow-Origin"]).toBe("https://my-store.myshopify.com");
    expect(headers["Access-Control-Allow-Methods"]).toContain("GET");
    expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
    expect(headers["Access-Control-Allow-Headers"]).toContain("X-Shop-Domain");
  });

  it("should include cache prevention headers", () => {
    const headers = storefrontCors();

    expect(headers["Cache-Control"]).toContain("no-store");
    expect(headers["Cache-Control"]).toContain("no-cache");
    expect(headers["Pragma"]).toBe("no-cache");
    expect(headers["Expires"]).toBe("0");
  });

  it("should allow wildcard for missing origin", () => {
    const headers = storefrontCors(undefined);

    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("should allow any myshopify.com subdomain", () => {
    const headers = storefrontCors("https://totally-different-store.myshopify.com");

    expect(headers["Access-Control-Allow-Origin"]).toBe("https://totally-different-store.myshopify.com");
  });
});

