/**
 * Unit Tests for Cart Abandonment Behavior & Accessibility Options
 * 
 * Tests behavior settings (close buttons, auto-close) and accessibility features
 */

import { describe, it, expect } from 'vitest';

interface BehaviorConfig {
  id: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  size: 'small' | 'medium' | 'large';
  
  previewMode?: boolean;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  autoCloseDelay?: number;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  campaignId?: string;
  challengeToken?: string;
}

function createConfig(overrides: Partial<BehaviorConfig> = {}): BehaviorConfig {
  return {
    id: 'test',
    backgroundColor: '#fff',
    textColor: '#000',
    buttonColor: '#000',
    buttonTextColor: '#fff',
    position: 'center',
    size: 'medium',
    ...overrides,
  };
}

describe('Cart Abandonment Behavior - Preview Mode', () => {
  it('accepts previewMode as true', () => {
    const config = createConfig({
      previewMode: true,
    });

    expect(config.previewMode).toBe(true);
  });

  it('accepts previewMode as false', () => {
    const config = createConfig({
      previewMode: false,
    });

    expect(config.previewMode).toBe(false);
  });

  it('defaults to undefined when not specified', () => {
    const config = createConfig();
    expect(config.previewMode).toBeUndefined();
  });
});

describe('Cart Abandonment Behavior - Close Button', () => {
  it('accepts showCloseButton as true', () => {
    const config = createConfig({
      showCloseButton: true,
    });

    expect(config.showCloseButton).toBe(true);
  });

  it('accepts showCloseButton as false', () => {
    const config = createConfig({
      showCloseButton: false,
    });

    expect(config.showCloseButton).toBe(false);
  });
});

describe('Cart Abandonment Behavior - Overlay Click', () => {
  it('accepts closeOnOverlayClick as true', () => {
    const config = createConfig({
      closeOnOverlayClick: true,
    });

    expect(config.closeOnOverlayClick).toBe(true);
  });

  it('accepts closeOnOverlayClick as false', () => {
    const config = createConfig({
      closeOnOverlayClick: false,
    });

    expect(config.closeOnOverlayClick).toBe(false);
  });
});

describe('Cart Abandonment Behavior - Escape Key', () => {
  it('accepts closeOnEscape as true', () => {
    const config = createConfig({
      closeOnEscape: true,
    });

    expect(config.closeOnEscape).toBe(true);
  });

  it('accepts closeOnEscape as false', () => {
    const config = createConfig({
      closeOnEscape: false,
    });

    expect(config.closeOnEscape).toBe(false);
  });
});

describe('Cart Abandonment Behavior - Auto Close', () => {
  it('accepts autoCloseDelay in milliseconds', () => {
    const config = createConfig({
      autoCloseDelay: 5000,
    });

    expect(config.autoCloseDelay).toBe(5000);
  });

  it('accepts various autoCloseDelay values', () => {
    const delays = [1000, 3000, 5000, 10000, 30000];

    delays.forEach(delay => {
      const config = createConfig({ autoCloseDelay: delay });
      expect(config.autoCloseDelay).toBe(delay);
    });
  });

  it('accepts zero as autoCloseDelay (no auto-close)', () => {
    const config = createConfig({
      autoCloseDelay: 0,
    });

    expect(config.autoCloseDelay).toBe(0);
  });
});

