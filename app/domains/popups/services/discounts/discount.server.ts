/**
 * Discount Service (Stub)
 *
 * TODO: Implement discount code generation and management
 * This is a stub to fix import errors
 */

import type { ContentDiscountType } from "~/domains/campaigns/types/campaign";

// Re-export types from campaign domain for consistency
export type {
  DiscountConfig,
  DiscountDeliveryMode,
  ContentDiscountType,
} from "~/domains/campaigns/types/campaign";

export interface DiscountCode {
  code: string;
  type: ContentDiscountType;
  value: number;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount?: number;
}

export interface DiscountGenerationOptions {
  type: ContentDiscountType;
  value: number;
  prefix?: string;
  length?: number;
  expiresInDays?: number;
  usageLimit?: number;
}

/**
 * Generate a random discount code
 */
export function generateDiscountCode(options: DiscountGenerationOptions): DiscountCode {
  const prefix = options.prefix || "SAVE";
  const length = options.length || 8;
  const randomPart = Math.random()
    .toString(36)
    .substring(2, 2 + length)
    .toUpperCase();
  const code = `${prefix}${randomPart}`;

  const expiresAt = options.expiresInDays
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  return {
    code,
    type: options.type,
    value: options.value,
    expiresAt,
    usageLimit: options.usageLimit,
    usageCount: 0,
  };
}

/**
 * Validate a discount code
 */
export function validateDiscountCode(code: string): boolean {
  // TODO: Implement actual validation logic
  return code.length > 0;
}

/**
 * Apply a discount to a price
 */
export function applyDiscount(price: number, discount: DiscountCode): number {
  if (discount.type === "percentage") {
    return price * (1 - discount.value / 100);
  } else if (discount.type === "fixed_amount") {
    return Math.max(0, price - discount.value);
  }
  return price;
}
