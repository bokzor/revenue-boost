/**
 * Unit Tests for Cart Abandonment Urgency & Scarcity Options
 * 
 * Tests urgency timer, urgency messages, and stock warnings
 */

import { describe, it, expect } from 'vitest';
import { CartAbandonmentContentSchema } from '~/domains/campaigns/types/campaign';

describe('CartAbandonmentContentSchema - Urgency & Scarcity', () => {
  it('defaults showUrgency to true', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showUrgency).toBe(true);
    }
  });

  it('accepts showUrgency as false', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      showUrgency: false,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showUrgency).toBe(false);
    }
  });

  it('defaults urgencyTimer to 300 seconds (5 minutes)', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urgencyTimer).toBe(300);
    }
  });

  it('accepts urgencyTimer between 60 and 3600 seconds', () => {
    const validTimers = [60, 120, 300, 600, 1800, 3600];

    validTimers.forEach(timer => {
      const content = {
        headline: 'Complete Your Order',
        buttonText: 'Resume Checkout',
        successMessage: 'Success!',
        urgencyTimer: timer,
      };

      const result = CartAbandonmentContentSchema.safeParse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.urgencyTimer).toBe(timer);
      }
    });
  });

  it('rejects urgencyTimer less than 60 seconds', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      urgencyTimer: 59,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(false);
  });

  it('rejects urgencyTimer greater than 3600 seconds', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      urgencyTimer: 3601,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(false);
  });

  it('rejects non-integer urgencyTimer', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      urgencyTimer: 300.5,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(false);
  });

  it('accepts optional urgencyMessage', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      urgencyMessage: 'Complete your order in {{time}} to save 10%',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.urgencyMessage).toBe('Complete your order in {{time}} to save 10%');
    }
  });

  it('accepts urgencyMessage with various placeholders', () => {
    const messages = [
      'Hurry! Only {{time}} left',
      'Your cart expires in {{time}}',
      'Complete checkout within {{time}}',
      'Limited time: {{time}} remaining',
    ];

    messages.forEach(message => {
      const content = {
        headline: 'Complete Your Order',
        buttonText: 'Resume Checkout',
        successMessage: 'Success!',
        urgencyMessage: message,
      };

      const result = CartAbandonmentContentSchema.safeParse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.urgencyMessage).toBe(message);
      }
    });
  });

  it('defaults showStockWarnings to false', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showStockWarnings).toBe(false);
    }
  });

  it('accepts showStockWarnings as true', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      showStockWarnings: true,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showStockWarnings).toBe(true);
    }
  });

  it('accepts optional stockWarningMessage', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      showStockWarnings: true,
      stockWarningMessage: 'Only 3 items left in stock!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stockWarningMessage).toBe('Only 3 items left in stock!');
    }
  });

  it('accepts stockWarningMessage with various formats', () => {
    const messages = [
      'Low stock alert!',
      'Only {{count}} left',
      'Hurry - limited availability',
      'Almost sold out!',
    ];

    messages.forEach(message => {
      const content = {
        headline: 'Complete Your Order',
        buttonText: 'Resume Checkout',
        successMessage: 'Success!',
        stockWarningMessage: message,
      };

      const result = CartAbandonmentContentSchema.safeParse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stockWarningMessage).toBe(message);
      }
    });
  });

  it('accepts combined urgency and stock warnings', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      showUrgency: true,
      urgencyTimer: 600,
      urgencyMessage: 'Complete in {{time}}',
      showStockWarnings: true,
      stockWarningMessage: 'Low stock!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showUrgency).toBe(true);
      expect(result.data.urgencyTimer).toBe(600);
      expect(result.data.urgencyMessage).toBe('Complete in {{time}}');
      expect(result.data.showStockWarnings).toBe(true);
      expect(result.data.stockWarningMessage).toBe('Low stock!');
    }
  });
});