describe('Cart Abandonment Behavior - Complete Behavior Configuration', () => {
  it('accepts all behavior options together', () => {
    const config = createConfig({
      previewMode: false,
      showCloseButton: true,
      closeOnOverlayClick: true,
      closeOnEscape: true,
      autoCloseDelay: 5000,
    });

    expect(config.previewMode).toBe(false);
    expect(config.showCloseButton).toBe(true);
    expect(config.closeOnOverlayClick).toBe(true);
    expect(config.closeOnEscape).toBe(true);
    expect(config.autoCloseDelay).toBe(5000);
  });

  it('accepts restrictive behavior (no close options)', () => {
    const config = createConfig({
      showCloseButton: false,
      closeOnOverlayClick: false,
      closeOnEscape: false,
    });

    expect(config.showCloseButton).toBe(false);
    expect(config.closeOnOverlayClick).toBe(false);
    expect(config.closeOnEscape).toBe(false);
  });

  it('accepts permissive behavior (all close options)', () => {
    const config = createConfig({
      showCloseButton: true,
      closeOnOverlayClick: true,
      closeOnEscape: true,
    });

    expect(config.showCloseButton).toBe(true);
    expect(config.closeOnOverlayClick).toBe(true);
    expect(config.closeOnEscape).toBe(true);
  });
});

describe('Cart Abandonment Accessibility - ARIA Labels', () => {
  it('accepts ariaLabel', () => {
    const config = createConfig({
      ariaLabel: 'Cart abandonment popup',
    });

    expect(config.ariaLabel).toBe('Cart abandonment popup');
  });

  it('accepts various ariaLabel formats', () => {
    const labels = [
      'Complete your order popup',
      'Shopping cart reminder',
      'Checkout notification',
      'Cart recovery dialog',
    ];

    labels.forEach(label => {
      const config = createConfig({ ariaLabel: label });
      expect(config.ariaLabel).toBe(label);
    });
  });

  it('accepts ariaDescribedBy', () => {
    const config = createConfig({
      ariaDescribedBy: 'cart-description',
    });

    expect(config.ariaDescribedBy).toBe('cart-description');
  });

  it('accepts various ariaDescribedBy formats', () => {
    const describedBy = [
      'popup-description',
      'cart-details',
      'urgency-message',
      'discount-info',
    ];

    describedBy.forEach(id => {
      const config = createConfig({ ariaDescribedBy: id });
      expect(config.ariaDescribedBy).toBe(id);
    });
  });

  it('accepts both ariaLabel and ariaDescribedBy together', () => {
    const config = createConfig({
      ariaLabel: 'Cart abandonment popup',
      ariaDescribedBy: 'cart-description',
    });

    expect(config.ariaLabel).toBe('Cart abandonment popup');
    expect(config.ariaDescribedBy).toBe('cart-description');
  });
});

describe('Cart Abandonment - Campaign & Challenge Tokens', () => {
  it('accepts campaignId', () => {
    const config = createConfig({
      campaignId: 'campaign-123',
    });

    expect(config.campaignId).toBe('campaign-123');
  });

  it('accepts challengeToken', () => {
    const config = createConfig({
      challengeToken: 'token-abc-xyz',
    });

    expect(config.challengeToken).toBe('token-abc-xyz');
  });

  it('accepts both campaignId and challengeToken', () => {
    const config = createConfig({
      campaignId: 'campaign-456',
      challengeToken: 'token-def-uvw',
    });

    expect(config.campaignId).toBe('campaign-456');
    expect(config.challengeToken).toBe('token-def-uvw');
  });
});

describe('Cart Abandonment - Complete Configuration', () => {
  it('accepts all behavior and accessibility options together', () => {
    const config = createConfig({
      campaignId: 'campaign-789',
      challengeToken: 'token-ghi-rst',
      previewMode: false,
      showCloseButton: true,
      closeOnOverlayClick: true,
      closeOnEscape: true,
      autoCloseDelay: 10000,
      ariaLabel: 'Complete your order',
      ariaDescribedBy: 'cart-urgency-message',
    });

    expect(config.campaignId).toBe('campaign-789');
    expect(config.challengeToken).toBe('token-ghi-rst');
    expect(config.previewMode).toBe(false);
    expect(config.showCloseButton).toBe(true);
    expect(config.closeOnOverlayClick).toBe(true);
    expect(config.closeOnEscape).toBe(true);
    expect(config.autoCloseDelay).toBe(10000);
    expect(config.ariaLabel).toBe('Complete your order');
    expect(config.ariaDescribedBy).toBe('cart-urgency-message');
  });
});

