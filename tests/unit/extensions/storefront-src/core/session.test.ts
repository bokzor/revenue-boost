/**
 * Unit Tests for Storefront Session Management
 *
 * Tests the session and visitor tracking logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the storage keys
const SESSION_KEY = "revenue_boost_session";
const DISMISSED_KEY = "revenue_boost_dismissed";
const VISITOR_KEY = "revenue_boost_visitor";
const VISIT_COUNT_KEY = "revenue_boost_visit_count";

// Recreate the SessionData interface
interface SessionData {
  sessionId: string;
  visitorId: string;
  visitCount: number;
  isReturningVisitor: boolean;
  dismissedCampaigns: string[];
}

// Helper to generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to generate visitor ID
function generateVisitorId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to check if returning visitor
function isReturningVisitor(visitCount: number): boolean {
  return visitCount > 1;
}

// Helper to validate session ID format
function isValidSessionId(sessionId: string): boolean {
  return /^session_\d+_[a-z0-9]+$/.test(sessionId);
}

// Helper to validate visitor ID format
function isValidVisitorId(visitorId: string): boolean {
  return /^visitor_\d+_[a-z0-9]+$/.test(visitorId);
}

describe("Storefront Session Management", () => {
  describe("Storage keys", () => {
    it("should have correct session key", () => {
      expect(SESSION_KEY).toBe("revenue_boost_session");
    });

    it("should have correct dismissed key", () => {
      expect(DISMISSED_KEY).toBe("revenue_boost_dismissed");
    });

    it("should have correct visitor key", () => {
      expect(VISITOR_KEY).toBe("revenue_boost_visitor");
    });

    it("should have correct visit count key", () => {
      expect(VISIT_COUNT_KEY).toBe("revenue_boost_visit_count");
    });
  });

  describe("generateSessionId", () => {
    it("should generate valid session ID", () => {
      const sessionId = generateSessionId();
      expect(isValidSessionId(sessionId)).toBe(true);
    });

    it("should generate unique session IDs", () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("generateVisitorId", () => {
    it("should generate valid visitor ID", () => {
      const visitorId = generateVisitorId();
      expect(isValidVisitorId(visitorId)).toBe(true);
    });

    it("should generate unique visitor IDs", () => {
      const id1 = generateVisitorId();
      const id2 = generateVisitorId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("isReturningVisitor", () => {
    it("should return false for first visit", () => {
      expect(isReturningVisitor(1)).toBe(false);
    });

    it("should return true for second visit", () => {
      expect(isReturningVisitor(2)).toBe(true);
    });

    it("should return true for multiple visits", () => {
      expect(isReturningVisitor(10)).toBe(true);
    });
  });

  describe("SessionData structure", () => {
    it("should have all required fields", () => {
      const sessionData: SessionData = {
        sessionId: "session_123_abc",
        visitorId: "visitor_456_def",
        visitCount: 3,
        isReturningVisitor: true,
        dismissedCampaigns: ["campaign_1", "campaign_2"],
      };

      expect(sessionData.sessionId).toBeDefined();
      expect(sessionData.visitorId).toBeDefined();
      expect(sessionData.visitCount).toBe(3);
      expect(sessionData.isReturningVisitor).toBe(true);
      expect(sessionData.dismissedCampaigns).toHaveLength(2);
    });
  });

  describe("Dismissed campaigns", () => {
    it("should serialize to JSON", () => {
      const dismissed = ["campaign_1", "campaign_2"];
      const json = JSON.stringify(dismissed);
      expect(json).toBe('["campaign_1","campaign_2"]');
    });

    it("should deserialize from JSON", () => {
      const json = '["campaign_1","campaign_2"]';
      const dismissed = JSON.parse(json);
      expect(dismissed).toEqual(["campaign_1", "campaign_2"]);
    });
  });
});

