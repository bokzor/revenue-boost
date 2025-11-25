/**
 * Unit Tests for Cart Abandonment Content Schema Validation
 * 
 * Tests all content configuration options defined in CartAbandonmentContentSchema
 */

import { describe, it, expect } from 'vitest';
import { CartAbandonmentContentSchema } from '~/domains/campaigns/types/campaign';

describe('CartAbandonmentContentSchema - Base Content Fields', () => {
  it('validates required base fields', () => {
    const validContent = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(validContent);
    expect(result.success).toBe(true);
  });

  it('rejects missing headline', () => {
    const invalidContent = {
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(invalidContent);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('headline');
    }
  });

  it('rejects empty headline', () => {
    const invalidContent = {
      headline: '',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(invalidContent);
    expect(result.success).toBe(false);
  });

  it('accepts optional subheadline', () => {
    const content = {
      headline: 'Complete Your Order',
      subheadline: 'Your items are waiting',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subheadline).toBe('Your items are waiting');
    }
  });

  it('accepts optional dismissLabel', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      dismissLabel: 'No thanks',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dismissLabel).toBe('No thanks');
    }
  });

  it('accepts optional failureMessage', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      failureMessage: 'Something went wrong',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.failureMessage).toBe('Something went wrong');
    }
  });

  it('accepts optional ctaText', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      ctaText: 'Get 10% Off',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ctaText).toBe('Get 10% Off');
    }
  });
});

describe('CartAbandonmentContentSchema - Cart Display Options', () => {
  it('defaults showCartItems to true', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showCartItems).toBe(true);
    }
  });

  it('accepts showCartItems as false', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      showCartItems: false,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showCartItems).toBe(false);
    }
  });

  it('defaults maxItemsToShow to 3', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxItemsToShow).toBe(3);
    }
  });

  it('accepts maxItemsToShow between 1 and 10', () => {
    const validValues = [1, 3, 5, 10];

    validValues.forEach(value => {
      const content = {
        headline: 'Complete Your Order',
        buttonText: 'Resume Checkout',
        successMessage: 'Success!',
        maxItemsToShow: value,
      };

      const result = CartAbandonmentContentSchema.safeParse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxItemsToShow).toBe(value);
      }
    });
  });

  it('rejects maxItemsToShow less than 1', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      maxItemsToShow: 0,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(false);
  });

  it('rejects maxItemsToShow greater than 10', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      maxItemsToShow: 11,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(false);
  });

  it('rejects non-integer maxItemsToShow', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      maxItemsToShow: 3.5,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(false);
  });

  it('defaults showCartTotal to true', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showCartTotal).toBe(true);
    }
  });

  it('accepts showCartTotal as false', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      showCartTotal: false,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showCartTotal).toBe(false);
    }
  });

  it('defaults currency to USD', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('USD');
    }
  });

  it('accepts custom currency codes', () => {
    const currencies = ['EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

    currencies.forEach(currency => {
      const content = {
        headline: 'Complete Your Order',
        buttonText: 'Resume Checkout',
        successMessage: 'Success!',
        currency,
      };

      const result = CartAbandonmentContentSchema.safeParse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe(currency);
      }
    });
  });
});
