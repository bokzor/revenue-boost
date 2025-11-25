/**
 * Unit Tests for Cart Abandonment Discount Configuration
 * 
 * Tests all discount configuration options from DiscountConfigSchema
 */

import { describe, it, expect } from 'vitest';
import { DiscountConfigSchema } from '~/domains/campaigns/types/campaign';

describe('DiscountConfigSchema - Basic Settings', () => {
  it('defaults enabled to false', () => {
    const config = {};
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(false);
    }
  });

  it('accepts enabled as true', () => {
    const config = { enabled: true };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(true);
    }
  });

  it('defaults showInPreview to true', () => {
    const config = {};
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showInPreview).toBe(true);
    }
  });

  it('accepts showInPreview as false', () => {
    const config = { showInPreview: false };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showInPreview).toBe(false);
    }
  });
});

describe('DiscountConfigSchema - Discount Type & Value', () => {
  it('accepts type as shared', () => {
    const config = { type: 'shared' as const };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('shared');
    }
  });

  it('accepts type as single_use', () => {
    const config = { type: 'single_use' as const };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('single_use');
    }
  });

  it('accepts valueType as PERCENTAGE', () => {
    const config = { valueType: 'PERCENTAGE' as const };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.valueType).toBe('PERCENTAGE');
    }
  });

  it('accepts valueType as FIXED_AMOUNT', () => {
    const config = { valueType: 'FIXED_AMOUNT' as const };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.valueType).toBe('FIXED_AMOUNT');
    }
  });

  it('accepts valueType as FREE_SHIPPING', () => {
    const config = { valueType: 'FREE_SHIPPING' as const };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.valueType).toBe('FREE_SHIPPING');
    }
  });

  it('accepts value as positive number', () => {
    const config = { value: 10 };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(10);
    }
  });

  it('accepts value as zero', () => {
    const config = { value: 0 };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(0);
    }
  });

  it('rejects negative value', () => {
    const config = { value: -10 };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(false);
  });

  it('accepts optional code', () => {
    const config = { code: 'SAVE10' };
    const result = DiscountConfigSchema.safeParse(config);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('SAVE10');
    }
  });

  it('accepts various discount codes', () => {
    const codes = ['SAVE10', 'WELCOME20', 'FREESHIP', 'CART15OFF', 'FLASH-SALE'];

    codes.forEach(code => {
      const config = { code };
      const result = DiscountConfigSchema.safeParse(config);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe(code);
      }
    });
  });
});

describe('DiscountConfigSchema - Delivery Mode', () => {
  it('accepts deliveryMode as auto_apply_only', () => {
    const config = { deliveryMode: 'auto_apply_only' as const };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deliveryMode).toBe('auto_apply_only');
    }
  });

  it('accepts deliveryMode as show_code_fallback', () => {
    const config = { deliveryMode: 'show_code_fallback' as const };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deliveryMode).toBe('show_code_fallback');
    }
  });

  it('accepts deliveryMode as show_code_always', () => {
    const config = { deliveryMode: 'show_code_always' as const };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deliveryMode).toBe('show_code_always');
    }
  });

  it('accepts deliveryMode as show_in_popup_authorized_only', () => {
    const config = { deliveryMode: 'show_in_popup_authorized_only' as const };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deliveryMode).toBe('show_in_popup_authorized_only');
    }
  });

  it('accepts requireLogin', () => {
    const config = { requireLogin: true };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requireLogin).toBe(true);
    }
  });

  it('accepts storeInMetafield', () => {
    const config = { storeInMetafield: true };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.storeInMetafield).toBe(true);
    }
  });

  it('accepts authorizedEmail', () => {
    const config = { authorizedEmail: 'customer@example.com' };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.authorizedEmail).toBe('customer@example.com');
    }
  });

  it('rejects invalid email format', () => {
    const config = { authorizedEmail: 'not-an-email' };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(false);
  });

  it('accepts requireEmailMatch', () => {
    const config = { requireEmailMatch: true };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requireEmailMatch).toBe(true);
    }
  });
});

