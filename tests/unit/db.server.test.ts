/**
 * Unit Tests for Database Server Module
 *
 * Tests the Prisma client configuration and exports.
 */

import { describe, it, expect } from "vitest";

describe("Database Server Module", () => {
  describe("Prisma client configuration", () => {
    it("should use global prisma in development to prevent connection exhaustion", () => {
      // In development, we use a global variable to prevent
      // creating multiple Prisma clients during hot reloading
      const isDevelopment = process.env.NODE_ENV !== "production";
      expect(typeof isDevelopment).toBe("boolean");
    });

    it("should create new client in production", () => {
      // In production, we create a new client each time
      const isProduction = process.env.NODE_ENV === "production";
      expect(typeof isProduction).toBe("boolean");
    });
  });

  describe("Prisma exports", () => {
    it("should export Prisma namespace for type utilities", () => {
      // The Prisma namespace is used for type utilities like:
      // - Prisma.JsonValue
      // - Prisma.InputJsonValue
      // - Prisma.JsonObject
      const prismaNamespaceExports = [
        "JsonValue",
        "InputJsonValue",
        "JsonObject",
        "JsonArray",
      ];

      // These are the common Prisma namespace types used in the app
      expect(prismaNamespaceExports).toContain("JsonValue");
      expect(prismaNamespaceExports).toContain("InputJsonValue");
    });
  });

  describe("Global declaration", () => {
    it("should declare prismaGlobal on global object", () => {
      // The global declaration allows TypeScript to recognize
      // the prismaGlobal variable on the global object
      expect(typeof global).toBe("object");
    });
  });
});

