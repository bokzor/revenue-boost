/**
 * Unit Tests for Cart Abandonment Email Recovery Options
 * 
 * Tests email capture, email-gated checkout, and related fields
 */

import { describe, it, expect } from 'vitest';
import { CartAbandonmentContentSchema } from '~/domains/campaigns/types/campaign';

describe('CartAbandonmentContentSchema - Email Recovery', () => {
  it('defaults enableEmailRecovery to false', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enableEmailRecovery).toBe(false);
    }
  });

  it('accepts enableEmailRecovery as true', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      enableEmailRecovery: true,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enableEmailRecovery).toBe(true);
    }
  });

  it('defaults requireEmailBeforeCheckout to false', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requireEmailBeforeCheckout).toBe(false);
    }
  });

  it('accepts requireEmailBeforeCheckout as true', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      requireEmailBeforeCheckout: true,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requireEmailBeforeCheckout).toBe(true);
    }
  });

  it('accepts optional emailPlaceholder', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      enableEmailRecovery: true,
      emailPlaceholder: 'Enter your email address',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emailPlaceholder).toBe('Enter your email address');
    }
  });

  it('accepts various emailPlaceholder formats', () => {
    const placeholders = [
      'Your email',
      'email@example.com',
      'Enter email to continue',
      'Email address',
    ];

    placeholders.forEach(placeholder => {
      const content = {
        headline: 'Complete Your Order',
        buttonText: 'Resume Checkout',
        successMessage: 'Success!',
        emailPlaceholder: placeholder,
      };

      const result = CartAbandonmentContentSchema.safeParse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emailPlaceholder).toBe(placeholder);
      }
    });
  });

  it('accepts optional emailButtonText', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      enableEmailRecovery: true,
      emailButtonText: 'Continue to Checkout',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emailButtonText).toBe('Continue to Checkout');
    }
  });

  it('accepts various emailButtonText formats', () => {
    const buttonTexts = [
      'Submit',
      'Get My Discount',
      'Continue',
      'Save & Checkout',
    ];

    buttonTexts.forEach(buttonText => {
      const content = {
        headline: 'Complete Your Order',
        buttonText: 'Resume Checkout',
        successMessage: 'Success!',
        emailButtonText: buttonText,
      };

      const result = CartAbandonmentContentSchema.safeParse(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.emailButtonText).toBe(buttonText);
      }
    });
  });

  it('accepts optional emailSuccessMessage', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      emailSuccessMessage: 'Check your email for your discount code!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emailSuccessMessage).toBe('Check your email for your discount code!');
    }
  });

  it('accepts optional emailErrorMessage', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      emailErrorMessage: 'Please enter a valid email address',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.emailErrorMessage).toBe('Please enter a valid email address');
    }
  });

  it('accepts complete email recovery configuration', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      enableEmailRecovery: true,
      requireEmailBeforeCheckout: true,
      emailPlaceholder: 'your@email.com',
      emailButtonText: 'Get Discount',
      emailSuccessMessage: 'Discount sent to your email!',
      emailErrorMessage: 'Invalid email',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enableEmailRecovery).toBe(true);
      expect(result.data.requireEmailBeforeCheckout).toBe(true);
      expect(result.data.emailPlaceholder).toBe('your@email.com');
      expect(result.data.emailButtonText).toBe('Get Discount');
      expect(result.data.emailSuccessMessage).toBe('Discount sent to your email!');
      expect(result.data.emailErrorMessage).toBe('Invalid email');
    }
  });

  it('accepts email recovery without requiring email before checkout', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      enableEmailRecovery: true,
      requireEmailBeforeCheckout: false,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enableEmailRecovery).toBe(true);
      expect(result.data.requireEmailBeforeCheckout).toBe(false);
    }
  });

  it('accepts requireEmailBeforeCheckout without enableEmailRecovery', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Resume Checkout',
      successMessage: 'Success!',
      enableEmailRecovery: false,
      requireEmailBeforeCheckout: true,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enableEmailRecovery).toBe(false);
      expect(result.data.requireEmailBeforeCheckout).toBe(true);
    }
  });
});
