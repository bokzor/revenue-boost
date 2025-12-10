/**
 * Unit Tests for Lead Submission API
 *
 * Tests the validation schema and helper functions.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the schema from the route for testing
const LeadSubmissionSchema = z.object({
  email: z.string().email(),
  campaignId: z.string(),
  sessionId: z.string(),
  visitorId: z.string().optional(),
  consent: z.boolean().optional(),
  consentText: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  pageUrl: z.string().optional(),
  pageTitle: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  popupShownAt: z.number().optional(),
  honeypot: z.string().optional(),
});

// Recreate getClientIP helper
function getClientIP(request: Request): string | null {
  const headers = ["CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP", "X-Client-IP"];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      return value.split(",")[0].trim();
    }
  }

  return null;
}

describe("Lead Submission API", () => {
  describe("LeadSubmissionSchema", () => {
    it("should validate valid lead submission", () => {
      const validData = {
        email: "test@example.com",
        campaignId: "campaign-123",
        sessionId: "session-456",
      };

      const result = LeadSubmissionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        email: "not-an-email",
        campaignId: "campaign-123",
        sessionId: "session-456",
      };

      const result = LeadSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should require campaignId", () => {
      const invalidData = {
        email: "test@example.com",
        sessionId: "session-456",
      };

      const result = LeadSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should require sessionId", () => {
      const invalidData = {
        email: "test@example.com",
        campaignId: "campaign-123",
      };

      const result = LeadSubmissionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept optional fields", () => {
      const dataWithOptionals = {
        email: "test@example.com",
        campaignId: "campaign-123",
        sessionId: "session-456",
        firstName: "John",
        lastName: "Doe",
        phone: "+1234567890",
        consent: true,
        consentText: "I agree to receive marketing emails",
        pageUrl: "https://example.com/products",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "summer-sale",
      };

      const result = LeadSubmissionSchema.safeParse(dataWithOptionals);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe("John");
        expect(result.data.consent).toBe(true);
      }
    });

    it("should accept metadata object", () => {
      const dataWithMetadata = {
        email: "test@example.com",
        campaignId: "campaign-123",
        sessionId: "session-456",
        metadata: {
          customField: "value",
          anotherField: 123,
        },
      };

      const result = LeadSubmissionSchema.safeParse(dataWithMetadata);
      expect(result.success).toBe(true);
    });

    it("should accept bot detection fields", () => {
      const dataWithBotFields = {
        email: "test@example.com",
        campaignId: "campaign-123",
        sessionId: "session-456",
        popupShownAt: Date.now() - 5000,
        honeypot: "",
      };

      const result = LeadSubmissionSchema.safeParse(dataWithBotFields);
      expect(result.success).toBe(true);
    });
  });

  describe("getClientIP", () => {
    it("should extract IP from CF-Connecting-IP", () => {
      const request = new Request("http://localhost", {
        headers: { "CF-Connecting-IP": "1.2.3.4" },
      });
      expect(getClientIP(request)).toBe("1.2.3.4");
    });

    it("should extract first IP from X-Forwarded-For chain", () => {
      const request = new Request("http://localhost", {
        headers: { "X-Forwarded-For": "5.6.7.8, 9.10.11.12" },
      });
      expect(getClientIP(request)).toBe("5.6.7.8");
    });

    it("should return null when no IP headers", () => {
      const request = new Request("http://localhost");
      expect(getClientIP(request)).toBeNull();
    });
  });
});

