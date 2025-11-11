/**
 * TriggerManager
 *
 * Evaluates client-side triggers for campaigns
 * Handles behavioral triggers like exit intent, scroll depth, time delays, etc.
 */

import { ExitIntentDetector } from "../triggers/ExitIntentDetector";
import { ScrollDepthTracker } from "../triggers/ScrollDepthTracker";
import { TimeDelayHandler } from "../triggers/TimeDelayHandler";
import { IdleTimer } from "../triggers/IdleTimer";
import { CartEventListener } from "../triggers/CartEventListener";
import { CustomEventHandler } from "../triggers/CustomEventHandler";

export interface Campaign {
  id: string;
  clientTriggers?: {
    enhancedTriggers?: EnhancedTriggers;
  };
}

export interface EnhancedTriggers {
  page_load?: PageLoadTrigger;
  exit_intent?: ExitIntentTrigger;
  scroll_depth?: ScrollDepthTrigger;
  idle_timer?: IdleTimerTrigger;
  logic_operator?: "AND" | "OR";
  [key: string]: unknown;
}

export interface PageLoadTrigger {
  enabled: boolean;
  delay?: number; // milliseconds
  require_dom_ready?: boolean;
}

export interface ExitIntentTrigger {
  enabled: boolean;
  sensitivity?: "low" | "medium" | "high";
  delay?: number;
}

export interface ScrollDepthTrigger {
  enabled: boolean;
  depth_percentage?: number;
  direction?: "down" | "up";
}

export interface IdleTimerTrigger {
  enabled: boolean;
  idle_duration?: number; // seconds
}

export class TriggerManager {
  private cleanupFunctions: Array<() => void> = [];
  private exitIntentDetector: ExitIntentDetector | null = null;
  private scrollDepthTracker: ScrollDepthTracker | null = null;
  private timeDelayHandler: TimeDelayHandler | null = null;
  private idleTimer: IdleTimer | null = null;
  private cartEventListener: CartEventListener | null = null;
  private customEventHandler: CustomEventHandler | null = null;

  /**
   * Evaluate all triggers for a campaign
   * Returns true if campaign should be shown
   */
  async evaluateTriggers(campaign: Campaign): Promise<boolean> {
    const triggers = campaign.clientTriggers?.enhancedTriggers;

    // If no triggers defined, show immediately
    if (!triggers || Object.keys(triggers).length === 0) {
      return true;
    }

    // Get logic operator (default: AND)
    const logicOperator = triggers.logic_operator || "AND";

    // Evaluate each trigger
    const results: boolean[] = [];

    // Page Load Trigger
    if (triggers.page_load !== undefined) {
      const result = await this.checkPageLoad(triggers.page_load);
      results.push(result);
    }

    // Scroll Depth Trigger
    if (triggers.scroll_depth !== undefined) {
      const result = await this.checkScrollDepth(triggers.scroll_depth);
      results.push(result);
    }

    // Exit Intent Trigger
    if (triggers.exit_intent !== undefined) {
      const result = await this.checkExitIntent(triggers.exit_intent);
      results.push(result);
    }

    // Idle Timer Trigger
    if (triggers.idle_timer !== undefined) {
      const result = await this.checkIdleTimer(triggers.idle_timer);
      results.push(result);
    }

    // If no enabled triggers, show immediately
    if (results.length === 0) {
      return true;
    }

    // Combine results based on logic operator
    if (logicOperator === "OR") {
      return results.some((r) => r === true);
    } else {
      // AND logic
      return results.every((r) => r === true);
    }
  }

  /**
   * Check page load trigger
   */
  private async checkPageLoad(trigger: PageLoadTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      return false;
    }

    const delay = trigger.delay || 0;

    if (delay > 0) {
      await this.delay(delay);
    }

    return true;
  }

  /**
   * Check scroll depth trigger
   */
  private async checkScrollDepth(trigger: ScrollDepthTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      return false;
    }

    return new Promise((resolve) => {
      this.scrollDepthTracker = new ScrollDepthTracker({
        depthPercentage: trigger.depth_percentage || 50,
        direction: trigger.direction || "down",
      });

      this.scrollDepthTracker.start(() => {
        resolve(true);
      });

      // Check if already at depth
      if (this.scrollDepthTracker.hasReachedDepth()) {
        this.scrollDepthTracker.destroy();
        resolve(true);
      }
    });
  }

  /**
   * Check exit intent trigger
   */
  private async checkExitIntent(trigger: ExitIntentTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      return false;
    }

    return new Promise((resolve) => {
      this.exitIntentDetector = new ExitIntentDetector({
        sensitivity: trigger.sensitivity || "medium",
        delay: trigger.delay || 1000,
      });

      this.exitIntentDetector.start(() => {
        resolve(true);
      });
    });
  }

  /**
   * Check idle timer trigger
   */
  private async checkIdleTimer(trigger: IdleTimerTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      return false;
    }

    return new Promise((resolve) => {
      this.idleTimer = new IdleTimer({
        idleDuration: (trigger.idle_duration || 30) * 1000, // Convert seconds to ms
      });

      this.idleTimer.start(() => {
        resolve(true);
      });
    });
  }

  /**
   * Helper: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, ms);
      this.cleanupFunctions.push(() => clearTimeout(timeout));
    });
  }

  /**
   * Cleanup all triggers
   */
  cleanup(): void {
    this.cleanupFunctions.forEach((fn) => fn());
    this.cleanupFunctions = [];

    // Cleanup all trigger instances
    if (this.exitIntentDetector) {
      this.exitIntentDetector.destroy();
      this.exitIntentDetector = null;
    }
    if (this.scrollDepthTracker) {
      this.scrollDepthTracker.destroy();
      this.scrollDepthTracker = null;
    }
    if (this.timeDelayHandler) {
      this.timeDelayHandler.destroy();
      this.timeDelayHandler = null;
    }
    if (this.idleTimer) {
      this.idleTimer.destroy();
      this.idleTimer = null;
    }
    if (this.cartEventListener) {
      this.cartEventListener.destroy();
      this.cartEventListener = null;
    }
    if (this.customEventHandler) {
      this.customEventHandler.destroy();
      this.customEventHandler = null;
    }
  }
}