describe('DiscountConfigSchema - Expiry & Limits', () => {
  it('accepts expiryDays', () => {
    const config = { expiryDays: 30 };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expiryDays).toBe(30);
    }
  });

  it('accepts various expiryDays values', () => {
    const days = [1, 7, 14, 30, 60, 90];

    days.forEach(expiryDays => {
      const config = { expiryDays };
      const result = DiscountConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.expiryDays).toBe(expiryDays);
      }
    });
  });

  it('accepts minimumAmount', () => {
    const config = { minimumAmount: 50 };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minimumAmount).toBe(50);
    }
  });

  it('accepts various minimumAmount values', () => {
    const amounts = [0, 10, 25, 50, 100];

    amounts.forEach(minimumAmount => {
      const config = { minimumAmount };
      const result = DiscountConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minimumAmount).toBe(minimumAmount);
      }
    });
  });

  it('rejects negative minimumAmount', () => {
    const config = { minimumAmount: -10 };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(false);
  });

  it('accepts usageLimit', () => {
    const config = { usageLimit: 100 };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.usageLimit).toBe(100);
    }
  });

  it('accepts various usageLimit values', () => {
    const limits = [1, 10, 50, 100, 1000];

    limits.forEach(usageLimit => {
      const config = { usageLimit };
      const result = DiscountConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.usageLimit).toBe(usageLimit);
      }
    });
  });

  it('rejects usageLimit less than 1', () => {
    const config = { usageLimit: 0 };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(false);
  });

  it('rejects non-integer usageLimit', () => {
    const config = { usageLimit: 10.5 };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(false);
  });
});

describe('DiscountConfigSchema - Auto-Apply & Code Presentation', () => {
  it('defaults autoApplyMode to ajax', () => {
    const config = {};
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.autoApplyMode).toBe('ajax');
    }
  });

  it('accepts all autoApplyMode values', () => {
    const modes = ['ajax', 'redirect', 'none'] as const;

    modes.forEach(mode => {
      const config = { autoApplyMode: mode };
      const result = DiscountConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.autoApplyMode).toBe(mode);
      }
    });
  });

  it('defaults codePresentation to show_code', () => {
    const config = {};
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.codePresentation).toBe('show_code');
    }
  });

  it('accepts all codePresentation values', () => {
    const presentations = ['show_code', 'hide_code'] as const;

    presentations.forEach(presentation => {
      const config = { codePresentation: presentation };
      const result = DiscountConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.codePresentation).toBe(presentation);
      }
    });
  });
});

describe('DiscountConfigSchema - Customer Eligibility', () => {
  it('accepts customerEligibility as everyone', () => {
    const config = { customerEligibility: 'everyone' as const };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customerEligibility).toBe('everyone');
    }
  });

  it('accepts all customerEligibility values', () => {
    const eligibilities = ['everyone', 'logged_in', 'segment'] as const;

    eligibilities.forEach(eligibility => {
      const config = { customerEligibility: eligibility };
      const result = DiscountConfigSchema.safeParse(config);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerEligibility).toBe(eligibility);
      }
    });
  });
});

describe('DiscountConfigSchema - Combining Rules', () => {
  it('accepts combineWith configuration', () => {
    const config = {
      combineWith: {
        orderDiscounts: true,
        productDiscounts: false,
        shippingDiscounts: true,
      },
    };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.combineWith?.orderDiscounts).toBe(true);
      expect(result.data.combineWith?.productDiscounts).toBe(false);
      expect(result.data.combineWith?.shippingDiscounts).toBe(true);
    }
  });

  it('accepts partial combineWith configuration', () => {
    const config = {
      combineWith: {
        orderDiscounts: true,
      },
    };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
  });
});

describe('DiscountConfigSchema - Metadata', () => {
  it('accepts prefix', () => {
    const config = { prefix: 'CART' };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prefix).toBe('CART');
    }
  });

  it('accepts description', () => {
    const config = { description: 'Cart abandonment discount' };
    const result = DiscountConfigSchema.safeParse(config);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Cart abandonment discount');
    }
  });
});
