/**
 * Trigger Model (Stub)
 *
 * TODO: Implement trigger model for managing trigger configurations
 * This is a stub to fix import errors
 */

import type { TriggerType as TriggerTypeEnum, TriggerRule, EnhancedTrigger } from "../types/enhanced-triggers.types";
import type { CampaignGoal } from "@prisma/client";

// Re-export TriggerType for backward compatibility
export type { TriggerType } from "../types/enhanced-triggers.types";

/**
 * Trigger Configuration
 */
export interface TriggerConfig {
  type?: TriggerTypeEnum;
  enabled?: boolean;
  delay?: number;
  conditions?: TriggerCondition[];
  scheduling?: TriggerScheduling;
  [key: string]: unknown;
}

/**
 * Trigger Condition
 */
export interface TriggerCondition {
  field: string;
  operator: string;
  value: unknown;
  required?: boolean;
}

/**
 * Trigger Scheduling
 */
export interface TriggerScheduling {
  enabled?: boolean;
  schedule?: {
    startDate?: Date;
    endDate?: Date;
    daysOfWeek?: number[];
    timeRanges?: Array<{ start: string; end: string }>;
    days?: number[];
    startTime?: string;
    endTime?: string;
    timezone?: string;
  };
  startDate?: Date;
  endDate?: Date;
  daysOfWeek?: number[];
  timeRanges?: Array<{ start: string; end: string }>;
  days?: number[];
  startTime?: string;
  endTime?: string;
  timezone?: string;
  exceptions?: unknown[];
}

/**
 * Trigger Type Metadata
 */
export interface TriggerTypeMetadata {
  name: string;
  description: string;
  icon?: string;
  category?: string;
  supportsMobile?: boolean;
  requiresEngagement?: boolean;
}

/**
 * Trigger Type Metadata Map
 */
export const TRIGGER_TYPE_METADATA: Record<TriggerTypeEnum, TriggerTypeMetadata> = {
  page_load: {
    name: "Page Load",
    description: "Trigger when the page loads",
    category: "timing",
  },
  exit_intent: {
    name: "Exit Intent",
    description: "Trigger when user is about to leave",
    category: "behavior",
  },
  scroll_depth: {
    name: "Scroll Depth",
    description: "Trigger at specific scroll percentage",
    category: "behavior",
  },
  time_on_page: {
    name: "Time on Page",
    description: "Trigger after time spent on page",
    category: "timing",
  },
  click: {
    name: "Click",
    description: "Trigger on element click",
    category: "interaction",
  },
  cart_abandonment: {
    name: "Cart Abandonment",
    description: "Trigger when cart is abandoned",
    category: "commerce",
  },
  product_view: {
    name: "Product View",
    description: "Trigger when product is viewed",
    category: "commerce",
  },
  custom_event: {
    name: "Custom Event",
    description: "Trigger on custom JavaScript event",
    category: "advanced",
  },
};

/**
 * Trigger Config Manager
 */
export class TriggerConfigManager {
  /**
   * Get trigger templates by campaign goal
   */
  static getTemplatesByGoal(_goal: CampaignGoal): Array<{ type: TriggerTypeEnum; config: TriggerConfig }> {
    // TODO: Implement actual template logic
    return [];
  }

  /**
   * Validate trigger configuration
   */
  static validateTriggerConfig(_config: TriggerConfig): { valid: boolean; errors?: string[] } {
    // TODO: Implement actual validation logic
    return { valid: true };
  }

  /**
   * Get default trigger configuration for a trigger type
   */
  static getDefaultTriggerConfig(type: TriggerTypeEnum): TriggerConfig {
    return {
      type,
      enabled: true,
      delay: 0,
      conditions: [],
    };
  }
}

export class Trigger {
  id: string;
  name: string;
  description?: string;
  rules: TriggerRule[];
  condition: "and" | "or";
  delay?: number;
  priority?: number;

  constructor(data: EnhancedTrigger) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.rules = data.rules;
    this.condition = data.condition;
    this.delay = data.delay;
    this.priority = data.priority;
  }

  /**
   * Evaluate if trigger conditions are met
   */
  evaluate(_context: Record<string, unknown>): boolean {
    // TODO: Implement actual trigger evaluation logic
    return true;
  }

  /**
   * Convert to JSON
   */
  toJSON(): EnhancedTrigger {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      rules: this.rules,
      condition: this.condition,
      delay: this.delay,
      priority: this.priority,
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data: EnhancedTrigger): Trigger {
    return new Trigger(data);
  }
}

export default Trigger;

