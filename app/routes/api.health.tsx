/**
 * API Health Check Route
 *
 * Simple endpoint to verify API is working and test service connections
 * GET /api/health
 */

import { data } from "react-router";
import { adminCors } from "~/lib/cors.server";
import prisma from "~/db.server";
import { isRedisAvailable } from "~/lib/redis.server";
import { logger } from "~/lib/logger.server";

// ============================================================================
// TYPES
// ============================================================================

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
      logger.error({ error }, "[Health Check] Database connection failed");
      databaseStatus = "error";
    }

    // Test Redis connection
    let redisStatus: "connected" | "disconnected" | "not_configured" = "not_configured";
    try {
      const { getEnv } = await import("~/lib/env.server");
      const env = getEnv();

      if (env.REDIS_URL) {
        const isAvailable = await isRedisAvailable();
        redisStatus = isAvailable ? "connected" : "disconnected";
      }
    } catch (error) {
      logger.error({ error }, "[Health Check] Redis check failed");
      redisStatus = "disconnected";
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
      logger.error({ error }, "[Health Check] Domain loading failed");
      domainsStatus = "error";
    }

    // Determine overall status
    // - Database is critical (error = overall error)
    // - Redis is important (disconnected = degraded)
    // - Domains are critical (error = overall error)
    let overallStatus: "ok" | "degraded" | "error";
    if (databaseStatus === "error" || domainsStatus === "error") {
      overallStatus = "error";
    } else if (redisStatus === "disconnected") {
      overallStatus = "degraded";
    } else {
      overallStatus = "ok";
    }

    const messages = {
      ok: "All systems operational",
      degraded: "Some non-critical services are experiencing issues",
      error: "Critical services are experiencing issues",
    };

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: databaseStatus,
        redis: redisStatus,
        domains: domainsStatus,
      },
      message: messages[overallStatus],
    };

    const statusCodes = {
      ok: 200,
      degraded: 200, // Still return 200 for degraded (service is functional)
      error: 503,
    };

    return data(response, {
      status: statusCodes[overallStatus],
      headers,
    });
  } catch (error) {
    logger.error({ error }, "[Health Check] Unexpected error");

    const response: HealthResponse = {
      status: "error",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: "error",
        redis: "disconnected",
        domains: "error",
      },
      message: "Health check failed unexpectedly",
    };

    return data(response, {
      status: 503,
      headers,
    });
  }
}
