/**
 * Redis Connection Module
 *
 * Provides Redis client for server-side caching, frequency capping, and visitor tracking.
 * Gracefully handles missing Redis configuration by returning null.
 */

import { logger } from "~/lib/logger.server";
import Redis from "ioredis";
import { getEnv } from "./env.server";

let redisClient: Redis | null = null;

/**
 * Initialize Redis connection
 */
function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const env = getEnv();
  const redisUrl = env.REDIS_URL;

  if (!redisUrl) {
    logger.warn("⚠️  REDIS_URL not configured, Redis features will be disabled");
    logger.warn("   Frequency capping and visitor tracking will not work properly");
    return null;
  }

  try {
    logger.info({ redisUrl: redisUrl.replace(/:\/\/[^@]+@/, "://***@") }, "[Redis] Initializing connection");

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on("error", (error) => {
      logger.error({ error }, "❌ Redis connection error:");
    });

    redisClient.on("connect", () => {
      logger.debug("✅ Redis connected successfully");
    });

    redisClient.on("ready", () => {
      logger.debug("✅ Redis ready to accept commands");
    });

    redisClient.on("close", () => {
      logger.warn("⚠️  Redis connection closed");
    });

    return redisClient;
  } catch (error) {
    logger.error({ error }, "❌ Failed to initialize Redis:");
    return null;
  }
}

/**
 * Get Redis client instance - lazily initialized
 */
export function getRedis(): Redis | null {
  return getRedisClient();
}

/**
 * Redis client instance (for backward compatibility)
 * Note: This may be null if Redis is not configured
 */
export const redis = getRedisClient();

/**
 * Execute Redis command with error handling
 * Returns fallback value if Redis is unavailable or command fails
 */
export async function executeRedisCommand<T>(
  command: (client: Redis) => Promise<T>,
  fallback?: T
): Promise<T | null> {
  const client = getRedis();
  if (!client) {
    return fallback ?? null;
  }

  try {
    return await command(client);
  } catch (error) {
    logger.error({ error }, "❌ Redis command failed:");
    return fallback ?? null;
  }
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.debug("✅ Redis connection closed gracefully");
    } catch (error) {
      logger.error({ error }, "❌ Error closing Redis connection:");
    } finally {
      redisClient = null;
    }
  }
}

/**
 * Redis key prefixes for organization
 */
export const REDIS_PREFIXES = {
  FREQUENCY_CAP: "freq_cap",
  GLOBAL_FREQUENCY: "global_freq_cap",
  COOLDOWN: "cooldown",
  VISITOR: "visitor",
  PAGE_VIEW: "pageview",
  STATS: "stats",
  SESSION: "session",
  RECOMMENDATIONS: "recs", // Smart product recommendations cache
} as const;

/**
 * Redis TTL constants (in seconds)
 */
export const REDIS_TTL = {
  SESSION: 3600, // 1 hour
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,
  VISITOR: 7776000, // 90 days
} as const;
