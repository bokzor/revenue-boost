/**
 * Frequency Capping Service (Redis-Based)
 *
 * Server-side service for tracking and enforcing frequency caps on campaign displays
 * Uses Redis for reliable, cross-device frequency tracking
 *
 * Features:
 * - Session limits (max per session)
 * - Time-based limits (hour, day, week, month)
 * - Cooldown periods between displays
 * - Global/cross-campaign limits
 * - Graceful fallback when Redis unavailable
 */

import { redis, REDIS_PREFIXES, REDIS_TTL } from "~/lib/redis.server";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { StorefrontContext } from "~/domains/campaigns/types/storefront-context";

/**
 * Frequency capping rule configuration
 */
export interface FrequencyCappingRule {
  max_triggers_per_session?: number;
  max_triggers_per_hour?: number;
  max_triggers_per_day?: number;
  max_triggers_per_week?: number;
  max_triggers_per_month?: number;
  cooldown_between_triggers?: number; // seconds
  respect_global_limits?: boolean;
  cross_campaign_limits?: {
    max_per_session?: number;
    max_per_day?: number;
  };
}

/**
 * Frequency cap check result
 */
export interface FrequencyCapResult {
  allowed: boolean;
  reason?: string;
  nextAllowedTime?: number;
  currentCounts: {
    session: number;
    hour: number;
    day: number;
    week: number;
    month: number;
  };
  globalCounts?: {
    session: number;
    day: number;
  };
  cooldownUntil?: number;
}

/**
 * Frequency Capping Service
 * Tracks campaign views and enforces frequency limits using Redis
 */
export class FrequencyCapService {
  /**
   * Check if a campaign should be shown based on frequency capping rules
   *
   * @param campaign - Campaign to check
   * @param context - Storefront context with visitor/session info
   * @returns Promise<FrequencyCapResult> - Whether campaign can be shown
   */
  static async checkFrequencyCapping(
    campaign: CampaignWithConfigs,
    context: StorefrontContext
  ): Promise<FrequencyCapResult> {
    try {
      const rules = campaign.targetRules?.enhancedTriggers?.frequency_capping as FrequencyCappingRule | undefined;

      // If no frequency capping configured, allow campaign
      if (!rules) {
        return { allowed: true, currentCounts: this.getEmptyCounts() };
      }

      // Use experimentId for tracking if campaign is part of an experiment
      // This ensures all variants share the same frequency cap
      const trackingKey = campaign.experimentId || campaign.id;
      const identifier = context.visitorId || context.sessionId || 'anonymous';
      const now = Date.now();

      // Check cooldown first
      const cooldownResult = await this.checkCooldown(identifier, trackingKey, now);
      if (!cooldownResult.allowed) {
        return cooldownResult;
      }

      // Get current counts
      const currentCounts = await this.getCurrentCounts(identifier, trackingKey);

      // Check individual campaign limits
      const campaignResult = this.checkCampaignLimits(currentCounts, rules);
      if (!campaignResult.allowed) {
        return { ...campaignResult, currentCounts };
      }

      // Check global/cross-campaign limits
      if (rules.respect_global_limits || rules.cross_campaign_limits) {
        const globalResult = await this.checkGlobalLimits(
          identifier,
          trackingKey,
          rules.cross_campaign_limits
        );
        if (!globalResult.allowed) {
          return { ...globalResult, currentCounts };
        }
      }

      return {
        allowed: true,
        currentCounts,
        globalCounts: rules.respect_global_limits
          ? await this.getGlobalCounts(identifier)
          : undefined,
      };
    } catch (error) {
      console.error('Frequency capping check failed:', error);
      // Fail open - allow display if frequency capping fails
      return { allowed: true, currentCounts: this.getEmptyCounts() };
    }
  }

  /**
   * Record a campaign display for frequency capping
   *
   * @param trackingKey - Experiment ID (if part of experiment) or Campaign ID
   * @param context - Storefront context with visitor/session info
   * @param rules - Frequency capping rules
   */
  static async recordDisplay(
    trackingKey: string,
    context: StorefrontContext,
    rules?: FrequencyCappingRule
  ): Promise<void> {
    try {
      const identifier = context.visitorId || context.sessionId || 'anonymous';
      const now = Date.now();

      // Record campaign-specific display
      await this.recordCampaignDisplay(identifier, trackingKey, now);

      // Record global display if needed
      if (rules?.respect_global_limits || rules?.cross_campaign_limits) {
        await this.recordGlobalDisplay(identifier, now);
      }

      // Set cooldown if specified
      if (rules?.cooldown_between_triggers) {
        await this.setCooldown(identifier, trackingKey, rules.cooldown_between_triggers, now);
      }
    } catch (error) {
      console.error('Failed to record display for frequency capping:', error);
      // Don't throw - recording failure shouldn't break popup display
    }
  }

