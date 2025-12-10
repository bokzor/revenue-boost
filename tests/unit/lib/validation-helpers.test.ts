/**
 * Unit Tests for Validation Helpers
 *
 * Tests validation utility functions
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import {
  ValidationError,
  formatZodErrors,
  formatZodErrorsAsString,
  validateData,
  getValidationErrors,
} from "~/lib/validation-helpers";

// ==========================================================================
// VALIDATION ERROR CLASS TESTS
// ==========================================================================

describe("ValidationError", () => {
  it("should create error with message and errors", () => {
    const error = new ValidationError("Validation failed", ["field1: required", "field2: invalid"]);

    expect(error.message).toBe("Validation failed");
    expect(error.errors).toEqual(["field1: required", "field2: invalid"]);
    expect(error.name).toBe("ValidationError");
  });

  it("should create error with context", () => {
    const error = new ValidationError("Validation failed", ["error"], "campaign creation");

    expect(error.context).toBe("campaign creation");
  });
});

// ==========================================================================
// FORMAT ZOD ERRORS TESTS
// ==========================================================================

describe("formatZodErrors", () => {
  it("should format simple validation error", () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const result = schema.safeParse({ email: "invalid" });
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("email");
    }
  });

  it("should format nested path errors", () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string().min(1),
        }),
      }),
    });

    const result = schema.safeParse({ user: { profile: { name: "" } } });
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors[0]).toContain("user.profile.name");
    }
  });

  it("should format multiple errors", () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const result = schema.safeParse({ name: "", email: "invalid" });
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      expect(errors.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("formatZodErrorsAsString", () => {
  it("should join errors with default separator", () => {
    const schema = z.object({
      a: z.string().min(1),
      b: z.string().min(1),
    });

    const result = schema.safeParse({ a: "", b: "" });
    if (!result.success) {
      const errorString = formatZodErrorsAsString(result.error);
      expect(errorString).toContain(", ");
    }
  });

  it("should join errors with custom separator", () => {
    const schema = z.object({
      a: z.string().min(1),
      b: z.string().min(1),
    });

    const result = schema.safeParse({ a: "", b: "" });
    if (!result.success) {
      const errorString = formatZodErrorsAsString(result.error, " | ");
      expect(errorString).toContain(" | ");
    }
  });
});

// ==========================================================================
// VALIDATE DATA TESTS
// ==========================================================================

describe("validateData", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().positive(),
  });

  it("should return validated data for valid input", () => {
    const data = validateData(schema, { name: "John", age: 30 });
    expect(data).toEqual({ name: "John", age: 30 });
  });

  it("should throw ValidationError for invalid input", () => {
    expect(() => validateData(schema, { name: "", age: -1 })).toThrow(ValidationError);
  });

  it("should include context in error message", () => {
    try {
      validateData(schema, { name: "", age: -1 }, "user profile");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).context).toBe("user profile");
      expect((error as ValidationError).message).toContain("user profile");
    }
  });
});

// ==========================================================================
// GET VALIDATION ERRORS TESTS
// ==========================================================================

describe("getValidationErrors", () => {
  const schema = z.object({
    name: z.string().min(1),
  });

  it("should return empty array for valid data", () => {
    const errors = getValidationErrors(schema, { name: "John" });
    expect(errors).toEqual([]);
  });

  it("should return errors for invalid data", () => {
    const errors = getValidationErrors(schema, { name: "" });
    expect(errors.length).toBeGreaterThan(0);
  });
});

