/**
 * Utility Functions for Storefront Popup Components
 *
 * Shared helper functions used across popup components
 */

import type { PopupSize, PopupPosition, PopupAnimation } from './types';

/**
 * Get size dimensions based on size prop
 * In preview mode, use smaller percentages to show relative size on screen
 */
export function getSizeDimensions(size: PopupSize, previewMode?: boolean): { width: string; maxWidth: string } {
  // Production mode - use full responsive widths
  switch (size) {
    case 'small':
      return { width: '90%', maxWidth: '400px' };
    case 'medium':
      return { width: '90%', maxWidth: '600px' };
    case 'large':
      return { width: '90%', maxWidth: '900px' };
    default:
      return { width: '90%', maxWidth: '600px' };
  }
}

/**
 * Get position styles based on position prop
 */
export function getPositionStyles(position: PopupPosition): React.CSSProperties {
  const baseStyles: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10000,
  };

  switch (position) {
    case 'center':
      return {
        ...baseStyles,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    case 'top':
      return {
        ...baseStyles,
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      };
    case 'bottom':
      return {
        ...baseStyles,
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
      };
    case 'left':
      return {
        ...baseStyles,
        top: '50%',
        left: '20px',
        transform: 'translateY(-50%)',
      };
    case 'right':
      return {
        ...baseStyles,
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
      };
    default:
      return {
        ...baseStyles,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
  }
}

/**
 * Get animation class name based on animation type
 */
export function getAnimationClass(animation: PopupAnimation, isExiting: boolean = false): string {
  if (animation === 'none') return '';

  const prefix = isExiting ? 'popup-exit' : 'popup-enter';
  return `${prefix}-${animation}`;
}

/**
 * Get animation keyframes CSS
 */
export function getAnimationKeyframes(): string {
  return `
    @keyframes popup-enter-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes popup-exit-fade {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    @keyframes popup-enter-slide {
      from {
        opacity: 0;
        transform: translate(-50%, -60%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }

    @keyframes popup-exit-slide {
      from {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
      to {
        opacity: 0;
        transform: translate(-50%, -60%);
      }
    }

    @keyframes popup-enter-bounce {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.3);
      }
      50% {
        transform: translate(-50%, -50%) scale(1.05);
      }
      70% {
        transform: translate(-50%, -50%) scale(0.9);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    @keyframes popup-exit-bounce {
      from {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      to {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.3);
      }
    }

    .popup-enter-fade { animation: popup-enter-fade 0.3s ease-out; }
    .popup-exit-fade { animation: popup-exit-fade 0.3s ease-in; }
    .popup-enter-slide { animation: popup-enter-slide 0.3s ease-out; }
    .popup-exit-slide { animation: popup-exit-slide 0.3s ease-in; }
    .popup-enter-bounce { animation: popup-enter-bounce 0.5s ease-out; }
    .popup-exit-bounce { animation: popup-exit-bounce 0.3s ease-in; }

    @media (prefers-reduced-motion: reduce) {
      .popup-enter-fade,
      .popup-enter-slide,
      .popup-enter-bounce,
      .popup-exit-fade,
      .popup-exit-slide,
      .popup-exit-bounce {
        animation: none !important;
      }
    }
  `;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format currency
 *
 * Accepts either an ISO 4217 currency code ("USD", "EUR") or a common
 * currency symbol ("$", "€", "£"). Falls back gracefully if an invalid
 * value is provided so we never throw RangeError from Intl.NumberFormat.
 */
export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Normalize currency input
  const raw = (currency || '').trim();
  const upper = raw.toUpperCase();

  // Map common symbols to ISO codes
  const symbolToCode: Record<string, string> = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    'C$': 'CAD',
    'A$': 'AUD',
  };

  let code: string = 'USD';

  if (/^[A-Z]{3}$/.test(upper)) {
    // Looks like a valid 3-letter code; use as-is
    code = upper;
  } else if (raw in symbolToCode) {
    // Map known symbols to codes
    code = symbolToCode[raw];
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
    }).format(numAmount);
  } catch {
    // Final fallback: simple prefix formatting that will never throw
    const sign = numAmount < 0 ? '-' : '';
    const absAmount = Math.abs(numAmount || 0);
    const symbol = raw || '$';
    return `${sign}${symbol}${absAmount.toFixed(2)}`;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Calculate time remaining from a date
 */
export function calculateTimeRemaining(endDate: Date | string): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();
  const total = end.getTime() - now.getTime();

  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

/**
 * Format time remaining as string
 */
export function formatTimeRemaining(time: ReturnType<typeof calculateTimeRemaining>): string {
  if (time.total <= 0) return '00:00:00';

  if (time.days > 0) {
    return `${time.days}d ${time.hours}h ${time.minutes}m`;
  }

  const hours = String(time.hours).padStart(2, '0');
  const minutes = String(time.minutes).padStart(2, '0');
  const seconds = String(time.seconds).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Check if device prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