  /**
   * Check cooldown period
   */
  private static async checkCooldown(
    identifier: string,
    trackingKey: string,
    now: number
  ): Promise<FrequencyCapResult> {
    if (!redis) {
      return {
        allowed: true,
        currentCounts: this.getEmptyCounts(),
      };
    }

    const cooldownKey = `${REDIS_PREFIXES.COOLDOWN}:${identifier}:${trackingKey}`;
    const cooldownUntil = await redis.get(cooldownKey);

    if (cooldownUntil && parseInt(cooldownUntil) > now) {
      return {
        allowed: false,
        reason: 'In cooldown period',
        nextAllowedTime: parseInt(cooldownUntil),
        cooldownUntil: parseInt(cooldownUntil),
        currentCounts: this.getEmptyCounts(),
      };
    }

    return { allowed: true, currentCounts: this.getEmptyCounts() };
  }

  /**
   * Set cooldown period
   */
  private static async setCooldown(
    identifier: string,
    trackingKey: string,
    cooldownSeconds: number,
    now: number
  ): Promise<void> {
    if (!redis || cooldownSeconds <= 0) return;

    const cooldownKey = `${REDIS_PREFIXES.COOLDOWN}:${identifier}:${trackingKey}`;
    const cooldownUntil = now + (cooldownSeconds * 1000);

    await redis.setex(
      cooldownKey,
      cooldownSeconds,
      cooldownUntil.toString()
    );
  }

  /**
   * Get current counts for a campaign or experiment
   */
  private static async getCurrentCounts(
    identifier: string,
    trackingKey: string
  ): Promise<FrequencyCapResult['currentCounts']> {
    const now = Date.now();
    const baseKey = `${REDIS_PREFIXES.FREQUENCY_CAP}:${identifier}:${trackingKey}`;

    const [session, hour, day, week, month] = await Promise.all([
      this.getTimeWindowCount(baseKey, 'session', now),
      this.getTimeWindowCount(baseKey, 'hour', now),
      this.getTimeWindowCount(baseKey, 'day', now),
      this.getTimeWindowCount(baseKey, 'week', now),
      this.getTimeWindowCount(baseKey, 'month', now),
    ]);

    return { session, hour, day, week, month };
  }

  /**
   * Get global counts across all campaigns
   */
  private static async getGlobalCounts(identifier: string): Promise<{
    session: number;
    day: number;
  }> {
    const now = Date.now();
    const baseKey = `${REDIS_PREFIXES.GLOBAL_FREQUENCY}:${identifier}`;

    const [session, day] = await Promise.all([
      this.getTimeWindowCount(baseKey, 'session', now),
      this.getTimeWindowCount(baseKey, 'day', now),
    ]);

    return { session, day };
  }

