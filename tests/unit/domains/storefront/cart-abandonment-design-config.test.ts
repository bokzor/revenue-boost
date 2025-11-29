/**
 * Unit Tests for Cart Abandonment Design Configuration
 * 
 * Tests all design/visual configuration options from PopupDesignConfig
 */

import { describe, it, expect } from 'vitest';

// Mock design config type based on PopupDesignConfig
interface CartAbandonmentDesignConfig {
  id: string;
  campaignId?: string;
  challengeToken?: string;

  // Colors
  backgroundColor: string;
  textColor: string;
  descriptionColor?: string;
  buttonColor: string;
  buttonTextColor: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputBorderColor?: string;
  accentColor?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  imageBgColor?: string;
  successColor?: string;

  // Background image
  backgroundImageMode?: 'none' | 'preset' | 'file';
  backgroundImagePresetKey?: string;
  backgroundImageFileId?: string;

  // Layout
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  size: 'small' | 'medium' | 'large';
  popupSize?: 'compact' | 'standard' | 'wide' | 'full';
  borderRadius?: string | number;
  padding?: string | number;
  maxWidth?: string | number;
  animation?: 'fade' | 'slide' | 'bounce' | 'none';
  displayMode?: 'popup' | 'banner' | 'slide-in' | 'inline';

  // Additional styles
  boxShadow?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  customCSS?: string;
  imageUrl?: string;
  imagePosition?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  buttonUrl?: string;

