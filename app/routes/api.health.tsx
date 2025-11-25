/**
 * API Health Check Route
 *
 * Simple endpoint to verify API is working and test service connections
 * GET /api/health
 */

import { data } from "react-router";
import { adminCors } from "~/lib/cors.server";
import prisma from "~/db.server";

// ============================================================================
// TYPES
// ============================================================================

interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  version: string;
  services: {
    database: "connected" | "error";
    domains: "loaded" | "error";
  };
  message?: string;
}

// ============================================================================
// LOADER (GET /api/health)
// ============================================================================

export async function loader() {
  const headers = adminCors();

  try {
    // Test database connection
    let databaseStatus: "connected" | "error" = "connected";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.error("Database health check failed:", error);
      databaseStatus = "error";
    }

    // Test domain imports
    let domainsStatus: "loaded" | "error" = "loaded";
    try {
      const { CampaignService } = await import("~/domains/campaigns");
      const { TemplateService } = await import("~/domains/templates");

      // Verify services are properly loaded
      if (!CampaignService || !TemplateService) {
        domainsStatus = "error";
      }
    } catch (error) {
      console.error("Domain health check failed:", error);
      domainsStatus = "error";
    }

    const overallStatus =
      databaseStatus === "connected" && domainsStatus === "loaded" ? "ok" : "error";

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: databaseStatus,
        domains: domainsStatus,
      },
      message:
        overallStatus === "ok"
          ? "All systems operational"
          : "Some services are experiencing issues",
    };

    return data(response, {
      status: overallStatus === "ok" ? 200 : 503,
      headers,
    });
  } catch (error) {
    console.error("Health check error:", error);

    const response: HealthResponse = {
      status: "error",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: "error",
        domains: "error",
      },
      message: "Health check failed",
    };

    return data(response, {
      status: 503,
      headers,
    });
  }
}
