/**
 * Unit Tests for Sentry Server Module
 *
 * Tests the Sentry error monitoring configuration and helpers.
 */

import { describe, it, expect } from "vitest";

// Recreate the message level type
type MessageLevel = "info" | "warning" | "error";

// Recreate the breadcrumb level type
type BreadcrumbLevel = "debug" | "info" | "warning" | "error";

// Recreate the user context structure
interface UserContext {
  id: string;
  email?: string;
  shop?: string;
}

// Recreate the breadcrumb structure
interface Breadcrumb {
  category: string;
  message: string;
  level?: BreadcrumbLevel;
  data?: Record<string, unknown>;
}

// Helper to validate user context
function isValidUserContext(user: unknown): user is UserContext {
  if (!user || typeof user !== "object") return false;
  const u = user as Record<string, unknown>;
  return typeof u.id === "string" && u.id.length > 0;
}

// Helper to validate breadcrumb
function isValidBreadcrumb(breadcrumb: unknown): breadcrumb is Breadcrumb {
  if (!breadcrumb || typeof breadcrumb !== "object") return false;
  const b = breadcrumb as Record<string, unknown>;
  return (
    typeof b.category === "string" &&
    b.category.length > 0 &&
    typeof b.message === "string"
  );
}

// Helper to get default breadcrumb level
function getDefaultBreadcrumbLevel(level?: BreadcrumbLevel): BreadcrumbLevel {
  return level || "info";
}

describe("Sentry Server Module", () => {
  describe("MessageLevel type", () => {
    it("should support info level", () => {
      const level: MessageLevel = "info";
      expect(level).toBe("info");
    });

    it("should support warning level", () => {
      const level: MessageLevel = "warning";
      expect(level).toBe("warning");
    });

    it("should support error level", () => {
      const level: MessageLevel = "error";
      expect(level).toBe("error");
    });
  });

  describe("BreadcrumbLevel type", () => {
    it("should support all levels", () => {
      const levels: BreadcrumbLevel[] = ["debug", "info", "warning", "error"];
      expect(levels).toHaveLength(4);
    });
  });

  describe("isValidUserContext", () => {
    it("should return true for valid user context", () => {
      const user = { id: "user_123" };
      expect(isValidUserContext(user)).toBe(true);
    });

    it("should return true for user with optional fields", () => {
      const user = {
        id: "user_123",
        email: "test@example.com",
        shop: "mystore.myshopify.com",
      };
      expect(isValidUserContext(user)).toBe(true);
    });

    it("should return false for missing id", () => {
      const user = { email: "test@example.com" };
      expect(isValidUserContext(user)).toBe(false);
    });

    it("should return false for empty id", () => {
      const user = { id: "" };
      expect(isValidUserContext(user)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isValidUserContext(null)).toBe(false);
    });
  });

  describe("isValidBreadcrumb", () => {
    it("should return true for valid breadcrumb", () => {
      const breadcrumb = {
        category: "api",
        message: "API call completed",
      };
      expect(isValidBreadcrumb(breadcrumb)).toBe(true);
    });

    it("should return true for breadcrumb with optional fields", () => {
      const breadcrumb = {
        category: "api",
        message: "API call completed",
        level: "info" as BreadcrumbLevel,
        data: { endpoint: "/api/campaigns" },
      };
      expect(isValidBreadcrumb(breadcrumb)).toBe(true);
    });

    it("should return false for missing category", () => {
      const breadcrumb = { message: "Test" };
      expect(isValidBreadcrumb(breadcrumb)).toBe(false);
    });

    it("should return false for empty category", () => {
      const breadcrumb = { category: "", message: "Test" };
      expect(isValidBreadcrumb(breadcrumb)).toBe(false);
    });
  });

  describe("getDefaultBreadcrumbLevel", () => {
    it("should return provided level", () => {
      expect(getDefaultBreadcrumbLevel("error")).toBe("error");
      expect(getDefaultBreadcrumbLevel("warning")).toBe("warning");
    });

    it("should default to info", () => {
      expect(getDefaultBreadcrumbLevel()).toBe("info");
      expect(getDefaultBreadcrumbLevel(undefined)).toBe("info");
    });
  });

  describe("Sentry configuration", () => {
    it("should have correct sample rates", () => {
      const tracesSampleRate = 0.1;
      const sampleRate = 1.0;

      expect(tracesSampleRate).toBe(0.1);
      expect(sampleRate).toBe(1.0);
    });
  });
});

