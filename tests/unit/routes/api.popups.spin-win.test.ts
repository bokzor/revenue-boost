/**
 * Unit Tests for Spin-to-Win API
 *
 * Tests the request validation schema.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the schemas from the handler
const BaseGamePopupRequestSchema = z.object({
  campaignId: z
    .string()
    .min(1)
    .refine(
      (id) => id.startsWith("preview-") || /^[cC][^\s-]{8,}$/.test(id),
      "Invalid campaign ID format"
    ),
  sessionId: z.string().min(1, "Session ID is required"),
  visitorId: z.string().optional(),
  popupShownAt: z.number().optional(),
  honeypot: z.string().optional(),
});

const SpinToWinRequestSchema = BaseGamePopupRequestSchema.extend({
  email: z.string().email(),
});

describe("Spin-to-Win API", () => {
  describe("SpinToWinRequestSchema", () => {
    it("should validate valid spin request", () => {
      const validData = {
        campaignId: "cmp_12345678",
        email: "test@example.com",
        sessionId: "session-123",
      };

      const result = SpinToWinRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept preview campaign ID", () => {
      const validData = {
        campaignId: "preview-abc123",
        email: "test@example.com",
        sessionId: "session-123",
      };

      const result = SpinToWinRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should require email", () => {
      const invalidData = {
        campaignId: "cmp_12345678",
        sessionId: "session-123",
      };

      const result = SpinToWinRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        campaignId: "cmp_12345678",
        email: "not-an-email",
        sessionId: "session-123",
      };

      const result = SpinToWinRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should require sessionId", () => {
      const invalidData = {
        campaignId: "cmp_12345678",
        email: "test@example.com",
      };

      const result = SpinToWinRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid campaign ID format", () => {
      const invalidData = {
        campaignId: "invalid",
        email: "test@example.com",
        sessionId: "session-123",
      };

      const result = SpinToWinRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept optional fields", () => {
      const validData = {
        campaignId: "cmp_12345678",
        email: "test@example.com",
        sessionId: "session-123",
        visitorId: "visitor-456",
        popupShownAt: Date.now() - 5000,
        honeypot: "",
      };

      const result = SpinToWinRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

