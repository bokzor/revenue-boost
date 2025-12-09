/**
 * Unit Tests for Billing Errors
 */

import { describe, it, expect } from "vitest";

import { PlanLimitError } from "~/domains/billing/errors";

describe("PlanLimitError", () => {
  it("should create error with message", () => {
    const error = new PlanLimitError("Campaign limit exceeded");

    expect(error.message).toBe("Campaign limit exceeded");
    expect(error.name).toBe("PlanLimitError");
    expect(error.code).toBe("PLAN_LIMIT_EXCEEDED");
    expect(error.httpStatus).toBe(403);
  });

  it("should include details when provided", () => {
    const error = new PlanLimitError("Limit exceeded", {
      currentCount: 5,
      maxAllowed: 3,
      planTier: "STARTER",
    });

    expect(error.details).toEqual({
      currentCount: 5,
      maxAllowed: 3,
      planTier: "STARTER",
    });
  });

  it("should have empty details by default", () => {
    const error = new PlanLimitError("Limit exceeded");

    expect(error.details).toEqual({});
  });

  it("should be an instance of Error", () => {
    const error = new PlanLimitError("Test");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PlanLimitError);
  });

  it("should have correct HTTP status for API responses", () => {
    const error = new PlanLimitError("Forbidden");

    expect(error.httpStatus).toBe(403);
  });
});

