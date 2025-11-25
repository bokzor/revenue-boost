/**
 * Unit Tests for Cart Abandonment CTA Options
 * 
 * Tests call-to-action URLs and save-for-later functionality
 */

import { describe, it, expect } from 'vitest';
import { CartAbandonmentContentSchema } from '~/domains/campaigns/types/campaign';

describe('CartAbandonmentContentSchema - Call to Action', () => {
  it('accepts optional ctaUrl', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      ctaUrl: '/checkout',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ctaUrl).toBe('/checkout');
    }
  });

  it('accepts various ctaUrl formats', () => {
    const urls = [
      '/checkout',
      '/cart',
      'https://example.com/checkout',
      '/collections/sale',
      '/pages/special-offer',
    ];

    urls.forEach(url => {
      const content = {
        headline: 'Complete Your Order',
        buttonText: 'Resume Checkout',
        successMessage: 'Success!',
        ctaUrl: url,
      };

      const result = CartAbandonmentContentSchema.safeParse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ctaUrl).toBe(url);
      }
    });
  });

  it('accepts optional saveForLaterText', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      saveForLaterText: 'Save for Later',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.saveForLaterText).toBe('Save for Later');
    }
  });

  it('accepts various saveForLaterText formats', () => {
    const texts = [
      'Save for Later',
      'Remind Me Later',
      'Email Me This Cart',
      'Save My Cart',
      'Continue Shopping',
    ];

    texts.forEach(text => {
      const content = {
        headline: 'Complete Your Order',
        buttonText: 'Resume Checkout',
        successMessage: 'Success!',
        saveForLaterText: text,
      };

      const result = CartAbandonmentContentSchema.safeParse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.saveForLaterText).toBe(text);
      }
    });
  });

  it('accepts both ctaUrl and saveForLaterText together', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      ctaUrl: '/checkout',
      saveForLaterText: 'Save for Later',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ctaUrl).toBe('/checkout');
      expect(result.data.saveForLaterText).toBe('Save for Later');
    }
  });

  it('accepts complete CTA configuration', () => {
    const content = {
      headline: 'Complete Your Order',
      subheadline: 'Your items are waiting',
      buttonText: 'Complete Purchase',
      ctaText: 'Get 10% Off Now',
      ctaUrl: '/checkout?discount=SAVE10',
      saveForLaterText: 'Email Me This Cart',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.headline).toBe('Complete Your Order');
      expect(result.data.subheadline).toBe('Your items are waiting');
      expect(result.data.buttonText).toBe('Complete Purchase');
      expect(result.data.ctaText).toBe('Get 10% Off Now');
      expect(result.data.ctaUrl).toBe('/checkout?discount=SAVE10');
      expect(result.data.saveForLaterText).toBe('Email Me This Cart');
    }
  });
});

describe('CartAbandonmentContentSchema - Complete Configuration', () => {
  it('accepts all content options together', () => {
    const content = {
      // Base fields
      headline: 'Complete Your Order',
      subheadline: 'Your items are waiting',
      buttonText: 'Resume Checkout',
      dismissLabel: 'No thanks',
      successMessage: 'Thank you!',
      failureMessage: 'Something went wrong',
      ctaText: 'Get 10% Off',

      // Cart display
      showCartItems: true,
      maxItemsToShow: 5,
      showCartTotal: true,
      currency: 'EUR',

      // Urgency & scarcity
      showUrgency: true,
      urgencyTimer: 600,
      urgencyMessage: 'Complete in {{time}}',
      showStockWarnings: true,
      stockWarningMessage: 'Low stock!',

      // CTA
      ctaUrl: '/checkout',
      saveForLaterText: 'Save for Later',

      // Email recovery
      enableEmailRecovery: true,
      requireEmailBeforeCheckout: true,
      emailPlaceholder: 'your@email.com',
      emailButtonText: 'Get Discount',
      emailSuccessMessage: 'Discount sent!',
      emailErrorMessage: 'Invalid email',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
  });
});

