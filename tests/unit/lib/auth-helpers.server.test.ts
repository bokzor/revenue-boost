/**
 * Unit Tests for Auth Helpers Server Module
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock shopify.server before importing auth-helpers
vi.mock("~/shopify.server", () => ({
  authenticate: {
    admin: vi.fn(),
  },
  apiVersion: "2024-01",
}));

vi.mock("~/db.server", () => ({
  default: {
    store: {
      findUnique: vi.fn(),
    },
  },
}));

import {
  getStoreIdFromShop,
  createAdminApiContext,
} from "~/lib/auth-helpers.server";
import prisma from "~/db.server";

describe("Auth Helpers Server Module", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  describe("getStoreIdFromShop", () => {
    it("should return store ID for valid shop domain", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValueOnce({
        id: "store-123",
      } as never);

      const result = await getStoreIdFromShop("test-store.myshopify.com");

      expect(result).toBe("store-123");
      expect(prisma.store.findUnique).toHaveBeenCalledWith({
        where: { shopifyDomain: "test-store.myshopify.com" },
        select: { id: true },
      });
    });

    it("should normalize shop domain without .myshopify.com", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValueOnce({
        id: "store-456",
      } as never);

      const result = await getStoreIdFromShop("test-store");

      expect(result).toBe("store-456");
      expect(prisma.store.findUnique).toHaveBeenCalledWith({
        where: { shopifyDomain: "test-store.myshopify.com" },
        select: { id: true },
      });
    });

    it("should throw error when store not found", async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValueOnce(null);

      await expect(getStoreIdFromShop("unknown-store")).rejects.toThrow(
        "Store not found for shop: unknown-store.myshopify.com"
      );
    });
  });

  describe("createAdminApiContext", () => {
    it("should create context with graphql method", () => {
      const context = createAdminApiContext(
        "test-store.myshopify.com",
        "test-token"
      );

      expect(context).toHaveProperty("graphql");
      expect(typeof context.graphql).toBe("function");
    });

    it("should make GraphQL request with correct headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { shop: { name: "Test Store" } } }),
      });

      const context = createAdminApiContext(
        "test-store.myshopify.com",
        "test-token"
      );

      await context.graphql("query { shop { name } }");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("test-store.myshopify.com/admin/api/"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": "test-token",
          }),
        })
      );
    });

    it("should include variables in GraphQL request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });

      const context = createAdminApiContext(
        "test-store.myshopify.com",
        "test-token"
      );

      await context.graphql("query GetProduct($id: ID!) { product(id: $id) { title } }", {
        variables: { id: "gid://shopify/Product/123" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"variables":{"id":"gid://shopify/Product/123"}'),
        })
      );
    });
  });
});