  /**
   * Check campaign-specific limits
   */
  private static checkCampaignLimits(
    counts: FrequencyCapResult['currentCounts'],
    rules: FrequencyCappingRule
  ): Pick<FrequencyCapResult, 'allowed' | 'reason'> {
    if (rules.max_triggers_per_session && counts.session >= rules.max_triggers_per_session) {
      return {
        allowed: false,
        reason: `Session limit exceeded (${rules.max_triggers_per_session})`,
      };
    }

    if (rules.max_triggers_per_hour && counts.hour >= rules.max_triggers_per_hour) {
      return {
        allowed: false,
        reason: `Hourly limit exceeded (${rules.max_triggers_per_hour})`,
      };
    }

    if (rules.max_triggers_per_day && counts.day >= rules.max_triggers_per_day) {
      return {
        allowed: false,
        reason: `Daily limit exceeded (${rules.max_triggers_per_day})`,
      };
    }

    if (rules.max_triggers_per_week && counts.week >= rules.max_triggers_per_week) {
      return {
        allowed: false,
        reason: `Weekly limit exceeded (${rules.max_triggers_per_week})`,
      };
    }

    if (rules.max_triggers_per_month && counts.month >= rules.max_triggers_per_month) {
      return {
        allowed: false,
        reason: `Monthly limit exceeded (${rules.max_triggers_per_month})`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check global/cross-campaign limits
   */
  private static async checkGlobalLimits(
    identifier: string,
    trackingKey: string,
    crossCampaignLimits?: FrequencyCappingRule['cross_campaign_limits']
  ): Promise<Pick<FrequencyCapResult, 'allowed' | 'reason' | 'globalCounts'>> {
    if (!crossCampaignLimits) {
      return { allowed: true };
    }

    const globalCounts = await this.getGlobalCounts(identifier);

    if (
      crossCampaignLimits.max_per_session &&
      globalCounts.session >= crossCampaignLimits.max_per_session
    ) {
      return {
        allowed: false,
        reason: `Global session limit exceeded (${crossCampaignLimits.max_per_session})`,
        globalCounts,
      };
    }

    if (
      crossCampaignLimits.max_per_day &&
      globalCounts.day >= crossCampaignLimits.max_per_day
    ) {
      return {
        allowed: false,
        reason: `Global daily limit exceeded (${crossCampaignLimits.max_per_day})`,
        globalCounts,
      };
    }

    return { allowed: true, globalCounts };
  }

  /**
   * Record campaign or experiment display
   */
  private static async recordCampaignDisplay(
    identifier: string,
    trackingKey: string,
    now: number
  ): Promise<void> {
    const baseKey = `${REDIS_PREFIXES.FREQUENCY_CAP}:${identifier}:${trackingKey}`;

    await Promise.all([
      this.incrementTimeWindowCount(baseKey, 'session', now, REDIS_TTL.SESSION),
      this.incrementTimeWindowCount(baseKey, 'hour', now, REDIS_TTL.HOUR),
      this.incrementTimeWindowCount(baseKey, 'day', now, REDIS_TTL.DAY),
      this.incrementTimeWindowCount(baseKey, 'week', now, REDIS_TTL.WEEK),
      this.incrementTimeWindowCount(baseKey, 'month', now, REDIS_TTL.MONTH),
    ]);
  }

  /**
   * Record global display
   */
  private static async recordGlobalDisplay(
    identifier: string,
    now: number
  ): Promise<void> {
    const baseKey = `${REDIS_PREFIXES.GLOBAL_FREQUENCY}:${identifier}`;

    await Promise.all([
      this.incrementTimeWindowCount(baseKey, 'session', now, REDIS_TTL.SESSION),
      this.incrementTimeWindowCount(baseKey, 'day', now, REDIS_TTL.DAY),
    ]);
  }

  /**
   * Get count for a specific time window
   */
  private static async getTimeWindowCount(
    baseKey: string,
    window: string,
    now: number
  ): Promise<number> {
    if (!redis) return 0;

    const windowKey = `${baseKey}:${window}`;
    const count = await redis.get(windowKey);
    return count ? parseInt(count) : 0;
  }

  /**
   * Increment count for a specific time window
   */
  private static async incrementTimeWindowCount(
    baseKey: string,
    window: string,
    now: number,
    ttlSeconds: number
  ): Promise<void> {
    if (!redis) return;

    const windowKey = `${baseKey}:${window}`;

    // Use pipeline for atomic operations
    const pipeline = redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, ttlSeconds);
    await pipeline.exec();
  }

  /**
   * Get empty counts structure
   */
  private static getEmptyCounts(): FrequencyCapResult['currentCounts'] {
    return {
      session: 0,
      hour: 0,
      day: 0,
      week: 0,
      month: 0,
    };
  }

  /**
   * Reset frequency capping for a user/session (useful for testing)
   */
  static async resetFrequencyCapping(
    identifier: string,
    trackingKey?: string
  ): Promise<void> {
    if (!redis) return;

    try {
      if (trackingKey) {
        // Reset specific campaign or experiment
        const pattern = `${REDIS_PREFIXES.FREQUENCY_CAP}:${identifier}:${trackingKey}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }

        // Reset cooldown
        const cooldownKey = `${REDIS_PREFIXES.COOLDOWN}:${identifier}:${trackingKey}`;
        await redis.del(cooldownKey);
      } else {
        // Reset all campaigns for identifier
        const patterns = [
          `${REDIS_PREFIXES.FREQUENCY_CAP}:${identifier}:*`,
          `${REDIS_PREFIXES.GLOBAL_FREQUENCY}:${identifier}:*`,
          `${REDIS_PREFIXES.COOLDOWN}:${identifier}:*`,
        ];

        for (const pattern of patterns) {
          const keys = await redis.keys(pattern);
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        }
      }
    } catch (error) {
      console.error('Failed to reset frequency capping:', error);
    }
  }

  /**
   * Get frequency capping status for debugging
   */
  static async getFrequencyStatus(
    identifier: string,
    trackingKey: string
  ): Promise<{
    counts: FrequencyCapResult['currentCounts'];
    globalCounts: { session: number; day: number };
    cooldownUntil?: number;
  }> {
    const [counts, globalCounts] = await Promise.all([
      this.getCurrentCounts(identifier, trackingKey),
      this.getGlobalCounts(identifier),
    ]);

    const cooldownKey = `${REDIS_PREFIXES.COOLDOWN}:${identifier}:${trackingKey}`;
    const cooldownUntil = redis ? await redis.get(cooldownKey) : null;

    return {
      counts,
      globalCounts,
      cooldownUntil: cooldownUntil ? parseInt(cooldownUntil) : undefined,
    };
  }
}


