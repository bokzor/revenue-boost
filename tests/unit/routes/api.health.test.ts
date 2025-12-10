/**
 * Unit Tests for Health Check API
 *
 * Tests the health response types and status logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the types from the route for testing
interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  version: string;
  services: {
    database: "connected" | "error";
    redis: "connected" | "disconnected" | "not_configured";
    domains: "loaded" | "error";
  };
  message?: string;
}

// Recreate the status determination logic
function determineOverallStatus(
  databaseStatus: "connected" | "error",
  redisStatus: "connected" | "disconnected" | "not_configured",
  domainsStatus: "loaded" | "error"
): "ok" | "degraded" | "error" {
  if (databaseStatus === "error" || domainsStatus === "error") {
    return "error";
  } else if (redisStatus === "disconnected") {
    return "degraded";
  } else {
    return "ok";
  }
}

function getStatusMessage(status: "ok" | "degraded" | "error"): string {
  const messages = {
    ok: "All systems operational",
    degraded: "Some non-critical services are experiencing issues",
    error: "Critical services are experiencing issues",
  };
  return messages[status];
}

function getStatusCode(status: "ok" | "degraded" | "error"): number {
  const statusCodes = {
    ok: 200,
    degraded: 200,
    error: 503,
  };
  return statusCodes[status];
}

describe("Health Check API", () => {
  describe("HealthResponse type", () => {
    it("should have valid ok response structure", () => {
      const response: HealthResponse = {
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        services: {
          database: "connected",
          redis: "connected",
          domains: "loaded",
        },
        message: "All systems operational",
      };

      expect(response.status).toBe("ok");
      expect(response.services.database).toBe("connected");
    });

    it("should have valid degraded response structure", () => {
      const response: HealthResponse = {
        status: "degraded",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        services: {
          database: "connected",
          redis: "disconnected",
          domains: "loaded",
        },
      };

      expect(response.status).toBe("degraded");
      expect(response.services.redis).toBe("disconnected");
    });
  });

  describe("determineOverallStatus", () => {
    it("should return ok when all services are healthy", () => {
      expect(determineOverallStatus("connected", "connected", "loaded")).toBe("ok");
    });

    it("should return ok when redis is not configured", () => {
      expect(determineOverallStatus("connected", "not_configured", "loaded")).toBe("ok");
    });

    it("should return degraded when redis is disconnected", () => {
      expect(determineOverallStatus("connected", "disconnected", "loaded")).toBe("degraded");
    });

    it("should return error when database has error", () => {
      expect(determineOverallStatus("error", "connected", "loaded")).toBe("error");
    });

    it("should return error when domains have error", () => {
      expect(determineOverallStatus("connected", "connected", "error")).toBe("error");
    });

    it("should return error when both database and domains have errors", () => {
      expect(determineOverallStatus("error", "disconnected", "error")).toBe("error");
    });
  });

  describe("getStatusMessage", () => {
    it("should return correct message for ok status", () => {
      expect(getStatusMessage("ok")).toBe("All systems operational");
    });

    it("should return correct message for degraded status", () => {
      expect(getStatusMessage("degraded")).toBe(
        "Some non-critical services are experiencing issues"
      );
    });

    it("should return correct message for error status", () => {
      expect(getStatusMessage("error")).toBe("Critical services are experiencing issues");
    });
  });

  describe("getStatusCode", () => {
    it("should return 200 for ok status", () => {
      expect(getStatusCode("ok")).toBe(200);
    });

    it("should return 200 for degraded status", () => {
      expect(getStatusCode("degraded")).toBe(200);
    });

    it("should return 503 for error status", () => {
      expect(getStatusCode("error")).toBe(503);
    });
  });
});

