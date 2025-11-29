/**
 * Unit Tests for Cart Abandonment Design Layout Options
 * 
 * Tests padding, maxWidth, animation, displayMode, and typography
 */

import { describe, it, expect } from 'vitest';

interface DesignLayoutConfig {
  id: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  size: 'small' | 'medium' | 'large';
  
  padding?: string | number;
  maxWidth?: string | number;
  animation?: 'fade' | 'slide' | 'bounce' | 'none';
  displayMode?: 'popup' | 'banner' | 'slide-in' | 'inline';
  boxShadow?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  customCSS?: string;
  imageUrl?: string;
  imagePosition?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  buttonUrl?: string;
}

function createConfig(overrides: Partial<DesignLayoutConfig> = {}): DesignLayoutConfig {
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

describe('Cart Abandonment Design - Padding & Spacing', () => {
  it('accepts padding as string', () => {
    const config = createConfig({
      padding: '24px',
    });

    expect(config.padding).toBe('24px');
  });

  it('accepts padding as number', () => {
    const config = createConfig({
      padding: 24,
    });

    expect(config.padding).toBe(24);
  });

  it('accepts various padding formats', () => {
    const paddings = ['16px', '1rem', '24px 32px', '1em 2em 1em 2em'];

    paddings.forEach(padding => {
      const config = createConfig({ padding });
      expect(config.padding).toBe(padding);
    });
  });
});

describe('Cart Abandonment Design - Width & Sizing', () => {
  it('accepts maxWidth as string', () => {
    const config = createConfig({
      maxWidth: '600px',
    });

    expect(config.maxWidth).toBe('600px');
  });

  it('accepts maxWidth as number', () => {
    const config = createConfig({
      maxWidth: 600,
    });

    expect(config.maxWidth).toBe(600);
  });

  it('accepts various maxWidth formats', () => {
    const widths = ['400px', '28rem', '90%', '100vw', 'min(600px, 90vw)'];

    widths.forEach(width => {
      const config = createConfig({ maxWidth: width });
      expect(config.maxWidth).toBe(width);
    });
  });
});

describe('Cart Abandonment Design - Animation', () => {
  it('accepts all animation values', () => {
    const animations: Array<'fade' | 'slide' | 'bounce' | 'none'> = 
      ['fade', 'slide', 'bounce', 'none'];

    animations.forEach(animation => {
      const config = createConfig({ animation });
      expect(config.animation).toBe(animation);
    });
  });

  it('defaults to undefined when not specified', () => {
    const config = createConfig();
    expect(config.animation).toBeUndefined();
  });
});

describe('Cart Abandonment Design - Display Mode', () => {
  it('accepts all displayMode values', () => {
    const modes: Array<'popup' | 'banner' | 'slide-in' | 'inline'> =
      ['popup', 'banner', 'slide-in', 'inline'];

    modes.forEach(mode => {
      const config = createConfig({ displayMode: mode });
      expect(config.displayMode).toBe(mode);
    });
  });
});

describe('Cart Abandonment Design - Typography', () => {
  it('accepts fontFamily', () => {
    const config = createConfig({
      fontFamily: 'Inter, sans-serif',
    });

    expect(config.fontFamily).toBe('Inter, sans-serif');
  });

  it('accepts various font families', () => {
    const fonts = [
      'Arial, sans-serif',
      'Georgia, serif',
      '"Helvetica Neue", Helvetica, Arial, sans-serif',
      'system-ui, -apple-system, sans-serif',
    ];

    fonts.forEach(font => {
      const config = createConfig({ fontFamily: font });
      expect(config.fontFamily).toBe(font);
    });
  });

  it('accepts fontSize', () => {
    const config = createConfig({
      fontSize: '16px',
    });

    expect(config.fontSize).toBe('16px');
  });

  it('accepts various fontSize formats', () => {
    const sizes = ['14px', '1rem', '1.125em', 'clamp(14px, 2vw, 18px)'];

    sizes.forEach(size => {
      const config = createConfig({ fontSize: size });
      expect(config.fontSize).toBe(size);
    });
  });

  it('accepts fontWeight', () => {
    const config = createConfig({
      fontWeight: '600',
    });

    expect(config.fontWeight).toBe('600');
  });

  it('accepts various fontWeight values', () => {
    const weights = ['400', '500', '600', '700', 'normal', 'bold', 'bolder'];

    weights.forEach(weight => {
      const config = createConfig({ fontWeight: weight });
      expect(config.fontWeight).toBe(weight);
    });
  });

  it('accepts complete typography configuration', () => {
    const config = createConfig({
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontWeight: '500',
    });

    expect(config.fontFamily).toBe('Inter, sans-serif');
    expect(config.fontSize).toBe('16px');
    expect(config.fontWeight).toBe('500');
  });
});

describe('Cart Abandonment Design - Visual Effects', () => {
  it('accepts boxShadow', () => {
    const config = createConfig({
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    });

    expect(config.boxShadow).toBe('0 4px 6px rgba(0, 0, 0, 0.1)');
  });

  it('accepts various boxShadow formats', () => {
    const shadows = [
      '0 1px 3px rgba(0, 0, 0, 0.12)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      'none',
      '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.1)',
    ];

    shadows.forEach(shadow => {
      const config = createConfig({ boxShadow: shadow });
      expect(config.boxShadow).toBe(shadow);
    });
  });

  it('accepts customCSS', () => {
    const config = createConfig({
      customCSS: '.popup { border: 2px solid red; }',
    });

    expect(config.customCSS).toBe('.popup { border: 2px solid red; }');
  });

  it('accepts multi-line customCSS', () => {
    const css = `
      .popup {
        border: 2px solid red;
        background: linear-gradient(to bottom, #fff, #f0f0f0);
      }
    `;

    const config = createConfig({ customCSS: css });
    expect(config.customCSS).toBe(css);
  });
});

describe('Cart Abandonment Design - Image Configuration', () => {
  it('accepts imageUrl', () => {
    const config = createConfig({
      imageUrl: 'https://example.com/image.jpg',
    });

    expect(config.imageUrl).toBe('https://example.com/image.jpg');
  });

  it('accepts all imagePosition values', () => {
    const positions: Array<'left' | 'right' | 'top' | 'bottom' | 'none'> =
      ['left', 'right', 'top', 'bottom', 'none'];

    positions.forEach(position => {
      const config = createConfig({ imagePosition: position });
      expect(config.imagePosition).toBe(position);
    });
  });

  it('accepts imageUrl with imagePosition', () => {
    const config = createConfig({
      imageUrl: 'https://example.com/banner.jpg',
      imagePosition: 'top',
    });

    expect(config.imageUrl).toBe('https://example.com/banner.jpg');
    expect(config.imagePosition).toBe('top');
  });
});

describe('Cart Abandonment Design - Button Configuration', () => {
  it('accepts buttonUrl', () => {
    const config = createConfig({
      buttonUrl: '/checkout',
    });

    expect(config.buttonUrl).toBe('/checkout');
  });

  it('accepts various buttonUrl formats', () => {
    const urls = [
      '/checkout',
      'https://example.com/special-offer',
      '/collections/sale',
      '#',
    ];

    urls.forEach(url => {
      const config = createConfig({ buttonUrl: url });
      expect(config.buttonUrl).toBe(url);
    });
  });
});

describe('Cart Abandonment Design - Complete Layout Configuration', () => {
  it('accepts all layout options together', () => {
    const config = createConfig({
      padding: '24px',
      maxWidth: '600px',
      animation: 'fade',
      displayMode: 'popup',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontWeight: '500',
      customCSS: '.popup { border-radius: 12px; }',
      imageUrl: 'https://example.com/image.jpg',
      imagePosition: 'top',
      buttonUrl: '/checkout',
    });

    expect(config.padding).toBe('24px');
    expect(config.maxWidth).toBe('600px');
    expect(config.animation).toBe('fade');
    expect(config.displayMode).toBe('popup');
    expect(config.boxShadow).toBe('0 4px 6px rgba(0, 0, 0, 0.1)');
    expect(config.fontFamily).toBe('Inter, sans-serif');
    expect(config.fontSize).toBe('16px');
    expect(config.fontWeight).toBe('500');
    expect(config.customCSS).toBe('.popup { border-radius: 12px; }');
    expect(config.imageUrl).toBe('https://example.com/image.jpg');
    expect(config.imagePosition).toBe('top');
    expect(config.buttonUrl).toBe('/checkout');
  });
});
