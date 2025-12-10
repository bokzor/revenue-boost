/**
 * Integration Tests for Flash Sale Campaigns
 *
 * Tests complete Flash Sale configurations with schema validation:
 * - All timer modes (duration, fixed_end, personal, stock_limited)
 * - All inventory modes (pseudo, real)
 * - Reservation timer combinations
 * - Complete configuration workflows
 * - Edge cases and validation
 */

import { describe, it, expect } from 'vitest';
import { FlashSaleContentSchema } from '~/domains/campaigns/types/campaign';

describe('Flash Sale Campaign Integration Tests', () => {

  // ========== TIMER MODE INTEGRATION TESTS ==========

  describe('Timer Mode Configurations', () => {
    it('should validate duration timer mode', () => {
      const config = {
        headline: 'Flash Sale!',
        urgencyMessage: 'Hurry!',
        buttonText: 'Shop',
        successMessage: 'Done!',
        discountPercentage: 30,
        showCountdown: true,
        countdownDuration: 3600,
        timer: {
          mode: 'duration' as const,
          durationSeconds: 3600,
          timezone: 'shop' as const,
          onExpire: 'auto_hide' as const,
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timer?.mode).toBe('duration');
        expect(result.data.timer?.durationSeconds).toBe(3600);
      }
    });

    it('should validate fixed_end timer mode with end time', () => {
      const config = {
        headline: 'Sale Ends at Midnight!',
        urgencyMessage: 'Last chance!',
        buttonText: 'Shop',
        successMessage: 'Done!',
        discountPercentage: 40,
        timer: {
          mode: 'fixed_end' as const,
          endTimeISO: '2024-12-31T23:59:59Z',
          timezone: 'shop' as const,
          onExpire: 'swap_message' as const,
          expiredMessage: 'Sale has ended!',
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timer?.mode).toBe('fixed_end');
        expect(result.data.timer?.endTimeISO).toBe('2024-12-31T23:59:59Z');
        expect(result.data.timer?.expiredMessage).toBe('Sale has ended!');
      }
    });

    it('should validate personal timer mode with window', () => {
      const config = {
        headline: 'Your Personal Offer!',
        urgencyMessage: 'Claim now!',
        buttonText: 'Claim',
        successMessage: 'Claimed!',
        discountPercentage: 25,
        timer: {
          mode: 'personal' as const,
          personalWindowSeconds: 1800,
          timezone: 'visitor' as const,
          onExpire: 'collapse' as const,
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timer?.mode).toBe('personal');
        expect(result.data.timer?.personalWindowSeconds).toBe(1800);
        expect(result.data.timer?.timezone).toBe('visitor');
      }
    });

    it('should validate stock_limited timer mode', () => {
      const config = {
        headline: 'Until Stock Runs Out!',
        urgencyMessage: 'Limited stock!',
        buttonText: 'Buy',
        successMessage: 'Purchased!',
        discountPercentage: 35,
        timer: {
          mode: 'stock_limited' as const,
          timezone: 'shop' as const,
          onExpire: 'auto_hide' as const,
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timer?.mode).toBe('stock_limited');
      }
    });
  });

  // ========== INVENTORY MODE INTEGRATION TESTS ==========

  describe('Inventory Mode Configurations', () => {
    it('should validate pseudo inventory mode', () => {
      const config = {
        headline: 'Limited Stock!',
        urgencyMessage: 'Only X left!',
        buttonText: 'Buy',
        successMessage: 'Got it!',
        discountPercentage: 30,
        inventory: {
          mode: 'pseudo' as const,
          pseudoMax: 50,
          showOnlyXLeft: true,
          showThreshold: 10,
          soldOutBehavior: 'hide' as const,
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inventory?.mode).toBe('pseudo');
        expect(result.data.inventory?.pseudoMax).toBe(50);
        expect(result.data.inventory?.showThreshold).toBe(10);
      }
    });

    it('should validate real inventory mode with products', () => {
      const config = {
        headline: 'Real Stock Alert!',
        urgencyMessage: 'Selling fast!',
        buttonText: 'Buy',
        successMessage: 'Reserved!',
        discountPercentage: 40,
        inventory: {
          mode: 'real' as const,
          productIds: ['gid://shopify/Product/123', 'gid://shopify/Product/456'],
          showOnlyXLeft: true,
          showThreshold: 5,
          soldOutBehavior: 'missed_it' as const,
          soldOutMessage: 'All gone!',
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inventory?.mode).toBe('real');
        expect(result.data.inventory?.productIds).toHaveLength(2);
        expect(result.data.inventory?.soldOutMessage).toBe('All gone!');
      }
    });
  });

  // ========== RESERVATION TIMER INTEGRATION TESTS ==========

  describe('Reservation Timer Configurations', () => {
    it('should validate enabled reservation timer', () => {
      const config = {
        headline: 'Reserved for You!',
        urgencyMessage: 'Claim fast!',
        buttonText: 'Claim',
        successMessage: 'Reserved!',
        discountPercentage: 25,
        reserve: {
          enabled: true,
          minutes: 15,
          label: 'Offer reserved for:',
          disclaimer: 'Inventory not guaranteed',
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reserve?.enabled).toBe(true);
        expect(result.data.reserve?.minutes).toBe(15);
        expect(result.data.reserve?.label).toBe('Offer reserved for:');
        expect(result.data.reserve?.disclaimer).toBe('Inventory not guaranteed');
      }
    });

    it('should validate disabled reservation timer', () => {
      const config = {
        headline: 'Flash Sale!',
        urgencyMessage: 'Hurry!',
        buttonText: 'Shop',
        successMessage: 'Done!',
        discountPercentage: 30,
        reserve: {
          enabled: false,
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reserve?.enabled).toBe(false);
      }
    });
  });

  // ========== COMPLETE CONFIGURATION INTEGRATION TESTS ==========

  describe('Complete Configuration Workflows', () => {
    it('should validate complete Flash Sale with all features', () => {
      const config = {
        headline: 'Ultimate Flash Sale!',
        urgencyMessage: 'Ends soon!',
        subheadline: 'Best deal ever',
        buttonText: 'Shop Now',
        ctaUrl: '/collections/sale',
        dismissLabel: 'No thanks',
        successMessage: 'Discount applied!',
        failureMessage: 'Error occurred',
        discountPercentage: 50,
        showCountdown: true,
        countdownDuration: 7200,
        hideOnExpiry: true,
        autoHideOnExpire: false,
        timer: {
          mode: 'fixed_end' as const,
          endTimeISO: '2024-12-31T23:59:59Z',
          timezone: 'shop' as const,
          onExpire: 'swap_message' as const,
          expiredMessage: 'Sale ended!',
        },
        inventory: {
          mode: 'real' as const,
          productIds: ['gid://shopify/Product/123'],
          showOnlyXLeft: true,
          showThreshold: 5,
          soldOutBehavior: 'missed_it' as const,
          soldOutMessage: 'Sold out!',
        },
        reserve: {
          enabled: true,
          minutes: 10,
          label: 'Reserved:',
          disclaimer: 'Limited',
        },
        presentation: {
          badgeStyle: 'pill' as const,
          showTimer: true,
          showInventory: true,
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headline).toBe('Ultimate Flash Sale!');
        expect(result.data.timer?.mode).toBe('fixed_end');
        expect(result.data.inventory?.mode).toBe('real');
        expect(result.data.reserve?.enabled).toBe(true);
        expect(result.data.presentation?.badgeStyle).toBe('pill');
      }
    });

    it('should validate minimal Flash Sale configuration', () => {
      const config = {
        headline: 'Sale!',
        urgencyMessage: 'Now!',
        buttonText: 'Buy',
        successMessage: 'Done!',
        discountPercentage: 20,
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headline).toBe('Sale!');
        expect(result.data.discountPercentage).toBe(20);
      }
    });
  });

  // ========== COMBINATION TESTS ==========

  describe('Feature Combination Tests', () => {
    it('should validate timer + inventory combination', () => {
      const config = {
        headline: 'Limited Time & Stock!',
        urgencyMessage: 'Double urgency!',
        buttonText: 'Grab It',
        successMessage: 'Secured!',
        discountPercentage: 45,
        timer: {
          mode: 'duration' as const,
          durationSeconds: 1800,
        },
        inventory: {
          mode: 'pseudo' as const,
          pseudoMax: 25,
          showOnlyXLeft: true,
          showThreshold: 5,
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timer?.mode).toBe('duration');
        expect(result.data.inventory?.mode).toBe('pseudo');
      }
    });

    it('should validate timer + reservation combination', () => {
      const config = {
        headline: 'Reserved Flash Sale!',
        urgencyMessage: 'Your exclusive offer!',
        buttonText: 'Claim',
        successMessage: 'Claimed!',
        discountPercentage: 35,
        timer: {
          mode: 'personal' as const,
          personalWindowSeconds: 900,
        },
        reserve: {
          enabled: true,
          minutes: 15,
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timer?.mode).toBe('personal');
        expect(result.data.reserve?.enabled).toBe(true);
      }
    });

    it('should validate inventory + reservation combination', () => {
      const config = {
        headline: 'Reserved Stock!',
        urgencyMessage: 'Claim your reserved item!',
        buttonText: 'Reserve',
        successMessage: 'Reserved!',
        discountPercentage: 30,
        inventory: {
          mode: 'real' as const,
          productIds: ['gid://shopify/Product/789'],
          showOnlyXLeft: true,
        },
        reserve: {
          enabled: true,
          minutes: 20,
          disclaimer: 'Subject to availability',
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inventory?.mode).toBe('real');
        expect(result.data.reserve?.enabled).toBe(true);
      }
    });

    it('should validate all features combined', () => {
      const config = {
        headline: 'Triple Threat Sale!',
        urgencyMessage: 'Timer + Stock + Reservation!',
        buttonText: 'Get It',
        successMessage: 'Success!',
        discountPercentage: 60,
        timer: {
          mode: 'fixed_end' as const,
          endTimeISO: '2025-01-01T00:00:00Z',
          onExpire: 'auto_hide' as const,
        },
        inventory: {
          mode: 'real' as const,
          productIds: ['gid://shopify/Product/111', 'gid://shopify/Product/222'],
          showThreshold: 3,
          soldOutBehavior: 'missed_it' as const,
        },
        reserve: {
          enabled: true,
          minutes: 10,
          label: 'Reserved for you:',
        },
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timer?.mode).toBe('fixed_end');
        expect(result.data.inventory?.mode).toBe('real');
        expect(result.data.reserve?.enabled).toBe(true);
      }
    });
  });

  // ========== VALIDATION ERROR TESTS ==========

  describe('Validation Error Handling', () => {
    it('should accept minimal config with defaults', () => {
      const config = {
        headline: 'Sale!',
        // Other fields are optional with defaults
      };

      const result = FlashSaleContentSchema.safeParse(config);
      // FlashSaleContentSchema has optional fields with defaults
      expect(result.success).toBe(true);
    });

    it('should reject invalid discount percentage', () => {
      const config = {
        headline: 'Sale!',
        urgencyMessage: 'Now!',
        buttonText: 'Buy',
        successMessage: 'Done!',
        discountPercentage: 150, // Invalid: > 100
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject invalid countdown duration', () => {
      const config = {
        headline: 'Sale!',
        urgencyMessage: 'Now!',
        buttonText: 'Buy',
        successMessage: 'Done!',
        discountPercentage: 30,
        countdownDuration: 30, // Invalid: < 60
      };

      const result = FlashSaleContentSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});