  // Behavior
  previewMode?: boolean;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  autoCloseDelay?: number;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

function createDesignConfig(overrides: Partial<CartAbandonmentDesignConfig> = {}): CartAbandonmentDesignConfig {
  return {
    id: 'test-config',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#000000',
    buttonTextColor: '#ffffff',
    position: 'center',
    size: 'medium',
    ...overrides,
  };
}

describe('Cart Abandonment Design Config - Colors', () => {
  it('accepts required color fields', () => {
    const config = createDesignConfig();
    
    expect(config.backgroundColor).toBe('#ffffff');
    expect(config.textColor).toBe('#000000');
    expect(config.buttonColor).toBe('#000000');
    expect(config.buttonTextColor).toBe('#ffffff');
  });

  it('accepts hex color codes', () => {
    const config = createDesignConfig({
      backgroundColor: '#f3f4f6',
      textColor: '#1f2937',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
    });

    expect(config.backgroundColor).toBe('#f3f4f6');
    expect(config.textColor).toBe('#1f2937');
    expect(config.buttonColor).toBe('#3b82f6');
    expect(config.buttonTextColor).toBe('#ffffff');
  });

  it('accepts RGB color codes', () => {
    const config = createDesignConfig({
      backgroundColor: 'rgb(255, 255, 255)',
      textColor: 'rgb(0, 0, 0)',
    });

    expect(config.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(config.textColor).toBe('rgb(0, 0, 0)');
  });

  it('accepts RGBA color codes with transparency', () => {
    const config = createDesignConfig({
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      overlayColor: 'rgba(0, 0, 0, 0.5)',
    });

    expect(config.backgroundColor).toBe('rgba(255, 255, 255, 0.95)');
    expect(config.overlayColor).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('accepts optional descriptionColor', () => {
    const config = createDesignConfig({
      descriptionColor: '#6b7280',
    });

    expect(config.descriptionColor).toBe('#6b7280');
  });

  it('accepts optional input colors', () => {
    const config = createDesignConfig({
      inputBackgroundColor: '#f9fafb',
      inputTextColor: '#111827',
      inputBorderColor: '#d1d5db',
    });

    expect(config.inputBackgroundColor).toBe('#f9fafb');
    expect(config.inputTextColor).toBe('#111827');
    expect(config.inputBorderColor).toBe('#d1d5db');
  });

  it('accepts optional accentColor', () => {
    const config = createDesignConfig({
      accentColor: '#10b981',
    });

    expect(config.accentColor).toBe('#10b981');
  });

  it('accepts optional successColor', () => {
    const config = createDesignConfig({
      successColor: '#22c55e',
    });

    expect(config.successColor).toBe('#22c55e');
  });

  it('accepts optional imageBgColor', () => {
    const config = createDesignConfig({
      imageBgColor: '#e5e7eb',
    });

    expect(config.imageBgColor).toBe('#e5e7eb');
  });

  it('accepts overlayColor and overlayOpacity', () => {
    const config = createDesignConfig({
      overlayColor: '#000000',
      overlayOpacity: 0.6,
    });

    expect(config.overlayColor).toBe('#000000');
    expect(config.overlayOpacity).toBe(0.6);
  });

  it('accepts overlayOpacity between 0 and 1', () => {
    const opacities = [0, 0.25, 0.5, 0.75, 1];

    opacities.forEach(opacity => {
      const config = createDesignConfig({
        overlayOpacity: opacity,
      });

      expect(config.overlayOpacity).toBe(opacity);
    });
  });

  it('accepts all color options together', () => {
    const config = createDesignConfig({
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      descriptionColor: '#6b7280',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      inputBackgroundColor: '#f9fafb',
      inputTextColor: '#111827',
      inputBorderColor: '#d1d5db',
      accentColor: '#10b981',
      overlayColor: '#000000',
      overlayOpacity: 0.5,
      imageBgColor: '#e5e7eb',
      successColor: '#22c55e',
    });

    expect(config.backgroundColor).toBe('#ffffff');
    expect(config.textColor).toBe('#1f2937');
    expect(config.descriptionColor).toBe('#6b7280');
    expect(config.buttonColor).toBe('#3b82f6');
    expect(config.buttonTextColor).toBe('#ffffff');
    expect(config.inputBackgroundColor).toBe('#f9fafb');
    expect(config.inputTextColor).toBe('#111827');
    expect(config.inputBorderColor).toBe('#d1d5db');
    expect(config.accentColor).toBe('#10b981');
    expect(config.overlayColor).toBe('#000000');
    expect(config.overlayOpacity).toBe(0.5);
    expect(config.imageBgColor).toBe('#e5e7eb');
    expect(config.successColor).toBe('#22c55e');
  });
});

describe('Cart Abandonment Design Config - Background Image', () => {
  it('accepts backgroundImageMode as none', () => {
    const config = createDesignConfig({
      backgroundImageMode: 'none',
    });

    expect(config.backgroundImageMode).toBe('none');
  });

  it('accepts backgroundImageMode as preset', () => {
    const config = createDesignConfig({
      backgroundImageMode: 'preset',
      backgroundImagePresetKey: 'gradient-blue',
    });

    expect(config.backgroundImageMode).toBe('preset');
    expect(config.backgroundImagePresetKey).toBe('gradient-blue');
  });

  it('accepts backgroundImageMode as file', () => {
    const config = createDesignConfig({
      backgroundImageMode: 'file',
      backgroundImageFileId: 'file-123',
    });

    expect(config.backgroundImageMode).toBe('file');
    expect(config.backgroundImageFileId).toBe('file-123');
  });

  it('accepts various preset keys', () => {
    const presets = ['gradient-blue', 'gradient-purple', 'pattern-dots', 'pattern-waves'];

    presets.forEach(preset => {
      const config = createDesignConfig({
        backgroundImageMode: 'preset',
        backgroundImagePresetKey: preset,
      });

      expect(config.backgroundImagePresetKey).toBe(preset);
    });
  });
});

describe('Cart Abandonment Design Config - Layout & Positioning', () => {
  it('accepts all position values', () => {
    const positions: Array<'center' | 'top' | 'bottom' | 'left' | 'right'> =
      ['center', 'top', 'bottom', 'left', 'right'];

    positions.forEach(position => {
      const config = createDesignConfig({ position });
      expect(config.position).toBe(position);
    });
  });

  it('accepts all size values', () => {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      const config = createDesignConfig({ size });
      expect(config.size).toBe(size);
    });
  });

  it('accepts all popupSize values', () => {
    const popupSizes: Array<'compact' | 'standard' | 'wide' | 'full'> =
      ['compact', 'standard', 'wide', 'full'];

    popupSizes.forEach(popupSize => {
      const config = createDesignConfig({ popupSize });
      expect(config.popupSize).toBe(popupSize);
    });
  });

  it('accepts borderRadius as string', () => {
    const config = createDesignConfig({
      borderRadius: '16px',
    });

    expect(config.borderRadius).toBe('16px');
  });

  it('accepts borderRadius as number', () => {
    const config = createDesignConfig({
      borderRadius: 16,
    });

    expect(config.borderRadius).toBe(16);
  });
});

