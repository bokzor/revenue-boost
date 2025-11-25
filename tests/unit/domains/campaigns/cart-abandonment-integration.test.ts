/**
 * Integration Tests for Complete Cart Abandonment Configuration
 * 
 * Tests realistic combinations of all configuration options
 */

import { describe, it, expect } from 'vitest';
import { CartAbandonmentContentSchema, DiscountConfigSchema } from '~/domains/campaigns/types/campaign';

describe('Cart Abandonment - Real-World Configurations', () => {
  it('validates basic cart abandonment with urgency timer', () => {
    const content = {
      headline: 'Complete Your Order',
      subheadline: 'Your items are waiting for you',
      buttonText: 'Resume Checkout',
      successMessage: 'Redirecting to checkout...',
      showCartItems: true,
      maxItemsToShow: 3,
      showCartTotal: true,
      showUrgency: true,
      urgencyTimer: 300,
      urgencyMessage: 'Complete your order in {{time}} to save your cart',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
  });

  it('validates email-gated cart recovery with discount', () => {
    const content = {
      headline: 'Get 10% Off Your Order',
      subheadline: 'Enter your email to receive your discount code',
      buttonText: 'Get Discount',
      successMessage: 'Check your email for your discount code!',
      enableEmailRecovery: true,
      requireEmailBeforeCheckout: true,
      emailPlaceholder: 'your@email.com',
      emailButtonText: 'Send My Discount',
      emailSuccessMessage: 'Discount code sent to your email!',
      emailErrorMessage: 'Please enter a valid email address',
      showCartItems: true,
      showCartTotal: true,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
  });

  it('validates cart abandonment with stock warnings and urgency', () => {
    const content = {
      headline: 'Hurry! Items Selling Fast',
      subheadline: 'Complete your order before they\'re gone',
      buttonText: 'Complete Purchase',
      successMessage: 'Redirecting...',
      showCartItems: true,
      maxItemsToShow: 5,
      showCartTotal: true,
      showUrgency: true,
      urgencyTimer: 600,
      urgencyMessage: 'Your cart expires in {{time}}',
      showStockWarnings: true,
      stockWarningMessage: 'Only a few items left in stock!',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
  });

  it('validates minimal cart abandonment configuration', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Checkout',
      successMessage: 'Success',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
    if (result.success) {
      // Verify defaults are applied
      expect(result.data.showCartItems).toBe(true);
      expect(result.data.maxItemsToShow).toBe(3);
      expect(result.data.showCartTotal).toBe(true);
      expect(result.data.showUrgency).toBe(true);
      expect(result.data.urgencyTimer).toBe(300);
      expect(result.data.showStockWarnings).toBe(false);
      expect(result.data.enableEmailRecovery).toBe(false);
      expect(result.data.requireEmailBeforeCheckout).toBe(false);
      expect(result.data.currency).toBe('USD');
    }
  });

  it('validates maximal cart abandonment configuration', () => {
    const content = {
      // Base fields
      headline: 'Complete Your Order & Save 15%',
      subheadline: 'Your exclusive discount is waiting',
      buttonText: 'Get My Discount',
      dismissLabel: 'Maybe Later',
      successMessage: 'Discount applied! Redirecting to checkout...',
      failureMessage: 'Oops! Something went wrong. Please try again.',
      ctaText: 'Save 15% Now',

      // Cart display
      showCartItems: true,
      maxItemsToShow: 10,
      showCartTotal: true,
      currency: 'EUR',

      // Urgency & scarcity
      showUrgency: true,
      urgencyTimer: 900,
      urgencyMessage: 'Complete in {{time}} to get 15% off',
      showStockWarnings: true,
      stockWarningMessage: 'Limited stock - order now!',

      // CTA
      ctaUrl: '/checkout?discount=CART15',
      saveForLaterText: 'Email Me This Cart',

      // Email recovery
      enableEmailRecovery: true,
      requireEmailBeforeCheckout: true,
      emailPlaceholder: 'Enter your email for 15% off',
      emailButtonText: 'Get My Discount Code',
      emailSuccessMessage: 'Your 15% discount code has been sent to your email!',
      emailErrorMessage: 'Please provide a valid email address',
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
  });
});

describe('Cart Abandonment - Discount Integration', () => {
  it('validates percentage discount with auto-apply', () => {
    const discount = {
      enabled: true,
      showInPreview: true,
      type: 'single_use' as const,
      valueType: 'PERCENTAGE' as const,
      value: 10,
      deliveryMode: 'auto_apply_only' as const,
      expiryDays: 7,
    };

    const result = DiscountConfigSchema.safeParse(discount);
    expect(result.success).toBe(true);
  });

  it('validates fixed amount discount with code display', () => {
    const discount = {
      enabled: true,
      type: 'shared' as const,
      valueType: 'FIXED_AMOUNT' as const,
      value: 5,
      code: 'SAVE5',
      deliveryMode: 'show_code_always' as const,
      expiryDays: 30,
      minimumAmount: 25,
    };

    const result = DiscountConfigSchema.safeParse(discount);
    expect(result.success).toBe(true);
  });

  it('validates free shipping discount', () => {
    const discount = {
      enabled: true,
      type: 'shared' as const,
      valueType: 'FREE_SHIPPING' as const,
      code: 'FREESHIP',
      deliveryMode: 'show_code_fallback' as const,
      expiryDays: 14,
      minimumAmount: 50,
    };

    const result = DiscountConfigSchema.safeParse(discount);
    expect(result.success).toBe(true);
  });

  it('validates email-authorized discount', () => {
    const discount = {
      enabled: true,
      type: 'single_use' as const,
      valueType: 'PERCENTAGE' as const,
      value: 15,
      deliveryMode: 'show_in_popup_authorized_only' as const,
      requireEmailMatch: true,
      authorizedEmail: 'customer@example.com',
      expiryDays: 3,
    };

    const result = DiscountConfigSchema.safeParse(discount);
    expect(result.success).toBe(true);
  });

  it('validates discount with usage limits', () => {
    const discount = {
      enabled: true,
      type: 'shared' as const,
      valueType: 'PERCENTAGE' as const,
      value: 20,
      code: 'FLASH20',
      deliveryMode: 'show_code_always' as const,
      usageLimit: 100,
      expiryDays: 1,
    };

    const result = DiscountConfigSchema.safeParse(discount);
    expect(result.success).toBe(true);
  });
});

describe('Cart Abandonment - Edge Cases & Validation', () => {
  it('rejects content with missing required fields', () => {
    const invalidContent = {
      subheadline: 'Missing headline and button text',
    };

    const result = CartAbandonmentContentSchema.safeParse(invalidContent);
    expect(result.success).toBe(false);
  });

  it('rejects maxItemsToShow out of range', () => {
    const invalidContent = {
      headline: 'Complete Your Order',
      buttonText: 'Checkout',
      successMessage: 'Success',
      maxItemsToShow: 15, // Max is 10
    };

    const result = CartAbandonmentContentSchema.safeParse(invalidContent);
    expect(result.success).toBe(false);
  });

  it('rejects urgencyTimer out of range', () => {
    const invalidContent = {
      headline: 'Complete Your Order',
      buttonText: 'Checkout',
      successMessage: 'Success',
      urgencyTimer: 30, // Min is 60
    };

    const result = CartAbandonmentContentSchema.safeParse(invalidContent);
    expect(result.success).toBe(false);
  });

  it('rejects invalid email in authorizedEmail', () => {
    const invalidDiscount = {
      enabled: true,
      authorizedEmail: 'not-an-email',
    };

    const result = DiscountConfigSchema.safeParse(invalidDiscount);
    expect(result.success).toBe(false);
  });

  it('rejects negative discount value', () => {
    const invalidDiscount = {
      enabled: true,
      value: -10,
    };

    const result = DiscountConfigSchema.safeParse(invalidDiscount);
    expect(result.success).toBe(false);
  });

  it('accepts empty optional fields', () => {
    const content = {
      headline: 'Complete Your Order',
      buttonText: 'Checkout',
      successMessage: 'Success',
      subheadline: undefined,
      dismissLabel: undefined,
      failureMessage: undefined,
      ctaText: undefined,
      urgencyMessage: undefined,
      stockWarningMessage: undefined,
      ctaUrl: undefined,
      saveForLaterText: undefined,
      emailPlaceholder: undefined,
      emailButtonText: undefined,
      emailSuccessMessage: undefined,
      emailErrorMessage: undefined,
    };

    const result = CartAbandonmentContentSchema.safeParse(content);
    expect(result.success).toBe(true);
  });
});

describe('Cart Abandonment - Type Safety', () => {
  it('validates all enum values are accepted', () => {
    // Test all delivery modes
    const deliveryModes = [
      'auto_apply_only',
      'show_code_fallback',
      'show_code_always',
      'show_in_popup_authorized_only',
    ] as const;

    deliveryModes.forEach(mode => {
      const discount = { deliveryMode: mode };
      const result = DiscountConfigSchema.safeParse(discount);
      expect(result.success).toBe(true);
    });

    // Test all value types
    const valueTypes = ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'] as const;

    valueTypes.forEach(type => {
      const discount = { valueType: type };
      const result = DiscountConfigSchema.safeParse(discount);
      expect(result.success).toBe(true);
    });

    // Test all discount types
    const discountTypes = ['shared', 'single_use'] as const;

    discountTypes.forEach(type => {
      const discount = { type };
      const result = DiscountConfigSchema.safeParse(discount);
      expect(result.success).toBe(true);
    });
  });
});

