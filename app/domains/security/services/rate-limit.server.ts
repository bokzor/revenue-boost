/**
 * Rate Limiting Service
 *
 * Prevents API abuse through configurable rate limits per action and key.
 * Uses Redis for fast rate limiting with PostgreSQL fallback and audit logging.
 */

import prisma from "~/db.server";
import { getRedis } from "~/lib/redis.server";
import type { Redis } from "ioredis";

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Common rate limit configurations
 */
export const RATE_LIMITS = {
  CHALLENGE_REQUEST: { maxRequests: 3, windowSeconds: 600 }, // 3 per 10 min
  DISCOUNT_GENERATION: { maxRequests: 5, windowSeconds: 3600 }, // 5 per hour
  LEAD_SUBMISSION: { maxRequests: 10, windowSeconds: 3600 }, // 10 per hour
  EMAIL_PER_CAMPAIGN: { maxRequests: 1, windowSeconds: 86400 }, // 1 per day per email per campaign
} as const;

/**
 * Check rate limit using Redis (fast) or PostgreSQL (fallback)
 */
export async function checkRateLimit(
  key: string,
  action: string,
  config: RateLimitConfig,
  metadata?: Record<string, unknown>
): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowSeconds * 1000);

  // Try Redis first if available
  const redis = getRedis();
  if (redis) {
    try {
      return await checkRateLimitRedis(redis, key, action, config, resetAt);
    } catch (error) {
      console.error("[Rate Limit] Redis check failed, falling back to PostgreSQL:", error);
      // Fall through to PostgreSQL
    }
  }

  // Fallback to PostgreSQL
  return await checkRateLimitPostgres(key, action, config, metadata, resetAt);
}

/**
 * Redis-based rate limiting (RECOMMENDED)
 * Uses sliding window with atomic operations via ioredis
 */
async function checkRateLimitRedis(
  redis: Redis,
  key: string,
  action: string,
  config: RateLimitConfig,
  resetAt: Date
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${action}:${key}`;

  // Atomic increment and get TTL using pipeline
  const pipeline = redis.pipeline();
  pipeline.incr(redisKey);
  pipeline.expire(redisKey, config.windowSeconds);
  pipeline.ttl(redisKey);

  const results = await pipeline.exec();

  // ioredis pipeline returns [[error, result], [error, result], ...]
  const count = (results?.[0]?.[1] as number) || 0;
  const ttl = (results?.[2]?.[1] as number) || -1;

  const remaining = Math.max(0, config.maxRequests - count);
  const actualResetAt = ttl > 0 ? new Date(Date.now() + ttl * 1000) : resetAt;

  return {
    allowed: count <= config.maxRequests,
    remaining,
    resetAt: actualResetAt,
  };
}

/**
 * PostgreSQL-based rate limiting (FALLBACK)
 * Slower but works without Redis
 */
async function checkRateLimitPostgres(
  key: string,
  action: string,
  config: RateLimitConfig,
  metadata: Record<string, unknown> | undefined,
  resetAt: Date
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowSeconds * 1000);

  // Count recent requests
  const recentCount = await prisma.rateLimitLog.count({
    where: {
      key,
      action,
      createdAt: { gte: windowStart },
    },
  });

  const remaining = Math.max(0, config.maxRequests - recentCount);

  // If over limit, return denial
  if (recentCount >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Log this request
  await prisma.rateLimitLog.create({
    data: {
      key,
      action,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      createdAt: now,
    },
  });

  return {
    allowed: true,
    remaining: remaining - 1,
    resetAt,
  };
}

/**
 * Log rate limit event to PostgreSQL for audit trail
 * (Asynchronous - doesn't block rate limit check)
 */
export async function logRateLimitEvent(
  key: string,
  action: string,
  allowed: boolean,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.rateLimitLog.create({
      data: {
        key,
        action,
        metadata: metadata ? JSON.stringify({ ...metadata, allowed }) : JSON.stringify({ allowed }),
        createdAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[Rate Limit] Audit logging failed:", error);
    // Don't throw - audit logging is best-effort
  }
}

/**
 * Create a composite rate limit key for email + campaign
 */
export function createEmailCampaignKey(email: string, campaignId: string): string {
  return `email:${email}:campaign:${campaignId}`;
}

/**
 * Create IP-based rate limit key
 */
export function createIpKey(ip: string, action?: string): string {
  return action ? `ip:${ip}:${action}` : `ip:${ip}`;
}

/**
 * Create session-based rate limit key
 */
export function createSessionKey(sessionId: string, action?: string): string {
  return action ? `session:${sessionId}:${action}` : `session:${sessionId}`;
}

/**
 * Clean up old rate limit logs from PostgreSQL (cron job)
 * Redis entries auto-expire via TTL
 */
export async function cleanupOldRateLimitLogs(retentionDays: number = 7): Promise<number> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await prisma.rateLimitLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}
